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
    label: "運用",
    items: [
      { href: "/", label: "ダッシュボード" },
      { href: "/users", label: "利用者" },
      { href: "/meals", label: "食事発注", badge: 2, badgeTone: "warn" },
      { href: "/billing", label: "月次請求", badge: 10, badgeTone: "warn" },
      { href: "/goods", label: "日用品", badge: 2, badgeTone: "warn" },
    ],
  },
  {
    label: "共有",
    items: [
      { href: "/handovers", label: "申し送り", badge: 1, badgeTone: "err" },
      { href: "/documents", label: "書類・タスク", badge: 4, badgeTone: "warn" },
      { href: "/inbox/activity", label: "アクティビティ" },
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
    <nav className="text-[13px]">
      {groups.map((g, gi) => (
        <div key={g.label} className={gi > 0 ? "mt-5" : ""}>
          <div className="px-3 pb-1.5 text-[10px] text-ink-500 font-semibold tracking-wider uppercase">
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
                      "flex items-center justify-between px-3 h-8 rounded-r-md border-l-[3px] " +
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
  );
}

function Badge({ n, tone }: { n: number; tone?: "err" | "warn" | "info" }) {
  const cls =
    tone === "err" ? "bg-err-600 text-white"
    : tone === "warn" ? "bg-warn-600 text-white"
    : "bg-ink-300 text-ink-800";
  return (
    <span className={"inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded text-[10px] font-bold num " + cls}>
      {n > 99 ? "99+" : n}
    </span>
  );
}
