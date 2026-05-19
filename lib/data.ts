// データ層：型定義 / 静的定数 / 純関数のみ。
// 実データ（利用者・タスク等）は lib/store.ts で localStorage に永続化される。

// ========= 型定義 =========

export type Status = "入居中" | "入院中" | "外泊中" | "一時帰宅" | "退去済";
export type MealVendor = "A社" | "B社" | "なし";
export type MealForm = "普通食" | "きざみ" | "一口大" | "軟菜" | "ミキサー" | "ペースト";
export type FluidForm = "常水" | "とろみ薄" | "とろみ中" | "とろみ濃";

export type Allergy = {
  name: string;
  type: "食物" | "薬剤" | "その他";
  severity: "アナフィラキシー" | "重度" | "中度" | "軽度";
};

export type Restriction = {
  type: "腎臓食" | "糖尿食" | "嚥下" | "水分制限" | "塩分制限" | "その他";
  detail: string;
};

export type RegularCancel = {
  weekday: number; // 0-6
  mealType: "breakfast" | "lunch" | "dinner";
  reason: string;
};

export type User = {
  id: string;
  facilityId?: string;
  name: string;
  kana: string;
  room: string;
  birthday: string;
  age: number;
  gender: "男" | "女" | "その他";
  status: Status;
  statusFrom?: string; // 非入居中ステータスの開始日
  statusTo?: string;   // 非入居中ステータスの終了予定日
  statusReason?: string;
  moveInDate: string;
  careLevel: string;
  keyPerson: { name: string; relation: string; phone: string };
  careManager?: string;
  meal: {
    breakfastBread: boolean;
    breakfastJuice: boolean;
    lunchVendor: MealVendor;
    dinnerVendor: MealVendor;
    form: MealForm;
    fluidForm: FluidForm;
    regularCancels: RegularCancel[];
  };
  allergies: Allergy[];
  restrictions: Restriction[];
  monthlyBilling: BillingBreakdown;
  unpaidDocs: number;
  openTasks: number;
  note?: string;
};

export type BillingBreakdown = {
  rent: number;
  common: number;
  utility: number;
  admin: number;
  meal: number;
  goods: number;
  care: number;
  nursing: number;
  advance: number;
  other: number;
};

export type BillingCategory =
  | "家賃" | "共益費" | "水道光熱費" | "管理費" | "生活支援費"
  | "食費" | "日用品" | "介護" | "看護" | "立替" | "保険外サービス" | "その他";

/** 税率：0=非課税、0.08=軽減税率（飲食料品）、0.1=標準 */
export type TaxRate = 0 | 0.08 | 0.1;

/** 定期サービス（毎月定額） */
export type RegularService = {
  id: string;
  userId: string;
  facilityId?: string;
  name: string;            // 表示名 例：家賃／共益費／理美容（月1）
  category: BillingCategory;
  amount: number;          // 月額（税込）
  taxRate?: TaxRate;       // デフォルト 0（非課税）
  validFrom: string;       // YYYY-MM-DD 開始日
  validTo?: string;        // YYYY-MM-DD 終了日（任意）
  active: boolean;
  note?: string;
};

/** 月次請求の明細行（提供日ごと・サービスごと） */
export type BillingLineItem = {
  id: string;
  userId: string;
  facilityId?: string;
  ym: string;                  // 年月 "YYYY-MM"
  category: BillingCategory;
  name: string;                // 項目名 例：朝セット／昼セット／夕セット／おむつL／理美容代
  date?: string;               // 提供日 YYYY-MM-DD（任意）
  quantity: number;
  unitPrice: number;           // 単価（税込）
  amount: number;              // quantity × unitPrice
  taxRate?: TaxRate;           // デフォルト 0
  source?: "manual" | "regular" | "meal-auto" | "goods-auto";
  note?: string;
};

/** 明細行を BillingBreakdown に集約 */
export function aggregateBilling(items: BillingLineItem[]): BillingBreakdown {
  const b = emptyBilling();
  for (const it of items) {
    switch (it.category) {
      case "家賃":         b.rent    += it.amount; break;
      case "共益費":       b.common  += it.amount; break;
      case "水道光熱費":   b.utility += it.amount; break;
      case "管理費":       b.admin   += it.amount; break;
      case "生活支援費":   b.admin   += it.amount; break;
      case "食費":         b.meal    += it.amount; break;
      case "日用品":       b.goods   += it.amount; break;
      case "介護":         b.care    += it.amount; break;
      case "看護":         b.nursing += it.amount; break;
      case "立替":         b.advance += it.amount; break;
      case "保険外サービス": b.other += it.amount; break;
      case "その他":       b.other   += it.amount; break;
    }
  }
  return b;
}

