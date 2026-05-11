// モックデータ層。MVP着手時にはDB(prisma)に差し替える前提のシェイプにしています。

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

export type User = {
  id: string;
  name: string;
  kana: string;
  room: string;
  birthday: string;
  age: number;
  gender: "男" | "女";
  status: Status;
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
    regularCancels: { weekday: number; mealType: "lunch" | "dinner" | "breakfast"; reason: string }[];
  };
  allergies: Allergy[];
  restrictions: Restriction[];
  monthlyBilling: {
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
  unpaidDocs: number;
  openTasks: number;
  note?: string;
};

export const users: User[] = [
  {
    id: "U2024-0001",
    name: "佐藤 ヨシ子",
    kana: "サトウ ヨシコ",
    room: "101",
    birthday: "1938-04-12",
    age: 87,
    gender: "女",
    status: "入居中",
    moveInDate: "2023-05-01",
    careLevel: "要介護2",
    keyPerson: { name: "佐藤 健一", relation: "長男", phone: "090-1234-5678" },
    careManager: "あすかケアプランセンター 山田",
    meal: {
      breakfastBread: true, breakfastJuice: true,
      lunchVendor: "A社", dinnerVendor: "B社",
      form: "きざみ", fluidForm: "常水",
      regularCancels: [],
    },
    allergies: [
      { name: "そば", type: "食物", severity: "アナフィラキシー" },
      { name: "えび", type: "食物", severity: "重度" },
    ],
    restrictions: [],
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 42000, goods: 6800, care: 18500, nursing: 0, advance: 1200, other: 0,
    },
    unpaidDocs: 0, openTasks: 1,
    note: "義歯あり。きざみ食。",
  },
  {
    id: "U2024-0002",
    name: "鈴木 タケ",
    kana: "スズキ タケ",
    room: "102",
    birthday: "1932-11-03",
    age: 92, gender: "女",
    status: "入院中",
    moveInDate: "2022-09-15",
    careLevel: "要介護4",
    keyPerson: { name: "鈴木 真理", relation: "次女", phone: "080-2345-6789" },
    careManager: "あすかケアプランセンター 山田",
    meal: {
      breakfastBread: false, breakfastJuice: true,
      lunchVendor: "A社", dinnerVendor: "A社",
      form: "ミキサー", fluidForm: "とろみ中",
      regularCancels: [],
    },
    allergies: [],
    restrictions: [
      { type: "嚥下", detail: "嚥下機能低下のためミキサー必須・とろみ中" },
    ],
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 0, goods: 3200, care: 22400, nursing: 8900, advance: 0, other: 0,
    },
    unpaidDocs: 1, openTasks: 2,
    note: "5/5より◯◯病院入院中。食事停止中。退院予定 5/13。",
  },
  {
    id: "U2024-0003",
    name: "高橋 正一",
    kana: "タカハシ ショウイチ",
    room: "103",
    birthday: "1942-07-21",
    age: 82, gender: "男",
    status: "入居中",
    moveInDate: "2024-01-10",
    careLevel: "要介護1",
    keyPerson: { name: "高橋 由美", relation: "長女", phone: "090-3456-7890" },
    meal: {
      breakfastBread: true, breakfastJuice: false,
      lunchVendor: "B社", dinnerVendor: "B社",
      form: "普通食", fluidForm: "常水",
      regularCancels: [],
    },
    allergies: [],
    restrictions: [{ type: "糖尿食", detail: "糖尿食対応、間食は控える" }],
    monthlyBilling: {
      // ★請求漏れ検知のデモ：食費が 0 にもかかわらず食事は出ている
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 0, goods: 4400, care: 14200, nursing: 0, advance: 3800, other: 0,
    },
    unpaidDocs: 0, openTasks: 0,
  },
  {
    id: "U2024-0004",
    name: "田中 久子",
    kana: "タナカ ヒサコ",
    room: "104",
    birthday: "1935-02-28",
    age: 90, gender: "女",
    status: "外泊中",
    moveInDate: "2021-04-01",
    careLevel: "要介護3",
    keyPerson: { name: "田中 賢", relation: "長男", phone: "080-4567-8901" },
    meal: {
      breakfastBread: true, breakfastJuice: true,
      lunchVendor: "A社", dinnerVendor: "A社",
      form: "きざみ", fluidForm: "とろみ薄",
      regularCancels: [],
    },
    allergies: [{ name: "卵", type: "食物", severity: "中度" }],
    restrictions: [],
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 36400, goods: 5200, care: 19800, nursing: 4200, advance: 0, other: 0,
    },
    unpaidDocs: 0, openTasks: 1,
    note: "5/10〜5/12 親族宅へ外泊。",
  },
  {
    id: "U2024-0005",
    name: "渡辺 健太郎",
    kana: "ワタナベ ケンタロウ",
    room: "201",
    birthday: "1940-09-15",
    age: 84, gender: "男",
    status: "入居中",
    moveInDate: "2023-08-22",
    careLevel: "要介護2",
    keyPerson: { name: "渡辺 美智子", relation: "妻", phone: "090-5678-9012" },
    meal: {
      breakfastBread: true, breakfastJuice: true,
      lunchVendor: "B社", dinnerVendor: "A社",
      form: "普通食", fluidForm: "常水",
      regularCancels: [],
    },
    allergies: [],
    restrictions: [{ type: "塩分制限", detail: "高血圧のため減塩食" }],
    monthlyBilling: {
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 44100, goods: 7800, care: 18200, nursing: 0, advance: 2400, other: 1500,
    },
    unpaidDocs: 0, openTasks: 0,
  },
  {
    id: "U2024-0006",
    name: "山本 美子",
    kana: "ヤマモト ヨシコ",
    room: "202",
    birthday: "1937-12-08",
    age: 87, gender: "女",
    status: "入居中",
    moveInDate: "2022-11-30",
    careLevel: "要介護2",
    keyPerson: { name: "山本 太郎", relation: "長男", phone: "080-6789-0123" },
    meal: {
      breakfastBread: false, breakfastJuice: true,
      lunchVendor: "A社", dinnerVendor: "B社",
      form: "きざみ", fluidForm: "常水",
      regularCancels: [{ weekday: 4, mealType: "lunch", reason: "通所のため" }],
    },
    allergies: [],
    restrictions: [],
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 40600, goods: 6100, care: 18900, nursing: 0, advance: 0, other: 0,
    },
    unpaidDocs: 1, openTasks: 0,
    note: "毎週木曜 通所のため昼食キャンセル。",
  },
  {
    id: "U2024-0007",
    name: "中村 義雄",
    kana: "ナカムラ ヨシオ",
    room: "203",
    birthday: "1941-06-19",
    age: 83, gender: "男",
    status: "入居中",
    moveInDate: "2024-03-15",
    careLevel: "要介護3",
    keyPerson: { name: "中村 久美", relation: "長女", phone: "090-7890-1234" },
    meal: {
      breakfastBread: true, breakfastJuice: false,
      lunchVendor: "A社", dinnerVendor: "A社",
      form: "ミキサー", fluidForm: "とろみ中",
      regularCancels: [],
    },
    allergies: [{ name: "ペニシリン系", type: "薬剤", severity: "重度" }],
    restrictions: [{ type: "嚥下", detail: "嚥下機能低下" }],
    monthlyBilling: {
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 41200, goods: 8800, care: 19800, nursing: 6300, advance: 0, other: 0,
    },
    unpaidDocs: 0, openTasks: 1,
  },
  {
    id: "U2024-0008",
    name: "小林 ハル",
    kana: "コバヤシ ハル",
    room: "204",
    birthday: "1934-08-30",
    age: 90, gender: "女",
    status: "入居中",
    moveInDate: "2021-07-12",
    careLevel: "要介護4",
    keyPerson: { name: "小林 千恵", relation: "次女", phone: "080-8901-2345" },
    meal: {
      breakfastBread: false, breakfastJuice: true,
      lunchVendor: "B社", dinnerVendor: "B社",
      form: "ペースト", fluidForm: "とろみ濃",
      regularCancels: [],
    },
    allergies: [],
    restrictions: [
      { type: "嚥下", detail: "重度嚥下障害・ペースト食必須" },
      { type: "水分制限", detail: "心不全のため水分制限 1000ml/日" },
    ],
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 43400, goods: 9200, care: 22100, nursing: 7800, advance: 0, other: 0,
    },
    unpaidDocs: 0, openTasks: 0,
    note: "水分制限あり。看護師申し送り確認。",
  },
  {
    id: "U2024-0009",
    name: "加藤 一郎",
    kana: "カトウ イチロウ",
    room: "205",
    birthday: "1939-03-04",
    age: 86, gender: "男",
    status: "一時帰宅",
    moveInDate: "2023-02-20",
    careLevel: "要介護2",
    keyPerson: { name: "加藤 みどり", relation: "長女", phone: "090-9012-3456" },
    meal: {
      breakfastBread: true, breakfastJuice: true,
      lunchVendor: "A社", dinnerVendor: "B社",
      form: "普通食", fluidForm: "常水",
      regularCancels: [],
    },
    allergies: [],
    restrictions: [],
    monthlyBilling: {
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 32200, goods: 4600, care: 17800, nursing: 0, advance: 0, other: 0,
    },
    unpaidDocs: 0, openTasks: 0,
    note: "5/9〜5/11 家族と外出。",
  },
  {
    id: "U2024-0010",
    name: "吉田 トモ",
    kana: "ヨシダ トモ",
    room: "206",
    birthday: "1936-10-25",
    age: 88, gender: "女",
    status: "入居中",
    moveInDate: "2022-06-08",
    careLevel: "要介護3",
    keyPerson: { name: "吉田 浩二", relation: "長男", phone: "080-0123-4567" },
    meal: {
      breakfastBread: true, breakfastJuice: true,
      lunchVendor: "A社", dinnerVendor: "A社",
      form: "きざみ", fluidForm: "とろみ薄",
      regularCancels: [],
    },
    allergies: [],
    restrictions: [],
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 41800, goods: 7200, care: 19500, nursing: 0, advance: 1800, other: 0,
    },
    unpaidDocs: 0, openTasks: 1,
  },
];

