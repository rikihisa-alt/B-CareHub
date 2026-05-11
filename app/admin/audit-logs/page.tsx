"use client";
import { useMemo, useState } from "react";
import { downloadCsv } from "@/components/ui/helpers";

const logs = [
  { at: "2026-05-12 08:42", staff: "田中 太郎", action: "ログイン", target: "—", before: "—", after: "—", ip: "192.168.1.10" },
  { at: "2026-05-12 08:40", staff: "田中 太郎", action: "発注確定", target: "meal_orders / 2026-05-12 朝食", before: "未確定", after: "確定済（パン18, ジュース12）", ip: "192.168.1.10" },
  { at: "2026-05-12 08:30", staff: "看護 加藤", action: "申し送り追加", target: "handovers / 小林ハル", before: "—", after: "水分量管理徹底（重要）", ip: "192.168.1.22" },
  { at: "2026-05-12 07:50", staff: "山下 健", action: "ログイン", target: "—", before: "—", after: "—", ip: "192.168.1.5" },
  { at: "2026-05-11 17:30", staff: "鈴木 花子", action: "ステータス変更", target: "users / 鈴木タケ", before: "入居中", after: "入院中（5/5〜）", ip: "192.168.1.11" },
  { at: "2026-05-11 17:32", staff: "システム", action: "自動キャンセル", target: "meal_orders / 鈴木タケ 5/5〜", before: "対象", after: "停止（入院連動）", ip: "—" },
  { at: "2026-05-10 14:05", staff: "システム", action: "アラート生成", target: "alerts / 在庫不足", before: "—", after: "おむつ Lサイズ 残24/最低40", ip: "—" },
  { at: "2026-05-10 11:30", staff: "田中 太郎", action: "発注確定", target: "meal_orders / 2026-05-10 昼食 A社", before: "未確定", after: "確定済（14食）", ip: "192.168.1.10" },
  { at: "2026-05-09 18:00", staff: "山下 健", action: "マスタ更新", target: "billing_items / 食費単価", before: "昼食A社 ¥580", after: "昼食A社 ¥600", ip: "192.168.1.5" },
  { at: "2026-05-09 09:12", staff: "鈴木 花子", action: "ステータス変更", target: "users / 加藤一郎", before: "入居中", after: "一時帰宅（5/9〜5/11）", ip: "192.168.1.11" },
  { at: "2026-05-08 17:00", staff: "山下 健", action: "お知らせ投稿", target: "announcements / AN-001", before: "—", after: "B社昼食締切変更", ip: "192.168.1.5" },
  { at: "2026-05-08 10:15", staff: "田中 太郎", action: "請求確定解除", target: "monthly_billings / 佐藤ヨシ子 4月分", before: "確定済", after: "未確定（理由：日用品追加漏れ）", ip: "192.168.1.10" },
];

