"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { users, totalOf, jpy } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint } from "@/components/ui/helpers";

type Filter = "all" | "active" | "hospital" | "away" | "left";

export default function UsersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const list = useMemo(() => {
    return users.filter((u) => {
      if (filter === "active" && u.status !== "入居中") return false;
      if (filter === "hospital" && u.status !== "入院中") return false;
      if (filter === "away" && !["外泊中", "一時帰宅"].includes(u.status)) return false;
      if (filter === "left" && u.status !== "退去済") return false;
      if (q && !`${u.name}${u.kana}${u.room}`.includes(q)) return false;
      return true;
    });
  }, [filter, q]);

  function handleCsv() {
    const rows: (string | number)[][] = [
      ["部屋", "氏名", "フリガナ", "ステータス", "介護度", "今月請求予定"],
      ...list.map((u) => [u.room, u.name, u.kana, u.status, u.careLevel, totalOf(u)]),
    ];
    downloadCsv(`利用者一覧_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">利用者一覧</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            {list.length} / {users.length} 名（入居中 {users.filter((u) => u.status === "入居中").length} ／ 入院 {users.filter((u) => u.status === "入院中").length} ／ 外泊 {users.filter((u) => u.status === "外泊中").length} ／ 一時帰宅 {users.filter((u) => u.status === "一時帰宅").length}）
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={handleCsv} className="btn text-[12px]">CSV出力</button>
          <button onClick={doPrint} className="btn text-[12px]">印刷</button>
          <button onClick={() => setNewOpen(true)} className="btn btn-primary text-[12px]">＋ 新規利用者</button>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px] no-print">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>全件 ({users.length})</Chip>
        <Chip active={filter === "active"} onClick={() => setFilter("active")}>入居中</Chip>
        <Chip active={filter === "hospital"} onClick={() => setFilter("hospital")}>入院中</Chip>
        <Chip active={filter === "away"} onClick={() => setFilter("away")}>外泊・一時帰宅</Chip>
        <Chip active={filter === "left"} onClick={() => setFilter("left")}>退去済</Chip>
        <div className="ml-auto">
          <input
            type="search"
            placeholder="氏名・部屋番号で検索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="px-3 py-1.5 border border-ink-200 rounded text-[12px] w-64"
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200">
            <tr className="text-left text-ink-600">
              <Th className="w-14">部屋</Th>
              <Th>氏名</Th>
              <Th className="w-24">ステータス</Th>
              <Th className="w-24">介護度</Th>
              <Th className="w-44 text-center">食事設定</Th>
              <Th className="w-32 text-right">今月請求予定</Th>
              <Th className="w-16 text-center">書類</Th>
              <Th className="w-16 text-center">タスク</Th>
              <Th className="w-20 text-center">操作</Th>
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
                <td className="px-3 py-3 text-center text-[11px] text-ink-700">
                  <MealIcons u={u} />
                </td>
                <td className="px-3 py-3 text-right num font-semibold text-ink-900">{jpy(totalOf(u))}</td>
                <td className="px-3 py-3 text-center">{u.unpaidDocs > 0 ? <Pill>{u.unpaidDocs}</Pill> : <span className="text-ink-300">—</span>}</td>
                <td className="px-3 py-3 text-center">{u.openTasks > 0 ? <Pill>{u.openTasks}</Pill> : <span className="text-ink-300">—</span>}</td>
                <td className="px-3 py-3 text-center">
                  <Link href={`/users/${u.id}`} className="btn btn-arrow text-[12px]">確認</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新規利用者モーダル */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="新規利用者の登録"
        size="lg"
        footer={
          <>
            <button className="btn text-[12px]" onClick={() => setNewOpen(false)}>取消</button>
            <button
              className="btn btn-primary text-[12px]"
              onClick={() => {
                toast("新規利用者を登録しました", "ok");
                setNewOpen(false);
              }}
            >
              登録
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <F label="姓"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="名"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="セイ"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="メイ"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="生年月日"><input type="date" className="w-full px-3 py-2 border border-ink-200 rounded num" /></F>
          <F label="性別">
            <select className="w-full px-3 py-2 border border-ink-200 rounded"><option>女</option><option>男</option><option>その他</option></select>
          </F>
          <F label="部屋"><input className="w-full px-3 py-2 border border-ink-200 rounded num" placeholder="例：107" /></F>
          <F label="入居日"><input type="date" className="w-full px-3 py-2 border border-ink-200 rounded num" /></F>
          <F label="介護度">
            <select className="w-full px-3 py-2 border border-ink-200 rounded">
              <option>自立</option><option>要支援1</option><option>要支援2</option>
              <option>要介護1</option><option>要介護2</option><option>要介護3</option><option>要介護4</option><option>要介護5</option>
            </select>
          </F>
          <F label="キーパーソン"><input className="w-full px-3 py-2 border border-ink-200 rounded" placeholder="氏名（続柄）" /></F>
        </div>
      </Modal>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-ink-600 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={"px-3 py-2.5 text-[11px] font-semibold " + (className ?? "")}>{children}</th>;
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded border " +
        (active ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    入居中: "bg-ok-50 text-ok-700 border-ok-600/30",
    入院中: "bg-err-50 text-err-700 border-err-600/30",
    外泊中: "bg-warn-50 text-warn-700 border-warn-600/30",
    一時帰宅: "bg-warn-50 text-warn-700 border-warn-600/30",
    退去済: "bg-ink-100 text-ink-600 border-ink-200",
  };
  return <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + (map[s] ?? "")}>{s}</span>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-block min-w-[1.6rem] text-[11px] font-bold num px-1.5 py-0.5 rounded border bg-warn-50 text-warn-700 border-warn-600/30">{children}</span>;
}

function MealIcons({ u }: { u: typeof users[number] }) {
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
