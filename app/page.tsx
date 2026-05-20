"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  jpy, buildMonthMealCounts, timeToDeadline, vendors,
  computeUserBilling, utilityBillsToLineItems, generateMealLineItems,
  type Task, type User,
} from "@/lib/data";
import {
  useUsers, useTasks, useHandovers, useActivities, useGoods, useDocuments,
  useMealConfirmations, useSingleCancellations, useFacilities, useCurrentFacilityId,
  useRegularServices, useBillingLineItems, useUtilityBills, useMealPrices,
  logActivity, genId, todayIso, filterByFacility,
} from "@/lib/store";
import { Modal, Drawer } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import {
  StatusBadge, PriorityPill, MealStateChip, Segment, Field, Input, Select, ModalFooter,
} from "@/components/ui/primitives";

export default function DashboardPage() {
  const [allUsers, setUsers] = useUsers();
  const [allTasks, setTasks] = useTasks();
  const [allHandovers] = useHandovers();
  const [activities] = useActivities();
  const [allGoods] = useGoods();
  const [allDocuments] = useDocuments();
  const [confirmations, setConfirmations] = useMealConfirmations();
  const [singleCancellations] = useSingleCancellations();
  const [facilities] = useFacilities();
  const [currentFacilityId] = useCurrentFacilityId();
  const [services] = useRegularServices();
  const [lineItems] = useBillingLineItems();
  const [utilityBills] = useUtilityBills();
  const [mealPrices] = useMealPrices();

  // 施設フィルタ
  const users = useMemo(() => filterByFacility(allUsers, currentFacilityId), [allUsers, currentFacilityId]);
  const tasks = useMemo(() => filterByFacility(allTasks, currentFacilityId), [allTasks, currentFacilityId]);
  const handovers = useMemo(() => filterByFacility(allHandovers, currentFacilityId), [allHandovers, currentFacilityId]);
  const goods = useMemo(() => filterByFacility(allGoods, currentFacilityId), [allGoods, currentFacilityId]);
  const documents = useMemo(() => filterByFacility(allDocuments, currentFacilityId), [allDocuments, currentFacilityId]);

  const today = todayIso();
  const [yYear, yMonth] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];

  // 施設フィルタを適用したキー変換
  const scopedConfirmations = useMemo(() => {
    if (currentFacilityId === null) {
      const result: typeof confirmations = {};
      Object.entries(confirmations).forEach(([key, val]) => {
        const date = key.includes("_") ? key.split("_")[1] : key;
        if (!result[date]) result[date] = { breakfast: true, lunch: true, dinner: true };
        result[date] = {
          breakfast: result[date].breakfast && !!val.breakfast,
          lunch: result[date].lunch && !!val.lunch,
          dinner: result[date].dinner && !!val.dinner,
        };
      });
      return result;
    }
    const result: typeof confirmations = {};
    Object.entries(confirmations).forEach(([key, val]) => {
      if (key.startsWith(`${currentFacilityId}_`)) {
        result[key.split("_")[1]] = val;
      }
    });
    return result;
  }, [confirmations, currentFacilityId]);

  const counts = useMemo(
    () => buildMonthMealCounts(yYear, yMonth, users, singleCancellations, scopedConfirmations),
    [yYear, yMonth, users, singleCancellations, scopedConfirmations],
  );
  const todayRow = counts.find((c) => c.date === today) ?? counts[0];
  const todayIdx = counts.findIndex((c) => c.date === today);
  const yesterdayRow = todayIdx > 0 ? counts[todayIdx - 1] : null;

  const occupied = users.filter((u) => u.status === "入居中").length;
  const hospital = users.filter((u) => u.status === "入院中").length;
  const overnight = users.filter((u) => u.status === "外泊中").length;
  const homeVisit = users.filter((u) => u.status === "一時帰宅").length;

  // 定員：選択中の施設 / 全施設なら合算
  const capacity = currentFacilityId === null
    ? facilities.reduce((s, f) => s + (f.capacity ?? 0), 0)
    : facilities.find((f) => f.id === currentFacilityId)?.capacity ?? 0;
  const vacancy = capacity - users.filter((u) => u.status !== "退去済").length;

  const facilityName = currentFacilityId === null
    ? "全施設"
    : facilities.find((f) => f.id === currentFacilityId)?.name ?? "未選択";

  const ymToday = today.slice(0, 7);
  const totalBilling = users.reduce((s, u) => {
    const utilItems = utilityBillsToLineItems(utilityBills, u.room, ymToday, u.facilityId).map((it) => ({ ...it, userId: u.id }));
    const mealItems = generateMealLineItems(u, ymToday, mealPrices, singleCancellations);
    return s + computeUserBilling(u.id, ymToday, services, [...lineItems, ...utilItems, ...mealItems]).total;
  }, 0);
  const tasksUrgent = tasks.filter((t) => t.priority === "高" && t.status !== "完了").length;
  const importantHandovers = handovers.filter((h) => h.important).length;
  const lowStockCount = goods.filter((g) => g.stock < g.min).length;
  const billingUnconfirmed = users.length;
  const docsWarn = documents.filter((d) => d.status === "未回収" || d.status === "期限間近" || d.status === "期限切れ").length;

  const [confirmFor, setConfirmFor] = useState<null | "breakfast" | "lunch" | "dinner">(null);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [taskFilter, setTaskFilter] = useState<"urgent" | "today" | "week">("urgent");
  const [taskAddOpen, setTaskAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", userId: "", due: today, priority: "中" as Task["priority"] });
  const [statusForm, setStatusForm] = useState({ to: "入院中", from: today, end: "", reason: "" });

  const mealsUnconfirmed = todayRow
    ? [todayRow.confirmed.breakfast, todayRow.confirmed.lunch, todayRow.confirmed.dinner].filter((c) => !c).length
    : 3;

  const impactEvents = users.filter((u) => ["入院中", "外泊中", "一時帰宅"].includes(u.status));

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "urgent") return t.priority === "高" && t.status !== "完了";
    if (taskFilter === "today") return t.due === today && t.status !== "完了";
    return t.status !== "完了";
  });

  function doConfirm(type: "breakfast" | "lunch" | "dinner") {
    if (currentFacilityId === null) {
      toast("施設を選択してから確定してください", "warn");
      return;
    }
    const key = `${currentFacilityId}_${today}`;
    setConfirmations((cur) => ({ ...cur, [key]: { ...cur[key], [type]: true } }));
    const label = { breakfast: "朝食", lunch: "昼食", dinner: "夕食" }[type];
    logActivity(`本日の${label}発注を確定しました`);
    toast(`本日の${label}発注を確定しました`, "ok");
    setConfirmFor(null);
  }

  function saveTask() {
    if (!newTask.title.trim()) {
      toast("タスク名を入力してください", "warn");
      return;
    }
    const u = allUsers.find((x) => x.id === newTask.userId);
    const id = genId("T");
    const facilityId = u?.facilityId ?? currentFacilityId ?? facilities[0]?.id;
    setTasks((cur) => [
      { id, facilityId, title: newTask.title, category: "その他", userId: newTask.userId || undefined, userName: u?.name, assignee: "田中 太郎", due: newTask.due, priority: newTask.priority, status: "未対応" },
      ...cur,
    ]);
    logActivity(`タスク「${newTask.title}」を追加`);
    toast("タスクを追加しました", "ok");
    setTaskAddOpen(false);
    setNewTask({ title: "", userId: "", due: today, priority: "中" });
  }

  function saveStatus() {
    if (!statusUser) return;
    setUsers((cur) => cur.map((u) =>
      u.id === statusUser.id
        ? { ...u, status: statusForm.to as User["status"], statusFrom: statusForm.from, statusTo: statusForm.end || undefined, statusReason: statusForm.reason }
        : u
    ));
    logActivity(`${statusUser.name} 様 のステータスを ${statusUser.status} → ${statusForm.to} に変更`);
    toast(`${statusUser.name} 様 のステータスを変更しました`, "ok");
    setStatusUser(null);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">ダッシュボード</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">{today.replace(/-/g, "/")} ／ {facilityName}</p>
      </header>

      {users.length === 0 && <SetupGuide />}

      <section className="card divide-x divide-ink-100 flex">
        <ActionItem href={`/meals/${today}`} value={mealsUnconfirmed} unit="区分" label="食事 未確定" tone={mealsUnconfirmed > 0 ? "err" : "neutral"} />
        <ActionItem href="/goods" value={lowStockCount} unit="品目" label="在庫不足" tone={lowStockCount > 0 ? "warn" : "neutral"} />
        <ActionItem href="/billing" value={billingUnconfirmed} unit="件" label="未確定請求" tone={billingUnconfirmed > 0 ? "warn" : "neutral"} />
        <ActionItem href="/inbox/tasks" value={tasksUrgent} unit="件" label="期限間近タスク" tone={tasksUrgent > 0 ? "warn" : "neutral"} />
        <ActionItem href="/handovers" value={importantHandovers} unit="件" label="重要 申し送り" tone={importantHandovers > 0 ? "err" : "neutral"} />
      </section>

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7">
          <SectionHead title="本日の食事発注ステータス" right={<Link href={`/meals/${today}`} className="text-[12px] text-brand-700 hover:underline">日別詳細 →</Link>} />
          <div className="card divide-x divide-ink-100 flex">
            <MealBlock
              label="朝食"
              today={today}
              state={todayRow?.confirmed.breakfast ? "confirmed" : "unconfirmed"}
              primary={`パン ${todayRow?.bread ?? 0}`}
              secondary={`ジュース ${todayRow?.juice ?? 0}`}
              diff={todayRow && yesterdayRow ? todayRow.bread - yesterdayRow.bread : undefined}
              showActions={!todayRow?.confirmed.breakfast && users.length > 0}
              onConfirm={() => setConfirmFor("breakfast")}
            />
            <MealBlock
              label="昼食"
              today={today}
              state={todayRow?.confirmed.lunch ? "confirmed" : "unconfirmed"}
              primary={`A社 ${todayRow?.lunchA ?? 0}`}
              secondary={`B社 ${todayRow?.lunchB ?? 0}`}
              deadline={vendors[0].deadlineTime}
              countdown={timeToDeadline(vendors[0].deadlineTime)}
              diff={todayRow && yesterdayRow ? (todayRow.lunchA + todayRow.lunchB) - (yesterdayRow.lunchA + yesterdayRow.lunchB) : undefined}
              showActions={!todayRow?.confirmed.lunch && users.length > 0}
              onConfirm={() => setConfirmFor("lunch")}
            />
            <MealBlock
              label="夕食"
              today={today}
              state={todayRow?.confirmed.dinner ? "confirmed" : "pending"}
              primary={`A社 ${todayRow?.dinnerA ?? 0}`}
              secondary={`B社 ${todayRow?.dinnerB ?? 0}`}
              deadline="15:00"
              diff={todayRow && yesterdayRow ? (todayRow.dinnerA + todayRow.dinnerB) - (yesterdayRow.dinnerA + yesterdayRow.dinnerB) : undefined}
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
                <li key={t.id} className="px-3 py-2.5 hover:bg-ink-50/60 flex items-center gap-2 text-[13px]">
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

      {impactEvents.length > 0 && (
        <section>
          <SectionHead title="食事・請求に影響する利用者ステータス変化" right={<Link href="/users" className="text-[12px] text-brand-700 hover:underline">利用者一覧 →</Link>} />
          <div className="card">
            <ul className="divide-y divide-ink-100">
              {impactEvents.map((u) => (
                <li key={u.id} className="px-4 py-2.5 flex items-center gap-3 text-[13px] hover:bg-ink-50/60">
                  <Link href={`/users/${u.id}`} className="font-medium text-ink-900 hover:text-brand-700 hover:underline w-28 shrink-0">{u.name}</Link>
                  <span className="num text-[12px] text-ink-500 shrink-0 w-10">{u.room}</span>
                  <StatusBadge s={u.status} />
                  <span className="text-[12px] text-ink-700 shrink-0">
                    {u.statusFrom ?? "—"}{u.statusTo ? `〜${u.statusTo}` : ""}
                  </span>
                  <span className="text-[12px] text-ink-500 flex-1 truncate">{u.statusReason ?? "影響：食事自動停止 ／ 固定費は通常請求"}</span>
                  <button onClick={() => { setStatusUser(u); setStatusForm({ to: u.status, from: u.statusFrom ?? today, end: u.statusTo ?? "", reason: u.statusReason ?? "" }); }} className="btn btn-sm">ステータス変更</button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

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
          <Stat label="未確定請求" value={billingUnconfirmed} unit="件" tone={billingUnconfirmed > 0 ? "warn" : "neutral"} href="/billing" />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <SectionHead title={`在庫アラート（${lowStockCount}）`} right={<Link href="/goods" className="text-[12px] text-brand-700 hover:underline">発注候補 →</Link>} />
          <div className="card">
            <ul className="divide-y divide-ink-100 text-[12px]">
              {lowStockCount === 0 && <li className="px-3 py-3 text-center text-ink-500">在庫不足はありません</li>}
              {goods.filter((g) => g.stock < g.min).slice(0, 4).map((g) => (
                <li key={g.id} className="px-3 py-2 flex items-center justify-between">
                  <span>{g.name}</span>
                  <span className="text-ink-500 num">残 {g.stock} / 最低 {g.min}</span>
                  <span className={"font-semibold text-[11px] " + (g.stock < g.min * 0.5 ? "text-err-700" : "text-warn-700")}>
                    {g.stock < g.min * 0.5 ? "切迫" : "要発注"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SectionHead title="申し送り（直近）" right={<Link href="/handovers" className="text-[12px] text-brand-700 hover:underline">一覧 →</Link>} />
          <div className="card">
            <ul className="divide-y divide-ink-100 text-[12px]">
              {handovers.length === 0 && <li className="px-3 py-3 text-center text-ink-500">申し送りはありません</li>}
              {handovers.slice(0, 4).map((h) => (
                <li key={h.id} className="px-3 py-2 flex gap-2">
                  <span className="text-ink-500 num shrink-0">{h.at.slice(11)}</span>
                  <span className="text-ink-600 shrink-0 w-12">{h.staff}</span>
                  <span className={"flex-1 truncate " + (h.important ? "text-err-700 font-semibold" : "text-ink-800")}>
                    {h.important && "★"}{h.userName ? `${h.userName} ` : ""}{h.content}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SectionHead title="アクティビティ" right={<Link href="/inbox/activity" className="text-[12px] text-brand-700 hover:underline">全件 →</Link>} />
          <div className="card">
            <details>
              <summary className="px-3 py-2.5 cursor-pointer list-none flex items-center justify-between text-[12px]">
                <span className="text-ink-700">過去 {activities.length} 件</span>
                <span className="text-brand-700">▶ 展開</span>
              </summary>
              <ul className="divide-y divide-ink-100 text-[11px] border-t border-ink-100">
                {activities.length === 0 && <li className="px-3 py-3 text-center text-ink-500">記録はありません</li>}
                {activities.slice(0, 10).map((a) => (
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

      {/* ===== モーダル ===== */}
      <Modal
        open={confirmFor !== null}
        onClose={() => setConfirmFor(null)}
        title={`${confirmFor === "breakfast" ? "朝食" : confirmFor === "lunch" ? "昼食" : "夕食"} 発注確定`}
        footer={<ModalFooter onCancel={() => setConfirmFor(null)} onConfirm={() => confirmFor && doConfirm(confirmFor)} confirmLabel="確定する" />}
      >
        <p className="mb-3">{today} の{confirmFor === "breakfast" ? "朝食" : confirmFor === "lunch" ? "昼食" : "夕食"}発注を確定します。</p>
        <ul className="bg-ink-50 rounded p-3 text-[12px] space-y-1">
          <li>確定後はステータス変更があっても自動再計算されません。</li>
          <li>解除は管理者のみ可能で、理由の入力が必要です。</li>
        </ul>
      </Modal>

      <Modal
        open={taskAddOpen}
        onClose={() => setTaskAddOpen(false)}
        title="タスク追加"
        footer={<ModalFooter onCancel={() => setTaskAddOpen(false)} onConfirm={saveTask} confirmLabel="保存" />}
      >
        <div className="space-y-3">
          <Field label="タスク名">
            <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="例：請求書送付" />
          </Field>
          <Field label="対象利用者">
            <Select value={newTask.userId} onChange={(e) => setNewTask({ ...newTask, userId: e.target.value })}>
              <option value="">— なし（施設タスク）—</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}（{u.room}）</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="期限"><Input type="date" value={newTask.due} onChange={(e) => setNewTask({ ...newTask, due: e.target.value })} className="num" /></Field>
            <Field label="優先度">
              <Select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}>
                <option>高</option><option>中</option><option>低</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Drawer
        open={statusUser !== null}
        onClose={() => setStatusUser(null)}
        title={`ステータス変更：${statusUser?.name ?? ""} 様`}
        footer={<ModalFooter onCancel={() => setStatusUser(null)} onConfirm={saveStatus} confirmLabel="変更を実行" />}
      >
        {statusUser && (
          <div className="space-y-4">
            <Field label="現在のステータス"><StatusBadge s={statusUser.status} /></Field>
            <Field label="変更先">
              <Select value={statusForm.to} onChange={(e) => setStatusForm({ ...statusForm, to: e.target.value })}>
                <option>入居中</option><option>入院中</option><option>外泊中</option><option>一時帰宅</option><option>退去済</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="期間 開始"><Input type="date" value={statusForm.from} onChange={(e) => setStatusForm({ ...statusForm, from: e.target.value })} className="num" /></Field>
              <Field label="期間 終了"><Input type="date" value={statusForm.end} onChange={(e) => setStatusForm({ ...statusForm, end: e.target.value })} className="num" /></Field>
            </div>
            <Field label="理由"><Input value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} placeholder="例：骨折・◯◯病院" /></Field>
            <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 text-[12px] text-warn-700">
              <div className="font-semibold mb-1">この変更による影響</div>
              <ul className="list-disc list-inside text-ink-800 space-y-0.5">
                <li>期間中の食事を自動停止（朝・昼・夕）</li>
                <li>固定費は通常通り（日割設定に従う）</li>
              </ul>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-2">
      <h2 className="text-[13px] font-semibold text-ink-700">{title}</h2>
      {right}
    </div>
  );
}

function ActionItem({ href, value, unit, label, tone }: { href: string; value: number; unit: string; label: string; tone: "err" | "warn" | "neutral" }) {
  const numCls = value === 0 ? "text-ink-400" : tone === "err" ? "text-err-700" : tone === "warn" ? "text-warn-700" : "text-ink-900";
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
  label, today, state, primary, secondary, deadline, countdown, diff, showActions, onConfirm,
}: {
  label: string;
  today: string;
  state: "confirmed" | "unconfirmed" | "pending";
  primary: string; secondary: string;
  deadline?: string;
  countdown?: { hours: number; minutes: number; total: number };
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
        {deadline && state !== "confirmed" && <KV k="締切" v={deadline} />}
        {countdown && countdown.total > 0 && state === "unconfirmed" && (
          <KV k="残り" v={<span className={countdown.total < 120 ? "text-err-700 font-semibold" : "text-warn-700 font-semibold"}>{countdown.hours}h {countdown.minutes}m</span>} />
        )}
        {diff !== undefined && diff !== 0 && (
          <KV k="前日比" v={<span className={diff > 0 ? "text-info-700" : "text-err-700"}>{diff > 0 ? `+${diff}` : diff}</span>} />
        )}
      </dl>
      {showActions && (
        <div className="mt-3 flex gap-2">
          <Link href={`/meals/${today}`} className="btn btn-sm flex-1">詳細</Link>
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

function Stat({ label, value, unit, tone, href }: { label: string; value: string | number; unit?: string; tone?: "warn" | "brand" | "neutral"; href?: string }) {
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

function SetupGuide() {
  return (
    <section className="card p-6 bg-gradient-to-br from-brand-50 to-info-50/40 border-brand-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white text-[22px] shrink-0">
          ★
        </div>
        <div className="flex-1">
          <h2 className="text-[18px] font-semibold text-ink-900">B-CareHub を始めましょう</h2>
          <p className="text-[13px] text-ink-700 mt-1">
            まだデータがありません。下の順番でセットアップを進めれば、5 分で運用を始められます。
          </p>

          <ol className="mt-4 space-y-2.5">
            <SetupStep n={1} title="施設情報を入力する" desc="施設名・定員・住所を設定します（ヘッダーや請求書に反映）" href="/settings/masters" cta="マスタへ →" />
            <SetupStep n={2} title="利用者を登録する" desc="氏名・部屋（半角英数字）・キーパーソンなどを登録します" href="/users" cta="利用者を登録 →" />
            <SetupStep n={3} title="食事設定を入力する" desc="利用者ごとに朝・昼・夕の食事業者と形態を設定します" href="/users" cta="利用者一覧へ →" />
            <SetupStep n={4} title="食事を確認・確定する" desc="今日の食事数が自動算出されます。締切までに業者へ発注しましょう" href="/meals" cta="食事カレンダーへ →" />
            <SetupStep n={5} title="日用品・書類を登録する" desc="在庫不足や期限切れを自動でアラート表示します" href="/goods" cta="日用品へ →" />
          </ol>

          <div className="mt-5 text-[12px] text-ink-600 bg-white/70 rounded p-3">
            <div className="font-semibold mb-1">💡 ご利用のヒント</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>すべてのデータは <b>この端末のブラウザ</b> に保存されます。別 PC への移行は「マスタ・データ管理」からバックアップ書出してください。</li>
              <li>左サイドバーのバッジ数字は <b>本当に対応が必要</b> な件数のみ表示されます。</li>
              <li>各画面の操作は <b>取消・削除</b> が可能で、変更履歴は「アクティビティ」「監査ログ」に残ります。</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function SetupStep({ n, title, desc, href, cta }: { n: number; title: string; desc: string; href: string; cta: string }) {
  return (
    <li className="flex items-start gap-3 bg-white/80 rounded p-3">
      <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[14px] shrink-0">{n}</span>
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-ink-900">{title}</div>
        <div className="text-[12px] text-ink-600 mt-0.5">{desc}</div>
      </div>
      <Link href={href} className="btn btn-sm btn-primary shrink-0">{cta}</Link>
    </li>
  );
}
