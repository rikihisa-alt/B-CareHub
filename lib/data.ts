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

/** 請求書の5大区分（表紙の構成） */
export type MajorCategory = "住居費等" | "介護サービス利用料" | "日常サービス利用料" | "立替金" | "その他";

/** BillingCategory → 5大区分マッピング */
export function toMajorCategory(c: BillingCategory): MajorCategory {
  switch (c) {
    case "家賃": case "共益費": case "水道光熱費": case "管理費": case "生活支援費":
      return "住居費等";
    case "介護": case "看護":
      return "介護サービス利用料";
    case "食費": case "日用品": case "保険外サービス":
      return "日常サービス利用料";
    case "立替":
      return "立替金";
    case "その他":
    default:
      return "その他";
  }
}

/** 住居費等プリセット（全室一律 月額 62,000円） */
export const HOUSING_PRESET = {
  total: 62000,
  rent: 40000,
  admin: 5000,
  common: 5000,
  water: 2000,
  utility: 10000,
} as const;

/** 日常サービス（月額）プリセット */
export const DAILY_SERVICE_PRESETS = [
  { key: "meal", name: "食事サポート費", amount: 4000, desc: "外部業者の配膳・下膳・温め・食事準備・容器回収" },
  { key: "tea", name: "配茶サポート費", amount: 1000, desc: "飲料準備・配茶・飲料補充・容器回収" },
  { key: "laundry", name: "洗濯・乾燥サポート費", amount: 2000, desc: "週1回程度の洗濯物確認・洗濯・乾燥・回収・簡易収納" },
  { key: "cleaning", name: "居室清掃サポート費", amount: 2000, desc: "週1回程度の簡易清掃・拭き掃除・整理" },
  { key: "sheet", name: "シーツ交換サポート費", amount: 1000, desc: "週1回程度のシーツ交換" },
  { key: "misc", name: "その他日常サポート費", amount: 1000, desc: "物品受渡し・連絡調整・受付取次ぎ・軽微な依頼対応" },
  { key: "outing", name: "定期外出サポート費", amount: 1500, desc: "週1回目安の買い物・散歩・気分転換等の外出支援（実施回数保証なし）" },
] as const;

export type DailyServiceKey = typeof DAILY_SERVICE_PRESETS[number]["key"];

/** 追加対応プリセット */
export const ADDITIONAL_SERVICE_PRESETS = [
  { key: "add_laundry", name: "追加洗濯・乾燥", unitPrice: 300, unit: "回" },
  { key: "add_cleaning", name: "追加居室清掃", unitPrice: 300, unit: "回" },
  { key: "add_sheet", name: "追加シーツ交換", unitPrice: 300, unit: "回" },
] as const;

/** 都度請求プリセット */
export const ON_DEMAND_PRESETS = [
  { key: "shopping_near", name: "買い物代行費（近隣）", unitPrice: 1000, unit: "回" },
  { key: "shopping_far", name: "遠方買い物代行費", unitPrice: 2000, unit: "回" },
  { key: "shopping_urgent", name: "緊急買い物代行費", unitPrice: 2000, unit: "回" },
  { key: "doc_support", name: "書類確認・連絡調整サポート費", unitPrice: 1500, unit: "30分" },
  { key: "doc_create", name: "報告書・書類作成サポート費", unitPrice: 1500, unit: "30分" },
  { key: "outing_attend", name: "外出付き添い費", unitPrice: 1500, unit: "30分" },
  { key: "hospital_attend", name: "病院付き添い費", unitPrice: 1500, unit: "30分" },
  { key: "admin_attend", name: "行政手続きサポート費", unitPrice: 1500, unit: "30分" },
  { key: "vehicle_near", name: "車両使用料（近隣）", unitPrice: 1000, unit: "回" },
  { key: "vehicle_far", name: "遠方車両使用料", unitPrice: 2000, unit: "回" },
  { key: "luggage", name: "荷物整理・搬出入サポート費", unitPrice: 1500, unit: "30分" },
  { key: "furniture", name: "家具移動費", unitPrice: 1500, unit: "30分" },
  { key: "special_clean", name: "特別清掃費", unitPrice: 1500, unit: "30分" },
  { key: "vendor_attend", name: "業者立会い費", unitPrice: 1500, unit: "30分" },
  { key: "emergency", name: "緊急対応費", unitPrice: 2000, unit: "回" },
  { key: "key_open", name: "鍵開け対応費", unitPrice: 1000, unit: "回" },
  { key: "key_manage", name: "鍵管理・受け渡し対応費", unitPrice: 1000, unit: "回" },
] as const;

