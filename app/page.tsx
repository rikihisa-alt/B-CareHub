import Link from "next/link";
import { users, totalOf, jpy, buildMonthMealCounts } from "@/lib/data";

export default function DashboardPage() {
  const occupied = users.filter((u) => u.status === "入居中").length;
  const hospital = users.filter((u) => u.status === "入院中").length;
  const overnight = users.filter((u) => u.status === "外泊中").length;
  const homeVisit = users.filter((u) => u.status === "一時帰宅").length;
  const capacity = 16;
  const vacancy = capacity - users.filter((u) => u.status !== "退去済").length;

  const counts = buildMonthMealCounts(2026, 5);
  const today = counts.find((c) => c.date === "2026-05-11")!;
  const tomorrow = counts.find((c) => c.date === "2026-05-12")!;

  const totalBilling = users.reduce((sum, u) => sum + totalOf(u), 0);
  const unconfirmed = users.length; // mock: 全件未確定

  const lowStockGoods = 3;
  const expiringDocs = 2;
  const openTasks = users.reduce((s, u) => s + u.openTasks, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">施設ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          本日 2026年5月11日（月）— あすか苑（仮）
        </p>
      </div>

      {/* 入居サマリ */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-2">入居状況</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPI label="入居中" value={occupied} unit="名" tone="ok" />
          <KPI label="入院中" value={hospital} unit="名" tone="warn" />
          <KPI label="外泊中" value={overnight} unit="名" tone="warn" />
          <KPI label="一時帰宅" value={homeVisit} unit="名" tone="warn" />
          <KPI label="空室" value={vacancy} unit="室" tone="neutral" sub={`定員 ${capacity}`} />
        </div>
      </section>

      {/* 食事サマリ */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-2">本日と明日の食事発注</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MealCard label="本日 5/11（月）" data={today} confirmed />
          <MealCard label="明日 5/12（火）" data={tomorrow} confirmed={false} />
        </div>
      </section>

      {/* 財務サマリ */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-2">今月の請求</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="今月の請求予定額" value={jpy(totalBilling)} tone="brand" big />
          <KPI label="未確定" value={unconfirmed} unit="件" tone="warn" />
          <KPI label="日用品 発注必要" value={lowStockGoods} unit="品目" tone="warn" />
          <KPI label="期限間近 書類" value={expiringDocs} unit="件" tone="warn" />
        </div>
      </section>

      {/* 要対応 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 mb-2">要対応リスト</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ListCard title="未完了タスク" count={openTasks} href="/documents" items={[
            "佐藤ヨシ子 様 — 5/15 ケアマネ面談調整",
            "鈴木タケ 様 — 病院連絡（5/12〆切）",
            "中村義雄 様 — 受給者証コピー回収",
          ]} />
          <ListCard title="入院・外泊中（食事自動停止）" count={hospital + overnight + homeVisit} href="/users" items={[
            "鈴木タケ 様 — 入院中（◯◯病院、5/5〜）",
            "田中久子 様 — 外泊中（5/10〜5/12）",
            "加藤一郎 様 — 一時帰宅（5/9〜5/11）",
          ]} />
        </div>
      </section>

      {/* Quick links */}
      <section className="border-t pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <QuickLink href="/users" label="利用者台帳を開く →" />
          <QuickLink href="/meals" label="食事カレンダーを開く →" />
          <QuickLink href="/billing" label="月次請求を確認する →" />
          <QuickLink href="/goods" label="日用品管理を開く →" />
        </div>
      </section>
    </div>
  );
}

function KPI({
  label, value, unit, tone = "neutral", big, sub,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "ok" | "warn" | "neutral" | "brand";
  big?: boolean;
  sub?: string;
}) {
  const toneCls =
    tone === "ok" ? "text-emerald-700"
    : tone === "warn" ? "text-amber-700"
    : tone === "brand" ? "text-brand-700"
    : "text-gray-900";
  return (
    <div className="bg-white border border-gray-200 rounded-md px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={"num font-bold mt-1 " + (big ? "text-2xl " : "text-xl ") + toneCls}>
        {value}
        {unit && <span className="text-sm ml-1 font-medium text-gray-600">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function MealCard({
  label, data, confirmed,
}: {
  label: string;
  data: {
    bread: number; juice: number;
    lunchA: number; lunchB: number;
    dinnerA: number; dinnerB: number;
    cancelCount: number;
  };
  confirmed: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-md">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <span
          className={
            "text-[11px] px-1.5 py-0.5 rounded " +
            (confirmed
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200")
          }
        >
          {confirmed ? "確定済" : "未確定"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <Cell t="朝パン" v={data.bread} />
        <Cell t="朝ジュース" v={data.juice} />
        <Cell t="昼A社" v={data.lunchA} />
        <Cell t="昼B社" v={data.lunchB} />
        <Cell t="夕A社" v={data.dinnerA} />
        <Cell t="夕B社" v={data.dinnerB} />
      </div>
      <div className="px-4 py-2 border-t border-gray-100 flex justify-between text-[11px] text-gray-500">
        <span>キャンセル {data.cancelCount} 件</span>
        <Link href="/meals" className="text-brand-600 hover:underline">カレンダーへ →</Link>
      </div>
    </div>
  );
}

function Cell({ t, v }: { t: string; v: number }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{t}</div>
      <div className="num text-lg font-bold">{v}</div>
    </div>
  );
}

function ListCard({
  title, count, items, href,
}: {
  title: string;
  count: number;
  items: string[];
  href: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-md">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="text-sm font-semibold">
          {title} <span className="text-gray-400 num">({count})</span>
        </div>
        <Link href={href} className="text-xs text-brand-600 hover:underline">
          一覧へ →
        </Link>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.map((it, i) => (
          <li key={i} className="px-4 py-2 text-sm text-gray-700">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-brand-50 hover:border-brand-200 text-gray-700"
    >
      {label}
    </Link>
  );
}
