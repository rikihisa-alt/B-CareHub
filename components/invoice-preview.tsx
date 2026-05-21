"use client";
import { type User, computeUserBilling } from "@/lib/data";
import { type Facility } from "@/lib/store";

/* =====================================================================
   InvoiceContent — 請求書本体（印刷対象）。modal の中・bulk 印刷の中
   どちらでも同じレイアウトで再利用される。
   ===================================================================== */

export type InvoicePayload = {
  user: User;
  facility?: Facility;
  ym: string;
  billing: ReturnType<typeof computeUserBilling>;
};

export function InvoiceContent({ user, facility, ym, billing }: InvoicePayload) {
  const dueDay = facility?.paymentDueDay ?? 15;
  const [y, m] = ym.split("-").map(Number);
  const due = new Date(y, m, dueDay); // 翌月の dueDay
  const dueLabel = `${due.getFullYear()}年${due.getMonth() + 1}月${due.getDate()}日（${"日月火水木金土"[due.getDay()]}）`;

  // 明細を日付順にソート
  const sortedItems = [...billing.items].sort((a, b) => {
    const da = a.date ?? "9999-99-99";
    const db = b.date ?? "9999-99-99";
    return da.localeCompare(db);
  });

  // 数量合計・税率別小計
  const qtyTotal = billing.items.reduce((s, i) => s + i.quantity, 0);
  const taxGroups: Record<string, number> = {};
  billing.items.forEach((i) => {
    const key = i.taxRate ? `${Math.round(i.taxRate * 100)}%` : "非課税";
    taxGroups[key] = (taxGroups[key] ?? 0) + i.amount;
  });

  return (
    <div className="invoice-paper bg-white p-8">
      {/* ヘッダー：支払期日・支払方法 */}
      <table className="w-full border border-ink-700 text-[12px]">
        <tbody>
          <tr>
            <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">お支払期日</td>
            <td className="border border-ink-700 px-3 py-2 num">{dueLabel}</td>
            <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">お支払方法</td>
            <td className="border border-ink-700 px-3 py-2">
              銀行振込（振込日が休日に重なる場合は休前日にお振込みください）
            </td>
          </tr>
          <tr>
            <td className="border border-ink-700 px-3 py-2 bg-ink-50 font-semibold">お振込先</td>
            <td className="border border-ink-700 px-3 py-2" colSpan={3}>
              {facility?.bankAccounts && facility.bankAccounts.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-[11px] text-ink-600 mb-1">下記いずれかの口座へお振込みください</div>
                  {facility.bankAccounts.map((acc, i) => (
                    <div key={i} className="num text-[12px]">
                      【{acc.bank}{acc.branch ? ` ${acc.branch}` : ""}】 {acc.type} {acc.number} {acc.holder}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-ink-400">振込先未設定（マスタ・データ管理から設定してください）</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 顧客情報 */}
      <table className="w-full border border-ink-700 text-[12px] mt-3">
        <tbody>
          <tr>
            <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">顧客氏名</td>
            <td className="border border-ink-700 px-3 py-2 text-[14px] font-semibold">{user.name} 様</td>
            <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">対象年月</td>
            <td className="border border-ink-700 px-3 py-2 num">{ym.replace("-", "年")}月分</td>
          </tr>
          {facility && (
            <tr>
              <td className="border border-ink-700 px-3 py-2 bg-ink-50 font-semibold">請求元</td>
              <td className="border border-ink-700 px-3 py-2" colSpan={3}>
                {facility.name}
                {facility.address && <span className="ml-2 text-[11px] text-ink-600">{facility.address}</span>}
                {facility.phone && <span className="ml-2 text-[11px] text-ink-600 num">TEL {facility.phone}</span>}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 備考 */}
      {facility?.invoiceNote && (
        <div className="border border-ink-700 mt-3 px-3 py-2 text-[11px] bg-warn-50/30 whitespace-pre-line">
          <span className="font-semibold">備　考　</span>{facility.invoiceNote}
        </div>
      )}

      {/* 明細表 */}
      <table className="w-full border border-ink-700 text-[11px] mt-3">
        <thead>
          <tr className="bg-ink-50">
            <th className="border border-ink-700 px-2 py-1.5 font-semibold w-28">日　付</th>
            <th className="border border-ink-700 px-2 py-1.5 font-semibold">種別名</th>
            <th className="border border-ink-700 px-2 py-1.5 font-semibold w-14">数量</th>
            <th className="border border-ink-700 px-2 py-1.5 font-semibold w-14">税率</th>
            <th className="border border-ink-700 px-2 py-1.5 font-semibold w-20">単価</th>
            <th className="border border-ink-700 px-2 py-1.5 font-semibold w-24">金額</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.length === 0 && (
            <tr>
              <td colSpan={6} className="border border-ink-700 px-2 py-6 text-center text-ink-400">明細がありません</td>
            </tr>
          )}
          {sortedItems.map((it) => (
            <tr key={it.id}>
              <td className="border border-ink-700 px-2 py-1 num">{it.date ?? `${ym}-—`}</td>
              <td className="border border-ink-700 px-2 py-1">
                {it.category} {it.name}
              </td>
              <td className="border border-ink-700 px-2 py-1 text-right num">{it.quantity}</td>
              <td className="border border-ink-700 px-2 py-1 text-right num">{it.taxRate ? `${Math.round(it.taxRate * 100)}%` : "—"}</td>
              <td className="border border-ink-700 px-2 py-1 text-right num">{it.unitPrice.toLocaleString()}</td>
              <td className="border border-ink-700 px-2 py-1 text-right num">{it.amount.toLocaleString()}</td>
            </tr>
          ))}
          <tr className="bg-ink-50 font-semibold">
            <td className="border border-ink-700 px-2 py-1.5"></td>
            <td className="border border-ink-700 px-2 py-1.5">【{user.name} 様　計】</td>
            <td className="border border-ink-700 px-2 py-1.5 text-right num">{qtyTotal}</td>
            <td className="border border-ink-700 px-2 py-1.5"></td>
            <td className="border border-ink-700 px-2 py-1.5"></td>
            <td className="border border-ink-700 px-2 py-1.5 text-right num text-[13px]">{billing.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* 税率別内訳 */}
      {Object.keys(taxGroups).length > 0 && (
        <table className="w-full text-[11px] mt-3">
          <tbody>
            <tr>
              <td className="text-right py-1 text-ink-600 w-32">税率別内訳：</td>
              {Object.entries(taxGroups).map(([k, v]) => (
                <td key={k} className="text-right py-1 num pl-3">{k} 計 {v.toLocaleString()} 円</td>
              ))}
              <td className="text-right py-1 pl-3 font-semibold text-[14px]">ご請求合計 ¥{billing.total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

/* =====================================================================
   InvoicePreview — モーダル単票プレビュー
   ===================================================================== */

export function InvoicePreview({ open, onClose, user, facility, ym, billing }: {
  open: boolean;
  onClose: () => void;
} & InvoicePayload) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-w-4xl mx-auto my-6">
        <div className="bg-white rounded-t-lg px-4 py-2 flex justify-between items-center no-print">
          <div className="text-[12px] text-ink-600">請求書プレビュー（A4縦・印刷推奨）</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn btn-sm btn-primary">印刷 / PDF保存</button>
            <button onClick={onClose} className="btn btn-sm">閉じる</button>
          </div>
        </div>

        <div className="print-area">
          <InvoiceContent user={user} facility={facility} ym={ym} billing={billing} />
        </div>
      </div>
      <PrintCss />
    </div>
  );
}

/* =====================================================================
   InvoiceBulkPrint — 複数利用者分まとめてプレビュー＋印刷
   ===================================================================== */

export function InvoiceBulkPrint({ open, onClose, invoices }: {
  open: boolean;
  onClose: () => void;
  invoices: InvoicePayload[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-w-4xl mx-auto my-6">
        <div className="bg-white rounded-t-lg px-4 py-2 flex justify-between items-center no-print">
          <div className="text-[12px] text-ink-600">
            一括請求書プレビュー（{invoices.length} 名分・各 1 ページ）
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn btn-sm btn-primary">{invoices.length} 名分まとめて印刷</button>
            <button onClick={onClose} className="btn btn-sm">閉じる</button>
          </div>
        </div>

        <div className="print-area">
          {invoices.map((inv) => (
            <InvoiceContent key={inv.user.id} {...inv} />
          ))}
        </div>
      </div>
      <PrintCss />
    </div>
  );
}

function PrintCss() {
  return (
    <style jsx global>{`
      @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .invoice-paper { padding: 12mm 10mm; page-break-after: always; }
        .invoice-paper:last-child { page-break-after: auto; }
      }
    `}</style>
  );
}
