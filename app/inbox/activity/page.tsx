import { activities } from "@/lib/data";

export default function ActivityPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold text-ink-900">アクティビティログ</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">
          システム内で実行された操作の記録（過去7日 + 業務影響あり）。監査ログは管理画面から。
        </p>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <select className="px-2 py-1 border border-ink-200 rounded">
          <option>すべての操作</option>
          <option>食事発注</option>
          <option>ステータス変更</option>
          <option>請求</option>
          <option>日用品</option>
        </select>
        <select className="px-2 py-1 border border-ink-200 rounded">
          <option>全職員</option>
          <option>田中 太郎</option>
          <option>鈴木 花子</option>
          <option>システム自動</option>
        </select>
        <input type="search" placeholder="フリーワード" className="ml-auto px-3 py-1 border border-ink-200 rounded w-64" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <th className="px-3 py-2.5 text-[11px] font-semibold w-44">日時</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold w-32">操作者</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">操作内容</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b border-ink-100 last:border-b-0">
                <td className="px-3 py-2.5 num text-[12px] text-ink-700">{a.at}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-700">{a.staff}</td>
                <td className="px-3 py-2.5 text-ink-900">{a.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
