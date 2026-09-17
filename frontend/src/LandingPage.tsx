import { Link } from 'react-router-dom';
import { BookOpen, Brain, ListChecks, Layers, TrendingUp, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: BookOpen, title: 'Upload & Organize', desc: 'Drop in your PDFs, group them by subject, and let StudyForge extract everything.' },
  { icon: Brain, title: 'Ask Your Notes', desc: 'A RAG-powered chat that answers from your material — and tells you when it can\'t.' },
  { icon: ListChecks, title: 'AI Quizzes', desc: 'Configurable quizzes by topic, difficulty, and question type, graded instantly.' },
  { icon: Layers, title: 'Adaptive Flashcards', desc: 'Spaced repetition that resurfaces the cards you actually struggle with.' },
  { icon: TrendingUp, title: 'Real Analytics', desc: 'Subject and topic-level mastery tracking with weak-spot detection.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-display font-bold">
            S
          </div>
          <span className="font-display text-lg font-bold">StudyForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">
            Log in
          </Link>
          <Link to="/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Your study materials, <span className="text-brand-600">turned into mastery.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Upload notes, generate quizzes and flashcards, chat with your documents, and get a
          personalized plan built from your actual performance data.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary !px-6 !py-3 text-base">
            Start studying free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <Icon size={20} />
              </div>
              <h3 className="font-display font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
