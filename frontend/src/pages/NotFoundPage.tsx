import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-terracotta-50 text-center dark:bg-terracotta-950">
      <p className="font-display text-5xl font-bold text-terracotta-600">404</p>
      <p className="text-terracotta-500 dark:text-terracotta-400">This page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-2">
        Go home
      </Link>
    </div>
  );
}
