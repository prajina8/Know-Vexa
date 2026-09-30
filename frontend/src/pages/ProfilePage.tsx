import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trophy, Flame, Zap, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Feedback';

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoalMinutes ?? 60);

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => authService.achievements() as Promise<Achievement[]>,
  });

  const mutation = useMutation({
    mutationFn: () => authService.updateProfile({ name, dailyGoalMinutes: dailyGoal }),
    onSuccess: () => {
      toast('Profile updated', 'success');
      refreshUser();
    },
    onError: (err) => toast(apiErrorMessage(err), 'error'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-terracotta-500 dark:text-terracotta-400">Manage your account and view your achievements.</p>
      </div>

      <div className="card flex items-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-100 text-2xl font-bold text-terracotta-700 dark:bg-terracotta-900 dark:text-terracotta-300">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-display text-lg font-semibold">{user?.name}</p>
          <p className="text-sm text-terracotta-500 dark:text-terracotta-400">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <Zap className="mx-auto mb-1 text-terracotta-500" size={20} />
          <p className="font-display text-xl font-bold">{user?.xp}</p>
          <p className="text-xs text-terracotta-500 dark:text-terracotta-400">XP · Level {user?.level}</p>
        </div>
        <div className="card p-4 text-center">
          <Flame className="mx-auto mb-1 text-amber-500" size={20} />
          <p className="font-display text-xl font-bold">{user?.currentStreak}</p>
          <p className="text-xs text-terracotta-500 dark:text-terracotta-400">Day streak</p>
        </div>
        <div className="card p-4 text-center">
          <Trophy className="mx-auto mb-1 text-violet-500" size={20} />
          <p className="font-display text-xl font-bold">{achievements?.length ?? 0}</p>
          <p className="text-xs text-terracotta-500 dark:text-terracotta-400">Achievements</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display mb-4 font-semibold">Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Daily study goal (minutes)</label>
            <input type="number" min={10} className="input" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} />
          </div>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Spinner size={16} /> : <Save size={16} />}
            Save changes
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display mb-4 font-semibold">Badges</h2>
        {!achievements || achievements.length === 0 ? (
          <p className="text-sm text-terracotta-500 dark:text-terracotta-400">Complete quizzes and build streaks to earn badges.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map((a) => (
              <div key={a._id} className="flex flex-col items-center gap-1.5 rounded-xl bg-terracotta-50 p-4 text-center dark:bg-terracotta-800">
                <Trophy className="text-amber-500" size={22} />
                <p className="text-xs font-semibold">{a.title}</p>
                <p className="text-[11px] text-terracotta-500 dark:text-terracotta-400">{a.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
