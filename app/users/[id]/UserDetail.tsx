"use client";
import Link from "next/link";
import { useState } from "react";
import { totalOf, jpy, type User } from "@/lib/data";
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

type Dialog =
  | { kind: "status" }
  | { kind: "meal" }
  | { kind: "allergy" }
  | { kind: "task" }
  | { kind: "handover" }
  | { kind: "confirmBilling" }
  | null;

export function UserDetail({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>("info");
  const [dialog, setDialog] = useState<Dialog>(null);

  const b = user.monthlyBilling;
  const total = totalOf(user);
  const hasAllergy = user.allergies.length > 0 || user.restrictions.length > 0;
  const close = () => setDialog(null);

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

      {/* ヘッダーカード */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center text-ink-600 font-semibold text-lg shrink-0">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-ink-900 leading-tight">
                {user.name}
                <span className="ml-3 text-[13px] text-ink-500 font-normal">{user.kana}</span>
              </h1>
              <div className="mt-2 text-[13px] text-ink-700 flex flex-wrap gap-x-5 gap-y-1">
                <span>部屋 <b className="num text-ink-900">{user.room}</b></span>
                <span>{user.gender}・{user.age}歳（<span className="num">{user.birthday}</span>）</span>
                <span>{user.careLevel}</span>
                <span>入居日 <span className="num">{user.moveInDate}</span></span>
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
          <button onClick={() => setDialog({ kind: "status" })} className="btn btn-primary">ステータス変更</button>
          <button onClick={() => setDialog({ kind: "meal" })} className="btn">食事設定</button>
          <button onClick={() => setTab("billing")} className="btn">請求明細</button>
          <button onClick={() => setDialog({ kind: "task" })} className="btn">タスク追加</button>
          <button onClick={() => setDialog({ kind: "handover" })} className="btn">申し送り記載</button>
        </div>
      </div>

      {/* アレルギー・禁忌バナー */}
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
            <button onClick={() => setDialog({ kind: "allergy" })} className="btn btn-sm">編集（要確認）</button>
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="border-b border-ink-200 flex gap-1 text-[13px] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "px-3 py-2 border-b-2 -mb-px whitespace-nowrap " +
              (tab === t.id
                ? "border-brand-600 text-brand-700 font-semibold"
                : "border-transparent text-ink-500 hover:text-ink-800")
            }
          >
            {t.label}
            {t.id === "allergy" && hasAllergy && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-err-600 align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {tab === "info" && <BasicInfo user={user} />}
      {tab === "meal" && <MealTab user={user} onEdit={() => setDialog({ kind: "meal" })} />}
      {tab === "allergy" && <AllergyTab user={user} onEdit={() => setDialog({ kind: "allergy" })} hasAllergy={hasAllergy} />}
      {tab === "billing" && (
        <BillingTab
          user={user}
          total={total}
          onExportCsv={exportBillingCsv}
          onPdf={() => toast("請求書PDFの出力は Phase 2 で実装予定", "info")}
          onConfirm={() => setDialog({ kind: "confirmBilling" })}
        />
      )}
      {tab === "goods" && <EmptyTab cta="日用品ページで管理" onClick={() => toast("日用品使用記録の追加は日用品ページから", "info")}>この利用者の日用品使用履歴・請求対象品をここに表示します。</EmptyTab>}
      {tab === "docs" && <EmptyTab cta="書類を追加" onClick={() => toast("書類添付のアップロードは Phase 2 で実装予定", "info")}>利用者ごとの保険証・受給者証・契約書類の一覧と期限を管理します。</EmptyTab>}
      {tab === "tasks" && <EmptyTab cta="＋ タスク追加" onClick={() => setDialog({ kind: "task" })}>この利用者に紐づくタスクを一覧表示します。</EmptyTab>}
      {tab === "handovers" && <EmptyTab cta="＋ 申し送り記載" onClick={() => setDialog({ kind: "handover" })}>この利用者に関する申し送りタイムラインを表示します。</EmptyTab>}
      {tab === "history" && <EmptyTab cta="印刷" onClick={() => window.print()}>基本情報・ステータス・食事設定・請求等のすべての変更履歴を時系列で表示します。</EmptyTab>}

      {user.note && tab === "info" && (
        <section>
          <h2 className="text-[14px] font-semibold text-ink-800 mb-2">備考・申し送り</h2>
          <div className="card border-warn-600/30 bg-warn-50 p-3 text-[13px] text-ink-900">{user.note}</div>
        </section>
      )}

      {/* ==== ダイアログ群（1状態で管理） ==== */}
      <Drawer
        open={dialog?.kind === "status"}
        onClose={close}
        title={`ステータス変更：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={() => { toast(`${user.name} 様 のステータスを変更しました`, "ok"); close(); }} confirmLabel="変更を実行" />}
      >
        <StatusForm user={user} />
      </Drawer>

      <Modal
        open={dialog?.kind === "meal"}
        onClose={close}
        title="食事設定の編集"
        size="lg"
        footer={<ModalFooter onCancel={close} onConfirm={() => { toast("食事設定を保存しました", "ok"); close(); }} />}
      >
        <MealForm user={user} />
      </Modal>

      <Modal
        open={dialog?.kind === "allergy"}
        onClose={close}
        title={`アレルギー・禁忌の編集：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={() => { toast("アレルギー情報を更新しました。食札・配膳・業者発注に反映されます。", "warn"); close(); }} />}
      >
        <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 mb-3 text-[12px]">
          この変更は <b>食札・配膳・業者発注</b> に反映されます。慎重にご確認ください。
        </div>
        <div className="space-y-3">
          <Field label="アレルゲン（カンマ区切り）">
            <Input defaultValue={user.allergies.map((a) => a.name).join("、")} />
          </Field>
          <Field label="禁忌・食事制限">
            <textarea
              rows={3}
              defaultValue={user.restrictions.map((r) => `${r.type}：${r.detail}`).join("\n")}
              className="w-full px-3 py-2 border border-ink-200 rounded text-[13px]"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog?.kind === "task"}
        onClose={close}
        title={`タスク追加：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={() => { toast("タスクを追加しました", "ok"); close(); }} />}
      >
        <div className="space-y-3">
          <Field label="タスク名"><Input /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="期限"><Input type="date" className="num" /></Field>
            <Field label="優先度"><Select><option>高</option><option>中</option><option>低</option></Select></Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={dialog?.kind === "handover"}
        onClose={close}
        title={`申し送り記載：${user.name} 様`}
        footer={<ModalFooter onCancel={close} onConfirm={() => { toast("申し送りを記載しました", "ok"); close(); }} confirmLabel="記載" />}
      >
        <Field label="内容">
          <textarea rows={4} className="w-full px-3 py-2 border border-ink-200 rounded text-[13px]" />
        </Field>
        <label className="flex items-center gap-2 mt-2 text-[12px]"><input type="checkbox" /> ★ 重要としてマーク</label>
      </Modal>

      <Modal
        open={dialog?.kind === "confirmBilling"}
        onClose={close}
        title="請求確定"
        footer={<ModalFooter onCancel={close} onConfirm={() => { toast(`${user.name} 様 5月分の請求を確定しました`, "ok"); close(); }} confirmLabel="確定する" />}
      >
        <p>{user.name} 様 の 2026年5月分の請求（{jpy(total)}）を確定します。</p>
        <ul className="bg-ink-50 rounded p-3 text-[12px] space-y-1 mt-2">
          <li>確定後は自動再計算されません。</li>
          <li>解除は管理者のみ可能で、理由の入力が必要です。</li>
        </ul>
      </Modal>
    </div>
  );
}

/* ====== 子コンポーネント ====== */

function BasicInfo({ user }: { user: User }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DataCard title="基本情報">
        <Row k="氏名">{user.name}（{user.kana}）</Row>
        <Row k="生年月日"><span className="num">{user.birthday}</span>（{user.age}歳）</Row>
        <Row k="性別">{user.gender}</Row>
        <Row k="部屋"><span className="num">{user.room}</span></Row>
        <Row k="入居日"><span className="num">{user.moveInDate}</span></Row>
        <Row k="ステータス"><StatusBadge s={user.status} /></Row>
        <Row k="介護度">{user.careLevel}</Row>
      </DataCard>
      <DataCard title="キーパーソン・関係機関">
        <Row k="キーパーソン">{user.keyPerson.name}（{user.keyPerson.relation}）</Row>
        <Row k="電話"><span className="num">{user.keyPerson.phone}</span></Row>
        {user.careManager && <Row k="ケアマネ">{user.careManager}</Row>}
        <Row k="請求書送付先">本人 ／ キーパーソン宛</Row>
      </DataCard>
      <DataCard title="食事契約・形態">
        <Row k="朝 パン">{user.meal.breakfastBread ? "あり" : "—"}</Row>
        <Row k="朝 ジュース">{user.meal.breakfastJuice ? "あり" : "—"}</Row>
        <Row k="昼">{user.meal.lunchVendor === "なし" ? "—" : user.meal.lunchVendor}</Row>
        <Row k="夕">{user.meal.dinnerVendor === "なし" ? "—" : user.meal.dinnerVendor}</Row>
        <Row k="食事形態"><b className="text-ink-900">{user.meal.form}</b></Row>
        <Row k="飲水形態">{user.meal.fluidForm}</Row>
        {user.meal.regularCancels.length > 0 && (
          <Row k="定期キャンセル">
            {user.meal.regularCancels.map((c, i) => (
              <div key={i} className="text-[12px]">
                毎週{["日","月","火","水","木","金","土"][c.weekday]}曜 {c.mealType === "lunch" ? "昼" : c.mealType === "dinner" ? "夕" : "朝"} — {c.reason}
              </div>
            ))}
          </Row>
        )}
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

function AllergyTab({ user, onEdit, hasAllergy }: { user: User; onEdit: () => void; hasAllergy: boolean }) {
  return (
    <section className="space-y-3">
      {hasAllergy ? (
        <>
          {user.allergies.length > 0 && (
            <DataCard title="アレルギー">
              {user.allergies.map((a, i) => (
                <Row key={i} k={a.type}>{a.name}（{a.severity}）</Row>
              ))}
            </DataCard>
          )}
          {user.restrictions.length > 0 && (
            <DataCard title="禁忌・食事制限">
              {user.restrictions.map((r, i) => (
                <Row key={i} k={r.type}>{r.detail}</Row>
              ))}
            </DataCard>
          )}
        </>
      ) : (
        <div className="card px-4 py-6 text-center text-[13px] text-ink-500">
          アレルギー・禁忌の登録はありません。
        </div>
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
      {b.meal === 0 && user.status === "入居中" && (
        <div className="bg-err-50 border-l-4 border-err-600 rounded-r-md mb-2 px-4 py-2.5 text-[13px]">
          <span className="text-err-700 font-semibold">⚠ 請求漏れ疑い：</span>
          <span className="text-ink-900">食事は提供されていますが、食費が ¥0 です。単価マスタの設定をご確認ください。</span>
          <Link href="/settings/masters" className="ml-2 text-brand-700 hover:underline text-[12px]">マスタへ →</Link>
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold w-24">区分</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold">項目</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-right w-32">金額</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold w-36">算出根拠</th>
            </tr>
          </thead>
          <tbody>
            <BillingRow cat="固定費" name="家賃" amount={b.rent} basis="日割りなし（満額）" />
            <BillingRow cat="固定費" name="共益費" amount={b.common} basis="日割りなし" />
            <BillingRow cat="固定費" name="水道光熱費" amount={b.utility} basis="日割りなし" />
            <BillingRow cat="固定費" name="管理費" amount={b.admin} basis="日割りなし" />
            <BillingRow cat="変動費" name="食費（朝・昼・夕の合計）" amount={b.meal} basis="食事カレンダー >" link="/meals" />
            <BillingRow cat="変動費" name="日用品費" amount={b.goods} basis="使用履歴 >" link="/goods" />
            <BillingRow cat="介護" name="介護保険自己負担額" amount={b.care} basis="CSV取込 (5/1)" />
            {b.nursing > 0 && <BillingRow cat="看護" name="訪問看護自己負担額" amount={b.nursing} basis="CSV取込 (5/1)" />}
            {b.advance > 0 && <BillingRow cat="立替" name="立替金（理美容ほか）" amount={b.advance} basis="立替金詳細 >" />}
            {b.other > 0 && <BillingRow cat="その他" name="その他費用" amount={b.other} basis="—" />}
            <tr className="bg-brand-50 border-t border-ink-200">
              <td className="px-4 py-3 text-[13px] font-semibold text-ink-900" colSpan={2}>請求合計</td>
              <td className="px-4 py-3 text-right num text-[15px] font-bold text-brand-700">{jpy(total)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-ink-100 bg-ink-50/60 text-[12px] text-ink-600">
          ステータス：<span className="text-warn-700 font-semibold">未確定</span>　／　確定後は自動再計算されません。
        </div>
      </div>
    </section>
  );
}

function StatusForm({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <Field label="現在のステータス"><StatusBadge s={user.status} /></Field>
      <Field label="変更先">
        <Select defaultValue={user.status}>
          <option>入居中</option><option>入院中</option><option>外泊中</option><option>一時帰宅</option><option>退去済</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="期間 開始"><Input type="date" defaultValue="2026-05-12" className="num" /></Field>
        <Field label="期間 終了"><Input type="date" className="num" /></Field>
      </div>
      <Field label="理由"><Input placeholder="例：肺炎・◯◯病院" /></Field>
      <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 text-[12px] text-warn-700">
        <div className="font-semibold mb-1">この変更による影響</div>
        <ul className="list-disc list-inside text-ink-800 space-y-0.5">
          <li>期間中の食事を自動停止</li>
          <li>固定費は通常通り（日割設定に従う）</li>
        </ul>
      </div>
    </div>
  );
}

function MealForm({ user }: { user: User }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="朝 パン"><Select defaultValue={user.meal.breakfastBread ? "1" : "0"}><option value="1">あり</option><option value="0">なし</option></Select></Field>
      <Field label="朝 ジュース"><Select defaultValue={user.meal.breakfastJuice ? "1" : "0"}><option value="1">あり</option><option value="0">なし</option></Select></Field>
      <Field label="昼 業者"><Select defaultValue={user.meal.lunchVendor}><option>なし</option><option>A社</option><option>B社</option></Select></Field>
      <Field label="夕 業者"><Select defaultValue={user.meal.dinnerVendor}><option>なし</option><option>A社</option><option>B社</option></Select></Field>
      <Field label="食事形態"><Select defaultValue={user.meal.form}>{FORMS.map((f) => <option key={f}>{f}</option>)}</Select></Field>
      <Field label="飲水形態"><Select defaultValue={user.meal.fluidForm}>{FLUIDS.map((f) => <option key={f}>{f}</option>)}</Select></Field>
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

function BillingRow({ cat, name, amount, basis, link }: { cat: string; name: string; amount: number; basis: string; link?: string }) {
  return (
    <tr className="border-b border-ink-100 last:border-b-0">
      <td className="px-4 py-2.5 text-[11px] text-ink-500">{cat}</td>
      <td className="px-4 py-2.5 text-ink-900">{name}</td>
      <td className="px-4 py-2.5 text-right num text-ink-900">{jpy(amount)}</td>
      <td className="px-4 py-2.5 text-[11px] text-ink-500">
        {link ? <Link href={link} className="text-brand-700 hover:underline">{basis}</Link> : basis}
      </td>
    </tr>
  );
}
