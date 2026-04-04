import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'active'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'scheduled';

export interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-surface text-muted border-border',
  rejected:  'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-amber-50 text-amber-700 border-amber-200',
  scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
};

const defaultLabels: Record<BadgeVariant, string> = {
  active:    'Active',
  completed: 'Completed',
  rejected:  'Rejected',
  cancelled: 'Cancelled',
  scheduled: 'Scheduled',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2.5 py-0.5',
        'font-body text-xs uppercase tracking-widest',
        variantClasses[variant],
        className,
      )}
    >
      {children ?? defaultLabels[variant]}
    </span>
  );
}
