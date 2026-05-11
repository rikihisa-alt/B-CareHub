"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { users, totalOf, jpy, type User } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";
import {
  StatusBadge, Pill, FilterChip, Field, Input, Select, Th, ModalFooter,
} from "@/components/ui/primitives";

type Filter = "all" | "active" | "hospital" | "away" | "left";

export default function UsersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const list = useMemo(() => users.filter((u) => {
    if (filter === "active" && u.status !== "入居中") return false;
    if (filter === "hospital" && u.status !== "入院中") return false;
    if (filter === "away" && !["外泊中", "一時帰宅"].includes(u.status)) return false;
    if (filter === "left" && u.status !== "退去済") return false;
    if (q && !`${u.name}${u.kana}${u.room}`.includes(q)) return false;
    return true;
  }), [filter, q]);

  const counts = {
    active: users.filter((u) => u.status === "入居中").length,
    hospital: users.filter((u) => u.status === "入院中").length,
    overnight: users.filter((u) => u.status === "外泊中").length,
    homeVisit: users.filter((u) => u.status === "一時帰宅").length,
  };

  function handleCsv() {
    downloadCsv(
      `利用者一覧_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ["部屋", "氏名", "フリガナ", "ステータス", "介護度", "今月請求予定"],
        ...list.map((u) => [u.room, u.name, u.kana, u.status, u.careLevel, totalOf(u)]),
      ],
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">利用者一覧</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            {list.length} / {users.length} 名（入居中 {counts.active} ／ 入院 {counts.hospital} ／ 外泊 {counts.overnight} ／ 一時帰宅 {counts.homeVisit}）
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={handleCsv} className="btn">CSV出力</button>
          <button onClick={doPrint} className="btn">印刷</button>
          <button onClick={() => setNewOpen(true)} className="btn btn-primary">＋ 新規利用者</button>
        </div>
      </header>

      <div className="card p-3 flex flex-wrap gap-2 no-print">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>全件 ({users.length})</FilterChip>
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>入居中</FilterChip>
        <FilterChip active={filter === "hospital"} onClick={() => setFilter("hospital")}>入院中</FilterChip>
        <FilterChip active={filter === "away"} onClick={() => setFilter("away")}>外泊・一時帰宅</FilterChip>
        <FilterChip active={filter === "left"} onClick={() => setFilter("left")}>退去済</FilterChip>
        <input
          type="search"
          placeholder="氏名・部屋番号で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto px-3 py-1.5 border border-ink-200 rounded text-[12px] w-64"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200">
            <tr className="text-ink-600">
              <Th className="w-14">部屋</Th>
              <Th>氏名</Th>
              <Th className="w-24">ステータス</Th>
              <Th className="w-24">介護度</Th>
              <Th className="w-44" align="center">食事設定</Th>
              <Th className="w-32" align="right">今月請求予定</Th>
              <Th className="w-16" align="center">書類</Th>
              <Th className="w-16" align="center">タスク</Th>
              <Th className="w-20" align="center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-[12px] text-ink-500">該当する利用者がありません</td></tr>
            )}
            {list.map((u) => (
              <tr key={u.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-3 num font-semibold text-ink-900">{u.room}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-ink-900">{u.name}</div>
                  <div className="text-[11px] text-ink-500">{u.kana} ・ {u.gender} {u.age}歳</div>
                </td>
                <td className="px-3 py-3"><StatusBadge s={u.status} /></td>
                <td className="px-3 py-3 text-ink-700">{u.careLevel}</td>
                <td className="px-3 py-3 text-center"><MealIcons u={u} /></td>
                <td className="px-3 py-3 text-right num font-semibold text-ink-900">{jpy(totalOf(u))}</td>
                <td className="px-3 py-3 text-center">{u.unpaidDocs > 0 ? <Pill tone="warn">{u.unpaidDocs}</Pill> : <span className="text-ink-300">—</span>}</td>
                <td className="px-3 py-3 text-center">{u.openTasks > 0 ? <Pill tone="warn">{u.openTasks}</Pill> : <span className="text-ink-300">—</span>}</td>
                <td className="px-3 py-3 text-center">
                  <Link href={`/users/${u.id}`} className="btn btn-sm btn-arrow">確認</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="新規利用者の登録"
        size="lg"
        footer={<ModalFooter onCancel={() => setNewOpen(false)} onConfirm={() => { toast("新規利用者を登録しました", "ok"); setNewOpen(false); }} confirmLabel="登録" />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="姓"><Input /></Field>
          <Field label="名"><Input /></Field>
          <Field label="セイ"><Input /></Field>
          <Field label="メイ"><Input /></Field>
          <Field label="生年月日"><Input type="date" className="num" /></Field>
          <Field label="性別"><Select><option>女</option><option>男</option><option>その他</option></Select></Field>
          <Field label="部屋"><Input placeholder="例：107" className="num" /></Field>
          <Field label="入居日"><Input type="date" className="num" /></Field>
          <Field label="介護度">
            <Select>
              <option>自立</option><option>要支援1</option><option>要支援2</option>
              <option>要介護1</option><option>要介護2</option><option>要介護3</option><option>要介護4</option><option>要介護5</option>
            </Select>
          </Field>
          <Field label="キーパーソン"><Input placeholder="氏名（続柄）" /></Field>
        </div>
      </Modal>
    </div>
  );
}

function MealIcons({ u }: { u: User }) {
  return (
    <div className="flex justify-center gap-2 text-[11px] text-ink-700">
      <span>朝 {u.meal.breakfastBread ? "パン" : "—"}{u.meal.breakfastJuice ? "・🥤" : ""}</span>
      <span className="text-ink-300">|</span>
      <span>昼 {u.meal.lunchVendor === "なし" ? "—" : u.meal.lunchVendor}</span>
      <span className="text-ink-300">|</span>
      <span>夕 {u.meal.dinnerVendor === "なし" ? "—" : u.meal.dinnerVendor}</span>
    </div>
  );
}
