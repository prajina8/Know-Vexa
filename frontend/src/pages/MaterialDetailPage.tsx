import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, MessageSquare, ListChecks, Layers, FileText } from 'lucide-react';
import { materialService, aiService } from '../services';
import { CardSkeleton, ErrorState } from '../components/Feedback';
import { MaterialStatusBadge } from '../components/MaterialStatusBadge';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';

export default function MaterialDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generating, setGenerating] = useState<'quiz' | 'flashcards' | null>(null);

  const { data: material, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => materialService.get(materialId!),
    enabled: !!materialId,
  });

  const quickQuizMutation = useMutation({
    mutationFn: () =>
      aiService.generateQuiz({
        subjectId: material!.subject,
        materialId: material!._id,
        numQuestions: 10,
        difficulty: 'mixed',
        questionTypes: ['mcq'],
      }),
    onMutate: () => setGenerating('quiz'),
    onSuccess: (quiz) => navigate(`/app/quiz/${quiz._id}`),
    onError: (err) => toast(apiErrorMessage(err), 'error'),
    onSettled: () => setGenerating(null),
  });

  const quickFlashcardsMutation = useMutation({
    mutationFn: () =>
      aiService.generateFlashcards({ subjectId: material!.subject, materialId: material!._id, numCards: 15 }),
    onMutate: () => setGenerating('flashcards'),
    onSuccess: () => {
      toast('Flashcards generated', 'success');
      navigate('/app/flashcards');
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
    onSettled: () => setGenerating(null),
  });

  if (isLoading) return <CardSkeleton />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />;
  if (!material) return null;

  const ready = material.status === 'ready';

  return (
    <div className="space-y-6">
      <Link to="/app/materials" className="inline-flex items-center gap-1 text-sm text-terracotta-500 hover:text-terracotta-600">
        <ArrowLeft size={14} /> Back to materials
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-950 dark:text-terracotta-400">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{material.title}</h1>
              <p className="text-sm text-terracotta-500 dark:text-terracotta-400">{material.originalFileName}</p>
            </div>
          </div>
          <MaterialStatusBadge status={material.status} />
        </div>

        {material.status === 'failed' && material.failureReason && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {material.failureReason}
          </div>
        )}
        {material.status === 'processing' && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            Extracting and indexing this document — this page will update automatically.
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-terracotta-50 py-3 dark:bg-terracotta-800">
            <p className="font-display text-lg font-bold">{material.pageCount ?? '—'}</p>
            <p className="text-xs text-terracotta-500 dark:text-terracotta-400">Pages</p>
          </div>
          <div className="rounded-xl bg-terracotta-50 py-3 dark:bg-terracotta-800">
            <p className="font-display text-lg font-bold">{material.wordCount?.toLocaleString() ?? '—'}</p>
            <p className="text-xs text-terracotta-500 dark:text-terracotta-400">Words</p>
          </div>
          <div className="rounded-xl bg-terracotta-50 py-3 dark:bg-terracotta-800">
            <p className="font-display text-lg font-bold">{(material.fileSizeBytes / 1024 / 1024).toFixed(1)}MB</p>
            <p className="text-xs text-terracotta-500 dark:text-terracotta-400">File size</p>
          </div>
        </div>

        {material.topics.length > 0 && (
          <div className="mt-5">
            <p className="label">Detected topics</p>
            <div className="flex flex-wrap gap-1.5">
              {material.topics.map((t) => (
                <span key={t} className="badge bg-terracotta-100 text-terracotta-600 dark:bg-terracotta-800 dark:text-terracotta-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to={ready ? `/app/summary/${material._id}` : '#'}
          className={`card flex flex-col items-center gap-2 p-5 text-center ${ready ? 'hover:border-terracotta-300' : 'pointer-events-none opacity-50'}`}
        >
          <Sparkles size={20} className="text-terracotta-600 dark:text-terracotta-400" />
          <span className="text-sm font-medium">AI Summary</span>
        </Link>
        <Link
          to={ready ? `/app/chat/${material._id}` : '#'}
          className={`card flex flex-col items-center gap-2 p-5 text-center ${ready ? 'hover:border-terracotta-300' : 'pointer-events-none opacity-50'}`}
        >
          <MessageSquare size={20} className="text-terracotta-600 dark:text-terracotta-400" />
          <span className="text-sm font-medium">Ask AI Chat</span>
        </Link>
        <button
          disabled={!ready || generating === 'quiz'}
          onClick={() => quickQuizMutation.mutate()}
          className="card flex flex-col items-center gap-2 p-5 text-center hover:border-terracotta-300 disabled:pointer-events-none disabled:opacity-50"
        >
          <ListChecks size={20} className="text-terracotta-600 dark:text-terracotta-400" />
          <span className="text-sm font-medium">{generating === 'quiz' ? 'Generating…' : 'Quick Quiz'}</span>
        </button>
        <button
          disabled={!ready || generating === 'flashcards'}
          onClick={() => quickFlashcardsMutation.mutate()}
          className="card flex flex-col items-center gap-2 p-5 text-center hover:border-terracotta-300 disabled:pointer-events-none disabled:opacity-50"
        >
          <Layers size={20} className="text-terracotta-600 dark:text-terracotta-400" />
          <span className="text-sm font-medium">{generating === 'flashcards' ? 'Generating…' : 'Quick Flashcards'}</span>
        </button>
      </div>
    </div>
  );
}
