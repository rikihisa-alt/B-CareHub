"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildMonthMealCounts, buildDayDetail, vendors, timeToDeadline } from "@/lib/data";
import { useUsers, useMealConfirmations, useSingleCancellations, useCurrentFacilityId, logActivity, genId, filterByFacility } from "@/lib/store";
import { Modal, Drawer } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";
import { Field, Input, Select, MealStateChip, Pill, ModalFooter } from "@/components/ui/primitives";

type MealType = "breakfast" | "lunch" | "dinner";
const MEAL_LABEL: Record<MealType, string> = { breakfast: "朝食", lunch: "昼食", dinner: "夕食" };
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function MealDayDetail({ ymd }: { ymd: string }) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[date.getDay()];

  const [allUsers] = useUsers();
  const [confirmations, setConfirmations] = useMealConfirmations();
  const [singleCancellations, setSingleCancellations] = useSingleCancellations();
  const [currentFacilityId] = useCurrentFacilityId();
  const users = useMemo(() => filterByFacility(allUsers, currentFacilityId), [allUsers, currentFacilityId]);

  const confirmKey = currentFacilityId === null ? null : `${currentFacilityId}_${ymd}`;
  const scopedConfirmations = useMemo(() => {
    if (currentFacilityId === null) return {} as typeof confirmations;
    const result: typeof confirmations = {};
    Object.entries(confirmations).forEach(([key, val]) => {
      if (key.startsWith(`${currentFacilityId}_`)) result[key.split("_")[1]] = val;
    });
    return result;
  }, [confirmations, currentFacilityId]);

  const counts = useMemo(
    () => buildMonthMealCounts(y, m, users, singleCancellations, scopedConfirmations),
    [y, m, users, singleCancellations, scopedConfirmations],
  );
  const today = counts.find((c) => c.date === ymd)!;
  const confirmed = today.confirmed;

  const [confirmModal, setConfirmModal] = useState<MealType | null>(null);
  const [adjustOpen, setAdjustOpen] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState<{ ctx: string; mealType: MealType } | null>(null);
  const [addForm, setAddForm] = useState({ userId: "", reason: "" });

  const breakfast = buildDayDetail(ymd, "breakfast", users, singleCancellations);
  const lunchA = buildDayDetail(ymd, "lunch", users, singleCancellations, "A社");
  const lunchB = buildDayDetail(ymd, "lunch", users, singleCancellations, "B社");
  const dinnerA = buildDayDetail(ymd, "dinner", users, singleCancellations, "A社");
  const dinnerB = buildDayDetail(ymd, "dinner", users, singleCancellations, "B社");

  function doConfirm(type: MealType) {
    if (!confirmKey) {
      toast("施設を選択してから確定してください", "warn");
      return;
    }
    setConfirmations((cur) => ({ ...cur, [confirmKey]: { ...cur[confirmKey], [type]: true } }));
    logActivity(`${ymd} の${MEAL_LABEL[type]}発注を確定`);
    toast(`${ymd} の${MEAL_LABEL[type]}発注を確定しました`, "ok");
    setConfirmModal(null);
  }

  function saveAdd() {
    if (!addOpen) return;
    if (!addForm.userId) {
      toast("利用者を選択してください", "warn");
      return;
    }
    if (!addForm.reason.trim()) {
      toast("理由を入力してください", "warn");
      return;
    }
    // 単発キャンセルとして「除外を取り消す」逆操作はスコープ外。今はログのみ。
    logActivity(`${ymd} ${addOpen.ctx} に当日追加（理由：${addForm.reason}）`);
    toast(`${addOpen.ctx} に当日追加しました`, "ok");
    setAddForm({ userId: "", reason: "" });
    setAddOpen(null);
  }

  function saveAdjust() {
    if (!adjustOpen) return;
    logActivity(`${ymd} ${adjustOpen} の手動調整を保存`);
    toast(`${adjustOpen} の手動調整を保存しました`, "ok");
    setAdjustOpen(null);
  }

  function exportVendorCsv(vendor: string, mealType: string, list: ReturnType<typeof buildDayDetail>) {
    const targets = list.filter((x) => x.status === "対象");
    downloadCsv(`発注表_${vendor}_${ymd}.csv`, [
      [`業者：${vendor}`, `区分：${mealType}`, `日付：${ymd}`],
      [],
      ["部屋", "氏名", "形態", "アレルギー", "状態", "理由"],
      ...list.map((x) => [
        x.user.room, x.user.name, x.user.meal.form,
        x.user.allergies.map((a) => a.name).join("・") || "—",
        x.status, x.reason ?? "—",
      ]),
      [],
      ["最終発注数", targets.length],
    ]);
  }

  function singleCancel(userId: string, mealType: MealType, reason: string) {
    setSingleCancellations((cur) => [
      ...cur,
      { id: genId("SC"), userId, date: ymd, mealType, reason, billable: false },
    ]);
    const user = users.find((u) => u.id === userId);
    logActivity(`${ymd} ${MEAL_LABEL[mealType]}を ${user?.name ?? "—"} 様 単発キャンセル（${reason}）`);
    toast("単発キャンセルを登録しました", "ok");
  }

  function uncancel(cancellationId: string) {
    setSingleCancellations((cur) => cur.filter((c) => c.id !== cancellationId));
    toast("キャンセルを取消しました", "ok");
  }

  const summary: { label: string; v: number }[] = [
    { label: "朝🍞", v: today.bread },
    { label: "朝🥤", v: today.juice },
    { label: "昼 A社", v: today.lunchA },
    { label: "昼 B社", v: today.lunchB },
    { label: "夕 A社", v: today.dinnerA },
    { label: "夕 B社", v: today.dinnerB },
  ];

  return (
    <div className="space-y-5">
      <nav className="text-[12px] text-ink-500">
        <Link href="/meals" className="hover:underline">食事発注カレンダー</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-400 num">{ymd}</span>
      </nav>

      <div className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-ink-900 leading-tight">
              <span className="num">{ymd.replace(/-/g, "/")}</span>
              <span className="ml-2 text-[14px] text-ink-500 font-normal">（{weekday}）</span>
              {today.isHoliday && <span className="ml-2 text-[12px] text-err-700">祝日</span>}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusChip label="朝食" confirmed={confirmed.breakfast} deadline="—" />
              <StatusChip label="昼食" confirmed={confirmed.lunch} deadline={vendors[0].deadlineTime} showCountdown />
              <StatusChip label="夕食" confirmed={confirmed.dinner} deadline="15:00" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setConfirmModal("lunch")} className="btn btn-primary" disabled={users.length === 0}>発注確定</button>
            <button onClick={() => toast("食札 PDF：A4 1枚に 8名分。利用者ごと・食事区分ごとに 1ラベル発行（プロトタイプでは未生成）", "info")} className="btn">食札 PDF</button>
            <button onClick={doPrint} className="btn">業者別発注表 印刷</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-ink-100">
          {summary.map((s) => (
            <div key={s.label}>
              <div className="text-[11px] text-ink-500">{s.label}</div>
              <div className="num text-[22px] font-bold text-ink-900 mt-0.5">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {users.length === 0 && (
        <div className="card p-5 text-center bg-info-50/30">
          <div className="text-[13px] text-ink-600 mb-3">利用者が登録されていないため、対象者がいません。</div>
          <Link href="/users" className="btn btn-primary">利用者を登録する</Link>
        </div>
      )}

      <VendorBlock
        title="朝食（パン・ジュース業者）"
        deadline={vendors[2].deadlineTime}
        confirmed={confirmed.breakfast}
        onConfirm={() => setConfirmModal("breakfast")}
        onAdd={() => setAddOpen({ ctx: "朝食", mealType: "breakfast" })}
        onAdjust={() => setAdjustOpen("朝食")}
        onExport={() => exportVendorCsv("パン業者", "朝食", breakfast)}
        breakdowns={[
          { name: "パン", count: today.bread, list: breakfast.filter((x) => x.user.meal.breakfastBread) },
          { name: "ジュース", count: today.juice, list: breakfast.filter((x) => x.user.meal.breakfastJuice) },
        ]}
        onSingleCancel={(uid, reason) => singleCancel(uid, "breakfast", reason)}
        cancellations={singleCancellations.filter((c) => c.date === ymd && c.mealType === "breakfast")}
        onUncancel={uncancel}
        ymd={ymd}
      />

      <VendorBlock
        title="昼食 A社"
        deadline={vendors[0].deadlineTime}
        confirmed={confirmed.lunch}
        showCountdown
        onConfirm={() => setConfirmModal("lunch")}
        onAdd={() => setAddOpen({ ctx: "昼食 A社", mealType: "lunch" })}
        onAdjust={() => setAdjustOpen("昼食 A社")}
        onExport={() => exportVendorCsv("A社", "昼食", lunchA)}
        breakdowns={[{ name: "弁当", count: today.lunchA, list: lunchA }]}
        onSingleCancel={(uid, reason) => singleCancel(uid, "lunch", reason)}
        cancellations={singleCancellations.filter((c) => c.date === ymd && c.mealType === "lunch")}
        onUncancel={uncancel}
        ymd={ymd}
      />

      <VendorBlock
        title="昼食 B社"
        deadline={vendors[1].deadlineTime}
        confirmed={confirmed.lunch}
        onConfirm={() => setConfirmModal("lunch")}
        onAdd={() => setAddOpen({ ctx: "昼食 B社", mealType: "lunch" })}
        onAdjust={() => setAdjustOpen("昼食 B社")}
        onExport={() => exportVendorCsv("B社", "昼食", lunchB)}
        breakdowns={[{ name: "弁当", count: today.lunchB, list: lunchB }]}
        onSingleCancel={(uid, reason) => singleCancel(uid, "lunch", reason)}
        cancellations={singleCancellations.filter((c) => c.date === ymd && c.mealType === "lunch")}
        onUncancel={uncancel}
        ymd={ymd}
      />

      <VendorBlock
        title="夕食 A社"
        deadline="15:00"
        confirmed={confirmed.dinner}
        onConfirm={() => setConfirmModal("dinner")}
        onAdd={() => setAddOpen({ ctx: "夕食 A社", mealType: "dinner" })}
        onAdjust={() => setAdjustOpen("夕食 A社")}
        onExport={() => exportVendorCsv("A社", "夕食", dinnerA)}
        breakdowns={[{ name: "弁当", count: today.dinnerA, list: dinnerA }]}
        onSingleCancel={(uid, reason) => singleCancel(uid, "dinner", reason)}
        cancellations={singleCancellations.filter((c) => c.date === ymd && c.mealType === "dinner")}
        onUncancel={uncancel}
        ymd={ymd}
      />

      <VendorBlock
        title="夕食 B社"
        deadline="15:00"
        confirmed={confirmed.dinner}
        onConfirm={() => setConfirmModal("dinner")}
        onAdd={() => setAddOpen({ ctx: "夕食 B社", mealType: "dinner" })}
        onAdjust={() => setAdjustOpen("夕食 B社")}
        onExport={() => exportVendorCsv("B社", "夕食", dinnerB)}
        breakdowns={[{ name: "弁当", count: today.dinnerB, list: dinnerB }]}
        onSingleCancel={(uid, reason) => singleCancel(uid, "dinner", reason)}
        cancellations={singleCancellations.filter((c) => c.date === ymd && c.mealType === "dinner")}
        onUncancel={uncancel}
        ymd={ymd}
      />

      <Modal
        open={confirmModal !== null}
        onClose={() => setConfirmModal(null)}
        title={`${confirmModal ? MEAL_LABEL[confirmModal] : ""} 発注確定`}
        footer={<ModalFooter onCancel={() => setConfirmModal(null)} onConfirm={() => confirmModal && doConfirm(confirmModal)} confirmLabel="確定する" />}
      >
        <p className="mb-3">{ymd} の{confirmModal ? MEAL_LABEL[confirmModal] : ""}発注を確定します。</p>
        <ul className="bg-ink-50 rounded p-3 text-[12px] space-y-1">
          <li>確定後はステータス変更があっても自動再計算されません。</li>
          <li>解除は管理者のみ可能で、理由の入力が必要です。</li>
        </ul>
      </Modal>

      <Drawer
        open={addOpen !== null}
        onClose={() => setAddOpen(null)}
        title={`${addOpen?.ctx ?? ""} に当日追加`}
        footer={<ModalFooter onCancel={() => setAddOpen(null)} onConfirm={saveAdd} confirmLabel="追加" />}
      >
        <Field label="対象利用者">
          <Select value={addForm.userId} onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}>
            <option value="">— 選択 —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}（{u.room}）</option>)}
          </Select>
        </Field>
        <div className="mt-3">
          <Field label="理由（必須）"><Input value={addForm.reason} onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })} placeholder="例：来客・代食手配" /></Field>
        </div>
      </Drawer>

      <Drawer
        open={adjustOpen !== null}
        onClose={() => setAdjustOpen(null)}
        title={`${adjustOpen ?? ""} の手動調整`}
        footer={<ModalFooter onCancel={() => setAdjustOpen(null)} onConfirm={saveAdjust} />}
      >
        <Field label="調整数（±）"><Input type="number" defaultValue={0} className="num" /></Field>
        <div className="mt-3">
          <Field label="理由（必須）"><Input placeholder="例：誤発注修正、業者発注ミス補正" /></Field>
        </div>
      </Drawer>
    </div>
  );
}

