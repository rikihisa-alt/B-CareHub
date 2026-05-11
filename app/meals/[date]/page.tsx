"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MealDayDetail } from "./MealDayDetail";

export default function MealDayPage() {
  const params = useParams();
  const date = (params?.date as string) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <div className="card p-8 text-center text-[13px] text-ink-600">
        日付が不正です。
        <Link href="/meals" className="text-brand-700 hover:underline ml-2">カレンダーへ</Link>
      </div>
    );
  }
  return <MealDayDetail ymd={date} />;
}
