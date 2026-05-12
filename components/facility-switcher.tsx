"use client";
import Link from "next/link";
import { useFacilities, useCurrentFacilityId } from "@/lib/store";

export function FacilitySwitcher() {
  const [facilities] = useFacilities();
  const [currentId, setCurrentId] = useCurrentFacilityId();

  const currentName = currentId === null
    ? "全施設"
    : facilities.find((f) => f.id === currentId)?.name ?? "未選択";

  return (
    <details className="relative">
      <summary className="list-none flex items-center gap-1.5 cursor-pointer px-2 py-1 hover:bg-ink-50 rounded text-[13px]">
        <span className="text-ink-500 text-[11px]">🏠</span>
        <span className="text-ink-900 font-medium">{currentName}</span>
        <span className="text-ink-400 text-[10px]">▾</span>
      </summary>
      <div className="absolute left-0 top-full mt-1 w-64 card shadow-md text-[13px] z-40">
        <div className="px-3 py-2 text-[10px] font-semibold text-ink-500 uppercase tracking-wider border-b border-ink-100">
          施設を切り替え
        </div>
        <ul className="py-1 max-h-72 overflow-y-auto">
          <li>
            <button
              onClick={() => setCurrentId(null)}
              className={
                "w-full text-left px-3 py-1.5 hover:bg-ink-50 flex items-center justify-between " +
                (currentId === null ? "bg-brand-50 text-brand-700 font-semibold" : "")
              }
            >
              <span>🌐 全施設（横断表示）</span>
              {currentId === null && <span>✓</span>}
            </button>
          </li>
          <li className="border-t border-ink-100" />
          {facilities.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => setCurrentId(f.id)}
                className={
                  "w-full text-left px-3 py-1.5 hover:bg-ink-50 flex items-center justify-between " +
                  (currentId === f.id ? "bg-brand-50 text-brand-700 font-semibold" : "")
                }
              >
                <span className="flex-1 truncate">{f.name}</span>
                {currentId === f.id && <span>✓</span>}
              </button>
            </li>
          ))}
          {facilities.length === 0 && (
            <li className="px-3 py-3 text-[12px] text-ink-500 text-center">施設が登録されていません</li>
          )}
        </ul>
        <div className="border-t border-ink-100">
          <Link href="/settings/masters" className="block px-3 py-1.5 text-[12px] text-brand-700 hover:bg-ink-50">
            ＋ 施設を追加・編集
          </Link>
        </div>
      </div>
    </details>
  );
}
