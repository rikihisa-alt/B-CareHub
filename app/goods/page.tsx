"use client";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";
import { Pill, FilterChip, Field, Input, Select, ModalFooter } from "@/components/ui/primitives";

type Good = { name: string; cat: string; supplier: string; stock: number; min: number; price: number; monthUsed: number; billable: boolean };

const INITIAL: Good[] = [
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
  const [goods, setGoods] = useState<Good[]>(INITIAL);
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
    downloadCsv("発注候補表.csv", [
      ["商品名", "カテゴリ", "発注先", "現在庫", "最低在庫", "推奨発注数"],
      ...lowStock.map((g) => [g.name, g.cat, g.supplier, g.stock, g.min, Math.max(g.min * 2 - g.stock, 0)]),
    ]);
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">日用品管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            登録 {goods.length} 品目 ／ 在庫不足 <span className="text-warn-700 font-semibold">{lowStock.length} 品目</span>
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => setOrderOpen(true)} className="btn">発注候補表</button>
          <button onClick={() => setNewOpen(true)} className="btn btn-primary">＋ 商品登録</button>
        </div>
      </header>

      <div className="card p-3 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>すべて ({goods.length})</FilterChip>
        <FilterChip active={filter === "low"} onClick={() => setFilter("low")}>在庫不足 ({lowStock.length})</FilterChip>
        <FilterChip active={filter === "billable"} onClick={() => setFilter("billable")}>利用者請求対象</FilterChip>
        <FilterChip active={filter === "common"} onClick={() => setFilter("common")}>施設共用</FilterChip>
        <input
          type="search"
          placeholder="商品名で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto px-3 py-1 border border-ink-200 rounded w-56 text-[12px]"
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
                    <Pill tone={low ? "warn" : "ok"}>{low ? "要発注" : "OK"}</Pill>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setEditTarget(g)} className="btn btn-sm">編集</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        title={`発注候補表（${lowStock.length} 品目）`}
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setOrderOpen(false)}
            onConfirm={() => { toast("発注を業者へ送信しました（モック）", "ok"); setOrderOpen(false); }}
            cancelLabel="閉じる"
            confirmLabel="業者へ送信"
            extra={<button className="btn btn-sm" onClick={() => { exportSuggestions(); setOrderOpen(false); }}>CSV ダウンロード</button>}
          />
        }
      >
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

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="商品登録"
        footer={
          <ModalFooter
            onCancel={() => setNewOpen(false)}
            onConfirm={() => {
              setGoods((g) => [...g, { name: "新商品", cat: "その他", supplier: "—", stock: 0, min: 0, price: 0, monthUsed: 0, billable: true }]);
              toast("商品を登録しました", "ok");
              setNewOpen(false);
            }}
            confirmLabel="登録"
          />
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="商品名"><Input /></Field>
          <Field label="カテゴリ">
            <Select><option>排泄ケア</option><option>口腔ケア</option><option>感染対策</option><option>共用消耗品</option></Select>
          </Field>
          <Field label="発注先"><Input /></Field>
          <Field label="単価"><Input type="number" className="num" /></Field>
          <Field label="最低在庫"><Input type="number" className="num" /></Field>
          <Field label="利用者請求対象"><Select><option>対象</option><option>共用</option></Select></Field>
        </div>
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`商品編集：${editTarget?.name ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => setEditTarget(null)}
            onConfirm={() => { toast("商品情報を保存しました", "ok"); setEditTarget(null); }}
          />
        }
      >
        {editTarget && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="商品名"><Input defaultValue={editTarget.name} /></Field>
            <Field label="単価"><Input type="number" defaultValue={editTarget.price} className="num" /></Field>
            <Field label="在庫"><Input type="number" defaultValue={editTarget.stock} className="num" /></Field>
            <Field label="最低在庫"><Input type="number" defaultValue={editTarget.min} className="num" /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
