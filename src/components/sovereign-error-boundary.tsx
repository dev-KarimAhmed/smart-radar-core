'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShieldAlert } from 'lucide-react';
import { trackSovereignError } from '@/lib/error-tracker';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SovereignErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackSovereignError(error, { componentStack: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="border-destructive bg-destructive/10 text-destructive-foreground w-full max-w-md">
              <CardHeader className="items-center text-center">
                <ShieldAlert className="w-12 h-12 text-destructive" />
                <CardTitle>عذراً، حدث خطأ غير متوقع</CardTitle>
                <CardDescription className="text-destructive/80">
                  {getSovereignErrorMessage(this.state.error || { code: 'SYS_COMPONENT_CRASH' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm">
                    نواجه مشكلة مؤقتة في تحميل هذا الجزء. يرجى إعادة المحاولة مرة أخرى، وبقية الخدمات تعمل بشكل طبيعي.
                </p>
              </CardContent>
            </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
