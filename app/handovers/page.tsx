"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { handovers as initialHandovers, announcements as initialAnnouncements, users } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

type Filter = "all" | "important" | "byUser";

export default function HandoversPage() {
  const [handovers, setHandovers] = useState(initialHandovers);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [filter, setFilter] = useState<Filter>("all");
  const [composeOpen, setComposeOpen] = useState(false);

  const list = useMemo(() => {
    if (filter === "important") return handovers.filter((h) => h.important);
    return handovers;
  }, [handovers, filter]);

  function markAnnouncementRead(id: string) {
    setAnnouncements((a) => a.filter((x) => x.id !== id));
    toast("お知らせを既読にしました", "ok");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">申し送り</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">利用者ごとの引き継ぎ・看護指示・施設からのお知らせを一覧。</p>
        </div>
        <button onClick={() => setComposeOpen(true)} className="btn btn-primary text-[12px]">＋ 申し送りを記載</button>
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
                    <div className="text-[10px] text-ink-500 mt-1.5 num">{a.postedBy} ／ {a.postedAt}</div>
                  </div>
                  <button onClick={() => markAnnouncementRead(a.id)} className="btn text-[11px] py-0.5 shrink-0">既読</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">申し送り（タイムライン）</h2>
          <div className="flex gap-1 text-[11px]">
            <FChip active={filter === "all"} onClick={() => setFilter("all")}>すべて ({handovers.length})</FChip>
            <FChip active={filter === "important"} onClick={() => setFilter("important")}>★重要のみ ({handovers.filter((h) => h.important).length})</FChip>
          </div>
        </div>

        <div className="card">
          <ul className="divide-y divide-ink-100">
            {list.map((h) => {
              const user = users.find((u) => u.name === h.userName);
              return (
                <li key={h.id} className={"px-4 py-3 hover:bg-ink-50/60 cursor-pointer " + (h.important ? "bg-err-50/30" : "")} onClick={() => toast(`${h.staff}：${h.content}`, h.important ? "err" : "info")}>
                  <div className="flex items-start gap-3 text-[13px]">
                    <div className="num text-[11px] text-ink-500 shrink-0 w-32">{h.at}</div>
                    <div className="text-[12px] text-ink-700 shrink-0 w-20">{h.staff}</div>
                    {user ? (
                      <Link href={`/users/${user.id}`} onClick={(e) => e.stopPropagation()} className="text-brand-700 hover:underline shrink-0 w-28 truncate">{h.userName} 様</Link>
                    ) : (
                      <span className="text-ink-500 shrink-0 w-28">{h.userName ?? "—"}</span>
                    )}
                    <div className="flex-1">
                      {h.important && <span className="text-err-700 font-semibold mr-1">★ 重要</span>}
                      <span className={h.important ? "text-err-700 font-semibold" : "text-ink-900"}>{h.content}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="申し送りを記載" footer={<><button className="btn text-[12px]" onClick={() => setComposeOpen(false)}>取消</button><button className="btn btn-primary text-[12px]" onClick={() => {
        const newHO = { id: `H-${Date.now()}`, at: "2026-05-12 10:00", staff: "田中", userName: undefined, content: "（新規記載）", important: false };
        setHandovers((h) => [newHO, ...h]);
        toast("申し送りを記載しました", "ok");
        setComposeOpen(false);
      }}>記載</button></>}>
        <div className="space-y-3">
          <F label="対象利用者（任意）">
            <select className="w-full px-3 py-2 border border-ink-200 rounded">
              <option value="">— なし —</option>
              {users.map((u) => <option key={u.id}>{u.name}</option>)}
            </select>
          </F>
          <F label="内容"><textarea rows={4} className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" /> ★ 重要としてマーク</label>
        </div>
      </Modal>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-ink-600 mb-1">{label}</div>{children}</div>;
}

function FChip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={"px-2.5 py-1 rounded border " + (active ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-700 border-ink-200 hover:bg-ink-50")}>
      {children}
    </button>
  );
}
