"use client";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Field, Input, ModalFooter } from "@/components/ui/primitives";
import { clearAllData, exportAllData, importAllData, logActivity, useFacility, type Facility } from "@/lib/store";

const CATEGORIES = [
  { group: "食事", items: [
    { name: "食事業者", desc: "業者名、種別、配達ルール（土曜まとめ等）" },
    { name: "食事区分・形態", desc: "朝/昼/夕、普通・きざみ・ミキサー等" },
    { name: "パン・ジュース商品", desc: "種類・単価" },
    { name: "食費単価", desc: "朝食・昼食(業者別)・夕食(業者別)・パン・ジュース" },
    { name: "キャンセル理由", desc: "通院、通所、家族外出、体調不良 等" },
  ]},
  { group: "請求", items: [
    { name: "請求項目", desc: "家賃、共益費、水道光熱費、管理費、生活支援費..." },
    { name: "固定費 デフォルト", desc: "部屋タイプ別の標準額" },
    { name: "支払方法", desc: "口座振替、銀行振込、現金、その他" },
    { name: "税区分", desc: "課税/非課税/不課税" },
  ]},
  { group: "業務管理", items: [
    { name: "書類種別", desc: "保険証、受給者証、契約書、訪問看護指示書..." },
    { name: "タスク種別", desc: "請求、ケア、書類、連絡、棚卸、その他" },
    { name: "関係機関", desc: "ケアマネ、医療機関、訪問看護ST、訪問介護事業所" },
    { name: "祝日", desc: "祝日カレンダー（食事配達ルール用）" },
  ]},
];

