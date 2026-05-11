"use client";
import { useEffect, useState } from "react";

type ToastMsg = { id: number; message: string; tone: "ok" | "info" | "warn" | "err" };

let toastId = 0;

export function toast(message: string, tone: ToastMsg["tone"] = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("bch-toast", { detail: { id: ++toastId, message, tone } })
  );
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const m = (e as CustomEvent).detail as ToastMsg;
      setItems((cur) => [...cur, m]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== m.id)), 3000);
    };
    window.addEventListener("bch-toast", handler);
    return () => window.removeEventListener("bch-toast", handler);
  }, []);

  return (
    <div className="fixed top-16 right-5 z-50 space-y-2 pointer-events-none">
      {items.map((m) => (
        <div
          key={m.id}
          className={
            "card px-4 py-2.5 text-[13px] shadow-md min-w-[260px] border-l-4 pointer-events-auto " +
            (m.tone === "ok"
              ? "border-ok-600 text-ok-700"
              : m.tone === "warn"
              ? "border-warn-600 text-warn-700"
              : m.tone === "err"
              ? "border-err-600 text-err-700"
              : "border-info-600 text-info-700")
          }
        >
          {m.tone === "ok" ? "✓ " : m.tone === "warn" ? "⚠ " : m.tone === "err" ? "✕ " : "i "}
          {m.message}
        </div>
      ))}
    </div>
  );
}
