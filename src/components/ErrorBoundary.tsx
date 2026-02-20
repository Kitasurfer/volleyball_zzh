import React from 'react';

const isDev =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV === true) ||
  process.env.NODE_ENV === 'development';

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return isDev ? `${error.message}\n${error.stack ?? ''}` : error.message;
  }

  return isDev ? JSON.stringify(error, null, 2) : 'Unexpected error';
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500 rounded">
          <h2 className="text-red-500">Something went wrong.</h2>
          <pre className="mt-2 text-sm whitespace-pre-wrap break-words">
            {formatError(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}