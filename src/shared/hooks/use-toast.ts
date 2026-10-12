'use client';

import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}

type ToastListener = (toasts: Toast[]) => void;
const listeners = new Set<ToastListener>();
let toastMemory: Toast[] = [];

export const toast = (options: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: Toast = { id, ...options };
  
  // Limiting active notifications to keep UI clean and focused
  toastMemory = [newToast, ...toastMemory].slice(0, 3);
  listeners.forEach((listener) => listener(toastMemory));

  // Default auto-dismiss duration: 7500ms (7.5 seconds) instead of 3.5s
  const duration = options.duration ?? 7500;

  setTimeout(() => {
    toastMemory = toastMemory.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(toastMemory));
  }, duration);

  return {
    id,
    dismiss: () => {
      toastMemory = toastMemory.filter((t) => t.id !== id);
      listeners.forEach((listener) => listener(toastMemory));
    }
  };
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastMemory);

  useEffect(() => {
    const handleUpdate = (latestToasts: Toast[]) => {
      setToasts(latestToasts);
    };
    
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      toastMemory = toastMemory.filter((t) => t.id !== id);
      listeners.forEach((listener) => listener(toastMemory));
    }
  };
}

