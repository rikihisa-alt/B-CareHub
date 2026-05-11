import Link from "next/link";
import { tasks } from "@/lib/data";

export default function TasksPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">タスク</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            人手の作業項目。{tasks.length} 件登録 ／ {tasks.filter((t) => t.status === "未対応").length} 件 未対応。
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button className="btn text-[12px]">CSV</button>
          <button className="btn btn-primary text-[12px]">＋ タスク追加</button>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <Chip active>すべて ({tasks.length})</Chip>
        <Chip>未対応</Chip>
        <Chip>対応中</Chip>
        <Chip>完了</Chip>
        <Chip>期限超過</Chip>
        <div className="ml-auto">
          <input type="search" placeholder="タスク名・利用者で検索" className="px-3 py-1.5 border border-ink-200 rounded text-[12px] w-64" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <Th className="w-16">優先度</Th>
              <Th>タスク名</Th>
              <Th className="w-24">区分</Th>
              <Th className="w-32">対象利用者</Th>
              <Th className="w-24">担当</Th>
              <Th className="w-28">期限</Th>
              <Th className="w-24">ステータス</Th>
              <Th className="w-28 text-center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-2.5"><Priority p={t.priority} /></td>
                <td className="px-3 py-2.5 text-ink-900 font-medium">{t.title}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-700">{t.category}</td>
                <td className="px-3 py-2.5 text-[12px]">
                  {t.userId ? (
                    <Link href={`/users/${t.userId}`} className="text-brand-700 hover:underline">
                      {t.userName} 様
                    </Link>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-ink-700">{t.assignee}</td>
                <td className="px-3 py-2.5 num text-[12px]">{t.due}</td>
                <td className="px-3 py-2.5 text-[12px]">{t.status}</td>
                <td className="px-3 py-2.5 text-center">
                  <button className="btn text-[11px] py-0.5">完了</button>
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
        (active ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}
function Priority({ p }: { p: "高" | "中" | "低" }) {
  const map = {
    高: "bg-err-50 text-err-700 border-err-600/30",
    中: "bg-warn-50 text-warn-700 border-warn-600/30",
    低: "bg-ink-100 text-ink-700 border-ink-200",
  };
  return (
    <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + map[p]}>{p}</span>
  );
}
