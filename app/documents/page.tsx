const docs = [
  { user: "佐藤 ヨシ子", doc: "介護保険証", status: "回収済", expires: "2027-03-31", flag: "ok" },
  { user: "鈴木 タケ", doc: "介護保険証", status: "期限間近", expires: "2026-06-15", flag: "warn" },
  { user: "鈴木 タケ", doc: "負担割合証", status: "未回収", expires: "2026-07-31", flag: "warn" },
  { user: "高橋 正一", doc: "重要事項説明書", status: "回収済", expires: "—", flag: "ok" },
  { user: "中村 義雄", doc: "障害福祉サービス受給者証", status: "未回収", expires: "2026-09-30", flag: "warn" },
  { user: "山本 美子", doc: "訪問看護指示書", status: "期限間近", expires: "2026-05-31", flag: "warn" },
];

const tasks = [
  { title: "ケアマネ面談調整", user: "佐藤 ヨシ子", assignee: "田中", due: "2026-05-15", priority: "中", status: "未着手" },
  { title: "病院連絡（入院状況確認）", user: "鈴木 タケ", assignee: "田中", due: "2026-05-12", priority: "高", status: "進行中" },
  { title: "受給者証コピー回収", user: "中村 義雄", assignee: "鈴木", due: "2026-05-20", priority: "中", status: "未着手" },
  { title: "退去精算準備", user: "—", assignee: "田中", due: "2026-05-25", priority: "中", status: "未着手" },
  { title: "5月分 請求書作成", user: "—", assignee: "田中", due: "2026-05-31", priority: "高", status: "未着手" },
];

export default function DocsTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">書類・タスク管理</h1>
        <p className="text-sm text-gray-500 mt-0.5">期限切れ・未回収・未完了を一元管理</p>
      </div>

      {/* 書類 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">書類管理</h2>
        <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr className="text-left">
                <th className="px-3 py-2 text-xs font-semibold">利用者</th>
                <th className="px-3 py-2 text-xs font-semibold">書類名</th>
                <th className="px-3 py-2 text-xs font-semibold">回収状況</th>
                <th className="px-3 py-2 text-xs font-semibold">有効期限</th>
                <th className="px-3 py-2 text-xs font-semibold w-20">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((d, i) => (
                <tr key={i} className={d.flag === "warn" ? "bg-amber-50/40" : ""}>
                  <td className="px-3 py-2">{d.user}</td>
                  <td className="px-3 py-2">{d.doc}</td>
                  <td className="px-3 py-2 text-xs">{d.status}</td>
                  <td className="px-3 py-2 num text-xs">{d.expires}</td>
                  <td className="px-3 py-2 text-center">
                    {d.flag === "warn" ? (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                        要対応
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* タスク */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">タスク</h2>
        <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr className="text-left">
                <th className="px-3 py-2 text-xs font-semibold">タスク</th>
                <th className="px-3 py-2 text-xs font-semibold">利用者</th>
                <th className="px-3 py-2 text-xs font-semibold">担当</th>
                <th className="px-3 py-2 text-xs font-semibold">期限</th>
                <th className="px-3 py-2 text-xs font-semibold">優先度</th>
                <th className="px-3 py-2 text-xs font-semibold">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((t, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-medium">{t.title}</td>
                  <td className="px-3 py-2 text-gray-600">{t.user}</td>
                  <td className="px-3 py-2 text-gray-700">{t.assignee}</td>
                  <td className="px-3 py-2 num">{t.due}</td>
                  <td className="px-3 py-2">
                    <span className={"text-[11px] px-2 py-0.5 rounded border " + (
                      t.priority === "高"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    )}>{t.priority}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
