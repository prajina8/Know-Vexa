import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-terracotta-600 text-ivory font-display font-bold">
            S
          </div>
          <span className="font-display text-lg font-bold">StudyForge</span>
        </Link>
        <Outlet />
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-terracotta-600 via-terracotta-700 to-espresso lg:flex lg:flex-col lg:justify-center lg:px-16">
        <GraduationCap className="mb-6 text-terracotta-200" size={40} />
        <h2 className="font-display text-3xl font-bold leading-tight text-ivory">
          Study smarter, not longer.
        </h2>
        <p className="mt-4 max-w-md text-terracotta-100">
          Upload your notes, let AI build your quizzes and flashcards, and get a personalized plan
          that targets exactly what you're weak on.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4">
          {['AI Summaries', 'Smart Quizzes', 'Adaptive Flashcards', 'Weak-Topic Tracking'].map((f) => (
            <div key={f} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-terracotta-50">
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