function StatusChip({ label, confirmed, deadline, showCountdown }: { label: string; confirmed: boolean; deadline: string; showCountdown?: boolean }) {
  const t = !confirmed && showCountdown ? timeToDeadline(deadline === "—" ? "23:59" : deadline) : null;
  return (
    <span
      className={
        "px-2 py-1 rounded border text-[11px] font-semibold " +
        (confirmed
          ? "bg-ok-50 text-ok-700 border-ok-600/30"
          : t && t.total < 120
          ? "bg-err-50 text-err-700 border-err-600/30"
          : "bg-warn-50 text-warn-700 border-warn-600/30")
      }
    >
      {label}：{confirmed ? "✓ 確定済" : `⚠ 未確定（締切 ${deadline}${t && t.total > 0 ? `, あと ${t.hours}h ${t.minutes}m` : ""}）`}
    </span>
  );
}

function VendorBlock({
  title, deadline, confirmed, showCountdown, breakdowns,
  onConfirm, onAdd, onAdjust, onExport, onSingleCancel, cancellations, onUncancel, ymd,
}: {
  title: string;
  deadline: string;
  confirmed: boolean;
  showCountdown?: boolean;
  breakdowns: { name: string; count: number; list: ReturnType<typeof buildDayDetail> }[];
  onConfirm: () => void;
  onAdd: () => void;
  onAdjust: () => void;
  onExport: () => void;
  onSingleCancel: (uid: string, reason: string) => void;
  cancellations: { id: string; userId: string }[];
  onUncancel: (id: string) => void;
  ymd: string;
}) {
  const t = !confirmed && showCountdown ? timeToDeadline(deadline) : null;
  return (
    <section className="card">
      <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between bg-ink-50/40">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{title}</span>
          <span className="text-[11px] text-ink-500">締切 {deadline}</span>
          {t && t.total > 0 && (
            <span className={"text-[11px] font-semibold " + (t.total < 120 ? "text-err-700" : "text-warn-700")}>あと {t.hours}h {t.minutes}m</span>
          )}
          <span className="ml-2"><MealStateChip state={confirmed ? "confirmed" : "unconfirmed"} /></span>
        </div>
        <div className="flex gap-2">
          {!confirmed && <button onClick={onConfirm} className="btn btn-sm btn-primary">この区分を確定</button>}
          <button onClick={onAdd} className="btn btn-sm">+ 当日追加</button>
          <button onClick={onAdjust} className="btn btn-sm">手動調整</button>
          <button onClick={onExport} className="btn btn-sm">CSV</button>
        </div>
      </div>
      <div className="divide-y divide-ink-100">
        {breakdowns.map((b, i) => {
          const targets = b.list.filter((x) => x.status === "対象");
          const stopped = b.list.filter((x) => x.status === "ステータス連動停止");
          const regular = b.list.filter((x) => x.status === "定期キャンセル");
          const singles = b.list.filter((x) => x.status === "単発キャンセル");
          return (
            <div key={i} className="p-4 text-[13px]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-ink-800">{b.name}</span>
                <span className="num text-[20px] font-bold text-brand-700">{b.count} 食</span>
              </div>
              {targets.length === 0 && stopped.length === 0 && regular.length === 0 && singles.length === 0 && (
                <div className="text-center text-[12px] text-ink-500 py-3">対象者がいません</div>
              )}
              <PeopleList title={`対象 ${targets.length} 名`} items={targets} tone="ok" onCancel={(uid) => {
                const reason = window.prompt("単発キャンセル理由を入力してください") ?? "";
                if (reason.trim()) onSingleCancel(uid, reason);
              }} />
              {singles.length > 0 && (
                <PeopleList
                  title={`単発キャンセル ${singles.length} 名`}
                  items={singles}
                  tone="warn"
                  onUncancel={(uid) => {
                    const c = cancellations.find((x) => x.userId === uid);
                    if (c) onUncancel(c.id);
                  }}
                />
              )}
              {regular.length > 0 && <PeopleList title={`定期キャンセル ${regular.length} 名`} items={regular} tone="warn" />}
              {stopped.length > 0 && <PeopleList title={`ステータス連動停止 ${stopped.length} 名`} items={stopped} tone="err" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PeopleList({
  title, items, tone, onCancel, onUncancel,
}: {
  title: string;
  items: ReturnType<typeof buildDayDetail>;
  tone: "ok" | "warn" | "err";
  onCancel?: (uid: string) => void;
  onUncancel?: (uid: string) => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1.5"><Pill tone={tone}>{title}</Pill></div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[12px]">
        {items.map((x) => (
          <li key={x.user.id} className="flex items-center gap-2 px-2 py-1 bg-ink-50/60 rounded">
            <span className="num text-ink-500 w-10">{x.user.room}</span>
            <Link href={`/users/${x.user.id}`} className="text-ink-900 hover:text-brand-700 hover:underline flex-1 truncate">{x.user.name}</Link>
            <span className="text-[10px] text-ink-500">{x.user.meal.form}</span>
            {x.user.allergies.length > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-err-100 text-err-700 font-semibold">🚨 {x.user.allergies.map((a) => a.name).join("・")}</span>
            )}
            {x.reason && <span className="text-[10px] text-ink-500">{x.reason}</span>}
            {onCancel && <button onClick={() => onCancel(x.user.id)} className="text-[10px] text-err-700 hover:underline">×</button>}
            {onUncancel && <button onClick={() => onUncancel(x.user.id)} className="text-[10px] text-brand-700 hover:underline">取消</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
