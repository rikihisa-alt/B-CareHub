"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type Task } from "@/lib/data";
import { useTasks, useUsers, logActivity, genId, todayIso } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";
import { PriorityPill, FilterChip, Field, Input, Select, Th, ModalFooter } from "@/components/ui/primitives";

type Filter = "all" | "open" | "active" | "done" | "overdue";

export default function TasksPage() {
  const [tasks, setTasks] = useTasks();
  const [users] = useUsers();
  const today = todayIso();

  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Task, "id">>({
    title: "", category: "その他", userId: undefined, userName: undefined,
    assignee: "田中 太郎", due: today, priority: "中", status: "未対応",
  });

  const list = useMemo(() => tasks.filter((t) => {
    if (filter === "open" && t.status === "完了") return false;
    if (filter === "active" && t.status !== "対応中") return false;
    if (filter === "done" && t.status !== "完了") return false;
    if (filter === "overdue" && (t.due >= today || t.status === "完了")) return false;
    if (q && !`${t.title}${t.userName ?? ""}`.includes(q)) return false;
    return true;
  }), [tasks, filter, q, today]);

  function complete(id: string) {
    setTasks((cur) => cur.map((t) => t.id === id ? { ...t, status: "完了" as const } : t));
    logActivity("タスクを完了");
    toast("完了にしました", "ok");
  }

  function exportCsv() {
    downloadCsv("タスク一覧.csv", [
      ["タスク名", "対象利用者", "区分", "担当", "期限", "優先度", "ステータス"],
      ...list.map((t) => [t.title, t.userName ?? "—", t.category, t.assignee, t.due, t.priority, t.status]),
    ]);
  }

  function addTask() {
    if (!draft.title.trim()) {
      toast("タスク名を入力してください", "warn");
      return;
    }
    const user = users.find((u) => u.id === draft.userId);
    setTasks((cur) => [{ id: genId("T"), ...draft, userName: user?.name }, ...cur]);
    logActivity(`タスク「${draft.title}」を追加`);
    toast("タスクを追加しました", "ok");
    setAddOpen(false);
    setDraft({ title: "", category: "その他", userId: undefined, userName: undefined, assignee: "田中 太郎", due: today, priority: "中", status: "未対応" });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">タスク</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">人手の作業項目。{tasks.length} 件登録 ／ {tasks.filter((t) => t.status !== "完了").length} 件 未完了。</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={exportCsv} className="btn" disabled={tasks.length === 0}>CSV</button>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary">＋ タスク追加</button>
        </div>
      </header>

      <div className="card p-3 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>すべて ({tasks.length})</FilterChip>
        <FilterChip active={filter === "open"} onClick={() => setFilter("open")}>未完了 ({tasks.filter((t) => t.status !== "完了").length})</FilterChip>
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>対応中</FilterChip>
        <FilterChip active={filter === "done"} onClick={() => setFilter("done")}>完了</FilterChip>
        <FilterChip active={filter === "overdue"} onClick={() => setFilter("overdue")}>期限超過</FilterChip>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="タスク名・利用者で検索" className="ml-auto px-3 py-1.5 border border-ink-200 rounded text-[12px] w-64" />
      </div>

      <div className="card overflow-hidden">
        {list.length === 0 ? (
          <div className="px-3 py-12 text-center">
            <div className="text-[13px] text-ink-500 mb-3">{tasks.length === 0 ? "タスクはまだ登録されていません。" : "該当するタスクはありません。"}</div>
            {tasks.length === 0 && <button onClick={() => setAddOpen(true)} className="btn btn-primary">＋ 最初のタスクを追加する</button>}
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr>
                <Th className="w-16">優先度</Th>
                <Th>タスク名</Th>
                <Th className="w-24">区分</Th>
                <Th className="w-32">対象利用者</Th>
                <Th className="w-24">担当</Th>
                <Th className="w-28">期限</Th>
                <Th className="w-24">ステータス</Th>
                <Th className="w-24" align="center">操作</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                  <td className="px-3 py-2.5"><PriorityPill p={t.priority} /></td>
                  <td className="px-3 py-2.5 text-ink-900 font-medium">{t.title}</td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-700">{t.category}</td>
                  <td className="px-3 py-2.5 text-[12px]">
                    {t.userId ? <Link href={`/users/${t.userId}`} className="text-brand-700 hover:underline">{t.userName} 様</Link> : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-700">{t.assignee}</td>
                  <td className="px-3 py-2.5 num text-[12px]">{t.due}</td>
                  <td className="px-3 py-2.5 text-[12px]">{t.status}</td>
                  <td className="px-3 py-2.5 text-center">
                    {t.status !== "完了"
                      ? <button onClick={() => complete(t.id)} className="btn btn-sm btn-primary">完了</button>
                      : <span className="text-ink-300 text-[11px]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="タスク追加"
        footer={<ModalFooter onCancel={() => setAddOpen(false)} onConfirm={addTask} confirmLabel="登録" />}
      >
        <div className="space-y-3">
          <Field label="タスク名"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="対象利用者">
            <Select value={draft.userId ?? ""} onChange={(e) => setDraft({ ...draft, userId: e.target.value || undefined })}>
              <option value="">— なし（施設タスク）—</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}（{u.room}）</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="区分">
              <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Task["category"] })}>
                <option>請求</option><option>ケア</option><option>書類</option><option>連絡</option><option>棚卸</option><option>その他</option>
              </Select>
            </Field>
            <Field label="期限"><Input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} className="num" /></Field>
            <Field label="優先度">
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Task["priority"] })}>
                <option>高</option><option>中</option><option>低</option>
              </Select>
            </Field>
            <Field label="担当者"><Input value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} /></Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
