import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Sparkles, BookMarked, ListChecks, Sigma, Lightbulb } from 'lucide-react';
import { aiService, materialService } from '../services';
import { SummaryLength } from '../types';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Feedback';

interface SummaryResult {
  summary: string;
  keyConcepts: string[];
  definitions: { term: string; definition: string }[];
  importantPoints: string[];
  formulas?: string[];
  examples?: string[];
}

const LENGTHS: { value: SummaryLength; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'detailed', label: 'Detailed' },
];

export default function SummaryPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const [length, setLength] = useState<SummaryLength>('medium');
  const { toast } = useToast();

  const { data: material } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => materialService.get(materialId!),
    enabled: !!materialId,
  });

  const mutation = useMutation({
    mutationFn: () => aiService.summarize(materialId!, length) as Promise<SummaryResult>,
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={`/app/materials/${materialId}`} className="inline-flex items-center gap-1 text-sm text-terracotta-500 hover:text-terracotta-600">
        <ArrowLeft size={14} /> Back to material
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold">AI Summary</h1>
        <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">{material?.title}</p>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-medium">Length:</span>
        <div className="flex gap-1.5">
          {LENGTHS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLength(l.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                length === l.value
                  ? 'bg-terracotta-600 text-ivory'
                  : 'bg-terracotta-100 text-terracotta-600 hover:bg-terracotta-200 dark:bg-terracotta-800 dark:text-terracotta-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary ml-auto">
          {mutation.isPending ? <Spinner size={16} /> : <Sparkles size={16} />}
          {mutation.isPending ? 'Generating…' : mutation.data ? 'Regenerate' : 'Generate summary'}
        </button>
      </div>

      {mutation.data && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display">
              <ReactMarkdown>{mutation.data.summary}</ReactMarkdown>
            </div>
          </div>

          {mutation.data.keyConcepts?.length > 0 && (
            <div className="card p-6">
              <div className="mb-3 flex items-center gap-2">
                <BookMarked size={18} className="text-terracotta-600 dark:text-terracotta-400" />
                <h2 className="font-display font-semibold">Key concepts</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {mutation.data.keyConcepts.map((c) => (
                  <span key={c} className="badge bg-terracotta-50 text-terracotta-700 dark:bg-terracotta-950 dark:text-terracotta-300">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mutation.data.definitions?.length > 0 && (
            <div className="card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                <h2 className="font-display font-semibold">Definitions</h2>
              </div>
              <dl className="space-y-3">
                {mutation.data.definitions.map((d) => (
                  <div key={d.term}>
                    <dt className="text-sm font-semibold">{d.term}</dt>
                    <dd className="text-sm text-terracotta-600 dark:text-terracotta-400">{d.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {mutation.data.importantPoints?.length > 0 && (
            <div className="card p-6">
              <div className="mb-3 flex items-center gap-2">
                <ListChecks size={18} className="text-emerald-500" />
                <h2 className="font-display font-semibold">Important points</h2>
              </div>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-terracotta-700 dark:text-terracotta-300">
                {mutation.data.importantPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {(mutation.data.formulas?.length ?? 0) > 0 && (
            <div className="card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Sigma size={18} className="text-violet-500" />
                <h2 className="font-display font-semibold">Formulas</h2>
              </div>
              <div className="space-y-2">
                {mutation.data.formulas!.map((f, i) => (
                  <code key={i} className="block rounded-lg bg-terracotta-100 px-3 py-2 text-sm dark:bg-terracotta-800">
                    {f}
                  </code>
                ))}
              </div>
            </div>
          )}

          {(mutation.data.examples?.length ?? 0) > 0 && (
            <div className="card p-6">
              <h2 className="font-display mb-3 font-semibold">Examples</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-terracotta-700 dark:text-terracotta-300">
                {mutation.data.examples!.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!mutation.data && !mutation.isPending && (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Sparkles className="text-terracotta-300" size={28} />
          <p className="text-sm text-terracotta-500 dark:text-terracotta-400">
            Choose a length and generate an AI summary of this material.
          </p>
        </div>
      )}
    </div>
  );
}
