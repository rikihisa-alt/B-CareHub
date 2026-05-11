"use client";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

const categories = [
  { group: "施設・部屋", items: [
    { name: "施設情報", desc: "施設名、住所、ロゴ、印鑑欄", count: 1 },
    { name: "部屋マスタ", desc: "部屋番号、定員、家賃ベース額", count: 16 },
  ]},
  { group: "食事", items: [
    { name: "食事業者", desc: "業者名、種別、配達ルール（土曜まとめ等）", count: 3 },
    { name: "食事区分・形態", desc: "朝/昼/夕、普通・きざみ・ミキサー等", count: 6 },
    { name: "パン・ジュース商品", desc: "種類・単価", count: 8 },
    { name: "食費単価", desc: "朝食・昼食(業者別)・夕食(業者別)・パン・ジュース", count: 7 },
    { name: "キャンセル理由", desc: "通院、通所、家族外出、体調不良 等", count: 12 },
  ]},
  { group: "請求", items: [
    { name: "請求項目", desc: "家賃、共益費、水道光熱費、管理費、生活支援費...", count: 14 },
    { name: "固定費 デフォルト", desc: "部屋タイプ別の標準額", count: 4 },
    { name: "支払方法", desc: "口座振替、銀行振込、現金、その他", count: 4 },
    { name: "税区分", desc: "課税/非課税/不課税", count: 3 },
  ]},
  { group: "日用品", items: [
    { name: "日用品マスタ", desc: "商品、カテゴリ、仕入単価、売価、最低在庫", count: 28 },
    { name: "発注先", desc: "業者名・連絡先", count: 5 },
    { name: "商品カテゴリ", desc: "排泄ケア、口腔ケア、感染対策、共用消耗品", count: 6 },
  ]},
  { group: "業務管理", items: [
    { name: "書類種別", desc: "保険証、受給者証、契約書、訪問看護指示書...", count: 11 },
    { name: "タスク種別", desc: "請求、ケア、書類、連絡、棚卸、その他", count: 6 },
    { name: "関係機関", desc: "ケアマネ、医療機関、訪問看護ST、訪問介護事業所", count: 18 },
    { name: "祝日", desc: "祝日カレンダー（食事配達ルール用）", count: 16 },
  ]},
];

export default function MastersPage() {
  const [editing, setEditing] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">マスタ管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">業務マスタの編集。変更履歴は監査ログに残ります。</p>
        </div>
        <button onClick={() => setCsvOpen(true)} className="btn text-[12px]">CSV インポート</button>
      </div>

      <div className="card p-3 text-[12px] text-ink-600 bg-info-50/40 border-l-[3px] border-info-600">
        マスタ変更は食事発注・請求の計算に直接影響します。確定済の発注・請求は再計算されないため、月の途中での単価変更等は影響範囲をご確認ください。
      </div>

      {categories.map((cat) => (
        <section key={cat.group}>
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider mb-2">{cat.group}</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
                <tr className="text-left">
                  <th className="px-4 py-2 text-[11px] font-semibold">マスタ名</th>
                  <th className="px-4 py-2 text-[11px] font-semibold">説明</th>
                  <th className="px-4 py-2 text-[11px] font-semibold text-right w-20">登録数</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-24 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((it) => (
                  <tr key={it.name} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-4 py-2.5 font-medium text-ink-900">{it.name}</td>
                    <td className="px-4 py-2.5 text-[12px] text-ink-600">{it.desc}</td>
                    <td className="px-4 py-2.5 text-right num text-ink-700">{it.count}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => setEditing(it.name)} className="btn btn-arrow text-[11px] py-0.5">編集</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="text-[11px] text-ink-500 pt-2 border-t border-ink-200">
        ※ このプロトタイプではマスタ編集モーダルは簡易表示。商用版では各マスタ別に専用編集画面（一括編集 / 履歴 / インポート）を提供します。
        <Link href="/admin/audit-logs" className="text-brand-700 hover:underline ml-2">監査ログを見る →</Link>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`${editing ?? ""} の編集`} size="lg" footer={<><button className="btn text-[12px]" onClick={() => setEditing(null)}>取消</button><button className="btn btn-primary text-[12px]" onClick={() => { toast(`${editing} を保存しました`, "ok"); setEditing(null); }}>保存</button></>}>
        <div className="text-[12px] text-ink-600 mb-3">このマスタの登録項目を編集します。実装プロトタイプでは編集 UI を簡略表示しています。</div>
        <textarea rows={6} className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[12px]" defaultValue={`# ${editing}\n# 1行1レコード（モック）\nレコード1\nレコード2\nレコード3`} />
      </Modal>

      <Modal open={csvOpen} onClose={() => setCsvOpen(false)} title="CSV インポート" footer={<><button className="btn text-[12px]" onClick={() => setCsvOpen(false)}>取消</button><button className="btn btn-primary text-[12px]" onClick={() => { toast("CSV をインポートしました（モック）", "ok"); setCsvOpen(false); }}>インポート</button></>}>
        <div className="space-y-3">
          <F label="対象マスタ">
            <select className="w-full px-3 py-2 border border-ink-200 rounded">
              {categories.flatMap((c) => c.items).map((it) => <option key={it.name}>{it.name}</option>)}
            </select>
          </F>
          <F label="CSV ファイル">
            <input type="file" accept=".csv" className="w-full text-[12px]" />
          </F>
        </div>
      </Modal>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-ink-600 mb-1">{label}</div>{children}</div>;
}
