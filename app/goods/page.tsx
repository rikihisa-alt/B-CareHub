"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useGoods, logActivity, genId } from "@/lib/store";
import { type DailyGood } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";
import { Pill, FilterChip, Field, Input, Select, ModalFooter } from "@/components/ui/primitives";

type Filter = "all" | "low" | "billable" | "common";

type Draft = Omit<DailyGood, "id">;

function emptyDraft(): Draft {
  return { name: "", cat: "排泄ケア", supplier: "", stock: 0, min: 0, price: 0, monthUsed: 0, billable: true };
}

export default function GoodsPage() {
  const [goods, setGoods] = useGoods();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyGood | null>(null);
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft());
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft());

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

  function addGood() {
    if (!newDraft.name.trim()) {
      toast("商品名を入力してください", "warn");
      return;
    }
    const id = genId("G");
    setGoods((cur) => [...cur, { id, ...newDraft }]);
    logActivity(`日用品「${newDraft.name}」を登録`);
    toast("商品を登録しました", "ok");
    setNewOpen(false);
    setNewDraft(emptyDraft());
  }

  function saveEdit() {
    if (!editTarget) return;
    setGoods((cur) => cur.map((g) => g.id === editTarget.id ? { ...g, ...editDraft } : g));
    logActivity(`日用品「${editDraft.name}」を更新`);
    toast("商品情報を保存しました", "ok");
    setEditTarget(null);
  }

  function deleteGood(id: string, name: string) {
    if (!window.confirm(`「${name}」を削除します。よろしいですか？`)) return;
    setGoods((cur) => cur.filter((g) => g.id !== id));
    logActivity(`日用品「${name}」を削除`);
    toast("商品を削除しました", "ok");
    setEditTarget(null);
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
          <button onClick={() => setOrderOpen(true)} className="btn" disabled={lowStock.length === 0}>発注候補表</button>
          <button onClick={() => { setNewDraft(emptyDraft()); setNewOpen(true); }} className="btn btn-primary">＋ 商品登録</button>
        </div>
      </header>

      <div className="card p-3 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>すべて ({goods.length})</FilterChip>
        <FilterChip active={filter === "low"} onClick={() => setFilter("low")}>在庫不足 ({lowStock.length})</FilterChip>
        <FilterChip active={filter === "billable"} onClick={() => setFilter("billable")}>利用者請求対象</FilterChip>
        <FilterChip active={filter === "common"} onClick={() => setFilter("common")}>施設共用</FilterChip>
        <input type="search" placeholder="商品名で検索" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto px-3 py-1 border border-ink-200 rounded w-56 text-[12px]" />
      </div>

      <div className="card overflow-x-auto">
        {list.length === 0 ? (
          <div className="px-3 py-12 text-center">
            {goods.length === 0 ? (
              <>
                <div className="text-[14px] font-semibold text-ink-800 mb-1">📦 日用品管理の使い方</div>
                <p className="text-[12px] text-ink-600 mb-4 leading-relaxed max-w-md mx-auto">
                  おむつ・パッド・ティッシュなどの商品マスタを登録すると、在庫数が最低在庫を下回ったときに<br />
                  自動でアラートが表示され、発注候補表を CSV で書き出せます。
                </p>
                <button onClick={() => { setNewDraft(emptyDraft()); setNewOpen(true); }} className="btn btn-primary">
                  ＋ 最初の商品を登録する
                </button>
              </>
            ) : (
              <span className="text-[13px] text-ink-500">該当する商品がありません。</span>
            )}
          </div>
        ) : (
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
              {list.map((g) => {
                const low = g.stock < g.min;
                return (
                  <tr key={g.id} className={"border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60 " + (low ? "bg-warn-50/30" : "")}>
                    <td className="px-3 py-2.5 font-medium text-ink-900">{g.name}</td>
                    <td className="px-3 py-2.5 text-ink-600 text-[12px]">{g.cat}</td>
                    <td className="px-3 py-2.5 text-ink-700 text-[12px]">{g.supplier || "—"}</td>
                    <td className="px-3 py-2.5 text-right num">¥{g.price}</td>
                    <td className={"px-3 py-2.5 text-right num font-bold " + (low ? "text-warn-700" : "text-ink-900")}>{g.stock}</td>
                    <td className="px-3 py-2.5 text-right num text-ink-500">{g.min}</td>
                    <td className="px-3 py-2.5 text-right num text-ink-900">{g.monthUsed}</td>
                    <td className="px-3 py-2.5 text-center text-[12px]">
                      {g.billable ? <span className="text-ok-700 font-semibold">対象</span> : <span className="text-ink-400">共用</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Pill tone={low ? "warn" : "ok"}>{low ? "要発注" : "OK"}</Pill>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => { setEditDraft({ ...g }); setEditTarget(g); }} className="btn btn-sm">編集</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        title={`発注候補表（${lowStock.length} 品目）`}
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setOrderOpen(false)}
            onConfirm={() => { logActivity("発注候補表 を業者へ送信"); toast("発注を業者へ送信しました（モック）", "ok"); setOrderOpen(false); }}
            cancelLabel="閉じる"
            confirmLabel="業者へ送信"
            extra={<button className="btn btn-sm" onClick={() => { exportSuggestions(); }}>CSV ダウンロード</button>}
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
              <tr key={g.id} className="border-b border-ink-100">
                <td className="py-1.5">{g.name}</td>
                <td className="text-ink-600">{g.supplier || "—"}</td>
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
        footer={<ModalFooter onCancel={() => setNewOpen(false)} onConfirm={addGood} confirmLabel="登録" />}
      >
        <GoodForm draft={newDraft} setDraft={setNewDraft} />
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`商品編集：${editTarget?.name ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => setEditTarget(null)}
            onConfirm={saveEdit}
            extra={editTarget && <button onClick={() => deleteGood(editTarget.id, editTarget.name)} className="btn btn-sm text-err-700">削除</button>}
          />
        }
      >
        <GoodForm draft={editDraft} setDraft={setEditDraft} />
      </Modal>
    </div>
  );
}

function GoodForm({ draft, setDraft }: { draft: Omit<DailyGood, "id">; setDraft: (d: Omit<DailyGood, "id">) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="商品名（必須）"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
      <Field label="カテゴリ">
        <Select value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })}>
          <option>排泄ケア</option><option>口腔ケア</option><option>感染対策</option><option>共用消耗品</option><option>その他</option>
        </Select>
      </Field>
      <Field label="発注先"><Input value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} /></Field>
      <Field label="単価"><Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} className="num" /></Field>
      <Field label="在庫数"><Input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) || 0 })} className="num" /></Field>
      <Field label="最低在庫"><Input type="number" value={draft.min} onChange={(e) => setDraft({ ...draft, min: Number(e.target.value) || 0 })} className="num" /></Field>
      <Field label="利用者請求対象">
        <Select value={draft.billable ? "1" : "0"} onChange={(e) => setDraft({ ...draft, billable: e.target.value === "1" })}>
          <option value="1">対象</option><option value="0">共用</option>
        </Select>
      </Field>
    </div>
  );
}
