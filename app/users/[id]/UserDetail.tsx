"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { totalOf, jpy, type User } from "@/lib/data";
import { useTasks, useHandovers, logActivity, genId, todayIso, nowIso } from "@/lib/store";
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

  const b = user.monthlyBilling;
  const total = totalOf(user);
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
    downloadCsv(`${user.name}_2026-05_請求明細.csv`, [
      ["区分", "項目", "金額"],
      ["固定費", "家賃", b.rent],
      ["固定費", "共益費", b.common],
      ["固定費", "水道光熱費", b.utility],
      ["固定費", "管理費", b.admin],
      ["変動費", "食費", b.meal],
      ["変動費", "日用品費", b.goods],
      ["介護", "介護保険自己負担額", b.care],
      ["看護", "訪問看護自己負担額", b.nursing],
      ["立替", "立替金", b.advance],
      ["その他", "その他費用", b.other],
      ["", "合計", total],
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
          user={user} total={total}
          onExportCsv={exportBillingCsv}
          onPdf={() => toast("請求書PDFの出力は Phase 2 で実装予定", "info")}
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

function BillingTab({
  user, total, onExportCsv, onPdf, onConfirm,
}: { user: User; total: number; onExportCsv: () => void; onPdf: () => void; onConfirm: () => void }) {
  const b = user.monthlyBilling;
  return (
    <section>
      <div className="flex items-end justify-between mb-2">
        <h2 className="text-[14px] font-semibold text-ink-800">2026年5月 請求予定明細</h2>
        <div className="flex gap-2">
          <button onClick={onExportCsv} className="btn">CSV</button>
          <button onClick={onPdf} className="btn">PDF</button>
          <button onClick={onConfirm} className="btn btn-primary">請求確定</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold w-24">区分</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold">項目</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-right w-32">金額</th>
            </tr>
          </thead>
          <tbody>
            <BillingRow cat="固定費" name="家賃" amount={b.rent} />
            <BillingRow cat="固定費" name="共益費" amount={b.common} />
            <BillingRow cat="固定費" name="水道光熱費" amount={b.utility} />
            <BillingRow cat="固定費" name="管理費" amount={b.admin} />
            <BillingRow cat="変動費" name="食費" amount={b.meal} />
            <BillingRow cat="変動費" name="日用品費" amount={b.goods} />
            <BillingRow cat="介護" name="介護保険自己負担額" amount={b.care} />
            {b.nursing > 0 && <BillingRow cat="看護" name="訪問看護自己負担額" amount={b.nursing} />}
            {b.advance > 0 && <BillingRow cat="立替" name="立替金" amount={b.advance} />}
            {b.other > 0 && <BillingRow cat="その他" name="その他費用" amount={b.other} />}
            <tr className="bg-brand-50 border-t border-ink-200">
              <td className="px-4 py-3 text-[13px] font-semibold text-ink-900" colSpan={2}>請求合計</td>
              <td className="px-4 py-3 text-right num text-[15px] font-bold text-brand-700">{jpy(total)}</td>
            </tr>
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-ink-100 bg-ink-50/60 text-[12px] text-ink-600">
          固定費・介護料の金額はマスタ・取込から自動入力する設計（Phase 2 で取込実装）。現在は 0 のまま開始されます。
        </div>
      </div>
    </section>
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

function BillingRow({ cat, name, amount }: { cat: string; name: string; amount: number }) {
  return (
    <tr className="border-b border-ink-100 last:border-b-0">
      <td className="px-4 py-2.5 text-[11px] text-ink-500">{cat}</td>
      <td className="px-4 py-2.5 text-ink-900">{name}</td>
      <td className="px-4 py-2.5 text-right num text-ink-900">{amount === 0 ? <span className="text-ink-300">—</span> : jpy(amount)}</td>
    </tr>
  );
}
