"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useHandovers, useAnnouncements, useUsers, logActivity, genId, nowIso } from "@/lib/store";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { FilterChip, Field, Select, Input, ModalFooter } from "@/components/ui/primitives";

export default function HandoversPage() {
  const [handovers, setHandovers] = useHandovers();
  const [announcements, setAnnouncements] = useAnnouncements();
  const [users] = useUsers();
  const [filter, setFilter] = useState<"all" | "important">("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState({ userId: "", content: "", important: false });

  const list = useMemo(() => filter === "important" ? handovers.filter((h) => h.important) : handovers, [handovers, filter]);

  function markAnnouncementRead(id: string) {
    setAnnouncements((cur) => cur.filter((x) => x.id !== id));
    toast("お知らせを既読にしました", "ok");
  }

  function save() {
    if (!draft.content.trim()) {
      toast("内容を入力してください", "warn");
      return;
    }
    const user = users.find((u) => u.id === draft.userId);
    setHandovers((cur) => [
      { id: genId("H"), at: nowIso(), staff: "田中 太郎", userId: draft.userId || undefined, userName: user?.name, content: draft.content, important: draft.important },
      ...cur,
    ]);
    logActivity(`申し送り記載${draft.important ? "（★重要）" : ""}：${draft.content.slice(0, 20)}…`);
    toast("申し送りを記載しました", "ok");
    setComposeOpen(false);
    setDraft({ userId: "", content: "", important: false });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">申し送り</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">利用者ごとの引き継ぎ・看護指示・施設からのお知らせを一覧。</p>
        </div>
        <button onClick={() => setComposeOpen(true)} className="btn btn-primary">＋ 申し送りを記載</button>
      </header>

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
                  <button onClick={() => markAnnouncementRead(a.id)} className="btn btn-sm shrink-0">既読</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">申し送り（タイムライン）</h2>
          <div className="flex gap-1">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>すべて ({handovers.length})</FilterChip>
            <FilterChip active={filter === "important"} onClick={() => setFilter("important")}>★重要のみ ({handovers.filter((h) => h.important).length})</FilterChip>
          </div>
        </div>

        <div className="card">
          {list.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-ink-500">
              {handovers.length === 0 ? "申し送りはまだ記載されていません" : "該当する申し送りはありません"}
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {list.map((h) => {
                const user = users.find((u) => u.id === h.userId);
                return (
                  <li key={h.id} className={"px-4 py-3 hover:bg-ink-50/60 " + (h.important ? "bg-err-50/30" : "")}>
                    <div className="flex items-start gap-3 text-[13px]">
                      <div className="num text-[11px] text-ink-500 shrink-0 w-32">{h.at}</div>
                      <div className="text-[12px] text-ink-700 shrink-0 w-20">{h.staff}</div>
                      {user ? (
                        <Link href={`/users/${user.id}`} className="text-brand-700 hover:underline shrink-0 w-28 truncate">{h.userName} 様</Link>
                      ) : (
                        <span className="text-ink-500 shrink-0 w-28">{h.userName ?? "—"}</span>
                      )}
                      <div className="flex-1">
                        {h.important && <span className="text-err-700 font-semibold mr-1">★ 重要</span>}
                        <span className={h.important ? "text-err-700 font-semibold" : "text-ink-900"}>{h.content}</span>
                      </div>
                      <button onClick={() => { setHandovers((cur) => cur.filter((x) => x.id !== h.id)); toast("削除しました", "ok"); }} className="text-[11px] text-ink-400 hover:text-err-700">削除</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="申し送りを記載"
        footer={<ModalFooter onCancel={() => setComposeOpen(false)} onConfirm={save} confirmLabel="記載" />}
      >
        <div className="space-y-3">
          <Field label="対象利用者（任意）">
            <Select value={draft.userId} onChange={(e) => setDraft({ ...draft, userId: e.target.value })}>
              <option value="">— なし —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="内容">
            <textarea
              rows={4}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              className="w-full px-3 py-2 border border-ink-200 rounded text-[13px]"
            />
          </Field>
          <label className="flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={draft.important} onChange={(e) => setDraft({ ...draft, important: e.target.checked })} />
            ★ 重要としてマーク
          </label>
        </div>
      </Modal>
    </div>
  );
}
