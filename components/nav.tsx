"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  badge?: number;
  badgeTone?: "err" | "warn" | "info";
};

type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "受信トレイ",
    items: [
      { href: "/inbox/alerts", label: "アラート", badge: 6, badgeTone: "err" },
      { href: "/inbox/tasks", label: "タスク", badge: 5, badgeTone: "warn" },
      { href: "/inbox/announcements", label: "お知らせ", badge: 2 },
      { href: "/inbox/activity", label: "アクティビティ" },
    ],
  },
  {
    label: "運用",
    items: [
      { href: "/", label: "ダッシュボード" },
      { href: "/users", label: "利用者" },
      { href: "/meals", label: "食事発注" },
    ],
  },
  {
    label: "請求",
    items: [
      { href: "/billing", label: "月次請求", badge: 10, badgeTone: "warn" },
    ],
  },
  {
    label: "在庫・書類",
    items: [
      { href: "/goods", label: "日用品", badge: 2, badgeTone: "warn" },
      { href: "/documents", label: "書類・タスク", badge: 4, badgeTone: "warn" },
    ],
  },
  {
    label: "管理",
    items: [
      { href: "/settings/masters", label: "マスタ" },
      { href: "/admin/staff", label: "職員・権限" },
      { href: "/admin/audit-logs", label: "監査ログ" },
    ],
  },
];

export function SideMenu() {
  const pathname = usePathname();
  return (
    <div className="space-y-3">
      {/* 職員プロファイル */}
      <div className="card p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-ink-200 flex items-center justify-center text-ink-700 font-semibold">
            田
          </div>
          <div className="text-[12px] leading-tight">
            <div className="text-ink-500 text-[10px]">職員番号 1042</div>
            <div className="text-ink-900 font-semibold text-[13px] mt-0.5">田中 太郎</div>
            <div className="text-ink-500 mt-0.5 text-[11px]">事務担当 ／ あすか苑</div>
          </div>
        </div>
        <button className="mt-2.5 w-full btn justify-center text-[11px] py-1">
          施設切替 ▾
        </button>
      </div>

      {/* メニュー */}
      <nav className="card overflow-hidden">
        {groups.map((g, gi) => (
          <div key={g.label} className={gi > 0 ? "border-t border-ink-100" : ""}>
            <div className="px-3 pt-2.5 pb-1 text-[10px] text-ink-500 font-semibold tracking-wider uppercase">
              {g.label}
            </div>
            <ul>
              {g.items.map((it) => {
                const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={
                        "flex items-center justify-between px-3 py-1.5 text-[13px] border-l-[3px] " +
                        (active
                          ? "bg-brand-50 border-brand-600 text-brand-700 font-semibold"
                          : "border-transparent text-ink-800 hover:bg-ink-50")
                      }
                    >
                      <span>{it.label}</span>
                      {it.badge !== undefined && it.badge > 0 && (
                        <Badge n={it.badge} tone={it.badgeTone} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* サポート */}
      <div className="card p-3 text-[11px] text-ink-600">
        <div className="font-semibold text-ink-800 mb-0.5 text-[12px]">サポート</div>
        <p className="leading-relaxed">
          操作のご不明点は<br />
          管理者または Backlly まで
        </p>
      </div>
    </div>
  );
}

function Badge({ n, tone }: { n: number; tone?: "err" | "warn" | "info" }) {
  const cls =
    tone === "err" ? "bg-err-600 text-white"
    : tone === "warn" ? "bg-warn-600 text-white"
    : "bg-ink-300 text-ink-800";
  return (
    <span className={"inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded text-[10px] font-bold num " + cls}>
      {n > 99 ? "99+" : n}
    </span>
  );
}
