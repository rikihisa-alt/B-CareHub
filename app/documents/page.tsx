"use client";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Pill, PriorityPill, FilterChip, Field, Input, Select, ModalFooter } from "@/components/ui/primitives";

type Doc = { id: string; user: string; doc: string; status: string; expires: string; flag: "ok" | "warn" };
type Task = { id: string; title: string; user: string; assignee: string; due: string; priority: "高" | "中" | "低"; status: string };

const INITIAL_DOCS: Doc[] = [
  { id: "D1", user: "佐藤 ヨシ子", doc: "介護保険証", status: "回収済", expires: "2027-03-31", flag: "ok" },
  { id: "D2", user: "鈴木 タケ", doc: "介護保険証", status: "期限間近", expires: "2026-06-15", flag: "warn" },
  { id: "D3", user: "鈴木 タケ", doc: "負担割合証", status: "未回収", expires: "2026-07-31", flag: "warn" },
  { id: "D4", user: "高橋 正一", doc: "重要事項説明書", status: "回収済", expires: "—", flag: "ok" },
  { id: "D5", user: "中村 義雄", doc: "障害福祉サービス受給者証", status: "未回収", expires: "2026-09-30", flag: "warn" },
  { id: "D6", user: "山本 美子", doc: "訪問看護指示書", status: "期限間近", expires: "2026-05-31", flag: "warn" },
];

const INITIAL_TASKS: Task[] = [
  { id: "T1", title: "ケアマネ面談調整", user: "佐藤 ヨシ子", assignee: "田中", due: "2026-05-15", priority: "中", status: "未着手" },
  { id: "T2", title: "病院連絡（入院状況確認）", user: "鈴木 タケ", assignee: "田中", due: "2026-05-12", priority: "高", status: "進行中" },
  { id: "T3", title: "受給者証コピー回収", user: "中村 義雄", assignee: "鈴木", due: "2026-05-20", priority: "中", status: "未着手" },
  { id: "T4", title: "退去精算準備", user: "—", assignee: "田中", due: "2026-05-25", priority: "中", status: "未着手" },
  { id: "T5", title: "5月分 請求書作成", user: "—", assignee: "田中", due: "2026-05-31", priority: "高", status: "未着手" },
];

export default function DocsTasksPage() {
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [docFilter, setDocFilter] = useState<"all" | "warn">("all");
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "done">("open");
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const docList = useMemo(() => docs.filter((d) => docFilter === "all" || d.flag === "warn"), [docs, docFilter]);
  const taskList = useMemo(() => tasks.filter((t) =>
    taskFilter === "all" ? true : taskFilter === "open" ? t.status !== "完了" : t.status === "完了"
  ), [tasks, taskFilter]);

  function completeTask(id: string) {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, status: "完了" } : t));
    toast("タスクを完了にしました", "ok");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">書類・タスク管理</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">期限切れ・未回収・未完了を一元管理</p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-semibold text-ink-800">書類管理</h2>
          <div className="flex gap-1">
            <FilterChip active={docFilter === "all"} onClick={() => setDocFilter("all")}>すべて ({docs.length})</FilterChip>
            <FilterChip active={docFilter === "warn"} onClick={() => setDocFilter("warn")}>要対応 ({docs.filter((d) => d.flag === "warn").length})</FilterChip>
          </div>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr className="text-left">
                <th className="px-3 py-2.5 text-[11px] font-semibold">利用者</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">書類名</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">回収状況</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">有効期限</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold w-20 text-center">状態</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold w-20 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {docList.map((d) => (
                <tr key={d.id} className={"border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60 " + (d.flag === "warn" ? "bg-warn-50/30" : "")}>
                  <td className="px-3 py-2.5 text-ink-900">{d.user}</td>
                  <td className="px-3 py-2.5 text-ink-900">{d.doc}</td>
                  <td className="px-3 py-2.5 text-[12px]">{d.status}</td>
                  <td className="px-3 py-2.5 num text-[12px]">{d.expires}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Pill tone={d.flag === "warn" ? "warn" : "ok"}>{d.flag === "warn" ? "要対応" : "OK"}</Pill>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setEditingDoc(d)} className="btn btn-sm">編集</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-semibold text-ink-800">タスク</h2>
          <div className="flex gap-1">
            <FilterChip active={taskFilter === "open"} onClick={() => setTaskFilter("open")}>未完了 ({tasks.filter((t) => t.status !== "完了").length})</FilterChip>
            <FilterChip active={taskFilter === "done"} onClick={() => setTaskFilter("done")}>完了 ({tasks.filter((t) => t.status === "完了").length})</FilterChip>
            <FilterChip active={taskFilter === "all"} onClick={() => setTaskFilter("all")}>すべて ({tasks.length})</FilterChip>
          </div>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr className="text-left">
                <th className="px-3 py-2.5 text-[11px] font-semibold">タスク</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">利用者</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">担当</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">期限</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">優先度</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">ステータス</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold w-28 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {taskList.map((t) => (
                <tr key={t.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                  <td className="px-3 py-2.5 font-medium text-ink-900">{t.title}</td>
                  <td className="px-3 py-2.5 text-ink-700">{t.user}</td>
                  <td className="px-3 py-2.5 text-ink-700">{t.assignee}</td>
                  <td className="px-3 py-2.5 num">{t.due}</td>
                  <td className="px-3 py-2.5"><PriorityPill p={t.priority} /></td>
                  <td className="px-3 py-2.5 text-[12px]">{t.status}</td>
                  <td className="px-3 py-2.5 text-center flex gap-1 justify-center">
                    <button onClick={() => setEditingTask(t)} className="btn btn-sm">編集</button>
                    {t.status !== "完了" && (
                      <button onClick={() => completeTask(t.id)} className="btn btn-sm btn-primary">完了</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={editingDoc !== null}
        onClose={() => setEditingDoc(null)}
        title={`書類編集：${editingDoc?.doc ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => setEditingDoc(null)}
            onConfirm={() => {
              if (!editingDoc) return;
              setDocs((ds) => ds.map((d) => d.id === editingDoc.id ? { ...d, status: "回収済", flag: "ok" } : d));
              toast("書類を更新しました", "ok");
              setEditingDoc(null);
            }}
            confirmLabel="回収済にする"
          />
        }
      >
        {editingDoc && (
          <div className="space-y-3">
            <Field label="利用者">{editingDoc.user}</Field>
            <Field label="書類名">{editingDoc.doc}</Field>
            <Field label="回収状況">
              <Select defaultValue={editingDoc.status}>
                <option>未回収</option><option>期限間近</option><option>回収済</option><option>期限切れ</option>
              </Select>
            </Field>
            <Field label="有効期限">
              <Input type="date" defaultValue={editingDoc.expires !== "—" ? editingDoc.expires : ""} className="num" />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        title={`タスク編集：${editingTask?.title ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => setEditingTask(null)}
            onConfirm={() => { toast("タスクを保存しました", "ok"); setEditingTask(null); }}
          />
        }
      >
        {editingTask && (
          <div className="space-y-3">
            <Field label="タスク名"><Input defaultValue={editingTask.title} /></Field>
            <Field label="期限"><Input type="date" defaultValue={editingTask.due} className="num" /></Field>
            <Field label="優先度"><Select defaultValue={editingTask.priority}><option>高</option><option>中</option><option>低</option></Select></Field>
            <Field label="ステータス"><Select defaultValue={editingTask.status}><option>未着手</option><option>進行中</option><option>完了</option><option>見送り</option></Select></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
