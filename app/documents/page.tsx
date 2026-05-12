"use client";
import { useMemo, useState } from "react";
import { type DocItem, type Task } from "@/lib/data";
import { useDocuments, useTasks, useUsers, useFacilities, useCurrentFacilityId, logActivity, genId, todayIso, filterByFacility } from "@/lib/store";
import { FacilityLabel } from "@/components/facility-name";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Pill, PriorityPill, FilterChip, Field, Input, Select, ModalFooter } from "@/components/ui/primitives";

type DocDraft = Omit<DocItem, "id">;
type TaskDraft = Omit<Task, "id">;

function emptyDoc(): DocDraft {
  return { userId: undefined, userName: "", doc: "", status: "未回収", expires: "" };
}
function emptyTask(): TaskDraft {
  return { title: "", category: "書類", userId: undefined, userName: undefined, assignee: "田中 太郎", due: todayIso(), priority: "中", status: "未対応" };
}

export default function DocsTasksPage() {
  const [allDocs, setDocs] = useDocuments();
  const [allTasks, setTasks] = useTasks();
  const [allUsers] = useUsers();
  const [facilities] = useFacilities();
  const [currentFacilityId] = useCurrentFacilityId();
  const docs = useMemo(() => filterByFacility(allDocs, currentFacilityId), [allDocs, currentFacilityId]);
  const tasks = useMemo(() => filterByFacility(allTasks, currentFacilityId), [allTasks, currentFacilityId]);
  const users = useMemo(() => filterByFacility(allUsers, currentFacilityId), [allUsers, currentFacilityId]);
  const defaultFacilityId = currentFacilityId ?? facilities[0]?.id;

  const [docFilter, setDocFilter] = useState<"all" | "warn">("all");
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "done">("open");
  const [editingDoc, setEditingDoc] = useState<DocItem | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [docDraft, setDocDraft] = useState<DocDraft>(emptyDoc());
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyTask());

  const isWarn = (d: DocItem) => d.status === "未回収" || d.status === "期限間近" || d.status === "期限切れ";
  const warnCount = docs.filter(isWarn).length;

  const docList = useMemo(() => docs.filter((d) => docFilter === "all" || isWarn(d)), [docs, docFilter]);
  const taskList = useMemo(() => tasks.filter((t) =>
    taskFilter === "all" ? true : taskFilter === "open" ? t.status !== "完了" : t.status === "完了"
  ), [tasks, taskFilter]);

  function addDoc() {
    if (!docDraft.userName || !docDraft.doc.trim()) {
      toast("利用者と書類名を入力してください", "warn");
      return;
    }
    const u = allUsers.find((x) => x.id === docDraft.userId);
    const facilityId = u?.facilityId ?? defaultFacilityId;
    setDocs((cur) => [...cur, { id: genId("D"), facilityId, ...docDraft }]);
    logActivity(`書類「${docDraft.doc}」を ${docDraft.userName} 様 に登録`);
    toast("書類を登録しました", "ok");
    setNewDocOpen(false);
    setDocDraft(emptyDoc());
  }

  function saveDoc() {
    if (!editingDoc) return;
    setDocs((cur) => cur.map((d) => d.id === editingDoc.id ? editingDoc : d));
    logActivity(`書類「${editingDoc.doc}」を更新`);
    toast("書類を更新しました", "ok");
    setEditingDoc(null);
  }

  function deleteDoc(id: string) {
    setDocs((cur) => cur.filter((d) => d.id !== id));
    logActivity("書類を削除");
    toast("削除しました", "ok");
    setEditingDoc(null);
  }

  function addTask() {
    if (!taskDraft.title.trim()) {
      toast("タスク名を入力してください", "warn");
      return;
    }
    const user = allUsers.find((u) => u.id === taskDraft.userId);
    const facilityId = user?.facilityId ?? defaultFacilityId;
    setTasks((cur) => [{ id: genId("T"), facilityId, ...taskDraft, userName: user?.name }, ...cur]);
    logActivity(`タスク「${taskDraft.title}」を追加`);
    toast("タスクを追加しました", "ok");
    setNewTaskOpen(false);
    setTaskDraft(emptyTask());
  }

  function saveTask() {
    if (!editingTask) return;
    setTasks((cur) => cur.map((t) => t.id === editingTask.id ? editingTask : t));
    logActivity(`タスク「${editingTask.title}」を更新`);
    toast("タスクを保存しました", "ok");
    setEditingTask(null);
  }

  function completeTask(id: string) {
    setTasks((cur) => cur.map((t) => t.id === id ? { ...t, status: "完了" as const } : t));
    logActivity("タスクを完了");
    toast("完了にしました", "ok");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">書類・タスク管理</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">期限切れ・未回収・未完了を一元管理</p>
      </header>

      {/* 書類 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-semibold text-ink-800">書類管理</h2>
          <div className="flex gap-1 items-center">
            <FilterChip active={docFilter === "all"} onClick={() => setDocFilter("all")}>すべて ({docs.length})</FilterChip>
            <FilterChip active={docFilter === "warn"} onClick={() => setDocFilter("warn")}>要対応 ({warnCount})</FilterChip>
            <button onClick={() => { setDocDraft(emptyDoc()); setNewDocOpen(true); }} className="btn btn-sm btn-primary ml-2">＋ 書類追加</button>
          </div>
        </div>
        <div className="card overflow-x-auto">
          {docList.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] text-ink-500">
              {docs.length === 0 ? "書類はまだ登録されていません" : "該当する書類はありません"}
            </div>
          ) : (
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
                  <tr key={d.id} className={"border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60 " + (isWarn(d) ? "bg-warn-50/30" : "")}>
                    <td className="px-3 py-2.5 text-ink-900">{d.userName}</td>
                    <td className="px-3 py-2.5 text-ink-900">{d.doc}</td>
                    <td className="px-3 py-2.5 text-[12px]">{d.status}</td>
                    <td className="px-3 py-2.5 num text-[12px]">{d.expires || "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Pill tone={isWarn(d) ? "warn" : "ok"}>{isWarn(d) ? "要対応" : "OK"}</Pill>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => setEditingDoc(d)} className="btn btn-sm">編集</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* タスク */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-semibold text-ink-800">タスク</h2>
          <div className="flex gap-1 items-center">
            <FilterChip active={taskFilter === "open"} onClick={() => setTaskFilter("open")}>未完了 ({tasks.filter((t) => t.status !== "完了").length})</FilterChip>
            <FilterChip active={taskFilter === "done"} onClick={() => setTaskFilter("done")}>完了 ({tasks.filter((t) => t.status === "完了").length})</FilterChip>
            <FilterChip active={taskFilter === "all"} onClick={() => setTaskFilter("all")}>すべて ({tasks.length})</FilterChip>
            <button onClick={() => { setTaskDraft(emptyTask()); setNewTaskOpen(true); }} className="btn btn-sm btn-primary ml-2">＋ タスク追加</button>
          </div>
        </div>
        <div className="card overflow-x-auto">
          {taskList.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] text-ink-500">
              {tasks.length === 0 ? "タスクはまだ登録されていません" : "該当するタスクはありません"}
            </div>
          ) : (
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
                    <td className="px-3 py-2.5 text-ink-700">{t.userName ?? "—"}</td>
                    <td className="px-3 py-2.5 text-ink-700">{t.assignee}</td>
                    <td className="px-3 py-2.5 num">{t.due}</td>
                    <td className="px-3 py-2.5"><PriorityPill p={t.priority} /></td>
                    <td className="px-3 py-2.5 text-[12px]">{t.status}</td>
                    <td className="px-3 py-2.5 text-center flex gap-1 justify-center">
                      <button onClick={() => setEditingTask(t)} className="btn btn-sm">編集</button>
                      {t.status !== "完了" && <button onClick={() => completeTask(t.id)} className="btn btn-sm btn-primary">完了</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 書類追加 */}
      <Modal
        open={newDocOpen}
        onClose={() => setNewDocOpen(false)}
        title="書類を追加"
        footer={<ModalFooter onCancel={() => setNewDocOpen(false)} onConfirm={addDoc} confirmLabel="登録" />}
      >
        <div className="space-y-3">
          <Field label="利用者">
            <Select value={docDraft.userName} onChange={(e) => {
              const u = users.find((x) => x.name === e.target.value);
              setDocDraft({ ...docDraft, userName: e.target.value, userId: u?.id });
            }}>
              <option value="">— 選択 —</option>
              {users.map((u) => <option key={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="書類名"><Input value={docDraft.doc} onChange={(e) => setDocDraft({ ...docDraft, doc: e.target.value })} placeholder="例：介護保険証" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="回収状況">
              <Select value={docDraft.status} onChange={(e) => setDocDraft({ ...docDraft, status: e.target.value as DocItem["status"] })}>
                <option>未回収</option><option>期限間近</option><option>回収済</option><option>期限切れ</option>
              </Select>
            </Field>
            <Field label="有効期限"><Input type="date" value={docDraft.expires} onChange={(e) => setDocDraft({ ...docDraft, expires: e.target.value })} className="num" /></Field>
          </div>
        </div>
      </Modal>

      {/* 書類編集 */}
      <Modal
        open={editingDoc !== null}
        onClose={() => setEditingDoc(null)}
        title={`書類編集：${editingDoc?.doc ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => setEditingDoc(null)}
            onConfirm={saveDoc}
            extra={editingDoc && <button onClick={() => deleteDoc(editingDoc.id)} className="btn btn-sm text-err-700">削除</button>}
          />
        }
      >
        {editingDoc && (
          <div className="space-y-3">
            <Field label="利用者">{editingDoc.userName}</Field>
            <Field label="書類名"><Input value={editingDoc.doc} onChange={(e) => setEditingDoc({ ...editingDoc, doc: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="回収状況">
                <Select value={editingDoc.status} onChange={(e) => setEditingDoc({ ...editingDoc, status: e.target.value as DocItem["status"] })}>
                  <option>未回収</option><option>期限間近</option><option>回収済</option><option>期限切れ</option>
                </Select>
              </Field>
              <Field label="有効期限"><Input type="date" value={editingDoc.expires} onChange={(e) => setEditingDoc({ ...editingDoc, expires: e.target.value })} className="num" /></Field>
            </div>
          </div>
        )}
      </Modal>

      {/* タスク追加 */}
      <Modal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        title="タスク追加"
        footer={<ModalFooter onCancel={() => setNewTaskOpen(false)} onConfirm={addTask} confirmLabel="登録" />}
      >
        <div className="space-y-3">
          <Field label="タスク名"><Input value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="対象利用者">
              <Select value={taskDraft.userId ?? ""} onChange={(e) => setTaskDraft({ ...taskDraft, userId: e.target.value || undefined })}>
                <option value="">— なし —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label="区分">
              <Select value={taskDraft.category} onChange={(e) => setTaskDraft({ ...taskDraft, category: e.target.value as Task["category"] })}>
                <option>請求</option><option>ケア</option><option>書類</option><option>連絡</option><option>棚卸</option><option>その他</option>
              </Select>
            </Field>
            <Field label="期限"><Input type="date" value={taskDraft.due} onChange={(e) => setTaskDraft({ ...taskDraft, due: e.target.value })} className="num" /></Field>
            <Field label="優先度">
              <Select value={taskDraft.priority} onChange={(e) => setTaskDraft({ ...taskDraft, priority: e.target.value as Task["priority"] })}>
                <option>高</option><option>中</option><option>低</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      {/* タスク編集 */}
      <Modal
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        title={`タスク編集：${editingTask?.title ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => setEditingTask(null)}
            onConfirm={saveTask}
            extra={editingTask && <button onClick={() => { setTasks((cur) => cur.filter((t) => t.id !== editingTask.id)); toast("削除しました", "ok"); setEditingTask(null); }} className="btn btn-sm text-err-700">削除</button>}
          />
        }
      >
        {editingTask && (
          <div className="space-y-3">
            <Field label="タスク名"><Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="期限"><Input type="date" value={editingTask.due} onChange={(e) => setEditingTask({ ...editingTask, due: e.target.value })} className="num" /></Field>
              <Field label="優先度">
                <Select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task["priority"] })}>
                  <option>高</option><option>中</option><option>低</option>
                </Select>
              </Field>
              <Field label="ステータス">
                <Select value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task["status"] })}>
                  <option>未対応</option><option>対応中</option><option>完了</option><option>見送り</option>
                </Select>
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
