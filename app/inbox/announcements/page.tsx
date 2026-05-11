"use client";
import { useState } from "react";
import { announcements as initial } from "@/lib/data";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

export default function AnnouncementsPage() {
  const [items, setItems] = useState(initial);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);

  function markRead(id: string) {
    setReadIds((s) => new Set(s).add(id));
    toast("既読にしました", "ok");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">お知らせ</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">施設管理者から職員へのアナウンス。</p>
        </div>
        <button onClick={() => setComposeOpen(true)} className="btn btn-primary text-[12px]">＋ お知らせ投稿</button>
      </div>

      <div className="space-y-3">
        {items.map((a) => {
          const isRead = readIds.has(a.id);
          return (
            <article key={a.id} className={"card p-4 " + (isRead ? "opacity-60" : "")}>
              <div className="flex items-start gap-3">
                {a.pinned && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-info-50 text-info-700 border border-info-600/30 font-semibold shrink-0">📌 ピン留め</span>
                )}
                <div className="flex-1">
                  <h2 className="text-[15px] font-semibold text-ink-900">{a.title}</h2>
                  <p className="mt-2 text-[13px] text-ink-700 leading-relaxed whitespace-pre-line">{a.body}</p>
                  <div className="mt-3 text-[11px] text-ink-500">{a.postedBy} ／ <span className="num">{a.postedAt}</span></div>
                </div>
                {!isRead ? (
                  <button onClick={() => markRead(a.id)} className="btn text-[11px] py-0.5">既読</button>
                ) : (
                  <span className="text-[11px] text-ink-500">✓ 既読</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="お知らせを投稿" footer={<><button className="btn text-[12px]" onClick={() => setComposeOpen(false)}>取消</button><button className="btn btn-primary text-[12px]" onClick={() => {
        setItems((cur) => [
          { id: `AN-${Date.now()}`, title: "（新規お知らせ）", body: "本文（モック）", postedBy: "田中 太郎", postedAt: "2026-05-12 10:00", pinned: false },
          ...cur,
        ]);
        toast("お知らせを投稿しました", "ok");
        setComposeOpen(false);
      }}>投稿</button></>}>
        <div className="space-y-3">
          <F label="タイトル"><input className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <F label="本文"><textarea rows={4} className="w-full px-3 py-2 border border-ink-200 rounded" /></F>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" /> 📌 ピン留めにする</label>
        </div>
      </Modal>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] text-ink-600 mb-1">{label}</div>{children}</div>;
}
