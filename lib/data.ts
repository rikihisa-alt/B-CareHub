// モックデータ層。MVP着手時にはDB(prisma)に差し替える前提のシェイプにしています。

export type Status = "入居中" | "入院中" | "外泊中" | "一時帰宅" | "退去済";
export type MealVendor = "A社" | "B社" | "なし";
export type MealForm = "普通食" | "きざみ" | "ミキサー" | "ペースト";

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
  meal: {
    breakfastBread: boolean;
    breakfastJuice: boolean;
    lunchVendor: MealVendor;
    dinnerVendor: MealVendor;
    form: MealForm;
  };
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
    meal: {
      breakfastBread: true,
      breakfastJuice: true,
      lunchVendor: "A社",
      dinnerVendor: "B社",
      form: "きざみ",
    },
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 42000, goods: 6800, care: 18500, nursing: 0, advance: 1200, other: 0,
    },
    unpaidDocs: 0,
    openTasks: 1,
    note: "義歯あり。きざみ食。",
  },
  {
    id: "U2024-0002",
    name: "鈴木 タケ",
    kana: "スズキ タケ",
    room: "102",
    birthday: "1932-11-03",
    age: 92,
    gender: "女",
    status: "入院中",
    moveInDate: "2022-09-15",
    careLevel: "要介護4",
    keyPerson: { name: "鈴木 真理", relation: "次女", phone: "080-2345-6789" },
    meal: {
      breakfastBread: false,
      breakfastJuice: true,
      lunchVendor: "A社",
      dinnerVendor: "A社",
      form: "ミキサー",
    },
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 0, goods: 3200, care: 22400, nursing: 8900, advance: 0, other: 0,
    },
    unpaidDocs: 1,
    openTasks: 2,
    note: "5/5より◯◯病院入院中。食事停止中。",
  },
  {
    id: "U2024-0003",
    name: "高橋 正一",
    kana: "タカハシ ショウイチ",
    room: "103",
    birthday: "1942-07-21",
    age: 82,
    gender: "男",
    status: "入居中",
    moveInDate: "2024-01-10",
    careLevel: "要介護1",
    keyPerson: { name: "高橋 由美", relation: "長女", phone: "090-3456-7890" },
    meal: {
      breakfastBread: true,
      breakfastJuice: false,
      lunchVendor: "B社",
      dinnerVendor: "B社",
      form: "普通食",
    },
    monthlyBilling: {
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 38500, goods: 4400, care: 14200, nursing: 0, advance: 3800, other: 0,
    },
    unpaidDocs: 0,
    openTasks: 0,
  },
  {
    id: "U2024-0004",
    name: "田中 久子",
    kana: "タナカ ヒサコ",
    room: "104",
    birthday: "1935-02-28",
    age: 90,
    gender: "女",
    status: "外泊中",
    moveInDate: "2021-04-01",
    careLevel: "要介護3",
    keyPerson: { name: "田中 賢", relation: "長男", phone: "080-4567-8901" },
    meal: {
      breakfastBread: true,
      breakfastJuice: true,
      lunchVendor: "A社",
      dinnerVendor: "A社",
      form: "きざみ",
    },
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 36400, goods: 5200, care: 19800, nursing: 4200, advance: 0, other: 0,
    },
    unpaidDocs: 0,
    openTasks: 1,
    note: "5/10〜5/12 親族宅へ外泊。",
  },
  {
    id: "U2024-0005",
    name: "渡辺 健太郎",
    kana: "ワタナベ ケンタロウ",
    room: "201",
    birthday: "1940-09-15",
    age: 84,
    gender: "男",
    status: "入居中",
    moveInDate: "2023-08-22",
    careLevel: "要介護2",
    keyPerson: { name: "渡辺 美智子", relation: "妻", phone: "090-5678-9012" },
    meal: {
      breakfastBread: true,
      breakfastJuice: true,
      lunchVendor: "B社",
      dinnerVendor: "A社",
      form: "普通食",
    },
    monthlyBilling: {
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 44100, goods: 7800, care: 18200, nursing: 0, advance: 2400, other: 1500,
    },
    unpaidDocs: 0,
    openTasks: 0,
  },
  {
    id: "U2024-0006",
    name: "山本 美子",
    kana: "ヤマモト ヨシコ",
    room: "202",
    birthday: "1937-12-08",
    age: 87,
    gender: "女",
    status: "入居中",
    moveInDate: "2022-11-30",
    careLevel: "要介護2",
    keyPerson: { name: "山本 太郎", relation: "長男", phone: "080-6789-0123" },
    meal: {
      breakfastBread: false,
      breakfastJuice: true,
      lunchVendor: "A社",
      dinnerVendor: "B社",
      form: "きざみ",
    },
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 40600, goods: 6100, care: 18900, nursing: 0, advance: 0, other: 0,
    },
    unpaidDocs: 1,
    openTasks: 0,
    note: "毎週木曜 通所のため昼食キャンセル。",
  },
  {
    id: "U2024-0007",
    name: "中村 義雄",
    kana: "ナカムラ ヨシオ",
    room: "203",
    birthday: "1941-06-19",
    age: 83,
    gender: "男",
    status: "入居中",
    moveInDate: "2024-03-15",
    careLevel: "要介護3",
    keyPerson: { name: "中村 久美", relation: "長女", phone: "090-7890-1234" },
    meal: {
      breakfastBread: true,
      breakfastJuice: false,
      lunchVendor: "A社",
      dinnerVendor: "A社",
      form: "ミキサー",
    },
    monthlyBilling: {
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 41200, goods: 8800, care: 19800, nursing: 6300, advance: 0, other: 0,
    },
    unpaidDocs: 0,
    openTasks: 1,
  },
  {
    id: "U2024-0008",
    name: "小林 ハル",
    kana: "コバヤシ ハル",
    room: "204",
    birthday: "1934-08-30",
    age: 90,
    gender: "女",
    status: "入居中",
    moveInDate: "2021-07-12",
    careLevel: "要介護4",
    keyPerson: { name: "小林 千恵", relation: "次女", phone: "080-8901-2345" },
    meal: {
      breakfastBread: false,
      breakfastJuice: true,
      lunchVendor: "B社",
      dinnerVendor: "B社",
      form: "ペースト",
    },
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 43400, goods: 9200, care: 22100, nursing: 7800, advance: 0, other: 0,
    },
    unpaidDocs: 0,
    openTasks: 0,
  },
  {
    id: "U2024-0009",
    name: "加藤 一郎",
    kana: "カトウ イチロウ",
    room: "205",
    birthday: "1939-03-04",
    age: 86,
    gender: "男",
    status: "一時帰宅",
    moveInDate: "2023-02-20",
    careLevel: "要介護2",
    keyPerson: { name: "加藤 みどり", relation: "長女", phone: "090-9012-3456" },
    meal: {
      breakfastBread: true,
      breakfastJuice: true,
      lunchVendor: "A社",
      dinnerVendor: "B社",
      form: "普通食",
    },
    monthlyBilling: {
      rent: 85000, common: 15000, utility: 12000, admin: 5000,
      meal: 32200, goods: 4600, care: 17800, nursing: 0, advance: 0, other: 0,
    },
    unpaidDocs: 0,
    openTasks: 0,
    note: "5/9〜5/11 家族と外出。",
  },
  {
    id: "U2024-0010",
    name: "吉田 トモ",
    kana: "ヨシダ トモ",
    room: "206",
    birthday: "1936-10-25",
    age: 88,
    gender: "女",
    status: "入居中",
    moveInDate: "2022-06-08",
    careLevel: "要介護3",
    keyPerson: { name: "吉田 浩二", relation: "長男", phone: "080-0123-4567" },
    meal: {
      breakfastBread: true,
      breakfastJuice: true,
      lunchVendor: "A社",
      dinnerVendor: "A社",
      form: "きざみ",
    },
    monthlyBilling: {
      rent: 80000, common: 15000, utility: 12000, admin: 5000,
      meal: 41800, goods: 7200, care: 19500, nursing: 0, advance: 1800, other: 0,
    },
    unpaidDocs: 0,
    openTasks: 1,
  },
];

