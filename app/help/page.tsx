"use client";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-[22px] font-semibold text-ink-900">使い方ガイド</h1>
        <p className="text-[12px] text-ink-500 mt-0.5">B-CareHub の基本操作と画面のつながり方</p>
      </header>

      {/* はじめに */}
      <section className="card p-5">
        <h2 className="text-[16px] font-semibold text-ink-900 mb-3">1. はじめてのセットアップ</h2>
        <ol className="space-y-3 text-[13px] text-ink-800">
          <Step n={1} title="利用者を登録する" body="左メニュー「利用者」から「＋ 新規利用者」で氏名・部屋・キーパーソンを登録します。" />
          <Step n={2} title="食事設定を入力する" body="登録した利用者の詳細画面で「食事設定」をクリックし、朝のパン・ジュース、昼夕の業者（A社/B社）、食事形態を設定します。" />
          <Step n={3} title="アレルギー・禁忌を入力する" body="利用者詳細の赤い「アレルギー・禁忌」セクションで登録します。食札・配膳・業者発注に反映される最重要情報です。" />
          <Step n={4} title="本日の食事を確認" body="「食事発注」でカレンダーが表示されます。今日の日付をクリックすると業者別の対象者一覧が出るので、締切時間までに「発注確定」を押してください。" />
          <Step n={5} title="月次請求を確認" body="月末に「月次請求」へ。利用者×費目の表で当月分を確認し、「一括確定」を押すと自動再計算されなくなります。" />
        </ol>
      </section>

      {/* 各画面の役割 */}
      <section className="card p-5">
        <h2 className="text-[16px] font-semibold text-ink-900 mb-3">2. 各画面の役割</h2>
        <div className="space-y-3 text-[13px]">
          <Role icon="◉" name="ダッシュボード" href="/" desc="今日対応すべき項目が一目でわかる画面。発注確定・在庫アラート・タスク等のショートカット。" />
          <Role icon="◉" name="利用者" href="/users" desc="利用者の登録・編集・削除。詳細画面でステータス変更・食事設定・アレルギー・請求明細を管理。" />
          <Role icon="◉" name="食事発注" href="/meals" desc="月間カレンダーと日別詳細。利用者の食事設定とキャンセル状況から食数を自動算出。" />
          <Role icon="◉" name="月次請求" href="/billing" desc="利用者ごとの月次請求予定額。一括確定で当月の請求を締める。" />
          <Role icon="◉" name="日用品" href="/goods" desc="商品マスタ・在庫管理。最低在庫を下回ると自動アラート。発注候補表を CSV 出力可能。" />
          <Role icon="◉" name="申し送り" href="/handovers" desc="職員間の引き継ぎタイムライン。重要マーク付きの記載は赤で強調。施設からのお知らせも表示。" />
          <Role icon="◉" name="書類・タスク" href="/documents" desc="利用者ごとの書類（保険証等）の期限管理と、業務タスクの一元管理。" />
          <Role icon="◉" name="アクティビティ" href="/inbox/activity" desc="システム内で行われた全操作のログ。誰がいつ何を変更したかが追跡できます。" />
        </div>
      </section>

      {/* 用語 */}
      <section className="card p-5">
        <h2 className="text-[16px] font-semibold text-ink-900 mb-3">3. よく使う用語</h2>
        <dl className="space-y-2 text-[13px]">
          <Term k="ステータス（利用者）" v="入居中／入院中／外泊中／一時帰宅／退去済 の 5 種。入居中以外の期間は食事が自動停止されます。" />
          <Term k="発注確定" v="その日・その食事区分の発注数を確定します。確定後はステータス変更があっても食数が再計算されません。" />
          <Term k="請求確定" v="その月の請求を確定します。確定後は食事キャンセル等があっても請求額は変わりません。" />
          <Term k="単発キャンセル" v="特定の 1 日・1 食だけ食事を止めること。食事日別詳細から登録できます。" />
          <Term k="定期キャンセル" v="毎週木曜の昼食など、曜日単位で食事を止めること。利用者詳細の食事設定で登録します。" />
          <Term k="土曜まとめ発注" v="A 社など特定業者で、日曜が配達休みのため土曜に日曜分も含めて配達するルール。カレンダー上は土曜セルに 📌 マーク。" />
        </dl>
      </section>

      {/* よくあるトラブル */}
      <section className="card p-5">
        <h2 className="text-[16px] font-semibold text-ink-900 mb-3">4. よくあるご質問</h2>
        <div className="space-y-3 text-[13px]">
          <Faq q="食事数が 0 のままです" a="利用者の食事設定（朝パン/朝ジュース/昼業者/夕業者）を入力する必要があります。利用者詳細の「食事設定」ボタンから入力してください。" />
          <Faq q="入院中の利用者の食事が止まりません" a="ステータスを「入院中」に変更すると、自動的に食事が止まります。利用者詳細の「ステータス変更」から変更してください。期間を指定すると、その期間のみ停止されます。" />
          <Faq q="データを別のパソコンへ移したい" a="「マスタ・データ管理」画面右上の「バックアップ書出」で JSON ファイルをダウンロード → 移行先で同画面の「インポート」に貼り付けてください。" />
          <Faq q="間違って登録してしまった" a="ほぼすべての画面に編集・削除ボタンがあります。削除後も「アクティビティ」「監査ログ」には記録が残るので、後から追跡できます。" />
          <Faq q="月の途中で単価を変えた場合、過去分も再計算されますか？" a="いいえ。確定済の月の請求は再計算されません。月途中での変更は新しい単価が適用されるのは未確定の月からです。" />
        </div>
      </section>

      <div className="text-center pt-4">
        <Link href="/" className="btn btn-primary">ダッシュボードへ戻る</Link>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[13px] shrink-0">{n}</span>
      <div>
        <div className="font-semibold text-ink-900">{title}</div>
        <div className="text-[12px] text-ink-600 mt-0.5">{body}</div>
      </div>
    </li>
  );
}

function Role({ icon, name, href, desc }: { icon: string; name: string; href: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 px-2 py-2 hover:bg-ink-50/60 rounded">
      <span className="text-brand-600 text-[14px] shrink-0">{icon}</span>
      <div className="flex-1">
        <Link href={href} className="font-semibold text-brand-700 hover:underline">{name}</Link>
        <div className="text-[12px] text-ink-600 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function Term({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1 border-b border-ink-100 last:border-b-0">
      <dt className="text-ink-700 font-semibold">{k}</dt>
      <dd className="col-span-2 text-ink-600">{v}</dd>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="border-b border-ink-100 last:border-b-0 pb-2">
      <summary className="cursor-pointer font-semibold text-ink-900 py-1">Q. {q}</summary>
      <p className="mt-1 pl-4 text-[12px] text-ink-700">A. {a}</p>
    </details>
  );
}
