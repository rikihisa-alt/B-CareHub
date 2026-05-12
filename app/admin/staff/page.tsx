"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type StaffMember } from "@/lib/data";
import { useStaff, useFacilities, logActivity, genId } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";
import { Pill, FilterChip, Field, Input, Select, ModalFooter } from "@/components/ui/primitives";

const ROLES: { id: StaffMember["roleId"]; name: string; desc: string }[] = [
  { id: "admin", name: "管理者", desc: "全機能・確定解除・マスタ・権限管理" },
  { id: "office", name: "事務担当", desc: "利用者・食事・請求・日用品・書類・タスク" },
  { id: "field", name: "現場スタッフ", desc: "食事閲覧・キャンセル登録・日用品使用記録・申し送り" },
  { id: "view", name: "閲覧専用", desc: "ダッシュボード・カレンダー・一部利用者情報のみ" },
];

const PERMISSIONS = [
  "利用者の閲覧", "利用者の編集", "ステータス変更", "食事カレンダー閲覧", "食事設定変更",
  "キャンセル登録", "発注確定", "発注確定解除", "月次請求閲覧", "請求項目編集", "請求確定", "請求確定解除",
  "日用品マスタ", "日用品使用登録", "書類管理", "タスク管理", "申し送り記載", "マスタ管理", "職員管理", "権限管理", "監査ログ閲覧",
];

type Draft = Omit<StaffMember, "id" | "role" | "lastLogin">;

function emptyDraft(facilityIds: string[], facilityLabel: string): Draft {
  return { name: "", roleId: "office", email: "", facilityIds, facility: facilityLabel, active: true };
}

function roleNameOf(id: StaffMember["roleId"]) {
  return ROLES.find((r) => r.id === id)?.name ?? id;
}

