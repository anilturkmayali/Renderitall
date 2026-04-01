"use client";

import { Download } from "lucide-react";
import { usePathname } from "next/navigation";

export function PdfButton() {
  const pathname = usePathname();

  function handlePdf() {
    // Extract space slug and page slug from pathname
    const parts = pathname.split("/");
    // pathname is like /docs/space-slug or /docs/space-slug/page-slug
    const spaceSlug = parts[2] || "";
    const pageSlug = parts.slice(3).join("/");

    // Open the PDF page in a new tab
    const pdfUrl = pageSlug
      ? `/docs/${spaceSlug}/pdf?page=${encodeURIComponent(pageSlug)}`
      : `/docs/${spaceSlug}/pdf`;

    window.open(pdfUrl, "_blank");
  }

  return (
    <button
      onClick={handlePdf}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors no-print"
      title="Download as PDF"
    >
      <Download className="h-3.5 w-3.5" />
      PDF
    </button>
  );
}
