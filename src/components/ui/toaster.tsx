import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-lg flex justify-between items-start border text-slate-100 pointer-events-auto ${
            toast.variant === "destructive"
              ? "bg-red-950 border-red-500/50"
              : "bg-slate-900 border-slate-700"
          }`}
        >
          <div>
            <h4 className="font-bold text-sm text-white">{toast.title}</h4>
            {toast.description && (
              <p className="text-xs text-slate-300 mt-1">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-xs ml-4 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
