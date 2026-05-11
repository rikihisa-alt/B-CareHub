"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";

const initialRoles = [
  { id: "admin", name: "管理者", desc: "全機能・確定解除・マスタ・権限管理", count: 1 },
  { id: "office", name: "事務担当", desc: "利用者・食事・請求・日用品・書類・タスク", count: 2 },
  { id: "field", name: "現場スタッフ", desc: "食事閲覧・キャンセル登録・日用品使用記録・申し送り", count: 8 },
  { id: "view", name: "閲覧専用", desc: "ダッシュボード・カレンダー・一部利用者情報のみ", count: 1 },
];

type Staff = { id: string; name: string; roleId: string; role: string; email: string; facility: string; active: boolean; lastLogin: string };

const initialStaff: Staff[] = [
  { id: "S001", name: "山下 健", roleId: "admin", role: "管理者", email: "yamashita@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-11 07:50" },
  { id: "S002", name: "田中 太郎", roleId: "office", role: "事務担当", email: "tanaka@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-12 08:42" },
  { id: "S003", name: "鈴木 花子", roleId: "office", role: "事務担当", email: "suzuki@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-11 17:30" },
  { id: "S004", name: "加藤 看護師", roleId: "field", role: "現場スタッフ（看護）", email: "kato@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-12 08:30" },
  { id: "S005", name: "小川 介護士", roleId: "field", role: "現場スタッフ（介護）", email: "ogawa@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-12 07:15" },
  { id: "S006", name: "佐々木 介護士", roleId: "field", role: "現場スタッフ（介護）", email: "sasaki@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-11 22:05" },
  { id: "S007", name: "井上 介護士", roleId: "field", role: "現場スタッフ（介護）", email: "inoue@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-09 14:20" },
  { id: "S008", name: "森 経営", roleId: "view", role: "閲覧専用", email: "mori@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-08 11:10" },
];

