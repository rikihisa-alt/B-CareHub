"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildMonthMealCounts, monthTotal, vendors, type DayMealCount } from "@/lib/data";
import { useUsers, useMealConfirmations, useSingleCancellations, todayIso } from "@/lib/store";
import { downloadCsv, doPrint } from "@/components/ui/helpers";
import { toast } from "@/components/ui/toast";

export default function MealsPage() {
  const today = todayIso();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));

  const [users] = useUsers();
  const [confirmations] = useMealConfirmations();
  const [singleCancellations] = useSingleCancellations();

  const counts = useMemo(
    () => buildMonthMealCounts(year, month, users, singleCancellations, confirmations),
    [year, month, users, singleCancellations, confirmations],
  );
  const total = monthTotal(counts);

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const grid: (DayMealCount | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...counts,
  ];
  while (grid.length % 7 !== 0) grid.push(null);
  const weeks: (DayMealCount | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  function prev() { if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1); }
  function next() { if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1); }

  function exportCsv() {
    downloadCsv(`食事発注_${year}-${String(month).padStart(2, "0")}.csv`, [
      ["日付", "曜日", "朝パン", "朝ジュース", "昼A", "昼B", "夕A", "夕B", "キャンセル"],
      ...counts.map((c) => [
        c.date,
        ["日", "月", "火", "水", "木", "金", "土"][c.weekday],
        c.bread, c.juice, c.lunchA, c.lunchB, c.dinnerA, c.dinnerB, c.cancelCount,
      ]),
    ]);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">食事発注カレンダー</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            {year}年{month}月 ／ 業者別締切：A社 {vendors[0].deadlineTime} ／ B社 {vendors[1].deadlineTime} ／ パン {vendors[2].deadlineTime}
          </p>
        </div>
        <div className="flex gap-2 text-[12px] no-print">
          <button onClick={prev} className="btn">◀ 前月</button>
          <button onClick={next} className="btn">翌月 ▶</button>
          <Link href={`/meals/${today}`} className="btn">本日の日別詳細</Link>
          <button onClick={() => toast("業者別発注表は日別詳細から出力できます", "info")} className="btn">業者別発注表</button>
          <button onClick={doPrint} className="btn">印刷</button>
          <button onClick={exportCsv} className="btn">CSV</button>
        </div>
      </header>

      {users.length === 0 && (
        <div className="card p-5 text-center bg-info-50/30">
          <div className="text-[13px] text-ink-600 mb-3">利用者が登録されていないため食数は 0 です。</div>
          <Link href="/users" className="btn btn-primary">利用者を登録する</Link>
        </div>
      )}

      <div className="card p-3 grid grid-cols-2 md:grid-cols-7 gap-3 text-[13px]">
        <Total t="朝パン" v={total.bread} />
        <Total t="朝ジュース" v={total.juice} />
        <Total t="昼 A社" v={total.lunchA} />
        <Total t="昼 B社" v={total.lunchB} />
        <Total t="夕 A社" v={total.dinnerA} />
        <Total t="夕 B社" v={total.dinnerB} />
        <Total t="キャンセル合計" v={total.cancelCount} tone="warn" />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 text-[12px] font-semibold text-ink-600 bg-ink-50 border-b border-ink-200">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div key={d} className={"px-2 py-2 text-center border-r border-ink-200 last:border-r-0 " + (i === 0 ? "text-err-700" : i === 6 ? "text-info-700" : "")}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((c, i) => <DayCell key={i} c={c} prev={i > 0 ? weeks.flat()[i - 1] : null} />)}
        </div>
      </div>

      <div className="card p-3 text-[11px] text-ink-600 flex flex-wrap gap-x-5 gap-y-1">
        <span>🔒 確定済（全食事区分）</span>
        <span>◐ 一部確定（朝のみ等）</span>
        <span>⚠ キャンセル発生</span>
        <span>📌 業者特殊配達（土曜にA社が日曜分を含む）</span>
        <span>＋N / −N：前日比</span>
        <span>日曜のA社は配達なし</span>
      </div>
    </div>
  );
}

function Total({ t, v, tone }: { t: string; v: number; tone?: "warn" }) {
  return (
    <div>
      <div className="text-[11px] text-ink-500">{t}</div>
      <div className={"num text-[20px] font-bold " + (tone === "warn" ? "text-warn-700" : "text-ink-900")}>{v}</div>
    </div>
  );
}

function DayCell({ c, prev }: { c: DayMealCount | null; prev: DayMealCount | null }) {
  if (!c) return <div className="min-h-[128px] border-r border-b border-ink-100 bg-ink-50/40" />;
  const day = Number(c.date.slice(-2));
  const wkBg = c.weekday === 0 || c.isHoliday ? "bg-err-50/30" : c.weekday === 6 ? "bg-info-50/40" : "bg-white";
  const allConfirmed = c.confirmed.breakfast && c.confirmed.lunch && c.confirmed.dinner;
  const anyConfirmed = c.confirmed.breakfast || c.confirmed.lunch || c.confirmed.dinner;
  return (
    <Link href={`/meals/${c.date}`} className={"min-h-[128px] border-r border-b border-ink-100 p-1.5 text-[11px] block hover:bg-brand-50/30 " + wkBg}>
      <div className="flex items-center justify-between">
        <span className={"num font-semibold text-[13px] " + (c.weekday === 0 || c.isHoliday ? "text-err-700" : c.weekday === 6 ? "text-info-700" : "text-ink-900")}>{day}</span>
        <span className="flex items-center gap-0.5 text-[10px]">
          {allConfirmed ? <span title="全確定">🔒</span> : anyConfirmed ? <span title="一部確定">◐</span> : null}
          {c.cancelCount > 0 && <span title={`キャンセル${c.cancelCount}件`}>⚠</span>}
          {c.noteFlag && <span title="土曜：A社が日曜分含む">📌</span>}
        </span>
      </div>
      <div className="mt-1 space-y-0.5">
        <Line label="朝🍞" v={c.bread} prev={prev?.bread} />
        <Line label="朝🥤" v={c.juice} prev={prev?.juice} />
        <Line label="昼A" v={c.lunchA} prev={prev?.lunchA} />
        <Line label="昼B" v={c.lunchB} prev={prev?.lunchB} />
        <Line label="夕A" v={c.dinnerA} prev={prev?.dinnerA} />
        <Line label="夕B" v={c.dinnerB} prev={prev?.dinnerB} />
      </div>
    </Link>
  );
}

function Line({ label, v, prev }: { label: string; v: number; prev?: number }) {
  if (v === 0) return <div className="flex justify-between text-ink-300"><span>{label}</span><span className="num">—</span></div>;
  const diff = prev !== undefined ? v - prev : null;
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="num font-semibold text-ink-900">{v}</span>
        {diff !== null && diff !== 0 && (
          <span className={"text-[9px] num " + (diff > 0 ? "text-info-600" : "text-err-600")}>{diff > 0 ? `+${diff}` : diff}</span>
        )}
      </span>
    </div>
  );
}
