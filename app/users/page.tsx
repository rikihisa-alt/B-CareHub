import Link from "next/link";
import { users, totalOf, jpy } from "@/lib/data";

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">利用者一覧</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length}名（入居中 {users.filter((u) => u.status === "入居中").length}名 / 入院 {users.filter((u) => u.status === "入院中").length}名 / 外泊 {users.filter((u) => u.status === "外泊中").length}名 / 一時帰宅 {users.filter((u) => u.status === "一時帰宅").length}名）
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            CSV出力
          </button>
          <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            印刷
          </button>
          <button className="px-3 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600">
            + 新規利用者
          </button>
        </div>
      </div>

      {/* フィルタ */}
      <div className="bg-white border border-gray-200 rounded-md p-3 flex flex-wrap gap-2 text-sm no-print">
        <Chip active>全件 ({users.length})</Chip>
        <Chip>入居中</Chip>
        <Chip>入院中</Chip>
        <Chip>外泊・一時帰宅</Chip>
        <Chip>退去済</Chip>
        <div className="ml-auto">
          <input
            type="search"
            placeholder="氏名・部屋番号で検索"
            className="px-3 py-1 border border-gray-200 rounded-md text-sm"
          />
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-600">
              <Th className="w-16">部屋</Th>
              <Th>氏名</Th>
              <Th className="w-24">ステータス</Th>
              <Th className="w-24">介護度</Th>
              <Th className="w-32 text-center">食事設定</Th>
              <Th className="w-32 text-right">今月請求予定</Th>
              <Th className="w-20 text-center">書類</Th>
              <Th className="w-20 text-center">タスク</Th>
              <Th className="w-20"></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 num font-semibold">{u.room}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-[11px] text-gray-500">{u.kana} ・ {u.gender} {u.age}歳</div>
                </td>
                <td className="px-3 py-2.5"><StatusBadge s={u.status} /></td>
                <td className="px-3 py-2.5 text-gray-700">{u.careLevel}</td>
                <td className="px-3 py-2.5 text-center text-[11px] text-gray-700">
                  <MealIcons u={u} />
                </td>
                <td className="px-3 py-2.5 text-right num font-semibold">
                  {jpy(totalOf(u))}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {u.unpaidDocs > 0
                    ? <Badge tone="warn">{u.unpaidDocs}</Badge>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {u.openTasks > 0
                    ? <Badge tone="warn">{u.openTasks}</Badge>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={`/users/${u.id}`}
                    className="text-brand-600 hover:underline text-xs"
                  >
                    詳細 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={"px-3 py-2.5 text-xs font-semibold " + (className ?? "")}>{children}</th>;
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={
        "px-3 py-1 rounded-full border " +
        (active
          ? "bg-brand-500 text-white border-brand-500"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
      }
    >
      {children}
    </button>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    入居中: "bg-emerald-50 text-emerald-700 border-emerald-200",
    入院中: "bg-rose-50 text-rose-700 border-rose-200",
    外泊中: "bg-amber-50 text-amber-700 border-amber-200",
    一時帰宅: "bg-amber-50 text-amber-700 border-amber-200",
    退去済: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={"text-[11px] px-2 py-0.5 rounded border " + (map[s] ?? "")}>{s}</span>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "warn" | "ok" }) {
  const cls = tone === "warn"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span className={"inline-block min-w-[1.5rem] text-[11px] font-bold num px-1.5 py-0.5 rounded border " + cls}>
      {children}
    </span>
  );
}

function MealIcons({ u }: { u: typeof users[number] }) {
  return (
    <div className="flex justify-center gap-2 text-[11px]">
      <span title="朝食">朝 {u.meal.breakfastBread ? "🍞" : "—"}{u.meal.breakfastJuice ? "🥤" : ""}</span>
      <span title="昼食">昼 {u.meal.lunchVendor === "なし" ? "—" : u.meal.lunchVendor}</span>
      <span title="夕食">夕 {u.meal.dinnerVendor === "なし" ? "—" : u.meal.dinnerVendor}</span>
    </div>
  );
}
