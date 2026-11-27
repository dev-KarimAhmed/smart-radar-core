'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { trackSovereignError } from '@/lib/error-tracker';

const styles = {} as const;
void styles;

interface WhatsAppGroupErrorBoundaryProps {
  scope: string;
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface WhatsAppGroupErrorBoundaryState {
  hasError: boolean;
}

export class WhatsAppGroupErrorBoundary extends Component<
  WhatsAppGroupErrorBoundaryProps,
  WhatsAppGroupErrorBoundaryState
> {
  public state: WhatsAppGroupErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): WhatsAppGroupErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
      return;
    }
    trackSovereignError(error, {
      scope: `whatsapp_groups:${this.props.scope}`,
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
