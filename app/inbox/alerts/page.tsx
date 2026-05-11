"use client";
import Link from "next/link";
import { useMemo } from "react";
import { type Alert } from "@/lib/data";
import { useUsers, useGoods, useDocuments, useMealConfirmations, todayIso } from "@/lib/store";
import { Severity, FilterChip, Th } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";

/** 現在の業務データからアラートを自動算出 */
function computeAlerts(
  users: ReturnType<typeof useUsers>[0],
  goods: ReturnType<typeof useGoods>[0],
  documents: ReturnType<typeof useDocuments>[0],
  confirmations: ReturnType<typeof useMealConfirmations>[0],
): Alert[] {
  const today = todayIso();
  const alerts: Alert[] = [];

  // 発注未確定（本日分）
  const c = confirmations[today] ?? {};
  if (users.length > 0 && !c.lunch) {
    alerts.push({
      id: "AL-meal-lunch",
      type: "発注未確定",
      severity: "高",
      detectedAt: today,
      message: `本日 ${today} 昼食 が未確定`,
      impact: "対象者の配膳に影響、業者締切までに確定が必要",
      actionLabel: "確定する",
      actionHref: `/meals/${today}`,
    });
  }

  // 在庫不足
  goods.filter((g) => g.stock < g.min).forEach((g) => {
    const critical = g.stock < g.min * 0.5;
    alerts.push({
      id: `AL-stock-${g.id}`,
      type: "在庫不足",
      severity: critical ? "高" : "中",
      detectedAt: today,
      message: `${g.name}：残 ${g.stock} / 最低 ${g.min}${critical ? "（切迫）" : ""}`,
      impact: critical ? "3 日以内に枯渇見込み" : "1 週間以内に枯渇見込み",
      actionLabel: "発注候補へ",
      actionHref: "/goods",
    });
  });

  // 書類期限
  documents.forEach((d) => {
    if (d.status === "期限切れ") {
      alerts.push({
        id: `AL-doc-${d.id}`,
        type: "書類期限切れ",
        severity: "高",
        detectedAt: today,
        message: `${d.userName} 様 ${d.doc} 期限切れ`,
        targetUserId: d.userId,
        impact: "更新手続きが必要",
        actionLabel: "書類へ",
        actionHref: "/documents",
      });
    } else if (d.status === "期限間近") {
      alerts.push({
        id: `AL-doc-${d.id}`,
        type: "書類期限間近",
        severity: "中",
        detectedAt: today,
        message: `${d.userName} 様 ${d.doc} 期限間近（${d.expires}）`,
        targetUserId: d.userId,
        impact: "更新手続きの準備が必要",
        actionLabel: "書類へ",
        actionHref: "/documents",
      });
    } else if (d.status === "未回収") {
      alerts.push({
        id: `AL-doc-${d.id}`,
        type: "書類期限間近",
        severity: "中",
        detectedAt: today,
        message: `${d.userName} 様 ${d.doc} 未回収`,
        targetUserId: d.userId,
        impact: "回収が必要",
        actionLabel: "書類へ",
        actionHref: "/documents",
      });
    }
  });

  // 請求漏れ疑い：食事が出ているのに食費 0
  users.filter((u) => u.status === "入居中" && u.monthlyBilling.meal === 0 && (u.meal.breakfastBread || u.meal.lunchVendor !== "なし" || u.meal.dinnerVendor !== "なし")).forEach((u) => {
    alerts.push({
      id: `AL-bill-${u.id}`,
      type: "請求漏れ疑い",
      severity: "高",
      detectedAt: today,
      message: `${u.name} 様 食費 ¥0（食事は提供されています）`,
      targetUserId: u.id,
      impact: "請求額が漏れている可能性",
      actionLabel: "利用者へ",
      actionHref: `/users/${u.id}`,
    });
  });

  // 復帰漏れ：非入居中ステータスで statusTo が過ぎている
  users.forEach((u) => {
    if (u.status !== "入居中" && u.status !== "退去済" && u.statusTo && u.statusTo < today) {
      alerts.push({
        id: `AL-back-${u.id}`,
        type: "復帰漏れ",
        severity: "高",
        detectedAt: today,
        message: `${u.name} 様 ${u.status} 期間が終了済みなのに食事停止中`,
        targetUserId: u.id,
        impact: `期間：${u.statusFrom ?? "?"} 〜 ${u.statusTo}`,
        actionLabel: "ステータスへ",
        actionHref: `/users/${u.id}`,
      });
    }
  });

  return alerts;
}

export default function AlertsPage() {
  const [users] = useUsers();
  const [goods] = useGoods();
  const [documents] = useDocuments();
  const [confirmations] = useMealConfirmations();

  const alerts = useMemo(() => computeAlerts(users, goods, documents, confirmations), [users, goods, documents, confirmations]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">アラート</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">システムが自動検知した異常。現在の登録データから自動算出されます。</p>
      </header>

      <div className="card p-3 flex flex-wrap gap-2">
        <FilterChip active>未対応 ({alerts.length})</FilterChip>
        <span className="text-[11px] text-ink-500 ml-2 py-1.5">※ 解決操作は対応する画面で行ってください（食事確定／在庫補充／書類更新／請求修正／ステータス変更）</span>
      </div>

      <div className="card overflow-hidden">
        {alerts.length === 0 ? (
          <div className="px-3 py-12 text-center text-[13px] text-ink-500">アラートはありません ✓</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr>
                <Th className="w-16">重要度</Th>
                <Th className="w-24">種別</Th>
                <Th className="w-32">発生日</Th>
                <Th>内容</Th>
                <Th>影響</Th>
                <Th className="w-32" align="center">操作</Th>
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
                    <Link href={a.actionHref} className="btn btn-sm btn-arrow">{a.actionLabel}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
