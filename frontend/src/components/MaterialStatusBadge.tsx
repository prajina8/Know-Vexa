import { clsx } from 'clsx';
import { Loader2, CheckCircle2, XCircle, UploadCloud } from 'lucide-react';
import { MaterialStatus } from '../types';

const CONFIG: Record<MaterialStatus, { label: string; className: string; icon: typeof Loader2 }> = {
  uploading: {
    label: 'Uploading',
    className: 'bg-terracotta-100 text-terracotta-600 dark:bg-terracotta-800 dark:text-terracotta-300',
    icon: UploadCloud,
  },
  processing: {
    label: 'Processing',
    className: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    icon: Loader2,
  },
  ready: {
    label: 'Ready',
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    icon: XCircle,
  },
};

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  const { label, className, icon: Icon } = CONFIG[status];
  return (
    <span className={clsx('badge', className)}>
      <Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />
      {label}
    </span>
  );
}