export default function StaffPage() {
  const [staff, setStaff] = useState(initialStaff);
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [editing, setEditing] = useState<Staff | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const list = useMemo(() => staff.filter((s) => filter === "all" ? true : filter === "active" ? s.active : !s.active), [staff, filter]);

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["職員ID", "氏名", "ロール", "メール", "所属", "状態", "最終ログイン"],
      ...staff.map((s) => [s.id, s.name, s.role, s.email, s.facility, s.active ? "有効" : "無効", s.lastLogin]),
    ];
    downloadCsv("職員一覧.csv", rows);
  }

  function toggleActive(id: string) {
    setStaff((arr) => arr.map((s) => s.id === id ? { ...s, active: !s.active } : s));
    toast("職員の状態を変更しました", "ok");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">職員・権限</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">職員 {staff.filter((s) => s.active).length} 名 有効 ／ {initialRoles.length} ロール</p>
        </div>
        <div className="flex gap-2 text-[12px]">
          <button onClick={exportCsv} className="btn">CSV エクスポート</button>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary">＋ 職員追加</button>
        </div>
      </div>

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
              {initialRoles.map((r) => (
                <tr key={r.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink-900">{r.name}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-600">{r.desc}</td>
                  <td className="px-4 py-2.5 text-right num text-ink-700">{r.count} 名</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => setEditingRole(r.name)} className="btn text-[11px] py-0.5">権限を編集</button>
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
          <div className="flex gap-1 text-[11px]">
            <Chip active={filter === "active"} onClick={() => setFilter("active")}>有効 ({staff.filter((s) => s.active).length})</Chip>
            <Chip active={filter === "inactive"} onClick={() => setFilter("inactive")}>無効 ({staff.filter((s) => !s.active).length})</Chip>
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>全て ({staff.length})</Chip>
          </div>
        </div>

        <div className="card overflow-x-auto">
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
                  <td className="px-3 py-2.5 text-[12px] text-ink-700">{s.facility}</td>
                  <td className="px-3 py-2.5 num text-[11px] text-ink-500">{s.lastLogin}</td>
                  <td className="px-3 py-2.5 text-center">
                    {s.active
                      ? <span className="text-[11px] px-2 py-0.5 rounded border bg-ok-50 text-ok-700 border-ok-600/30 font-semibold">有効</span>
                      : <span className="text-[11px] px-2 py-0.5 rounded border bg-ink-100 text-ink-500 border-ink-200">無効</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center flex gap-1 justify-center">
                    <button onClick={() => setEditing(s)} className="btn text-[11px] py-0.5">編集</button>
                    <button onClick={() => toggleActive(s.id)} className="btn text-[11px] py-0.5">{s.active ? "無効化" : "有効化"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="text-[11px] text-ink-500 pt-2 border-t border-ink-200">
        ※ 個別の権限カスタマイズ（職員単位の細かい権限調整）は Phase 3 予定。
        <Link href="/admin/audit-logs" className="text-brand-700 hover:underline ml-2">監査ログを見る →</Link>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`職員編集：${editing?.name ?? ""}`} footer={<><button className="btn text-[12px]" onClick={() => setEditing(null)}>取消</button><button className="btn text-[12px]" onClick={() => { toast("パスワードリセットメールを送信しました", "info"); }}>パスワードリセット</button><button className="btn btn-primary text-[12px]" onClick={() => { toast("職員情報を保存しました", "ok"); setEditing(null); }}>保存</button></>}>
        {editing && (
          <div className="grid grid-cols-2 gap-3">
            <F label="氏名"><input defaultValue={editing.name} className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
            <F label="ロール">
              <select defaultValue={editing.roleId} className="w-full px-3 py-2 border border-ink-200 rounded">
                {initialRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </F>
            <F label="メール"><input type="email" defaultValue={editing.email} className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
            <F label="所属"><input defaultValue={editing.facility} className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          </div>
        )}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="職員を追加" footer={<><button className="btn text-[12px]" onClick={() => setAddOpen(false)}>取消</button><button className="btn btn-primary text-[12px]" onClick={() => {
        setStaff((arr) => [...arr, { id: `S${String(arr.length + 1).padStart(3, "0")}`, name: "新規 職員", roleId: "view", role: "閲覧専用", email: "new@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "—" }]);
        toast("職員を追加しました。初回ログイン用のメールを送信しました。", "ok");
        setAddOpen(false);
      }}>追加</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <F label="氏名"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="ロール"><select className="w-full px-3 py-2 border border-ink-200 rounded">{initialRoles.map((r) => <option key={r.id}>{r.name}</option>)}</select></F>
          <F label="メール"><input type="email" className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="所属"><input className="w-full px-3 py-2 border border-ink-200 rounded" defaultValue="あすか苑（仮）" /></F>
        </div>
      </Modal>

      <Modal open={editingRole !== null} onClose={() => setEditingRole(null)} title={`権限編集：${editingRole ?? ""}`} size="lg" footer={<><button className="btn text-[12px]" onClick={() => setEditingRole(null)}>取消</button><button className="btn btn-primary text-[12px]" onClick={() => { toast("権限を保存しました", "ok"); setEditingRole(null); }}>保存</button></>}>
        <div className="space-y-2 text-[13px]">
          {[
            "利用者の閲覧", "利用者の編集", "ステータス変更", "食事カレンダー閲覧", "食事設定変更",
            "キャンセル登録", "発注確定", "発注確定解除", "月次請求閲覧", "請求項目編集", "請求確定", "請求確定解除",
            "日用品マスタ", "日用品使用登録", "書類管理", "タスク管理", "申し送り記載", "マスタ管理", "職員管理", "権限管理", "監査ログ閲覧",
          ].map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input type="checkbox" defaultChecked={editingRole === "管理者"} /> {p}
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-ink-600 mb-1">{label}</div>{children}</div>;
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={"px-2.5 py-1 rounded border " + (active ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")}>
      {children}
    </button>
  );
}
