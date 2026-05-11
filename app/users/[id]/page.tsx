import { notFound } from "next/navigation";
import { users } from "@/lib/data";
import { UserDetail } from "./UserDetail";

export function generateStaticParams() {
  return users.map((u) => ({ id: u.id }));
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const user = users.find((u) => u.id === params.id);
  if (!user) return notFound();
  return <UserDetail user={user} />;
}