/** 立替金プリセット（区分） */
export const REIMBURSEMENT_KINDS = [
  { key: "meal_delivery", name: "配食サービス利用料立替金", regular: true },
  { key: "pharmacy", name: "薬局費立替金", regular: true },
  { key: "house_call", name: "往診費立替金", regular: true },
  { key: "day_service", name: "デイサービス費立替金", regular: true },
  { key: "dental", name: "訪問歯科費立替金", regular: true },
  { key: "daily_goods", name: "日用品購入立替金", regular: false },
  { key: "diaper", name: "おむつ・パッド等衛生用品立替金", regular: false },
  { key: "barber", name: "理美容費立替金", regular: false },
  { key: "care_goods", name: "福祉用具・介護用品立替金", regular: false },
  { key: "transport", name: "交通費立替金", regular: false },
  { key: "admin_fee", name: "行政手数料立替金", regular: false },
  { key: "post_copy", name: "郵送・コピー等実費", regular: false },
  { key: "telecom", name: "通信費等立替金", regular: false },
  { key: "other_reimb", name: "その他立替金", regular: false },
] as const;

/** 立替事務費（臨時 1件 100円） */
export const REIMBURSEMENT_FEE = 100;

/** 介護保険：区分支給限度基準額（1単位=10円換算の概算） */
export const CARE_LIMIT_UNITS: Record<string, number> = {
  "要支援1": 5032,
  "要支援2": 10531,
  "要介護1": 16765,
  "要介護2": 19705,
  "要介護3": 27048,
  "要介護4": 30938,
  "要介護5": 36217,
};

/** 利用者ごとの請求プロファイル */
export type BillingProfile = {
  userId: string;
  facilityId?: string;
  // 住居費等
  housing: {
    enabled: boolean;
    customAmounts?: Partial<{ rent: number; admin: number; common: number; water: number; utility: number }>;
  };
  // 日常サービス ON/OFF
  dailyServices: Record<DailyServiceKey, boolean>;
  // 自己負担割合
  burdenRate?: 1 | 2 | 3;
  // 家族説明メモ
  familyMemo?: string;
  // 契約時確認済みフラグ
  contractConfirmed?: boolean;
  contractConfirmedAt?: string;
};

export function emptyBillingProfile(userId: string, facilityId?: string): BillingProfile {
  return {
    userId, facilityId,
    housing: { enabled: true },
    dailyServices: { meal: false, tea: false, laundry: false, cleaning: false, sheet: false, misc: false, outing: false },
    burdenRate: 1,
  };
}

/** 月の日数 */
export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * 住居費の日割り計算
 * - 入居月：入居日から月末まで日割
 * - 退去月：満額（仕様通り）
 * - 入院・外泊中も満額（自動停止しない）
 */
export function prorateHousing(
  monthAmount: number,
  ym: string,
  moveInDate?: string,
): { amount: number; isFirstMonth: boolean; billDays: number; totalDays: number } {
  const days = daysInMonth(ym);
  if (!moveInDate || moveInDate.slice(0, 7) !== ym) {
    return { amount: monthAmount, isFirstMonth: false, billDays: days, totalDays: days };
  }
  const moveInDay = Number(moveInDate.slice(8, 10));
  const billDays = days - moveInDay + 1;
  const amount = Math.round((monthAmount / days) * billDays);
  return { amount, isFirstMonth: true, billDays, totalDays: days };
}

/**
 * プロファイルから月次の自動明細を生成
 * - 住居費等：5項目を BillingLineItem として
 * - 日常サービス利用料：ON のものだけを月額計上
 */
