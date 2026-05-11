import Link from "next/link";
import { handovers, announcements, users } from "@/lib/data";

export default function HandoversPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">申し送り</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            利用者ごとの引き継ぎ・看護指示・施設からのお知らせを一覧。
          </p>
        </div>
        <button className="btn btn-primary text-[12px]">＋ 申し送りを記載</button>
      </div>

      {/* ピン留めお知らせ */}
      {announcements.filter((a) => a.pinned).length > 0 && (
        <section>
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider mb-2">📌 お知らせ</h2>
          <div className="space-y-2">
            {announcements.filter((a) => a.pinned).map((a) => (
              <div key={a.id} className="card px-4 py-3 border-l-[3px] border-info-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-ink-900">{a.title}</div>
                    <p className="text-[12px] text-ink-700 mt-1 leading-relaxed">{a.body}</p>
                    <div className="text-[10px] text-ink-500 mt-1.5 num">
                      {a.postedBy} ／ {a.postedAt}
                    </div>
                  </div>
                  <button className="btn text-[11px] py-0.5 shrink-0">既読</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 申し送り（タイムライン） */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">申し送り（タイムライン）</h2>
          <div className="flex gap-1 text-[11px]">
            <FilterChip active>すべて</FilterChip>
            <FilterChip>★重要のみ</FilterChip>
            <FilterChip>利用者別</FilterChip>
          </div>
        </div>

        <div className="card">
          <ul className="divide-y divide-ink-100">
            {handovers.map((h) => {
              const user = users.find((u) => u.name === h.userName);
              return (
                <li key={h.id} className={"px-4 py-3 hover:bg-ink-50/60 " + (h.important ? "bg-err-50/30" : "")}>
                  <div className="flex items-start gap-3 text-[13px]">
                    <div className="num text-[11px] text-ink-500 shrink-0 w-32">{h.at}</div>
                    <div className="text-[12px] text-ink-700 shrink-0 w-20">{h.staff}</div>
                    {user ? (
                      <Link href={`/users/${user.id}`} className="text-brand-700 hover:underline shrink-0 w-28 truncate">
                        {h.userName} 様
                      </Link>
                    ) : (
                      <span className="text-ink-500 shrink-0 w-28">{h.userName ?? "—"}</span>
                    )}
                    <div className="flex-1">
                      {h.important && <span className="text-err-700 font-semibold mr-1">★ 重要</span>}
                      <span className={h.important ? "text-err-700 font-semibold" : "text-ink-900"}>
                        {h.content}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

function FilterChip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={
        "px-2.5 py-1 rounded border " +
        (active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")
      }
    >
      {children}
    </button>
  );
}
