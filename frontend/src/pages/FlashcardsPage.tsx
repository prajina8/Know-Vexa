import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Layers, RotateCw, ThumbsDown, Meh, ThumbsUp } from 'lucide-react';
import { subjectService, materialService, aiService, flashcardService } from '../services';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';
import { EmptyState, Spinner } from '../components/Feedback';
import { clsx } from 'clsx';

export default function FlashcardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [subjectId, setSubjectId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [topic, setTopic] = useState('');
  const [numCards, setNumCards] = useState(15);
  const [studySubjectId, setStudySubjectId] = useState('');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: subjectService.list });
  const { data: materials } = useQuery({
    queryKey: ['materials', subjectId],
    queryFn: () => materialService.list(subjectId),
    enabled: !!subjectId,
  });

  const { data: cards, refetch: refetchCards } = useQuery({
    queryKey: ['flashcards', studySubjectId],
    queryFn: () => flashcardService.list({ subjectId: studySubjectId || undefined }),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      aiService.generateFlashcards({ subjectId, materialId: materialId || undefined, topic: topic || undefined, numCards }),
    onSuccess: () => {
      toast('Flashcards generated', 'success');
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: 'hard' | 'good' | 'easy' }) => flashcardService.rate(id, rating),
    onSuccess: () => {
      setFlipped(false);
      setIndex((i) => Math.min(i + 1, (cards?.length ?? 1) - 1));
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  const card = cards?.[index];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Flashcards</h1>
        <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">Generate cards from your materials and review them.</p>
      </div>

      <div className="card p-6">
        <h2 className="font-display mb-4 font-semibold">Generate flashcards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Subject</label>
            <select className="input" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setMaterialId(''); }}>
              <option value="">Select subject</option>
              {subjects?.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Material (optional)</label>
            <select className="input" value={materialId} onChange={(e) => setMaterialId(e.target.value)} disabled={!subjectId}>
              <option value="">All materials</option>
              {materials?.filter((m) => m.status === 'ready').map((m) => (
                <option key={m._id} value={m._id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Topic (optional)</label>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Indexing" />
          </div>
          <div>
            <label className="label"># Cards</label>
            <input type="number" min={1} max={50} className="input" value={numCards} onChange={(e) => setNumCards(Number(e.target.value))} />
          </div>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={!subjectId || generateMutation.isPending}
          className="btn-primary mt-4"
        >
          {generateMutation.isPending ? <Spinner size={16} /> : <Sparkles size={16} />}
          {generateMutation.isPending ? 'Generating…' : 'Generate flashcards'}
        </button>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold">Study session</h2>
          <select
            className="input !w-auto"
            value={studySubjectId}
            onChange={(e) => {
              setStudySubjectId(e.target.value);
              setIndex(0);
              setFlipped(false);
            }}
          >
            <option value="">All subjects</option>
            {subjects?.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {!cards || cards.length === 0 ? (
          <EmptyState icon={Layers} title="No flashcards yet" description="Generate some above to start studying." />
        ) : !card ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-display font-semibold">Session complete 🎉</p>
            <button
              className="btn-secondary"
              onClick={() => {
                setIndex(0);
                refetchCards();
              }}
            >
              <RotateCw size={16} /> Restart session
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <p className="mb-2 text-center text-xs text-terracotta-400">
              Card {index + 1} of {cards.length} · Difficulty: {card.difficulty}
            </p>
            <button
              onClick={() => setFlipped((f) => !f)}
              className={clsx(
                'flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 p-6 text-center transition-colors',
                flipped
                  ? 'border-terracotta-300 bg-terracotta-50 dark:bg-terracotta-950'
                  : 'border-terracotta-200 bg-ivory dark:border-terracotta-700 dark:bg-terracotta-900',
              )}
            >
              <span className="mb-2 text-xs font-medium uppercase tracking-wide text-terracotta-400">
                {flipped ? 'Answer' : 'Question'} · {card.topic}
              </span>
              <p className="font-display text-lg font-semibold">{flipped ? card.answer : card.question}</p>
              <span className="mt-3 text-xs text-terracotta-400">Tap to flip</span>
            </button>

            {flipped && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => rateMutation.mutate({ id: card._id, rating: 'hard' })}
                  className="flex flex-col items-center gap-1 rounded-xl bg-red-50 py-3 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
                >
                  <ThumbsDown size={18} /> <span className="text-xs font-medium">Hard</span>
                </button>
                <button
                  onClick={() => rateMutation.mutate({ id: card._id, rating: 'good' })}
                  className="flex flex-col items-center gap-1 rounded-xl bg-amber-50 py-3 text-amber-600 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400"
                >
                  <Meh size={18} /> <span className="text-xs font-medium">Good</span>
                </button>
                <button
                  onClick={() => rateMutation.mutate({ id: card._id, rating: 'easy' })}
                  className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 py-3 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400"
                >
                  <ThumbsUp size={18} /> <span className="text-xs font-medium">Easy</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
