"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  useUsers, useTasks, useHandovers, useGoods, useDocuments,
  useMealConfirmations, useBillingConfirmations, useUtilityBills, todayIso,
} from "@/lib/store";

type Item = {
  href: string;
  label: string;
  badge?: number;
  badgeTone?: "err" | "warn" | "info";
};

type Group = { label: string; items: Item[] };

export function SideMenu() {
  const pathname = usePathname();

  // 実データからバッジ数を算出
  const [users] = useUsers();
  const [tasks] = useTasks();
  const [handovers] = useHandovers();
  const [goods] = useGoods();
  const [documents] = useDocuments();
  const [mealConfirmations] = useMealConfirmations();
  const [billingConfirmations] = useBillingConfirmations();
  const [utilityBills] = useUtilityBills();

  const groups = useMemo<Group[]>(() => {
    const today = todayIso();
    const ym = today.slice(0, 7);

    // 光熱費：当月の未払い件数
    const utilityUnpaid = utilityBills.filter((b) => b.ym === ym && b.status === "未払い").length;

    // 食事発注：本日の未確定 区分数
    const todayConf = mealConfirmations[today] ?? {};
    const hasMealUsers = users.some((u) => u.status === "入居中" && (u.meal.breakfastBread || u.meal.breakfastJuice || u.meal.lunchVendor !== "なし" || u.meal.dinnerVendor !== "なし"));
    const mealUnconfirmed = hasMealUsers
      ? ["breakfast", "lunch", "dinner"].filter((k) => !(todayConf as Record<string, boolean | undefined>)[k]).length
      : 0;

    // 月次請求：当月未確定
    const billingUnconfirmed = users.filter((u) => !billingConfirmations[`${u.id}_${ym}`]).length;

    // 日用品：在庫不足
    const lowStock = goods.filter((g) => g.stock < g.min).length;

    // 申し送り：未読の重要のみ
    const importantHandovers = handovers.filter((h) => h.important).length;

    // 書類・タスク：要対応書類 + 期限超過/高優先度タスク
    const warnDocs = documents.filter((d) => d.status === "未回収" || d.status === "期限間近" || d.status === "期限切れ").length;
    const urgentTasks = tasks.filter((t) => t.status !== "完了" && (t.due < today || t.priority === "高")).length;
    const docsAndTasks = warnDocs + urgentTasks;

    return [
      {
        label: "運用",
        items: [
          { href: "/", label: "ダッシュボード" },
          { href: "/users", label: "利用者" },
          { href: "/meals", label: "食事発注", badge: mealUnconfirmed, badgeTone: "warn" },
          { href: "/billing", label: "月次請求", badge: billingUnconfirmed, badgeTone: "warn" },
          { href: "/utilities", label: "光熱費", badge: utilityUnpaid, badgeTone: "warn" },
          { href: "/goods", label: "日用品", badge: lowStock, badgeTone: "warn" },
        ],
      },
      {
        label: "共有",
        items: [
          { href: "/handovers", label: "申し送り", badge: importantHandovers, badgeTone: "err" },
          { href: "/documents", label: "書類・タスク", badge: docsAndTasks, badgeTone: "warn" },
          { href: "/inbox/activity", label: "アクティビティ" },
        ],
      },
      {
        label: "管理",
        items: [
          { href: "/settings/masters", label: "マスタ・データ管理" },
          { href: "/admin/staff", label: "職員・権限" },
          { href: "/admin/audit-logs", label: "監査ログ" },
        ],
      },
    ];
  }, [users, tasks, handovers, goods, documents, mealConfirmations, billingConfirmations]);

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

      {/* ヘルプリンク */}
      <div className="mt-6 px-3">
        <Link
          href="/help"
          className={
            "flex items-center gap-1.5 text-[11px] hover:underline " +
            (pathname === "/help" ? "text-brand-700 font-semibold" : "text-ink-500")
          }
        >
          <span>?</span>
          <span>使い方ガイド</span>
        </Link>
      </div>
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
