"use client";
import { useFacilities, useCurrentFacilityId } from "@/lib/store";

export function FacilityName({ className = "" }: { className?: string }) {
  const [facilities] = useFacilities();
  const [currentId] = useCurrentFacilityId();

  const name = currentId === null
    ? "全施設"
    : facilities.find((f) => f.id === currentId)?.name ?? "施設未選択";

  return <span className={className}>{name}</span>;
}

/** facilityId から施設名を返す（横断表示時に行ごとに使う） */
export function FacilityLabel({ facilityId, className = "" }: { facilityId?: string; className?: string }) {
  const [facilities] = useFacilities();
  if (!facilityId) return null;
  const f = facilities.find((x) => x.id === facilityId);
  if (!f) return null;
  return (
    <span className={"text-[10px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-700 border border-ink-200 " + className}>
      🏠 {f.name}
    </span>
  );
}
