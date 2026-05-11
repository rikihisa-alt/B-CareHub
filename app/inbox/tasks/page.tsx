"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { tasks as initialTasks, users } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";

type Filter = "all" | "open" | "active" | "done" | "overdue";

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const list = useMemo(() => tasks.filter((t) => {
    if (filter === "open" && t.status === "完了") return false;
    if (filter === "active" && t.status !== "対応中") return false;
    if (filter === "done" && t.status !== "完了") return false;
    if (filter === "overdue" && (t.due >= "2026-05-12" || t.status === "完了")) return false;
    if (q && !`${t.title}${t.userName ?? ""}`.includes(q)) return false;
    return true;
  }), [tasks, filter, q]);

  function complete(id: string) {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, status: "完了" } : t));
    toast("タスクを完了にしました", "ok");
  }

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["タスク名", "対象利用者", "区分", "担当", "期限", "優先度", "ステータス"],
      ...list.map((t) => [t.title, t.userName ?? "—", t.category, t.assignee, t.due, t.priority, t.status]),
    ];
    downloadCsv(`タスク一覧.csv`, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">タスク</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">人手の作業項目。{tasks.length} 件登録 ／ {tasks.filter((t) => t.status !== "完了").length} 件 未完了。</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={exportCsv} className="btn text-[12px]">CSV</button>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary text-[12px]">＋ タスク追加</button>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>すべて ({tasks.length})</Chip>
        <Chip active={filter === "open"} onClick={() => setFilter("open")}>未完了 ({tasks.filter((t) => t.status !== "完了").length})</Chip>
        <Chip active={filter === "active"} onClick={() => setFilter("active")}>対応中</Chip>
        <Chip active={filter === "done"} onClick={() => setFilter("done")}>完了</Chip>
        <Chip active={filter === "overdue"} onClick={() => setFilter("overdue")}>期限超過</Chip>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="タスク名・利用者で検索" className="ml-auto px-3 py-1.5 border border-ink-200 rounded text-[12px] w-64" />
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
              <Th className="w-24 text-center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-[12px] text-ink-500">該当するタスクはありません</td></tr>
            )}
            {list.map((t) => (
              <tr key={t.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-2.5"><Priority p={t.priority} /></td>
                <td className="px-3 py-2.5 text-ink-900 font-medium">{t.title}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-700">{t.category}</td>
                <td className="px-3 py-2.5 text-[12px]">
                  {t.userId ? <Link href={`/users/${t.userId}`} className="text-brand-700 hover:underline">{t.userName} 様</Link> : <span className="text-ink-400">—</span>}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-ink-700">{t.assignee}</td>
                <td className="px-3 py-2.5 num text-[12px]">{t.due}</td>
                <td className="px-3 py-2.5 text-[12px]">{t.status}</td>
                <td className="px-3 py-2.5 text-center">
                  {t.status !== "完了" ? (
                    <button onClick={() => complete(t.id)} className="btn btn-primary text-[11px] py-0.5">完了</button>
                  ) : (
                    <span className="text-ink-300 text-[11px]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="タスク追加" footer={<><button className="btn text-[12px]" onClick={() => setAddOpen(false)}>取消</button><button className="btn btn-primary text-[12px]" onClick={() => { toast("タスクを追加しました", "ok"); setAddOpen(false); }}>保存</button></>}>
        <div className="space-y-3">
          <F label="タスク名"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="対象利用者">
            <select className="w-full px-3 py-2 border border-ink-200 rounded">
              <option value="">— なし（施設タスク）—</option>
              {users.map((u) => <option key={u.id}>{u.name}（{u.room}）</option>)}
            </select>
          </F>
          <div className="grid grid-cols-2 gap-3">
            <F label="期限"><input type="date" className="w-full px-3 py-2 border border-ink-200 rounded num" /></F>
            <F label="優先度"><select className="w-full px-3 py-2 border border-ink-200 rounded"><option>高</option><option>中</option><option>低</option></select></F>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-ink-600 mb-1">{label}</div>{children}</div>;
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={"px-3 py-2.5 text-[11px] font-semibold " + (className ?? "")}>{children}</th>;
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={"px-3 py-1.5 rounded border " + (active ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")}>
      {children}
    </button>
  );
}

function Priority({ p }: { p: "高" | "中" | "低" }) {
  const map = { 高: "bg-err-50 text-err-700 border-err-600/30", 中: "bg-warn-50 text-warn-700 border-warn-600/30", 低: "bg-ink-100 text-ink-700 border-ink-200" };
  return <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + map[p]}>{p}</span>;
}
