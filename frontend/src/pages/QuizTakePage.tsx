import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { quizService } from '../services';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';
import { CardSkeleton, ErrorState, Spinner } from '../components/Feedback';

export default function QuizTakePage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: quiz, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizService.get(quizId!),
    enabled: !!quizId,
  });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLimitSeconds = (quiz?.timeLimitMinutes ?? 0) * 60;
  const remaining = timeLimitSeconds ? timeLimitSeconds - elapsedSeconds : null;

  const submitMutation = useMutation({
    mutationFn: () =>
      quizService.submit(quizId!, {
        answers: Object.entries(answers).map(([questionId, givenAnswer]) => ({ questionId, givenAnswer })),
        timeTakenSeconds: elapsedSeconds,
        startedAt,
      }),
    onSuccess: (result) => {
      navigate(`/app/quiz/${quizId}/result`, { state: { result } });
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !submitMutation.isPending && !submitMutation.isSuccess) {
      submitMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const question = quiz?.questions[current];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (isLoading) return <CardSkeleton />;
  if (isError) return <ErrorState message={apiErrorMessage(error)} onRetry={refetch} />;
  if (!quiz || !question) return null;

  const total = quiz.questions.length;
  const format = (s: number) => `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.max(s, 0) % 60).padStart(2, '0')}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-terracotta-500 dark:text-terracotta-400">
            Question {current + 1} of {total} · {answeredCount} answered
          </p>
        </div>
        {quiz.timeLimitMinutes && (
          <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium ${
            remaining !== null && remaining < 60 ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-terracotta-100 dark:bg-terracotta-800'
          }`}>
            <Clock size={14} /> {format(remaining ?? 0)}
          </div>
        )}
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-terracotta-100 dark:bg-terracotta-800">
        <div className="h-full bg-terracotta-600 transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="badge bg-terracotta-100 text-terracotta-600 dark:bg-terracotta-800 dark:text-terracotta-300 capitalize">{question.difficulty}</span>
          <span className="badge bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-950 dark:text-terracotta-400">{question.topic}</span>
        </div>
        <p className="font-display text-lg font-semibold">{question.question}</p>

        <div className="mt-5 space-y-2.5">
          {(question.type === 'mcq' || question.type === 'true_false') &&
            question.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers((a) => ({ ...a, [question._id]: opt }))}
                className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                  answers[question._id] === opt
                    ? 'border-terracotta-500 bg-terracotta-50 dark:bg-terracotta-950'
                    : 'border-terracotta-200 hover:border-terracotta-300 dark:border-terracotta-700'
                }`}
              >
                {opt}
              </button>
            ))}

          {question.type === 'short_answer' && (
            <textarea
              className="input"
              rows={3}
              placeholder="Type your answer…"
              value={answers[question._id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [question._id]: e.target.value }))}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="btn-secondary">
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="hidden gap-1 sm:flex">
          {quiz.questions.map((q, i) => (
            <button
              key={q._id}
              onClick={() => setCurrent(i)}
              className={`h-8 w-8 rounded-lg text-xs font-medium ${
                i === current
                  ? 'bg-terracotta-600 text-ivory'
                  : answers[q._id]
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-terracotta-100 text-terracotta-500 dark:bg-terracotta-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {current < total - 1 ? (
          <button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} className="btn-secondary">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="btn-primary">
            {submitMutation.isPending ? <Spinner size={16} /> : <Flag size={16} />}
            Submit quiz
          </button>
        )}
      </div>
    </div>
  );
}
