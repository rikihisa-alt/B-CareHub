const goods = [
  { name: "おむつ Lサイズ", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 24, min: 40, price: 85, monthUsed: 312, billable: true },
  { name: "尿取りパッド 夜用", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 56, min: 60, price: 32, monthUsed: 488, billable: true },
  { name: "リハビリパンツ M", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 80, min: 30, price: 110, monthUsed: 145, billable: true },
  { name: "おしりふき", cat: "排泄ケア", supplier: "ヘルスケア商事", stock: 12, min: 20, price: 180, monthUsed: 56, billable: true },
  { name: "ティッシュ", cat: "共用消耗品", supplier: "イサミ商店", stock: 38, min: 30, price: 220, monthUsed: 22, billable: false },
  { name: "トイレットペーパー", cat: "共用消耗品", supplier: "イサミ商店", stock: 64, min: 36, price: 480, monthUsed: 28, billable: false },
  { name: "口腔ケアスポンジ", cat: "口腔ケア", supplier: "ヘルスケア商事", stock: 200, min: 100, price: 14, monthUsed: 280, billable: true },
  { name: "使い捨て手袋 M", cat: "感染対策", supplier: "イサミ商店", stock: 4, min: 10, price: 980, monthUsed: 18, billable: false },
];

export default function GoodsPage() {
  const lowStock = goods.filter((g) => g.stock < g.min);
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">日用品管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            登録 {goods.length} 品目 ／ 在庫不足 <span className="text-warn-700 font-semibold">{lowStock.length} 品目</span>
          </p>
        </div>
        <div className="flex gap-2 text-[12px] no-print">
          <button className="btn">発注候補表</button>
          <button className="btn btn-primary">＋ 商品登録</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <th className="px-3 py-2.5 text-[11px] font-semibold">商品名</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">カテゴリ</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">発注先</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">単価</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">在庫</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">最低在庫</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-right">今月使用</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-center">利用者請求</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold text-center">状態</th>
            </tr>
          </thead>
          <tbody>
            {goods.map((g, i) => {
              const low = g.stock < g.min;
              return (
                <tr key={i} className={"border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60 " + (low ? "bg-warn-50/30" : "")}>
                  <td className="px-3 py-2.5 font-medium text-ink-900">{g.name}</td>
                  <td className="px-3 py-2.5 text-ink-600 text-[12px]">{g.cat}</td>
                  <td className="px-3 py-2.5 text-ink-700 text-[12px]">{g.supplier}</td>
                  <td className="px-3 py-2.5 text-right num">¥{g.price}</td>
                  <td className={"px-3 py-2.5 text-right num font-bold " + (low ? "text-warn-700" : "text-ink-900")}>
                    {g.stock}
                  </td>
                  <td className="px-3 py-2.5 text-right num text-ink-500">{g.min}</td>
                  <td className="px-3 py-2.5 text-right num text-ink-900">{g.monthUsed}</td>
                  <td className="px-3 py-2.5 text-center text-[12px]">
                    {g.billable
                      ? <span className="text-ok-700 font-semibold">対象</span>
                      : <span className="text-ink-400">共用</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {low ? (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-warn-50 text-warn-700 border-warn-600/30 font-semibold">
                        要発注
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-ok-50 text-ok-700 border-ok-600/30 font-semibold">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
