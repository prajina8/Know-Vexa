import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, FileText, ListChecks, Trash2, Pencil, X } from 'lucide-react';
import { subjectService } from '../services';
import { Subject } from '../types';
import { CardSkeleton, ErrorState, EmptyState, useConfirm } from '../components/Feedback';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

function SubjectModal({
  subject,
  onClose,
}: {
  subject?: Subject;
  onClose: () => void;
}) {
  const [name, setName] = useState(subject?.name ?? '');
  const [description, setDescription] = useState(subject?.description ?? '');
  const [color, setColor] = useState(subject?.color ?? COLORS[0]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      subject
        ? subjectService.update(subject._id, { name, description, color })
        : subjectService.create({ name, description, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast(subject ? 'Subject updated' : 'Subject created', 'success');
      onClose();
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{subject ? 'Edit subject' : 'New subject'}</h3>
          <button onClick={onClose} className="btn-ghost !px-2">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Database Management System" autoFocus />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full ring-offset-2"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : undefined }}
                />
              ))}
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
            {subject ? 'Save changes' : 'Create subject'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['subjects'],
    queryFn: subjectService.list,
  });
  const [modalSubject, setModalSubject] = useState<Subject | 'new' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast('Subject deleted', 'success');
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Subjects</h1>
          <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">Organize your materials by subject.</p>
        </div>
        <button onClick={() => setModalSubject('new')} className="btn-primary">
          <Plus size={16} /> Add subject
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
          icon={BookOpen}
          title="No subjects yet"
          description="Create your first subject to start uploading materials."
          action={
            <button onClick={() => setModalSubject('new')} className="btn-primary">
              <Plus size={16} /> Add subject
            </button>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <div key={s._id} className="card group relative p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: s.color }}>
                <BookOpen size={18} />
              </div>
              <Link to={`/app/subjects/${s._id}`} className="font-display font-semibold hover:text-terracotta-600">
                {s.name}
              </Link>
              {s.description && <p className="mt-1 line-clamp-2 text-sm text-terracotta-500 dark:text-terracotta-400">{s.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-xs text-terracotta-500 dark:text-terracotta-400">
                <span className="flex items-center gap-1">
                  <FileText size={13} /> {s.materialCount ?? 0} materials
                </span>
                <span className="flex items-center gap-1">
                  <ListChecks size={13} /> {s.quizCount ?? 0} quizzes
                </span>
              </div>
              <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
                <button onClick={() => setModalSubject(s)} className="btn-ghost !p-1.5">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={async () => {
                    if (await confirm('Delete subject?', `This will remove "${s.name}" and cannot be undone.`, true)) {
                      deleteMutation.mutate(s._id);
                    }
                  }}
                  className="btn-ghost !p-1.5 text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalSubject && (
        <SubjectModal subject={modalSubject === 'new' ? undefined : modalSubject} onClose={() => setModalSubject(null)} />
      )}
    </div>
  );
}
