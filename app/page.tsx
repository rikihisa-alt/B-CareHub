import Link from "next/link";
import {
  users, totalOf, jpy, buildMonthMealCounts, alerts, tasks, handovers, activities,
  timeToDeadline, vendors,
} from "@/lib/data";

export default function DashboardPage() {
  const occupied = users.filter((u) => u.status === "入居中").length;
  const hospital = users.filter((u) => u.status === "入院中").length;
  const overnight = users.filter((u) => u.status === "外泊中").length;
  const homeVisit = users.filter((u) => u.status === "一時帰宅").length;
  const capacity = 16;
  const vacancy = capacity - users.filter((u) => u.status !== "退去済").length;

  const counts = buildMonthMealCounts(2026, 5);
  const today = counts.find((c) => c.date === "2026-05-11")!;
  const totalBilling = users.reduce((sum, u) => sum + totalOf(u), 0);

  const highAlerts = alerts.filter((a) => a.severity === "高");
  const highTasks = tasks.filter((t) => t.priority === "高" && t.status !== "完了");

  // 影響イベント（食事/請求に影響する利用者ステータス）
  const events = users
    .filter((u) => ["入院中", "外泊中", "一時帰宅"].includes(u.status))
    .map((u) => ({ user: u, note: u.note ?? u.status }));

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold text-ink-900">ダッシュボード</h1>

      {/* 1. インシデントバー（緊急アラート） */}
      {highAlerts.length > 0 && (
        <div className="bg-err-50 border-l-4 border-err-600 rounded-r-md">
          <div className="px-4 py-2.5 flex items-start gap-3">
            <span className="text-err-700 font-semibold text-[13px] shrink-0">⚠ 緊急 {highAlerts.length} 件</span>
            <ul className="flex-1 space-y-1">
              {highAlerts.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-ink-900">{a.message}</span>
                  <Link href={a.actionHref} className="btn btn-arrow text-[11px] py-0.5 shrink-0">
                    {a.actionLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 2. 本日の食事発注ステータス */}
      <section className="card">
        <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between">
          <span className="text-[14px] font-semibold">本日 5/11(月) の食事発注ステータス</span>
          <Link href="/meals/2026-05-11" className="text-[12px] text-brand-700 hover:underline">
            日別詳細へ →
          </Link>
        </div>
        <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <MealStatus label="朝食" confirmed={today.confirmed.breakfast} count={`パン ${today.bread} / ジュース ${today.juice}`} deadline="—" />
          <MealStatus
            label="昼食"
            confirmed={today.confirmed.lunch}
            count={`A社 ${today.lunchA} / B社 ${today.lunchB}`}
            deadline={`A社 ${vendors[0].deadlineTime}・B社 ${vendors[1].deadlineTime}`}
            warn={!today.confirmed.lunch}
          />
          <MealStatus label="夕食" confirmed={today.confirmed.dinner} count={`A社 ${today.dinnerA} / B社 ${today.dinnerB}`} deadline="A社 15:00" />
        </div>
      </section>

      {/* 3. 入居・財務 KPI */}
      <section className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <KPI label="入居中" value={occupied} unit="名" href="/users" />
        <KPI label="入院" value={hospital} unit="名" tone={hospital > 0 ? "warn" : "neutral"} href="/users" />
        <KPI label="外泊" value={overnight} unit="名" tone={overnight > 0 ? "warn" : "neutral"} href="/users" />
        <KPI label="一時帰宅" value={homeVisit} unit="名" tone={homeVisit > 0 ? "warn" : "neutral"} href="/users" />
        <KPI label="空室" value={vacancy} unit={`室 / ${capacity}`} />
        <KPI label="今月請求予定" value={jpy(totalBilling)} tone="brand" href="/billing" />
        <KPI label="未確定請求" value={users.length} unit="件" tone="warn" href="/billing" />
      </section>

      {/* 4. 影響イベント */}
      <section className="card">
        <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between">
          <span className="text-[14px] font-semibold">影響イベント（食事・請求に影響する利用者ステータス）</span>
          <Link href="/users" className="text-[12px] text-brand-700 hover:underline">全件 →</Link>
        </div>
        <ul className="divide-y divide-ink-100">
          {events.map(({ user, note }) => (
            <li key={user.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-[13px]">
              <span className="flex items-center gap-3">
                <StatusBadge s={user.status} />
                <Link href={`/users/${user.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                  {user.name} 様
                </Link>
                <span className="text-ink-500 text-[12px]">部屋 {user.room}</span>
                <span className="text-ink-700">— {note}</span>
              </span>
              <Link href={`/users/${user.id}`} className="btn btn-arrow text-[11px] py-0.5">
                ステータス変更
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. アラート + 6. タスク */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={`アラート（${alerts.length}）`} link={{ href: "/inbox/alerts", label: "すべて" }}>
          <ul className="divide-y divide-ink-100 text-[13px]">
            {alerts.slice(0, 5).map((a) => (
              <li key={a.id} className="px-4 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <SeverityDot s={a.severity} />
                    <div className="min-w-0">
                      <div className="text-ink-900">{a.message}</div>
                      <div className="text-[11px] text-ink-500 mt-0.5">{a.impact}</div>
                    </div>
                  </div>
                  <Link href={a.actionHref} className="btn btn-arrow text-[11px] py-0.5 shrink-0">
                    {a.actionLabel}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={`タスク（${highTasks.length} / ${tasks.length}）`} link={{ href: "/inbox/tasks", label: "すべて" }}>
          <ul className="divide-y divide-ink-100 text-[13px]">
            {tasks.slice(0, 5).map((t) => (
              <li key={t.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <PriorityPill p={t.priority} />
                    <div className="min-w-0">
                      <div className="text-ink-900 truncate">{t.title}</div>
                      <div className="text-[11px] text-ink-500 mt-0.5">
                        {t.userName ? `${t.userName} ／ ` : ""}期限 <span className="num">{t.due}</span> ／ {t.assignee}
                      </div>
                    </div>
                  </div>
                  <Link href="/inbox/tasks" className="btn text-[11px] py-0.5 shrink-0">
                    {t.status}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* 7. 申し送り */}
      <section className="card">
        <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between">
          <span className="text-[14px] font-semibold">申し送り（過去24時間）</span>
          <Link href="/users" className="text-[12px] text-brand-700 hover:underline">利用者ごとに見る →</Link>
        </div>
        <ul className="divide-y divide-ink-100 text-[13px]">
          {handovers.map((h) => (
            <li key={h.id} className="px-4 py-2.5 flex items-start gap-3">
              <span className="text-[11px] text-ink-500 num shrink-0 w-28">{h.at.slice(11)}</span>
              <span className="text-[11px] text-ink-500 shrink-0 w-16">{h.staff}</span>
              <span className="text-[12px] text-ink-700 shrink-0">{h.userName ?? "—"}</span>
              <span className={"flex-1 " + (h.important ? "text-err-700 font-semibold" : "text-ink-900")}>
                {h.important && <span className="mr-1">★</span>}{h.content}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 8. アクティビティ */}
      <section className="card">
        <details>
          <summary className="px-4 py-2.5 cursor-pointer flex items-center justify-between border-b border-ink-100 list-none">
            <span className="text-[14px] font-semibold">アクティビティログ（{activities.length}件）</span>
            <span className="text-[12px] text-brand-700">展開 ▾</span>
          </summary>
          <ul className="divide-y divide-ink-100 text-[12px]">
            {activities.map((a) => (
              <li key={a.id} className="px-4 py-2 flex gap-3">
                <span className="num text-ink-500 shrink-0 w-32">{a.at}</span>
                <span className="text-ink-600 shrink-0 w-24">{a.staff}</span>
                <span className="flex-1 text-ink-800">{a.message}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}

function MealStatus({
  label, confirmed, count, deadline, warn,
}: { label: string; confirmed: boolean; count: string; deadline: string; warn?: boolean }) {
  const t = !confirmed ? timeToDeadline("11:00") : null;
  return (
    <div className={"border rounded p-3 " + (warn ? "border-warn-600/40 bg-warn-50/40" : "border-ink-200 bg-white")}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-700">{label}</span>
        <span
          className={
            "text-[11px] px-2 py-0.5 rounded font-semibold " +
            (confirmed
              ? "bg-ok-50 text-ok-700 border border-ok-600/30"
              : "bg-warn-50 text-warn-700 border border-warn-600/30")
          }
        >
          {confirmed ? "✓ 確定済" : "⚠ 未確定"}
        </span>
      </div>
      <div className="num text-[16px] font-bold text-ink-900 mt-1.5">{count}</div>
      <div className="text-[11px] text-ink-500 mt-1">
        締切：{deadline}
        {t && t.total > 0 && (
          <span className={"ml-2 font-semibold " + (t.total < 120 ? "text-err-700" : "text-warn-700")}>
            （あと {t.hours}h {t.minutes}m）
          </span>
        )}
      </div>
    </div>
  );
}

function Card({
  title, link, children,
}: {
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-ink-100">
        <span className="text-[14px] font-semibold text-ink-900">{title}</span>
        {link && (
          <Link href={link.href} className="text-[12px] text-brand-700 hover:underline">
            {link.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function KPI({
  label, value, unit, tone = "neutral", href,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "warn" | "neutral" | "brand";
  href?: string;
}) {
  const toneCls =
    tone === "warn" ? "text-warn-700"
    : tone === "brand" ? "text-brand-700"
    : "text-ink-900";
  const inner = (
    <>
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className={"num font-bold mt-1 text-[18px] " + toneCls}>
        {value}
        {unit && <span className="text-[11px] ml-1 font-medium text-ink-600">{unit}</span>}
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="card px-3 py-2.5 hover:border-brand-300 transition-colors block">
        {inner}
      </Link>
    );
  }
  return <div className="card px-3 py-2.5">{inner}</div>;
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    入居中: "bg-ok-50 text-ok-700 border-ok-600/30",
    入院中: "bg-err-50 text-err-700 border-err-600/30",
    外泊中: "bg-warn-50 text-warn-700 border-warn-600/30",
    一時帰宅: "bg-warn-50 text-warn-700 border-warn-600/30",
    退去済: "bg-ink-100 text-ink-600 border-ink-200",
  };
  return (
    <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + (map[s] ?? "")}>{s}</span>
  );
}

function SeverityDot({ s }: { s: "高" | "中" | "低" }) {
  const cls = s === "高" ? "bg-err-600" : s === "中" ? "bg-warn-600" : "bg-info-600";
  return <span className={"mt-1.5 w-2 h-2 rounded-full shrink-0 " + cls} title={s} />;
}

function PriorityPill({ p }: { p: "高" | "中" | "低" }) {
  const cls = p === "高"
    ? "bg-err-50 text-err-700 border-err-600/30"
    : p === "中"
    ? "bg-warn-50 text-warn-700 border-warn-600/30"
    : "bg-ink-100 text-ink-700 border-ink-200";
  return (
    <span className={"text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 " + cls}>
      {p}
    </span>
  );
}
