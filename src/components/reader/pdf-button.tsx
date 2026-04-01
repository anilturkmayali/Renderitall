"use client";

import { Download } from "lucide-react";

export function PdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors no-print"
      title="Save this page as PDF"
    >
      <Download className="h-3.5 w-3.5" />
      Save as PDF
    </button>
  );
}
