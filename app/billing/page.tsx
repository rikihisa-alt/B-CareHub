"use client";
import Link from "next/link";
import { useState } from "react";
import { users, totalOf, jpy } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";

export default function BillingPage() {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const sum = (k: keyof typeof users[number]["monthlyBilling"]) => users.reduce((s, u) => s + u.monthlyBilling[k], 0);
  const totalAll = users.reduce((s, u) => s + totalOf(u), 0);
  const suspect = users.filter((u) => u.status === "入居中" && u.monthlyBilling.meal === 0);

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["部屋", "氏名", "家賃", "共益", "水光熱", "管理", "食費", "日用品", "介護", "看護", "立替", "その他", "合計"],
      ...users.map((u) => {
        const b = u.monthlyBilling;
        return [u.room, u.name, b.rent, b.common, b.utility, b.admin, b.meal, b.goods, b.care, b.nursing, b.advance, b.other, totalOf(u)];
      }),
    ];
    downloadCsv(`月次請求_2026-05.csv`, rows);
  }

  function bulkConfirm() {
    setConfirmedIds(new Set(users.map((u) => u.id)));
    setBulkOpen(false);
    toast(`${users.length} 名分の請求を一括確定しました`, "ok");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">月次請求管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            2026年5月分 ／ 利用者 {users.length}名 ／ 合計 <span className="font-bold text-brand-700 num">{jpy(totalAll)}</span> ／ 確定 {confirmedIds.size}件 ／ 未確定 {users.length - confirmedIds.size}件
          </p>
        </div>
        <div className="flex gap-2 text-[12px] no-print">
          <button onClick={exportCsv} className="btn">CSV出力</button>
          <button onClick={doPrint} className="btn">印刷</button>
          <button onClick={() => setBulkOpen(true)} className="btn btn-primary">一括確定</button>
        </div>
      </div>

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
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr>
              <Th className="text-left w-14">部屋</Th>
              <Th className="text-left">氏名</Th>
              <Th>家賃</Th><Th>共益</Th><Th>水光熱</Th><Th>管理</Th>
              <Th>食費</Th><Th>日用品</Th><Th>介護</Th><Th>看護</Th><Th>立替</Th><Th>その他</Th>
              <Th className="text-right">合計</Th>
              <Th className="w-24">ステータス</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const b = u.monthlyBilling;
              const total = totalOf(u);
              const isConfirmed = confirmedIds.has(u.id);
              return (
                <tr key={u.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                  <td className="px-2 py-2.5 num font-semibold text-ink-900">{u.room}</td>
                  <td className="px-2 py-2.5">
                    <Link href={`/users/${u.id}`} className="hover:underline text-brand-700">{u.name}</Link>
                  </td>
                  <Td v={b.rent} /><Td v={b.common} /><Td v={b.utility} /><Td v={b.admin} />
                  <Td v={b.meal} /><Td v={b.goods} /><Td v={b.care} /><Td v={b.nursing} /><Td v={b.advance} /><Td v={b.other} />
                  <td className="px-2 py-2.5 text-right num font-bold text-brand-700">{jpy(total)}</td>
                  <td className="px-2 py-2.5 text-center">
                    {isConfirmed
                      ? <span className="text-[11px] px-2 py-0.5 rounded border bg-ok-50 text-ok-700 border-ok-600/30 font-semibold">確定済</span>
                      : <span className="text-[11px] px-2 py-0.5 rounded border bg-warn-50 text-warn-700 border-warn-600/30 font-semibold">未確定</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-ink-50 border-t-2 border-ink-200">
            <tr>
              <td className="px-2 py-3 text-[13px] font-semibold" colSpan={2}>合計</td>
              <Tf v={sum("rent")} /><Tf v={sum("common")} /><Tf v={sum("utility")} /><Tf v={sum("admin")} />
              <Tf v={sum("meal")} /><Tf v={sum("goods")} /><Tf v={sum("care")} /><Tf v={sum("nursing")} /><Tf v={sum("advance")} /><Tf v={sum("other")} />
              <td className="px-2 py-3 text-right num text-[15px] font-bold text-brand-700">{jpy(totalAll)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[11px] text-ink-500">
        ※ 氏名クリックで利用者別請求明細を開きます。請求確定後は自動再計算で上書きされません。
      </p>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="月次請求 一括確定"
        footer={<>
          <button className="btn text-[12px]" onClick={() => setBulkOpen(false)}>取消</button>
          <button className="btn btn-primary text-[12px]" onClick={bulkConfirm}>一括確定する</button>
        </>}
      >
        <p>2026年5月分の請求 <b>{users.length} 件</b>（合計 <b>{jpy(totalAll)}</b>）を一括確定します。</p>
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

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={"px-2 py-2.5 text-[11px] font-semibold text-right " + (className ?? "")}>{children}</th>;
}
function Td({ v }: { v: number }) {
  if (v === 0) return <td className="px-2 py-2.5 text-right num text-ink-300">—</td>;
  return <td className="px-2 py-2.5 text-right num text-ink-900">{v.toLocaleString("ja-JP")}</td>;
}
function Tf({ v }: { v: number }) {
  return <td className="px-2 py-3 text-right num font-semibold text-ink-900">{v.toLocaleString("ja-JP")}</td>;
}
