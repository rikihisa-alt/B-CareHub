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

  const tasks = [
    { status: "未対応", title: "鈴木タケ 様 — 病院連絡（5/12〆切）", period: "2026/05/12", category: "タスク" },
    { status: "未対応", title: "佐藤ヨシ子 様 — ケアマネ面談調整", period: "2026/05/15", category: "タスク" },
    { status: "未対応", title: "5月分 請求書作成・送付", period: "2026/05/31", category: "請求" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-[22px] font-semibold text-ink-900">ダッシュボード</h1>

      {/* あなたのタスク */}
      <section className="card">
        <div className="px-4 py-3 flex items-center justify-between border-b border-ink-100">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold">あなたのタスク</span>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-info-600 text-white text-[11px] font-bold num">
              {tasks.length}
            </span>
            <select className="ml-3 text-[12px] border border-ink-200 rounded px-2 py-1 bg-white">
              <option>未対応</option>
              <option>すべて</option>
              <option>完了</option>
            </select>
          </div>
          <span className="text-[12px] text-ink-500">{tasks.length} 件中 1 – {tasks.length} 件</span>
        </div>
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold w-24">ステータス</th>
              <th className="px-4 py-2 font-semibold">タスク名</th>
              <th className="px-4 py-2 font-semibold w-36">期間</th>
              <th className="px-4 py-2 font-semibold w-28">区分</th>
              <th className="px-4 py-2 font-semibold w-24 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={i} className="border-b border-ink-100 last:border-b-0">
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-info-600 text-white">
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-900">{t.title}</td>
                <td className="px-4 py-3 num text-ink-700">{t.period}</td>
                <td className="px-4 py-3 text-ink-700">{t.category}</td>
                <td className="px-4 py-3 text-center">
                  <Link href="/documents" className="btn btn-arrow text-[12px]">確認</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 2カラム：お知らせ + 通知 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="あすか苑からのお知らせ">
          <div className="px-4 py-3 space-y-3 text-[13px] text-ink-800">
            <div className="border border-ink-200 rounded p-3 bg-ink-50/50">
              <div className="font-semibold mb-1">【全スタッフへ】5月の食事発注ルール変更</div>
              <p className="leading-relaxed">
                5/15 より B社の昼食発注締切が 11:00 → 10:30 に変更になります。
                定期キャンセル登録は前日 18:00 までにお願いします。
              </p>
            </div>
            <div className="border border-ink-200 rounded p-3">
              <div className="font-semibold mb-1">入院・外泊登録の運用について</div>
              <p className="leading-relaxed">
                利用者の入院・外泊が発生したら、必ず当日中に利用者詳細から
                ステータス変更を行ってください。食事は自動で停止されます。
              </p>
            </div>
          </div>
        </Card>

        <Card title="通知" right={<Link href="#" className="text-[12px] text-brand-700 hover:underline">さらに表示</Link>}>
          <ul className="divide-y divide-ink-100 text-[13px]">
            <NotifyRow date="2026/05/11 08:40" title="本日の食事発注を確定しました（朝・昼・夕）" />
            <NotifyRow date="2026/05/10 17:20" title="鈴木タケ 様 のステータスが「入院中」に変更されました" />
            <NotifyRow date="2026/05/10 14:05" title="日用品「おむつ Lサイズ」の在庫が最低在庫を下回りました" />
            <NotifyRow date="2026/05/09 09:12" title="加藤一郎 様 が「一時帰宅」になりました（〜5/11）" />
          </ul>
        </Card>
      </section>

      {/* 本日と明日の食事発注 */}
      <section>
        <h2 className="text-[14px] font-semibold text-ink-700 mb-2">本日・明日の食事発注</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MealCard label="本日 2026/05/11（月）" data={today} confirmed />
          <MealCard label="明日 2026/05/12（火）" data={tomorrow} confirmed={false} />
        </div>
      </section>

      {/* KPI */}
      <section>
        <h2 className="text-[14px] font-semibold text-ink-700 mb-2">入居・財務サマリ</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPI label="入居中" value={occupied} unit="名" />
          <KPI label="入院・外泊・一時帰宅" value={hospital + overnight + homeVisit} unit="名" tone="warn" />
          <KPI label="空室" value={vacancy} unit={`室 / 定員 ${capacity}`} />
          <KPI label="今月の請求予定" value={jpy(totalBilling)} tone="brand" />
          <KPI label="未確定請求" value={users.length} unit="件" tone="warn" />
        </div>
      </section>

      {/* クイックリンク */}
      <section>
        <h2 className="text-[14px] font-semibold text-ink-700 mb-2">よく使う操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink href="/users" title="利用者台帳" desc="台帳・キーパーソン・関係機関を確認" />
          <QuickLink href="/meals" title="食事カレンダー" desc="月間の発注数とキャンセルを管理" />
          <QuickLink href="/billing" title="月次請求" desc="利用者別の請求予定額を一覧" />
          <QuickLink href="/goods" title="日用品" desc="在庫・利用者請求・発注候補" />
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="px-4 py-3 flex items-center justify-between border-b border-ink-100">
        <span className="text-[14px] font-semibold text-ink-900">{title}</span>
        {right}
      </div>
      <div>{children}</div>
    </div>
  );
}

