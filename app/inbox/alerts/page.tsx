import Link from "next/link";
import { alerts } from "@/lib/data";

export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold text-ink-900">アラート</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">
          システムが自動検知した異常。{alerts.length} 件 未対応。
        </p>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <Chip active>未対応 ({alerts.length})</Chip>
        <Chip>対応中</Chip>
        <Chip>解決済</Chip>
        <Chip>抑制中</Chip>
        <div className="ml-auto flex gap-2">
          <select className="px-2 py-1 border border-ink-200 rounded text-[12px]">
            <option>全種別</option>
            <option>発注</option>
            <option>在庫</option>
            <option>書類</option>
            <option>請求</option>
            <option>ステータス</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <Th className="w-16">重要度</Th>
              <Th className="w-24">種別</Th>
              <Th className="w-36">発生日時</Th>
              <Th>内容</Th>
              <Th>影響</Th>
              <Th className="w-32 text-center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-2.5"><Severity s={a.severity} /></td>
                <td className="px-3 py-2.5 text-[12px] text-ink-700">{a.type}</td>
                <td className="px-3 py-2.5 num text-[12px] text-ink-700">{a.detectedAt}</td>
                <td className="px-3 py-2.5 text-ink-900">{a.message}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-600">{a.impact}</td>
                <td className="px-3 py-2.5 text-center">
                  <Link href={a.actionHref} className="btn btn-arrow text-[11px] py-0.5">
                    {a.actionLabel}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={"px-3 py-2.5 text-[11px] font-semibold " + (className ?? "")}>{children}</th>;
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={
        "px-3 py-1.5 rounded border " +
        (active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}

function Severity({ s }: { s: "高" | "中" | "低" }) {
  const map = {
    高: "bg-err-50 text-err-700 border-err-600/30",
    中: "bg-warn-50 text-warn-700 border-warn-600/30",
    低: "bg-info-50 text-info-700 border-info-600/30",
  };
  return (
    <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + map[s]}>
      {s}
    </span>
  );
}
