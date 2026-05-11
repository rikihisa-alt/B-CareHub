"use client";

// ========= ステータスバッジ・ピル ============

const USER_STATUS_CLS: Record<string, string> = {
  入居中: "bg-ok-50 text-ok-700 border-ok-600/30",
  入院中: "bg-err-50 text-err-700 border-err-600/30",
  外泊中: "bg-warn-50 text-warn-700 border-warn-600/30",
  一時帰宅: "bg-warn-50 text-warn-700 border-warn-600/30",
  退去済: "bg-ink-100 text-ink-600 border-ink-200",
};

export function StatusBadge({ s, size = "sm" }: { s: string; size?: "sm" | "md" }) {
  const sz = size === "md" ? "text-[12px] px-2.5 py-1" : "text-[11px] px-2 py-0.5";
  return (
    <span className={`${sz} rounded border font-semibold shrink-0 ${USER_STATUS_CLS[s] ?? ""}`}>
      {s}
    </span>
  );
}

const PRIORITY_CLS: Record<"高" | "中" | "低", string> = {
  高: "bg-err-50 text-err-700 border-err-600/30",
  中: "bg-warn-50 text-warn-700 border-warn-600/30",
  低: "bg-ink-100 text-ink-700 border-ink-200",
};

export function PriorityPill({ p }: { p: "高" | "中" | "低" }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${PRIORITY_CLS[p]}`}>
      {p}
    </span>
  );
}

const SEVERITY_CLS: Record<"高" | "中" | "低", string> = {
  高: "bg-err-50 text-err-700 border-err-600/30",
  中: "bg-warn-50 text-warn-700 border-warn-600/30",
  低: "bg-info-50 text-info-700 border-info-600/30",
};

export function Severity({ s }: { s: "高" | "中" | "低" }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${SEVERITY_CLS[s]}`}>
      {s}
    </span>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "err" | "info" | "neutral";
  children: React.ReactNode;
}) {
  const cls = {
    ok: "bg-ok-50 text-ok-700 border-ok-600/30",
    warn: "bg-warn-50 text-warn-700 border-warn-600/30",
    err: "bg-err-50 text-err-700 border-err-600/30",
    info: "bg-info-50 text-info-700 border-info-600/30",
    neutral: "bg-ink-100 text-ink-700 border-ink-200",
  }[tone];
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${cls}`}>
      {children}
    </span>
  );
}

// ========= フィルタチップ ============

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded border text-[12px] transition-colors " +
        (active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}

export function Segment({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded text-[11px] " +
        (active ? "bg-brand-600 text-white" : "text-ink-700 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}

// ========= フォーム要素 ============

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-ink-600 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-ink-500 mt-0.5">{hint}</div>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={"w-full px-3 py-2 border border-ink-200 rounded text-[13px] " + (props.className ?? "")}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={"w-full px-3 py-2 border border-ink-200 rounded text-[13px] bg-white " + (props.className ?? "")}
    />
  );
}

// ========= テーブルヘッダーセル ============

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th className={`px-3 py-2.5 text-[11px] font-semibold ${alignCls} ${className ?? ""}`}>
      {children}
    </th>
  );
}

// ========= モーダルフッター（取消/保存 パターン） ============

export function ModalFooter({
  onCancel,
  onConfirm,
  cancelLabel = "取消",
  confirmLabel = "保存",
  destructive,
  extra,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <>
      {extra}
      <button onClick={onCancel} className="btn btn-sm">
        {cancelLabel}
      </button>
      <button
        onClick={onConfirm}
        className={"btn btn-sm " + (destructive ? "" : "btn-primary")}
      >
        {confirmLabel}
      </button>
    </>
  );
}

// ========= 食事ステート ============

export function MealStateChip({ state }: { state: "confirmed" | "unconfirmed" | "pending" }) {
  const map = {
    confirmed: { label: "✓ 確定済", cls: "bg-ok-50 text-ok-700 border-ok-600/30" },
    unconfirmed: { label: "⚠ 未確定", cls: "bg-warn-50 text-warn-700 border-warn-600/30" },
    pending: { label: "待機中", cls: "bg-ink-100 text-ink-600 border-ink-200" },
  }[state];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${map.cls}`}>
      {map.label}
    </span>
  );
}
