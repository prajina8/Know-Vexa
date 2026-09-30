import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, MinusCircle, Clock, Trophy, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { QuizAttempt, Quiz } from '../types';
import { EmptyState } from '../components/Feedback';

interface ResultState {
  attempt: QuizAttempt;
  quiz: Pick<Quiz, 'title' | 'questions'>;
  weakTopics: { topic: string; percentage: number }[];
}

const COLORS = { correct: '#10b981', wrong: '#ef4444', skipped: '#94a3b8' };

export default function QuizResultPage() {
  const location = useLocation();
  const { quizId } = useParams<{ quizId: string }>();
  const state = location.state as { result?: ResultState } | null;

  if (!state?.result) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No result to show"
        description="Results are shown right after you submit a quiz."
        action={
          <Link to={`/app/quiz/${quizId}`} className="btn-primary">
            Take this quiz
          </Link>
        }
      />
    );
  }

  const { attempt, quiz, weakTopics } = state.result;
  const pieData = [
    { name: 'Correct', value: attempt.correctCount, color: COLORS.correct },
    { name: 'Wrong', value: attempt.wrongCount, color: COLORS.wrong },
    { name: 'Skipped', value: attempt.skippedCount, color: COLORS.skipped },
  ];

  const answersByQuestionId = new Map(
    (attempt as unknown as { answers: { questionId: string; givenAnswer?: string; isCorrect: boolean; isSkipped: boolean }[] }).answers.map(
      (a) => [a.questionId, a],
    ),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card flex flex-col items-center gap-2 p-8 text-center">
        <Trophy className="text-amber-500" size={32} />
        <h1 className="font-display text-3xl font-bold">{attempt.percentage}%</h1>
        <p className="text-terracotta-500 dark:text-terracotta-400">
          {attempt.correctCount} of {attempt.totalQuestions} correct on "{quiz.title}"
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display mb-3 font-semibold">Breakdown</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <h2 className="font-display font-semibold">Summary</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Correct</span>
            <span className="font-medium">{attempt.correctCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><XCircle size={16} className="text-red-500" /> Wrong</span>
            <span className="font-medium">{attempt.wrongCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><MinusCircle size={16} className="text-terracotta-400" /> Skipped</span>
            <span className="font-medium">{attempt.skippedCount}</span>
          </div>
          <div className="flex items-center justify-between border-t border-terracotta-100 pt-3 text-sm dark:border-terracotta-800">
            <span className="flex items-center gap-2"><Clock size={16} className="text-terracotta-500" /> Time taken</span>
            <span className="font-medium">{Math.floor(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display mb-3 font-semibold">Topic performance</h2>
        <div className="space-y-3">
          {attempt.topicPerformance.map((t) => (
            <div key={t.topic}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{t.topic}</span>
                <span className={t.percentage < 60 ? 'text-red-500' : 'text-emerald-500'}>{t.percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-terracotta-100 dark:bg-terracotta-800">
                <div
                  className={`h-full rounded-full ${t.percentage < 60 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${t.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {weakTopics.length > 0 && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Consider reviewing: {weakTopics.map((t) => t.topic).join(', ')}
          </p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display mb-3 font-semibold">Question review</h2>
        <div className="space-y-4">
          {quiz.questions.map((q, i) => {
            const a = answersByQuestionId.get(q._id);
            return (
              <div key={q._id} className="border-b border-terracotta-100 pb-4 last:border-0 last:pb-0 dark:border-terracotta-800">
                <div className="flex items-start gap-2">
                  {a?.isCorrect ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : a?.isSkipped ? (
                    <MinusCircle size={16} className="mt-0.5 shrink-0 text-terracotta-400" />
                  ) : (
                    <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {i + 1}. {q.question}
                    </p>
                    <p className="mt-1 text-xs text-terracotta-500 dark:text-terracotta-400">
                      Your answer: {a?.givenAnswer || <em>skipped</em>}
                      {!a?.isCorrect && <> · Correct answer: <span className="font-medium">{q.correctAnswer}</span></>}
                    </p>
                    {!a?.isCorrect && q.explanation && (
                      <p className="mt-1.5 rounded-lg bg-terracotta-50 p-2 text-xs text-terracotta-600 dark:bg-terracotta-800 dark:text-terracotta-300">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