/** 定期サービス → 明細行に展開（指定年月の請求対象のみ） */
export function expandRegularServices(services: RegularService[], ym: string, userId?: string): BillingLineItem[] {
  const monthStart = `${ym}-01`;
  const monthEnd = `${ym}-31`;
  return services
    .filter((s) => s.active)
    .filter((s) => !userId || s.userId === userId)
    .filter((s) => s.validFrom <= monthEnd && (!s.validTo || s.validTo >= monthStart))
    .map((s) => ({
      id: `RS-${s.id}-${ym}`,
      userId: s.userId,
      facilityId: s.facilityId,
      ym,
      category: s.category,
      name: s.name,
      quantity: 1,
      unitPrice: s.amount,
      amount: s.amount,
      source: "regular" as const,
      note: s.note,
    }));
}

/** 利用者の特定月の請求合計を算出 */
export function computeUserBilling(
  userId: string,
  ym: string,
  services: RegularService[],
  lineItems: BillingLineItem[],
): { items: BillingLineItem[]; breakdown: BillingBreakdown; total: number } {
  const expanded = expandRegularServices(services, ym, userId);
  const manual = lineItems.filter((i) => i.userId === userId && i.ym === ym);
  const items = [...expanded, ...manual];
  const breakdown = aggregateBilling(items);
  const total = Object.values(breakdown).reduce((s, n) => s + n, 0);
  return { items, breakdown, total };
}

export type Task = {
  id: string;
  facilityId?: string;
  title: string;
  category: "請求" | "ケア" | "書類" | "連絡" | "棚卸" | "その他";
  userId?: string;
  userName?: string;
  assignee: string;
  due: string;
  priority: "高" | "中" | "低";
  status: "未対応" | "対応中" | "完了" | "見送り";
};

export type Handover = {
  id: string;
  facilityId?: string;
  at: string;
  staff: string;
  userId?: string;
  userName?: string;
  content: string;
  important?: boolean;
};

export type Announcement = {
  id: string;
  facilityId?: string; // null = 全施設
  title: string;
  body: string;
  postedBy: string;
  postedAt: string;
  pinned: boolean;
};

export type Activity = {
  id: string;
  at: string;
  staff: string;
  message: string;
};

export type DailyGood = {
  id: string;
  facilityId?: string;
  name: string;
  cat: string;
  supplier: string;
  stock: number;
  min: number;
  price: number;
  monthUsed: number;
  billable: boolean;
};

export type DocItem = {
  id: string;
  facilityId?: string;
  userId?: string;
  userName: string;
  doc: string;
  status: "未回収" | "期限間近" | "回収済" | "期限切れ" | "不要";
  expires: string;
};

export type StaffMember = {
  id: string;
  name: string;
  roleId: "admin" | "office" | "field" | "view";
  role: string;
  email: string;
  facilityIds: string[]; // アクセス可能な施設ID
  facility: string; // 表示用ラベル（互換）
  active: boolean;
  lastLogin: string;
};

export type Alert = {
  id: string;
  type: "発注未確定" | "在庫不足" | "書類期限間近" | "書類期限切れ" | "請求漏れ疑い" | "復帰漏れ" | "単価未設定";
  severity: "高" | "中" | "低";
  detectedAt: string;
  message: string;
  targetUserId?: string;
  impact: string;
  actionLabel: string;
  actionHref: string;
};

export type MealConfirmation = { breakfast?: boolean; lunch?: boolean; dinner?: boolean };
export type SingleCancellation = { id: string; userId: string; date: string; mealType: "breakfast" | "lunch" | "dinner"; reason: string; billable: boolean };

export type Vendor = {
  id: string;
  name: string;
  type: "弁当" | "パン" | "ジュース";
  deadlineTime: string;
  saturdayIncludesSunday: boolean;
  noSundayDelivery: boolean;
};

// ========= 静的定数 =========

export const HOLIDAYS = ["2026-05-03", "2026-05-04", "2026-05-05"];

