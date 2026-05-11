"use client";
import Link from "next/link";
import { useState } from "react";
import { buildMonthMealCounts, buildDayDetail, vendors, timeToDeadline } from "@/lib/data";
import { Modal, Drawer } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";
import { Field, Input, Select, MealStateChip, Pill, ModalFooter } from "@/components/ui/primitives";

type MealType = "breakfast" | "lunch" | "dinner";

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function MealDayDetail({ ymd }: { ymd: string }) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[date.getDay()];

  const counts = buildMonthMealCounts(y, m);
  const today = counts.find((c) => c.date === ymd)!;

  const [confirmed, setConfirmed] = useState({ ...today.confirmed });
  const [confirmModal, setConfirmModal] = useState<MealType | null>(null);
  const [adjustOpen, setAdjustOpen] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState<string | null>(null);

  const breakfast = buildDayDetail(ymd, "breakfast");
  const lunchA = buildDayDetail(ymd, "lunch", "A社");
  const lunchB = buildDayDetail(ymd, "lunch", "B社");
  const dinnerA = buildDayDetail(ymd, "dinner", "A社");
  const dinnerB = buildDayDetail(ymd, "dinner", "B社");

  function doConfirm(type: MealType) {
    setConfirmed((c) => ({ ...c, [type]: true }));
    toast(`${ymd} の${MEAL_LABEL[type]}発注を確定しました`, "ok");
    setConfirmModal(null);
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
            <button onClick={() => setConfirmModal("lunch")} className="btn btn-primary">発注確定</button>
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

      <VendorBlock
        title="朝食（パン・ジュース業者）"
        deadline={vendors[2].deadlineTime}
        confirmed={confirmed.breakfast}
        onConfirm={() => setConfirmModal("breakfast")}
        onAdd={() => setAddOpen("breakfast")}
        onAdjust={() => setAdjustOpen("breakfast")}
        onExport={() => exportVendorCsv("パン業者", "朝食", breakfast)}
        breakdowns={[
          { name: "パン", count: today.bread, list: breakfast.filter((x) => x.user.meal.breakfastBread) },
          { name: "ジュース", count: today.juice, list: breakfast.filter((x) => x.user.meal.breakfastJuice) },
        ]}
      />

      <VendorBlock
        title="昼食 A社"
        deadline={vendors[0].deadlineTime}
        confirmed={confirmed.lunch}
        showCountdown
        onConfirm={() => setConfirmModal("lunch")}
        onAdd={() => setAddOpen("昼食 A社")}
        onAdjust={() => setAdjustOpen("昼食 A社")}
        onExport={() => exportVendorCsv("A社", "昼食", lunchA)}
        breakdowns={[{ name: "弁当", count: today.lunchA, list: lunchA }]}
      />

      <VendorBlock
        title="昼食 B社"
        deadline={vendors[1].deadlineTime}
        confirmed={confirmed.lunch}
        onConfirm={() => setConfirmModal("lunch")}
        onAdd={() => setAddOpen("昼食 B社")}
        onAdjust={() => setAdjustOpen("昼食 B社")}
        onExport={() => exportVendorCsv("B社", "昼食", lunchB)}
        breakdowns={[{ name: "弁当", count: today.lunchB, list: lunchB }]}
      />

      <VendorBlock
        title="夕食 A社"
        deadline="15:00"
        confirmed={confirmed.dinner}
        onConfirm={() => setConfirmModal("dinner")}
        onAdd={() => setAddOpen("夕食 A社")}
        onAdjust={() => setAdjustOpen("夕食 A社")}
        onExport={() => exportVendorCsv("A社", "夕食", dinnerA)}
        breakdowns={[{ name: "弁当", count: today.dinnerA, list: dinnerA }]}
      />

      <VendorBlock
        title="夕食 B社"
        deadline="15:00"
        confirmed={confirmed.dinner}
        onConfirm={() => setConfirmModal("dinner")}
        onAdd={() => setAddOpen("夕食 B社")}
        onAdjust={() => setAdjustOpen("夕食 B社")}
        onExport={() => exportVendorCsv("B社", "夕食", dinnerB)}
        breakdowns={[{ name: "弁当", count: today.dinnerB, list: dinnerB }]}
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
        title={`${addOpen ?? ""} に当日追加`}
        footer={<ModalFooter onCancel={() => setAddOpen(null)} onConfirm={() => { toast(`${addOpen} の当日追加を保存しました`, "ok"); setAddOpen(null); }} confirmLabel="追加" />}
      >
        <Field label="対象利用者">
          <Select>
            <option value="">— 選択 —</option>
            <option>佐藤 ヨシ子（101）</option>
            <option>高橋 正一（103）</option>
          </Select>
        </Field>
        <div className="mt-3">
          <Field label="理由（必須）"><Input placeholder="例：来客・代食手配" /></Field>
        </div>
        <div className="bg-info-50 border-l-[3px] border-info-600 rounded-r px-3 py-2 mt-3 text-[12px] text-ink-800">
          当日追加は変更履歴に記録され、業者への発注表に反映されます。
        </div>
      </Drawer>

      <Drawer
        open={adjustOpen !== null}
        onClose={() => setAdjustOpen(null)}
        title={`${adjustOpen ?? ""} の手動調整`}
        footer={<ModalFooter onCancel={() => setAdjustOpen(null)} onConfirm={() => { toast(`${adjustOpen} の手動調整を保存しました`, "ok"); setAdjustOpen(null); }} />}
      >
        <Field label="調整数（±）"><Input type="number" defaultValue={0} className="num" /></Field>
        <div className="mt-3">
          <Field label="理由（必須）"><Input placeholder="例：誤発注修正、業者発注ミス補正" /></Field>
        </div>
        <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 mt-3 text-[12px]">
          手動調整は変更履歴・監査ログの両方に記録されます。
        </div>
      </Drawer>
    </div>
  );
}

function StatusChip({
  label, confirmed, deadline, showCountdown,
}: { label: string; confirmed: boolean; deadline: string; showCountdown?: boolean }) {
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
  title, deadline, confirmed, showCountdown, breakdowns, onConfirm, onAdd, onAdjust, onExport,
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
}) {
  const t = !confirmed && showCountdown ? timeToDeadline(deadline) : null;
  return (
    <section className="card">
      <div className="px-4 py-2.5 border-b border-ink-100 flex items-center justify-between bg-ink-50/40">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{title}</span>
          <span className="text-[11px] text-ink-500">締切 {deadline}</span>
          {t && t.total > 0 && (
            <span className={"text-[11px] font-semibold " + (t.total < 120 ? "text-err-700" : "text-warn-700")}>
              あと {t.hours}h {t.minutes}m
            </span>
          )}
          <span className="ml-2">
            <MealStateChip state={confirmed ? "confirmed" : "unconfirmed"} />
          </span>
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
          return (
            <div key={i} className="p-4 text-[13px]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-ink-800">{b.name}</span>
                <span className="num text-[20px] font-bold text-brand-700">{b.count} 食</span>
              </div>
              <PeopleList title={`対象 ${targets.length} 名`} items={targets} tone="ok" />
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
  title, items, tone,
}: {
  title: string;
  items: ReturnType<typeof buildDayDetail>;
  tone: "ok" | "warn" | "err";
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1.5">
        <Pill tone={tone}>{title}</Pill>
      </div>
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
          </li>
        ))}
      </ul>
    </div>
  );
}
