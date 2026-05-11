import Link from "next/link";

const roles = [
  { id: "admin", name: "管理者", desc: "全機能・確定解除・マスタ・権限管理", count: 1 },
  { id: "office", name: "事務担当", desc: "利用者・食事・請求・日用品・書類・タスク", count: 2 },
  { id: "field", name: "現場スタッフ", desc: "食事閲覧・キャンセル登録・日用品使用記録・申し送り", count: 8 },
  { id: "view", name: "閲覧専用", desc: "ダッシュボード・カレンダー・一部利用者情報のみ", count: 1 },
];

const staff = [
  { id: "S001", name: "山下 健", roleId: "admin", role: "管理者", email: "yamashita@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-11 07:50" },
  { id: "S002", name: "田中 太郎", roleId: "office", role: "事務担当", email: "tanaka@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-11 08:42" },
  { id: "S003", name: "鈴木 花子", roleId: "office", role: "事務担当", email: "suzuki@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-10 17:30" },
  { id: "S004", name: "加藤 看護師", roleId: "field", role: "現場スタッフ（看護）", email: "kato@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-11 08:30" },
  { id: "S005", name: "小川 介護士", roleId: "field", role: "現場スタッフ（介護）", email: "ogawa@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-11 07:15" },
  { id: "S006", name: "佐々木 介護士", roleId: "field", role: "現場スタッフ（介護）", email: "sasaki@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-10 22:05" },
  { id: "S007", name: "井上 介護士", roleId: "field", role: "現場スタッフ（介護）", email: "inoue@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-09 14:20" },
  { id: "S008", name: "森 経営", roleId: "view", role: "閲覧専用", email: "mori@asuka.example", facility: "あすか苑（仮）", active: true, lastLogin: "2026-05-08 11:10" },
];

export default function StaffPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">職員・権限</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            職員 {staff.filter((s) => s.active).length} 名 有効 ／ {roles.length} ロール
          </p>
        </div>
        <div className="flex gap-2 text-[12px]">
          <button className="btn">CSV エクスポート</button>
          <button className="btn btn-primary">＋ 職員追加</button>
        </div>
      </div>

      {/* ロール */}
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
              {roles.map((r) => (
                <tr key={r.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink-900">{r.name}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-600">{r.desc}</td>
                  <td className="px-4 py-2.5 text-right num text-ink-700">{r.count} 名</td>
                  <td className="px-4 py-2.5 text-center">
                    <button className="btn text-[11px] py-0.5">権限を編集</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 職員一覧 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">職員一覧</h2>
          <div className="flex gap-1 text-[11px]">
            <Chip active>有効 ({staff.length})</Chip>
            <Chip>無効</Chip>
            <Chip>全て</Chip>
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
                <th className="px-3 py-2.5 text-[11px] font-semibold w-24 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                  <td className="px-3 py-2.5 num text-[12px] text-ink-500">{s.id}</td>
                  <td className="px-3 py-2.5 font-medium text-ink-900">{s.name}</td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-700">{s.role}</td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-600">{s.email}</td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-700">{s.facility}</td>
                  <td className="px-3 py-2.5 num text-[11px] text-ink-500">{s.lastLogin}</td>
                  <td className="px-3 py-2.5 text-center">
                    {s.active ? (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-ok-50 text-ok-700 border-ok-600/30 font-semibold">有効</span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-ink-100 text-ink-500 border-ink-200">無効</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button className="btn text-[11px] py-0.5">編集</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 権限マトリクスへの案内 */}
      <div className="text-[11px] text-ink-500 pt-2 border-t border-ink-200">
        ※ 個別の権限カスタマイズ（職員単位の細かい権限調整）は Phase 3 予定。
        現状はロール単位での権限割り当てのみサポート。
        <Link href="/admin/audit-logs" className="text-brand-700 hover:underline ml-2">監査ログを見る →</Link>
      </div>
    </div>
  );
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={
        "px-2.5 py-1 rounded border " +
        (active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}