// 業者のデフォルト（マスタ管理で変更可能だが空運用での初期値）
export const vendors: Vendor[] = [
  { id: "A", name: "弁当 A社", type: "弁当", deadlineTime: "10:30", saturdayIncludesSunday: true, noSundayDelivery: true },
  { id: "B", name: "弁当 B社", type: "弁当", deadlineTime: "11:00", saturdayIncludesSunday: false, noSundayDelivery: false },
  { id: "P", name: "パン業者", type: "パン", deadlineTime: "15:00", saturdayIncludesSunday: false, noSundayDelivery: false },
];

// ========= 純粋ヘルパー =========

export function jpy(n: number): string {
  return "¥" + n.toLocaleString("ja-JP");
}

export function totalOf(u: User): number {
  const b = u.monthlyBilling;
  return b.rent + b.common + b.utility + b.admin + b.meal + b.goods + b.care + b.nursing + b.advance + b.other;
}

export function emptyBilling(): BillingBreakdown {
  return { rent: 0, common: 0, utility: 0, admin: 0, meal: 0, goods: 0, care: 0, nursing: 0, advance: 0, other: 0 };
}

export function timeToDeadline(deadlineHHMM: string): { hours: number; minutes: number; total: number } {
  const now = new Date();
  const [dh, dm] = deadlineHHMM.split(":").map(Number);
  const deadlineMins = dh * 60 + dm;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const diff = deadlineMins - nowMins;
  if (diff <= 0) return { hours: 0, minutes: 0, total: 0 };
  return { hours: Math.floor(diff / 60), minutes: diff % 60, total: diff };
}

// ========= 食事カレンダー集計（純関数） =========

export type DayMealCount = {
  date: string;
  weekday: number;
  isHoliday: boolean;
  bread: number;
  juice: number;
  lunchA: number;
  lunchB: number;
  dinnerA: number;
  dinnerB: number;
  cancelCount: number;
  adjustments: number;
  confirmed: { breakfast: boolean; lunch: boolean; dinner: boolean };
  noteFlag: boolean;
};

function isOnStatusBreak(user: User, ymd: string): boolean {
  if (user.status === "入居中") return false;
  if (user.status === "退去済") return true;
  // 期間が登録されている場合は期間内のみ
  if (user.statusFrom && user.statusTo) {
    return ymd >= user.statusFrom && ymd <= user.statusTo;
  }
  if (user.statusFrom) return ymd >= user.statusFrom;
  // 期間未登録なら現在ステータスとして全期間スキップ
  return true;
}

