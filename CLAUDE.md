# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

**B-CareHub** — Care home (住宅型有料老人ホーム) management system, currently a Next.js App Router prototype with **localStorage persistence** (no backend). UI is in Japanese. Production data model (PostgreSQL+Prisma) is described in `要件定義書_B-CareHub.md` (1700+ lines) — treat the markdown spec docs in the repo root as the source of truth for business rules.

Deployed to Vercel automatically on push to `main` (GitHub: rikihisa-alt/B-CareHub).

## Commands

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build — also acts as TypeScript + lint check; run this to verify changes
npm run start    # production server
npm run lint     # Next.js lint
```

There is no test suite. Verify changes by running `npm run build` (Next.js fails the build on TS/lint errors).

Path alias: `@/*` → repo root. Always import with `@/lib/...`, `@/components/...`.

## Architecture: the two layers

The whole app is structured around a strict **`lib/data.ts` (pure) → `lib/store.ts` (stateful)** split. Understanding this split is required to be productive.

### `lib/data.ts` — pure types + pure functions

- **All entity types** (`User`, `Task`, `Handover`, `BillingLineItem`, `RegularService`, `BillingProfile`, `UtilityBill`, `Room`, `DailyGood`, etc.) live here.
- **All business constants** (`HOUSING_PRESET` ¥62,000 default rent breakdown, `DAILY_SERVICE_PRESETS` 7 daily-service items, `ON_DEMAND_PRESETS`, `REIMBURSEMENT_KINDS`, `REIMBURSEMENT_FEE` ¥100, `CARE_LIMIT_UNITS` per care level, `DEFAULT_MEAL_PRICES`) live here.
- **All computation functions are pure** — they take state as arguments, never read storage:
  - `computeUserBilling(userId, ym, services, lineItems)` — the central billing aggregator
  - `generateProfileLineItems(profile, user, ym)` — housing + daily services auto-lines
  - `generateMealLineItems(user, ym, prices, singleCancellations)` — daily meal auto-lines
  - `utilityBillsToLineItems(bills, room, ym, facilityId)` — utility auto-lines
  - `buildMonthMealCounts(year, month, users, ...)` — meal calendar aggregation
  - `prorateHousing(amount, ym, moveInDate)` — move-in month day-proration
  - `toMajorCategory(cat)` / `groupBillingByMajor(items)` — 5-category invoice grouping

**Never put React hooks or browser APIs in `data.ts`.**

### `lib/store.ts` — client-side persistence

- `useStored<T>(key, initial)` is the generic hook backing every entity. It returns `[state, setter, hydrated]` and is **hydration-safe**: starts with `initial` server-side and replaces from `localStorage` on mount. Use the `hydrated` flag when you can't render `not found` until persistence is loaded (e.g. dynamic `[id]` routes).
- Every persisted collection has a dedicated wrapper: `useUsers`, `useTasks`, `useHandovers`, `useAnnouncements`, `useGoods`, `useDocuments`, `useFacilities`, `useStaff`, `useRegularServices`, `useBillingLineItems`, `useBillingProfiles`, `useUtilityBills`, `useMealConfirmations`, `useSingleCancellations`, `useMealPrices`, `useBillingConfirmations`, `useRooms`, `useActivities`.
- localStorage prefix is `bch:v1:`. When changing a schema in a non-back-compatible way, either migrate on read or bump the prefix.
- Helpers: `logActivity(message, staff?)` — call after every meaningful mutation; `genId(prefix)` for IDs; `todayIso()` / `nowIso()`; `filterByFacility(items, currentId)` for the multi-facility filter; `clearAllData()` / `exportAllData()` / `importAllData(json)` for backup/reset.

## App router conventions

- **Every page is `"use client"`** because it reads from `localStorage` via the store hooks.
- **Dynamic routes (`/users/[id]`, `/meals/[date]`) do not use `generateStaticParams`.** They're server-rendered on demand and look up the entity client-side via `useParams()` from `next/navigation` + the store. When the entity might not exist yet (still hydrating), guard with the `hydrated` flag from `useStored`.
- For complex tabbed pages, the route file is a thin shell that delegates to a co-located component file: `app/users/[id]/page.tsx` → `app/users/[id]/UserDetail.tsx` (the ~1200-line core), `app/meals/[date]/page.tsx` → `MealDayDetail.tsx`.

## Multi-facility model (cross-cutting)

Every facility-scoped entity has an optional `facilityId`. The current selection is `useCurrentFacilityId()` where `null` means "全施設" (all facilities aggregated). The standard pattern in every list page:

```ts
const [all] = useUsers();
const [currentId] = useCurrentFacilityId();
const visible = useMemo(() => filterByFacility(all, currentId), [all, currentId]);
```

When creating an entity, set `facilityId = currentId ?? facilities[0]?.id`. In all-facilities mode, show a `<FacilityLabel facilityId={...} />` next to entity names.

Meal/billing confirmations are scoped per facility via composite keys: `${facilityId}_${ym}_${date}` etc.

## Billing system (core domain)

Invoice display uses **5 major categories** (`MajorCategory`): 住居費等 / 介護サービス利用料 / 日常サービス利用料 / 立替金 / その他. Each `BillingLineItem` has a granular `category: BillingCategory` mapped via `toMajorCategory()`.

A user's monthly total is the union of:
1. **Profile auto-lines** — `generateProfileLineItems(profile, user, ym)`: housing breakdown (5 items, day-prorated in move-in month) + daily services that are `true` in `profile.dailyServices`.
2. **`RegularService`** records — per-user month-recurring entries.
3. **Manual `BillingLineItem`** records — anything the office staff adds in the user detail "請求" tab.
4. **Auto meal lines** — `generateMealLineItems` from `User.meal` × `MealPrice` × single cancellations.
5. **Auto utility lines** — `utilityBillsToLineItems` for `UtilityBill` records with `billToUser: true` matching the user's room.

These are all fed into `computeUserBilling(userId, ym, services, [...lineItems, ...profileItems, ...utilityItems, ...mealItems])` which returns `{ items, breakdown, total }`. The `/billing` list page, the user detail tab, and the invoice preview all use this same function.

Reimbursement (立替金) UX rule: when adding a manual line with `category: "立替"`, the modal asks 定期 vs 臨時. Selecting 臨時 auto-appends a second `BillingLineItem` for `立替事務費 ¥100`.

## Invoice printing

`components/invoice-preview.tsx` exports three pieces:

- `InvoiceContent` — the paper itself (wrapped in `.invoice-paper`). No modal chrome. Renders the 5-major-category summary table, then per-category detail tables, then totals + footer salutations.
- `InvoicePreview` — single-invoice modal wrapping `InvoiceContent` in `.print-area` + a print button.
- `InvoiceBulkPrint` — multiple `InvoiceContent` in one `.print-area`. Each invoice is `page-break-after: always` so the browser prints one per page.

Print CSS hides everything except `.print-area`. Toolbars use the global `no-print` utility class. When adding new chrome that should be hidden on print, add `no-print`.

## UI primitives & conventions

- **Shared components** in `components/ui/`: `Modal`/`Drawer` (share `useDialogClose`), `StatusBadge`/`Pill`/`PriorityPill`/`Severity`, `FilterChip`/`Segment`, `Field`/`Input`/`Select`, `Th`, `ModalFooter`, `MealStateChip`. Prefer these over re-rolling.
- **Toast** is global via `window` CustomEvent: `import { toast } from "@/components/ui/toast"`, then `toast("...", "ok"|"info"|"warn"|"err")`. `ToastContainer` is mounted once in `app/layout.tsx`.
- **CSV** in/out: `downloadCsv(filename, rows)` and `parseCsv(text)` in `components/ui/helpers.ts` — supports BOM, quoted fields, CRLF.
- **Tailwind palette** in `tailwind.config.ts`: `brand` (teal), `ink` (grays), `ok`/`warn`/`err`/`info`. Don't introduce new color scales without updating the config. The `num` class enables tabular-nums; use it on all numeric cells/values.
- Page-header pattern is consistent across pages: `<h1>` 22px + 12px subtitle on the left, button group on the right. New pages should follow this.

## After a meaningful mutation

1. Call `logActivity("...")` — populates `/inbox/activity` and `/admin/audit-logs`.
2. `toast("...", "ok")` on success.
3. Money/quantities are integers (JPY, no decimals). Dates are `YYYY-MM-DD`, periods are `YYYY-MM`.

## Source-of-truth docs in repo root

For business rules / domain decisions, consult these markdown files before guessing:

- `要件定義書_B-CareHub.md` — full requirements spec, including target DB schema
- `設計提案書_v2.md` — UI/UX design proposal
- `ダッシュボード再設計_v3.md` — dashboard redesign spec

The implementation has diverged in places (e.g. real DB is not yet wired); when uncertain, the spec describes the production-target behavior.

## Working rules for this user

- 初心者にも分かるように、専門用語を使う場合は簡単な補足を入れる
- 一度に大量の手順を出さず、基本的に1ステップずつ案内する
- コードを変更する前に、必ず変更方針を説明する
- 仕様にない機能を勝手に追加しない
- 既存機能を壊さないことを最優先にする
- 修正対象ファイルは、原則として全文を提示する
- 部分修正の場合でも、どのファイルのどの箇所かを明確にする
- 実装後は、変更内容・確認手順・想定される注意点を必ず説明する
- UIを変更する場合は、生成AIっぽいカード量産、安いグラデーション、過度な角丸、意味のない装飾を避ける
- B-CareHubは業務システムなので、見た目よりも情報の分かりやすさ、操作ミスの防止、現場での使いやすさを優先する
