"use client";

import { useState } from "react";
import { Copy, Download } from "lucide-react";

export function CodeExport({ code, language, name }: { code: string; language: "python" | "cpp"; name: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(code); setMessage("Copied to clipboard."); }
    catch { setMessage("Clipboard unavailable. Download the file instead."); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 70) || "autonomous"}.${language === "python" ? "py" : "cpp"}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Code downloaded.");
  }
  return <div className="code-export-actions"><button className="button button-quiet" type="button" disabled={!code} onClick={copy}><Copy size={14}/> Copy code</button><button className="button button-primary" type="button" disabled={!code} onClick={download}><Download size={14}/> Download .{language === "python" ? "py" : "cpp"}</button><span role="status">{message}</span></div>;
}
