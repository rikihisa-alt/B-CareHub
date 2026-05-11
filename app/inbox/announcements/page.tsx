import { announcements } from "@/lib/data";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">お知らせ</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            施設管理者から職員へのアナウンス。
          </p>
        </div>
        <button className="btn btn-primary text-[12px]">＋ お知らせ投稿</button>
      </div>

      <div className="space-y-3">
        {announcements.map((a) => (
          <article key={a.id} className="card p-4">
            <div className="flex items-start gap-3">
              {a.pinned && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-info-50 text-info-700 border border-info-600/30 font-semibold shrink-0">
                  📌 ピン留め
                </span>
              )}
              <div className="flex-1">
                <h2 className="text-[15px] font-semibold text-ink-900">{a.title}</h2>
                <p className="mt-2 text-[13px] text-ink-700 leading-relaxed whitespace-pre-line">{a.body}</p>
                <div className="mt-3 text-[11px] text-ink-500">
                  {a.postedBy} ／ <span className="num">{a.postedAt}</span>
                </div>
              </div>
              <button className="btn text-[11px] py-0.5">既読</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
