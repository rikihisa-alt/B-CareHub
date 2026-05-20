"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { jpy, type User, type RegularService, type BillingLineItem, type BillingCategory, type TaxRate, computeUserBilling, utilityBillsToLineItems, generateMealLineItems } from "@/lib/data";
import {
  useTasks, useHandovers, useRegularServices, useBillingLineItems, useUtilityBills,
  useFacilities, useCurrentFacilityId, useMealPrices, useSingleCancellations,
  logActivity, genId, todayIso, nowIso,
} from "@/lib/store";
import { Modal, Drawer } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv } from "@/components/ui/helpers";
import { StatusBadge, Field, Input, Select, ModalFooter } from "@/components/ui/primitives";

type Tab = "info" | "meal" | "allergy" | "billing" | "goods" | "docs" | "tasks" | "handovers" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "基本情報" },
  { id: "meal", label: "食事契約・形態" },
  { id: "allergy", label: "アレルギー・禁忌" },
  { id: "billing", label: "固定費・請求" },
  { id: "goods", label: "日用品" },
  { id: "docs", label: "書類" },
  { id: "tasks", label: "タスク" },
  { id: "handovers", label: "申し送り" },
  { id: "history", label: "変更履歴" },
];

const FORMS: User["meal"]["form"][] = ["普通食", "きざみ", "一口大", "軟菜", "ミキサー", "ペースト"];
const FLUIDS: User["meal"]["fluidForm"][] = ["常水", "とろみ薄", "とろみ中", "とろみ濃"];

