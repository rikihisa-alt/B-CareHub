"use client";
import { type User, computeUserBilling, groupBillingByMajor, type MajorCategory } from "@/lib/data";
import { type Facility } from "@/lib/store";

const MAJOR_ORDER: MajorCategory[] = ["住居費等", "介護サービス利用料", "日常サービス利用料", "立替金", "その他"];

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

  // 発行日（今日）
  const now = new Date();
  const issueLabel = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  // 請求書番号：年月-利用者ID 末尾4桁
  const invoiceNo = `${ym}-${user.id.slice(-4).toUpperCase()}`;

  // 数量合計・税率別小計
  const qtyTotal = billing.items.reduce((s, i) => s + i.quantity, 0);
  const taxGroups: Record<string, number> = {};
  billing.items.forEach((i) => {
    const key = i.taxRate ? `${Math.round(i.taxRate * 100)}%` : "非課税";
    taxGroups[key] = (taxGroups[key] ?? 0) + i.amount;
  });

  return (
    <div className="invoice-paper bg-white p-8">
      {/* タイトル ＋ 発行日／請求書番号 */}
      <div className="text-center mb-6">
        <h1 className="text-[28px] font-bold tracking-[0.4em] text-ink-900 border-b-2 border-ink-900 inline-block pb-1 px-6">請　求　書</h1>
      </div>
      <div className="flex justify-between text-[11px] text-ink-700 mb-4">
        <div></div>
        <div className="text-right">
          <div>発行日：<span className="num">{issueLabel}</span></div>
          <div>請求書番号：<span className="num">{invoiceNo}</span></div>
        </div>
      </div>

      {/* 宛名（顧客） ／ 発行元 */}
      <div className="flex justify-between gap-6 mb-5">
        <div className="flex-1">
          <div className="text-[18px] font-semibold text-ink-900 border-b border-ink-900 pb-1 inline-block min-w-[260px]">
            {user.name}　様
          </div>
          {user.room && <div className="text-[11px] text-ink-600 mt-1">部屋 <span className="num">{user.room}</span></div>}
        </div>
        <div className="text-[11px] text-ink-800 text-right min-w-[240px]">
          {facility && (
            <>
              <div className="text-[13px] font-semibold text-ink-900">{facility.name}</div>
              {facility.address && <div className="mt-0.5">{facility.address}</div>}
              {facility.phone && <div className="num mt-0.5">TEL {facility.phone}</div>}
            </>
          )}
          <div className="mt-2 inline-block border border-ink-700 rounded-full w-12 h-12 leading-[3rem] text-center text-ink-400 text-[10px]">印</div>
        </div>
      </div>

      {/* 拝啓文 */}
      <p className="text-[12px] text-ink-800 leading-relaxed mb-2">
        　拝啓　平素より格別のお引き立てを賜り、誠にありがとうございます。<br />
        　下記のとおり <b className="num">{ym.replace("-", "年")}月分</b> の費用をご請求申し上げます。<br />
        　ご確認のうえ、お支払期日までにお振込みくださいますようお願い申し上げます。
      </p>

      {/* 合計金額（強調） */}
      <div className="border-2 border-ink-900 my-3 px-4 py-2 flex items-baseline justify-between">
        <span className="text-[14px] font-semibold">ご請求金額</span>
        <span className="num text-[22px] font-bold">¥{billing.total.toLocaleString()}-</span>
      </div>

      {/* 支払期日・方法・振込先 */}
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
                  <div className="text-[10px] text-ink-500 mt-1">※ 振込手数料はお客様ご負担にてお願い申し上げます。</div>
                </div>
              ) : (
                <span className="text-ink-400">振込先未設定（マスタ・データ管理から設定してください）</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 備考 */}
      {facility?.invoiceNote && (
        <div className="border border-ink-700 mt-3 px-3 py-2 text-[11px] bg-warn-50/30 whitespace-pre-line">
          <span className="font-semibold">備　考　</span>{facility.invoiceNote}
        </div>
      )}

      {/* ① 請求書本体（5大区分サマリ） */}
      <table className="w-full border border-ink-700 text-[12px] mt-3">
        <thead>
          <tr className="bg-ink-50">
            <th className="border border-ink-700 px-3 py-1.5 font-semibold text-left">請求区分</th>
            <th className="border border-ink-700 px-3 py-1.5 font-semibold text-right w-32">金額（税込）</th>
          </tr>
        </thead>
        <tbody>
          {MAJOR_ORDER.map((mc) => {
            const items = groupBillingByMajor(billing.items)[mc];
            const total = items.reduce((s, i) => s + i.amount, 0);
            return (
              <tr key={mc}>
                <td className="border border-ink-700 px-3 py-1.5">{mc}<span className="text-[10px] text-ink-500 ml-2">{items.length} 項目</span></td>
                <td className="border border-ink-700 px-3 py-1.5 text-right num">{total === 0 ? "—" : total.toLocaleString()}</td>
              </tr>
            );
          })}
          <tr className="bg-brand-50 font-bold">
            <td className="border border-ink-700 px-3 py-2 text-[13px]">請　求　合　計</td>
            <td className="border border-ink-700 px-3 py-2 text-right num text-[14px] text-brand-700">{billing.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* ② 明細表（5大区分ごとにグループ表示） */}
      <div className="mt-4 text-[11px] text-ink-600 font-semibold">▼ 明細</div>
      {MAJOR_ORDER.map((mc) => {
        const items = groupBillingByMajor(billing.items)[mc];
        if (items.length === 0) return null;
        const sectionTotal = items.reduce((s, i) => s + i.amount, 0);
        const sortedSection = [...items].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
        return (
          <table key={mc} className="w-full border border-ink-700 text-[11px] mt-2">
            <thead>
              <tr className="bg-ink-50">
                <th className="border border-ink-700 px-2 py-1 font-semibold text-left" colSpan={6}>【{mc}】</th>
              </tr>
              <tr className="bg-ink-50">
                <th className="border border-ink-700 px-2 py-1 font-semibold w-28">日　付</th>
                <th className="border border-ink-700 px-2 py-1 font-semibold">種別名</th>
                <th className="border border-ink-700 px-2 py-1 font-semibold w-12">数量</th>
                <th className="border border-ink-700 px-2 py-1 font-semibold w-12">税率</th>
                <th className="border border-ink-700 px-2 py-1 font-semibold w-20">単価</th>
                <th className="border border-ink-700 px-2 py-1 font-semibold w-24">金額</th>
              </tr>
            </thead>
            <tbody>
              {sortedSection.map((it) => (
                <tr key={it.id}>
                  <td className="border border-ink-700 px-2 py-1 num">{it.date ?? "—"}</td>
                  <td className="border border-ink-700 px-2 py-1">{it.category === mc.replace("利用料", "").replace("等", "") ? it.name : `${it.category} ${it.name}`}</td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.quantity}</td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.taxRate ? `${Math.round(it.taxRate * 100)}%` : "—"}</td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.unitPrice.toLocaleString()}</td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-ink-50 font-semibold">
                <td className="border border-ink-700 px-2 py-1" colSpan={5}>{mc} 計</td>
                <td className="border border-ink-700 px-2 py-1 text-right num">{sectionTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        );
      })}

      <table className="w-full border border-ink-700 text-[11px] mt-2">
        <tbody>
          <tr className="bg-ink-50 font-semibold">
            <td className="border border-ink-700 px-2 py-1.5">【{user.name} 様　全合計】</td>
            <td className="border border-ink-700 px-2 py-1.5 text-right num">数量計 {qtyTotal}</td>
            <td className="border border-ink-700 px-2 py-1.5 text-right num text-[13px] w-24">{billing.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* フッター：問い合わせ・敬具 */}
      <div className="mt-6 text-[11px] text-ink-800 leading-relaxed">
        <p>
          　ご不明な点やご請求内容についてのお問い合わせは、下記までご連絡くださいますようお願い申し上げます。<br />
          　今後とも変わらぬご愛顧を賜りますよう、よろしくお願い申し上げます。
        </p>
        <div className="mt-3 border-t border-ink-300 pt-2 grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-ink-500 mb-0.5">お問い合わせ先</div>
            {facility ? (
              <>
                <div className="font-semibold text-[12px]">{facility.name}</div>
                {facility.address && <div className="text-[10px] text-ink-600">{facility.address}</div>}
                {facility.phone && <div className="text-[10px] num">TEL {facility.phone}</div>}
              </>
            ) : (
              <span className="text-ink-400">施設情報が未設定です</span>
            )}
          </div>
          <div className="text-right text-[12px] font-semibold tracking-wider">敬　具</div>
        </div>
        <div className="text-center text-[10px] text-ink-400 mt-4">— 本紙は介護サービス利用料の自己負担分・住居費・日常生活支援費・実費立替分を含むご請求書です —</div>
      </div>

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
