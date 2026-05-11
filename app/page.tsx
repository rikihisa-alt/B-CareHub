"use client";
import Link from "next/link";
import { useState } from "react";
import {
  users, totalOf, jpy, buildMonthMealCounts, alerts, tasks as allTasks, handovers, activities,
  timeToDeadline, vendors,
} from "@/lib/data";
import { Modal, Drawer } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import {
  StatusBadge, PriorityPill, MealStateChip, Segment, Field, Input, Select, ModalFooter,
} from "@/components/ui/primitives";

const TODAY = "2026-05-12";

export default function DashboardPage() {
  const counts = buildMonthMealCounts(2026, 5);
  const today = counts.find((c) => c.date === TODAY)!;
  const yesterday = counts.find((c) => c.date === "2026-05-11")!;

  const occupied = users.filter((u) => u.status === "入居中").length;
  const hospital = users.filter((u) => u.status === "入院中").length;
  const overnight = users.filter((u) => u.status === "外泊中").length;
  const homeVisit = users.filter((u) => u.status === "一時帰宅").length;
  const capacity = 16;
  const vacancy = capacity - users.filter((u) => u.status !== "退去済").length;

  const totalBilling = users.reduce((s, u) => s + totalOf(u), 0);
  const tasksUrgent = allTasks.filter((t) => t.priority === "高" && t.status !== "完了").length;
  const importantHandovers = handovers.filter((h) => h.important).length;

  const [confirmFor, setConfirmFor] = useState<null | "breakfast" | "lunch" | "dinner">(null);
  const [confirmed, setConfirmed] = useState(today.confirmed);
  const [statusUser, setStatusUser] = useState<typeof users[number] | null>(null);
  const [taskFilter, setTaskFilter] = useState<"urgent" | "today" | "week">("urgent");
  const [taskAddOpen, setTaskAddOpen] = useState(false);

  const mealsUnconfirmed = [confirmed.breakfast, confirmed.lunch, confirmed.dinner].filter((c) => !c).length;
  const impactEvents = users.filter((u) => ["入院中", "外泊中", "一時帰宅"].includes(u.status));

  const filteredTasks = allTasks.filter((t) => {
    if (taskFilter === "urgent") return t.priority === "高" && t.status !== "完了";
    if (taskFilter === "today") return t.due === TODAY;
    return t.status !== "完了";
  });

  function doConfirm(type: "breakfast" | "lunch" | "dinner") {
    setConfirmed((c) => ({ ...c, [type]: true }));
    const label = { breakfast: "朝食", lunch: "昼食", dinner: "夕食" }[type];
    toast(`本日の${label}発注を確定しました`, "ok");
    setConfirmFor(null);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">ダッシュボード</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">2026年5月12日（火）／ あすか苑（仮）</p>
      </header>

      {/* 1段目：今日の要対応バー */}
      <section className="card divide-x divide-ink-100 flex">
        <ActionItem href={`/meals/${TODAY}`} value={mealsUnconfirmed} unit="区分" label="食事 未確定" tone={mealsUnconfirmed > 0 ? "err" : "neutral"} />
        <ActionItem href="/goods" value={2} unit="品目" label="在庫不足" tone="warn" />
        <ActionItem href="/billing" value={users.length} unit="件" label="未確定請求" tone="warn" />
        <ActionItem href="/inbox/tasks" value={tasksUrgent} unit="件" label="期限間近タスク" tone="warn" />
        <ActionItem href="/handovers" value={importantHandovers} unit="件" label="重要 申し送り" tone="err" />
      </section>

      {/* 2段目：食事ステータス + 要対応タスク */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7">
          <SectionHead title="本日の食事発注ステータス" right={<Link href={`/meals/${TODAY}`} className="text-[12px] text-brand-700 hover:underline">日別詳細 →</Link>} />
          <div className="card divide-x divide-ink-100 flex">
            <MealBlock
              label="朝食"
              state={confirmed.breakfast ? "confirmed" : "unconfirmed"}
              primary={`パン ${today.bread}`}
              secondary={`ジュース ${today.juice}`}
              confirmedAt={confirmed.breakfast ? "08:40" : undefined}
              diff={today.bread - yesterday.bread}
              showActions={!confirmed.breakfast}
              onConfirm={() => setConfirmFor("breakfast")}
            />
            <MealBlock
              label="昼食"
              state={confirmed.lunch ? "confirmed" : "unconfirmed"}
              primary={`A社 ${today.lunchA}`}
              secondary={`B社 ${today.lunchB}`}
              deadline={vendors[0].deadlineTime}
              countdown={timeToDeadline(vendors[0].deadlineTime)}
              unconfirmedUsers={confirmed.lunch ? undefined : 3}
              diff={(today.lunchA + today.lunchB) - (yesterday.lunchA + yesterday.lunchB)}
              showActions={!confirmed.lunch}
              onConfirm={() => setConfirmFor("lunch")}
            />
            <MealBlock
              label="夕食"
              state={confirmed.dinner ? "confirmed" : "pending"}
              primary={`A社 ${today.dinnerA}`}
              secondary={`B社 ${today.dinnerB}`}
              deadline="15:00"
              diff={(today.dinnerA + today.dinnerB) - (yesterday.dinnerA + yesterday.dinnerB)}
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <SectionHead title="今日の要対応タスク" right={<Link href="/inbox/tasks" className="text-[12px] text-brand-700 hover:underline">すべて →</Link>} />
          <div className="card">
            <div className="px-3 pt-2.5 pb-2 flex gap-1 border-b border-ink-100">
              <Segment active={taskFilter === "urgent"} onClick={() => setTaskFilter("urgent")}>緊急 ({tasksUrgent})</Segment>
              <Segment active={taskFilter === "today"} onClick={() => setTaskFilter("today")}>本日中</Segment>
              <Segment active={taskFilter === "week"} onClick={() => setTaskFilter("week")}>今週中</Segment>
            </div>
            <ul className="divide-y divide-ink-100">
              {filteredTasks.length === 0 && (
                <li className="px-3 py-5 text-center text-[12px] text-ink-500">該当するタスクはありません</li>
              )}
              {filteredTasks.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="px-3 py-2.5 hover:bg-ink-50/60 flex items-center gap-2 text-[13px] cursor-pointer"
                  onClick={() => toast(`タスク：${t.title}`, "info")}
                >
                  <PriorityPill p={t.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="text-ink-900 truncate">{t.title}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      {t.userName ?? "—"} ／ 期限 <span className="num">{t.due}</span> ／ {t.assignee}
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-500 shrink-0">{t.status}</span>
                </li>
              ))}
            </ul>
            <div className="px-3 py-2 border-t border-ink-100 text-right">
              <button onClick={() => setTaskAddOpen(true)} className="text-[12px] text-brand-700 hover:underline">＋ タスク追加</button>
            </div>
          </div>
        </div>
      </section>

      {/* 3段目：影響イベント */}
      <section>
        <SectionHead title="食事・請求に影響する利用者ステータス変化" right={<Link href="/users" className="text-[12px] text-brand-700 hover:underline">利用者一覧 →</Link>} />
        <div className="card">
          <ul className="divide-y divide-ink-100">
            {impactEvents.map((u) => {
              const period = u.id === "U2024-0002" ? "5/5〜5/13 退院予定"
                : u.id === "U2024-0004" ? "5/10〜5/12 親族宅"
                : u.id === "U2024-0009" ? "5/9〜5/11"
                : "—";
              return (
                <li key={u.id} className="px-4 py-2.5 flex items-center gap-3 text-[13px] hover:bg-ink-50/60">
                  <Link href={`/users/${u.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline w-28 shrink-0">
                    {u.name}
                  </Link>
                  <span className="num text-[12px] text-ink-500 shrink-0 w-10">{u.room}</span>
                  <StatusBadge s={u.status} />
                  <span className="text-[12px] text-ink-700 shrink-0">{period}</span>
                  <span className="text-[12px] text-ink-500 flex-1 truncate">影響：食事自動停止 ／ 固定費は通常請求</span>
                  <button onClick={() => setStatusUser(u)} className="btn btn-sm">ステータス変更</button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 4段目：運用サマリー */}
      <section>
        <SectionHead title="運用サマリー" />
        <div className="card px-4 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px]">
          <Stat label="入居" value={occupied} unit="名" href="/users" />
          <Sep />
          <Stat label="入院" value={hospital} unit="名" tone={hospital > 0 ? "warn" : "neutral"} href="/users" />
          <Sep />
          <Stat label="外泊" value={overnight} unit="名" tone={overnight > 0 ? "warn" : "neutral"} href="/users" />
          <Sep />
          <Stat label="一時帰宅" value={homeVisit} unit="名" tone={homeVisit > 0 ? "warn" : "neutral"} href="/users" />
          <Sep />
          <Stat label="空室" value={vacancy} unit={`室 / ${capacity}`} />
          <Sep />
          <Stat label="今月請求予定" value={jpy(totalBilling)} tone="brand" href="/billing" />
          <Sep />
          <Stat label="未確定請求" value={users.length} unit="件" tone="warn" href="/billing" />
        </div>
      </section>

      {/* 5段目 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BottomCard
          title={`在庫アラート（2）`}
          link={{ href: "/goods", label: "発注候補 →" }}
        >
          <li className="px-3 py-2 flex items-center justify-between hover:bg-ink-50/60 cursor-pointer" onClick={() => toast("おむつ Lサイズ：要発注", "warn")}>
            <span>おむつ Lサイズ</span>
            <span className="text-ink-500 num">残 24 / 最低 40</span>
            <span className="text-warn-700 font-semibold text-[11px]">要発注</span>
          </li>
          <li className="px-3 py-2 flex items-center justify-between hover:bg-ink-50/60 cursor-pointer" onClick={() => toast("使い捨て手袋 M：3日以内に枯渇", "err")}>
            <span>使い捨て手袋 M</span>
            <span className="text-ink-500 num">残 4 / 最低 10</span>
            <span className="text-err-700 font-semibold text-[11px]">切迫</span>
          </li>
        </BottomCard>

        <BottomCard title="申し送り（直近）" link={{ href: "/handovers", label: "一覧 →" }}>
          {handovers.slice(0, 4).map((h) => (
            <li
              key={h.id}
              className="px-3 py-2 flex gap-2 hover:bg-ink-50/60 cursor-pointer"
              onClick={() => toast(`${h.staff} → ${h.userName ?? ""}：${h.content}`, h.important ? "err" : "info")}
            >
              <span className="text-ink-500 num shrink-0">{h.at.slice(11)}</span>
              <span className="text-ink-600 shrink-0 w-12">{h.staff}</span>
              <span className={"flex-1 truncate " + (h.important ? "text-err-700 font-semibold" : "text-ink-800")}>
                {h.important && "★"}{h.userName ? `${h.userName} ` : ""}{h.content}
              </span>
            </li>
          ))}
        </BottomCard>

        <div>
          <SectionHead title="アクティビティ" right={<Link href="/inbox/activity" className="text-[12px] text-brand-700 hover:underline">全件 →</Link>} />
          <div className="card">
            <details>
              <summary className="px-3 py-2.5 cursor-pointer list-none flex items-center justify-between text-[12px]">
                <span className="text-ink-700">過去24時間 {activities.length} 件</span>
                <span className="text-brand-700">▶ 展開</span>
              </summary>
              <ul className="divide-y divide-ink-100 text-[11px] border-t border-ink-100">
                {activities.map((a) => (
                  <li key={a.id} className="px-3 py-2">
                    <div className="num text-ink-500">{a.at}</div>
                    <div className="text-ink-800">{a.message}</div>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </section>

      {/* ====== モーダル群 ====== */}
      <Modal
        open={confirmFor !== null}
        onClose={() => setConfirmFor(null)}
        title={`${confirmFor === "breakfast" ? "朝食" : confirmFor === "lunch" ? "昼食" : "夕食"} 発注確定`}
        footer={<ModalFooter onCancel={() => setConfirmFor(null)} onConfirm={() => confirmFor && doConfirm(confirmFor)} confirmLabel="確定する" />}
      >
        <p className="mb-3">
          本日（{TODAY}）の{confirmFor === "breakfast" ? "朝食" : confirmFor === "lunch" ? "昼食" : "夕食"}発注を確定します。
        </p>
        <ul className="bg-ink-50 rounded p-3 text-[12px] space-y-1">
          <li>確定後はステータス変更があっても自動再計算されません。</li>
          <li>解除は管理者のみ可能で、理由の入力が必要です。</li>
        </ul>
      </Modal>

      <Modal
        open={taskAddOpen}
        onClose={() => setTaskAddOpen(false)}
        title="タスク追加"
        footer={<ModalFooter onCancel={() => setTaskAddOpen(false)} onConfirm={() => { toast("タスクを追加しました", "ok"); setTaskAddOpen(false); }} />}
      >
        <div className="space-y-3">
          <Field label="タスク名"><Input placeholder="例：請求書送付" /></Field>
          <Field label="対象利用者">
            <Select>
              <option value="">— なし（施設タスク）—</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}（{u.room}）</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="期限"><Input type="date" defaultValue="2026-05-15" className="num" /></Field>
            <Field label="優先度">
              <Select><option>高</option><option>中</option><option>低</option></Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Drawer
        open={statusUser !== null}
        onClose={() => setStatusUser(null)}
        title={`ステータス変更：${statusUser?.name ?? ""} 様`}
        footer={<ModalFooter onCancel={() => setStatusUser(null)} onConfirm={() => { toast(`${statusUser?.name} 様 のステータス変更を保存しました`, "ok"); setStatusUser(null); }} confirmLabel="変更を実行" />}
      >
        {statusUser && (
          <div className="space-y-4">
            <Field label="現在のステータス"><StatusBadge s={statusUser.status} /></Field>
            <Field label="変更先">
              <Select defaultValue={statusUser.status}>
                <option>入居中</option><option>入院中</option><option>外泊中</option><option>一時帰宅</option><option>退去済</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="期間 開始"><Input type="date" defaultValue={TODAY} className="num" /></Field>
              <Field label="期間 終了（任意）"><Input type="date" className="num" /></Field>
            </div>
            <Field label="理由"><Input placeholder="例：骨折・◯◯病院" /></Field>
            <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 text-[12px] text-warn-700">
              <div className="font-semibold mb-1">この変更による影響</div>
              <ul className="list-disc list-inside text-ink-800 space-y-0.5">
                <li>期間中の食事を自動停止（朝・昼・夕）</li>
                <li>固定費は通常通り（日割設定に従う）</li>
                <li>介護利用料：要確認（カイポケで停止処理）</li>
              </ul>
            </div>
            <div className="space-y-1.5 text-[12px]">
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> ケアマネへの連絡タスクを自動作成</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> 家族への連絡を申し送りに残す</label>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ====== 小さなプレゼンテーション部品（このページ専用） ====== */

function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-2">
      <h2 className="text-[13px] font-semibold text-ink-700">{title}</h2>
      {right}
    </div>
  );
}

function ActionItem({
  href, value, unit, label, tone,
}: { href: string; value: number; unit: string; label: string; tone: "err" | "warn" | "neutral" }) {
  const numCls =
    value === 0 ? "text-ink-400"
    : tone === "err" ? "text-err-700"
    : tone === "warn" ? "text-warn-700"
    : "text-ink-900";
  return (
    <Link href={href} className="flex-1 px-5 py-3 hover:bg-ink-50/60 transition-colors">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`num font-bold text-[22px] ${numCls}`}>{value}</span>
        <span className="text-[11px] text-ink-500">{unit}</span>
      </div>
    </Link>
  );
}

function MealBlock({
  label, state, primary, secondary, deadline, countdown, confirmedAt, unconfirmedUsers, diff, showActions, onConfirm,
}: {
  label: string;
  state: "confirmed" | "unconfirmed" | "pending";
  primary: string; secondary: string;
  deadline?: string;
  countdown?: { hours: number; minutes: number; total: number };
  confirmedAt?: string;
  unconfirmedUsers?: number;
  diff?: number;
  showActions?: boolean;
  onConfirm?: () => void;
}) {
  const bg = state === "confirmed" ? "bg-ok-50/40" : state === "unconfirmed" ? "bg-warn-50/40" : "";
  return (
    <div className={`flex-1 p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-semibold text-ink-800">{label}</span>
        <MealStateChip state={state} />
      </div>
      <div className="num text-[20px] font-bold text-ink-900 leading-tight">{primary}</div>
      <div className="num text-[14px] text-ink-700">{secondary}</div>
      <dl className="mt-3 space-y-0.5 text-[11px] text-ink-600">
        {confirmedAt && <KV k="確定" v={confirmedAt} />}
        {deadline && state !== "confirmed" && <KV k="締切" v={deadline} />}
        {countdown && countdown.total > 0 && state === "unconfirmed" && (
          <KV k="残り" v={<span className={countdown.total < 120 ? "text-err-700 font-semibold" : "text-warn-700 font-semibold"}>{countdown.hours}h {countdown.minutes}m</span>} />
        )}
        {unconfirmedUsers !== undefined && state === "unconfirmed" && (
          <KV k="未確定者" v={<span className="text-err-700 font-semibold">{unconfirmedUsers} 名</span>} />
        )}
        {diff !== undefined && diff !== 0 && (
          <KV k="前日比" v={<span className={diff > 0 ? "text-info-700" : "text-err-700"}>{diff > 0 ? `+${diff}` : diff}</span>} />
        )}
      </dl>
      {showActions && (
        <div className="mt-3 flex gap-2">
          <Link href={`/meals/${TODAY}`} className="btn btn-sm flex-1">詳細</Link>
          <button onClick={onConfirm} className="btn btn-sm btn-primary flex-1">確定する</button>
        </div>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-500">{k}</dt>
      <dd className="num">{v}</dd>
    </div>
  );
}

function Stat({
  label, value, unit, tone, href,
}: { label: string; value: string | number; unit?: string; tone?: "warn" | "brand" | "neutral"; href?: string }) {
  const numCls = tone === "warn" ? "text-warn-700" : tone === "brand" ? "text-brand-700" : "text-ink-900";
  const inner = (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[11px] text-ink-500">{label}</span>
      <span className={`num font-bold text-[15px] ${numCls}`}>{value}</span>
      {unit && <span className="text-[10px] text-ink-500">{unit}</span>}
    </span>
  );
  return href ? <Link href={href} className="hover:underline">{inner}</Link> : inner;
}

function Sep() {
  return <span className="text-ink-300">・</span>;
}

function BottomCard({
  title, link, children,
}: {
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionHead title={title} right={link && <Link href={link.href} className="text-[12px] text-brand-700 hover:underline">{link.label}</Link>} />
      <div className="card">
        <ul className="divide-y divide-ink-100 text-[12px]">{children}</ul>
      </div>
    </div>
  );
}