function NotifyRow({ date, title }: { date: string; title: string }) {
  return (
    <li className="px-4 py-2.5 flex items-start gap-3">
      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-info-600 shrink-0" />
      <div className="flex-1">
        <div className="text-[11px] text-ink-500 num">{date}</div>
        <div className="text-ink-900 mt-0.5">{title}</div>
      </div>
      <button className="btn btn-arrow text-[12px]">確認</button>
    </li>
  );
}

function MealCard({
  label,
  data,
  confirmed,
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
    <div className="card">
      <div className="px-4 py-3 flex items-center justify-between border-b border-ink-100">
        <span className="text-[14px] font-semibold">{label}</span>
        <span
          className={
            "text-[11px] px-2 py-0.5 rounded font-semibold " +
            (confirmed
              ? "bg-ok-50 text-ok-700 border border-ok-600/30"
              : "bg-warn-50 text-warn-700 border border-warn-600/30")
          }
        >
          {confirmed ? "確定済" : "未確定"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-y-3 px-4 py-4 text-[13px]">
        <MealCell t="朝パン" v={data.bread} />
        <MealCell t="朝ジュース" v={data.juice} />
        <MealCell t="昼 A社" v={data.lunchA} />
        <MealCell t="昼 B社" v={data.lunchB} />
        <MealCell t="夕 A社" v={data.dinnerA} />
        <MealCell t="夕 B社" v={data.dinnerB} />
      </div>
      <div className="px-4 py-2.5 border-t border-ink-100 flex justify-between text-[12px]">
        <span className="text-ink-600">キャンセル {data.cancelCount} 件</span>
        <Link href="/meals" className="text-brand-700 hover:underline">カレンダーへ →</Link>
      </div>
    </div>
  );
}

function MealCell({ t, v }: { t: string; v: number }) {
  return (
    <div>
      <div className="text-[11px] text-ink-500">{t}</div>
      <div className="num text-[18px] font-bold text-ink-900 mt-0.5">{v}</div>
    </div>
  );
}

function KPI({
  label, value, unit, tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "warn" | "neutral" | "brand";
}) {
  const toneCls =
    tone === "warn" ? "text-warn-700"
    : tone === "brand" ? "text-brand-700"
    : "text-ink-900";
  return (
    <div className="card px-4 py-3">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className={"num font-bold mt-1 text-[20px] " + toneCls}>
        {value}
        {unit && <span className="text-[12px] ml-1 font-medium text-ink-600">{unit}</span>}
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="card px-4 py-3 hover:border-brand-300 hover:shadow-sm transition-all block group"
    >
      <div className="text-[14px] font-semibold text-ink-900 group-hover:text-brand-700">
        {title}
      </div>
      <div className="text-[11px] text-ink-500 mt-1">{desc}</div>
    </Link>
  );
}
