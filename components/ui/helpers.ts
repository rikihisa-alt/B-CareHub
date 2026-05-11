"use client";
import { toast } from "./toast";

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`${filename} をダウンロードしました`, "ok");
}

export function doPrint() {
  toast("印刷ダイアログを表示します", "info");
  setTimeout(() => window.print(), 200);
}

export function notImplementedYet(action: string) {
  toast(`${action}：このプロトタイプでは未実装です`, "info");
}
