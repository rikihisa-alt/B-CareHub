"use client";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Field, Input, Select, ModalFooter, Pill } from "@/components/ui/primitives";
import {
  clearAllData, exportAllData, importAllData, logActivity, genId,
  useFacilities, useCurrentFacilityId, useRooms, useMealPrices,
  type Facility, type BankAccount,
} from "@/lib/store";
import { type Room, type RoomType, type MealPrice, type MealPriceKey, type TaxRate, DEFAULT_MEAL_PRICES, jpy } from "@/lib/data";

const CATEGORIES = [
  { group: "食事", items: [
    { name: "食事業者", desc: "業者名、種別、配達ルール（土曜まとめ等）" },
    { name: "食事区分・形態", desc: "朝/昼/夕、普通・きざみ・ミキサー等" },
    { name: "パン・ジュース商品", desc: "種類・単価" },
    { name: "食費単価", desc: "朝食・昼食(業者別)・夕食(業者別)・パン・ジュース" },
    { name: "キャンセル理由", desc: "通院、通所、家族外出、体調不良 等" },
  ]},
  { group: "請求", items: [
    { name: "請求項目", desc: "家賃、共益費、水道光熱費、管理費、生活支援費..." },
    { name: "固定費 デフォルト", desc: "部屋タイプ別の標準額" },
    { name: "支払方法", desc: "口座振替、銀行振込、現金、その他" },
    { name: "税区分", desc: "課税/非課税/不課税" },
  ]},
  { group: "業務管理", items: [
    { name: "書類種別", desc: "保険証、受給者証、契約書、訪問看護指示書..." },
    { name: "タスク種別", desc: "請求、ケア、書類、連絡、棚卸、その他" },
    { name: "関係機関", desc: "ケアマネ、医療機関、訪問看護ST、訪問介護事業所" },
    { name: "祝日", desc: "祝日カレンダー（食事配達ルール用）" },
  ]},
];

type FacilityDraft = Omit<Facility, "id">;

function emptyFacilityDraft(): FacilityDraft {
  return { name: "", capacity: 16, paymentDueDay: 15, bankAccounts: [], invoiceNote: "" };
}

function emptyBankAccount(): BankAccount {
  return { bank: "", branch: "", type: "普通", number: "", holder: "" };
}

const ROOM_TYPES: RoomType[] = ["居室", "事務所", "倉庫", "共用部", "その他"];

type RoomDraft = Omit<Room, "id">;
function emptyRoomDraft(facilityId?: string): RoomDraft {
  return { facilityId, roomNo: "", type: "居室", capacity: undefined, note: "" };
}