export function UserDetail({
  user, onUpdate, onDelete,
}: {
  user: User;
  onUpdate: (u: User) => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const [, setTasks] = useTasks();
  const [, setHandovers] = useHandovers();
  const [services, setServices] = useRegularServices();
  const [lineItems, setLineItems] = useBillingLineItems();
  const [utilityBills] = useUtilityBills();
  const [mealPrices] = useMealPrices();
  const [singleCancellations] = useSingleCancellations();
  const [facilities] = useFacilities();
  const [billingYm, setBillingYm] = useState(todayIso().slice(0, 7));
  // 光熱費・食事明細を自動生成して billing 計算に含める
  const utilityItems = utilityBillsToLineItems(utilityBills, user.room, billingYm, user.facilityId)
    .map((it) => ({ ...it, userId: user.id }));
  const mealItems = generateMealLineItems(user, billingYm, mealPrices, singleCancellations);
  const userBilling = computeUserBilling(user.id, billingYm, services, [...lineItems, ...utilityItems, ...mealItems]);
  const facility = facilities.find((f) => f.id === user.facilityId) ?? facilities[0];
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  type Dialog = "status" | "meal" | "allergy" | "task" | "handover" | "billing" | "delete" | null;
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);

  // 各モーダルの内部 state
  const [statusForm, setStatusForm] = useState({
    to: user.status, from: user.statusFrom ?? todayIso(), end: user.statusTo ?? "", reason: user.statusReason ?? "",
  });
  const [mealForm, setMealForm] = useState({ ...user.meal });
  const [allergyForm, setAllergyForm] = useState({
    allergens: user.allergies.map((a) => a.name).join("、"),
    restrictions: user.restrictions.map((r) => `${r.type}：${r.detail}`).join("\n"),
  });
  const [taskForm, setTaskForm] = useState({ title: "", due: todayIso(), priority: "中" as "高" | "中" | "低" });
  const [handoverForm, setHandoverForm] = useState({ content: "", important: false });

  const total = userBilling.total;
  const hasAllergy = user.allergies.length > 0 || user.restrictions.length > 0;

  // ===== 保存処理 =====

  function saveStatus() {
    onUpdate({
      ...user,
      status: statusForm.to as User["status"],
      statusFrom: statusForm.from || undefined,
      statusTo: statusForm.end || undefined,
      statusReason: statusForm.reason || undefined,
    });
    logActivity(`${user.name} 様 のステータスを ${user.status} → ${statusForm.to} に変更`);
    toast("ステータスを変更しました", "ok");
    close();
  }

  function saveMeal() {
    onUpdate({ ...user, meal: { ...mealForm } });
    logActivity(`${user.name} 様 の食事設定を更新`);
    toast("食事設定を保存しました", "ok");
    close();
  }

  function saveAllergy() {
    const allergies = allergyForm.allergens
      .split(/[、,，]/).map((s) => s.trim()).filter(Boolean)
      .map((name) => ({ name, type: "食物" as const, severity: "重度" as const }));
    const restrictions = allergyForm.restrictions
      .split("\n").map((s) => s.trim()).filter(Boolean)
      .map((line) => {
        const [type, detail] = line.includes("：") ? line.split("：") : line.split(":");
        return { type: (type?.trim() || "その他") as never, detail: detail?.trim() || "" };
      });
    onUpdate({ ...user, allergies, restrictions });
    logActivity(`${user.name} 様 のアレルギー・禁忌情報を更新`);
    toast("アレルギー情報を更新しました。食札・配膳・業者発注に反映されます。", "warn");
    close();
  }

  function addTask() {
    if (!taskForm.title.trim()) {
      toast("タスク名を入力してください", "warn");
      return;
    }
    setTasks((cur) => [
      { id: genId("T"), title: taskForm.title, category: "ケア", userId: user.id, userName: user.name, assignee: "田中 太郎", due: taskForm.due, priority: taskForm.priority, status: "未対応" },
      ...cur,
    ]);
    onUpdate({ ...user, openTasks: user.openTasks + 1 });
    logActivity(`${user.name} 様 にタスク「${taskForm.title}」を追加`);
    toast("タスクを追加しました", "ok");
    setTaskForm({ title: "", due: todayIso(), priority: "中" });
    close();
  }

  function addHandover() {
    if (!handoverForm.content.trim()) {
      toast("内容を入力してください", "warn");
      return;
    }
    setHandovers((cur) => [
      { id: genId("H"), at: nowIso(), staff: "田中 太郎", userId: user.id, userName: user.name, content: handoverForm.content, important: handoverForm.important },
      ...cur,
    ]);
    logActivity(`${user.name} 様 に申し送り記載${handoverForm.important ? "（★重要）" : ""}`);
    toast("申し送りを記載しました", "ok");
    setHandoverForm({ content: "", important: false });
    close();
  }

  function confirmBilling() {
    logActivity(`${user.name} 様 5月分の請求を確定`);
    toast("請求を確定しました", "ok");
    close();
  }

  function deleteUser() {
    logActivity(`利用者「${user.name}」を削除`);
    toast("利用者を削除しました", "ok");
    onDelete();
    router.push("/users");
  }

  function exportBillingCsv() {
    const qtySum = userBilling.items.reduce((s, i) => s + i.quantity, 0);
    downloadCsv(`${user.name}_${billingYm}_請求明細.csv`, [
      ["顧客氏名", "日付", "種別名", "数量", "税率", "単価", "金額"],
      ...userBilling.items.map((i) => [
        user.name + " 様",
        i.date ?? billingYm,
        `${i.category} ${i.name}`.trim(),
        i.quantity,
        i.taxRate ? `${Math.round(i.taxRate * 100)}%` : "—",
        i.unitPrice,
        i.amount,
      ]),
      ["", "", `【${user.name} 様 計】`, qtySum, "", "", total],
    ]);
  }

  return (
    <div className="space-y-5">
      <nav className="text-[12px] text-ink-500">
        <Link href="/users" className="hover:underline">利用者一覧</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-400">{user.id}</span>
      </nav>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center text-ink-600 font-semibold text-lg shrink-0">
              {user.name.charAt(0) || "?"}
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-ink-900 leading-tight">
                {user.name}
                <span className="ml-3 text-[13px] text-ink-500 font-normal">{user.kana}</span>
              </h1>
              <div className="mt-2 text-[13px] text-ink-700 flex flex-wrap gap-x-5 gap-y-1">
                {user.room && <span>部屋 <b className="num text-ink-900">{user.room}</b></span>}
                {user.gender && user.age > 0 && <span>{user.gender}・{user.age}歳（<span className="num">{user.birthday}</span>）</span>}
                {user.careLevel && <span>{user.careLevel}</span>}
                {user.moveInDate && <span>入居日 <span className="num">{user.moveInDate}</span></span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge s={user.status} size="md" />
            <div className="mt-3 text-[11px] text-ink-500">今月請求予定</div>
            <div className="num text-[24px] font-bold text-brand-700 leading-tight">{jpy(total)}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-ink-100 flex gap-2">
          <button onClick={() => setDialog("status")} className="btn btn-primary">ステータス変更</button>
          <button onClick={() => { setMealForm({ ...user.meal }); setDialog("meal"); }} className="btn">食事設定</button>
          <button onClick={() => setTab("billing")} className="btn">請求明細</button>
          <button onClick={() => setDialog("task")} className="btn">タスク追加</button>
          <button onClick={() => setDialog("handover")} className="btn">申し送り記載</button>
          <button onClick={() => setDialog("delete")} className="btn ml-auto text-err-700">削除</button>
        </div>
      </div>

      {hasAllergy && (
        <div className="bg-err-50 border-l-4 border-err-600 rounded-r-md px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-err-700 font-bold text-[14px] shrink-0">🚨 アレルギー・禁忌</span>
            <div className="flex-1 space-y-1.5 text-[13px]">
              {user.allergies.map((a, i) => (
                <div key={i} className="text-err-700"><b>{a.name}</b>（{a.type}）：{a.severity}</div>
              ))}
              {user.restrictions.map((r, i) => (
                <div key={i} className="text-err-700"><b>{r.type}</b>：{r.detail}</div>
              ))}
            </div>
            <button onClick={() => { setAllergyForm({
              allergens: user.allergies.map((a) => a.name).join("、"),
              restrictions: user.restrictions.map((r) => `${r.type}：${r.detail}`).join("\n"),
            }); setDialog("allergy"); }} className="btn btn-sm">編集</button>
          </div>
        </div>
      )}

      <div className="border-b border-ink-200 flex gap-1 text-[13px] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "px-3 py-2 border-b-2 -mb-px whitespace-nowrap " +
              (tab === t.id ? "border-brand-600 text-brand-700 font-semibold" : "border-transparent text-ink-500 hover:text-ink-800")
            }
          >
            {t.label}
            {t.id === "allergy" && hasAllergy && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-err-600 align-middle" />}
          </button>
        ))}
      </div>

      {tab === "info" && <BasicInfo user={user} />}
      {tab === "meal" && <MealTab user={user} onEdit={() => { setMealForm({ ...user.meal }); setDialog("meal"); }} />}
      {tab === "allergy" && (
        <AllergyTab user={user} hasAllergy={hasAllergy} onEdit={() => { setAllergyForm({
          allergens: user.allergies.map((a) => a.name).join("、"),
          restrictions: user.restrictions.map((r) => `${r.type}：${r.detail}`).join("\n"),
        }); setDialog("allergy"); }} />
      )}
      {tab === "billing" && (
        <BillingTab
          user={user}
          ym={billingYm}
          setYm={setBillingYm}
          billing={userBilling}
          services={services.filter((s) => s.userId === user.id)}
          lineItems={lineItems.filter((i) => i.userId === user.id && i.ym === billingYm)}
          onAddService={(svc) => {
            setServices((cur) => [...cur, svc]);
            logActivity(`${user.name} 様 に定期サービス「${svc.name}」を追加`);
            toast("定期サービスを追加しました", "ok");
          }}
          onUpdateService={(svc) => {
            setServices((cur) => cur.map((s) => s.id === svc.id ? svc : s));
            toast("定期サービスを更新しました", "ok");
          }}
          onRemoveService={(id) => {
            setServices((cur) => cur.filter((s) => s.id !== id));
            toast("削除しました", "ok");
          }}
          onAddItem={(it) => {
            setLineItems((cur) => [...cur, it]);
            logActivity(`${user.name} 様 ${billingYm} に明細「${it.name}」を追加`);
            toast("明細を追加しました", "ok");
          }}
          onUpdateItem={(it) => {
            setLineItems((cur) => cur.map((x) => x.id === it.id ? it : x));
            toast("明細を更新しました", "ok");
          }}
          onRemoveItem={(id) => {
            setLineItems((cur) => cur.filter((x) => x.id !== id));
            toast("削除しました", "ok");
          }}
          onExportCsv={exportBillingCsv}
          onShowInvoice={() => setInvoiceOpen(true)}
          onConfirm={() => setDialog("billing")}
        />
      )}
      {tab === "goods" && <EmptyTab cta="日用品ページで管理" onClick={() => toast("日用品使用記録の追加は日用品ページから", "info")}>この利用者の日用品使用履歴・請求対象品をここに表示します。</EmptyTab>}
      {tab === "docs" && <EmptyTab cta="書類を追加" onClick={() => toast("書類添付のアップロードは Phase 2 で実装予定", "info")}>利用者ごとの保険証・受給者証・契約書類の一覧と期限を管理します。</EmptyTab>}
      {tab === "tasks" && <EmptyTab cta="＋ タスク追加" onClick={() => setDialog("task")}>この利用者に紐づくタスクを一覧表示します。</EmptyTab>}
      {tab === "handovers" && <EmptyTab cta="＋ 申し送り記載" onClick={() => setDialog("handover")}>この利用者に関する申し送りタイムラインを表示します。</EmptyTab>}
      {tab === "history" && <EmptyTab cta="印刷" onClick={() => window.print()}>基本情報・ステータス・食事設定・請求等のすべての変更履歴を時系列で表示します。</EmptyTab>}

      {/* ===== ダイアログ ===== */}
      <Drawer
        open={dialog === "status"}
        onClose={close}
        title={`ステータス変更：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={saveStatus} confirmLabel="変更を実行" />}
      >
        <div className="space-y-4">
          <Field label="現在のステータス"><StatusBadge s={user.status} /></Field>
          <Field label="変更先">
            <Select value={statusForm.to} onChange={(e) => setStatusForm({ ...statusForm, to: e.target.value as User["status"] })}>
              <option>入居中</option><option>入院中</option><option>外泊中</option><option>一時帰宅</option><option>退去済</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="期間 開始"><Input type="date" value={statusForm.from} onChange={(e) => setStatusForm({ ...statusForm, from: e.target.value })} className="num" /></Field>
            <Field label="期間 終了"><Input type="date" value={statusForm.end} onChange={(e) => setStatusForm({ ...statusForm, end: e.target.value })} className="num" /></Field>
          </div>
          <Field label="理由"><Input value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} placeholder="例：肺炎・◯◯病院" /></Field>
          <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 text-[12px] text-warn-700">
            <div className="font-semibold mb-1">この変更による影響</div>
            <ul className="list-disc list-inside text-ink-800 space-y-0.5">
              <li>期間中の食事を自動停止（朝・昼・夕）</li>
              <li>固定費は通常通り（日割設定に従う）</li>
            </ul>
          </div>
        </div>
      </Drawer>

      <Modal
        open={dialog === "meal"}
        onClose={close}
        title="食事設定の編集"
        size="lg"
        footer={<ModalFooter onCancel={close} onConfirm={saveMeal} />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="朝 パン">
            <Select value={mealForm.breakfastBread ? "1" : "0"} onChange={(e) => setMealForm({ ...mealForm, breakfastBread: e.target.value === "1" })}>
              <option value="1">あり</option><option value="0">なし</option>
            </Select>
          </Field>
          <Field label="朝 ジュース">
            <Select value={mealForm.breakfastJuice ? "1" : "0"} onChange={(e) => setMealForm({ ...mealForm, breakfastJuice: e.target.value === "1" })}>
              <option value="1">あり</option><option value="0">なし</option>
            </Select>
          </Field>
          <Field label="昼 業者">
            <Select value={mealForm.lunchVendor} onChange={(e) => setMealForm({ ...mealForm, lunchVendor: e.target.value as User["meal"]["lunchVendor"] })}>
              <option>なし</option><option>A社</option><option>B社</option>
            </Select>
          </Field>
          <Field label="夕 業者">
            <Select value={mealForm.dinnerVendor} onChange={(e) => setMealForm({ ...mealForm, dinnerVendor: e.target.value as User["meal"]["dinnerVendor"] })}>
              <option>なし</option><option>A社</option><option>B社</option>
            </Select>
          </Field>
          <Field label="食事形態">
            <Select value={mealForm.form} onChange={(e) => setMealForm({ ...mealForm, form: e.target.value as User["meal"]["form"] })}>
              {FORMS.map((f) => <option key={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="飲水形態">
            <Select value={mealForm.fluidForm} onChange={(e) => setMealForm({ ...mealForm, fluidForm: e.target.value as User["meal"]["fluidForm"] })}>
              {FLUIDS.map((f) => <option key={f}>{f}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "allergy"}
        onClose={close}
        title={`アレルギー・禁忌の編集：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={saveAllergy} />}
      >
        <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 mb-3 text-[12px]">
          この変更は <b>食札・配膳・業者発注</b> に反映されます。慎重にご確認ください。
        </div>
        <div className="space-y-3">
          <Field label="アレルゲン（カンマ区切り）">
            <Input value={allergyForm.allergens} onChange={(e) => setAllergyForm({ ...allergyForm, allergens: e.target.value })} placeholder="例：そば、えび" />
          </Field>
          <Field label="禁忌・食事制限（1 行 1 項目、例：嚥下：とろみ中必須）">
            <textarea
              rows={3}
              value={allergyForm.restrictions}
              onChange={(e) => setAllergyForm({ ...allergyForm, restrictions: e.target.value })}
              className="w-full px-3 py-2 border border-ink-200 rounded text-[13px]"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "task"}
        onClose={close}
        title={`タスク追加：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={addTask} />}
      >
        <div className="space-y-3">
          <Field label="タスク名"><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="期限"><Input type="date" value={taskForm.due} onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })} className="num" /></Field>
            <Field label="優先度">
              <Select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as "高" | "中" | "低" })}>
                <option>高</option><option>中</option><option>低</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={dialog === "handover"}
        onClose={close}
        title={`申し送り記載：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={addHandover} confirmLabel="記載" />}
      >
        <Field label="内容">
          <textarea
            rows={4}
            value={handoverForm.content}
            onChange={(e) => setHandoverForm({ ...handoverForm, content: e.target.value })}
            className="w-full px-3 py-2 border border-ink-200 rounded text-[13px]"
          />
        </Field>
        <label className="flex items-center gap-2 mt-2 text-[12px]">
          <input type="checkbox" checked={handoverForm.important} onChange={(e) => setHandoverForm({ ...handoverForm, important: e.target.checked })} />
          ★ 重要としてマーク
        </label>
      </Modal>

      <Modal
        open={dialog === "billing"}
        onClose={close}
        title="請求確定"
        footer={<ModalFooter onCancel={close} onConfirm={confirmBilling} confirmLabel="確定する" />}
      >
        <p>{user.name} 様 の 2026年5月分の請求（{jpy(total)}）を確定します。</p>
        <ul className="bg-ink-50 rounded p-3 text-[12px] space-y-1 mt-2">
          <li>確定後は自動再計算されません。</li>
          <li>解除は管理者のみ可能で、理由の入力が必要です。</li>
        </ul>
      </Modal>

      <Modal
        open={dialog === "delete"}
        onClose={close}
        title="利用者を削除"
        footer={<ModalFooter onCancel={close} onConfirm={deleteUser} confirmLabel="削除する" />}
      >
        <p className="text-[13px]">{user.name} 様 を削除します。この操作は取り消せません。</p>
        <p className="text-[12px] text-ink-500 mt-2">関連する食事キャンセル・タスク・申し送り等のデータは残ります（必要に応じて個別に削除してください）。</p>
      </Modal>

      {/* 請求書プレビュー */}
      <InvoicePreview
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        user={user}
        facility={facility}
        ym={billingYm}
        billing={userBilling}
      />
    </div>
  );
}

