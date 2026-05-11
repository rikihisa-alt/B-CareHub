import type { Metadata } from "next";
import "./globals.css";
import { SideMenu } from "@/components/nav";
import { ToastContainer } from "@/components/ui/toast";

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
        <header className="bg-white border-b border-ink-200 sticky top-0 z-30 no-print">
          <div className="h-13 px-5 flex items-center justify-between" style={{ height: 52 }}>
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-[15px]">
                  B
                </span>
                <span className="text-[15px] font-semibold tracking-wide">B-CareHub</span>
              </a>
              <span className="text-[12px] text-ink-500 border-l border-ink-200 pl-4">あすか苑（仮）</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-ink-700">
              <button className="p-2 hover:bg-ink-50 rounded" title="検索">🔍</button>
              <a href="#" className="hover:text-brand-700 text-[12px]">ヘルプ</a>
              <span className="w-px h-5 bg-ink-200" />
              {/* アカウントメニュー（ドロップダウン） */}
              <details className="relative">
                <summary className="list-none flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-ink-50 rounded">
                  <div className="w-7 h-7 rounded-full bg-ink-200 flex items-center justify-center text-ink-700 font-semibold text-xs">
                    田
                  </div>
                  <span className="text-[13px]">田中 太郎</span>
                  <span className="text-ink-400 text-[10px]">▾</span>
                </summary>
                <div className="absolute right-0 top-full mt-1 w-60 card shadow-md text-[13px] z-40">
                  <div className="px-4 py-3 border-b border-ink-100">
                    <div className="font-semibold text-ink-900">田中 太郎</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">職員番号 1042 ／ 事務担当</div>
                    <div className="text-[11px] text-ink-500">所属：あすか苑（仮）</div>
                  </div>
                  <ul className="py-1">
                    <li><a href="#" className="block px-4 py-1.5 hover:bg-ink-50">施設を切り替え</a></li>
                    <li><a href="#" className="block px-4 py-1.5 hover:bg-ink-50">個人設定</a></li>
                    <li><a href="#" className="block px-4 py-1.5 hover:bg-ink-50">通知設定</a></li>
                    <li className="border-t border-ink-100 mt-1 pt-1">
                      <a href="#" className="block px-4 py-1.5 hover:bg-ink-50 text-err-700">ログアウト</a>
                    </li>
                  </ul>
                </div>
              </details>
            </div>
          </div>
        </header>

        {/* Body: sidebar + main */}
        <div className="flex">
          <aside className="w-[200px] shrink-0 py-5 no-print bg-white border-r border-ink-200 min-h-[calc(100vh-52px)]">
            <SideMenu />
          </aside>
          <main className="flex-1 px-7 py-6 max-w-[1320px]">{children}</main>
        </div>

        <ToastContainer />

        <footer className="no-print border-t border-ink-200 bg-white">
          <div className="px-6 py-2.5 text-[11px] text-ink-500 flex justify-between">
            <span>© Backlly / B-CareHub Prototype</span>
            <span>このページはデモ用モックデータで動作しています</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
