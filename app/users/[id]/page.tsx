import Link from "next/link";
import { notFound } from "next/navigation";
import { users, totalOf, jpy } from "@/lib/data";

export function generateStaticParams() {
  return users.map((u) => ({ id: u.id }));
}

export default function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = users.find((u) => u.id === params.id);
  if (!user) return notFound();

  const b = user.monthlyBilling;
  const total = totalOf(user);

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500">
              <Link href="/users" className="hover:underline">利用者一覧</Link>
              <span className="mx-1">/</span>
              <span className="text-gray-400">{user.id}</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold">
              {user.name}
              <span className="ml-2 text-base text-gray-500 font-normal">{user.kana}</span>
            </h1>
            <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>部屋 <b className="num">{user.room}</b></span>
              <span>{user.gender}・{user.age}歳（{user.birthday}）</span>
              <span>{user.careLevel}</span>
              <span>入居日 {user.moveInDate}</span>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge s={user.status} />
            <div className="mt-2 text-xs text-gray-500">今月請求予定</div>
            <div className="num text-2xl font-bold text-brand-700">{jpy(total)}</div>
          </div>
        </div>
      </div>

      {/* タブ（簡易版：見出しのみ。アクティブ=基本情報） */}
      <div className="border-b border-gray-200 flex gap-1 text-sm">
        {["基本情報", "食事", "固定費・請求", "日用品", "書類", "タスク", "申し送り", "履歴"].map(
          (t, i) => (
            <span
              key={t}
              className={
                "px-3 py-2 border-b-2 -mb-px " +
                (i === 0
                  ? "border-brand-500 text-brand-700 font-semibold"
                  : "border-transparent text-gray-500")
              }
            >
              {t}
            </span>
          )
        )}
      </div>

      {/* 基本情報 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="基本情報">
          <Row k="氏名">{user.name}（{user.kana}）</Row>
          <Row k="生年月日">{user.birthday}（{user.age}歳）</Row>
          <Row k="性別">{user.gender}</Row>
          <Row k="部屋">{user.room}</Row>
          <Row k="入居日">{user.moveInDate}</Row>
          <Row k="ステータス"><StatusBadge s={user.status} /></Row>
          <Row k="介護度">{user.careLevel}</Row>
        </Card>

        <Card title="キーパーソン">
          <Row k="氏名">{user.keyPerson.name}（{user.keyPerson.relation}）</Row>
          <Row k="電話">{user.keyPerson.phone}</Row>
          <Row k="請求書送付先">本人 / キーパーソン宛</Row>
        </Card>

        <Card title="食事設定">
          <Row k="朝 パン">{user.meal.breakfastBread ? "あり" : "—"}</Row>
          <Row k="朝 ジュース">{user.meal.breakfastJuice ? "あり" : "—"}</Row>
          <Row k="昼">{user.meal.lunchVendor === "なし" ? "—" : `${user.meal.lunchVendor}（${user.meal.form}）`}</Row>
          <Row k="夕">{user.meal.dinnerVendor === "なし" ? "—" : `${user.meal.dinnerVendor}（${user.meal.form}）`}</Row>
        </Card>
      </section>

      {/* 当月請求明細 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">2026年5月 請求予定明細</h2>
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr className="text-left">
                <th className="px-3 py-2 text-xs font-semibold w-32">区分</th>
                <th className="px-3 py-2 text-xs font-semibold">項目</th>
                <th className="px-3 py-2 text-xs font-semibold text-right w-32">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <BillingRow cat="固定費" name="家賃" amount={b.rent} />
              <BillingRow cat="固定費" name="共益費" amount={b.common} />
              <BillingRow cat="固定費" name="水道光熱費" amount={b.utility} />
              <BillingRow cat="固定費" name="管理費" amount={b.admin} />
              <BillingRow cat="変動費" name="食費（朝・昼・夕の合計）" amount={b.meal} />
              <BillingRow cat="変動費" name="日用品費" amount={b.goods} />
              <BillingRow cat="介護" name="介護保険自己負担額" amount={b.care} />
              {b.nursing > 0 && (
                <BillingRow cat="看護" name="訪問看護自己負担額" amount={b.nursing} />
              )}
              {b.advance > 0 && <BillingRow cat="立替" name="立替金（理美容ほか）" amount={b.advance} />}
              {b.other > 0 && <BillingRow cat="その他" name="その他費用" amount={b.other} />}
              <tr className="bg-brand-50">
                <td className="px-3 py-2.5 text-sm font-semibold" colSpan={2}>請求合計</td>
                <td className="px-3 py-2.5 text-right num text-base font-bold text-brand-700">
                  {jpy(total)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
            <span>ステータス：<span className="text-amber-700 font-semibold">未確定</span></span>
            <span className="flex gap-3">
              <button className="text-brand-600 hover:underline">編集</button>
              <button className="text-brand-600 hover:underline">確定</button>
              <button className="text-brand-600 hover:underline">CSV</button>
              <span className="text-gray-300">PDF (Phase 2)</span>
            </span>
          </div>
        </div>
      </section>

      {user.note && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">備考・申し送り</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
            {user.note}
          </div>
        </section>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md">
      <div className="px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-600">{title}</div>
      <dl className="divide-y divide-gray-100">{children}</dl>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 grid grid-cols-3 gap-2 text-sm">
      <dt className="text-gray-500 text-xs">{k}</dt>
      <dd className="col-span-2 text-gray-900">{children}</dd>
    </div>
  );
}

function BillingRow({ cat, name, amount }: { cat: string; name: string; amount: number }) {
  return (
    <tr>
      <td className="px-3 py-2 text-[11px] text-gray-500">{cat}</td>
      <td className="px-3 py-2">{name}</td>
      <td className="px-3 py-2 text-right num">{jpy(amount)}</td>
    </tr>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    入居中: "bg-emerald-50 text-emerald-700 border-emerald-200",
    入院中: "bg-rose-50 text-rose-700 border-rose-200",
    外泊中: "bg-amber-50 text-amber-700 border-amber-200",
    一時帰宅: "bg-amber-50 text-amber-700 border-amber-200",
    退去済: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={"text-xs px-2.5 py-1 rounded border " + (map[s] ?? "")}>{s}</span>
  );
}
