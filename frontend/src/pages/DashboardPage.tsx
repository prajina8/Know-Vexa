import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Upload,
  ListChecks,
  Layers,
  MessageSquare,
  CalendarClock,
  Clock,
  BookOpen,
  Target,
  Flame,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { progressService } from '../services';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton, ErrorState, EmptyState } from '../components/Feedback';
import { apiErrorMessage } from '../api/client';

const QUICK_ACTIONS = [
  { to: '/app/subjects', label: 'Add Subject', icon: Plus },
  { to: '/app/materials', label: 'Upload Material', icon: Upload },
  { to: '/app/quiz', label: 'Generate Quiz', icon: ListChecks },
  { to: '/app/flashcards', label: 'Study Flashcards', icon: Layers },
  { to: '/app/materials', label: 'Ask AI', icon: MessageSquare },
  { to: '/app/study-plan', label: 'View Study Plan', icon: CalendarClock },
];

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Clock; label: string; value: string; accent: string }) {
  return (
    <div className="card p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={18} />
      </div>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-sm text-terracotta-500 dark:text-terracotta-400">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: progressService.dashboard,
  });

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">
          Here's how your studying is going.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Clock}
              label="Total study time"
              value={`${Math.round(data.totalStudyMinutes / 60)}h ${data.totalStudyMinutes % 60}m`}
              accent="bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-950 dark:text-terracotta-400"
            />
            <StatCard
              icon={BookOpen}
              label="Materials uploaded"
              value={String(data.materialCount)}
              accent="bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-950 dark:text-terracotta-400"
            />
            <StatCard
              icon={ListChecks}
              label="Quizzes completed"
              value={String(data.quizzesCompleted)}
              accent="bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-950 dark:text-terracotta-400"
            />
            <StatCard
              icon={Target}
              label="Average score"
              value={`${data.averageScore}%`}
              accent="bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-950 dark:text-terracotta-400"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-display font-semibold">Subject progress</h2>
              {data.subjectProgress.length === 0 ? (
                <EmptyState
                  title="No subjects yet"
                  description="Create a subject to start tracking your progress."
                  action={
                    <Link to="/app/subjects" className="btn-primary">
                      <Plus size={16} /> Add subject
                    </Link>
                  }
                />
              ) : (
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.subjectProgress} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-terracotta-200 dark:stroke-terracotta-800" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="averageScore" fill="#C4775A" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Flame className="text-terracotta-500" size={18} />
                <h2 className="font-display font-semibold">Streak</h2>
              </div>
              <p className="mt-3 font-display text-3xl font-bold">{user?.currentStreak ?? 0} days</p>
              <p className="text-sm text-terracotta-500 dark:text-terracotta-400">Longest: {user?.longestStreak ?? 0} days</p>
              <div className="mt-4 border-t border-terracotta-100 pt-4 dark:border-terracotta-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-terracotta-500" size={18} />
                  <h3 className="font-display font-semibold">Level {user?.level ?? 1}</h3>
                </div>
                <p className="text-sm text-terracotta-500 dark:text-terracotta-400">{user?.xp ?? 0} XP earned</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500" size={18} />
                <h2 className="font-display font-semibold">Weak topics</h2>
              </div>
              {data.weakTopics.length === 0 ? (
                <p className="mt-3 text-sm text-terracotta-500 dark:text-terracotta-400">
                  No weak topics detected yet — keep taking quizzes.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.weakTopics.map((t) => (
                    <li key={t.topic} className="flex items-center justify-between text-sm">
                      <span>{t.topic}</span>
                      <span className="badge bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
                        {t.percentage}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Target className="text-terracotta-500" size={18} />
                <h2 className="font-display font-semibold">Recommended next</h2>
              </div>
              {data.recommendedTopics.length === 0 ? (
                <p className="mt-3 text-sm text-terracotta-500 dark:text-terracotta-400">
                  Nothing urgent — great job!
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.recommendedTopics.map((t) => (
                    <li key={t.topic} className="text-sm">
                      Review <span className="font-medium">{t.topic}</span> in {t.subject}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2">
                <CalendarClock className="text-terracotta-500" size={18} />
                <h2 className="font-display font-semibold">Upcoming tasks</h2>
              </div>
              {data.upcomingTasks.length === 0 ? (
                <p className="mt-3 text-sm text-terracotta-500 dark:text-terracotta-400">No plan yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.upcomingTasks.map((t) => (
                    <li key={t._id} className="text-sm">
                      {t.topic} · {t.durationMinutes} min
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/app/study-plan" className="mt-3 inline-block text-sm font-medium text-terracotta-600 hover:underline">
                View full plan →
              </Link>
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="font-display mb-3 font-semibold">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
            <Link key={label} to={to} className="card flex flex-col items-center gap-2 p-4 text-center hover:border-terracotta-300">
              <Icon size={20} className="text-terracotta-600 dark:text-terracotta-400" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
