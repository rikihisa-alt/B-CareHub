"use client";
import { useState } from "react";
import { useAnnouncements, logActivity, genId, nowIso } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Field, Input, ModalFooter } from "@/components/ui/primitives";

export default function AnnouncementsPage() {
  const [items, setItems] = useAnnouncements();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "", pinned: false });

  function markRead(id: string) {
    setReadIds((s) => new Set(s).add(id));
    toast("既読にしました", "ok");
  }

  function post() {
    if (!draft.title.trim() || !draft.body.trim()) {
      toast("タイトルと本文を入力してください", "warn");
      return;
    }
    setItems((cur) => [
      { id: genId("AN"), title: draft.title, body: draft.body, postedBy: "田中 太郎", postedAt: nowIso(), pinned: draft.pinned },
      ...cur,
    ]);
    logActivity(`お知らせ「${draft.title}」を投稿`);
    toast("お知らせを投稿しました", "ok");
    setComposeOpen(false);
    setDraft({ title: "", body: "", pinned: false });
  }

  function remove(id: string) {
    setItems((cur) => cur.filter((x) => x.id !== id));
    toast("削除しました", "ok");
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">お知らせ</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">施設管理者から職員へのアナウンス。</p>
        </div>
        <button onClick={() => setComposeOpen(true)} className="btn btn-primary">＋ お知らせ投稿</button>
      </header>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-[13px] text-ink-500">お知らせはまだ投稿されていません。</div>
      ) : (
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
                  <div className="flex flex-col gap-1 shrink-0">
                    {!isRead ? <button onClick={() => markRead(a.id)} className="btn btn-sm">既読</button> : <span className="text-[11px] text-ink-500 text-center">✓ 既読</span>}
                    <button onClick={() => remove(a.id)} className="text-[11px] text-ink-400 hover:text-err-700">削除</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="お知らせを投稿"
        footer={<ModalFooter onCancel={() => setComposeOpen(false)} onConfirm={post} confirmLabel="投稿" />}
      >
        <div className="space-y-3">
          <Field label="タイトル"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="本文">
            <textarea
              rows={4}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className="w-full px-3 py-2 border border-ink-200 rounded text-[13px]"
            />
          </Field>
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} />
            📌 ピン留めにする
          </label>
        </div>
      </Modal>
    </div>
  );
}
