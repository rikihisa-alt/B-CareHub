"use client";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";

type Good = { name: string; cat: string; supplier: string; stock: number; min: number; price: number; monthUsed: number; billable: boolean };

const initial: Good[] = [
  { name: "おむつ Lサイズ", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 24, min: 40, price: 85, monthUsed: 312, billable: true },
  { name: "尿取りパッド 夜用", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 56, min: 60, price: 32, monthUsed: 488, billable: true },
  { name: "リハビリパンツ M", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 80, min: 30, price: 110, monthUsed: 145, billable: true },
  { name: "おしりふき", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 12, min: 20, price: 180, monthUsed: 56, billable: true },
  { name: "ティッシュ", cat: "共用消耗品", supplier: "イサミ商店", stock: 38, min: 30, price: 220, monthUsed: 22, billable: false },
  { name: "トイレットペーパー", cat: "共用消耗品", supplier: "イサミ商店", stock: 64, min: 36, price: 480, monthUsed: 28, billable: false },
  { name: "口腔ケアスポンジ", cat: "口腔ケア", supplier: "ヘルスケア商事", stock: 200, min: 100, price: 14, monthUsed: 280, billable: true },
  { name: "使い捨て手袋 M", cat: "感染対策", supplier: "イサミ商店", stock: 4, min: 10, price: 980, monthUsed: 18, billable: false },
];

type Filter = "all" | "low" | "billable" | "common";