export function totalOf(u: User): number {
  const b = u.monthlyBilling;
  return b.rent + b.common + b.utility + b.admin + b.meal + b.goods + b.care + b.nursing + b.advance + b.other;
}

export function jpy(n: number): string {
  return "¥" + n.toLocaleString("ja-JP");
}

// ============ 食事カレンダー ============

export const HOLIDAYS = ["2026-05-03", "2026-05-04", "2026-05-05"];

// 業者マスタ
export type Vendor = {
  id: string;
  name: string;
  type: "弁当" | "パン" | "ジュース";
  deadlineTime: string; // "10:30"
  saturdayIncludesSunday: boolean;
  noSundayDelivery: boolean;
};

export const vendors: Vendor[] = [
  { id: "A", name: "弁当 A社", type: "弁当", deadlineTime: "10:30", saturdayIncludesSunday: true, noSundayDelivery: true },
  { id: "B", name: "弁当 B社", type: "弁当", deadlineTime: "11:00", saturdayIncludesSunday: false, noSundayDelivery: false },
  { id: "P", name: "パン業者", type: "パン", deadlineTime: "15:00", saturdayIncludesSunday: false, noSundayDelivery: false },
];

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

// 期間キャンセル：入院・外泊・一時帰宅で食事を停止
function isOnStatusBreak(uid: string, ymd: string): boolean {
  if (uid === "U2024-0002") return true; // 鈴木さん入院中
  if (uid === "U2024-0009" && ymd >= "2026-05-09" && ymd <= "2026-05-11") return true; // 加藤さん一時帰宅
  if (uid === "U2024-0004" && ymd >= "2026-05-10" && ymd <= "2026-05-12") return true; // 田中さん外泊
  return false;
}

