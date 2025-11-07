import type { ReactNode } from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

type AlertProps = {
  type?: AlertType;
  title?: ReactNode;
  children?: ReactNode;
};

const baseClass = 'rounded-lg border px-4 py-3 text-sm flex flex-col gap-1';

const appearance: Record<AlertType, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-rose-50 border-rose-200 text-rose-900',
};

export const Alert = ({ type = 'info', title, children }: AlertProps) => (
  <div className={`${baseClass} ${appearance[type]}`} role="alert">
    {title ? <h4 className="font-semibold">{title}</h4> : null}
    {children ? <div className="text-sm leading-relaxed">{children}</div> : null}
  </div>
);
