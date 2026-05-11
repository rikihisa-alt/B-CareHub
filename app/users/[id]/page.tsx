"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUsers } from "@/lib/store";
import { UserDetail } from "./UserDetail";

export default function UserDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const [users, setUsers, hydrated] = useUsers();

  if (!hydrated) {
    return <div className="text-[12px] text-ink-500">読み込み中…</div>;
  }

  const user = users.find((u) => u.id === id);
  if (!user) {
    return (
      <div className="card p-8 text-center text-[13px] text-ink-600">
        利用者が見つかりません。
        <Link href="/users" className="text-brand-700 hover:underline ml-2">利用者一覧へ</Link>
      </div>
    );
  }

  return (
    <UserDetail
      user={user}
      onUpdate={(u) => setUsers((cur) => cur.map((x) => (x.id === u.id ? u : x)))}
      onDelete={() => {
        setUsers((cur) => cur.filter((x) => x.id !== id));
      }}
    />
  );
}
