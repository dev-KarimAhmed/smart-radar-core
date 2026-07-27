'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const styles = {
  content: 'border-red-500/25 bg-[#0B0F19] text-white shadow-2xl',
  title: 'text-xl font-black text-white',
  description: 'text-sm leading-6 text-[#94A3B8] text-start',
  footer: 'gap-2 sm:justify-start sm:space-x-0',
  cancel: 'border-white/10 bg-white/10 font-bold text-white hover:bg-white/15',
  confirm: 'bg-red-600 font-black text-white hover:bg-red-500',
} as const;

interface LogoutDialogProps {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  direction: string;
  inProgressLabel: string;
  isInProgress: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}

export function LogoutDialog(props: LogoutDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent className={styles.content} dir={props.direction}>
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.title}>{props.title}</AlertDialogTitle>
          <AlertDialogDescription className={styles.description}>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={styles.footer}>
          <AlertDialogCancel disabled={props.isInProgress} className={styles.cancel}>
            {props.cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={props.isInProgress}
            onClick={(event) => {
              event.preventDefault();
              props.onConfirm();
            }}
            className={styles.confirm}
          >
            {props.isInProgress ? props.inProgressLabel : props.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