function BasicInfo({ user }: { user: User }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DataCard title="基本情報">
        <Row k="氏名">{user.name}（{user.kana}）</Row>
        <Row k="生年月日">{user.birthday ? <><span className="num">{user.birthday}</span>（{user.age}歳）</> : <span className="text-ink-400">未設定</span>}</Row>
        <Row k="性別">{user.gender}</Row>
        <Row k="部屋">{user.room ? <span className="num">{user.room}</span> : <span className="text-ink-400">未設定</span>}</Row>
        <Row k="入居日">{user.moveInDate ? <span className="num">{user.moveInDate}</span> : <span className="text-ink-400">未設定</span>}</Row>
        <Row k="ステータス"><StatusBadge s={user.status} /></Row>
        <Row k="介護度">{user.careLevel}</Row>
      </DataCard>
      <DataCard title="キーパーソン・関係機関">
        <Row k="氏名">{user.keyPerson.name || <span className="text-ink-400">未設定</span>}{user.keyPerson.relation ? `（${user.keyPerson.relation}）` : ""}</Row>
        <Row k="電話">{user.keyPerson.phone ? <span className="num">{user.keyPerson.phone}</span> : <span className="text-ink-400">未設定</span>}</Row>
        <Row k="ケアマネ">{user.careManager ?? <span className="text-ink-400">未設定</span>}</Row>
      </DataCard>
      <DataCard title="食事契約・形態">
        <Row k="朝 パン">{user.meal.breakfastBread ? "あり" : "—"}</Row>
        <Row k="朝 ジュース">{user.meal.breakfastJuice ? "あり" : "—"}</Row>
        <Row k="昼">{user.meal.lunchVendor === "なし" ? "—" : user.meal.lunchVendor}</Row>
        <Row k="夕">{user.meal.dinnerVendor === "なし" ? "—" : user.meal.dinnerVendor}</Row>
        <Row k="食事形態"><b className="text-ink-900">{user.meal.form}</b></Row>
        <Row k="飲水形態">{user.meal.fluidForm}</Row>
      </DataCard>
    </section>
  );
}