export default function GoodsPage() {
  const [goods, setGoods] = useState<Good[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Good | null>(null);

  const list = useMemo(() => goods.filter((g) => {
    if (filter === "low" && g.stock >= g.min) return false;
    if (filter === "billable" && !g.billable) return false;
    if (filter === "common" && g.billable) return false;
    if (q && !g.name.includes(q)) return false;
    return true;
  }), [goods, filter, q]);

  const lowStock = goods.filter((g) => g.stock < g.min);

  function exportSuggestions() {
    const rows: (string | number)[][] = [
      ["商品名", "カテゴリ", "発注先", "現在庫", "最低在庫", "推奨発注数"],
      ...lowStock.map((g) => [g.name, g.cat, g.supplier, g.stock, g.min, Math.max(g.min * 2 - g.stock, 0)]),
    ];
    downloadCsv("発注候補表.csv", rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">日用品管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            登録 {goods.length} 品目 ／ 在庫不足 <span className="text-warn-700 font-semibold">{lowStock.length} 品目</span>
          </p>
        </div>
        <div className="flex gap-2 text-[12px] no-print">
          <button onClick={() => setOrderOpen(true)} className="btn">発注候補表</button>
          <button onClick={() => setNewOpen(true)} className="btn btn-primary">＋ 商品登録</button>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>すべて ({goods.length})</Chip>
        <Chip active={filter === "low"} onClick={() => setFilter("low")}>在庫不足 ({lowStock.length})</Chip>
        <Chip active={filter === "billable"} onClick={() => setFilter("billable")}>利用者請求対象</Chip>
        <Chip active={filter === "common"} onClick={() => setFilter("common")}>施設共用</Chip>
        <input
          type="search"
          placeholder="商品名で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto px-3 py-1 border border-ink-200 rounded w-56"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <th className="px-3 py-2.5 text-[11px] font-semibold">商品名</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">カテゴリ</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">発注先</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">単価</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">在庫</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">最低在庫</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">今月使用</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-center">利用者請求</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-center">状態</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-center w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-[12px] text-ink-500">該当する商品がありません</td></tr>
            )}
            {list.map((g) => {
              const low = g.stock < g.min;
              return (
                <tr key={g.name} className={"border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60 " + (low ? "bg-warn-50/30" : "")}>
                  <td className="px-3 py-2.5 font-medium text-ink-900">{g.name}</td>
                  <td className="px-3 py-2.5 text-ink-600 text-[12px]">{g.cat}</td>
                  <td className="px-3 py-2.5 text-ink-700 text-[12px]">{g.supplier}</td>
                  <td className="px-3 py-2.5 text-right num">¥{g.price}</td>
                  <td className={"px-3 py-2.5 text-right num font-bold " + (low ? "text-warn-700" : "text-ink-900")}>{g.stock}</td>
                  <td className="px-3 py-2.5 text-right num text-ink-500">{g.min}</td>
                  <td className="px-3 py-2.5 text-right num text-ink-900">{g.monthUsed}</td>
                  <td className="px-3 py-2.5 text-center text-[12px]">{g.billable ? <span className="text-ok-700 font-semibold">対象</span> : <span className="text-ink-400">共用</span>}</td>
                  <td className="px-3 py-2.5 text-center">
                    {low
                      ? <span className="text-[11px] px-2 py-0.5 rounded border bg-warn-50 text-warn-700 border-warn-600/30 font-semibold">要発注</span>
                      : <span className="text-[11px] px-2 py-0.5 rounded border bg-ok-50 text-ok-700 border-ok-600/30 font-semibold">OK</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setEditTarget(g)} className="btn text-[11px] py-0.5">編集</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 発注候補モーダル */}
      <Modal open={orderOpen} onClose={() => setOrderOpen(false)} title={`発注候補表（${lowStock.length} 品目）`} size="lg" footer={
        <>
          <button className="btn text-[12px]" onClick={() => setOrderOpen(false)}>閉じる</button>
          <button className="btn text-[12px]" onClick={() => { exportSuggestions(); setOrderOpen(false); }}>CSV ダウンロード</button>
          <button className="btn btn-primary text-[12px]" onClick={() => { toast("発注を業者へ送信しました（モック）", "ok"); setOrderOpen(false); }}>業者へ送信</button>
        </>
      }>
        <table className="w-full text-[12px]">
          <thead className="border-b border-ink-200">
            <tr className="text-left text-ink-600">
              <th className="py-1.5">商品</th><th>発注先</th><th className="text-right">在庫</th><th className="text-right">最低</th><th className="text-right">推奨</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((g) => (
              <tr key={g.name} className="border-b border-ink-100">
                <td className="py-1.5">{g.name}</td>
                <td className="text-ink-600">{g.supplier}</td>
                <td className="text-right num">{g.stock}</td>
                <td className="text-right num text-ink-500">{g.min}</td>
                <td className="text-right num font-bold text-brand-700">{Math.max(g.min * 2 - g.stock, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* 新規商品 */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="商品登録" footer={
        <>
          <button className="btn text-[12px]" onClick={() => setNewOpen(false)}>取消</button>
          <button className="btn btn-primary text-[12px]" onClick={() => {
            setGoods((g) => [...g, { name: "新商品", cat: "その他", supplier: "—", stock: 0, min: 0, price: 0, monthUsed: 0, billable: true }]);
            toast("商品を登録しました", "ok");
            setNewOpen(false);
          }}>登録</button>
        </>
      }>
        <div className="grid grid-cols-2 gap-3">
          <F label="商品名"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="カテゴリ"><select className="w-full px-3 py-2 border border-ink-200 rounded"><option>排泄ケア</option><option>口腔ケア</option><option>感染対策</option><option>共用消耗品</option></select></F>
          <F label="発注先"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="単価"><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded num" /></F>
          <F label="最低在庫"><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded num" /></F>
          <F label="利用者請求対象">
            <select className="w-full px-3 py-2 border border-ink-200 rounded"><option>対象</option><option>共用</option></select>
          </F>
        </div>
      </Modal>

      {/* 編集 */}
      <Modal open={editTarget !== null} onClose={() => setEditTarget(null)} title={`商品編集：${editTarget?.name ?? ""}`} footer={
        <>
          <button className="btn text-[12px]" onClick={() => setEditTarget(null)}>取消</button>
          <button className="btn btn-primary text-[12px]" onClick={() => { toast("商品情報を保存しました", "ok"); setEditTarget(null); }}>保存</button>
        </>
      }>
        {editTarget && (
          <div className="grid grid-cols-2 gap-3">
            <F label="商品名"><input className="w-full px-3 py-2 border border-ink-200 rounded" defaultValue={editTarget.name} /></F>
            <F label="単価"><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded num" defaultValue={editTarget.price} /></F>
            <F label="在庫"><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded num" defaultValue={editTarget.stock} /></F>
            <F label="最低在庫"><input type="number" className="w-full px-3 py-2 border border-ink-200 rounded num" defaultValue={editTarget.min} /></F>
          </div>
        )}
      </Modal>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-ink-600 mb-1">{label}</div>{children}</div>;
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={"px-3 py-1.5 rounded border " + (active ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")}
    >
      {children}
    </button>
  );
}
