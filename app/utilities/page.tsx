"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { jpy, type UtilityBill, type UtilityType, type TaxRate } from "@/lib/data";
import {
  useUtilityBills, useUsers, useRooms, useFacilities, useCurrentFacilityId,
  logActivity, genId, todayIso, filterByFacility,
} from "@/lib/store";
import { type Room } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";
import { FacilityLabel } from "@/components/facility-name";
import { Pill, FilterChip, Field, Input, Select, Th, ModalFooter } from "@/components/ui/primitives";

type Filter = "all" | "unpaid" | "paid";

type Draft = Omit<UtilityBill, "id">;

function emptyDraft(facilityId: string | undefined, ym: string): Draft {
  // 検針期間のデフォルト：前月15日〜当月14日（一般的な電気・ガスの検針サイクル）
  const [y, m] = ym.split("-").map(Number);
  const prevDate = new Date(y, m - 2, 15);
  const curDate = new Date(y, m - 1, 14);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startDef = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(prevDate.getDate())}`;
  const endDef = `${curDate.getFullYear()}-${pad(curDate.getMonth() + 1)}-${pad(curDate.getDate())}`;
  return {
    facilityId,
    roomNo: "",
    ym,
    periodStart: startDef,
    periodEnd: endDef,
    type: "電気",
    provider: "",
    amount: 0,
    status: "未払い",
    taxRate: 0.1,
    billToUser: true,
    note: "",
  };
}

const UTILITY_TYPES: UtilityType[] = ["電気", "ガス", "水道", "灯油", "その他"];

export default function UtilitiesPage() {
  const today = todayIso();
  const [bills, setBills] = useUtilityBills();
  const [users] = useUsers();
  const [rooms] = useRooms();
  const [facilities] = useFacilities();
  const [currentFacilityId] = useCurrentFacilityId();

  const [ym, setYm] = useState(today.slice(0, 7));
  const [typeFilter, setTypeFilter] = useState<UtilityType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [roomFilter, setRoomFilter] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<UtilityBill | null>(null);
  const defaultFacilityId = currentFacilityId ?? facilities[0]?.id;
  const [draft, setDraft] = useState<Draft>(emptyDraft(defaultFacilityId, ym));

  // 現在の月・施設・フィルタに合わせた一覧
  const scoped = useMemo(() => filterByFacility(bills, currentFacilityId), [bills, currentFacilityId]);
  const list = useMemo(() => scoped.filter((b) => {
    if (b.ym !== ym) return false;
    if (typeFilter !== "all" && b.type !== typeFilter) return false;
    if (statusFilter === "paid" && b.status !== "支払済") return false;
    if (statusFilter === "unpaid" && b.status !== "未払い") return false;
    if (roomFilter && !b.roomNo.includes(roomFilter)) return false;
    return true;
  }), [scoped, ym, typeFilter, statusFilter, roomFilter]);

  // 月別サマリ
  const monthBills = scoped.filter((b) => b.ym === ym);
  const unpaidTotal = monthBills.filter((b) => b.status === "未払い").reduce((s, b) => s + b.amount, 0);
  const paidTotal = monthBills.filter((b) => b.status === "支払済").reduce((s, b) => s + b.amount, 0);
  const userBilledTotal = monthBills.filter((b) => b.billToUser).reduce((s, b) => s + b.amount, 0);

  // 部屋一覧（施設フィルタ済）
  const scopedUsers = filterByFacility(users, currentFacilityId);
  const scopedRooms = filterByFacility(rooms, currentFacilityId);
  // Room マスタの部屋 ＋ 利用者の room フィールド の和集合
  const roomOptions: { roomNo: string; type?: Room["type"] }[] = useMemo(() => {
    const masterRoomNos = scopedRooms.map((r) => r.roomNo);
    const userRoomNos = scopedUsers.map((u) => u.room).filter(Boolean);
    const all = Array.from(new Set([...masterRoomNos, ...userRoomNos])).sort();
    return all.map((rn) => ({
      roomNo: rn,
      type: scopedRooms.find((r) => r.roomNo === rn)?.type,
    }));
  }, [scopedRooms, scopedUsers]);

  function userOfRoom(roomNo: string) {
    return scopedUsers.find((u) => u.room === roomNo && u.status !== "退去済");
  }

  function exportCsv() {
    downloadCsv(`光熱費_${ym}.csv`, [
      ["請求対象月", "部屋", "用途", "種別", "業者", "検針開始", "検針終了", "金額", "支払状態", "支払日", "入居者請求", "入居者", "備考"],
      ...list.map((b) => {
        const u = userOfRoom(b.roomNo);
        const room = scopedRooms.find((r) => r.roomNo === b.roomNo);
        return [b.ym, b.roomNo, room?.type ?? "—", b.type, b.provider ?? "—",
                b.periodStart ?? "—", b.periodEnd ?? "—",
                b.amount, b.status, b.paidDate ?? "—",
                b.billToUser ? "ON" : "OFF", u?.name ?? "—", b.note ?? ""];
      }),
    ]);
  }

  function saveNew() {
    if (!draft.roomNo) { toast("部屋を選択してください", "warn"); return; }
    if (draft.amount <= 0) { toast("金額は 1 円以上を入力してください", "warn"); return; }
    const id = genId("UB");
    const bill: UtilityBill = { id, ...draft };
    setBills((cur) => [...cur, bill]);
    logActivity(`光熱費「${draft.type} 部屋${draft.roomNo} ${draft.ym}」を登録 ${jpy(draft.amount)}`);
    toast("光熱費を登録しました", "ok");
    setNewOpen(false);
    setDraft(emptyDraft(defaultFacilityId, ym));
  }

  function saveEdit() {
    if (!editing) return;
    setBills((cur) => cur.map((b) => b.id === editing.id ? editing : b));
    logActivity(`光熱費「${editing.type} 部屋${editing.roomNo} ${editing.ym}」を更新`);
    toast("更新しました", "ok");
    setEditing(null);
  }

  function deleteBill(id: string) {
    if (!window.confirm("この光熱費を削除します。よろしいですか？")) return;
    setBills((cur) => cur.filter((b) => b.id !== id));
    logActivity("光熱費を削除");
    toast("削除しました", "ok");
    setEditing(null);
  }

  function markPaid(id: string) {
    setBills((cur) => cur.map((b) => b.id === id ? { ...b, status: "支払済", paidDate: todayIso(), paidAmount: b.amount } : b));
    logActivity("光熱費を支払済にマーク");
    toast("支払済にしました", "ok");
  }

  function toggleBillToUser(id: string) {
    setBills((cur) => cur.map((b) => b.id === id ? { ...b, billToUser: !b.billToUser } : b));
    toast("入居者請求の設定を切替えました", "ok");
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">光熱費管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">部屋ごとの電気・ガス・水道などの料金を月別に管理。入居者の請求にも自動反映できます。</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={exportCsv} className="btn" disabled={list.length === 0}>CSV出力</button>
          <button onClick={() => { setDraft(emptyDraft(defaultFacilityId, ym)); setNewOpen(true); }} className="btn btn-primary">＋ 光熱費を追加</button>
        </div>
      </header>

      {/* サマリ */}
      <section className="card divide-x divide-ink-100 flex">
        <div className="flex-1 px-5 py-3">
          <div className="text-[11px] text-ink-500">月切替</div>
          <input type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="mt-1 px-2 py-1 border border-ink-200 rounded num text-[15px] font-bold" />
        </div>
        <div className="flex-1 px-5 py-3">
          <div className="text-[11px] text-ink-500">未払い合計（業者へ）</div>
          <div className={`num font-bold text-[22px] mt-1 ${unpaidTotal > 0 ? "text-err-700" : "text-ink-400"}`}>{jpy(unpaidTotal)}</div>
        </div>
        <div className="flex-1 px-5 py-3">
          <div className="text-[11px] text-ink-500">支払済合計</div>
          <div className="num font-bold text-[22px] mt-1 text-ink-900">{jpy(paidTotal)}</div>
        </div>
        <div className="flex-1 px-5 py-3">
          <div className="text-[11px] text-ink-500">入居者請求 合計</div>
          <div className="num font-bold text-[22px] mt-1 text-brand-700">{jpy(userBilledTotal)}</div>
        </div>
        <div className="flex-1 px-5 py-3">
          <div className="text-[11px] text-ink-500">登録件数</div>
          <div className="num font-bold text-[22px] mt-1 text-ink-900">{list.length}<span className="text-[12px] ml-1 font-medium text-ink-600">件</span></div>
        </div>
      </section>

      {/* フィルタ */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>すべて</FilterChip>
        <FilterChip active={statusFilter === "unpaid"} onClick={() => setStatusFilter("unpaid")}>未払い ({monthBills.filter((b) => b.status === "未払い").length})</FilterChip>
        <FilterChip active={statusFilter === "paid"} onClick={() => setStatusFilter("paid")}>支払済 ({monthBills.filter((b) => b.status === "支払済").length})</FilterChip>
        <span className="text-ink-300">|</span>
        <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>全種別</FilterChip>
        {UTILITY_TYPES.map((t) => (
          <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{t}</FilterChip>
        ))}
        <input type="search" placeholder="部屋番号で検索" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="ml-auto px-3 py-1.5 border border-ink-200 rounded text-[12px] w-40 num" />
      </div>

      {/* 一覧 */}
      <div className="card overflow-x-auto">
        {list.length === 0 ? (
          <div className="px-3 py-12 text-center">
            {monthBills.length === 0 ? (
              <>
                <div className="text-[14px] font-semibold text-ink-800 mb-1">⚡ 光熱費管理の使い方</div>
                <p className="text-[12px] text-ink-600 mb-4 leading-relaxed max-w-md mx-auto">
                  部屋ごとの電気・ガス・水道などの請求書が届いたら、ここに金額を登録します。<br />
                  「入居者請求 ON」にすると、自動でその部屋の入居者の月次請求に「水道光熱費」として加算されます。
                </p>
                <button onClick={() => { setDraft(emptyDraft(defaultFacilityId, ym)); setNewOpen(true); }} className="btn btn-primary">＋ 最初の光熱費を登録</button>
              </>
            ) : (
              <div className="text-[13px] text-ink-500">該当する光熱費はありません</div>
            )}
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr>
                <Th className="w-24">部屋</Th>
                <Th>入居者 / 用途</Th>
                <Th className="w-20">種別</Th>
                <Th className="w-28">業者</Th>
                <Th className="w-36">検針期間</Th>
                <Th className="w-28" align="right">金額</Th>
                <Th className="w-24" align="center">支払状態</Th>
                <Th className="w-24">支払日</Th>
                <Th className="w-24" align="center">入居者請求</Th>
                <Th className="w-36" align="center">操作</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const u = userOfRoom(b.roomNo);
                const room = scopedRooms.find((r) => r.roomNo === b.roomNo);
                return (
                  <tr key={b.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 num font-semibold">
                        {b.roomNo}
                        {currentFacilityId === null && <FacilityLabel facilityId={b.facilityId} />}
                      </div>
                      {room && <div className="text-[10px] text-ink-500 mt-0.5">{room.type}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-[12px]">
                      {u ? (
                        <Link href={`/users/${u.id}`} className="text-brand-700 hover:underline">{u.name} 様</Link>
                      ) : room ? (
                        <span className="text-ink-700">{room.type === "居室" ? "— 空室 —" : `（${room.type}）`}</span>
                      ) : (
                        <span className="text-ink-400">— 未登録部屋 —</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><UtilityChip t={b.type} /></td>
                    <td className="px-3 py-2.5 text-[12px] text-ink-700">{b.provider || "—"}</td>
                    <td className="px-3 py-2.5 num text-[11px] text-ink-700">
                      {b.periodStart && b.periodEnd
                        ? <>{b.periodStart.slice(5).replace("-", "/")}<br />〜 {b.periodEnd.slice(5).replace("-", "/")}</>
                        : <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right num font-semibold">{jpy(b.amount)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Pill tone={b.status === "支払済" ? "ok" : "warn"}>{b.status}</Pill>
                    </td>
                    <td className="px-3 py-2.5 num text-[11px] text-ink-500">{b.paidDate ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => toggleBillToUser(b.id)} className={"text-[11px] px-2 py-0.5 rounded border " + (b.billToUser ? "bg-ok-50 text-ok-700 border-ok-600/30" : "bg-ink-100 text-ink-500 border-ink-200")}>
                        {b.billToUser ? "✓ ON" : "OFF"}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-center flex gap-1 justify-center">
                      {b.status === "未払い" && <button onClick={() => markPaid(b.id)} className="btn btn-sm btn-primary">支払済</button>}
                      <button onClick={() => setEditing({ ...b })} className="btn btn-sm">編集</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-ink-50 border-t-2 border-ink-200">
              <tr>
                <td colSpan={5} className="px-3 py-2.5 text-[13px] font-semibold">月合計（フィルタ後 {list.length} 件）</td>
                <td className="px-3 py-2.5 text-right num text-[14px] font-bold text-brand-700">{jpy(list.reduce((s, b) => s + b.amount, 0))}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <p className="text-[11px] text-ink-500">
        ※ 「入居者請求」を ON にすると、その部屋の入居者の月次請求に「水道光熱費」として自動計上されます（利用者詳細の請求タブ・月次請求一覧・請求書プレビューに反映）。
      </p>

      {/* 新規追加モーダル */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="光熱費を追加"
        size="lg"
        footer={<ModalFooter onCancel={() => setNewOpen(false)} onConfirm={saveNew} confirmLabel="登録" />}
      >
        <UtilityForm draft={draft} setDraft={(d) => setDraft({ ...draft, ...d })} roomOptions={roomOptions} userOfRoom={userOfRoom} />
      </Modal>

      {/* 編集モーダル */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="光熱費を編集"
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setEditing(null)}
            onConfirm={saveEdit}
            extra={editing && <button onClick={() => deleteBill(editing.id)} className="btn btn-sm text-err-700">削除</button>}
          />
        }
      >
        {editing && <UtilityForm draft={editing} setDraft={(d) => setEditing({ ...editing, ...d })} roomOptions={roomOptions} userOfRoom={userOfRoom} />}
      </Modal>
    </div>
  );
}

function UtilityForm({
  draft, setDraft, roomOptions, userOfRoom,
}: {
  draft: Draft | UtilityBill;
  setDraft: (d: Partial<UtilityBill>) => void;
  roomOptions: { roomNo: string; type?: string }[];
  userOfRoom: (roomNo: string) => { name: string; id: string } | undefined;
}) {
  const u = draft.roomNo ? userOfRoom(draft.roomNo) : undefined;
  const roomMeta = roomOptions.find((r) => r.roomNo === draft.roomNo);

  // 検針終了日から請求対象月を自動推奨（変更ボタンで適用）
  function suggestYmFromPeriod() {
    if (!draft.periodEnd) return;
    setDraft({ ym: draft.periodEnd.slice(0, 7) });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Field label="部屋" hint="居室・事務所・倉庫など">
          <Select value={draft.roomNo} onChange={(e) => setDraft({ roomNo: e.target.value })}>
            <option value="">— 選択 —</option>
            {roomOptions.map((r) => (
              <option key={r.roomNo} value={r.roomNo}>
                {r.roomNo}{r.type ? `（${r.type}）` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="種別">
          <Select value={draft.type} onChange={(e) => setDraft({ type: e.target.value as UtilityType })}>
            {UTILITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="業者名"><Input value={draft.provider ?? ""} onChange={(e) => setDraft({ provider: e.target.value })} placeholder="例：東京電力" /></Field>
      </div>

      {u ? (
        <div className="bg-info-50/40 border-l-[3px] border-info-600 rounded-r px-3 py-1.5 text-[12px] text-ink-800">
          部屋 <b className="num">{draft.roomNo}</b>（{roomMeta?.type ?? "居室"}）の現在の入居者：<b>{u.name} 様</b>　／　「入居者請求 ON」で自動的にこの方の月次請求に加算されます。
        </div>
      ) : roomMeta && roomMeta.type !== "居室" ? (
        <div className="bg-ink-50 border-l-[3px] border-ink-300 rounded-r px-3 py-1.5 text-[12px] text-ink-700">
          {roomMeta.type}（{draft.roomNo}）の光熱費です。入居者への請求転嫁は通常 OFF です。
        </div>
      ) : null}

      <div className="border border-ink-200 rounded p-3 bg-ink-50/40">
        <div className="text-[11px] font-semibold text-ink-600 mb-2">📅 検針期間と請求対象月</div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="検針開始日">
            <Input type="date" value={draft.periodStart ?? ""} onChange={(e) => setDraft({ periodStart: e.target.value })} className="num" />
          </Field>
          <Field label="検針終了日">
            <Input type="date" value={draft.periodEnd ?? ""} onChange={(e) => setDraft({ periodEnd: e.target.value })} className="num" />
          </Field>
          <Field label="請求対象月" hint="この光熱費をどの月の請求に計上するか">
            <div className="flex gap-1">
              <Input type="month" value={draft.ym} onChange={(e) => setDraft({ ym: e.target.value })} className="num flex-1" />
              <button type="button" onClick={suggestYmFromPeriod} className="btn btn-sm shrink-0" title="検針終了日の月にセット">推奨</button>
            </div>
          </Field>
        </div>
        <p className="text-[10px] text-ink-500 mt-1">
          例：検針期間 <span className="num">4/15〜5/14</span>、請求対象月 <span className="num">2026-05</span> → 5月分の請求書に「電気代 4/15〜5/14」として明細表示されます
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="検針値（任意）"><Input type="number" value={draft.meterReading ?? ""} onChange={(e) => setDraft({ meterReading: Number(e.target.value) || undefined })} className="num" placeholder="kWh / ㎥" /></Field>
        <Field label="金額（税込）"><Input type="number" value={draft.amount} onChange={(e) => setDraft({ amount: Number(e.target.value) || 0 })} className="num" /></Field>
        <Field label="税率">
          <Select value={String(draft.taxRate ?? 0.1)} onChange={(e) => setDraft({ taxRate: Number(e.target.value) as TaxRate })}>
            <option value="0">非課税</option>
            <option value="0.08">軽減 8%</option>
            <option value="0.1">標準 10%</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="支払状態">
          <Select value={draft.status} onChange={(e) => setDraft({ status: e.target.value as UtilityBill["status"] })}>
            <option>未払い</option><option>支払済</option>
          </Select>
        </Field>
        <Field label="支払日"><Input type="date" value={draft.paidDate ?? ""} onChange={(e) => setDraft({ paidDate: e.target.value })} className="num" /></Field>
      </div>

      <Field label="入居者へ請求転嫁">
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={draft.billToUser} onChange={(e) => setDraft({ billToUser: e.target.checked })} />
          ON：この金額を {u ? `${u.name} 様` : "入居者"} の月次請求に「水道光熱費」として加算する
        </label>
      </Field>

      <Field label="備考">
        <Input value={draft.note ?? ""} onChange={(e) => setDraft({ note: e.target.value })} placeholder="例：エアコン使用増加分含む" />
      </Field>
    </div>
  );
}

function UtilityChip({ t }: { t: UtilityType }) {
  const map: Record<UtilityType, string> = {
    電気: "bg-warn-50 text-warn-700 border-warn-600/30",
    ガス: "bg-err-50 text-err-700 border-err-600/30",
    水道: "bg-info-50 text-info-700 border-info-600/30",
    灯油: "bg-ink-100 text-ink-700 border-ink-200",
    その他: "bg-ink-100 text-ink-700 border-ink-200",
  };
  return <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + map[t]}>{t}</span>;
}