export function buildMonthMealCounts(year: number, month: number): DayMealCount[] {
  const lastDay = new Date(year, month, 0).getDate();
  const result: DayMealCount[] = [];
  const activeUsers = users.filter((u) => u.status !== "退去済");

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = date.getDay();
    const isHoliday = HOLIDAYS.includes(ymd) || weekday === 0;
    const isSaturday = weekday === 6;

    let bread = 0, juice = 0, lunchA = 0, lunchB = 0, dinnerA = 0, dinnerB = 0, cancelCount = 0;

    activeUsers.forEach((u) => {
      if (isOnStatusBreak(u.id, ymd)) {
        if (u.meal.breakfastBread) cancelCount++;
        if (u.meal.breakfastJuice) cancelCount++;
        if (u.meal.lunchVendor !== "なし") cancelCount++;
        if (u.meal.dinnerVendor !== "なし") cancelCount++;
        return;
      }
      // 朝
      if (u.meal.breakfastBread) bread++;
      if (u.meal.breakfastJuice) juice++;
      // 昼（定期キャンセル考慮）
      const lunchRegCancel = u.meal.regularCancels.some(
        (c) => c.weekday === weekday && c.mealType === "lunch"
      );
      if (!lunchRegCancel) {
        if (u.meal.lunchVendor === "A社") lunchA++;
        else if (u.meal.lunchVendor === "B社") lunchB++;
      } else {
        cancelCount++;
      }
      // 夕
      if (u.meal.dinnerVendor === "A社") dinnerA++;
      else if (u.meal.dinnerVendor === "B社") dinnerB++;
    });

    // 土曜にA社が日曜分を加算
    let noteFlag = false;
    if (isSaturday) {
      const sundayYmd = `${year}-${String(month).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
      activeUsers.forEach((u) => {
        if (isOnStatusBreak(u.id, sundayYmd)) return;
        if (u.meal.lunchVendor === "A社") lunchA++;
        if (u.meal.dinnerVendor === "A社") dinnerA++;
      });
      noteFlag = true;
    }

    if (weekday === 0) {
      lunchA = 0;
      dinnerA = 0;
    }

    // 確定状況：5/10までは全食確定、5/11は朝のみ確定、5/12以降未確定
    const breakfastConfirmed = d <= 11;
    const lunchConfirmed = d <= 10;
    const dinnerConfirmed = d <= 10;

    result.push({
      date: ymd, weekday, isHoliday,
      bread, juice, lunchA, lunchB, dinnerA, dinnerB,
      cancelCount, adjustments: 0,
      confirmed: { breakfast: breakfastConfirmed, lunch: lunchConfirmed, dinner: dinnerConfirmed },
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

// 当日の食事に対する利用者ごとの内訳を返す
export type DayUserMealStatus = {
  user: User;
  status: "対象" | "ステータス連動停止" | "定期キャンセル" | "単発キャンセル";
  reason?: string;
};

export function buildDayDetail(ymd: string, mealType: "breakfast" | "lunch" | "dinner", vendor?: "A社" | "B社") {
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

    if (isOnStatusBreak(u.id, ymd)) {
      list.push({ user: u, status: "ステータス連動停止", reason: u.status });
      return;
    }
    const reg = u.meal.regularCancels.find(
      (c) => c.weekday === weekday && c.mealType === mealType
    );
    if (reg) {
      list.push({ user: u, status: "定期キャンセル", reason: reg.reason });
      return;
    }
    list.push({ user: u, status: "対象" });
  });

  return list;
}

// ============ アラート（自動検知） ============

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

export const alerts: Alert[] = [
  {
    id: "A-001",
    type: "発注未確定",
    severity: "高",
    detectedAt: "2026-05-11 08:40",
    message: "本日 5/11 昼食 A社 が未確定（締切まで 1h 50m）",
    impact: "対象 14 名・締切後の確定不可、配膳遅延の恐れ",
    actionLabel: "確定する",
    actionHref: "/meals/2026-05-11",
  },
  {
    id: "A-002",
    type: "復帰漏れ",
    severity: "高",
    detectedAt: "2026-05-11 08:00",
    message: "鈴木 タケ 様 が退院済みなのに食事停止中",
    targetUserId: "U2024-0002",
    impact: "退院日 5/13 予定、食事復帰の登録が必要",
    actionLabel: "ステータス変更",
    actionHref: "/users/U2024-0002",
  },
  {
    id: "A-003",
    type: "在庫不足",
    severity: "中",
    detectedAt: "2026-05-10 14:05",
    message: "おむつ L サイズ：残 24 / 最低 40",
    impact: "5/15 頃に枯渇見込み",
    actionLabel: "発注候補へ",
    actionHref: "/goods",
  },
  {
    id: "A-004",
    type: "在庫不足",
    severity: "高",
    detectedAt: "2026-05-10 14:05",
    message: "使い捨て手袋 M：残 4 / 最低 10（切迫）",
    impact: "3 日以内に枯渇見込み",
    actionLabel: "発注候補へ",
    actionHref: "/goods",
  },
  {
    id: "A-005",
    type: "書類期限間近",
    severity: "中",
    detectedAt: "2026-05-09 06:00",
    message: "鈴木 タケ 様 介護保険証 期限 2026-06-15",
    targetUserId: "U2024-0002",
    impact: "35 日後に期限切れ、更新手続き要",
    actionLabel: "書類へ",
    actionHref: "/documents",
  },
  {
    id: "A-006",
    type: "請求漏れ疑い",
    severity: "高",
    detectedAt: "2026-05-11 06:00",
    message: "高橋 正一 様 5月分 食費が ¥0（食事は出ています）",
    targetUserId: "U2024-0003",
    impact: "請求額が約 ¥38,000 漏れている可能性",
    actionLabel: "請求明細へ",
    actionHref: "/billing/U2024-0003",
  },
];

// ============ タスク ============

export type Task = {
  id: string;
  title: string;
  category: "請求" | "ケア" | "書類" | "連絡" | "棚卸" | "その他";
  userId?: string;
  userName?: string;
  assignee: string;
  due: string;
  priority: "高" | "中" | "低";
  status: "未対応" | "対応中" | "完了" | "見送り";
};

export const tasks: Task[] = [
  { id: "T-001", title: "病院連絡（入院状況確認）", category: "連絡", userId: "U2024-0002", userName: "鈴木 タケ", assignee: "田中", due: "2026-05-12", priority: "高", status: "対応中" },
  { id: "T-002", title: "ケアマネ面談調整", category: "ケア", userId: "U2024-0001", userName: "佐藤 ヨシ子", assignee: "田中", due: "2026-05-15", priority: "中", status: "未対応" },
  { id: "T-003", title: "受給者証コピー回収", category: "書類", userId: "U2024-0007", userName: "中村 義雄", assignee: "鈴木", due: "2026-05-20", priority: "中", status: "未対応" },
  { id: "T-004", title: "退去精算準備", category: "請求", assignee: "田中", due: "2026-05-25", priority: "中", status: "未対応" },
  { id: "T-005", title: "5月分 請求書作成・送付", category: "請求", assignee: "田中", due: "2026-05-31", priority: "高", status: "未対応" },
];

// ============ お知らせ ============

export type Announcement = {
  id: string;
  title: string;
  body: string;
  postedBy: string;
  postedAt: string;
  pinned: boolean;
};

export const announcements: Announcement[] = [
  {
    id: "AN-001",
    title: "【全スタッフへ】5/15 から B 社昼食締切が 10:30 に変更",
    body: "5/15 より B 社の昼食発注締切が 11:00 → 10:30 に変更されます。定期キャンセル登録は前日 18:00 までに行ってください。",
    postedBy: "施設長",
    postedAt: "2026-05-08 17:00",
    pinned: true,
  },
  {
    id: "AN-002",
    title: "入院・外泊登録の運用について",
    body: "利用者の入院・外泊が発生したら、必ず当日中に利用者詳細からステータス変更を行ってください。食事は自動で停止されます。",
    postedBy: "事務長",
    postedAt: "2026-05-01 09:00",
    pinned: false,
  },
];

// ============ アクティビティ ============

export type Activity = {
  id: string;
  at: string;
  staff: string;
  message: string;
};

export const activities: Activity[] = [
  { id: "AC-001", at: "2026-05-11 08:40", staff: "田中 太郎", message: "本日の朝食発注を確定しました（パン 18 / ジュース 12）" },
  { id: "AC-002", at: "2026-05-10 17:20", staff: "鈴木 花子", message: "鈴木 タケ 様 のステータスを「入居中」→「入院中」に変更（期間 5/5〜）" },
  { id: "AC-003", at: "2026-05-10 14:05", staff: "システム", message: "在庫アラート：おむつ Lサイズが最低在庫を下回りました" },
  { id: "AC-004", at: "2026-05-10 11:30", staff: "田中 太郎", message: "5/10 昼食 A社 発注を確定（14食）" },
  { id: "AC-005", at: "2026-05-09 09:12", staff: "鈴木 花子", message: "加藤 一郎 様 のステータスを「一時帰宅」に変更（5/9〜5/11）" },
];

// ============ 申し送り ============

export type Handover = {
  id: string;
  at: string;
  staff: string;
  userName?: string;
  content: string;
  important?: boolean;
};

export const handovers: Handover[] = [
  { id: "H-001", at: "2026-05-11 09:40", staff: "田中", userName: "鈴木 タケ", content: "退院日が 5/13 に確定。当日は午後迎え予定。" },
  { id: "H-002", at: "2026-05-11 09:15", staff: "鈴木", userName: "山本 美子", content: "本日は通所キャンセルですが、来週木曜は出席されるとのこと。" },
  { id: "H-003", at: "2026-05-11 08:30", staff: "看護師 加藤", userName: "小林 ハル", content: "水分量管理徹底。本日は朝で 350ml 摂取済み。", important: true },
];

// ============ 締切までの残時間（モック・本日 5/11 09:30 想定） ============

export function timeToDeadline(deadlineHHMM: string): { hours: number; minutes: number; total: number } {
  // モック現在時刻：09:30
  const [dh, dm] = deadlineHHMM.split(":").map(Number);
  const deadlineMins = dh * 60 + dm;
  const nowMins = 9 * 60 + 30;
  const diff = deadlineMins - nowMins;
  if (diff <= 0) return { hours: 0, minutes: 0, total: 0 };
  return { hours: Math.floor(diff / 60), minutes: diff % 60, total: diff };
}
