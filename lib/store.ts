"use client";
import { useEffect, useState } from "react";
import type {
  User, Task, Handover, Announcement, Activity, DailyGood, DocItem, StaffMember,
  MealConfirmation, SingleCancellation, RegularService, BillingLineItem,
} from "./data";

export type BankAccount = {
  bank: string;        // 金融機関名 例：ゆうちょ銀行
  branch?: string;     // 店名／支店
  type?: string;       // 普通／当座／記号番号
  number: string;      // 口座番号 or 記号番号
  holder: string;      // 名義（カタカナ）
};

export type Facility = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  capacity?: number;
  // 請求書用
  paymentDueDay?: number;       // お支払期日（毎月◯日、デフォルト15）
  bankAccounts?: BankAccount[];  // 振込先（複数可）
  invoiceNote?: string;          // 請求書に印字する備考
};

// localStorage キーの prefix
const PREFIX = "bch:v1:";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

/** 任意のキーに対する localStorage 永続化 useState */
export function useStored<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(updater: T | ((prev: T) => T)) {
    setState((cur) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(cur) : updater;
      save(key, next);
      return next;
    });
  }

  return [state, update, hydrated] as const;
}

// ========= 施設（複数） =========

const DEFAULT_FACILITY_ID = "F-001";

export function useFacilities() {
  return useStored<Facility[]>("facilities", [{ id: DEFAULT_FACILITY_ID, name: "施設1", capacity: 16 }]);
}

/** 現在選択中の施設 ID（null = 全施設） */
export function useCurrentFacilityId() {
  return useStored<string | null>("currentFacilityId", DEFAULT_FACILITY_ID);
}

// ========= 各エンティティのフック =========

export function useUsers() { return useStored<User[]>("users", []); }
export function useTasks() { return useStored<Task[]>("tasks", []); }
export function useHandovers() { return useStored<Handover[]>("handovers", []); }
export function useAnnouncements() { return useStored<Announcement[]>("announcements", []); }
export function useGoods() { return useStored<DailyGood[]>("goods", []); }
export function useDocuments() { return useStored<DocItem[]>("documents", []); }
export function useMealConfirmations() {
  // key: `${facilityId}_${date}`
  return useStored<Record<string, MealConfirmation>>("mealConfirmations", {});
}
export function useSingleCancellations() { return useStored<SingleCancellation[]>("singleCancellations", []); }
export function useBillingConfirmations() {
  // key: `${userId}_${year}-${month}`
  return useStored<Record<string, boolean>>("billingConfirmations", {});
}

export function useRegularServices() {
  return useStored<RegularService[]>("regularServices", []);
}

export function useBillingLineItems() {
  return useStored<BillingLineItem[]>("billingLineItems", []);
}

export function useStaff() {
  const initial: StaffMember[] = [
    { id: "S001", name: "田中 太郎", roleId: "office", role: "事務担当", email: "tanaka@example.com", facilityIds: [DEFAULT_FACILITY_ID], facility: "—", active: true, lastLogin: "—" },
  ];
  return useStored<StaffMember[]>("staff", initial);
}

// ========= アクティビティログ =========

function pad(n: number) { return String(n).padStart(2, "0"); }

export function logActivity(message: string, staff: string = "田中 太郎") {
  if (typeof window === "undefined") return;
  const prev = load<Activity[]>("activities", []);
  const now = new Date();
  const at = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const next: Activity[] = [
    { id: `AC-${now.getTime()}`, at, staff, message },
    ...prev,
  ].slice(0, 500);
  save("activities", next);
}

export function useActivities() { return useStored<Activity[]>("activities", []); }

// ========= ユーティリティ =========

export function genId(prefix = "ID"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function nowIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 施設フィルタを掛ける汎用関数 */
export function filterByFacility<T extends { facilityId?: string | null }>(items: T[], facilityId: string | null): T[] {
  if (!facilityId) return items; // 全施設
  return items.filter((x) => !x.facilityId || x.facilityId === facilityId);
}

/** 全データ削除 */
export function clearAllData() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function exportAllData(): string {
  if (typeof window === "undefined") return "{}";
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      try { out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k) ?? "null"); } catch {}
    }
  }
  return JSON.stringify(out, null, 2);
}

export function importAllData(json: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    Object.entries(data).forEach(([k, v]) => save(k, v));
    return true;
  } catch {
    return false;
  }
}
