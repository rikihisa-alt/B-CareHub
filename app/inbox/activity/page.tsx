"use client";
import { useMemo, useState } from "react";
import { useActivities } from "@/lib/store";

export default function ActivityPage() {
  const [activities] = useActivities();
  const [staffFilter, setStaffFilter] = useState("all");
  const [q, setQ] = useState("");

  const staffOptions = useMemo(() => Array.from(new Set(activities.map((a) => a.staff))), [activities]);

  const list = useMemo(() => activities.filter((a) => {
    if (staffFilter !== "all" && a.staff !== staffFilter) return false;
    if (q && !a.message.includes(q)) return false;
    return true;
  }), [activities, staffFilter, q]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">アクティビティログ</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">システム内で実行された操作の記録。新しいものが上に表示されます。</p>
      </header>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="px-2 py-1 border border-ink-200 rounded">
          <option value="all">全職員</option>
          {staffOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="フリーワード" className="ml-auto px-3 py-1 border border-ink-200 rounded w-64" />
      </div>

      <div className="card overflow-hidden">
        {list.length === 0 ? (
          <div className="px-3 py-12 text-center text-[13px] text-ink-500">
            {activities.length === 0 ? "操作の記録はまだありません。各種登録・更新を行うとここに表示されます。" : "該当するアクティビティはありません。"}
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr className="text-left">
                <th className="px-3 py-2.5 text-[11px] font-semibold w-44">日時</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold w-32">操作者</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">操作内容</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-3 py-2.5 num text-[12px] text-ink-700">{a.at}</td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-700">{a.staff}</td>
                  <td className="px-3 py-2.5 text-ink-900">{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
