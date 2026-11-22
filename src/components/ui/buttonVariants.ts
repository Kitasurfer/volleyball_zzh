import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 ring-offset-primary-900/20',
        secondary:
          'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-500 ring-offset-neutral-900/10',
        outline:
          'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-400 ring-offset-white',
        ghost:
          'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-300 ring-offset-white',
        accent:
          'bg-accent-500 text-neutral-900 hover:bg-accent-600 focus-visible:ring-accent-500 ring-offset-accent-100',
        danger:
          'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-400 ring-offset-white',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
