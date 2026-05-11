import { buildMonthMealCounts, monthTotal, type DayMealCount } from "@/lib/data";

export default function MealsPage() {
  const year = 2026;
  const month = 5;
  const counts = buildMonthMealCounts(year, month);
  const total = monthTotal(counts);

  // 月の最初の曜日に合わせて空白セルを入れる
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const grid: (DayMealCount | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...counts,
  ];
  while (grid.length % 7 !== 0) grid.push(null);

  const weeks: (DayMealCount | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">食事発注カレンダー</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {year}年{month}月 — あすか苑（仮） / 朝パン・ジュース、昼A社・B社、夕A社・B社
          </p>
        </div>
        <div className="flex gap-2 text-sm no-print">
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            ◀ 前月
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            翌月 ▶
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            業者別発注表
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            印刷
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            CSV
          </button>
        </div>
      </div>

      {/* 月合計サマリ */}
      <div className="bg-white border border-gray-200 rounded-md p-3 grid grid-cols-2 md:grid-cols-7 gap-3 text-sm">
        <Total t="朝パン" v={total.bread} />
        <Total t="朝ジュース" v={total.juice} />
        <Total t="昼 A社" v={total.lunchA} />
        <Total t="昼 B社" v={total.lunchB} />
        <Total t="夕 A社" v={total.dinnerA} />
        <Total t="夕 B社" v={total.dinnerB} />
        <Total t="キャンセル" v={total.cancelCount} tone="warn" />
      </div>

      {/* カレンダー */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="grid grid-cols-7 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div
              key={d}
              className={
                "px-2 py-2 text-center border-r border-gray-200 last:border-r-0 " +
                (i === 0 ? "text-rose-700" : i === 6 ? "text-blue-700" : "")
              }
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((c, i) => (
            <DayCell key={i} c={c} />
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="text-xs text-gray-500 flex flex-wrap gap-4">
        <span>🔒 確定済み</span>
        <span>⚠ キャンセルあり</span>
        <span>📌 備考あり</span>
        <span>＋日 = 土曜にA社が日曜分も含めて配達</span>
        <span>日曜のA社は配達なし（前日土曜にまとめ済み）</span>
      </div>
    </div>
  );
}

function Total({ t, v, tone }: { t: string; v: number; tone?: "warn" }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{t}</div>
      <div className={"num text-xl font-bold " + (tone === "warn" ? "text-amber-700" : "text-gray-900")}>{v}</div>
    </div>
  );
}

function DayCell({ c }: { c: DayMealCount | null }) {
  if (!c) {
    return <div className="min-h-[112px] border-r border-b border-gray-100 bg-gray-50/50" />;
  }
  const day = Number(c.date.slice(-2));
  const wkBg =
    c.weekday === 0 || c.isHoliday ? "bg-rose-50/40"
    : c.weekday === 6 ? "bg-blue-50/40"
    : "bg-white";
  return (
    <div className={"min-h-[112px] border-r border-b border-gray-100 p-1.5 text-[11px] " + wkBg}>
      <div className="flex items-center justify-between">
        <span className={"num font-semibold " + (c.weekday === 0 || c.isHoliday ? "text-rose-700" : c.weekday === 6 ? "text-blue-700" : "text-gray-800")}>
          {day}
        </span>
        <span className="flex items-center gap-1">
          {c.confirmed && <span title="確定済">🔒</span>}
          {c.cancelCount > 0 && <span title={`キャンセル${c.cancelCount}件`}>⚠</span>}
          {c.noteFlag && <span title="土曜：日曜分含む">📌</span>}
        </span>
      </div>

      <div className="mt-1 space-y-0.5">
        <Line label="朝🍞" v={c.bread} />
        <Line label="朝🥤" v={c.juice} />
        <Line label="昼A" v={c.lunchA} />
        <Line label="昼B" v={c.lunchB} />
        <Line label="夕A" v={c.dinnerA} />
        <Line label="夕B" v={c.dinnerB} />
      </div>
    </div>
  );
}

function Line({ label, v }: { label: string; v: number }) {
  if (v === 0) {
    return (
      <div className="flex justify-between text-gray-300">
        <span>{label}</span>
        <span className="num">—</span>
      </div>
    );
  }
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="num font-semibold text-gray-900">{v}</span>
    </div>
  );
}
