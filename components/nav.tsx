"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "ダッシュボード", icon: "■" },
  { href: "/users", label: "利用者", icon: "◉" },
  { href: "/meals", label: "食事発注", icon: "◎" },
  { href: "/billing", label: "月次請求", icon: "¥" },
  { href: "/goods", label: "日用品", icon: "▤" },
  { href: "/documents", label: "書類・タスク", icon: "✓" },
];

export function SideMenu() {
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      {/* 職員プロファイル */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-ink-200 flex items-center justify-center text-ink-700 font-semibold">
            田
          </div>
          <div className="text-[12px]">
            <div className="text-ink-500">職員番号 1042</div>
            <div className="text-ink-900 font-semibold text-[14px] leading-tight mt-0.5">
              田中 太郎
            </div>
            <div className="text-ink-500 mt-0.5">事務担当</div>
          </div>
        </div>
        <button className="mt-3 w-full btn justify-center text-[12px]">
          職員情報
        </button>
      </div>

      {/* メニュー */}
      <div className="card overflow-hidden">
        <div className="px-4 pt-3 pb-1 text-[11px] text-ink-500 font-semibold tracking-wider">
          メニュー
        </div>
        <ul>
          {items.map((it) => {
            const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={
                    "flex items-center justify-between px-4 py-2.5 text-[13px] border-l-2 " +
                    (active
                      ? "bg-brand-50 border-brand-600 text-brand-700 font-semibold"
                      : "border-transparent text-ink-800 hover:bg-ink-50")
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <span className={"text-[11px] " + (active ? "text-brand-600" : "text-ink-400")}>
                      {it.icon}
                    </span>
                    {it.label}
                  </span>
                  <span className={active ? "text-brand-600" : "text-ink-300"}>→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ヘルプ */}
      <div className="card p-4 text-[12px] text-ink-600">
        <div className="font-semibold text-ink-800 mb-1">サポート</div>
        <p className="leading-relaxed">
          操作方法のご不明点は<br />
          管理者または Backlly までご連絡ください。
        </p>
      </div>
    </div>
  );
}
