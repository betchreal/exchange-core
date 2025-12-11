import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      <div
        className="relative w-full max-w-md my-8 rounded-xl border border-slate-200 bg-white shadow-xl max-h-[calc(100vh-4rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
