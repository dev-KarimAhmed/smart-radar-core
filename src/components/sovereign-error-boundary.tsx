'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { trackSovereignError } from '@/lib/error-tracker';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';

const styles = {
  style35_1: "flex items-center justify-center min-h-[60vh] p-4",
  style36_2: "border-destructive bg-destructive/10 text-destructive-foreground w-full max-w-md",
  style37_3: "items-center text-center",
  style38_4: "w-12 h-12 text-destructive",
  style40_5: "text-destructive/80",
  style44_6: "text-center",
  style45_7: "text-sm",
} as const;


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
        <div className={styles.style35_1}>
            <Card className={styles.style36_2}>
              <CardHeader className={styles.style37_3}>
                <ShieldAlert className={styles.style38_4} />
                <CardTitle>عذراً، حدث خطأ غير متوقع</CardTitle>
                <CardDescription className={styles.style40_5}>
                  {getSovereignErrorMessage(this.state.error || { code: 'SYS_COMPONENT_CRASH' })}
                </CardDescription>
              </CardHeader>
              <CardContent className={styles.style44_6}>
                <p className={styles.style45_7}>
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