export function generateProfileLineItems(
  profile: BillingProfile,
  user: User,
  ym: string,
): BillingLineItem[] {
  const items: BillingLineItem[] = [];

  // 住居費等
  if (profile.housing.enabled) {
    const amts = {
      rent: profile.housing.customAmounts?.rent ?? HOUSING_PRESET.rent,
      admin: profile.housing.customAmounts?.admin ?? HOUSING_PRESET.admin,
      common: profile.housing.customAmounts?.common ?? HOUSING_PRESET.common,
      water: profile.housing.customAmounts?.water ?? HOUSING_PRESET.water,
      utility: profile.housing.customAmounts?.utility ?? HOUSING_PRESET.utility,
    };
    const defs: Array<[BillingCategory, string, number]> = [
      ["家賃", "家賃", amts.rent],
      ["管理費", "管理費", amts.admin],
      ["共益費", "共益費", amts.common],
      ["水道光熱費", "水道料金", amts.water],
      ["水道光熱費", "定額光熱費", amts.utility],
    ];
    defs.forEach(([cat, name, amount]) => {
      const p = prorateHousing(amount, ym, user.moveInDate);
      items.push({
        id: `HOUSING-${profile.userId}-${ym}-${name}`,
        userId: profile.userId,
        facilityId: profile.facilityId,
        ym,
        category: cat,
        name: p.isFirstMonth ? `${name}（入居月 日割 ${p.billDays}/${p.totalDays}日）` : name,
        quantity: 1,
        unitPrice: p.amount,
        amount: p.amount,
        taxRate: 0,
        source: "regular",
      });
    });
  }

  // 日常サービス利用料（ON のもののみ）
  DAILY_SERVICE_PRESETS.forEach((preset) => {
    if (profile.dailyServices[preset.key]) {
      items.push({
        id: `DS-${profile.userId}-${ym}-${preset.key}`,
        userId: profile.userId,
        facilityId: profile.facilityId,
        ym,
        category: "保険外サービス",
        name: preset.name,
        quantity: 1,
        unitPrice: preset.amount,
        amount: preset.amount,
        taxRate: 0.1,
        source: "regular",
      });
    }
  });

  return items;
}

/** 5大区分ごとに集約 */
export function groupBillingByMajor(items: BillingLineItem[]): Record<MajorCategory, BillingLineItem[]> {
  const result: Record<MajorCategory, BillingLineItem[]> = {
    "住居費等": [], "介護サービス利用料": [], "日常サービス利用料": [], "立替金": [], "その他": [],
  };
  items.forEach((it) => {
    result[toMajorCategory(it.category)].push(it);
  });
  return result;
}

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

/** 部屋（居室・事務所・倉庫・共用部 など） */
export type RoomType = "居室" | "事務所" | "倉庫" | "共用部" | "その他";

export type Room = {
  id: string;
  facilityId?: string;
  roomNo: string;              // 部屋番号や名称（半角英数字＋日本語可）例：101 / 事務所 / 倉庫A / 1F廊下
  type: RoomType;
  capacity?: number;           // 居室の場合の定員
  note?: string;
};

/** 光熱費（部屋ごと、検針期間ごと） */
export type UtilityType = "電気" | "ガス" | "水道" | "灯油" | "その他";

export type UtilityBill = {
  id: string;
  facilityId?: string;
  roomNo: string;              // 部屋番号 or 部屋名（Room.roomNo or User.room と照合）
  ym: string;                  // 請求対象 年月 "YYYY-MM"
  periodStart?: string;        // 検針開始日 YYYY-MM-DD（例：2026-04-15）
  periodEnd?: string;          // 検針終了日 YYYY-MM-DD（例：2026-05-14）
  type: UtilityType;
  provider?: string;           // 業者名 例：東京電力／東京ガス
  meterReading?: number;       // 検針値（任意）
  amount: number;              // 請求金額（業者からの請求額）
  status: "未払い" | "支払済";
  paidDate?: string;
  paidAmount?: number;
  taxRate?: TaxRate;           // 通常は標準 10%
  billToUser: boolean;         // 入居者へ請求に転嫁するか
  note?: string;
};

/** 光熱費 → BillingLineItem へ変換（入居者請求対応分のみ） */
export function utilityBillsToLineItems(
  bills: UtilityBill[],
  roomNo: string,
  ym: string,
  facilityId?: string,
): BillingLineItem[] {
  return bills
    .filter((b) => b.billToUser && b.roomNo === roomNo && b.ym === ym && (!facilityId || !b.facilityId || b.facilityId === facilityId))
    .map((b) => {
      // 期間表示：例「4/15〜5/14」
      const periodLabel = (b.periodStart && b.periodEnd)
        ? ` ${b.periodStart.slice(5).replace("-", "/")}〜${b.periodEnd.slice(5).replace("-", "/")}`
        : "";
      return {
        id: `UB-${b.id}`,
        userId: "",                  // 後で呼び出し側がセット
        facilityId: b.facilityId,
        ym: b.ym,
        category: "水道光熱費" as BillingCategory,
        name: `${b.type}代${b.provider ? `（${b.provider}）` : ""}${periodLabel}`,
        date: b.periodEnd ?? `${ym}-末`,
        quantity: 1,
        unitPrice: b.amount,
        amount: b.amount,
        taxRate: b.taxRate ?? 0.1,
        source: "manual" as const,
        note: b.note,
      };
    });
}

