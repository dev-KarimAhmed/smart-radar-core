'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import { trackSovereignError } from '@/lib/error-tracker';

const styles = {
  root: 'flex min-h-[60vh] items-center justify-center p-4',
  card: 'w-full max-w-md rounded-2xl border border-red-500/40 bg-red-950/20 p-6 text-center text-red-100',
  icon: 'mx-auto h-12 w-12 text-red-400',
  title: 'mt-4 text-lg font-black',
  description: 'mt-2 text-sm text-red-200/80',
  body: 'mt-4 text-sm text-red-100/80',
} as const;

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  public state: RouteErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackSovereignError(error, { componentStack: errorInfo.componentStack });
  }

  public render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className={styles.root}>
        <section className={styles.card}>
          <ShieldAlert className={styles.icon} aria-hidden="true" />
          <h2 className={styles.title}>عذراً، حدث خطأ غير متوقع</h2>
          <p className={styles.description}>
            {getSovereignErrorMessage(this.state.error || { code: 'SYS_COMPONENT_CRASH' })}
          </p>
          <p className={styles.body}>
            نواجه مشكلة مؤقتة في تحميل هذا الجزء. يرجى إعادة المحاولة، وبقية الخدمات ما زالت تعمل.
          </p>
        </section>
      </div>
    );
  }
}
