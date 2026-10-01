import { Types } from 'mongoose';
import { QuizAttempt } from '../models/QuizAttempt';
import { Subject } from '../models/Subject';
import { THRESHOLDS } from '../types';

export interface TopicStat {
  subject: string;
  subjectId: string;
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

/** Aggregates topic-level accuracy across all of a user's quiz attempts. */
export async function computeTopicStats(userId: Types.ObjectId, subjectId?: Types.ObjectId): Promise<TopicStat[]> {
  const match: Record<string, unknown> = { user: userId };
  if (subjectId) match.subject = subjectId;

  const rows = await QuizAttempt.aggregate([
    { $match: match },
    { $unwind: '$topicPerformance' },
    {
      $group: {
        _id: { subject: '$subject', topic: '$topicPerformance.topic' },
        correct: { $sum: '$topicPerformance.correct' },
        total: { $sum: '$topicPerformance.total' },
      },
    },
  ]);

  const subjects = await Subject.find({ user: userId }).lean();
  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]));

  return rows
    .filter((r) => r.total >= THRESHOLDS.MIN_ATTEMPTS_FOR_TOPIC_STATS)
    .map((r) => ({
      subject: subjectMap.get(r._id.subject.toString()) ?? 'Unknown',
      subjectId: r._id.subject.toString(),
      topic: r._id.topic,
      correct: r.correct,
      total: r.total,
      percentage: Math.round((r.correct / r.total) * 100),
    }))
    .sort((a, b) => a.percentage - b.percentage);
}

export function splitWeakStrong(stats: TopicStat[]) {
  const weak = stats.filter((s) => s.percentage < THRESHOLDS.WEAK_TOPIC_MAX_PERCENT);
  const strong = stats.filter((s) => s.percentage >= THRESHOLDS.STRONG_TOPIC_MIN_PERCENT);
  return { weak, strong };
}

/** Compares a topic's most recent attempt window vs. an earlier window to detect improvement. */
export async function computeImprovements(userId: Types.ObjectId) {
  const attempts = await QuizAttempt.find({ user: userId }).sort({ submittedAt: 1 }).lean();
  const byTopic = new Map<string, { subject: string; percentages: number[] }[]>();

  for (const attempt of attempts) {
    for (const tp of attempt.topicPerformance) {
      const key = tp.topic;
      const list = byTopic.get(key) ?? [];
      list.push({ subject: attempt.subject.toString(), percentages: [tp.percentage] });
      byTopic.set(key, list);
    }
  }

  const subjects = await Subject.find({ user: userId }).lean();
  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]));

  const improvements: { subject: string; topic: string; deltaPercent: number }[] = [];
  for (const [topic, entries] of byTopic.entries()) {
    if (entries.length < 2) continue;
    const half = Math.floor(entries.length / 2);
    const early = entries.slice(0, half).map((e) => e.percentages[0]);
    const recent = entries.slice(half).map((e) => e.percentages[0]);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const delta = Math.round(avg(recent) - avg(early));
    if (Math.abs(delta) >= 5) {
      improvements.push({
        subject: subjectMap.get(entries[0].subject) ?? 'Unknown',
        topic,
        deltaPercent: delta,
      });
    }
  }
  return improvements;
}

/** Finds topics where the last N attempts were all below the weak threshold. */
export async function computeStrugglingStreaks(userId: Types.ObjectId, streakLength = 3) {
  const attempts = await QuizAttempt.find({ user: userId }).sort({ submittedAt: -1 }).lean();
  const byTopic = new Map<string, { subject: string; percentages: number[] }>();

  for (const attempt of attempts) {
    for (const tp of attempt.topicPerformance) {
      const entry = byTopic.get(tp.topic) ?? { subject: attempt.subject.toString(), percentages: [] };
      entry.percentages.push(tp.percentage);
      byTopic.set(tp.topic, entry);
    }
  }

  const subjects = await Subject.find({ user: userId }).lean();
  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s.name]));

  const streaks: { subject: string; topic: string; consecutiveLowScores: number }[] = [];
  for (const [topic, entry] of byTopic.entries()) {
    const recentN = entry.percentages.slice(0, streakLength);
    if (
      recentN.length === streakLength &&
      recentN.every((p) => p < THRESHOLDS.WEAK_TOPIC_MAX_PERCENT)
    ) {
      streaks.push({
        subject: subjectMap.get(entry.subject) ?? 'Unknown',
        topic,
        consecutiveLowScores: streakLength,
      });
    }
  }
  return streaks;
}
