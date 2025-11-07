import type { CSSProperties, ReactNode } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

type SpinnerProps = {
  size?: SpinnerSize;
  text?: ReactNode;
  color?: string;
};

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Spinner = ({ size = 'md', text, color }: SpinnerProps) => {
  const style: CSSProperties | undefined = color ? { color } : undefined;

  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <svg
        className={`animate-spin ${sizeMap[size]} text-primary-500`}
        style={style}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text ? <span className="text-sm text-neutral-600" style={style}>{text}</span> : null}
    </div>
  );
};
