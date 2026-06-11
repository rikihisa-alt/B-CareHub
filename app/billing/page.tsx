"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { jpy, computeUserBilling, utilityBillsToLineItems, generateMealLineItems, generateProfileLineItems, emptyBillingProfile, type User } from "@/lib/data";
import { useUsers, useBillingConfirmations, useCurrentFacilityId, useRegularServices, useBillingLineItems, useBillingProfiles, useUtilityBills, useMealPrices, useSingleCancellations, useFacilities, logActivity, todayIso, filterByFacility } from "@/lib/store";
import { InvoicePreview, InvoiceBulkPrint, type InvoicePayload } from "@/components/invoice-preview";
import { FacilityLabel } from "@/components/facility-name";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";
import { Pill, Th, ModalFooter } from "@/components/ui/primitives";

type BillingKey = "rent" | "common" | "utility" | "admin" | "meal" | "goods" | "care" | "nursing" | "advance" | "other";

export default function BillingPage() {
  const [allUsers] = useUsers();
  const [facilities] = useFacilities();
  const [currentFacilityId] = useCurrentFacilityId();
  const users = useMemo(() => filterByFacility(allUsers, currentFacilityId), [allUsers, currentFacilityId]);
  const [confirmations, setConfirmations] = useBillingConfirmations();
  const [services] = useRegularServices();
  const [lineItems] = useBillingLineItems();
  const [profiles] = useBillingProfiles();
  const [utilityBills] = useUtilityBills();
  const [mealPrices] = useMealPrices();
  const [singleCancellations] = useSingleCancellations();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<User | null>(null);
  const [detailFor, setDetailFor] = useState<User | null>(null);
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [bulkPrintInvoices, setBulkPrintInvoices] = useState<InvoicePayload[]>([]);
  const [bulkSelectOpen, setBulkSelectOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());

  const today = todayIso();
  const [ym, setYm] = useState(today.slice(0, 7));

  // 各利用者の breakdown を当月分で算出
  // 利用者詳細の請求タブと同じ式：住居費・日常サービス（プロファイル）＋ 定期 ＋ 手動明細 ＋ 光熱費 ＋ 食事自動
  const userBillings = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeUserBilling>> = {};
    users.forEach((u) => {
      const profile = profiles.find((p) => p.userId === u.id) ?? emptyBillingProfile(u.id, u.facilityId);
      const profileItems = generateProfileLineItems(profile, u, ym);
      const utilItems = utilityBillsToLineItems(utilityBills, u.room, ym, u.facilityId).map((it) => ({ ...it, userId: u.id }));
      const mealItems = generateMealLineItems(u, ym, mealPrices, singleCancellations);
      map[u.id] = computeUserBilling(u.id, ym, services, [...lineItems, ...profileItems, ...utilItems, ...mealItems]);
    });
    return map;
  }, [users, services, lineItems, profiles, utilityBills, mealPrices, singleCancellations, ym]);

  const sum = (k: BillingKey) => users.reduce((s, u) => s + (userBillings[u.id]?.breakdown[k] ?? 0), 0);
  const totalAll = users.reduce((s, u) => s + (userBillings[u.id]?.total ?? 0), 0);
  const isConfirmed = (uid: string) => confirmations[`${uid}_${ym}`] === true;
  const confirmedCount = users.filter((u) => isConfirmed(u.id)).length;
  // 食事系の定期/明細が一つもないのに「入居中」 = 請求漏れ疑い
  const suspect = users.filter((u) => u.status === "入居中" && (userBillings[u.id]?.breakdown.meal ?? 0) === 0
    && (u.meal.breakfastBread || u.meal.breakfastJuice || u.meal.lunchVendor !== "なし" || u.meal.dinnerVendor !== "なし"));

  function exportCsv() {
    downloadCsv(`月次請求_${ym}.csv`, [
      ["部屋", "氏名", "家賃", "共益", "水光熱", "管理", "食費", "日用品", "介護", "看護", "立替", "その他", "合計"],
      ...users.map((u) => {
        const b = userBillings[u.id]?.breakdown;
        return b ? [u.room, u.name, b.rent, b.common, b.utility, b.admin, b.meal, b.goods, b.care, b.nursing, b.advance, b.other, userBillings[u.id].total] : [];
      }),
    ]);
  }

  function bulkConfirm() {
    const next: Record<string, boolean> = { ...confirmations };
    users.forEach((u) => { next[`${u.id}_${ym}`] = true; });
    setConfirmations(next);
    logActivity(`${ym} の請求を ${users.length} 件 一括確定`);
    toast(`${users.length} 名分の請求を一括確定しました`, "ok");
    setBulkOpen(false);
  }

  function openBulkPrintSelector() {
    // デフォルトで全員選択
    setBulkSelectedIds(new Set(users.map((u) => u.id)));
    setBulkSelectOpen(true);
  }

  function doBulkPrint() {
    const selected = users.filter((u) => bulkSelectedIds.has(u.id));
    if (selected.length === 0) { toast("印刷する利用者を選択してください", "warn"); return; }
    const payloads: InvoicePayload[] = selected.map((u) => ({
      user: u,
      facility: facilities.find((f) => f.id === u.facilityId) ?? facilities[0],
      ym,
      billing: userBillings[u.id],
    }));
    setBulkPrintInvoices(payloads);
    setBulkSelectOpen(false);
    setBulkPrintOpen(true);
    logActivity(`${ym} の請求書を ${selected.length} 名分プレビュー（一括印刷）`);
  }

  function toggleSelect(id: string) {
    setBulkSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (bulkSelectedIds.size === users.length) setBulkSelectedIds(new Set());
    else setBulkSelectedIds(new Set(users.map((u) => u.id)));
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">月次請求管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            <input type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="px-2 py-0.5 border border-ink-200 rounded text-[12px] num mr-2" />
            利用者 {users.length}名 ／ 合計 <span className="font-bold text-brand-700 num">{jpy(totalAll)}</span> ／ 確定 {confirmedCount}件 ／ 未確定 {users.length - confirmedCount}件
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={exportCsv} className="btn" disabled={users.length === 0}>CSV出力</button>
          <button onClick={openBulkPrintSelector} className="btn" disabled={users.length === 0}>請求書 一括印刷</button>
          <button onClick={() => setBulkOpen(true)} className="btn btn-primary" disabled={users.length === 0}>一括確定</button>
        </div>
      </header>

      {suspect.length > 0 && (
        <div className="bg-err-50 border-l-4 border-err-600 rounded-r-md px-4 py-2.5 text-[13px]">
          <span className="text-err-700 font-semibold">⚠ 請求漏れ疑い {suspect.length} 件：</span>
          <span className="text-ink-900 ml-1">
            {suspect.map((u) => (
              <Link key={u.id} href={`/users/${u.id}`} className="text-brand-700 hover:underline mr-3">{u.name} 様</Link>
            ))}
          </span>
          <span className="text-ink-600 text-[12px]">食事は提供されていますが食費が ¥0 です。</span>
        </div>
      )}

      <div className="card overflow-x-auto">
        {users.length === 0 ? (
          <div className="px-3 py-12 text-center">
            <div className="text-[14px] font-semibold text-ink-800 mb-1">💰 月次請求の使い方</div>
            <p className="text-[12px] text-ink-600 mb-4 leading-relaxed max-w-md mx-auto">
              利用者の家賃・共益費・水光熱費・食費・日用品・介護利用料などを月別に一覧表示。<br />
              「一括確定」で当月分を締めて、自動再計算をロックできます。
            </p>
            <Link href="/users" className="btn btn-primary">利用者を登録する →</Link>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr>
                <Th className="w-14">部屋</Th>
                <Th>氏名</Th>
                <Th align="right">家賃</Th><Th align="right">共益</Th><Th align="right">水光熱</Th><Th align="right">管理</Th>
                <Th align="right">食費</Th><Th align="right">日用品</Th><Th align="right">介護</Th><Th align="right">看護</Th><Th align="right">立替</Th><Th align="right">その他</Th>
                <Th align="right">合計</Th>
                <Th className="w-24" align="center">ステータス</Th>
                <Th className="w-44" align="center">明細・請求書</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const b = userBillings[u.id]?.breakdown ?? { rent:0,common:0,utility:0,admin:0,meal:0,goods:0,care:0,nursing:0,advance:0,other:0 };
                const total = userBillings[u.id]?.total ?? 0;
                const conf = isConfirmed(u.id);
                return (
                  <tr key={u.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-2 py-2.5 num font-semibold text-ink-900">{u.room}</td>
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-2">
                        <Link href={`/users/${u.id}`} className="hover:underline text-brand-700">{u.name}</Link>
                        {currentFacilityId === null && <FacilityLabel facilityId={u.facilityId} />}
                      </span>
                    </td>
                    <NumCell v={b.rent} /><NumCell v={b.common} /><NumCell v={b.utility} /><NumCell v={b.admin} />
                    <NumCell v={b.meal} /><NumCell v={b.goods} /><NumCell v={b.care} /><NumCell v={b.nursing} /><NumCell v={b.advance} /><NumCell v={b.other} />
                    <td className="px-2 py-2.5 text-right num font-bold text-brand-700">{jpy(total)}</td>
                    <td className="px-2 py-2.5 text-center"><Pill tone={conf ? "ok" : "warn"}>{conf ? "確定済" : "未確定"}</Pill></td>
                    <td className="px-2 py-2.5 text-center flex gap-1 justify-center">
                      <button onClick={() => setDetailFor(u)} className="btn btn-sm">明細</button>
                      <button onClick={() => setInvoiceFor(u)} className="btn btn-sm btn-primary">請求書</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-ink-50 border-t-2 border-ink-200">
              <tr>
                <td className="px-2 py-3 text-[13px] font-semibold" colSpan={2}>合計</td>
                {(["rent","common","utility","admin","meal","goods","care","nursing","advance","other"] as BillingKey[]).map((k) => (
                  <td key={k} className="px-2 py-3 text-right num font-semibold text-ink-900">{sum(k).toLocaleString("ja-JP")}</td>
                ))}
                <td className="px-2 py-3 text-right num text-[15px] font-bold text-brand-700">{jpy(totalAll)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <p className="text-[11px] text-ink-500">
        ※ 氏名クリックで利用者別請求明細を開きます。請求確定後は自動再計算で上書きされません。
      </p>

      {/* 明細モーダル（請求書プレビューに行く前のクイック確認用） */}
      <Modal
        open={detailFor !== null}
        onClose={() => setDetailFor(null)}
        title={`${detailFor?.name ?? ""} 様 ${ym} 請求明細`}
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setDetailFor(null)}
            onConfirm={() => { if (detailFor) { setInvoiceFor(detailFor); setDetailFor(null); } }}
            cancelLabel="閉じる"
            confirmLabel="請求書プレビューへ"
          />
        }
      >
        {detailFor && (() => {
          const ub = userBillings[detailFor.id];
          if (!ub) return <div className="text-[12px] text-ink-500">データがありません</div>;
          const items = [...ub.items].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
          const qtyTotal = items.reduce((s, i) => s + i.quantity, 0);
          return (
            <div>
              <div className="text-[12px] text-ink-600 mb-2">
                利用者：<b className="text-ink-900">{detailFor.name} 様</b>　部屋：<span className="num">{detailFor.room}</span>
                　／　請求対象月：<span className="num">{ym}</span>
              </div>
              <div className="card overflow-hidden">
                <div className="max-h-[55vh] overflow-y-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-ink-50 sticky top-0 border-b border-ink-200">
                      <tr className="text-left">
                        <th className="px-2 py-1.5 text-[11px] font-semibold w-24">日付</th>
                        <th className="px-2 py-1.5 text-[11px] font-semibold w-20">区分</th>
                        <th className="px-2 py-1.5 text-[11px] font-semibold">種別名</th>
                        <th className="px-2 py-1.5 text-[11px] font-semibold text-right w-12">数量</th>
                        <th className="px-2 py-1.5 text-[11px] font-semibold text-right w-12">税率</th>
                        <th className="px-2 py-1.5 text-[11px] font-semibold text-right w-20">単価</th>
                        <th className="px-2 py-1.5 text-[11px] font-semibold text-right w-24">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 && (
                        <tr><td colSpan={7} className="px-2 py-6 text-center text-[12px] text-ink-500">明細がありません</td></tr>
                      )}
                      {items.map((it) => (
                        <tr key={it.id} className={"border-b border-ink-100 " + (it.source === "meal-auto" || it.source === "regular" || it.id.startsWith("UB-") ? "bg-ink-50/30" : "")}>
                          <td className="px-2 py-1 num text-ink-700">{it.date ?? "—"}</td>
                          <td className="px-2 py-1 text-ink-600">{it.category}</td>
                          <td className="px-2 py-1 text-ink-900">
                            {it.name}
                            {it.source === "meal-auto" && <span className="ml-1 text-[9px] px-1 rounded bg-info-50 text-info-700 border border-info-600/20">食事自動</span>}
                            {it.source === "regular" && <span className="ml-1 text-[9px] px-1 rounded bg-info-50 text-info-700 border border-info-600/20">定期</span>}
                            {it.id.startsWith("UB-") && <span className="ml-1 text-[9px] px-1 rounded bg-info-50 text-info-700 border border-info-600/20">光熱費</span>}
                          </td>
                          <td className="px-2 py-1 text-right num">{it.quantity}</td>
                          <td className="px-2 py-1 text-right num text-[11px]">{it.taxRate ? `${Math.round(it.taxRate * 100)}%` : "—"}</td>
                          <td className="px-2 py-1 text-right num">{jpy(it.unitPrice)}</td>
                          <td className="px-2 py-1 text-right num font-semibold">{jpy(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-ink-50 border-t-2 border-ink-200 sticky bottom-0">
                      <tr>
                        <td colSpan={3} className="px-2 py-2 text-[12px] font-semibold">【{detailFor.name} 様　計】</td>
                        <td className="px-2 py-2 text-right num font-semibold">{qtyTotal}</td>
                        <td colSpan={2}></td>
                        <td className="px-2 py-2 text-right num font-bold text-brand-700">{jpy(ub.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 内訳サマリ */}
              <div className="mt-3 grid grid-cols-5 gap-2 text-[11px]">
                <BreakdownChip label="固定費" v={ub.breakdown.rent + ub.breakdown.common + ub.breakdown.utility + ub.breakdown.admin} />
                <BreakdownChip label="食費" v={ub.breakdown.meal} />
                <BreakdownChip label="日用品" v={ub.breakdown.goods} />
                <BreakdownChip label="介護・看護" v={ub.breakdown.care + ub.breakdown.nursing} />
                <BreakdownChip label="その他" v={ub.breakdown.advance + ub.breakdown.other} />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 一括印刷：選択モーダル */}
      <Modal
        open={bulkSelectOpen}
        onClose={() => setBulkSelectOpen(false)}
        title="請求書 一括印刷"
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setBulkSelectOpen(false)}
            onConfirm={doBulkPrint}
            cancelLabel="閉じる"
            confirmLabel={`${bulkSelectedIds.size} 名分のプレビューへ`}
            extra={<button onClick={toggleAll} className="btn btn-sm">{bulkSelectedIds.size === users.length ? "全解除" : "全選択"}</button>}
          />
        }
      >
        <div className="text-[12px] text-ink-600 mb-3">
          {ym} 分の請求書を作成する利用者を選択してください。プレビュー画面で「一括印刷」を押すと、各利用者の請求書が 1 ページずつ印刷されます。
        </div>
        <div className="card overflow-hidden max-h-[50vh] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-ink-50 sticky top-0 border-b border-ink-200 text-ink-600">
              <tr className="text-left">
                <th className="px-2 py-1.5 w-10 text-center">
                  <input type="checkbox" checked={bulkSelectedIds.size === users.length && users.length > 0} onChange={toggleAll} />
                </th>
                <th className="px-2 py-1.5 w-14">部屋</th>
                <th className="px-2 py-1.5">氏名</th>
                <th className="px-2 py-1.5 text-right w-24">合計</th>
                <th className="px-2 py-1.5 text-right w-16">明細数</th>
                <th className="px-2 py-1.5 text-center w-20">状態</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const checked = bulkSelectedIds.has(u.id);
                const ub = userBillings[u.id];
                return (
                  <tr key={u.id} className={"border-b border-ink-100 cursor-pointer hover:bg-ink-50/60 " + (checked ? "bg-brand-50/30" : "")} onClick={() => toggleSelect(u.id)}>
                    <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={checked} onChange={() => toggleSelect(u.id)} onClick={(e) => e.stopPropagation()} /></td>
                    <td className="px-2 py-1.5 num">{u.room}</td>
                    <td className="px-2 py-1.5">{u.name}</td>
                    <td className="px-2 py-1.5 text-right num font-semibold">{jpy(ub?.total ?? 0)}</td>
                    <td className="px-2 py-1.5 text-right num text-ink-500">{ub?.items.length ?? 0}</td>
                    <td className="px-2 py-1.5 text-center">
                      <Pill tone={isConfirmed(u.id) ? "ok" : "warn"}>{isConfirmed(u.id) ? "確定済" : "未確定"}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* 一括印刷：プレビュー（複数請求書） */}
      <InvoiceBulkPrint
        open={bulkPrintOpen}
        onClose={() => setBulkPrintOpen(false)}
        invoices={bulkPrintInvoices}
      />

      {/* 請求書プレビュー */}
      <InvoicePreview
        open={invoiceFor !== null}
        onClose={() => setInvoiceFor(null)}
        user={invoiceFor ?? ({ name: "" } as User)}
        facility={invoiceFor ? (facilities.find((f) => f.id === invoiceFor.facilityId) ?? facilities[0]) : undefined}
        ym={ym}
        billing={invoiceFor ? userBillings[invoiceFor.id] : { items: [], breakdown: { rent:0,common:0,utility:0,admin:0,meal:0,goods:0,care:0,nursing:0,advance:0,other:0 }, total: 0 }}
      />

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="月次請求 一括確定"
        footer={<ModalFooter onCancel={() => setBulkOpen(false)} onConfirm={bulkConfirm} confirmLabel="一括確定する" />}
      >
        <p>{ym} 分の請求 <b>{users.length} 件</b>（合計 <b>{jpy(totalAll)}</b>）を一括確定します。</p>
        {suspect.length > 0 && (
          <div className="bg-err-50 border-l-[3px] border-err-600 rounded-r px-3 py-2 mt-3 text-[12px]">
            ⚠ 請求漏れ疑いが <b>{suspect.length} 件</b> 残っています。確定前に確認を推奨します。
          </div>
        )}
        <ul className="bg-ink-50 rounded p-3 text-[12px] space-y-1 mt-3">
          <li>確定後は自動再計算されません。</li>
          <li>解除は管理者のみ可能で、理由の入力が必要です。</li>
        </ul>
      </Modal>
    </div>
  );
}

function NumCell({ v }: { v: number }) {
  if (v === 0) return <td className="px-2 py-2.5 text-right num text-ink-300">—</td>;
  return <td className="px-2 py-2.5 text-right num text-ink-900">{v.toLocaleString("ja-JP")}</td>;
}

function BreakdownChip({ label, v }: { label: string; v: number }) {
  return (
    <div className="border border-ink-200 rounded px-2 py-1.5">
      <div className="text-ink-500">{label}</div>
      <div className={"num font-bold text-[13px] mt-0.5 " + (v === 0 ? "text-ink-300" : "text-ink-900")}>{v === 0 ? "—" : jpy(v)}</div>
    </div>
  );
}
