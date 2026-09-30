import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, RotateCw, CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';
import { studyPlanService, aiService } from '../services';
import { PlanRange } from '../types';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';
import { EmptyState, Spinner } from '../components/Feedback';

export default function StudyPlanPage() {
  const [range, setRange] = useState<PlanRange>('daily');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['studyPlan', range],
    queryFn: () => studyPlanService.latest(range),
  });

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateStudyPlan(range),
    onSuccess: () => {
      toast('Study plan generated', 'success');
      queryClient.invalidateQueries({ queryKey: ['studyPlan', range] });
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  const taskMutation = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      studyPlanService.updateTask(plan!._id, taskId, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studyPlan', range] }),
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (taskId: string) => studyPlanService.updateTask(plan!._id, taskId, { reschedule: true }),
    onSuccess: () => {
      toast('Task rescheduled to tomorrow', 'success');
      queryClient.invalidateQueries({ queryKey: ['studyPlan', range] });
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  const totalMinutes = plan?.tasks.reduce((s, t) => s + t.durationMinutes, 0) ?? 0;
  const completedCount = plan?.tasks.filter((t) => t.completed).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Study Plan</h1>
          <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">
            A personalized plan built from your weak topics and recent activity.
          </p>
        </div>
        <div className="flex gap-1.5 rounded-xl bg-terracotta-100 p-1 dark:bg-terracotta-800">
          {(['daily', 'weekly'] as PlanRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                range === r ? 'bg-ivory shadow-sm dark:bg-terracotta-900' : 'text-terracotta-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="card h-40 animate-pulse" />}

      {!isLoading && !plan && (
        <EmptyState
          icon={CalendarClock}
          title="No study plan yet"
          description="Generate a plan based on your quiz performance and weak topics."
          action={
            <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="btn-primary">
              {generateMutation.isPending ? <Spinner size={16} /> : <Sparkles size={16} />}
              Generate plan
            </button>
          }
        />
      )}

      {plan && (
        <>
          <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-6">
              <div>
                <p className="font-display text-xl font-bold">{completedCount}/{plan.tasks.length}</p>
                <p className="text-xs text-terracotta-500 dark:text-terracotta-400">Tasks complete</p>
              </div>
              <div>
                <p className="font-display flex items-center gap-1.5 text-xl font-bold">
                  <Clock size={16} /> {totalMinutes}m
                </p>
                <p className="text-xs text-terracotta-500 dark:text-terracotta-400">Total time</p>
              </div>
            </div>
            <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="btn-secondary">
              {generateMutation.isPending ? <Spinner size={16} /> : <RotateCw size={16} />}
              Regenerate
            </button>
          </div>

          <div className="space-y-3">
            {plan.tasks
              .slice()
              .sort((a, b) => a.priority - b.priority)
              .map((task) => {
                const subj = typeof task.subject === 'object' ? task.subject : null;
                return (
                  <div key={task._id} className="card flex items-start gap-3 p-4">
                    <button onClick={() => taskMutation.mutate({ taskId: task._id, completed: !task.completed })} className="mt-0.5">
                      {task.completed ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <Circle size={20} className="text-terracotta-300" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {subj && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: (subj as { color: string }).color }}
                          />
                        )}
                        <p className={`font-medium ${task.completed ? 'text-terracotta-400 line-through' : ''}`}>
                          {task.topic}
                        </p>
                      </div>
                      <p className="text-xs text-terracotta-500 dark:text-terracotta-400">
                        {subj ? (subj as { name: string }).name : ''} · {task.durationMinutes} min
                      </p>
                      <p className="mt-1 text-xs text-terracotta-400">{task.reason}</p>
                    </div>
                    {!task.completed && (
                      <button onClick={() => rescheduleMutation.mutate(task._id)} className="btn-ghost !px-2 text-xs">
                        Reschedule
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
