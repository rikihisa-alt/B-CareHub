"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "ダッシュボード" },
  { href: "/users", label: "利用者" },
  { href: "/meals", label: "食事発注" },
  { href: "/billing", label: "月次請求" },
  { href: "/goods", label: "日用品" },
  { href: "/documents", label: "書類・タスク" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-t border-gray-100 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 flex gap-1">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors " +
                (active
                  ? "border-brand-500 text-brand-700 font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900")
              }
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
