import { useQuery, useMutation } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Sparkles, TrendingUp } from 'lucide-react';
import { progressService, aiService } from '../services';
import { CardSkeleton, ErrorState, EmptyState } from '../components/Feedback';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';

interface OverallProgress {
  trend: { date: string; percentage: number }[];
  subjectComparison: { subject: string; averageScore: number; quizzesTaken: number }[];
  accuracyBreakdown: { correct: number; wrong: number; skipped: number };
  weakTopics: { subject: string; topic: string; percentage: number }[];
  strongTopics: { subject: string; topic: string; percentage: number }[];
}

const PIE_COLORS = ['#10b981', '#ef4444', '#94a3b8'];

export default function ProgressPage() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<string[] | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['overallProgress'],
    queryFn: () => progressService.overall() as Promise<OverallProgress>,
  });

  const recMutation = useMutation({
    mutationFn: aiService.analyzePerformance,
    onSuccess: (r) => setRecommendations(r.recommendations),
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }
  if (isError) return <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />;
  if (!data) return null;

  const trendData = data.trend.map((t, i) => ({ name: `#${i + 1}`, percentage: t.percentage }));
  const pieData = [
    { name: 'Correct', value: data.accuracyBreakdown.correct },
    { name: 'Wrong', value: data.accuracyBreakdown.wrong },
    { name: 'Skipped', value: data.accuracyBreakdown.skipped },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Progress & Analytics</h1>
          <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">Your performance across every subject.</p>
        </div>
        <button onClick={() => recMutation.mutate()} disabled={recMutation.isPending} className="btn-primary">
          <Sparkles size={16} /> {recMutation.isPending ? 'Analyzing…' : 'AI Recommendations'}
        </button>
      </div>

      {recommendations && (
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-terracotta-600 dark:text-terracotta-400" />
            <h2 className="font-display font-semibold">Recommendations</h2>
          </div>
          <ul className="space-y-2">
            {recommendations.map((r, i) => (
              <li key={i} className="rounded-xl bg-terracotta-50 px-4 py-2.5 text-sm text-terracotta-800 dark:bg-terracotta-950 dark:text-terracotta-300">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display mb-3 font-semibold">Performance over time</h2>
          {trendData.length === 0 ? (
            <p className="py-10 text-center text-sm text-terracotta-500 dark:text-terracotta-400">Take a few quizzes to see your trend.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-terracotta-200 dark:stroke-terracotta-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Line type="monotone" dataKey="percentage" stroke="#C4775A" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display mb-3 font-semibold">Subject comparison</h2>
          {data.subjectComparison.length === 0 ? (
            <EmptyState title="No data yet" description="Take quizzes across subjects to compare." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectComparison}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-terracotta-200 dark:stroke-terracotta-800" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="averageScore" fill="#C4775A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="font-display mb-3 font-semibold">Answer accuracy</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {pieData.map((d, i) => (
                    <Cell key={d.name} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display mb-3 font-semibold">Topic mastery</h2>
          <div className="space-y-3">
            {[...data.weakTopics, ...data.strongTopics].length === 0 ? (
              <p className="text-sm text-terracotta-500 dark:text-terracotta-400">Not enough quiz data yet.</p>
            ) : (
              [...data.strongTopics, ...data.weakTopics]
                .sort((a, b) => b.percentage - a.percentage)
                .map((t) => (
                  <div key={t.topic}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>
                        {t.topic} <span className="text-xs text-terracotta-400">({t.subject})</span>
                      </span>
                      <span className={t.percentage < 60 ? 'text-red-500' : 'text-emerald-500'}>{t.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-terracotta-100 dark:bg-terracotta-800">
                      <div
                        className={`h-full rounded-full ${t.percentage < 60 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${t.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
