import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMonthMealCounts, buildDayDetail, vendors, timeToDeadline } from "@/lib/data";

export function generateStaticParams() {
  const counts = buildMonthMealCounts(2026, 5);
  return counts.map((c) => ({ date: c.date }));
}

export default function MealDayPage({ params }: { params: { date: string } }) {
  const ymd = params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return notFound();

  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];

  const counts = buildMonthMealCounts(y, m);
  const today = counts.find((c) => c.date === ymd);
  if (!today) return notFound();

  // 各業者・各食事区分の対象者リスト
  const breakfast = buildDayDetail(ymd, "breakfast");
  const lunchA = buildDayDetail(ymd, "lunch", "A社");
  const lunchB = buildDayDetail(ymd, "lunch", "B社");
  const dinnerA = buildDayDetail(ymd, "dinner", "A社");
  const dinnerB = buildDayDetail(ymd, "dinner", "B社");

  return (
    <div className="space-y-5">
      {/* パンくず */}
      <div className="text-[12px] text-ink-500">
        <Link href="/meals" className="hover:underline">食事発注カレンダー</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-400 num">{ymd}</span>
      </div>

      {/* ヘッダー */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-ink-900 leading-tight">
              <span className="num">{ymd.replace(/-/g, "/")}</span>
              <span className="ml-2 text-[14px] text-ink-500 font-normal">（{weekday}）</span>
              {today.isHoliday && <span className="ml-2 text-[12px] text-err-700">祝日</span>}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
              <StatusChip label="朝食" confirmed={today.confirmed.breakfast} deadline="—" />
              <StatusChip label="昼食" confirmed={today.confirmed.lunch} deadline={vendors[0].deadlineTime} showCountdown />
              <StatusChip label="夕食" confirmed={today.confirmed.dinner} deadline="15:00" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="btn btn-primary text-[12px]">発注確定</button>
            <button className="btn text-[12px]">食札 PDF</button>
            <button className="btn text-[12px]">業者別発注表</button>
          </div>
        </div>

        {/* サマリバー */}
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-ink-100">
          <Summary label="朝🍞" v={today.bread} />
          <Summary label="朝🥤" v={today.juice} />
          <Summary label="昼 A社" v={today.lunchA} />
          <Summary label="昼 B社" v={today.lunchB} />
          <Summary label="夕 A社" v={today.dinnerA} />
          <Summary label="夕 B社" v={today.dinnerB} />
        </div>
      </div>

      {/* 業者別タブ（簡易：全業者ブロックで縦並び） */}
      <VendorBlock
        title="朝食（パン・ジュース業者）"
        deadline={vendors[2].deadlineTime}
        confirmed={today.confirmed.breakfast}
        breakdowns={[
          { name: "パン", count: today.bread, list: breakfast.filter((x) => x.user.meal.breakfastBread) },
          { name: "ジュース", count: today.juice, list: breakfast.filter((x) => x.user.meal.breakfastJuice) },
        ]}
      />

      <VendorBlock
        title="昼食 A社"
        deadline={vendors[0].deadlineTime}
        confirmed={today.confirmed.lunch}
        showCountdown
        breakdowns={[{ name: "弁当", count: today.lunchA, list: lunchA }]}
      />

      <VendorBlock
        title="昼食 B社"
        deadline={vendors[1].deadlineTime}
        confirmed={today.confirmed.lunch}
        breakdowns={[{ name: "弁当", count: today.lunchB, list: lunchB }]}
      />

      <VendorBlock
        title="夕食 A社"
        deadline="15:00"
        confirmed={today.confirmed.dinner}
        breakdowns={[{ name: "弁当", count: today.dinnerA, list: dinnerA }]}
      />

      <VendorBlock
        title="夕食 B社"
        deadline="15:00"
        confirmed={today.confirmed.dinner}
        breakdowns={[{ name: "弁当", count: today.dinnerB, list: dinnerB }]}
      />
    </div>
  );
}

