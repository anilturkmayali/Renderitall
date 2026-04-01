"use client";

import { Download } from "lucide-react";

export function PrintButton({ color }: { color: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
      style={{ backgroundColor: color }}
    >
      <Download className="h-4 w-4" />
      Save as PDF
    </button>
  );
}
