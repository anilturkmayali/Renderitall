"use client";

import { Download } from "lucide-react";

export function PdfButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      title="Save as PDF"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">PDF</span>
    </button>
  );
}