function MealTab({ user, onEdit }: { user: User; onEdit: () => void }) {
  return (
    <section className="space-y-4">
      <DataCard title="食事契約・形態">
        <Row k="朝 パン">{user.meal.breakfastBread ? "あり" : "—"}</Row>
        <Row k="朝 ジュース">{user.meal.breakfastJuice ? "あり" : "—"}</Row>
        <Row k="昼">{user.meal.lunchVendor === "なし" ? "—" : user.meal.lunchVendor}</Row>
        <Row k="夕">{user.meal.dinnerVendor === "なし" ? "—" : user.meal.dinnerVendor}</Row>
        <Row k="食事形態">{user.meal.form}</Row>
        <Row k="飲水形態">{user.meal.fluidForm}</Row>
      </DataCard>
      <div className="text-right">
        <button onClick={onEdit} className="btn btn-primary">食事設定を編集</button>
      </div>
    </section>
  );
}

function AllergyTab({ user, hasAllergy, onEdit }: { user: User; hasAllergy: boolean; onEdit: () => void }) {
  return (
    <section className="space-y-3">
      {hasAllergy ? (
        <>
          {user.allergies.length > 0 && (
            <DataCard title="アレルギー">
              {user.allergies.map((a, i) => <Row key={i} k={a.type}>{a.name}（{a.severity}）</Row>)}
            </DataCard>
          )}
          {user.restrictions.length > 0 && (
            <DataCard title="禁忌・食事制限">
              {user.restrictions.map((r, i) => <Row key={i} k={r.type}>{r.detail}</Row>)}
            </DataCard>
          )}
        </>
      ) : (
        <div className="card px-4 py-6 text-center text-[13px] text-ink-500">アレルギー・禁忌の登録はありません。</div>
      )}
      <div className="text-right">
        <button onClick={onEdit} className="btn btn-primary">編集</button>
      </div>
    </section>
  );
}

