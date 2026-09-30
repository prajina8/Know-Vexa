import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, ListChecks, Upload, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { subjectService } from '../services';
import { CardSkeleton, ErrorState, EmptyState } from '../components/Feedback';
import { apiErrorMessage } from '../api/client';
import { MaterialStatusBadge } from '../components/MaterialStatusBadge';

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => subjectService.get(subjectId!),
    enabled: !!subjectId,
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

  const { subject, materials, quizzes, weakTopics, strongTopics } = data as unknown as {
    subject: { name: string; description?: string; color: string };
    materials: { _id: string; title: string; status: string; wordCount?: number }[];
    quizzes: { _id: string; title: string; difficulty: string }[];
    weakTopics: { topic: string; percentage: number }[];
    strongTopics: { topic: string; percentage: number }[];
  };

  return (
    <div className="space-y-6">
      <Link to="/app/subjects" className="inline-flex items-center gap-1 text-sm text-terracotta-500 hover:text-terracotta-600">
        <ArrowLeft size={14} /> Back to subjects
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ backgroundColor: subject.color }}>
          <FileText size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{subject.name}</h1>
          {subject.description && <p className="text-sm text-terracotta-500 dark:text-terracotta-400">{subject.description}</p>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Materials</h2>
            <Link to="/app/materials" className="text-sm font-medium text-terracotta-600 hover:underline">
              <Upload size={14} className="mr-1 inline" /> Upload
            </Link>
          </div>
          {materials.length === 0 ? (
            <EmptyState title="No materials yet" description="Upload a PDF to this subject to get started." />
          ) : (
            <ul className="mt-3 divide-y divide-terracotta-100 dark:divide-terracotta-800">
              {materials.map((m) => (
                <li key={m._id} className="flex items-center justify-between py-3">
                  <Link to={`/app/materials/${m._id}`} className="text-sm font-medium hover:text-terracotta-600">
                    {m.title}
                  </Link>
                  <MaterialStatusBadge status={m.status as never} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-terracotta-100 pt-4 dark:border-terracotta-800">
            <h2 className="font-display font-semibold">Quizzes</h2>
            <Link to="/app/quiz" className="text-sm font-medium text-terracotta-600 hover:underline">
              <ListChecks size={14} className="mr-1 inline" /> Generate quiz
            </Link>
          </div>
          {quizzes.length === 0 ? (
            <p className="mt-3 text-sm text-terracotta-500 dark:text-terracotta-400">No quizzes yet for this subject.</p>
          ) : (
            <ul className="mt-3 divide-y divide-terracotta-100 dark:divide-terracotta-800">
              {quizzes.map((q) => (
                <li key={q._id} className="flex items-center justify-between py-3">
                  <Link to={`/app/quiz/${q._id}`} className="text-sm font-medium hover:text-terracotta-600">
                    {q.title}
                  </Link>
                  <span className="badge bg-terracotta-100 text-terracotta-600 dark:bg-terracotta-800 dark:text-terracotta-300 capitalize">
                    {q.difficulty}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} />
              <h2 className="font-display font-semibold">Weak topics</h2>
            </div>
            {weakTopics.length === 0 ? (
              <p className="mt-3 text-sm text-terracotta-500 dark:text-terracotta-400">None detected yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {weakTopics.map((t) => (
                  <li key={t.topic} className="flex items-center justify-between text-sm">
                    <span>{t.topic}</span>
                    <span className="text-red-500">{t.percentage}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <h2 className="font-display font-semibold">Strong topics</h2>
            </div>
            {strongTopics.length === 0 ? (
              <p className="mt-3 text-sm text-terracotta-500 dark:text-terracotta-400">Keep practicing to build mastery.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {strongTopics.map((t) => (
                  <li key={t.topic} className="flex items-center justify-between text-sm">
                    <span>{t.topic}</span>
                    <span className="text-emerald-500">{t.percentage}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
