"use client";
import { useEffect } from "react";

function useDialogClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
}

function DialogHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
      <button
        onClick={onClose}
        aria-label="閉じる"
        className="text-ink-400 hover:text-ink-700 text-[18px] leading-none"
      >
        ×
      </button>
    </div>
  );
}

function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-t border-ink-100 bg-ink-50/40 flex justify-end gap-2">
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useDialogClose(open, onClose);
  if (!open) return null;

  const widthCls = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-3xl" : "max-w-lg";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white rounded-lg shadow-xl w-full ${widthCls}`}>
        <DialogHeader title={title} onClose={onClose} />
        <div className="px-5 py-4 text-[13px] text-ink-800 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useDialogClose(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        <DialogHeader title={title} onClose={onClose} />
        <div className="px-5 py-4 text-[13px] text-ink-800 flex-1 overflow-y-auto">
          {children}
        </div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </div>
    </div>
  );
}
