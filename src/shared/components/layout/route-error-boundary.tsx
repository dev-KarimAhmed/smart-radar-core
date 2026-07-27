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

    return (
      <div className={styles.root}>
        <Card className={styles.card}>
          <CardHeader className={styles.header}>
            <ShieldAlert className={styles.icon} aria-hidden="true" />
            <CardTitle>عذراً، حدث خطأ غير متوقع</CardTitle>
            <CardDescription className={styles.description}>
              {getSovereignErrorMessage(this.state.error || { code: 'SYS_COMPONENT_CRASH' })}
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.content}>
            <p className={styles.body}>
              نواجه مشكلة مؤقتة في تحميل هذا الجزء. يرجى إعادة المحاولة مرة أخرى، وبقية الخدمات تعمل بشكل طبيعي.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
