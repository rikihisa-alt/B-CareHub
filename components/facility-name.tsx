"use client";
import { useFacility } from "@/lib/store";

export function FacilityName({ className = "" }: { className?: string }) {
  const [facility] = useFacility();
  return <span className={className}>{facility.name || "施設名未設定"}</span>;
}