export function totalOf(u: User): number {
  const b = u.monthlyBilling;
  return b.rent + b.common + b.utility + b.admin + b.meal + b.goods + b.care + b.nursing + b.advance + b.other;
}

export function jpy(n: number): string {
  return "¥" + n.toLocaleString("ja-JP");
}

// ------- 食事カレンダー用ロジック（モック簡易版） -------

export const HOLIDAYS = ["2026-05-03", "2026-05-04", "2026-05-05"];

export type DayMealCount = {
  date: string;
  weekday: number; // 0=日, 6=土
  isHoliday: boolean;
  bread: number;
  juice: number;
  lunchA: number;
  lunchB: number;
  dinnerA: number;
  dinnerB: number;
  cancelCount: number;
  adjustments: number;
  confirmed: boolean;
  noteFlag: boolean;
};

export function buildMonthMealCounts(year: number, month: number): DayMealCount[] {
  const lastDay = new Date(year, month, 0).getDate();
  const result: DayMealCount[] = [];

  // 期間キャンセル（鈴木さん 入院中、加藤さん 5/9-11 一時帰宅、田中さん 5/10-12 外泊）
  const cancelInPatient = (uid: string, d: Date) => {
    if (uid === "U2024-0002") return true;
    const ymd = d.toISOString().slice(0, 10);
    if (uid === "U2024-0009" && ymd >= "2026-05-09" && ymd <= "2026-05-11") return true;
    if (uid === "U2024-0004" && ymd >= "2026-05-10" && ymd <= "2026-05-12") return true;
    return false;
  };
  // 定期キャンセル：山本さん 木曜の昼
  const cancelRegular = (uid: string, weekday: number, mealType: "lunch") =>
    uid === "U2024-0006" && weekday === 4 && mealType === "lunch";

  const activeUsers = users.filter((u) => u.status !== "退去済");

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    const ymd = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = date.getDay();
    const isHoliday = HOLIDAYS.includes(ymd) || weekday === 0;
    const isSaturday = weekday === 6;

    let bread = 0, juice = 0, lunchA = 0, lunchB = 0, dinnerA = 0, dinnerB = 0, cancelCount = 0;

    activeUsers.forEach((u) => {
      const sick = cancelInPatient(u.id, date);
      if (sick) {
        // 入院・外泊・一時帰宅 → 全食キャンセル
        if (u.meal.breakfastBread) cancelCount++;
        if (u.meal.breakfastJuice) cancelCount++;
        if (u.meal.lunchVendor !== "なし") cancelCount++;
        if (u.meal.dinnerVendor !== "なし") cancelCount++;
        return;
      }
      // 朝
      if (u.meal.breakfastBread) bread++;
      if (u.meal.breakfastJuice) juice++;
      // 昼
      const lunchCanceled = cancelRegular(u.id, weekday, "lunch");
      if (!lunchCanceled) {
        if (u.meal.lunchVendor === "A社") lunchA++;
        else if (u.meal.lunchVendor === "B社") lunchB++;
      } else {
        cancelCount++;
      }
      // 夕
      if (u.meal.dinnerVendor === "A社") dinnerA++;
      else if (u.meal.dinnerVendor === "B社") dinnerB++;
    });

    // 土曜日に日曜分を加算する業者ルール：A社のみ昼夕とも翌日分を加える
    let noteFlag = false;
    if (isSaturday) {
      const sundayDate = new Date(year, month - 1, d + 1);
      const sundayYmd = `${year}-${String(month).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
      // 翌日が祝日でも日曜でも、A社は土曜に積む
      activeUsers.forEach((u) => {
        const sick = cancelInPatient(u.id, sundayDate);
        if (sick) return;
        if (u.meal.lunchVendor === "A社") lunchA++;
        if (u.meal.dinnerVendor === "A社") dinnerA++;
      });
      noteFlag = true;
    }

    // 日曜のA社は配達なし（既に土曜に積んだ）
    if (weekday === 0) {
      lunchA = 0;
      dinnerA = 0;
    }

    result.push({
      date: ymd,
      weekday,
      isHoliday,
      bread, juice, lunchA, lunchB, dinnerA, dinnerB,
      cancelCount,
      adjustments: 0,
      confirmed: d <= 10, // 例：10日までは確定済み
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
