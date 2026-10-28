'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import { trackSovereignError } from '@/lib/error-tracker';

const styles = {
  root: 'flex min-h-[60vh] items-center justify-center p-4',
  card: 'w-full max-w-md border-destructive bg-destructive/10 text-destructive-foreground',
  header: 'items-center text-center',
  icon: 'h-12 w-12 text-destructive',
  description: 'text-destructive/80',
  content: 'text-center',
  body: 'text-sm',
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

    const isArabic = typeof document !== 'undefined'
      ? document.documentElement.lang !== 'en' && document.documentElement.dir !== 'ltr'
      : true;

    return (
      <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
        <Card className={styles.card}>
          <CardHeader className={styles.header}>
            <ShieldAlert className={styles.icon} aria-hidden="true" />
            <CardTitle>{isArabic ? 'عذراً، حدث خطأ غير متوقع' : 'Sorry, an unexpected error occurred'}</CardTitle>
            <CardDescription className={styles.description}>
              {getSovereignErrorMessage(this.state.error || { code: 'SYS_COMPONENT_CRASH' })}
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.content}>
            <p className={styles.body}>
              {isArabic
                ? 'نواجه مشكلة مؤقتة في تحميل هذا الجزء. يرجى إعادة المحاولة مرة أخرى، وبقية الخدمات تعمل بشكل طبيعي.'
                : 'We are experiencing a temporary issue loading this section. Please try again; all other services remain operational.'}
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 bg-black/80 rounded-xl text-left font-mono text-xs text-red-300 overflow-auto max-h-60 whitespace-pre-wrap select-all border border-red-500/30">
                <p className="font-bold text-red-400 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                <p className="text-[10px] text-slate-400">{this.state.error.stack}</p>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/80 text-white text-xs font-bold transition-all cursor-pointer"
              >
                {isArabic ? 'إعادة المحاولة' : 'Try Again'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
