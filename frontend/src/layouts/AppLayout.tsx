import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ListChecks,
  Layers,
  CalendarClock,
  TrendingUp,
  User as UserIcon,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/app/materials', label: 'Materials', icon: FileText },
  { to: '/app/quiz', label: 'Quizzes', icon: ListChecks },
  { to: '/app/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/app/study-plan', label: 'Study Plan', icon: CalendarClock },
  { to: '/app/progress', label: 'Progress', icon: TrendingUp },
];

function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.replace('/app/', '').split('/').filter(Boolean);
  if (parts.length <= 1) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-terracotta-500 dark:text-terracotta-400">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5 capitalize">
          {i > 0 && <ChevronRight size={12} />}
          {p.replace(/-/g, ' ')}
        </span>
      ))}
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta-600 text-ivory font-display font-bold">
          S
        </div>
        <span className="font-display text-lg font-bold">StudyForge</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-terracotta-50 text-terracotta-700 dark:bg-terracotta-950 dark:text-terracotta-300'
                  : 'text-terracotta-600 hover:bg-terracotta-100 dark:text-terracotta-400 dark:hover:bg-terracotta-800',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 dark:from-amber-950 dark:to-orange-950">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Flame size={18} />
          <span className="font-display text-sm font-bold">{user?.currentStreak ?? 0} day streak</span>
        </div>
        <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-400/70">
          Level {user?.level ?? 1} · {user?.xp ?? 0} XP
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-terracotta-200 bg-ivory dark:border-terracotta-800 dark:bg-terracotta-900 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-espresso/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-ivory dark:bg-terracotta-900">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-terracotta-200 bg-ivory/80 px-4 py-3 backdrop-blur dark:border-terracotta-800 dark:bg-terracotta-900/80 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="btn-ghost !px-2 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <Breadcrumbs />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost !px-2.5" title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-terracotta-100 dark:hover:bg-terracotta-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-100 text-sm font-semibold text-terracotta-700 dark:bg-terracotta-900 dark:text-terracotta-300">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-terracotta-200 bg-ivory py-1 shadow-lg dark:border-terracotta-800 dark:bg-terracotta-900">
                    <Link
                      to="/app/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-terracotta-50 dark:hover:bg-terracotta-800"
                    >
                      <UserIcon size={16} /> Profile
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