/** 食費単価マスタ */
export type MealPriceKey = "breakfastBread" | "breakfastJuice" | "lunchA" | "lunchB" | "dinnerA" | "dinnerB";

export type MealPrice = {
  id: string;
  facilityId?: string;
  key: MealPriceKey;
  label: string;      // 請求書に表示される名称（例：朝セット／昼セット A社）
  price: number;      // 単価（税込）
  taxRate: TaxRate;
};

/** デフォルト食費単価（マスタ未設定時のフォールバック） */
export const DEFAULT_MEAL_PRICES: { key: MealPriceKey; label: string; price: number }[] = [
  { key: "breakfastBread",  label: "朝食 パン",      price: 150 },
  { key: "breakfastJuice",  label: "朝食 ジュース",  price: 80  },
  { key: "lunchA",          label: "昼セット A社",   price: 600 },
  { key: "lunchB",          label: "昼セット B社",   price: 580 },
  { key: "dinnerA",         label: "夕セット A社",   price: 780 },
  { key: "dinnerB",         label: "夕セット B社",   price: 720 },
];

function getMealPrice(key: MealPriceKey, prices: MealPrice[], facilityId?: string): { label: string; price: number; taxRate: TaxRate } {
  const found = prices.find((p) => p.key === key && (!p.facilityId || !facilityId || p.facilityId === facilityId));
  if (found) return { label: found.label, price: found.price, taxRate: found.taxRate };
  const def = DEFAULT_MEAL_PRICES.find((d) => d.key === key)!;
  return { label: def.label, price: def.price, taxRate: 0.08 };
}

/** 利用者の食事設定 × 当月日数 × キャンセル状況 から、日別の食費明細を自動生成 */
export function generateMealLineItems(
  user: User,
  ym: string,
  mealPrices: MealPrice[],
  singleCancellations: SingleCancellation[] = [],
): BillingLineItem[] {
  const items: BillingLineItem[] = [];
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();

  for (let d = 1; d <= lastDay; d++) {
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const date = new Date(y, m - 1, d);
    const weekday = date.getDay();

    // ステータス休止中はスキップ
    if (user.status === "退去済") continue;
    if (user.status !== "入居中") {
      if (user.statusFrom && user.statusTo) {
        if (ymd >= user.statusFrom && ymd <= user.statusTo) continue;
      } else if (user.statusFrom) {
        if (ymd >= user.statusFrom) continue;
      } else {
        continue;
      }
    }

    // 単発キャンセル
    const singles = singleCancellations.filter((c) => c.userId === user.id && c.date === ymd);
    const sBreak = singles.some((c) => c.mealType === "breakfast");
    const sLunch = singles.some((c) => c.mealType === "lunch");
    const sDinner = singles.some((c) => c.mealType === "dinner");

    // 定期キャンセル
    const rBreak = user.meal.regularCancels.some((c) => c.weekday === weekday && c.mealType === "breakfast");
    const rLunch = user.meal.regularCancels.some((c) => c.weekday === weekday && c.mealType === "lunch");
    const rDinner = user.meal.regularCancels.some((c) => c.weekday === weekday && c.mealType === "dinner");

    const fid = user.facilityId;
    const push = (suffix: string, key: MealPriceKey) => {
      const p = getMealPrice(key, mealPrices, fid);
      items.push({
        id: `MA-${user.id}-${ymd}-${suffix}`,
        userId: user.id,
        facilityId: fid,
        ym,
        category: "食費",
        name: p.label,
        date: ymd,
        quantity: 1,
        unitPrice: p.price,
        amount: p.price,
        taxRate: p.taxRate,
        source: "meal-auto",
      });
    };

    if (user.meal.breakfastBread && !sBreak && !rBreak) push("bb", "breakfastBread");
    if (user.meal.breakfastJuice && !sBreak && !rBreak) push("bj", "breakfastJuice");
    if (user.meal.lunchVendor === "A社" && !sLunch && !rLunch) push("l", "lunchA");
    else if (user.meal.lunchVendor === "B社" && !sLunch && !rLunch) push("l", "lunchB");
    if (user.meal.dinnerVendor === "A社" && !sDinner && !rDinner) push("d", "dinnerA");
    else if (user.meal.dinnerVendor === "B社" && !sDinner && !rDinner) push("d", "dinnerB");
  }
  return items;
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