const BILLING_CATEGORIES: BillingCategory[] = [
  "家賃", "共益費", "水道光熱費", "管理費", "生活支援費",
  "食費", "日用品", "介護", "看護", "立替", "保険外サービス", "その他",
];

function BillingTab({
  user, ym, setYm, billing, services, lineItems,
  onAddService, onUpdateService, onRemoveService,
  onAddItem, onUpdateItem, onRemoveItem,
  onExportCsv, onShowInvoice, onConfirm,
}: {
  user: User;
  ym: string;
  setYm: (ym: string) => void;
  billing: ReturnType<typeof computeUserBilling>;
  services: RegularService[];
  lineItems: BillingLineItem[];
  onAddService: (s: RegularService) => void;
  onUpdateService: (s: RegularService) => void;
  onRemoveService: (id: string) => void;
  onAddItem: (i: BillingLineItem) => void;
  onUpdateItem: (i: BillingLineItem) => void;
  onRemoveItem: (id: string) => void;
  onExportCsv: () => void;
  onShowInvoice: () => void;
  onConfirm: () => void;
}) {
  const [svcOpen, setSvcOpen] = useState<RegularService | "new" | null>(null);
  const [itemOpen, setItemOpen] = useState<BillingLineItem | "new" | null>(null);
  const [svcDraft, setSvcDraft] = useState<Omit<RegularService, "id" | "userId">>({
    name: "", category: "家賃", amount: 0, taxRate: 0, validFrom: todayIso(), active: true,
  });
  const [itemDraft, setItemDraft] = useState<Omit<BillingLineItem, "id" | "userId" | "ym" | "amount">>({
    category: "食費", name: "", date: "", quantity: 1, unitPrice: 0, taxRate: 0.08, source: "manual",
  });

  function openAddService() {
    setSvcDraft({ name: "", category: "家賃", amount: 0, taxRate: 0, validFrom: ym + "-01", active: true });
    setSvcOpen("new");
  }
  function openEditService(s: RegularService) {
    setSvcDraft({ name: s.name, category: s.category, amount: s.amount, taxRate: s.taxRate ?? 0, validFrom: s.validFrom, validTo: s.validTo, active: s.active, note: s.note });
    setSvcOpen(s);
  }
  function saveService() {
    if (!svcDraft.name.trim()) { toast("項目名を入力してください", "warn"); return; }
    if (svcDraft.amount <= 0) { toast("金額は 1 円以上を入力してください", "warn"); return; }
    if (svcOpen === "new") {
      onAddService({
        id: genId("RS"), userId: user.id, facilityId: user.facilityId,
        ...svcDraft,
      });
    } else if (svcOpen) {
      onUpdateService({ ...svcOpen, ...svcDraft });
    }
    setSvcOpen(null);
  }

  function openAddItem() {
    setItemDraft({ category: "食費", name: "", date: ym + "-01", quantity: 1, unitPrice: 0, taxRate: 0.08, source: "manual" });
    setItemOpen("new");
  }
  function openEditItem(it: BillingLineItem) {
    setItemDraft({ category: it.category, name: it.name, date: it.date, quantity: it.quantity, unitPrice: it.unitPrice, taxRate: it.taxRate ?? 0, source: it.source, note: it.note });
    setItemOpen(it);
  }
  function saveItem() {
    if (!itemDraft.name.trim()) { toast("項目名を入力してください", "warn"); return; }
    const amount = itemDraft.quantity * itemDraft.unitPrice;
    if (itemOpen === "new") {
      onAddItem({
        id: genId("BL"), userId: user.id, facilityId: user.facilityId, ym,
        ...itemDraft, amount,
      });
    } else if (itemOpen) {
      onUpdateItem({ ...itemOpen, ...itemDraft, amount });
    }
    setItemOpen(null);
  }

  return (
    <section className="space-y-5">
      {/* 月切替 */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-ink-800">対象月</h2>
          <input type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="px-2 py-1 border border-ink-200 rounded text-[13px] num" />
        </div>
        <div className="flex gap-2">
          <button onClick={onShowInvoice} className="btn btn-sm">請求書プレビュー</button>
          <button onClick={onExportCsv} className="btn btn-sm">CSV</button>
          <button onClick={onConfirm} className="btn btn-sm btn-primary">請求確定</button>
        </div>
      </div>

      {/* 定期サービス */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-ink-700">定期サービス（毎月自動計上）</h3>
          <button onClick={openAddService} className="btn btn-sm">＋ 定期サービスを追加</button>
        </div>
        <div className="card overflow-hidden">
          {services.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-ink-500">
              家賃・共益費・水光熱費・生活支援費など、毎月かかる項目をここに登録すると、毎月自動で請求に計上されます。
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
                <tr className="text-left">
                  <th className="px-4 py-2 text-[11px] font-semibold w-32">区分</th>
                  <th className="px-4 py-2 text-[11px] font-semibold">項目</th>
                  <th className="px-4 py-2 text-[11px] font-semibold text-right w-28">月額</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-44">有効期間</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-20 text-center">状態</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-20 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-4 py-2 text-[12px] text-ink-700">{s.category}</td>
                    <td className="px-4 py-2 text-ink-900">{s.name}</td>
                    <td className="px-4 py-2 text-right num font-semibold">{jpy(s.amount)}</td>
                    <td className="px-4 py-2 num text-[11px] text-ink-600">{s.validFrom}{s.validTo ? `〜${s.validTo}` : "〜"}</td>
                    <td className="px-4 py-2 text-center text-[11px]">
                      {s.active ? <span className="text-ok-700">有効</span> : <span className="text-ink-400">停止</span>}
                    </td>
                    <td className="px-4 py-2 text-center flex gap-1 justify-center">
                      <button onClick={() => openEditService(s)} className="btn btn-sm">編集</button>
                      <button onClick={() => { if (window.confirm(`「${s.name}」を削除します`)) onRemoveService(s.id); }} className="btn btn-sm text-err-700">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 当月の明細 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-ink-700">{ym} の明細（{lineItems.length} 件 ＋ 自動生成）</h3>
          <button onClick={openAddItem} className="btn btn-sm">＋ 明細を追加</button>
        </div>
        <div className="card overflow-hidden">
          {billing.items.filter((i) => i.ym === ym).length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-ink-500">
              食事・日用品の使用、立替金、保険外サービス（理美容・送迎など）は、提供のたびにここへ追加します。<br />
              数量×単価で金額が自動計算されます。
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
                <tr className="text-left">
                  <th className="px-3 py-2 text-[11px] font-semibold w-28">提供日</th>
                  <th className="px-3 py-2 text-[11px] font-semibold w-20">区分</th>
                  <th className="px-3 py-2 text-[11px] font-semibold">種別名</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-right w-14">数量</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-right w-14">税率</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-right w-24">単価</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-right w-24">金額</th>
                  <th className="px-3 py-2 text-[11px] font-semibold w-20 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {billing.items.filter((i) => i.ym === ym).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")).map((it) => {
                  const isAuto = it.source === "meal-auto" || it.source === "regular" || it.id.startsWith("UB-");
                  return (
                    <tr key={it.id} className={"border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60 " + (isAuto ? "bg-ink-50/30" : "")}>
                      <td className="px-3 py-2 num text-[11px] text-ink-700">{it.date ?? "—"}</td>
                      <td className="px-3 py-2 text-[12px] text-ink-700">{it.category}</td>
                      <td className="px-3 py-2 text-ink-900">
                        {it.name}
                        {it.source === "meal-auto" && <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-info-50 text-info-700 border border-info-600/20">食事自動</span>}
                        {it.source === "regular" && <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-info-50 text-info-700 border border-info-600/20">定期</span>}
                        {it.id.startsWith("UB-") && <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-info-50 text-info-700 border border-info-600/20">光熱費</span>}
                      </td>
                      <td className="px-3 py-2 text-right num">{it.quantity}</td>
                      <td className="px-3 py-2 text-right num text-[12px]">{it.taxRate ? `${Math.round(it.taxRate * 100)}%` : "—"}</td>
                      <td className="px-3 py-2 text-right num">{jpy(it.unitPrice)}</td>
                      <td className="px-3 py-2 text-right num font-semibold">{jpy(it.amount)}</td>
                      <td className="px-3 py-2 text-center">
                        {isAuto ? (
                          <span className="text-[10px] text-ink-400">—</span>
                        ) : (
                          <span className="flex gap-1 justify-center">
                            <button onClick={() => openEditItem(it)} className="btn btn-sm">編集</button>
                            <button onClick={() => { if (window.confirm(`「${it.name}」を削除します`)) onRemoveItem(it.id); }} className="btn btn-sm text-err-700">×</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 請求合計内訳 */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-ink-100 bg-ink-50/60 text-[12px] font-semibold text-ink-700">{ym} 請求合計の内訳</div>
        <table className="w-full text-[13px]">
          <tbody>
            <BillingSum label="家賃" v={billing.breakdown.rent} />
            <BillingSum label="共益費" v={billing.breakdown.common} />
            <BillingSum label="水道光熱費" v={billing.breakdown.utility} />
            <BillingSum label="管理費・生活支援費" v={billing.breakdown.admin} />
            <BillingSum label="食費" v={billing.breakdown.meal} />
            <BillingSum label="日用品費" v={billing.breakdown.goods} />
            <BillingSum label="介護自己負担" v={billing.breakdown.care} />
            <BillingSum label="看護自己負担" v={billing.breakdown.nursing} />
            <BillingSum label="立替金" v={billing.breakdown.advance} />
            <BillingSum label="その他・保険外サービス" v={billing.breakdown.other} />
            <tr className="bg-brand-50 border-t border-ink-200">
              <td className="px-4 py-3 text-[13px] font-semibold text-ink-900">請求合計</td>
              <td className="px-4 py-3 text-right num text-[15px] font-bold text-brand-700">{jpy(billing.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 定期サービス編集モーダル */}
      <Modal
        open={svcOpen !== null}
        onClose={() => setSvcOpen(null)}
        title={svcOpen === "new" ? "定期サービスを追加" : "定期サービスを編集"}
        footer={<ModalFooter onCancel={() => setSvcOpen(null)} onConfirm={saveService} />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="区分">
            <Select value={svcDraft.category} onChange={(e) => setSvcDraft({ ...svcDraft, category: e.target.value as BillingCategory })}>
              {BILLING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="月額（税込）"><Input type="number" value={svcDraft.amount} onChange={(e) => setSvcDraft({ ...svcDraft, amount: Number(e.target.value) || 0 })} className="num" /></Field>
          <Field label="項目名" hint="例：家賃／共益費／理美容（月1）">
            <Input value={svcDraft.name} onChange={(e) => setSvcDraft({ ...svcDraft, name: e.target.value })} />
          </Field>
          <Field label="税率">
            <Select value={String(svcDraft.taxRate ?? 0)} onChange={(e) => setSvcDraft({ ...svcDraft, taxRate: Number(e.target.value) as TaxRate })}>
              <option value="0">非課税</option>
              <option value="0.08">軽減 8%</option>
              <option value="0.1">標準 10%</option>
            </Select>
          </Field>
          <Field label="状態">
            <Select value={svcDraft.active ? "1" : "0"} onChange={(e) => setSvcDraft({ ...svcDraft, active: e.target.value === "1" })}>
              <option value="1">有効</option><option value="0">停止</option>
            </Select>
          </Field>
          <div />
          <Field label="開始日"><Input type="date" value={svcDraft.validFrom} onChange={(e) => setSvcDraft({ ...svcDraft, validFrom: e.target.value })} className="num" /></Field>
          <Field label="終了日（任意）"><Input type="date" value={svcDraft.validTo ?? ""} onChange={(e) => setSvcDraft({ ...svcDraft, validTo: e.target.value || undefined })} className="num" /></Field>
        </div>
      </Modal>

      {/* 明細編集モーダル */}
      <Modal
        open={itemOpen !== null}
        onClose={() => setItemOpen(null)}
        title={itemOpen === "new" ? `${ym} に明細を追加` : "明細を編集"}
        footer={<ModalFooter onCancel={() => setItemOpen(null)} onConfirm={saveItem} />}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="区分">
            <Select value={itemDraft.category} onChange={(e) => setItemDraft({ ...itemDraft, category: e.target.value as BillingCategory })}>
              {BILLING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="提供日"><Input type="date" value={itemDraft.date ?? ""} onChange={(e) => setItemDraft({ ...itemDraft, date: e.target.value })} className="num" /></Field>
          <div className="col-span-2">
            <Field label="種別名 / 項目名" hint="例：朝セット／昼セット／夕セット／おむつL／理美容代">
              <Input value={itemDraft.name} onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })} />
            </Field>
          </div>
          <Field label="数量"><Input type="number" value={itemDraft.quantity} onChange={(e) => setItemDraft({ ...itemDraft, quantity: Number(e.target.value) || 0 })} className="num" /></Field>
          <Field label="税率">
            <Select value={String(itemDraft.taxRate ?? 0)} onChange={(e) => setItemDraft({ ...itemDraft, taxRate: Number(e.target.value) as TaxRate })}>
              <option value="0">非課税</option>
              <option value="0.08">軽減 8%（飲食料品）</option>
              <option value="0.1">標準 10%</option>
            </Select>
          </Field>
          <Field label="単価（税込）"><Input type="number" value={itemDraft.unitPrice} onChange={(e) => setItemDraft({ ...itemDraft, unitPrice: Number(e.target.value) || 0 })} className="num" /></Field>
          <div />
        </div>
        <div className="mt-3 text-right text-[13px] text-ink-700">
          金額：<b className="num text-brand-700">{jpy(itemDraft.quantity * itemDraft.unitPrice)}</b>
        </div>
      </Modal>
    </section>
  );
}

function BillingSum({ label, v }: { label: string; v: number }) {
  return (
    <tr className="border-b border-ink-100 last:border-b-0">
      <td className="px-4 py-2 text-[12px] text-ink-700">{label}</td>
      <td className="px-4 py-2 text-right num text-ink-900">{v === 0 ? <span className="text-ink-300">—</span> : jpy(v)}</td>
    </tr>
  );
}

/** 請求書プレビュー（印刷想定、添付PDF風レイアウト） */
function InvoicePreview({
  open, onClose, user, facility, ym, billing,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
  facility: ReturnType<typeof useFacilities>[0][number] | undefined;
  ym: string;
  billing: ReturnType<typeof computeUserBilling>;
}) {
  if (!open) return null;
  const dueDay = facility?.paymentDueDay ?? 15;
  const [y, m] = ym.split("-").map(Number);
  const due = new Date(y, m, dueDay); // 翌月の dueDay
  const dueLabel = `${due.getFullYear()}年${due.getMonth() + 1}月${due.getDate()}日（${"日月火水木金土"[due.getDay()]}）`;

  // 数量合計・税率別小計
  const qtyTotal = billing.items.reduce((s, i) => s + i.quantity, 0);
  const taxGroups: Record<string, number> = {};
  billing.items.forEach((i) => {
    const key = i.taxRate ? `${Math.round(i.taxRate * 100)}%` : "非課税";
    taxGroups[key] = (taxGroups[key] ?? 0) + i.amount;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-w-4xl mx-auto my-6">
        {/* 操作バー（印刷時非表示） */}
        <div className="bg-white rounded-t-lg px-4 py-2 flex justify-between items-center no-print">
          <div className="text-[12px] text-ink-600">請求書プレビュー（A4縦・印刷推奨）</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn btn-sm btn-primary">印刷 / PDF保存</button>
            <button onClick={onClose} className="btn btn-sm">閉じる</button>
          </div>
        </div>

        {/* 請求書本体（印刷時はこの部分のみ） */}
        <div className="bg-white p-8 invoice-paper" id="invoice-paper">
          {/* ヘッダー：支払期日・支払方法 */}
          <table className="w-full border border-ink-700 text-[12px]">
            <tbody>
              <tr>
                <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">お支払期日</td>
                <td className="border border-ink-700 px-3 py-2 num">{dueLabel}</td>
                <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">お支払方法</td>
                <td className="border border-ink-700 px-3 py-2">
                  銀行振込（振込日が休日に重なる場合は休前日にお振込みください）
                </td>
              </tr>
              <tr>
                <td className="border border-ink-700 px-3 py-2 bg-ink-50 font-semibold">お振込先</td>
                <td className="border border-ink-700 px-3 py-2" colSpan={3}>
                  {facility?.bankAccounts && facility.bankAccounts.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-[11px] text-ink-600 mb-1">下記いずれかの口座へお振込みください</div>
                      {facility.bankAccounts.map((acc, i) => (
                        <div key={i} className="num text-[12px]">
                          【{acc.bank}{acc.branch ? ` ${acc.branch}` : ""}】 {acc.type} {acc.number} {acc.holder}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-ink-400">振込先未設定（マスタ・データ管理から設定してください）</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 顧客情報 */}
          <table className="w-full border border-ink-700 text-[12px] mt-3">
            <tbody>
              <tr>
                <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">顧客氏名</td>
                <td className="border border-ink-700 px-3 py-2 text-[14px] font-semibold">{user.name} 様</td>
                <td className="border border-ink-700 px-3 py-2 bg-ink-50 w-32 font-semibold">対象年月</td>
                <td className="border border-ink-700 px-3 py-2 num">{ym.replace("-", "年")}月分</td>
              </tr>
              {facility && (
                <tr>
                  <td className="border border-ink-700 px-3 py-2 bg-ink-50 font-semibold">請求元</td>
                  <td className="border border-ink-700 px-3 py-2" colSpan={3}>
                    {facility.name}
                    {facility.address && <span className="ml-2 text-[11px] text-ink-600">{facility.address}</span>}
                    {facility.phone && <span className="ml-2 text-[11px] text-ink-600 num">TEL {facility.phone}</span>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 備考 */}
          {facility?.invoiceNote && (
            <div className="border border-ink-700 mt-3 px-3 py-2 text-[11px] bg-warn-50/30 whitespace-pre-line">
              <span className="font-semibold">備　考　</span>{facility.invoiceNote}
            </div>
          )}

          {/* 明細表 */}
          <table className="w-full border border-ink-700 text-[11px] mt-3">
            <thead>
              <tr className="bg-ink-50">
                <th className="border border-ink-700 px-2 py-1.5 font-semibold w-28">日　付</th>
                <th className="border border-ink-700 px-2 py-1.5 font-semibold">種別名</th>
                <th className="border border-ink-700 px-2 py-1.5 font-semibold w-14">数量</th>
                <th className="border border-ink-700 px-2 py-1.5 font-semibold w-14">税率</th>
                <th className="border border-ink-700 px-2 py-1.5 font-semibold w-20">単価</th>
                <th className="border border-ink-700 px-2 py-1.5 font-semibold w-24">金額</th>
              </tr>
            </thead>
            <tbody>
              {billing.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="border border-ink-700 px-2 py-6 text-center text-ink-400">明細がありません</td>
                </tr>
              )}
              {billing.items.map((it) => (
                <tr key={it.id}>
                  <td className="border border-ink-700 px-2 py-1 num">{it.date ?? `${ym}-—`}</td>
                  <td className="border border-ink-700 px-2 py-1">
                    {it.category} {it.name}
                  </td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.quantity}</td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.taxRate ? `${Math.round(it.taxRate * 100)}%` : "—"}</td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.unitPrice.toLocaleString()}</td>
                  <td className="border border-ink-700 px-2 py-1 text-right num">{it.amount.toLocaleString()}</td>
                </tr>
              ))}
              {/* 利用者別合計 */}
              <tr className="bg-ink-50 font-semibold">
                <td className="border border-ink-700 px-2 py-1.5"></td>
                <td className="border border-ink-700 px-2 py-1.5">【{user.name} 様　計】</td>
                <td className="border border-ink-700 px-2 py-1.5 text-right num">{qtyTotal}</td>
                <td className="border border-ink-700 px-2 py-1.5"></td>
                <td className="border border-ink-700 px-2 py-1.5"></td>
                <td className="border border-ink-700 px-2 py-1.5 text-right num text-[13px]">{billing.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* 税率別内訳 */}
          {Object.keys(taxGroups).length > 0 && (
            <table className="w-full text-[11px] mt-3">
              <tbody>
                <tr>
                  <td className="text-right py-1 text-ink-600 w-32">税率別内訳：</td>
                  {Object.entries(taxGroups).map(([k, v]) => (
                    <td key={k} className="text-right py-1 num pl-3">{k} 計 {v.toLocaleString()} 円</td>
                  ))}
                  <td className="text-right py-1 pl-3 font-semibold text-[14px]">ご請求合計 ¥{billing.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          )}

          <div className="text-center text-[10px] text-ink-500 mt-6">1 ページ</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-paper, #invoice-paper * { visibility: visible; }
          #invoice-paper { position: absolute; left: 0; top: 0; width: 100%; padding: 12mm 10mm; }
        }
      `}</style>
    </div>
  );
}

function EmptyTab({ children, onClick, cta }: { children: React.ReactNode; onClick: () => void; cta: string }) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="text-[13px] text-ink-600 mb-4">{children}</p>
      <button onClick={onClick} className="btn btn-primary">{cta}</button>
    </div>
  );
}

function DataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="px-4 py-2.5 border-b border-ink-100 text-[12px] font-semibold text-ink-600">{title}</div>
      <dl className="divide-y divide-ink-100">{children}</dl>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-2.5 grid grid-cols-3 gap-2 text-[13px]">
      <dt className="text-ink-500 text-[11px]">{k}</dt>
      <dd className="col-span-2 text-ink-900">{children}</dd>
    </div>
  );
}

