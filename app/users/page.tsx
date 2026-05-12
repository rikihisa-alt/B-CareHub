"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { totalOf, jpy, emptyUserDraft, emptyBilling, type User } from "@/lib/data";
import { useUsers, logActivity, genId } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";
import { StatusBadge, Pill, FilterChip, Field, Input, Select, Th, ModalFooter } from "@/components/ui/primitives";

type Filter = "all" | "active" | "hospital" | "away" | "left";

const careLevels = ["自立", "要支援1", "要支援2", "要介護1", "要介護2", "要介護3", "要介護4", "要介護5"];

export default function UsersPage() {
  const [users, setUsers] = useUsers();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<User, "id">>(emptyUserDraft());

  const list = useMemo(() => users.filter((u) => {
    if (filter === "active" && u.status !== "入居中") return false;
    if (filter === "hospital" && u.status !== "入院中") return false;
    if (filter === "away" && !["外泊中", "一時帰宅"].includes(u.status)) return false;
    if (filter === "left" && u.status !== "退去済") return false;
    if (q && !`${u.name}${u.kana}${u.room}`.includes(q)) return false;
    return true;
  }), [users, filter, q]);

  const counts = {
    active: users.filter((u) => u.status === "入居中").length,
    hospital: users.filter((u) => u.status === "入院中").length,
    overnight: users.filter((u) => u.status === "外泊中").length,
    homeVisit: users.filter((u) => u.status === "一時帰宅").length,
  };

  function exportCsv() {
    downloadCsv(`利用者一覧_${new Date().toISOString().slice(0, 10)}.csv`, [
      ["部屋", "氏名", "フリガナ", "ステータス", "介護度", "今月請求予定"],
      ...list.map((u) => [u.room, u.name, u.kana, u.status, u.careLevel, totalOf(u)]),
    ]);
  }

  function saveNew() {
    if (!draft.name.trim() || !draft.kana.trim()) {
      toast("氏名・フリガナを入力してください", "warn");
      return;
    }
    const id = genId("U");
    const user: User = { ...draft, id, monthlyBilling: emptyBilling() };
    setUsers((cur) => [...cur, user]);
    logActivity(`利用者「${draft.name}」を登録`);
    toast("利用者を登録しました", "ok");
    setNewOpen(false);
    setDraft(emptyUserDraft());
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
          <button onClick={exportCsv} className="btn" disabled={users.length === 0}>CSV出力</button>
          <button onClick={doPrint} className="btn">印刷</button>
          <button onClick={() => { setDraft(emptyUserDraft()); setNewOpen(true); }} className="btn btn-primary">＋ 新規利用者</button>
        </div>
      </header>

      <div className="card p-3 flex flex-wrap gap-2 no-print">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>全件 ({users.length})</FilterChip>
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>入居中 ({counts.active})</FilterChip>
        <FilterChip active={filter === "hospital"} onClick={() => setFilter("hospital")}>入院中 ({counts.hospital})</FilterChip>
        <FilterChip active={filter === "away"} onClick={() => setFilter("away")}>外泊・一時帰宅 ({counts.overnight + counts.homeVisit})</FilterChip>
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
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center">
                  <div className="text-[13px] text-ink-500 mb-3">
                    {users.length === 0 ? "利用者がまだ登録されていません。" : "該当する利用者がありません。"}
                  </div>
                  {users.length === 0 && (
                    <button onClick={() => { setDraft(emptyUserDraft()); setNewOpen(true); }} className="btn btn-primary">
                      ＋ 最初の利用者を登録する
                    </button>
                  )}
                </td>
              </tr>
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
        footer={<ModalFooter onCancel={() => setNewOpen(false)} onConfirm={saveNew} confirmLabel="登録" />}
      >
        <div className="bg-info-50/40 border-l-[3px] border-info-600 rounded-r px-3 py-2 mb-3 text-[12px] text-ink-800">
          💡 まずは <b>氏名・フリガナ・部屋・入居日</b> を入れて登録すれば OK です。<br />
          食事設定・アレルギー・固定費などは、登録後の詳細画面から追加できます。
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="氏名（必須）"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          <Field label="フリガナ（必須）"><Input value={draft.kana} onChange={(e) => setDraft({ ...draft, kana: e.target.value })} /></Field>
          <Field label="生年月日"><Input type="date" value={draft.birthday} onChange={(e) => {
            const b = e.target.value;
            const age = b ? new Date().getFullYear() - new Date(b).getFullYear() : 0;
            setDraft({ ...draft, birthday: b, age });
          }} className="num" /></Field>
          <Field label="性別">
            <Select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value as User["gender"] })}>
              <option>女</option><option>男</option><option>その他</option>
            </Select>
          </Field>
          <Field label="部屋"><Input value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} placeholder="例：101" className="num" /></Field>
          <Field label="入居日"><Input type="date" value={draft.moveInDate} onChange={(e) => setDraft({ ...draft, moveInDate: e.target.value })} className="num" /></Field>
          <Field label="介護度">
            <Select value={draft.careLevel} onChange={(e) => setDraft({ ...draft, careLevel: e.target.value })}>
              {careLevels.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="電話">
            <Input value={draft.keyPerson.phone} onChange={(e) => setDraft({ ...draft, keyPerson: { ...draft.keyPerson, phone: e.target.value } })} placeholder="本人連絡先（任意）" />
          </Field>
          <Field label="キーパーソン 氏名">
            <Input value={draft.keyPerson.name} onChange={(e) => setDraft({ ...draft, keyPerson: { ...draft.keyPerson, name: e.target.value } })} />
          </Field>
          <Field label="キーパーソン 続柄">
            <Input value={draft.keyPerson.relation} onChange={(e) => setDraft({ ...draft, keyPerson: { ...draft.keyPerson, relation: e.target.value } })} placeholder="長男・次女など" />
          </Field>
        </div>
        <div className="mt-3 text-[11px] text-ink-500">
          食事設定・アレルギー・固定費等は登録後、詳細画面から編集できます。
        </div>
      </Modal>
    </div>
  );
}

function MealIcons({ u }: { u: User }) {
  const hasAny = u.meal.breakfastBread || u.meal.breakfastJuice || u.meal.lunchVendor !== "なし" || u.meal.dinnerVendor !== "なし";
  if (!hasAny) return <span className="text-ink-300 text-[11px]">未設定</span>;
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
