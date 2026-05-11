import Link from "next/link";
import { users, totalOf, jpy } from "@/lib/data";

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">利用者一覧</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            {users.length}名（入居中 {users.filter((u) => u.status === "入居中").length}名 ／ 入院 {users.filter((u) => u.status === "入院中").length}名 ／ 外泊 {users.filter((u) => u.status === "外泊中").length}名 ／ 一時帰宅 {users.filter((u) => u.status === "一時帰宅").length}名）
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button className="btn text-[12px]">CSV出力</button>
          <button className="btn text-[12px]">印刷</button>
          <button className="btn btn-primary text-[12px]">＋ 新規利用者</button>
        </div>
      </div>

      {/* フィルタ */}
      <div className="card p-3 flex flex-wrap gap-2 text-[12px] no-print">
        <Chip active>全件 ({users.length})</Chip>
        <Chip>入居中</Chip>
        <Chip>入院中</Chip>
        <Chip>外泊・一時帰宅</Chip>
        <Chip>退去済</Chip>
        <div className="ml-auto">
          <input
            type="search"
            placeholder="氏名・部屋番号で検索"
            className="px-3 py-1.5 border border-ink-200 rounded text-[12px] w-64"
          />
        </div>
      </div>

      {/* テーブル */}
      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200">
            <tr className="text-left text-ink-600">
              <Th className="w-14">部屋</Th>
              <Th>氏名</Th>
              <Th className="w-24">ステータス</Th>
              <Th className="w-24">介護度</Th>
              <Th className="w-44 text-center">食事設定</Th>
              <Th className="w-32 text-right">今月請求予定</Th>
              <Th className="w-16 text-center">書類</Th>
              <Th className="w-16 text-center">タスク</Th>
              <Th className="w-20 text-center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-3 num font-semibold text-ink-900">{u.room}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-ink-900">{u.name}</div>
                  <div className="text-[11px] text-ink-500">{u.kana} ・ {u.gender} {u.age}歳</div>
                </td>
                <td className="px-3 py-3"><StatusBadge s={u.status} /></td>
                <td className="px-3 py-3 text-ink-700">{u.careLevel}</td>
                <td className="px-3 py-3 text-center text-[11px] text-ink-700">
                  <MealIcons u={u} />
                </td>
                <td className="px-3 py-3 text-right num font-semibold text-ink-900">
                  {jpy(totalOf(u))}
                </td>
                <td className="px-3 py-3 text-center">
                  {u.unpaidDocs > 0 ? <Pill tone="warn">{u.unpaidDocs}</Pill> : <span className="text-ink-300">—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  {u.openTasks > 0 ? <Pill tone="warn">{u.openTasks}</Pill> : <span className="text-ink-300">—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  <Link href={`/users/${u.id}`} className="btn btn-arrow text-[12px]">確認</Link>
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
  return <th className={"px-3 py-2.5 text-[11px] font-semibold " + (className ?? "")}>{children}</th>;
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={
        "px-3 py-1.5 rounded border " +
        (active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
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

function Pill({ children, tone }: { children: React.ReactNode; tone: "warn" | "ok" }) {
  const cls = tone === "warn"
    ? "bg-warn-50 text-warn-700 border-warn-600/30"
    : "bg-ok-50 text-ok-700 border-ok-600/30";
  return (
    <span className={"inline-block min-w-[1.6rem] text-[11px] font-bold num px-1.5 py-0.5 rounded border " + cls}>
      {children}
    </span>
  );
}

function MealIcons({ u }: { u: typeof users[number] }) {
  return (
    <div className="flex justify-center gap-2 text-[11px] text-ink-700">
      <span>朝 {u.meal.breakfastBread ? "パン" : "—"}{u.meal.breakfastJuice ? "・🥤" : ""}</span>
      <span className="text-ink-300">|</span>
      <span>昼 {u.meal.lunchVendor === "なし" ? "—" : u.meal.lunchVendor}</span>
      <span className="text-ink-300">|</span>
      <span>夕 {u.meal.dinnerVendor === "なし" ? "—" : u.meal.dinnerVendor}</span>
    </div>
  );
}
