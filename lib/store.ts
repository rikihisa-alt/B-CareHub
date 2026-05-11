"use client";
import { useEffect, useState } from "react";
import type {
  User, Task, Handover, Announcement, Activity, DailyGood, DocItem, StaffMember,
  MealConfirmation, SingleCancellation,
} from "./data";

// localStorage キーの prefix（バージョン管理用）
const PREFIX = "bch:v1:";

// ========= 低レベル read/write =========

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
  } catch {
    // クォータ超過などは無視
  }
}

// ========= 汎用ストアフック =========

/**
 * localStorage に永続化される useState。
 * 初回描画は initial（SSR/ハイドレーション衝突回避）、
 * マウント後に localStorage の値で置き換わる。
 */
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

// ========= 個別エンティティのフック =========

export function useUsers() {
  return useStored<User[]>("users", []);
}

export function useTasks() {
  return useStored<Task[]>("tasks", []);
}

export function useHandovers() {
  return useStored<Handover[]>("handovers", []);
}

export function useAnnouncements() {
  return useStored<Announcement[]>("announcements", []);
}

export function useGoods() {
  return useStored<DailyGood[]>("goods", []);
}

export function useDocuments() {
  return useStored<DocItem[]>("documents", []);
}

export function useMealConfirmations() {
  return useStored<Record<string, MealConfirmation>>("mealConfirmations", {});
}

export function useSingleCancellations() {
  return useStored<SingleCancellation[]>("singleCancellations", []);
}

export function useBillingConfirmations() {
  // key: `${userId}_${year}-${month}`
  return useStored<Record<string, boolean>>("billingConfirmations", {});
}

export function useStaff() {
  // 初期：管理者・事務がいないと運用不可なので、最低限の3名をデフォルトに
  const initial: StaffMember[] = [
    { id: "S001", name: "田中 太郎", roleId: "office", role: "事務担当", email: "tanaka@example.com", facility: "あすか苑（仮）", active: true, lastLogin: "—" },
  ];
  return useStored<StaffMember[]>("staff", initial);
}

// ========= アクティビティログ =========

function pad(n: number) {
  return String(n).padStart(2, "0");
}

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

export function useActivities() {
  return useStored<Activity[]>("activities", []);
}

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

/** 全データ削除（マスタ管理から呼び出し可能） */
export function clearAllData() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

/** データのエクスポート（JSON） */
export function exportAllData(): string {
  if (typeof window === "undefined") return "{}";
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      try {
        out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k) ?? "null");
      } catch {
        // skip
      }
    }
  }
  return JSON.stringify(out, null, 2);
}

/** エクスポートした JSON をインポート */
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
