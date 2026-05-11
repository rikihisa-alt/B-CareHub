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
        <h1 className="text-[22px] font-semibold text-ink-900">書類・タスク管理</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">期限切れ・未回収・未完了を一元管理</p>
      </div>

      {/* 書類 */}
      <section>
        <h2 className="text-[14px] font-semibold text-ink-800 mb-2">書類管理</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr className="text-left">
                <th className="px-3 py-2.5 text-[11px] font-semibold">利用者</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">書類名</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">回収状況</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">有効期限</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold w-24 text-center">状態</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={i} className={"border-b border-ink-100 last:border-b-0 " + (d.flag === "warn" ? "bg-warn-50/30" : "")}>
                  <td className="px-3 py-2.5 text-ink-900">{d.user}</td>
                  <td className="px-3 py-2.5 text-ink-900">{d.doc}</td>
                  <td className="px-3 py-2.5 text-[12px]">{d.status}</td>
                  <td className="px-3 py-2.5 num text-[12px]">{d.expires}</td>
                  <td className="px-3 py-2.5 text-center">
                    {d.flag === "warn" ? (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-warn-50 text-warn-700 border-warn-600/30 font-semibold">
                        要対応
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded border bg-ok-50 text-ok-700 border-ok-600/30 font-semibold">
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
        <h2 className="text-[14px] font-semibold text-ink-800 mb-2">タスク</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
              <tr className="text-left">
                <th className="px-3 py-2.5 text-[11px] font-semibold">タスク</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">利用者</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">担当</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">期限</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">優先度</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-3 py-2.5 font-medium text-ink-900">{t.title}</td>
                  <td className="px-3 py-2.5 text-ink-700">{t.user}</td>
                  <td className="px-3 py-2.5 text-ink-700">{t.assignee}</td>
                  <td className="px-3 py-2.5 num">{t.due}</td>
                  <td className="px-3 py-2.5">
                    <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + (
                      t.priority === "高"
                        ? "bg-err-50 text-err-700 border-err-600/30"
                        : "bg-ink-100 text-ink-700 border-ink-200"
                    )}>{t.priority}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[12px]">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
