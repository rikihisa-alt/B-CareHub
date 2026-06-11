"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  jpy, emptyUserDraft, emptyBilling, computeUserBilling,
  generateProfileLineItems, generateMealLineItems, utilityBillsToLineItems, emptyBillingProfile,
  type User,
} from "@/lib/data";
import {
  useUsers, useFacilities, useCurrentFacilityId,
  useRegularServices, useBillingLineItems, useBillingProfiles, useUtilityBills, useMealPrices, useSingleCancellations,
  logActivity, genId, todayIso, filterByFacility,
} from "@/lib/store";
import { FacilityLabel } from "@/components/facility-name";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { downloadCsv, doPrint, parseCsv } from "@/components/ui/helpers";
import { StatusBadge, Pill, FilterChip, Field, Input, Select, Th, ModalFooter } from "@/components/ui/primitives";

type Filter = "all" | "active" | "hospital" | "away" | "left";

const careLevels = ["自立", "要支援1", "要支援2", "要介護1", "要介護2", "要介護3", "要介護4", "要介護5"];

export default function UsersPage() {
  const [users, setUsers] = useUsers();
  const [facilities] = useFacilities();
  const [currentFacilityId] = useCurrentFacilityId();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<{ ok: User[]; errors: string[] } | null>(null);
  const defaultFacilityId = currentFacilityId ?? facilities[0]?.id;
  const [draft, setDraft] = useState<Omit<User, "id">>(emptyUserDraft(defaultFacilityId));

  const scopedUsers = useMemo(() => filterByFacility(users, currentFacilityId), [users, currentFacilityId]);

  // 今月請求予定：利用者詳細・月次請求と同じ計算式で算出
  const [services] = useRegularServices();
  const [lineItems] = useBillingLineItems();
  const [profiles] = useBillingProfiles();
  const [utilityBills] = useUtilityBills();
  const [mealPrices] = useMealPrices();
  const [singleCancellations] = useSingleCancellations();
  const ymNow = todayIso().slice(0, 7);
  const monthlyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    scopedUsers.forEach((u) => {
      const profile = profiles.find((p) => p.userId === u.id) ?? emptyBillingProfile(u.id, u.facilityId);
      const profileItems = generateProfileLineItems(profile, u, ymNow);
      const utilItems = utilityBillsToLineItems(utilityBills, u.room, ymNow, u.facilityId).map((it) => ({ ...it, userId: u.id }));
      const mealItems = generateMealLineItems(u, ymNow, mealPrices, singleCancellations);
      map[u.id] = computeUserBilling(u.id, ymNow, services, [...lineItems, ...profileItems, ...utilItems, ...mealItems]).total;
    });
    return map;
  }, [scopedUsers, profiles, services, lineItems, utilityBills, mealPrices, singleCancellations, ymNow]);

  const list = useMemo(() => scopedUsers.filter((u) => {
    if (filter === "active" && u.status !== "入居中") return false;
    if (filter === "hospital" && u.status !== "入院中") return false;
    if (filter === "away" && !["外泊中", "一時帰宅"].includes(u.status)) return false;
    if (filter === "left" && u.status !== "退去済") return false;
    if (q && !`${u.name}${u.kana}${u.room}`.includes(q)) return false;
    return true;
  }), [scopedUsers, filter, q]);

  const counts = {
    active: scopedUsers.filter((u) => u.status === "入居中").length,
    hospital: scopedUsers.filter((u) => u.status === "入院中").length,
    overnight: scopedUsers.filter((u) => u.status === "外泊中").length,
    homeVisit: scopedUsers.filter((u) => u.status === "一時帰宅").length,
  };

  function downloadTemplate() {
    downloadCsv("利用者一括登録テンプレート.csv", [
      ["氏名", "フリガナ", "部屋", "生年月日", "性別", "介護度", "入居日", "キーパーソン氏名", "キーパーソン続柄", "キーパーソン電話", "朝パン(1/0)", "朝ジュース(1/0)", "昼業者(A社/B社/なし)", "夕業者(A社/B社/なし)", "食事形態", "飲水形態"],
      ["山田 太郎", "ヤマダ タロウ", "101", "1940-05-12", "男", "要介護2", "2025-04-01", "山田 花子", "妻", "090-1234-5678", "1", "1", "A社", "B社", "普通食", "常水"],
      ["鈴木 ハナ", "スズキ ハナ", "102", "1935-09-03", "女", "要介護3", "2024-06-15", "鈴木 一郎", "長男", "080-2345-6789", "0", "1", "なし", "A社", "きざみ", "とろみ薄"],
    ]);
  }

  function parseImport() {
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      toast("CSV が空です", "warn");
      return;
    }
    const [header, ...dataRows] = rows;
    const idx = (name: string) => header.findIndex((h) => h.trim() === name);
    const iName = idx("氏名"), iKana = idx("フリガナ"), iRoom = idx("部屋");
    if (iName < 0 || iKana < 0 || iRoom < 0) {
      toast("ヘッダ行に「氏名」「フリガナ」「部屋」が必要です", "err");
      return;
    }
    const iBirthday = idx("生年月日"), iGender = idx("性別"), iCare = idx("介護度"), iMoveIn = idx("入居日");
    const iKpName = idx("キーパーソン氏名"), iKpRel = idx("キーパーソン続柄"), iKpPhone = idx("キーパーソン電話");
    const iBread = idx("朝パン(1/0)"), iJuice = idx("朝ジュース(1/0)");
    const iLunch = idx("昼業者(A社/B社/なし)"), iDinner = idx("夕業者(A社/B社/なし)");
    const iForm = idx("食事形態"), iFluid = idx("飲水形態");

    const ok: User[] = [];
    const errors: string[] = [];

    dataRows.forEach((row, i) => {
      const rowNo = i + 2; // ヘッダ込み
      const name = row[iName]?.trim();
      const kana = row[iKana]?.trim();
      const room = row[iRoom]?.trim();
      if (!name || !kana) { errors.push(`${rowNo}行目：氏名・フリガナは必須`); return; }
      if (room && !/^[A-Za-z0-9-]+$/.test(room)) { errors.push(`${rowNo}行目：部屋「${room}」は半角英数字とハイフンのみ`); return; }
      const birthday = (iBirthday >= 0 ? row[iBirthday] : "")?.trim() || "";
      let age = 0;
      if (birthday) age = new Date().getFullYear() - new Date(birthday).getFullYear();
      const gender = ((iGender >= 0 ? row[iGender] : "")?.trim() || "女") as User["gender"];
      const care = (iCare >= 0 ? row[iCare] : "")?.trim() || "要介護1";
      const moveIn = (iMoveIn >= 0 ? row[iMoveIn] : "")?.trim() || "";
      const u: User = {
        id: genId("U"),
        facilityId: defaultFacilityId,
        name, kana, room, birthday, age, gender,
        status: "入居中",
        moveInDate: moveIn,
        careLevel: care,
        keyPerson: {
          name: (iKpName >= 0 ? row[iKpName] : "")?.trim() || "",
          relation: (iKpRel >= 0 ? row[iKpRel] : "")?.trim() || "",
          phone: (iKpPhone >= 0 ? row[iKpPhone] : "")?.trim() || "",
        },
        meal: {
          breakfastBread: (iBread >= 0 ? row[iBread] : "0")?.trim() === "1",
          breakfastJuice: (iJuice >= 0 ? row[iJuice] : "0")?.trim() === "1",
          lunchVendor: parseVendor(iLunch >= 0 ? row[iLunch] : ""),
          dinnerVendor: parseVendor(iDinner >= 0 ? row[iDinner] : ""),
          form: ((iForm >= 0 ? row[iForm] : "")?.trim() || "普通食") as User["meal"]["form"],
          fluidForm: ((iFluid >= 0 ? row[iFluid] : "")?.trim() || "常水") as User["meal"]["fluidForm"],
          regularCancels: [],
        },
        allergies: [],
        restrictions: [],
        monthlyBilling: emptyBilling(),
        unpaidDocs: 0,
        openTasks: 0,
      };
      ok.push(u);
    });

    setCsvPreview({ ok, errors });
  }

  function commitImport() {
    if (!csvPreview) return;
    setUsers((cur) => [...cur, ...csvPreview.ok]);
    logActivity(`CSV取込で利用者 ${csvPreview.ok.length} 名を一括登録`);
    toast(`${csvPreview.ok.length} 名を登録しました`, "ok");
    setCsvOpen(false);
    setCsvText("");
    setCsvPreview(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      setCsvPreview(null);
    };
    reader.readAsText(file, "UTF-8");
  }

  function exportCsv() {
    downloadCsv(`利用者一覧_${new Date().toISOString().slice(0, 10)}.csv`, [
      ["部屋", "氏名", "フリガナ", "ステータス", "介護度", "今月請求予定"],
      ...list.map((u) => [u.room, u.name, u.kana, u.status, u.careLevel, monthlyTotals[u.id] ?? 0]),
    ]);
  }

  function saveNew() {
    if (!draft.name.trim() || !draft.kana.trim()) {
      toast("氏名・フリガナを入力してください", "warn");
      return;
    }
    if (draft.room && !/^[A-Za-z0-9-]+$/.test(draft.room)) {
      toast("部屋番号は半角英数字とハイフンのみ使用できます", "warn");
      return;
    }
    const id = genId("U");
    const user: User = { ...draft, id, facilityId: draft.facilityId ?? defaultFacilityId, monthlyBilling: emptyBilling() };
    setUsers((cur) => [...cur, user]);
    const facility = facilities.find((f) => f.id === user.facilityId);
    logActivity(`利用者「${draft.name}」を登録${facility ? `（${facility.name}）` : ""}`);
    toast("利用者を登録しました", "ok");
    setNewOpen(false);
    setDraft(emptyUserDraft(defaultFacilityId));
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">利用者一覧</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">
            {list.length} / {users.length} 名（入居中 {counts.active} ／ 入院 {counts.hospital} ／ 外泊 {counts.overnight} ／ 一時帰宅 {counts.homeVisit}）
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => { setCsvText(""); setCsvPreview(null); setCsvOpen(true); }} className="btn">CSV取込</button>
          <button onClick={exportCsv} className="btn" disabled={users.length === 0}>CSV出力</button>
          <button onClick={doPrint} className="btn">印刷</button>
          <button onClick={() => { setDraft(emptyUserDraft(defaultFacilityId)); setNewOpen(true); }} className="btn btn-primary">＋ 新規利用者</button>
        </div>
      </header>

      <div className="card p-3 flex flex-wrap gap-2 no-print">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>全件 ({users.length})</FilterChip>
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>入居中 ({counts.active})</FilterChip>
        <FilterChip active={filter === "hospital"} onClick={() => setFilter("hospital")}>入院中 ({counts.hospital})</FilterChip>
        <FilterChip active={filter === "away"} onClick={() => setFilter("away")}>外泊・一時帰宅 ({counts.overnight + counts.homeVisit})</FilterChip>
        <FilterChip active={filter === "left"} onClick={() => setFilter("left")}>退去済</FilterChip>
        <input
          type="search"
          placeholder="氏名・部屋番号で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto px-3 py-1.5 border border-ink-200 rounded text-[12px] w-64"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-50 border-b border-ink-200">
            <tr className="text-ink-600">
              <Th className="w-14">部屋</Th>
              <Th>氏名</Th>
              <Th className="w-24">ステータス</Th>
              <Th className="w-24">介護度</Th>
              <Th className="w-44" align="center">食事設定</Th>
              <Th className="w-32" align="right">今月請求予定</Th>
              <Th className="w-16" align="center">書類</Th>
              <Th className="w-16" align="center">タスク</Th>
              <Th className="w-20" align="center">操作</Th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center">
                  <div className="text-[13px] text-ink-500 mb-3">
                    {users.length === 0 ? "利用者がまだ登録されていません。" : "該当する利用者がありません。"}
                  </div>
                  {users.length === 0 && (
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => { setDraft(emptyUserDraft(defaultFacilityId)); setNewOpen(true); }} className="btn btn-primary">
                        ＋ 最初の利用者を登録
                      </button>
                      <button onClick={() => { setCsvText(""); setCsvPreview(null); setCsvOpen(true); }} className="btn">
                        CSVから一括登録
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
            {list.map((u) => (
              <tr key={u.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                <td className="px-3 py-3 num font-semibold text-ink-900">{u.room}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-ink-900 flex items-center gap-2">
                    {u.name}
                    {currentFacilityId === null && <FacilityLabel facilityId={u.facilityId} />}
                  </div>
                  <div className="text-[11px] text-ink-500">{u.kana} ・ {u.gender} {u.age}歳</div>
                </td>
                <td className="px-3 py-3"><StatusBadge s={u.status} /></td>
                <td className="px-3 py-3 text-ink-700">{u.careLevel}</td>
                <td className="px-3 py-3 text-center"><MealIcons u={u} /></td>
                <td className="px-3 py-3 text-right num font-semibold text-ink-900">{jpy(monthlyTotals[u.id] ?? 0)}</td>
                <td className="px-3 py-3 text-center">{u.unpaidDocs > 0 ? <Pill tone="warn">{u.unpaidDocs}</Pill> : <span className="text-ink-300">—</span>}</td>
                <td className="px-3 py-3 text-center">{u.openTasks > 0 ? <Pill tone="warn">{u.openTasks}</Pill> : <span className="text-ink-300">—</span>}</td>
                <td className="px-3 py-3 text-center">
                  <Link href={`/users/${u.id}`} className="btn btn-sm btn-arrow">確認</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="新規利用者の登録"
        size="lg"
        footer={<ModalFooter onCancel={() => setNewOpen(false)} onConfirm={saveNew} confirmLabel="登録" />}
      >
        <div className="bg-info-50/40 border-l-[3px] border-info-600 rounded-r px-3 py-2 mb-3 text-[12px] text-ink-800">
          💡 まずは <b>氏名・フリガナ・部屋・入居日</b> を入れて登録すれば OK です。<br />
          食事設定・アレルギー・固定費などは、登録後の詳細画面から追加できます。
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="氏名（必須）"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          <Field label="フリガナ（必須）"><Input value={draft.kana} onChange={(e) => setDraft({ ...draft, kana: e.target.value })} /></Field>
          <Field label="生年月日"><Input type="date" value={draft.birthday} onChange={(e) => {
            const b = e.target.value;
            const age = b ? new Date().getFullYear() - new Date(b).getFullYear() : 0;
            setDraft({ ...draft, birthday: b, age });
          }} className="num" /></Field>
          <Field label="性別">
            <Select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value as User["gender"] })}>
              <option>女</option><option>男</option><option>その他</option>
            </Select>
          </Field>
          <Field label="施設">
            <Select value={draft.facilityId ?? ""} onChange={(e) => setDraft({ ...draft, facilityId: e.target.value || undefined })}>
              {facilities.length === 0 && <option value="">— 未登録（マスタから施設を追加してください）—</option>}
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </Field>
          <Field label="部屋（半角英数字）" hint="例：101 / A2 / 2F-3 など">
            <Input
              value={draft.room}
              onChange={(e) => setDraft({ ...draft, room: e.target.value.replace(/[^A-Za-z0-9-]/g, "") })}
              placeholder="例：101"
              className="num"
              inputMode="text"
              pattern="[A-Za-z0-9-]*"
            />
          </Field>
          <Field label="入居日"><Input type="date" value={draft.moveInDate} onChange={(e) => setDraft({ ...draft, moveInDate: e.target.value })} className="num" /></Field>
          <Field label="介護度">
            <Select value={draft.careLevel} onChange={(e) => setDraft({ ...draft, careLevel: e.target.value })}>
              {careLevels.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="電話">
            <Input value={draft.keyPerson.phone} onChange={(e) => setDraft({ ...draft, keyPerson: { ...draft.keyPerson, phone: e.target.value } })} placeholder="本人連絡先（任意）" />
          </Field>
          <Field label="キーパーソン 氏名">
            <Input value={draft.keyPerson.name} onChange={(e) => setDraft({ ...draft, keyPerson: { ...draft.keyPerson, name: e.target.value } })} />
          </Field>
          <Field label="キーパーソン 続柄">
            <Input value={draft.keyPerson.relation} onChange={(e) => setDraft({ ...draft, keyPerson: { ...draft.keyPerson, relation: e.target.value } })} placeholder="長男・次女など" />
          </Field>
        </div>
        <div className="mt-3 text-[11px] text-ink-500">
          食事設定・アレルギー・固定費等は登録後、詳細画面から編集できます。
        </div>
      </Modal>

      {/* CSV 一括取込モーダル */}
      <Modal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        title="CSV 一括取込（利用者）"
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setCsvOpen(false)}
            onConfirm={csvPreview ? commitImport : parseImport}
            cancelLabel="閉じる"
            confirmLabel={csvPreview ? `${csvPreview.ok.length} 名を登録` : "プレビュー"}
            extra={<button onClick={downloadTemplate} className="btn btn-sm">テンプレートDL</button>}
          />
        }
      >
        <div className="bg-info-50/40 border-l-[3px] border-info-600 rounded-r px-3 py-2 mb-3 text-[12px] text-ink-800">
          💡 まずは「テンプレートDL」で書式をダウンロード → Excel 等で編集 → 下のファイル選択またはテキスト貼付 → 「プレビュー」で確認 → 「登録」で一括投入。
          <br />
          必須列：<b>氏名 / フリガナ / 部屋</b>　（部屋は半角英数字とハイフンのみ）
        </div>

        <div className="space-y-3">
          <Field label="CSV ファイル">
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="w-full text-[12px]" />
          </Field>
          <Field label="または貼り付け（テキスト）">
            <textarea
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setCsvPreview(null); }}
              rows={8}
              className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[11px]"
              placeholder="氏名,フリガナ,部屋,..."
            />
          </Field>

          {csvPreview && (
            <div className="card overflow-hidden">
              <div className="px-3 py-2 border-b border-ink-100 bg-ink-50/60 text-[12px] flex items-center justify-between">
                <span className="font-semibold">プレビュー：登録対象 {csvPreview.ok.length} 名 / エラー {csvPreview.errors.length} 件</span>
                <button onClick={() => setCsvPreview(null)} className="text-brand-700 text-[11px] hover:underline">クリア</button>
              </div>
              {csvPreview.errors.length > 0 && (
                <div className="px-3 py-2 bg-err-50 border-b border-err-200 text-[11px] text-err-700">
                  <div className="font-semibold mb-1">エラー（取込から除外）</div>
                  <ul className="list-disc list-inside">
                    {csvPreview.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-ink-50 sticky top-0">
                    <tr className="text-left text-ink-600">
                      <th className="px-2 py-1">氏名</th>
                      <th className="px-2 py-1">フリガナ</th>
                      <th className="px-2 py-1">部屋</th>
                      <th className="px-2 py-1">介護度</th>
                      <th className="px-2 py-1">入居日</th>
                      <th className="px-2 py-1">食事</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.ok.map((u) => (
                      <tr key={u.id} className="border-b border-ink-100">
                        <td className="px-2 py-1">{u.name}</td>
                        <td className="px-2 py-1">{u.kana}</td>
                        <td className="px-2 py-1 num">{u.room}</td>
                        <td className="px-2 py-1">{u.careLevel}</td>
                        <td className="px-2 py-1 num">{u.moveInDate}</td>
                        <td className="px-2 py-1 text-ink-600">
                          {u.meal.breakfastBread ? "🍞" : ""}{u.meal.breakfastJuice ? "🥤" : ""} 昼{u.meal.lunchVendor === "なし" ? "—" : u.meal.lunchVendor} 夕{u.meal.dinnerVendor === "なし" ? "—" : u.meal.dinnerVendor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function parseVendor(v: string | undefined): User["meal"]["lunchVendor"] {
  const t = (v ?? "").trim();
  if (t === "A社" || t === "B社") return t;
  return "なし";
}

function MealIcons({ u }: { u: User }) {
  const hasAny = u.meal.breakfastBread || u.meal.breakfastJuice || u.meal.lunchVendor !== "なし" || u.meal.dinnerVendor !== "なし";
  if (!hasAny) return <span className="text-ink-300 text-[11px]">未設定</span>;
  return (
    <div className="flex justify-center gap-2 text-[11px] text-ink-700">
      <span>朝 {u.meal.breakfastBread ? "パン" : "—"}{u.meal.breakfastJuice ? "・🥤" : ""}</span>
      <span className="text-ink-300">|</span>
      <span>昼 {u.meal.lunchVendor === "なし" ? "—" : u.meal.lunchVendor}</span>
      <span className="text-ink-300">|</span>
      <span>夕 {u.meal.dinnerVendor === "なし" ? "—" : u.meal.dinnerVendor}</span>
    </div>
  );
}
