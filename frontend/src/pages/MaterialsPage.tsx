import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, AlertTriangle, X } from 'lucide-react';
import { materialService, subjectService } from '../services';
import { CardSkeleton, ErrorState, EmptyState, useConfirm } from '../components/Feedback';
import { MaterialStatusBadge } from '../components/MaterialStatusBadge';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

const MAX_MB = 20;

function UploadModal({ onClose }: { onClose: () => void }) {
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: subjectService.list });
  const [subjectId, setSubjectId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => materialService.upload(file!, subjectId, title || file!.name.replace(/\.pdf$/i, ''), setProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast('Upload started — processing your PDF now', 'success');
      onClose();
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  const handleFile = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      if (f.type !== 'application/pdf') {
        toast('Only PDF files are supported', 'error');
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast(`File is too large — max ${MAX_MB}MB`, 'error');
        return;
      }
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.pdf$/i, ''));
    },
    [title, toast],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Upload material</h3>
          <button onClick={onClose} className="btn-ghost !px-2">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Select a subject</option>
              {subjects?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {subjects?.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                Create a subject first from the Subjects page.
              </p>
            )}
          </div>

          <div>
            <label className="label">Title (optional)</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 4 - Normalization" />
          </div>

          <div>
            <label className="label">PDF file</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragOver ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950' : 'border-terracotta-300 dark:border-terracotta-700'
              }`}
            >
              <Upload className="text-terracotta-400" size={22} />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-terracotta-500 dark:text-terracotta-400">
                  Drag & drop a PDF, or click to browse (max {MAX_MB}MB)
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          {mutation.isPending && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-terracotta-100 dark:bg-terracotta-800">
              <div className="h-full bg-terracotta-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          <button
            className="btn-primary w-full"
            disabled={!file || !subjectId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? `Uploading ${progress}%` : 'Upload material'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialService.list(),
    refetchInterval: (query) => {
      // Poll while anything is still processing/uploading
      const list = query.state.data ?? [];
      return list.some((m) => m.status === 'processing' || m.status === 'uploading') ? 3000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast('Material deleted', 'success');
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Materials</h1>
          <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">Your uploaded study PDFs.</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary">
          <Upload size={16} /> Upload PDF
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {isError && <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />}
      {data && data.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No materials uploaded"
          description="Upload your first PDF to generate summaries, quizzes, and flashcards."
          action={
            <button onClick={() => setUploadOpen(true)} className="btn-primary">
              <Upload size={16} /> Upload PDF
            </button>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <div key={m._id} className="card group relative p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-950 dark:text-terracotta-400">
                <FileText size={18} />
              </div>
              <Link to={`/app/materials/${m._id}`} className="font-display font-semibold hover:text-terracotta-600 line-clamp-1">
                {m.title}
              </Link>
              <div className="mt-2 flex items-center justify-between">
                <MaterialStatusBadge status={m.status} />
                {m.wordCount ? (
                  <span className="text-xs text-terracotta-400">{m.wordCount.toLocaleString()} words</span>
                ) : null}
              </div>
              {m.status === 'failed' && m.failureReason && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {m.failureReason}
                </p>
              )}
              <button
                onClick={async () => {
                  if (await confirm('Delete material?', `This removes "${m.title}" and its extracted content.`, true)) {
                    deleteMutation.mutate(m._id);
                  }
                }}
                className="absolute right-3 top-3 hidden btn-ghost !p-1.5 text-red-500 group-hover:flex"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </div>
  );
}
