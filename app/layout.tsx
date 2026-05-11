import type { Metadata } from "next";
import "./globals.css";
import { SideMenu } from "@/components/nav";

export const metadata: Metadata = {
  title: "B-CareHub | 住宅型有料老人ホーム業務管理",
  description:
    "B-CareHub — 利用者中心の業務台帳。食事発注・日用品・固定費・介護/看護利用料・月次請求を一元管理。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-ink-200 sticky top-0 z-30">
          <div className="h-14 px-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  B
                </span>
                <span className="text-base font-semibold tracking-wide">B-CareHub</span>
              </a>
              <span className="text-[13px] text-ink-600">あすか苑（仮）</span>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-ink-700">
              <a href="#" className="hover:text-brand-700">
                <span className="mr-1">?</span>ヘルプ＆サポート
              </a>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-ink-700 font-semibold text-xs">
                  田
                </div>
                <span className="text-ink-700">田中 太郎 ▾</span>
              </div>
              <button className="btn">← ログアウト</button>
            </div>
          </div>
        </header>

        {/* Body: sidebar + main */}
        <div className="flex">
          <aside className="w-[220px] shrink-0 px-3 py-4 no-print">
            <SideMenu />
          </aside>
          <main className="flex-1 px-6 py-6 max-w-[1280px]">{children}</main>
        </div>

        <footer className="no-print mt-12 border-t border-ink-200 bg-white">
          <div className="px-6 py-3 text-xs text-ink-500 flex justify-between">
            <span>© Backlly / B-CareHub Prototype</span>
            <span>このページはデモ用モックデータで動作しています</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
