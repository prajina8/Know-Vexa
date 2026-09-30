import { ReactNode, useState } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-terracotta-200 dark:bg-terracotta-800 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: typeof Inbox;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="rounded-full bg-terracotta-100 p-3 dark:bg-terracotta-800">
        <Icon className="text-terracotta-400" size={24} />
      </div>
      <div>
        <p className="font-display font-semibold text-terracotta-900 dark:text-terracotta-100">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-terracotta-500 dark:text-terracotta-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="rounded-full bg-red-50 p-3 dark:bg-red-950">
        <AlertTriangle className="text-red-500" size={24} />
      </div>
      <div>
        <p className="font-display font-semibold text-terracotta-900 dark:text-terracotta-100">Something went wrong</p>
        <p className="mt-1 max-w-sm text-sm text-terracotta-500 dark:text-terracotta-400">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" />;
}

export function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-terracotta-50 dark:bg-terracotta-950">
      <Spinner size={28} />
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm p-6">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="mt-2 text-sm text-terracotta-500 dark:text-terracotta-400">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    danger?: boolean;
    resolve?: (v: boolean) => void;
  }>({ open: false, title: '' });

  const confirm = (title: string, description?: string, danger?: boolean) =>
    new Promise<boolean>((resolve) => {
      setState({ open: true, title, description, danger, resolve });
    });

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      danger={state.danger}
      confirmLabel={state.danger ? 'Delete' : 'Confirm'}
      onConfirm={() => {
        state.resolve?.(true);
        setState((s) => ({ ...s, open: false }));
      }}
      onCancel={() => {
        state.resolve?.(false);
        setState((s) => ({ ...s, open: false }));
      }}
    />
  );

  return { confirm, dialog };
}