export default function MastersPage() {
  const [facilities, setFacilities] = useFacilities();
  const [currentFacilityId, setCurrentFacilityId] = useCurrentFacilityId();
  const [rooms, setRooms] = useRooms();
  const [mealPrices, setMealPrices] = useMealPrices();
  const [mealPriceFacilityId, setMealPriceFacilityId] = useState<string | undefined>(currentFacilityId ?? facilities[0]?.id);
  const [mealPriceOpen, setMealPriceOpen] = useState(false);
  // 編集用ドラフト：選択中施設のキーマップ
  const [mealDraft, setMealDraft] = useState<Record<MealPriceKey, { label: string; price: number; taxRate: TaxRate }>>(() => {
    const m = {} as Record<MealPriceKey, { label: string; price: number; taxRate: TaxRate }>;
    DEFAULT_MEAL_PRICES.forEach((d) => { m[d.key] = { label: d.label, price: d.price, taxRate: 0.08 as TaxRate }; });
    return m;
  });

  function openMealPriceEdit() {
    // 該当施設の現在値を読み込み（無ければデフォルト）
    const fid = mealPriceFacilityId;
    const m = {} as Record<MealPriceKey, { label: string; price: number; taxRate: TaxRate }>;
    DEFAULT_MEAL_PRICES.forEach((d) => {
      const found = mealPrices.find((p) => p.key === d.key && (!p.facilityId || !fid || p.facilityId === fid));
      m[d.key] = found
        ? { label: found.label, price: found.price, taxRate: found.taxRate }
        : { label: d.label, price: d.price, taxRate: 0.08 as TaxRate };
    });
    setMealDraft(m);
    setMealPriceOpen(true);
  }

  function saveMealPrices() {
    const fid = mealPriceFacilityId;
    // 既存の該当施設の単価を削除して入れ替え
    setMealPrices((cur) => [
      ...cur.filter((p) => p.facilityId !== fid),
      ...DEFAULT_MEAL_PRICES.map((d) => ({
        id: genId("MP"),
        facilityId: fid,
        key: d.key,
        label: mealDraft[d.key].label,
        price: mealDraft[d.key].price,
        taxRate: mealDraft[d.key].taxRate,
      })),
    ]);
    logActivity(`食費単価マスタを更新（${facilities.find((f) => f.id === fid)?.name ?? "全施設"}）`);
    toast("食費単価マスタを保存しました", "ok");
    setMealPriceOpen(false);
  }
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const defaultFacilityForRoom = currentFacilityId ?? facilities[0]?.id;
  const [roomDraft, setRoomDraft] = useState<RoomDraft>(emptyRoomDraft(defaultFacilityForRoom));
  const [roomEditDraft, setRoomEditDraft] = useState<Room | null>(null);

  function addRoom() {
    if (!roomDraft.roomNo.trim()) { toast("部屋番号・名称を入力してください", "warn"); return; }
    setRooms((cur) => [...cur, { id: genId("R"), ...roomDraft }]);
    logActivity(`部屋「${roomDraft.roomNo}」(${roomDraft.type})を登録`);
    toast("部屋を登録しました", "ok");
    setAddRoomOpen(false);
    setRoomDraft(emptyRoomDraft(defaultFacilityForRoom));
  }
  function saveRoom() {
    if (!roomEditDraft) return;
    if (!roomEditDraft.roomNo.trim()) { toast("部屋番号・名称を入力してください", "warn"); return; }
    setRooms((cur) => cur.map((r) => r.id === roomEditDraft.id ? roomEditDraft : r));
    logActivity(`部屋「${roomEditDraft.roomNo}」を更新`);
    toast("部屋を更新しました", "ok");
    setEditingRoom(null); setRoomEditDraft(null);
  }
  function removeRoom(id: string) {
    const r = rooms.find((x) => x.id === id);
    if (!r) return;
    if (!window.confirm(`部屋「${r.roomNo}」を削除します。関連する光熱費データは残ります。よろしいですか？`)) return;
    setRooms((cur) => cur.filter((x) => x.id !== id));
    logActivity(`部屋「${r.roomNo}」を削除`);
    toast("削除しました", "ok");
    setEditingRoom(null); setRoomEditDraft(null);
  }

  const [addFacilityOpen, setAddFacilityOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<FacilityDraft>(emptyFacilityDraft());
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [editDraft, setEditDraft] = useState<Facility | null>(null);

  const [editing, setEditing] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");

  function openExport() {
    setExportText(exportAllData());
    setExportOpen(true);
  }

  function copyExport() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(exportText);
      toast("クリップボードへコピーしました", "ok");
    }
  }

  function downloadExport() {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `b-care-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("バックアップをダウンロードしました", "ok");
  }

  function doImport() {
    const ok = importAllData(importText);
    if (ok) {
      logActivity("データをインポート");
      toast("インポートしました。ページを再読み込みします。", "ok");
      setImportOpen(false);
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast("JSON の形式が不正です", "err");
    }
  }

  function doReset() {
    clearAllData();
    toast("全データを削除しました。ページを再読み込みします。", "warn");
    setResetOpen(false);
    setTimeout(() => window.location.reload(), 800);
  }

  function addFacility() {
    if (!addDraft.name.trim()) { toast("施設名を入力してください", "warn"); return; }
    const id = genId("F");
    setFacilities((cur) => [...cur, { id, ...addDraft }]);
    logActivity(`施設「${addDraft.name}」を追加`);
    toast("施設を追加しました", "ok");
    setAddFacilityOpen(false);
    setAddDraft(emptyFacilityDraft());
  }

  function saveFacility() {
    if (!editDraft) return;
    if (!editDraft.name.trim()) { toast("施設名を入力してください", "warn"); return; }
    setFacilities((cur) => cur.map((f) => f.id === editDraft.id ? editDraft : f));
    logActivity(`施設「${editDraft.name}」を更新`);
    toast("施設情報を保存しました", "ok");
    setEditingFacility(null);
    setEditDraft(null);
  }

  function removeFacility(id: string) {
    const f = facilities.find((x) => x.id === id);
    if (!f) return;
    if (facilities.length <= 1) { toast("最低 1 つの施設が必要です", "warn"); return; }
    if (!window.confirm(`施設「${f.name}」を削除します。所属する利用者やデータは残ります（再割当が必要）。よろしいですか？`)) return;
    setFacilities((cur) => cur.filter((x) => x.id !== id));
    if (currentFacilityId === id) setCurrentFacilityId(null);
    logActivity(`施設「${f.name}」を削除`);
    toast("施設を削除しました", "ok");
    setEditingFacility(null);
    setEditDraft(null);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">マスタ・データ管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">施設・業務マスタの編集と、データのバックアップ／復元／初期化。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openExport} className="btn">バックアップ書出</button>
          <button onClick={() => setImportOpen(true)} className="btn">インポート</button>
          <button onClick={() => setResetOpen(true)} className="btn text-err-700">全データ削除</button>
        </div>
      </header>

      <div className="card p-3 text-[12px] text-ink-600 bg-info-50/40 border-l-[3px] border-info-600">
        マスタ変更は食事発注・請求の計算に直接影響します。確定済の発注・請求は再計算されないため、月の途中での単価変更等は影響範囲をご確認ください。
        <br />
        運用データはこの端末のブラウザに保存されます。定期的にバックアップを推奨します。
      </div>

      {/* 施設一覧（複数管理） */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">施設一覧</h2>
          <button onClick={() => { setAddDraft(emptyFacilityDraft()); setAddFacilityOpen(true); }} className="btn btn-sm btn-primary">＋ 施設を追加</button>
        </div>
        <div className="card overflow-hidden">
          {facilities.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-ink-500">施設が登録されていません</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
                <tr className="text-left">
                  <th className="px-4 py-2 text-[11px] font-semibold">施設名</th>
                  <th className="px-4 py-2 text-[11px] font-semibold">住所</th>
                  <th className="px-4 py-2 text-[11px] font-semibold">電話</th>
                  <th className="px-4 py-2 text-[11px] font-semibold text-right w-20">定員</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-32 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => (
                  <tr key={f.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-ink-900">{f.name}</div>
                      <div className="text-[10px] text-ink-500 num">{f.id}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-ink-700">{f.address || "—"}</td>
                    <td className="px-4 py-2.5 text-[12px] text-ink-700 num">{f.phone || "—"}</td>
                    <td className="px-4 py-2.5 text-right num text-ink-700">{f.capacity ?? "—"}</td>
                    <td className="px-4 py-2.5 text-center flex gap-1 justify-center">
                      <button onClick={() => setCurrentFacilityId(f.id)} className={"btn btn-sm " + (currentFacilityId === f.id ? "btn-primary" : "")}>
                        {currentFacilityId === f.id ? "選択中" : "切替"}
                      </button>
                      <button onClick={() => { setEditDraft({ ...f }); setEditingFacility(f); }} className="btn btn-sm">編集</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-[11px] text-ink-500 mt-2">
          ※ 「切替」ボタンまたはヘッダーの施設スイッチャーから、操作対象の施設を切替できます。「全施設」で全データを横断表示できます。
        </p>
      </section>

      {/* 部屋一覧 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">部屋・スペース一覧</h2>
          <button onClick={() => { setRoomDraft(emptyRoomDraft(defaultFacilityForRoom)); setAddRoomOpen(true); }} className="btn btn-sm btn-primary">＋ 部屋を追加</button>
        </div>
        <div className="card overflow-hidden">
          {rooms.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-ink-500">
              <div className="mb-2">部屋がまだ登録されていません。</div>
              <p className="text-[11px]">居室（利用者の部屋）だけでなく、<b>事務所・倉庫・共用部</b> など、光熱費が発生する全てのスペースを登録できます。</p>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
                <tr className="text-left">
                  <th className="px-4 py-2 text-[11px] font-semibold w-32">部屋番号 ・ 名称</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-24">用途</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-32">所属施設</th>
                  <th className="px-4 py-2 text-[11px] font-semibold text-right w-20">定員</th>
                  <th className="px-4 py-2 text-[11px] font-semibold">備考</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-24 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => {
                  const f = facilities.find((x) => x.id === r.facilityId);
                  return (
                    <tr key={r.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                      <td className="px-4 py-2.5 font-medium text-ink-900">{r.roomNo}</td>
                      <td className="px-4 py-2.5"><Pill tone={r.type === "居室" ? "ok" : r.type === "事務所" ? "info" : "neutral"}>{r.type}</Pill></td>
                      <td className="px-4 py-2.5 text-[12px] text-ink-700">{f?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right num text-ink-700">{r.capacity ?? "—"}</td>
                      <td className="px-4 py-2.5 text-[12px] text-ink-600">{r.note || "—"}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => { setRoomEditDraft({ ...r }); setEditingRoom(r); }} className="btn btn-sm">編集</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-[11px] text-ink-500 mt-2">
          ※ 部屋を登録しておくと、光熱費管理画面のプルダウンに反映されます。事務所・倉庫など利用者がいないスペースも登録できます。
        </p>
      </section>

      {/* 食費単価マスタ */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">食費単価マスタ（請求書の食費単価）</h2>
          <div className="flex gap-2 items-center">
            {facilities.length > 1 && (
              <select value={mealPriceFacilityId ?? ""} onChange={(e) => setMealPriceFacilityId(e.target.value || undefined)} className="px-2 py-1 border border-ink-200 rounded text-[12px]">
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            <button onClick={openMealPriceEdit} className="btn btn-sm btn-primary">単価を編集</button>
          </div>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
              <tr className="text-left">
                <th className="px-4 py-2 text-[11px] font-semibold w-32">区分</th>
                <th className="px-4 py-2 text-[11px] font-semibold">請求書の表示名（種別名）</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-right w-28">単価（税込）</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-right w-20">税率</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_MEAL_PRICES.map((d) => {
                const found = mealPrices.find((p) => p.key === d.key && (!p.facilityId || !mealPriceFacilityId || p.facilityId === mealPriceFacilityId));
                const isDefault = !found;
                const p = found ?? { label: d.label, price: d.price, taxRate: 0.08 as TaxRate };
                return (
                  <tr key={d.key} className="border-b border-ink-100 last:border-b-0">
                    <td className="px-4 py-2.5 text-[12px] text-ink-700">
                      {d.key === "breakfastBread" && "朝食 パン"}
                      {d.key === "breakfastJuice" && "朝食 ジュース"}
                      {d.key === "lunchA" && "昼食 A社"}
                      {d.key === "lunchB" && "昼食 B社"}
                      {d.key === "dinnerA" && "夕食 A社"}
                      {d.key === "dinnerB" && "夕食 B社"}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink-900">
                      {p.label}
                      {isDefault && <span className="ml-2 text-[10px] text-ink-400">（初期値）</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right num font-semibold">{jpy(p.price)}</td>
                    <td className="px-4 py-2.5 text-right num text-[12px]">{Math.round(p.taxRate * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-ink-500 mt-2">
          ※ ここで設定した単価が、各利用者の食事設定（朝パン・朝ジュース・昼業者・夕業者）に応じて、毎日の明細として請求書に自動計上されます。
          単価未設定の場合は初期値が使われます。
        </p>
      </section>

      {CATEGORIES.map((cat) => (
        <section key={cat.group}>
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider mb-2">{cat.group}</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
                <tr className="text-left">
                  <th className="px-4 py-2 text-[11px] font-semibold">マスタ名</th>
                  <th className="px-4 py-2 text-[11px] font-semibold">説明</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-24 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((it) => (
                  <tr key={it.name} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-4 py-2.5 font-medium text-ink-900">{it.name}</td>
                    <td className="px-4 py-2.5 text-[12px] text-ink-600">{it.desc}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => setEditing(it.name)} className="btn btn-sm btn-arrow">編集</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="text-[11px] text-ink-500 pt-2 border-t border-ink-200">
        ※ 施設情報以外のマスタ編集 UI は簡略表示です。商用版では各マスタ別に専用編集画面を提供します。
        <Link href="/admin/audit-logs" className="text-brand-700 hover:underline ml-2">監査ログを見る →</Link>
      </div>

      {/* 食費単価編集 */}
      <Modal
        open={mealPriceOpen}
        onClose={() => setMealPriceOpen(false)}
        title={`食費単価マスタの編集${facilities.length > 1 ? `（${facilities.find((f) => f.id === mealPriceFacilityId)?.name ?? "全施設"}）` : ""}`}
        size="lg"
        footer={<ModalFooter onCancel={() => setMealPriceOpen(false)} onConfirm={saveMealPrices} confirmLabel="保存" />}
      >
        <div className="bg-info-50/40 border-l-[3px] border-info-600 rounded-r px-3 py-2 mb-3 text-[12px] text-ink-800">
          請求書の食費明細に印字される「種別名」と「単価」を設定します。<br />
          利用者の食事設定（朝パン／朝ジュース／昼A・B社／夕A・B社）に応じて、提供日ごとに自動で明細が生成されます。
        </div>
        <div className="space-y-2">
          {DEFAULT_MEAL_PRICES.map((d) => {
            const v = mealDraft[d.key];
            return (
              <div key={d.key} className="grid grid-cols-12 gap-2 items-center border-b border-ink-100 pb-2">
                <div className="col-span-2 text-[12px] text-ink-700">
                  {d.key === "breakfastBread" && "朝食 パン"}
                  {d.key === "breakfastJuice" && "朝食 ジュース"}
                  {d.key === "lunchA" && "昼食 A社"}
                  {d.key === "lunchB" && "昼食 B社"}
                  {d.key === "dinnerA" && "夕食 A社"}
                  {d.key === "dinnerB" && "夕食 B社"}
                </div>
                <div className="col-span-5">
                  <Input
                    value={v.label}
                    onChange={(e) => setMealDraft({ ...mealDraft, [d.key]: { ...v, label: e.target.value } })}
                    placeholder="例：朝セット / 昼セット A社"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={v.price}
                    onChange={(e) => setMealDraft({ ...mealDraft, [d.key]: { ...v, price: Number(e.target.value) || 0 } })}
                    className="num"
                    placeholder="単価"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={String(v.taxRate)}
                    onChange={(e) => setMealDraft({ ...mealDraft, [d.key]: { ...v, taxRate: Number(e.target.value) as TaxRate } })}
                  >
                    <option value="0">非課税</option>
                    <option value="0.08">軽減 8%</option>
                    <option value="0.1">標準 10%</option>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* 部屋追加 */}
      <Modal
        open={addRoomOpen}
        onClose={() => setAddRoomOpen(false)}
        title="部屋・スペースを追加"
        footer={<ModalFooter onCancel={() => setAddRoomOpen(false)} onConfirm={addRoom} confirmLabel="登録" />}
      >
        <RoomForm draft={roomDraft} setDraft={(d) => setRoomDraft({ ...roomDraft, ...d })} facilities={facilities} />
      </Modal>

      {/* 部屋編集 */}
      <Modal
        open={editingRoom !== null}
        onClose={() => { setEditingRoom(null); setRoomEditDraft(null); }}
        title={`部屋編集：${editingRoom?.roomNo ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => { setEditingRoom(null); setRoomEditDraft(null); }}
            onConfirm={saveRoom}
            extra={editingRoom && <button onClick={() => removeRoom(editingRoom.id)} className="btn btn-sm text-err-700">削除</button>}
          />
        }
      >
        {roomEditDraft && <RoomForm draft={roomEditDraft} setDraft={(d) => setRoomEditDraft({ ...roomEditDraft, ...d })} facilities={facilities} />}
      </Modal>

      {/* 施設追加 */}
      <Modal
        open={addFacilityOpen}
        onClose={() => setAddFacilityOpen(false)}
        title="施設を追加"
        footer={<ModalFooter onCancel={() => setAddFacilityOpen(false)} onConfirm={addFacility} confirmLabel="追加" />}
      >
        <FacilityForm draft={addDraft} setDraft={setAddDraft} />
      </Modal>

      {/* 施設編集 */}
      <Modal
        open={editingFacility !== null}
        onClose={() => { setEditingFacility(null); setEditDraft(null); }}
        title={`施設編集：${editingFacility?.name ?? ""}`}
        footer={
          <ModalFooter
            onCancel={() => { setEditingFacility(null); setEditDraft(null); }}
            onConfirm={saveFacility}
            extra={editingFacility && <button onClick={() => removeFacility(editingFacility.id)} className="btn btn-sm text-err-700">削除</button>}
          />
        }
      >
        {editDraft && <FacilityForm draft={editDraft} setDraft={(d) => setEditDraft({ ...editDraft, ...d })} />}
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`${editing ?? ""} の編集`}
        size="lg"
        footer={<ModalFooter onCancel={() => setEditing(null)} onConfirm={() => { logActivity(`マスタ「${editing}」を更新`); toast(`${editing} を保存しました`, "ok"); setEditing(null); }} />}
      >
        <div className="text-[12px] text-ink-600 mb-3">このマスタの登録項目を編集します。実装プロトタイプでは編集 UI を簡略表示しています。</div>
        <textarea
          rows={6}
          className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[12px]"
          defaultValue={`# ${editing}\n# 1行1レコード（モック）`}
        />
      </Modal>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="データバックアップ（JSON）"
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setExportOpen(false)}
            onConfirm={downloadExport}
            cancelLabel="閉じる"
            confirmLabel="ファイルでダウンロード"
            extra={<button onClick={copyExport} className="btn btn-sm">クリップボードへコピー</button>}
          />
        }
      >
        <p className="text-[12px] text-ink-600 mb-2">現在のデータを JSON で書き出します。別 PC・別ブラウザへの移行や定期バックアップに利用してください。</p>
        <textarea readOnly value={exportText} rows={12} className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[11px]" />
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="データインポート"
        size="lg"
        footer={<ModalFooter onCancel={() => setImportOpen(false)} onConfirm={doImport} confirmLabel="インポート" />}
      >
        <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 mb-3 text-[12px] text-warn-700">
          インポートすると、対応するエンティティの現データが上書きされます。
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={12}
          placeholder='バックアップした JSON を貼り付けてください'
          className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[11px]"
        />
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="全データを削除"
        footer={<ModalFooter onCancel={() => setResetOpen(false)} onConfirm={doReset} confirmLabel="削除を実行" />}
      >
        <div className="bg-err-50 border-l-4 border-err-600 rounded-r px-3 py-2 mb-3 text-[13px] text-err-700 font-semibold">
          ⚠ この操作は取り消せません。
        </div>
        <p className="text-[13px]">本端末のブラウザに保存されているすべての B-CareHub データ（施設・利用者・食事・請求・タスク・申し送り・マスタ等）を削除します。</p>
        <p className="text-[12px] text-ink-500 mt-2">削除前にバックアップを書き出すことを推奨します。</p>
      </Modal>
    </div>
  );
}