export default function StaffPage() {
  const [staff, setStaff] = useStaff();
  const [facilities] = useFacilities();
  const allFacilityIds = facilities.map((f) => f.id);
  const facilityLabel = facilities.map((f) => f.name).join("・") || "—";
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft(allFacilityIds, facilityLabel));
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<Draft>(emptyDraft(allFacilityIds, facilityLabel));

  const list = useMemo(() => staff.filter((s) => filter === "all" ? true : filter === "active" ? s.active : !s.active), [staff, filter]);
  const roleCounts = useMemo(() => {
    const m: Record<string, number> = {};
    staff.forEach((s) => { m[s.roleId] = (m[s.roleId] ?? 0) + 1; });
    return m;
  }, [staff]);

  function exportCsv() {
    downloadCsv("職員一覧.csv", [
      ["職員ID", "氏名", "ロール", "メール", "所属施設", "状態", "最終ログイン"],
      ...staff.map((s) => {
        const facilityNames = (s.facilityIds && s.facilityIds.length > 0)
          ? s.facilityIds.map((id) => facilities.find((f) => f.id === id)?.name ?? "—").join("・")
          : s.facility;
        return [s.id, s.name, s.role, s.email, facilityNames, s.active ? "有効" : "無効", s.lastLogin];
      }),
    ]);
  }

  function toggleActive(id: string) {
    setStaff((cur) => cur.map((s) => s.id === id ? { ...s, active: !s.active } : s));
    const s = staff.find((x) => x.id === id);
    logActivity(`職員「${s?.name}」を${s?.active ? "無効化" : "有効化"}`);
    toast("職員の状態を変更しました", "ok");
  }

  function addStaff() {
    if (!addDraft.name.trim() || !addDraft.email.trim()) {
      toast("氏名・メールを入力してください", "warn");
      return;
    }
    setStaff((cur) => [
      ...cur,
      { id: genId("S"), name: addDraft.name, roleId: addDraft.roleId, role: roleNameOf(addDraft.roleId), email: addDraft.email, facilityIds: addDraft.facilityIds, facility: addDraft.facility, active: addDraft.active, lastLogin: "—" },
    ]);
    logActivity(`職員「${addDraft.name}」を追加`);
    toast("職員を追加しました", "ok");
    setAddOpen(false);
    setAddDraft(emptyDraft(allFacilityIds, facilityLabel));
  }

  function saveEdit() {
    if (!editing) return;
    if (!editDraft.name.trim() || !editDraft.email.trim()) {
      toast("氏名・メールを入力してください", "warn");
      return;
    }
    setStaff((cur) => cur.map((s) => s.id === editing.id
      ? { ...s, name: editDraft.name, roleId: editDraft.roleId, role: roleNameOf(editDraft.roleId), email: editDraft.email, facilityIds: editDraft.facilityIds, facility: editDraft.facility, active: editDraft.active }
      : s
    ));
    logActivity(`職員「${editDraft.name}」を更新`);
    toast("職員情報を保存しました", "ok");
    setEditing(null);
  }

  function removeStaff(id: string) {
    const s = staff.find((x) => x.id === id);
    if (!s) return;
    if (!window.confirm(`職員「${s.name}」を削除します。よろしいですか？`)) return;
    setStaff((cur) => cur.filter((x) => x.id !== id));
    logActivity(`職員「${s.name}」を削除`);
    toast("職員を削除しました", "ok");
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">職員・権限</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">職員 {staff.filter((s) => s.active).length} 名 有効 ／ {ROLES.length} ロール</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn" disabled={staff.length === 0}>CSV エクスポート</button>
          <button onClick={() => { setAddDraft(emptyDraft(allFacilityIds, facilityLabel)); setAddOpen(true); }} className="btn btn-primary">＋ 職員追加</button>
        </div>
      </header>

      <section>
        <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider mb-2">ロール（権限グループ）</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
              <tr className="text-left">
                <th className="px-4 py-2 text-[11px] font-semibold w-32">ロール名</th>
                <th className="px-4 py-2 text-[11px] font-semibold">アクセス範囲</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-right w-24">所属職員</th>
                <th className="px-4 py-2 text-[11px] font-semibold w-32 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink-900">{r.name}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-600">{r.desc}</td>
                  <td className="px-4 py-2.5 text-right num text-ink-700">{roleCounts[r.id] ?? 0} 名</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => setEditingRole(r.name)} className="btn btn-sm">権限を編集</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">職員一覧</h2>
          <div className="flex gap-1">
            <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>有効 ({staff.filter((s) => s.active).length})</FilterChip>
            <FilterChip active={filter === "inactive"} onClick={() => setFilter("inactive")}>無効 ({staff.filter((s) => !s.active).length})</FilterChip>
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>全て ({staff.length})</FilterChip>
          </div>
        </div>

        <div className="card overflow-x-auto">
          {list.length === 0 ? (
            <div className="px-3 py-10 text-center text-[13px] text-ink-500">
              {staff.length === 0 ? "職員が登録されていません" : "該当する職員がありません"}
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
                <tr className="text-left">
                  <th className="px-3 py-2.5 text-[11px] font-semibold w-20">職員ID</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">氏名</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">ロール</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">メール</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">所属</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">最終ログイン</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold w-20 text-center">状態</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold w-32 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-3 py-2.5 num text-[12px] text-ink-500">{s.id}</td>
                    <td className="px-3 py-2.5 font-medium text-ink-900">{s.name}</td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-700">{s.role}</td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-600">{s.email}</td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-700">
                      {(s.facilityIds && s.facilityIds.length > 0)
                        ? s.facilityIds.map((id) => facilities.find((f) => f.id === id)?.name ?? "—").join("・")
                        : s.facility}
                    </td>
                    <td className="px-3 py-2.5 num text-[11px] text-ink-500">{s.lastLogin}</td>
                    <td className="px-3 py-2.5 text-center"><Pill tone={s.active ? "ok" : "neutral"}>{s.active ? "有効" : "無効"}</Pill></td>
                    <td className="px-3 py-2.5 text-center flex gap-1 justify-center">
                      <button onClick={() => { setEditDraft({ name: s.name, roleId: s.roleId, email: s.email, facilityIds: s.facilityIds ?? allFacilityIds, facility: s.facility, active: s.active }); setEditing(s); }} className="btn btn-sm">編集</button>
                      <button onClick={() => toggleActive(s.id)} className="btn btn-sm">{s.active ? "無効化" : "有効化"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="text-[11px] text-ink-500 pt-2 border-t border-ink-200">
        ※ 個別の権限カスタマイズ（職員単位の細かい権限調整）は Phase 3 予定。
        <Link href="/admin/audit-logs" className="text-brand-700 hover:underline ml-2">監査ログを見る →</Link>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="職員を追加"
        footer={<ModalFooter onCancel={() => setAddOpen(false)} onConfirm={addStaff} confirmLabel="追加" />}
      >
        <StaffForm draft={addDraft} setDraft={setAddDraft} facilities={facilities} />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`職員編集：${editing?.name ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => setEditing(null)}
            onConfirm={saveEdit}
            extra={editing && (
              <>
                <button onClick={() => toast("パスワードリセットメールを送信しました（モック）", "info")} className="btn btn-sm">パスワードリセット</button>
                <button onClick={() => removeStaff(editing.id)} className="btn btn-sm text-err-700">削除</button>
              </>
            )}
          />
        }
      >
        {editing && <StaffForm draft={editDraft} setDraft={setEditDraft} facilities={facilities} />}
      </Modal>

      <Modal
        open={editingRole !== null}
        onClose={() => setEditingRole(null)}
        title={`権限編集：${editingRole ?? ""}`}
        size="lg"
        footer={<ModalFooter onCancel={() => setEditingRole(null)} onConfirm={() => { toast("権限を保存しました", "ok"); setEditingRole(null); }} />}
      >
        <div className="space-y-2 text-[13px]">
          {PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input type="checkbox" defaultChecked={editingRole === "管理者"} /> {p}
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function StaffForm({ draft, setDraft, facilities }: { draft: Draft; setDraft: (d: Draft) => void; facilities: { id: string; name: string }[] }) {
  function toggleFacility(id: string) {
    const cur = draft.facilityIds ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    const label = next.map((fid) => facilities.find((f) => f.id === fid)?.name ?? "—").join("・") || "—";
    setDraft({ ...draft, facilityIds: next, facility: label });
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="氏名（必須）"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="ロール">
          <Select value={draft.roleId} onChange={(e) => setDraft({ ...draft, roleId: e.target.value as StaffMember["roleId"] })}>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </Field>
        <Field label="メール（必須）"><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
        <Field label="状態">
          <Select value={draft.active ? "1" : "0"} onChange={(e) => setDraft({ ...draft, active: e.target.value === "1" })}>
            <option value="1">有効</option><option value="0">無効</option>
          </Select>
        </Field>
      </div>
      <Field label="アクセス可能な施設（複数選択）">
        <div className="flex flex-wrap gap-2">
          {facilities.map((f) => (
            <label key={f.id} className="flex items-center gap-1.5 px-2 py-1 border border-ink-200 rounded text-[12px]">
              <input type="checkbox" checked={(draft.facilityIds ?? []).includes(f.id)} onChange={() => toggleFacility(f.id)} />
              {f.name}
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}
