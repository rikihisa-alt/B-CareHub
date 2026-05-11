"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { alerts as initialAlerts } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Severity, FilterChip, Field, Input, Th, ModalFooter } from "@/components/ui/primitives";

type Status = "未対応" | "対応中" | "解決" | "抑制";

export default function AlertsPage() {
  const [items, setItems] = useState(initialAlerts.map((a) => ({ ...a, status: "未対応" as Status })));
  const [filter, setFilter] = useState<Status>("未対応");
  const [typeFilter, setTypeFilter] = useState("all");
  const [suppressing, setSuppressing] = useState<typeof items[number] | null>(null);

  const list = useMemo(() => items.filter((a) => {
    if (a.status !== filter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  }), [items, filter, typeFilter]);

  function resolve(id: string) {
    setItems((s) => s.map((x) => x.id === id ? { ...x, status: "解決" as Status } : x));
    toast("アラートを解決にしました", "ok");
  }

  function suppress(id: string, reason: string) {
    setItems((s) => s.map((x) => x.id === id ? { ...x, status: "抑制" as Status } : x));
    toast(`アラートを 24 時間抑制しました（理由：${reason}）`, "warn");
    setSuppressing(null);
  }

  const counts: Record<Status, number> = {
    未対応: items.filter((a) => a.status === "未対応").length,
    対応中: items.filter((a) => a.status === "対応中").length,
    解決: items.filter((a) => a.status === "解決").length,
    抑制: items.filter((a) => a.status === "抑制").length,
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">アラート</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">システムが自動検知した異常。</p>
      </header>

      <div className="card p-3 flex flex-wrap gap-2">
        <FilterChip active={filter === "未対応"} onClick={() => setFilter("未対応")}>未対応 ({counts["未対応"]})</FilterChip>
        <FilterChip active={filter === "対応中"} onClick={() => setFilter("対応中")}>対応中 ({counts["対応中"]})</FilterChip>
        <FilterChip active={filter === "解決"} onClick={() => setFilter("解決")}>解決済 ({counts["解決"]})</FilterChip>
        <FilterChip active={filter === "抑制"} onClick={() => setFilter("抑制")}>抑制中 ({counts["抑制"]})</FilterChip>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="ml-auto px-2 py-1 border border-ink-200 rounded text-[12px]">
          <option value="all">全種別</option>
          <option value="発注未確定">発注未確定</option>
          <option value="在庫不足">在庫不足</option>
          <option value="書類期限間近">書類期限間近</option>
          <option value="請求漏れ疑い">請求漏れ疑い</option>
          <option value="復帰漏れ">復帰漏れ</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr>
              <Th className="w-16">重要度</Th>
              <Th className="w-24">種別</Th>
              <Th className="w-36">発生日時</Th>
              <Th>内容</Th>
              <Th>影響</Th>
              <Th className="w-44" align="center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-[12px] text-ink-500">該当するアラートはありません</td></tr>
            )}
            {list.map((a) => (
              <tr key={a.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-2.5"><Severity s={a.severity} /></td>
                <td className="px-3 py-2.5 text-[12px] text-ink-700">{a.type}</td>
                <td className="px-3 py-2.5 num text-[12px] text-ink-700">{a.detectedAt}</td>
                <td className="px-3 py-2.5 text-ink-900">{a.message}</td>
                <td className="px-3 py-2.5 text-[12px] text-ink-600">{a.impact}</td>
                <td className="px-3 py-2.5 flex gap-1 justify-center">
                  <Link href={a.actionHref} className="btn btn-sm btn-arrow">{a.actionLabel}</Link>
                  {a.status === "未対応" && (
                    <>
                      <button onClick={() => resolve(a.id)} className="btn btn-sm">解決</button>
                      <button onClick={() => setSuppressing(a)} className="btn btn-sm">抑制</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={suppressing !== null}
        onClose={() => setSuppressing(null)}
        title="アラートを抑制"
        footer={
          <ModalFooter
            onCancel={() => setSuppressing(null)}
            onConfirm={() => suppressing && suppress(suppressing.id, "業務上問題ないため")}
            confirmLabel="24時間抑制"
          />
        }
      >
        {suppressing && (
          <div className="space-y-3">
            <p className="text-[13px]">以下のアラートを <b>24時間</b> 抑制します。</p>
            <div className="bg-ink-50 rounded p-3 text-[12px]">
              <div className="font-semibold">{suppressing.message}</div>
              <div className="text-ink-500 mt-1">{suppressing.impact}</div>
            </div>
            <Field label="抑制理由（必須）">
              <Input placeholder="例：別途対応済、業務上問題ない、誤検知" />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
