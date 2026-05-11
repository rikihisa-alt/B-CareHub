import Link from "next/link";
import { notFound } from "next/navigation";
import { users, totalOf, jpy } from "@/lib/data";

export function generateStaticParams() {
  return users.map((u) => ({ id: u.id }));
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const user = users.find((u) => u.id === params.id);
  if (!user) return notFound();

  const b = user.monthlyBilling;
  const total = totalOf(user);
  const hasAllergyOrRestriction = user.allergies.length > 0 || user.restrictions.length > 0;

  return (
    <div className="space-y-5">
      {/* パンくず */}
      <div className="text-[12px] text-ink-500">
        <Link href="/users" className="hover:underline">利用者一覧</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-400">{user.id}</span>
      </div>

      {/* 利用者ヘッダーカード */}
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
            <StatusBadge s={user.status} />
            <div className="mt-3 text-[11px] text-ink-500">今月請求予定</div>
            <div className="num text-[24px] font-bold text-brand-700 leading-tight">{jpy(total)}</div>
          </div>
        </div>

        {/* アクション */}
        <div className="mt-4 pt-4 border-t border-ink-100 flex gap-2 text-[12px]">
          <button className="btn btn-primary">ステータス変更</button>
          <button className="btn">食事設定</button>
          <button className="btn">請求明細</button>
          <button className="btn">タスク追加</button>
          <button className="btn">申し送り記載</button>
        </div>
      </div>

      {/* ★ アレルギー・禁忌バナー（最重要・常時表示） */}
      {hasAllergyOrRestriction && (
        <div className="bg-err-50 border-l-4 border-err-600 rounded-r-md">
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-err-700 font-bold text-[14px] shrink-0">🚨 アレルギー・禁忌</span>
              <div className="flex-1 space-y-1.5 text-[13px]">
                {user.allergies.map((a, i) => (
                  <div key={i} className="text-err-700">
                    <b>{a.name}</b>（{a.type}）：{a.severity}
                  </div>
                ))}
                {user.restrictions.map((r, i) => (
                  <div key={i} className="text-err-700">
                    <b>{r.type}</b>：{r.detail}
                  </div>
                ))}
              </div>
              <button className="btn text-[11px] py-0.5">編集（要確認）</button>
            </div>
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="border-b border-ink-200 flex gap-1 text-[13px]">
        {["基本情報", "食事契約・形態", "アレルギー・禁忌", "固定費・請求", "日用品", "書類", "タスク", "申し送り", "変更履歴"].map(
          (t, i) => (
            <span
              key={t}
              className={
                "px-3 py-2 border-b-2 -mb-px " +
                (i === 0
                  ? "border-brand-600 text-brand-700 font-semibold"
                  : "border-transparent text-ink-500")
              }
            >
              {t}
              {t === "アレルギー・禁忌" && hasAllergyOrRestriction && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-err-600 align-middle" />
              )}
            </span>
          )
        )}
      </div>

      {/* 基本情報 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="基本情報">
          <Row k="氏名">{user.name}（{user.kana}）</Row>
          <Row k="生年月日"><span className="num">{user.birthday}</span>（{user.age}歳）</Row>
          <Row k="性別">{user.gender}</Row>
          <Row k="部屋"><span className="num">{user.room}</span></Row>
          <Row k="入居日"><span className="num">{user.moveInDate}</span></Row>
          <Row k="ステータス"><StatusBadge s={user.status} /></Row>
          <Row k="介護度">{user.careLevel}</Row>
        </Card>

        <Card title="キーパーソン・関係機関">
          <Row k="キーパーソン">{user.keyPerson.name}（{user.keyPerson.relation}）</Row>
          <Row k="電話"><span className="num">{user.keyPerson.phone}</span></Row>
          {user.careManager && <Row k="ケアマネ">{user.careManager}</Row>}
          <Row k="請求書送付先">本人 ／ キーパーソン宛</Row>
        </Card>

        <Card title="食事契約・形態">
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
                  毎週{["日", "月", "火", "水", "木", "金", "土"][c.weekday]}曜 {c.mealType === "lunch" ? "昼" : c.mealType === "dinner" ? "夕" : "朝"} — {c.reason}
                </div>
              ))}
            </Row>
          )}
        </Card>
      </section>

      {/* 当月請求明細 */}
      <section>
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-[14px] font-semibold text-ink-800">2026年5月 請求予定明細</h2>
          <div className="flex gap-2">
            <button className="btn text-[12px]">CSV</button>
            <button className="btn text-[12px]">PDF</button>
            <button className="btn btn-primary text-[12px]">請求確定</button>
          </div>
        </div>

        {/* 請求漏れ警告（食費0なのに食事は出ている場合） */}
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

      {user.note && (
        <section>
          <h2 className="text-[14px] font-semibold text-ink-800 mb-2">備考・申し送り</h2>
          <div className="card border-warn-600/30 bg-warn-50 p-3 text-[13px] text-ink-900">
            {user.note}
          </div>
        </section>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
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

function BillingRow({
  cat, name, amount, basis, link,
}: {
  cat: string;
  name: string;
  amount: number;
  basis: string;
  link?: string;
}) {
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

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    入居中: "bg-ok-50 text-ok-700 border-ok-600/30",
    入院中: "bg-err-50 text-err-700 border-err-600/30",
    外泊中: "bg-warn-50 text-warn-700 border-warn-600/30",
    一時帰宅: "bg-warn-50 text-warn-700 border-warn-600/30",
    退去済: "bg-ink-100 text-ink-600 border-ink-200",
  };
  return (
    <span className={"text-[12px] px-2.5 py-1 rounded border font-semibold " + (map[s] ?? "")}>{s}</span>
  );
}
