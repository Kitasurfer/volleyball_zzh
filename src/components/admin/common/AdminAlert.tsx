import type { ReactNode } from 'react';

type AdminAlertVariant = 'error' | 'success';

type AdminAlertSize = 'sm' | 'md';

interface AdminAlertProps {
  variant: AdminAlertVariant;
  size?: AdminAlertSize;
  className?: string;
  children: ReactNode;
}

export const AdminAlert = ({
  variant,
  size = 'sm',
  className,
  children,
}: AdminAlertProps) => {
  const colorClasses =
    variant === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-600'
      : 'border-emerald-200 bg-emerald-50 text-emerald-600';

  const sizeClasses = size === 'sm' ? 'p-3 text-xs' : 'p-4 text-sm';

  const baseClasses = `rounded-lg border ${colorClasses} ${sizeClasses}`;
  const fullClassName = className ? `${baseClasses} ${className}` : baseClasses;

  return <div className={fullClassName}>{children}</div>;
};