export function buildMonthMealCounts(
  year: number,
  month: number,
  users: User[],
  singleCancellations: SingleCancellation[] = [],
  confirmations: Record<string, MealConfirmation> = {},
): DayMealCount[] {
  const lastDay = new Date(year, month, 0).getDate();
  const result: DayMealCount[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = date.getDay();
    const isHoliday = HOLIDAYS.includes(ymd) || weekday === 0;
    const isSaturday = weekday === 6;

    let bread = 0, juice = 0, lunchA = 0, lunchB = 0, dinnerA = 0, dinnerB = 0, cancelCount = 0;

    users.forEach((u) => {
      if (u.status === "退去済") return;

      if (isOnStatusBreak(u, ymd)) {
        if (u.meal.breakfastBread) cancelCount++;
        if (u.meal.breakfastJuice) cancelCount++;
        if (u.meal.lunchVendor !== "なし") cancelCount++;
        if (u.meal.dinnerVendor !== "なし") cancelCount++;
        return;
      }

      // 単発キャンセル
      const singles = singleCancellations.filter((c) => c.userId === u.id && c.date === ymd);
      const cancelBreakfast = singles.some((c) => c.mealType === "breakfast");
      const cancelLunch = singles.some((c) => c.mealType === "lunch");
      const cancelDinner = singles.some((c) => c.mealType === "dinner");

      // 朝
      if (cancelBreakfast) {
        if (u.meal.breakfastBread) cancelCount++;
        if (u.meal.breakfastJuice) cancelCount++;
      } else {
        if (u.meal.breakfastBread) bread++;
        if (u.meal.breakfastJuice) juice++;
      }

      // 昼（定期 + 単発キャンセル）
      const lunchRegular = u.meal.regularCancels.some((c) => c.weekday === weekday && c.mealType === "lunch");
      if (lunchRegular || cancelLunch) {
        if (u.meal.lunchVendor !== "なし") cancelCount++;
      } else {
        if (u.meal.lunchVendor === "A社") lunchA++;
        else if (u.meal.lunchVendor === "B社") lunchB++;
      }

      // 夕（定期 + 単発キャンセル）
      const dinnerRegular = u.meal.regularCancels.some((c) => c.weekday === weekday && c.mealType === "dinner");
      if (dinnerRegular || cancelDinner) {
        if (u.meal.dinnerVendor !== "なし") cancelCount++;
      } else {
        if (u.meal.dinnerVendor === "A社") dinnerA++;
        else if (u.meal.dinnerVendor === "B社") dinnerB++;
      }
    });

    // 土曜A社：日曜分も加算
    let noteFlag = false;
    if (isSaturday) {
      const sundayYmd = `${year}-${String(month).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
      users.forEach((u) => {
        if (u.status === "退去済") return;
        if (isOnStatusBreak(u, sundayYmd)) return;
        if (u.meal.lunchVendor === "A社") lunchA++;
        if (u.meal.dinnerVendor === "A社") dinnerA++;
      });
      noteFlag = true;
    }

    if (weekday === 0) {
      lunchA = 0;
      dinnerA = 0;
    }

    const confirm = confirmations[ymd] ?? {};
    result.push({
      date: ymd, weekday, isHoliday,
      bread, juice, lunchA, lunchB, dinnerA, dinnerB,
      cancelCount, adjustments: 0,
      confirmed: { breakfast: !!confirm.breakfast, lunch: !!confirm.lunch, dinner: !!confirm.dinner },
      noteFlag,
    });
  }
  return result;
}

export function monthTotal(counts: DayMealCount[]) {
  return counts.reduce(
    (acc, c) => ({
      bread: acc.bread + c.bread,
      juice: acc.juice + c.juice,
      lunchA: acc.lunchA + c.lunchA,
      lunchB: acc.lunchB + c.lunchB,
      dinnerA: acc.dinnerA + c.dinnerA,
      dinnerB: acc.dinnerB + c.dinnerB,
      cancelCount: acc.cancelCount + c.cancelCount,
    }),
    { bread: 0, juice: 0, lunchA: 0, lunchB: 0, dinnerA: 0, dinnerB: 0, cancelCount: 0 }
  );
}

export type DayUserMealStatus = {
  user: User;
  status: "対象" | "ステータス連動停止" | "定期キャンセル" | "単発キャンセル";
  reason?: string;
};

export function buildDayDetail(
  ymd: string,
  mealType: "breakfast" | "lunch" | "dinner",
  users: User[],
  singleCancellations: SingleCancellation[] = [],
  vendor?: "A社" | "B社",
): DayUserMealStatus[] {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.getDay();
  const list: DayUserMealStatus[] = [];

  users.filter((u) => u.status !== "退去済").forEach((u) => {
    let baseMatches = false;
    if (mealType === "breakfast") baseMatches = u.meal.breakfastBread || u.meal.breakfastJuice;
    else if (mealType === "lunch") {
      if (vendor) baseMatches = u.meal.lunchVendor === vendor;
      else baseMatches = u.meal.lunchVendor !== "なし";
    } else {
      if (vendor) baseMatches = u.meal.dinnerVendor === vendor;
      else baseMatches = u.meal.dinnerVendor !== "なし";
    }
    if (!baseMatches) return;

    if (isOnStatusBreak(u, ymd)) {
      list.push({ user: u, status: "ステータス連動停止", reason: u.status });
      return;
    }
    const single = singleCancellations.find((c) => c.userId === u.id && c.date === ymd && c.mealType === mealType);
    if (single) {
      list.push({ user: u, status: "単発キャンセル", reason: single.reason });
      return;
    }
    const reg = u.meal.regularCancels.find((c) => c.weekday === weekday && c.mealType === mealType);
    if (reg) {
      list.push({ user: u, status: "定期キャンセル", reason: reg.reason });
      return;
    }
    list.push({ user: u, status: "対象" });
  });

  return list;
}

// ========= 利用者の雛形ファクトリ =========

export function emptyUserDraft(facilityId?: string): Omit<User, "id"> {
  return {
    facilityId,
    name: "", kana: "", room: "", birthday: "", age: 0, gender: "女",
    status: "入居中", moveInDate: "",
    careLevel: "要介護1",
    keyPerson: { name: "", relation: "", phone: "" },
    meal: {
      breakfastBread: false, breakfastJuice: false,
      lunchVendor: "なし", dinnerVendor: "なし",
      form: "普通食", fluidForm: "常水",
      regularCancels: [],
    },
    allergies: [], restrictions: [],
    monthlyBilling: emptyBilling(),
    unpaidDocs: 0, openTasks: 0,
  };
}