function RoomForm({
  draft, setDraft, facilities,
}: {
  draft: RoomDraft | Room;
  setDraft: (d: Partial<Room>) => void;
  facilities: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="部屋番号・名称（必須）" hint="例：101 / A棟2F / 事務所 / 倉庫A / 1F廊下">
          <Input value={draft.roomNo} onChange={(e) => setDraft({ roomNo: e.target.value })} />
        </Field>
        <Field label="用途">
          <Select value={draft.type} onChange={(e) => setDraft({ type: e.target.value as RoomType })}>
            {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="所属施設">
          <Select value={draft.facilityId ?? ""} onChange={(e) => setDraft({ facilityId: e.target.value || undefined })}>
            {facilities.length === 0 && <option value="">— 未登録 —</option>}
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
        <Field label="定員（居室の場合）">
          <Input type="number" value={draft.capacity ?? ""} onChange={(e) => setDraft({ capacity: Number(e.target.value) || undefined })} className="num" placeholder="例：1" />
        </Field>
      </div>
      <Field label="備考">
        <Input value={draft.note ?? ""} onChange={(e) => setDraft({ note: e.target.value })} placeholder="例：エアコン2台／窓向き 等" />
      </Field>
    </div>
  );
}

function FacilityForm({ draft, setDraft }: { draft: Omit<Facility, "id">; setDraft: (d: Omit<Facility, "id">) => void }) {
  const accounts = draft.bankAccounts ?? [];
  function updateAcc(i: number, patch: Partial<BankAccount>) {
    const next = accounts.slice();
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, bankAccounts: next });
  }
  function addAcc() {
    setDraft({ ...draft, bankAccounts: [...accounts, emptyBankAccount()] });
  }
  function removeAcc(i: number) {
    setDraft({ ...draft, bankAccounts: accounts.filter((_, j) => j !== i) });
  }
  return (
    <div className="space-y-4">
      <Field label="施設名（必須）">
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="例：あすか苑 本館" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="定員（室数）">
          <Input type="number" value={draft.capacity ?? ""} onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) || undefined })} className="num" placeholder="例：16" />
        </Field>
        <Field label="電話">
          <Input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="例：03-1234-5678" />
        </Field>
        <Field label="お支払期日（毎月◯日）" hint="請求書に「2026年5月◯日(◯)」と印字されます">
          <Input type="number" min={1} max={31} value={draft.paymentDueDay ?? 15} onChange={(e) => setDraft({ ...draft, paymentDueDay: Number(e.target.value) || 15 })} className="num" />
        </Field>
      </div>
      <Field label="住所">
        <Input value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="例：◯◯県◯◯市..." />
      </Field>

      {/* 振込先 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-ink-600">振込先（請求書に印字、複数可）</span>
          <button type="button" onClick={addAcc} className="btn btn-sm">＋ 口座を追加</button>
        </div>
        {accounts.length === 0 && (
          <div className="text-[12px] text-ink-500 px-3 py-3 border border-dashed border-ink-200 rounded">未登録</div>
        )}
        {accounts.map((acc, i) => (
          <div key={i} className="border border-ink-200 rounded p-3 mb-2 grid grid-cols-2 gap-2">
            <Field label="金融機関名"><Input value={acc.bank} onChange={(e) => updateAcc(i, { bank: e.target.value })} placeholder="例：ゆうちょ銀行" /></Field>
            <Field label="支店／店名"><Input value={acc.branch ?? ""} onChange={(e) => updateAcc(i, { branch: e.target.value })} placeholder="例：四一八店" /></Field>
            <Field label="種別">
              <Input value={acc.type ?? ""} onChange={(e) => updateAcc(i, { type: e.target.value })} placeholder="普通 / 当座 / 記号" />
            </Field>
            <Field label="番号"><Input value={acc.number} onChange={(e) => updateAcc(i, { number: e.target.value })} className="num" placeholder="例：7480530" /></Field>
            <div className="col-span-2">
              <Field label="名義（カタカナ）"><Input value={acc.holder} onChange={(e) => updateAcc(i, { holder: e.target.value })} placeholder="例：カ）アスカエン" /></Field>
            </div>
            <div className="col-span-2 text-right">
              <button type="button" onClick={() => removeAcc(i)} className="btn btn-sm text-err-700">この口座を削除</button>
            </div>
          </div>
        ))}
      </div>

      <Field label="請求書 備考（任意）" hint="請求書下部に印字（注意事項等）">
        <textarea
          rows={3}
          value={draft.invoiceNote ?? ""}
          onChange={(e) => setDraft({ ...draft, invoiceNote: e.target.value })}
          className="w-full px-3 py-2 border border-ink-200 rounded text-[13px]"
          placeholder="例：振込日が休日に重なる場合は休前日にお振込みください。"
        />
      </Field>
    </div>
  );
}
