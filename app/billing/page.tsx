import Link from "next/link";
import { users, totalOf, jpy } from "@/lib/data";

export default function BillingPage() {
  const sum = (k: keyof typeof users[number]["monthlyBilling"]) =>
    users.reduce((s, u) => s + u.monthlyBilling[k], 0);

  const totalAll = users.reduce((s, u) => s + totalOf(u), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">月次請求管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            2026年5月分 — 利用者 {users.length}名 / 合計 <span className="font-bold text-brand-700">{jpy(totalAll)}</span> / 確定済 0件 / 未確定 {users.length}件
          </p>
        </div>
        <div className="flex gap-2 text-sm no-print">
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            CSV出力
          </button>
          <button className="px-3 py-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50">
            印刷
          </button>
          <button className="px-3 py-1.5 rounded-md bg-brand-500 text-white hover:bg-brand-600">
            一括確定
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <Th className="text-left w-14">部屋</Th>
              <Th className="text-left">氏名</Th>
              <Th>家賃</Th>
              <Th>共益</Th>
              <Th>水光熱</Th>
              <Th>管理</Th>
              <Th>食費</Th>
              <Th>日用品</Th>
              <Th>介護</Th>
              <Th>看護</Th>
              <Th>立替</Th>
              <Th>その他</Th>
              <Th className="text-right">合計</Th>
              <Th className="w-20">ステータス</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const b = u.monthlyBilling;
              const total = totalOf(u);
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 num font-semibold">{u.room}</td>
                  <td className="px-2 py-2">
                    <Link href={`/users/${u.id}`} className="hover:underline text-brand-700">
                      {u.name}
                    </Link>
                  </td>
                  <Td v={b.rent} />
                  <Td v={b.common} />
                  <Td v={b.utility} />
                  <Td v={b.admin} />
                  <Td v={b.meal} />
                  <Td v={b.goods} />
                  <Td v={b.care} />
                  <Td v={b.nursing} />
                  <Td v={b.advance} />
                  <Td v={b.other} />
                  <td className="px-2 py-2 text-right num font-bold text-brand-700">
                    {jpy(total)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className="text-[11px] px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                      未確定
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td className="px-2 py-2.5 text-sm font-semibold" colSpan={2}>合計</td>
              <Tf v={sum("rent")} />
              <Tf v={sum("common")} />
              <Tf v={sum("utility")} />
              <Tf v={sum("admin")} />
              <Tf v={sum("meal")} />
              <Tf v={sum("goods")} />
              <Tf v={sum("care")} />
              <Tf v={sum("nursing")} />
              <Tf v={sum("advance")} />
              <Tf v={sum("other")} />
              <td className="px-2 py-2.5 text-right num text-base font-bold text-brand-700">
                {jpy(totalAll)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        ※ 各行をクリックすると利用者別請求明細を開きます。請求確定後は自動再計算で上書きされません。
      </p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={"px-2 py-2 text-[11px] font-semibold text-right " + (className ?? "")}>{children}</th>;
}
function Td({ v }: { v: number }) {
  if (v === 0) return <td className="px-2 py-2 text-right num text-gray-300">—</td>;
  return <td className="px-2 py-2 text-right num">{v.toLocaleString("ja-JP")}</td>;
}
function Tf({ v }: { v: number }) {
  return <td className="px-2 py-2.5 text-right num font-semibold">{v.toLocaleString("ja-JP")}</td>;
}
