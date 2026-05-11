import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "B-CareHub | 住宅型有料老人ホーム業務管理",
  description:
    "B-CareHub — 利用者中心の業務台帳。食事発注・日用品・固定費・介護/看護利用料・月次請求を一元管理。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 no-print">
          <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                B
              </div>
              <div>
                <div className="text-base font-semibold leading-tight">B-CareHub</div>
                <div className="text-[11px] text-gray-500 leading-tight">
                  住宅型有料老人ホーム業務管理
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">あすか苑（仮）</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-700">事務 田中</span>
            </div>
          </div>
          <Nav />
        </header>
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">{children}</main>
        <footer className="no-print border-t border-gray-200 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 py-3 text-xs text-gray-500 flex justify-between">
            <span>© Backlly / B-CareHub Prototype</span>
            <span>このページはデモ用モックデータで動作しています</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
