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
  const yesterday = counts.find((c) => c.date === "2026-05-10")!;
  const totalBilling = users.reduce((sum, u) => sum + totalOf(u), 0);

  // 要対応件数
  const mealsUnconfirmed = [today.confirmed.breakfast, today.confirmed.lunch, today.confirmed.dinner].filter((c) => !c).length;
  const goodsLow = 2;
  const billingUnconfirmed = users.length;
  const tasksUrgent = tasks.filter((t) => t.priority === "高" && t.status !== "完了").length;
  const importantHandovers = handovers.filter((h) => h.important).length;

  const impactEvents = users.filter((u) => ["入院中", "外泊中", "一時帰宅"].includes(u.status));

  return (
    <div className="space-y-6">
      {/* ===== ページタイトル ===== */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">ダッシュボード</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">2026年5月11日（月）／ あすか苑（仮）</p>
        </div>
      </div>

      {/* ===== 1段目：今日の要対応バー ===== */}
      <section className="card divide-x divide-ink-100 flex">
        <ActionItem
          href="/meals/2026-05-11"
          value={mealsUnconfirmed}
          unit="区分"
          label="食事 未確定"
          tone={mealsUnconfirmed > 0 ? "err" : "neutral"}
        />
        <ActionItem
          href="/goods"
          value={goodsLow}
          unit="品目"
          label="在庫不足"
          tone={goodsLow > 0 ? "warn" : "neutral"}
        />
        <ActionItem
          href="/billing"
          value={billingUnconfirmed}
          unit="件"
          label="未確定請求"
          tone={billingUnconfirmed > 0 ? "warn" : "neutral"}
        />
        <ActionItem
          href="/inbox/tasks"
          value={tasksUrgent}
          unit="件"
          label="期限間近タスク"
          tone={tasksUrgent > 0 ? "warn" : "neutral"}
        />
        <ActionItem
          href="/handovers"
          value={importantHandovers}
          unit="件"
          label="重要 申し送り"
          tone={importantHandovers > 0 ? "err" : "neutral"}
        />
      </section>

      {/* ===== 2段目：食事ステータス（主役） + 要対応タスク ===== */}
      <section className="grid grid-cols-12 gap-5">
        {/* 左：食事ステータス */}
        <div className="col-span-12 lg:col-span-7">
          <SectionHead title="本日の食事発注ステータス" right={<Link href="/meals/2026-05-11" className="text-[12px] text-brand-700 hover:underline">日別詳細 →</Link>} />
          <div className="card divide-x divide-ink-100 flex">
            <MealBlock
              label="朝食"
              state={today.confirmed.breakfast ? "confirmed" : "unconfirmed"}
              primary={`パン ${today.bread}`}
              secondary={`ジュース ${today.juice}`}
              confirmedAt={today.confirmed.breakfast ? "08:40" : undefined}
              diff={today.bread - yesterday.bread}
            />
            <MealBlock
              label="昼食"
              state={today.confirmed.lunch ? "confirmed" : "unconfirmed"}
              primary={`A社 ${today.lunchA}`}
              secondary={`B社 ${today.lunchB}`}
              deadline={vendors[0].deadlineTime}
              countdown={timeToDeadline(vendors[0].deadlineTime)}
              unconfirmedUsers={3}
              diff={(today.lunchA + today.lunchB) - (yesterday.lunchA + yesterday.lunchB)}
              showActions
            />
            <MealBlock
              label="夕食"
              state="pending"
              primary={`A社 ${today.dinnerA}`}
              secondary={`B社 ${today.dinnerB}`}
              deadline="15:00"
              diff={(today.dinnerA + today.dinnerB) - (yesterday.dinnerA + yesterday.dinnerB)}
            />
          </div>
        </div>

        {/* 右：要対応タスク */}
        <div className="col-span-12 lg:col-span-5">
          <SectionHead title="今日の要対応タスク" right={<Link href="/inbox/tasks" className="text-[12px] text-brand-700 hover:underline">すべて →</Link>} />
          <div className="card">
            <div className="px-3 pt-2.5 pb-2 flex gap-1 text-[11px] border-b border-ink-100">
              <Segment active>緊急 ({tasksUrgent})</Segment>
              <Segment>本日中</Segment>
              <Segment>今週中</Segment>
            </div>
            <ul className="divide-y divide-ink-100">
              {tasks.slice(0, 5).map((t) => (
                <li key={t.id} className="px-3 py-2.5 hover:bg-ink-50/60 flex items-center gap-2 text-[13px]">
                  <Priority p={t.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="text-ink-900 truncate">{t.title}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      {t.userName ?? "—"} ／ 期限 <span className="num">{t.due}</span> ／ {t.assignee}
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-500 shrink-0">{t.status}</span>
                </li>
              ))}
            </ul>
            <div className="px-3 py-2 border-t border-ink-100 text-right">
              <button className="text-[12px] text-brand-700 hover:underline">＋ タスク追加</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3段目：影響イベント ===== */}
      <section>
        <SectionHead title="食事・請求に影響する利用者ステータス変化" right={<Link href="/users" className="text-[12px] text-brand-700 hover:underline">利用者一覧 →</Link>} />
        <div className="card">
          <ul className="divide-y divide-ink-100">
            {impactEvents.map((u) => {
              const period = u.id === "U2024-0002" ? "5/5〜5/13 退院予定"
                : u.id === "U2024-0004" ? "5/10〜5/12 親族宅"
                : u.id === "U2024-0009" ? "5/9〜5/11"
                : "—";
              const impact = "食事自動停止 ／ 固定費は通常請求";
              return (
                <li key={u.id} className="px-4 py-2.5 flex items-center gap-3 text-[13px] hover:bg-ink-50/60">
                  <Link href={`/users/${u.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline w-28 shrink-0">
                    {u.name}
                  </Link>
                  <span className="num text-[12px] text-ink-500 shrink-0 w-10">{u.room}</span>
                  <StatusChip s={u.status} />
                  <span className="text-[12px] text-ink-700 shrink-0">{period}</span>
                  <span className="text-[12px] text-ink-500 flex-1 truncate">影響：{impact}</span>
                  <button className="btn text-[11px] py-0.5">ステータス変更</button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ===== 4段目：運用サマリー（軽い一行）===== */}
      <section>
        <SectionHead title="運用サマリー" />
        <div className="card px-4 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px]">
          <Stat label="入居" value={occupied} unit="名" href="/users" />
          <Sep />
          <Stat label="入院" value={hospital} unit="名" tone={hospital > 0 ? "warn" : "neutral"} href="/users" />
          <Sep />
          <Stat label="外泊" value={overnight} unit="名" tone={overnight > 0 ? "warn" : "neutral"} href="/users" />
          <Sep />
          <Stat label="一時帰宅" value={homeVisit} unit="名" tone={homeVisit > 0 ? "warn" : "neutral"} href="/users" />
          <Sep />
          <Stat label="空室" value={vacancy} unit={`室 / ${capacity}`} />
          <Sep />
          <Stat label="今月請求予定" value={jpy(totalBilling)} tone="brand" href="/billing" />
          <Sep />
          <Stat label="未確定請求" value={billingUnconfirmed} unit="件" tone="warn" href="/billing" />
        </div>
      </section>

      {/* ===== 5段目：在庫アラート / 申し送り / アクティビティ ===== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <SectionHead title={`在庫アラート（${goodsLow}）`} right={<Link href="/goods" className="text-[12px] text-brand-700 hover:underline">発注候補 →</Link>} />
          <div className="card">
            <ul className="divide-y divide-ink-100 text-[12px]">
              <li className="px-3 py-2 flex items-center justify-between">
                <span>おむつ Lサイズ</span>
                <span className="text-ink-500 num">残 24 / 最低 40</span>
                <span className="text-warn-700 font-semibold text-[11px]">要発注</span>
              </li>
              <li className="px-3 py-2 flex items-center justify-between">
                <span>使い捨て手袋 M</span>
                <span className="text-ink-500 num">残 4 / 最低 10</span>
                <span className="text-err-700 font-semibold text-[11px]">切迫</span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <SectionHead title="申し送り（直近）" right={<Link href="/handovers" className="text-[12px] text-brand-700 hover:underline">一覧 →</Link>} />
          <div className="card">
            <ul className="divide-y divide-ink-100 text-[12px]">
              {handovers.slice(0, 4).map((h) => (
                <li key={h.id} className="px-3 py-2 flex gap-2">
                  <span className="text-ink-500 num shrink-0">{h.at.slice(11)}</span>
                  <span className="text-ink-600 shrink-0 w-12">{h.staff}</span>
                  <span className={"flex-1 truncate " + (h.important ? "text-err-700 font-semibold" : "text-ink-800")}>
                    {h.important && "★"}{h.userName ? `${h.userName} ` : ""}{h.content}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SectionHead title="アクティビティ" right={<Link href="/inbox/activity" className="text-[12px] text-brand-700 hover:underline">全件 →</Link>} />
          <div className="card">
            <details>
              <summary className="px-3 py-2.5 cursor-pointer list-none flex items-center justify-between text-[12px]">
                <span className="text-ink-700">過去24時間 {activities.length} 件</span>
                <span className="text-brand-700">▶ 展開</span>
              </summary>
              <ul className="divide-y divide-ink-100 text-[11px] border-t border-ink-100">
                {activities.map((a) => (
                  <li key={a.id} className="px-3 py-2">
                    <div className="num text-ink-500">{a.at}</div>
                    <div className="text-ink-800">{a.message}</div>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ========= サブコンポーネント ========= */

function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-2">
      <h2 className="text-[13px] font-semibold text-ink-700">{title}</h2>
      {right}
    </div>
  );
}

function ActionItem({
  href, value, unit, label, tone,
}: {
  href: string;
  value: number;
  unit: string;
  label: string;
  tone: "err" | "warn" | "neutral";
}) {
  const numCls =
    value === 0 ? "text-ink-400"
    : tone === "err" ? "text-err-700"
    : tone === "warn" ? "text-warn-700"
    : "text-ink-900";
  return (
    <Link
      href={href}
      className="flex-1 px-5 py-3 hover:bg-ink-50/60 transition-colors"
    >
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={"num font-bold text-[22px] " + numCls}>{value}</span>
        <span className="text-[11px] text-ink-500">{unit}</span>
      </div>
    </Link>
  );
}

function MealBlock({
  label, state, primary, secondary, deadline, countdown, confirmedAt, unconfirmedUsers, diff, showActions,
}: {
  label: string;
  state: "confirmed" | "unconfirmed" | "pending";
  primary: string;
  secondary: string;
  deadline?: string;
  countdown?: { hours: number; minutes: number; total: number };
  confirmedAt?: string;
  unconfirmedUsers?: number;
  diff?: number;
  showActions?: boolean;
}) {
  const stateCls =
    state === "confirmed" ? "bg-ok-50/40"
    : state === "unconfirmed" ? "bg-warn-50/40"
    : "";
  return (
    <div className={"flex-1 p-4 " + stateCls}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-semibold text-ink-800">{label}</span>
        <StateChip state={state} />
      </div>

      <div className="num text-[20px] font-bold text-ink-900 leading-tight">{primary}</div>
      <div className="num text-[14px] text-ink-700">{secondary}</div>

      <dl className="mt-3 space-y-0.5 text-[11px] text-ink-600">
        {confirmedAt && (
          <Row k="確定" v={`${confirmedAt}`} />
        )}
        {deadline && state !== "confirmed" && (
          <Row k="締切" v={deadline} />
        )}
        {countdown && countdown.total > 0 && state === "unconfirmed" && (
          <Row k="残り" v={<span className={countdown.total < 120 ? "text-err-700 font-semibold" : "text-warn-700 font-semibold"}>{countdown.hours}h {countdown.minutes}m</span>} />
        )}
        {unconfirmedUsers !== undefined && state === "unconfirmed" && (
          <Row k="未確定者" v={<span className="text-err-700 font-semibold">{unconfirmedUsers} 名</span>} />
        )}
        {diff !== undefined && diff !== 0 && (
          <Row k="前日比" v={<span className={diff > 0 ? "text-info-700" : "text-err-700"}>{diff > 0 ? `+${diff}` : diff}</span>} />
        )}
      </dl>

      {showActions && (
        <div className="mt-3 flex gap-2 text-[11px]">
          <Link href="/meals/2026-05-11" className="btn text-[11px] py-0.5 flex-1 justify-center">詳細</Link>
          <button className="btn btn-primary text-[11px] py-0.5 flex-1 justify-center">確定する</button>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-500">{k}</dt>
      <dd className="num">{v}</dd>
    </div>
  );
}

function StateChip({ state }: { state: "confirmed" | "unconfirmed" | "pending" }) {
  const map = {
    confirmed: { label: "✓ 確定済", cls: "bg-ok-50 text-ok-700 border-ok-600/30" },
    unconfirmed: { label: "⚠ 未確定", cls: "bg-warn-50 text-warn-700 border-warn-600/30" },
    pending: { label: "待機中", cls: "bg-ink-100 text-ink-600 border-ink-200" },
  };
  const s = map[state];
  return <span className={"text-[10px] px-1.5 py-0.5 rounded border font-semibold " + s.cls}>{s.label}</span>;
}

function StatusChip({ s }: { s: string }) {
  const map: Record<string, string> = {
    入居中: "bg-ok-50 text-ok-700 border-ok-600/30",
    入院中: "bg-err-50 text-err-700 border-err-600/30",
    外泊中: "bg-warn-50 text-warn-700 border-warn-600/30",
    一時帰宅: "bg-warn-50 text-warn-700 border-warn-600/30",
    退去済: "bg-ink-100 text-ink-600 border-ink-200",
  };
  return (
    <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold shrink-0 " + (map[s] ?? "")}>{s}</span>
  );
}

function Priority({ p }: { p: "高" | "中" | "低" }) {
  const map = {
    高: "bg-err-50 text-err-700 border-err-600/30",
    中: "bg-warn-50 text-warn-700 border-warn-600/30",
    低: "bg-ink-100 text-ink-700 border-ink-200",
  };
  return (
    <span className={"text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 " + map[p]}>{p}</span>
  );
}

function Segment({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={
        "px-2.5 py-1 rounded " +
        (active
          ? "bg-brand-600 text-white"
          : "text-ink-700 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}

function Stat({
  label, value, unit, tone, href,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "warn" | "brand" | "neutral";
  href?: string;
}) {
  const numCls =
    tone === "warn" ? "text-warn-700"
    : tone === "brand" ? "text-brand-700"
    : "text-ink-900";
  const inner = (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className={"num font-bold text-[15px] " + numCls}>{value}</span>
      {unit && <span className="text-[10px] text-ink-500">{unit}</span>}
    </span>
  );
  if (href) return <Link href={href} className="hover:underline">{inner}</Link>;
  return inner;
}

function Sep() {
  return <span className="text-ink-300">・</span>;
}
