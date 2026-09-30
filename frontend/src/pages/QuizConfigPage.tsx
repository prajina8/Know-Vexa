import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, ListChecks } from 'lucide-react';
import { subjectService, materialService, aiService, quizService } from '../services';
import { Difficulty, QuestionType } from '../types';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';
import { EmptyState, Spinner } from '../components/Feedback';

const DIFFICULTIES: { value: Difficulty | 'mixed'; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
];

export default function QuizConfigPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subjectId, setSubjectId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty | 'mixed'>('mixed');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mcq']);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | ''>('');

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: subjectService.list });
  const { data: materials } = useQuery({
    queryKey: ['materials', subjectId],
    queryFn: () => materialService.list(subjectId),
    enabled: !!subjectId,
  });
  const { data: quizzes } = useQuery({ queryKey: ['quizzes'], queryFn: () => quizService.list() });

  const mutation = useMutation({
    mutationFn: () =>
      aiService.generateQuiz({
        subjectId,
        materialId: materialId || undefined,
        topic: topic || undefined,
        numQuestions,
        difficulty,
        questionTypes,
        timeLimitMinutes: timeLimitMinutes || undefined,
      }),
    onSuccess: (quiz) => navigate(`/app/quiz/${quiz._id}`),
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  const toggleType = (t: QuestionType) => {
    setQuestionTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Quizzes</h1>
        <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">Configure and generate an AI quiz.</p>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Subject</label>
            <select className="input" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setMaterialId(''); }}>
              <option value="">Select subject</option>
              {subjects?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Material (optional)</label>
            <select className="input" value={materialId} onChange={(e) => setMaterialId(e.target.value)} disabled={!subjectId}>
              <option value="">All materials in subject</option>
              {materials?.filter((m) => m.status === 'ready').map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Topic (optional)</label>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Normalization" />
          </div>
          <div>
            <label className="label">Number of questions</label>
            <input
              type="number"
              min={1}
              max={30}
              className="input"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    difficulty === d.value ? 'bg-terracotta-600 text-ivory' : 'bg-terracotta-100 dark:bg-terracotta-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Time limit (minutes, optional)</label>
            <input
              type="number"
              min={1}
              className="input"
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Question types</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleType(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    questionTypes.includes(t.value) ? 'bg-terracotta-600 text-ivory' : 'bg-terracotta-100 dark:bg-terracotta-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!subjectId || questionTypes.length === 0 || mutation.isPending}
          className="btn-primary mt-5 w-full sm:w-auto"
        >
          {mutation.isPending ? <Spinner size={16} /> : <Sparkles size={16} />}
          {mutation.isPending ? 'Generating quiz…' : 'Generate quiz'}
        </button>
      </div>

      <div>
        <h2 className="font-display mb-3 font-semibold">Your quizzes</h2>
        {quizzes && quizzes.length === 0 && (
          <EmptyState icon={ListChecks} title="No quizzes yet" description="Generate your first quiz above." />
        )}
        {quizzes && quizzes.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <Link key={q._id} to={`/app/quiz/${q._id}`} className="card p-5 hover:border-terracotta-300">
                <p className="font-medium">{q.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-terracotta-500 dark:text-terracotta-400">
                  <span className="badge bg-terracotta-100 text-terracotta-600 dark:bg-terracotta-800 dark:text-terracotta-300 capitalize">{q.difficulty}</span>
                  <span>{q.questions?.length ?? 0} questions</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