export default function AuditLogsPage() {
  const [from, setFrom] = useState("2026-05-01");
  const [to, setTo] = useState("2026-05-12");
  const [actionFilter, setActionFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => logs.filter((l) => {
    if (l.at.slice(0, 10) < from) return false;
    if (l.at.slice(0, 10) > to) return false;
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (staffFilter !== "all" && l.staff !== staffFilter) return false;
    if (tableFilter !== "all" && !l.target.startsWith(tableFilter)) return false;
    if (q && !`${l.target}${l.before}${l.after}${l.action}`.includes(q)) return false;
    return true;
  }), [from, to, actionFilter, staffFilter, tableFilter, q]);

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["日時", "操作者", "操作", "対象", "変更前", "変更後", "IP"],
      ...list.map((l) => [l.at, l.staff, l.action, l.target, l.before, l.after, l.ip]),
    ];
    downloadCsv(`監査ログ_${from}_${to}.csv`, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">監査ログ</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">すべての更新操作の完全記録（5 年保持）。CSV 出力で行政対応・内部監査に利用できます。</p>
        </div>
        <button onClick={exportCsv} className="btn text-[12px]">CSV エクスポート</button>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-500">期間：</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1 border border-ink-200 rounded num" />
          <span className="text-ink-500">〜</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-1 border border-ink-200 rounded num" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-2 py-1 border border-ink-200 rounded">
          <option value="all">全操作種別</option>
          <option value="ログイン">ログイン</option>
          <option value="発注確定">発注確定</option>
          <option value="ステータス変更">ステータス変更</option>
          <option value="マスタ更新">マスタ更新</option>
          <option value="請求確定解除">請求確定解除</option>
          <option value="申し送り追加">申し送り追加</option>
        </select>
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="px-2 py-1 border border-ink-200 rounded">
          <option value="all">全職員</option>
          <option value="田中 太郎">田中 太郎</option>
          <option value="鈴木 花子">鈴木 花子</option>
          <option value="山下 健">山下 健</option>
          <option value="看護 加藤">看護 加藤</option>
          <option value="システム">システム自動</option>
        </select>
        <select value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} className="px-2 py-1 border border-ink-200 rounded">
          <option value="all">全テーブル</option>
          <option value="users">users（利用者）</option>
          <option value="meal_orders">meal_orders（食事発注）</option>
          <option value="monthly_billings">monthly_billings（月次請求）</option>
          <option value="billing_items">billing_items（請求項目）</option>
          <option value="alerts">alerts（アラート）</option>
          <option value="announcements">announcements（お知らせ）</option>
          <option value="handovers">handovers（申し送り）</option>
        </select>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="フリーワード" className="ml-auto px-3 py-1 border border-ink-200 rounded w-56" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <th className="px-3 py-2.5 text-[11px] font-semibold w-36">日時</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold w-28">操作者</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold w-28">操作</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">対象</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">変更前</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">変更後</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold w-28">IPアドレス</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-[12px] text-ink-500">条件に一致するログはありません</td></tr>
            )}
            {list.map((l, i) => (
              <tr key={i} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-2 num text-ink-700">{l.at}</td>
                <td className="px-3 py-2 text-ink-700">{l.staff}</td>
                <td className="px-3 py-2"><ActionPill action={l.action} /></td>
                <td className="px-3 py-2 text-ink-800">{l.target}</td>
                <td className="px-3 py-2 text-ink-500">{l.before}</td>
                <td className="px-3 py-2 text-ink-900">{l.after}</td>
                <td className="px-3 py-2 num text-ink-500">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-ink-100 bg-ink-50/40 text-[11px] text-ink-500 flex justify-between">
          <span>{list.length} 件表示中 ／ 期間内 {logs.length} 件</span>
        </div>
      </div>

      <p className="text-[11px] text-ink-500">※ 監査ログは追記専用テーブルで、削除・編集はできません。</p>
    </div>
  );
}

function ActionPill({ action }: { action: string }) {
  const map: Record<string, string> = {
    ログイン: "bg-info-50 text-info-700 border-info-600/30",
    作成: "bg-ok-50 text-ok-700 border-ok-600/30",
    更新: "bg-info-50 text-info-700 border-info-600/30",
    削除: "bg-err-50 text-err-700 border-err-600/30",
    発注確定: "bg-ok-50 text-ok-700 border-ok-600/30",
    確定解除: "bg-warn-50 text-warn-700 border-warn-600/30",
    請求確定解除: "bg-warn-50 text-warn-700 border-warn-600/30",
    ステータス変更: "bg-warn-50 text-warn-700 border-warn-600/30",
    マスタ更新: "bg-info-50 text-info-700 border-info-600/30",
    自動キャンセル: "bg-ink-100 text-ink-700 border-ink-200",
    アラート生成: "bg-ink-100 text-ink-700 border-ink-200",
    申し送り追加: "bg-info-50 text-info-700 border-info-600/30",
    お知らせ投稿: "bg-info-50 text-info-700 border-info-600/30",
  };
  return <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + (map[action] ?? "bg-ink-100 text-ink-700 border-ink-200")}>{action}</span>;
}
