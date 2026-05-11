const logs = [
  { at: "2026-05-11 08:42", staff: "田中 太郎", action: "ログイン", target: "—", before: "—", after: "—", ip: "192.168.1.10" },
  { at: "2026-05-11 08:40", staff: "田中 太郎", action: "発注確定", target: "meal_orders / 2026-05-11 朝食", before: "未確定", after: "確定済（パン18, ジュース12）", ip: "192.168.1.10" },
  { at: "2026-05-11 08:30", staff: "看護 加藤", action: "申し送り追加", target: "handovers / 小林ハル", before: "—", after: "水分量管理徹底（重要）", ip: "192.168.1.22" },
  { at: "2026-05-11 07:50", staff: "山下 健", action: "ログイン", target: "—", before: "—", after: "—", ip: "192.168.1.5" },
  { at: "2026-05-10 17:30", staff: "鈴木 花子", action: "ステータス変更", target: "users / 鈴木タケ", before: "入居中", after: "入院中（5/5〜）", ip: "192.168.1.11" },
  { at: "2026-05-10 17:32", staff: "システム", action: "自動キャンセル", target: "meal_orders / 鈴木タケ 5/5〜", before: "対象", after: "停止（入院連動）", ip: "—" },
  { at: "2026-05-10 14:05", staff: "システム", action: "アラート生成", target: "alerts / 在庫不足", before: "—", after: "おむつ Lサイズ 残24/最低40", ip: "—" },
  { at: "2026-05-10 11:30", staff: "田中 太郎", action: "発注確定", target: "meal_orders / 2026-05-10 昼食 A社", before: "未確定", after: "確定済（14食）", ip: "192.168.1.10" },
  { at: "2026-05-09 18:00", staff: "山下 健", action: "マスタ更新", target: "billing_items / 食費単価", before: "昼食A社 ¥580", after: "昼食A社 ¥600", ip: "192.168.1.5" },
  { at: "2026-05-09 09:12", staff: "鈴木 花子", action: "ステータス変更", target: "users / 加藤一郎", before: "入居中", after: "一時帰宅（5/9〜5/11）", ip: "192.168.1.11" },
  { at: "2026-05-08 17:00", staff: "山下 健", action: "お知らせ投稿", target: "announcements / AN-001", before: "—", after: "B社昼食締切変更", ip: "192.168.1.5" },
  { at: "2026-05-08 10:15", staff: "田中 太郎", action: "請求確定解除", target: "monthly_billings / 佐藤ヨシ子 4月分", before: "確定済", after: "未確定（理由：日用品追加漏れ）", ip: "192.168.1.10" },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">監査ログ</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            すべての更新操作の完全記録（5 年保持）。CSV 出力で行政対応・内部監査に利用できます。
          </p>
        </div>
        <button className="btn text-[12px]">CSV エクスポート</button>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-500">期間：</span>
          <input type="date" defaultValue="2026-05-01" className="px-2 py-1 border border-ink-200 rounded num" />
          <span className="text-ink-500">〜</span>
          <input type="date" defaultValue="2026-05-11" className="px-2 py-1 border border-ink-200 rounded num" />
        </div>
        <select className="px-2 py-1 border border-ink-200 rounded">
          <option>全操作種別</option>
          <option>ログイン</option>
          <option>作成</option>
          <option>更新</option>
          <option>削除</option>
          <option>確定</option>
          <option>確定解除</option>
        </select>
        <select className="px-2 py-1 border border-ink-200 rounded">
          <option>全職員</option>
          <option>田中 太郎</option>
          <option>鈴木 花子</option>
          <option>山下 健</option>
          <option>看護 加藤</option>
          <option>システム自動</option>
        </select>
        <select className="px-2 py-1 border border-ink-200 rounded">
          <option>全テーブル</option>
          <option>users（利用者）</option>
          <option>meal_orders（食事発注）</option>
          <option>meal_cancellations（食事キャンセル）</option>
          <option>monthly_billings（月次請求）</option>
          <option>billing_items（請求項目）</option>
          <option>daily_goods（日用品）</option>
          <option>announcements（お知らせ）</option>
        </select>
        <input
          type="search"
          placeholder="フリーワード（利用者名・操作内容）"
          className="ml-auto px-3 py-1 border border-ink-200 rounded w-64"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="bg-ink-50 border-b border-ink-200 text-ink-600">
            <tr className="text-left">
              <th className="px-3 py-2.5 text-[11px] font-semibold w-36">日時</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold w-28">操作者</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold w-28">操作</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">対象</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">変更前</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold">変更後</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold w-28">IPアドレス</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-2 num text-ink-700">{l.at}</td>
                <td className="px-3 py-2 text-ink-700">{l.staff}</td>
                <td className="px-3 py-2">
                  <ActionPill action={l.action} />
                </td>
                <td className="px-3 py-2 text-ink-800">{l.target}</td>
                <td className="px-3 py-2 text-ink-500">{l.before}</td>
                <td className="px-3 py-2 text-ink-900">{l.after}</td>
                <td className="px-3 py-2 num text-ink-500">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-ink-100 bg-ink-50/40 text-[11px] text-ink-500 flex justify-between">
          <span>{logs.length} 件表示中（全 1,247 件）</span>
          <span className="flex gap-1">
            <button className="btn text-[11px] py-0.5">前へ</button>
            <button className="btn text-[11px] py-0.5">次へ</button>
          </span>
        </div>
      </div>

      <p className="text-[11px] text-ink-500">
        ※ 監査ログは追記専用テーブルで、削除・編集はできません。
      </p>
    </div>
  );
}

function ActionPill({ action }: { action: string }) {
  const map: Record<string, string> = {
    ログイン: "bg-info-50 text-info-700 border-info-600/30",
    作成: "bg-ok-50 text-ok-700 border-ok-600/30",
    更新: "bg-info-50 text-info-700 border-info-600/30",
    削除: "bg-err-50 text-err-700 border-err-600/30",
    発注確定: "bg-ok-50 text-ok-700 border-ok-600/30",
    確定解除: "bg-warn-50 text-warn-700 border-warn-600/30",
    請求確定解除: "bg-warn-50 text-warn-700 border-warn-600/30",
    ステータス変更: "bg-warn-50 text-warn-700 border-warn-600/30",
    マスタ更新: "bg-info-50 text-info-700 border-info-600/30",
    自動キャンセル: "bg-ink-100 text-ink-700 border-ink-200",
    アラート生成: "bg-ink-100 text-ink-700 border-ink-200",
    申し送り追加: "bg-info-50 text-info-700 border-info-600/30",
    お知らせ投稿: "bg-info-50 text-info-700 border-info-600/30",
  };
  return (
    <span className={"text-[11px] px-2 py-0.5 rounded border font-semibold " + (map[action] ?? "bg-ink-100 text-ink-700 border-ink-200")}>
      {action}
    </span>
  );
}