function StatusChip({
  label, confirmed, deadline, showCountdown,
}: { label: string; confirmed: boolean; deadline: string; showCountdown?: boolean }) {
  const t = !confirmed && showCountdown ? timeToDeadline(deadline === "—" ? "23:59" : deadline) : null;
  return (
    <span
      className={
        "px-2 py-1 rounded border text-[11px] font-semibold " +
        (confirmed
          ? "bg-ok-50 text-ok-700 border-ok-600/30"
          : t && t.total < 120
          ? "bg-err-50 text-err-700 border-err-600/30"
          : "bg-warn-50 text-warn-700 border-warn-600/30")
      }
    >
      {label}：{confirmed ? "✓ 確定済" : `⚠ 未確定（締切 ${deadline}${t && t.total > 0 ? `, あと ${t.hours}h ${t.minutes}m` : ""}）`}
    </span>
  );
}

function Summary({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="num text-[22px] font-bold text-ink-900 mt-0.5">{v}</div>
    </div>
  );
}

function VendorBlock({
  title, deadline, confirmed, showCountdown, breakdowns,
}: {
  title: string;
  deadline: string;
  confirmed: boolean;
  showCountdown?: boolean;
  breakdowns: { name: string; count: number; list: ReturnType<typeof buildDayDetail> }[];
}) {
  const t = !confirmed && showCountdown ? timeToDeadline(deadline) : null;
  return (
    <section className="card">
      <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between bg-ink-50/40">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{title}</span>
          <span className="text-[11px] text-ink-500">締切 {deadline}</span>
          {t && t.total > 0 && (
            <span className={"text-[11px] font-semibold " + (t.total < 120 ? "text-err-700" : "text-warn-700")}>
              あと {t.hours}h {t.minutes}m
            </span>
          )}
          <span
            className={
              "ml-2 text-[11px] px-2 py-0.5 rounded border font-semibold " +
              (confirmed
                ? "bg-ok-50 text-ok-700 border-ok-600/30"
                : "bg-warn-50 text-warn-700 border-warn-600/30")
            }
          >
            {confirmed ? "✓ 確定済" : "⚠ 未確定"}
          </span>
        </div>
        <div className="flex gap-2 text-[11px]">
          {!confirmed && <button className="btn btn-primary text-[11px] py-0.5">この区分を確定</button>}
          <button className="btn text-[11px] py-0.5">+ 当日追加</button>
          <button className="btn text-[11px] py-0.5">手動調整</button>
        </div>
      </div>

      <div className="divide-y divide-ink-100">
        {breakdowns.map((b, i) => {
          const targets = b.list.filter((x) => x.status === "対象");
          const stopped = b.list.filter((x) => x.status === "ステータス連動停止");
          const regular = b.list.filter((x) => x.status === "定期キャンセル");
          return (
            <div key={i} className="p-4 text-[13px]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-ink-800">{b.name}</span>
                <span className="num text-[20px] font-bold text-brand-700">{b.count} 食</span>
              </div>

              <PeopleList title={`対象 ${targets.length} 名`} items={targets} tone="ok" />
              {regular.length > 0 && (
                <PeopleList title={`定期キャンセル ${regular.length} 名`} items={regular} tone="warn" />
              )}
              {stopped.length > 0 && (
                <PeopleList title={`ステータス連動停止 ${stopped.length} 名`} items={stopped} tone="err" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PeopleList({
  title, items, tone,
}: { title: string; items: ReturnType<typeof buildDayDetail>; tone: "ok" | "warn" | "err" }) {
  const cls = tone === "ok"
    ? "text-ok-700 bg-ok-50/60"
    : tone === "warn"
    ? "text-warn-700 bg-warn-50/60"
    : "text-err-700 bg-err-50/60";
  return (
    <div className="mb-2 last:mb-0">
      <div className={"text-[11px] font-semibold px-2 py-1 rounded inline-block mb-1.5 " + cls}>
        {title}
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[12px]">
        {items.map((x) => (
          <li key={x.user.id} className="flex items-center gap-2 px-2 py-1 bg-ink-50/60 rounded">
            <span className="num text-ink-500 w-10">{x.user.room}</span>
            <Link href={`/users/${x.user.id}`} className="text-ink-900 hover:text-brand-700 hover:underline flex-1 truncate">
              {x.user.name}
            </Link>
            <span className="text-[10px] text-ink-500">{x.user.meal.form}</span>
            {x.user.allergies.length > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-err-100 text-err-700 font-semibold">
                🚨 {x.user.allergies.map((a) => a.name).join("・")}
              </span>
            )}
            {x.reason && <span className="text-[10px] text-ink-500">{x.reason}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
