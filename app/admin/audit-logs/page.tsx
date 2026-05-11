"use client";
import { useMemo, useState } from "react";
import { useActivities, todayIso } from "@/lib/store";
import { downloadCsv } from "@/components/ui/helpers";
import { Pill } from "@/components/ui/primitives";

export default function AuditLogsPage() {
  const [activities] = useActivities();
  const [from, setFrom] = useState(activities.length > 0 ? activities[activities.length - 1].at.slice(0, 10) : "2026-05-01");
  const [to, setTo] = useState(todayIso());
  const [staffFilter, setStaffFilter] = useState("all");
  const [q, setQ] = useState("");

  const staffOptions = useMemo(() => Array.from(new Set(activities.map((a) => a.staff))), [activities]);

  const list = useMemo(() => activities.filter((a) => {
    if (a.at.slice(0, 10) < from) return false;
    if (a.at.slice(0, 10) > to) return false;
    if (staffFilter !== "all" && a.staff !== staffFilter) return false;
    if (q && !a.message.includes(q)) return false;
    return true;
  }), [activities, from, to, staffFilter, q]);

  function exportCsv() {
    downloadCsv(`監査ログ_${from}_${to}.csv`, [
      ["日時", "操作者", "操作内容"],
      ...list.map((a) => [a.at, a.staff, a.message]),
    ]);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">監査ログ</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">すべての更新操作の完全記録（5 年保持）。CSV 出力で行政対応・内部監査に利用できます。</p>
        </div>
        <button onClick={exportCsv} className="btn" disabled={list.length === 0}>CSV エクスポート</button>
      </header>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-500">期間：</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1 border border-ink-200 rounded num" />
          <span className="text-ink-500">〜</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-1 border border-ink-200 rounded num" />
        </div>
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="px-2 py-1 border border-ink-200 rounded">
          <option value="all">全職員</option>
          {staffOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="フリーワード" className="ml-auto px-3 py-1 border border-ink-200 rounded w-56" />
      </div>

      <div className="card overflow-x-auto">
        {list.length === 0 ? (
          <div className="px-3 py-12 text-center text-[13px] text-ink-500">
            {activities.length === 0 ? "監査対象の操作はまだ記録されていません。" : "条件に一致するログはありません。"}
          </div>
        ) : (
          <>
            <table className="w-full text-[12px]">
              <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
                <tr className="text-left">
                  <th className="px-3 py-2.5 text-[11px] font-semibold w-36">日時</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold w-28">操作者</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold w-32">種別</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold">操作内容</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-3 py-2 num text-ink-700">{a.at}</td>
                    <td className="px-3 py-2 text-ink-700">{a.staff}</td>
                    <td className="px-3 py-2"><Pill tone={classifyAction(a.message)}>{inferAction(a.message)}</Pill></td>
                    <td className="px-3 py-2 text-ink-900">{a.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-ink-100 bg-ink-50/40 text-[11px] text-ink-500 flex justify-between">
              <span>{list.length} 件表示中 ／ 全 {activities.length} 件</span>
            </div>
          </>
        )}
      </div>

      <p className="text-[11px] text-ink-500">※ 監査ログは追記専用で削除・編集はできません。</p>
    </div>
  );
}

function inferAction(msg: string): string {
  if (msg.includes("確定")) return "確定";
  if (msg.includes("ステータス")) return "ステータス変更";
  if (msg.includes("追加")) return "追加";
  if (msg.includes("登録")) return "登録";
  if (msg.includes("更新") || msg.includes("変更")) return "更新";
  if (msg.includes("削除")) return "削除";
  if (msg.includes("完了")) return "完了";
  if (msg.includes("ログイン")) return "ログイン";
  if (msg.includes("申し送り")) return "申し送り";
  if (msg.includes("お知らせ")) return "お知らせ";
  return "操作";
}

function classifyAction(msg: string): "ok" | "warn" | "err" | "info" | "neutral" {
  if (msg.includes("削除")) return "err";
  if (msg.includes("解除")) return "warn";
  if (msg.includes("確定") || msg.includes("登録") || msg.includes("追加") || msg.includes("完了")) return "ok";
  if (msg.includes("ステータス変更") || msg.includes("更新")) return "info";
  return "neutral";
}
