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

/** シンプルな CSV パーサ（ダブルクォート対応、BOM対応） */
export function parseCsv(text: string): string[][] {
  // BOM 除去
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuote = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        cur.push(field); field = "";
      } else if (ch === "\r") {
        // CRLF対応：\n を待つ
      } else if (ch === "\n") {
        cur.push(field); field = "";
        rows.push(cur); cur = [];
      } else {
        field += ch;
      }
    }
  }
  // 最後の行
  if (field !== "" || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
