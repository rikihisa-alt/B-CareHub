import { notFound } from "next/navigation";
import { buildMonthMealCounts } from "@/lib/data";
import { MealDayDetail } from "./MealDayDetail";

export function generateStaticParams() {
  const counts = buildMonthMealCounts(2026, 5);
  return counts.map((c) => ({ date: c.date }));
}

export default function MealDayPage({ params }: { params: { date: string } }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) return notFound();
  const counts = buildMonthMealCounts(2026, 5);
  if (!counts.find((c) => c.date === params.date)) return notFound();
  return <MealDayDetail ymd={params.date} />;
}