export default function MastersPage() {
  const [facility, setFacility] = useFacility();
  const [editing, setEditing] = useState<string | null>(null);
  const [facilityOpen, setFacilityOpen] = useState(false);
  const [facilityDraft, setFacilityDraft] = useState<Facility>(facility);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [exportText, setExportText] = useState("");

  function openExport() {
    setExportText(exportAllData());
    setExportOpen(true);
  }

  function copyExport() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(exportText);
      toast("クリップボードへコピーしました", "ok");
    }
  }

  function downloadExport() {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `b-care-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("バックアップをダウンロードしました", "ok");
  }

  function doImport() {
    const ok = importAllData(importText);
    if (ok) {
      logActivity("データをインポート");
      toast("インポートしました。ページを再読み込みします。", "ok");
      setImportOpen(false);
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast("JSON の形式が不正です", "err");
    }
  }

  function doReset() {
    clearAllData();
    toast("全データを削除しました。ページを再読み込みします。", "warn");
    setResetOpen(false);
    setTimeout(() => window.location.reload(), 800);
  }

  function saveFacility() {
    if (!facilityDraft.name.trim()) {
      toast("施設名を入力してください", "warn");
      return;
    }
    setFacility(facilityDraft);
    logActivity(`施設情報を更新（${facilityDraft.name}）`);
    toast("施設情報を保存しました", "ok");
    setFacilityOpen(false);
  }

  function openFacility() {
    setFacilityDraft(facility);
    setFacilityOpen(true);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">マスタ・データ管理</h1>
          <p className="text-[12px] text-ink-500 mt-0.5">業務マスタの編集と、データのバックアップ／復元／初期化。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openExport} className="btn">バックアップ書出</button>
          <button onClick={() => setImportOpen(true)} className="btn">インポート</button>
          <button onClick={() => setResetOpen(true)} className="btn text-err-700">全データ削除</button>
        </div>
      </header>

      <div className="card p-3 text-[12px] text-ink-600 bg-info-50/40 border-l-[3px] border-info-600">
        マスタ変更は食事発注・請求の計算に直接影響します。確定済の発注・請求は再計算されないため、月の途中での単価変更等は影響範囲をご確認ください。
        <br />
        運用データはこの端末のブラウザに保存されます。定期的にバックアップを推奨します。
      </div>

      {/* 施設情報（独立カード・編集可） */}
      <section>
        <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider mb-2">施設情報</h2>
        <div className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[13px] flex-1">
              <div className="grid grid-cols-3 gap-2"><dt className="text-[11px] text-ink-500">施設名</dt><dd className="col-span-2 font-semibold text-ink-900">{facility.name || <span className="text-ink-400">未設定</span>}</dd></div>
              <div className="grid grid-cols-3 gap-2"><dt className="text-[11px] text-ink-500">定員</dt><dd className="col-span-2 num">{facility.capacity ?? "—"} 室</dd></div>
              <div className="grid grid-cols-3 gap-2"><dt className="text-[11px] text-ink-500">住所</dt><dd className="col-span-2">{facility.address || <span className="text-ink-400">未設定</span>}</dd></div>
              <div className="grid grid-cols-3 gap-2"><dt className="text-[11px] text-ink-500">電話</dt><dd className="col-span-2 num">{facility.phone || <span className="text-ink-400">未設定</span>}</dd></div>
            </dl>
            <button onClick={openFacility} className="btn btn-primary shrink-0">施設情報を編集</button>
          </div>
        </div>
      </section>

      {CATEGORIES.map((cat) => (
        <section key={cat.group}>
          <h2 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider mb-2">{cat.group}</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-600">
                <tr className="text-left">
                  <th className="px-4 py-2 text-[11px] font-semibold">マスタ名</th>
                  <th className="px-4 py-2 text-[11px] font-semibold">説明</th>
                  <th className="px-4 py-2 text-[11px] font-semibold w-24 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((it) => (
                  <tr key={it.name} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                    <td className="px-4 py-2.5 font-medium text-ink-900">{it.name}</td>
                    <td className="px-4 py-2.5 text-[12px] text-ink-600">{it.desc}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button onClick={() => setEditing(it.name)} className="btn btn-sm btn-arrow">編集</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="text-[11px] text-ink-500 pt-2 border-t border-ink-200">
        ※ 施設情報以外のマスタ編集 UI は簡略表示です。商用版では各マスタ別に専用編集画面（一括編集 / 履歴 / インポート）を提供します。
        <Link href="/admin/audit-logs" className="text-brand-700 hover:underline ml-2">監査ログを見る →</Link>
      </div>

      {/* 施設情報 編集 */}
      <Modal
        open={facilityOpen}
        onClose={() => setFacilityOpen(false)}
        title="施設情報の編集"
        footer={<ModalFooter onCancel={() => setFacilityOpen(false)} onConfirm={saveFacility} />}
      >
        <div className="space-y-3">
          <Field label="施設名（必須）">
            <Input value={facilityDraft.name} onChange={(e) => setFacilityDraft({ ...facilityDraft, name: e.target.value })} placeholder="例：あすか苑" />
          </Field>
          <Field label="定員（室数）">
            <Input type="number" value={facilityDraft.capacity ?? ""} onChange={(e) => setFacilityDraft({ ...facilityDraft, capacity: Number(e.target.value) || undefined })} className="num" placeholder="例：16" />
          </Field>
          <Field label="住所">
            <Input value={facilityDraft.address ?? ""} onChange={(e) => setFacilityDraft({ ...facilityDraft, address: e.target.value })} placeholder="例：◯◯県◯◯市..." />
          </Field>
          <Field label="電話">
            <Input value={facilityDraft.phone ?? ""} onChange={(e) => setFacilityDraft({ ...facilityDraft, phone: e.target.value })} placeholder="例：03-1234-5678" />
          </Field>
        </div>
        <p className="text-[11px] text-ink-500 mt-3">施設名はヘッダー・ダッシュボード・職員所属の表示に反映されます。</p>
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`${editing ?? ""} の編集`}
        size="lg"
        footer={<ModalFooter onCancel={() => setEditing(null)} onConfirm={() => { logActivity(`マスタ「${editing}」を更新`); toast(`${editing} を保存しました`, "ok"); setEditing(null); }} />}
      >
        <div className="text-[12px] text-ink-600 mb-3">このマスタの登録項目を編集します。実装プロトタイプでは編集 UI を簡略表示しています。</div>
        <textarea
          rows={6}
          className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[12px]"
          defaultValue={`# ${editing}\n# 1行1レコード（モック）`}
        />
      </Modal>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="データバックアップ（JSON）"
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setExportOpen(false)}
            onConfirm={downloadExport}
            cancelLabel="閉じる"
            confirmLabel="ファイルでダウンロード"
            extra={<button onClick={copyExport} className="btn btn-sm">クリップボードへコピー</button>}
          />
        }
      >
        <p className="text-[12px] text-ink-600 mb-2">現在のデータを JSON で書き出します。別 PC・別ブラウザへの移行や定期バックアップに利用してください。</p>
        <textarea readOnly value={exportText} rows={12} className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[11px]" />
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="データインポート"
        size="lg"
        footer={<ModalFooter onCancel={() => setImportOpen(false)} onConfirm={doImport} confirmLabel="インポート" />}
      >
        <div className="bg-warn-50 border-l-[3px] border-warn-600 rounded-r px-3 py-2 mb-3 text-[12px] text-warn-700">
          インポートすると、対応するエンティティの現データが上書きされます。
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={12}
          placeholder='バックアップした JSON を貼り付けてください'
          className="w-full px-3 py-2 border border-ink-200 rounded font-mono text-[11px]"
        />
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="全データを削除"
        footer={<ModalFooter onCancel={() => setResetOpen(false)} onConfirm={doReset} confirmLabel="削除を実行" />}
      >
        <div className="bg-err-50 border-l-4 border-err-600 rounded-r px-3 py-2 mb-3 text-[13px] text-err-700 font-semibold">
          ⚠ この操作は取り消せません。
        </div>
        <p className="text-[13px]">本端末のブラウザに保存されているすべての B-CareHub データ（利用者・食事・請求・タスク・申し送り・マスタ等）を削除します。</p>
        <p className="text-[12px] text-ink-500 mt-2">削除前にバックアップを書き出すことを推奨します。</p>
      </Modal>
    </div>
  );
}
