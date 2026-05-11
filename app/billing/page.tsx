"use client";
import Link from "next/link";
import { useState } from "react";
import { totalOf, jpy } from "@/lib/data";
import { useUsers, useBillingConfirmations, logActivity, todayIso } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";
import { Pill, Th, ModalFooter } from "@/components/ui/primitives";

type BillingKey = "rent" | "common" | "utility" | "admin" | "meal" | "goods" | "care" | "nursing" | "advance" | "other";

export default function BillingPage() {
  const [users] = useUsers();
  const [confirmations, setConfirmations] = useBillingConfirmations();
  const [bulkOpen, setBulkOpen] = useState(false);

  const today = todayIso();
  const ym = today.slice(0, 7);

  const sum = (k: BillingKey) => users.reduce((s, u) => s + u.monthlyBilling[k], 0);
  const totalAll = users.reduce((s, u) => s + totalOf(u), 0);
  const isConfirmed = (uid: string) => confirmations[`${uid}_${ym}`] === true;
  const confirmedCount = users.filter((u) => isConfirmed(u.id)).length;
  const suspect = users.filter((u) => u.status === "入居中" && u.monthlyBilling.meal === 0);

  function exportCsv() {
    downloadCsv(`月次請求_${ym}.csv`, [
      ["部屋", "氏名", "家賃", "共益", "水光熱", "管理", "食費", "日用品", "介護", "看護", "立替", "その他", "合計"],
      ...users.map((u) => {
        const b = u.monthlyBilling;
        return [u.room, u.name, b.rent, b.common, b.utility, b.admin, b.meal, b.goods, b.care, b.nursing, b.advance, b.other, totalOf(u)];
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

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">月次請求管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            {ym} 分 ／ 利用者 {users.length}名 ／ 合計 <span className="font-bold text-brand-700 num">{jpy(totalAll)}</span> ／ 確定 {confirmedCount}件 ／ 未確定 {users.length - confirmedCount}件
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={exportCsv} className="btn" disabled={users.length === 0}>CSV出力</button>
          <button onClick={doPrint} className="btn">印刷</button>
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
            <div className="text-[13px] text-ink-500 mb-3">利用者がまだ登録されていません。</div>
            <Link href="/users" className="btn btn-primary">利用者を登録する</Link>
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const b = u.monthlyBilling;
                const total = totalOf(u);
                const conf = isConfirmed(u.id);
                return (
                  <tr key={u.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-2 py-2.5 num font-semibold text-ink-900">{u.room}</td>
                    <td className="px-2 py-2.5"><Link href={`/users/${u.id}`} className="hover:underline text-brand-700">{u.name}</Link></td>
                    <NumCell v={b.rent} /><NumCell v={b.common} /><NumCell v={b.utility} /><NumCell v={b.admin} />
                    <NumCell v={b.meal} /><NumCell v={b.goods} /><NumCell v={b.care} /><NumCell v={b.nursing} /><NumCell v={b.advance} /><NumCell v={b.other} />
                    <td className="px-2 py-2.5 text-right num font-bold text-brand-700">{jpy(total)}</td>
                    <td className="px-2 py-2.5 text-center"><Pill tone={conf ? "ok" : "warn"}>{conf ? "確定済" : "未確定"}</Pill></td>
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
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <p className="text-[11px] text-ink-500">
        ※ 氏名クリックで利用者別請求明細を開きます。請求確定後は自動再計算で上書きされません。
      </p>

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
