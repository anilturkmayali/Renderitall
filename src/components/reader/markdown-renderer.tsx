"use client";

import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { Check, Copy, ChevronDown, X } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ─── Copy Button for Code Blocks ─────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 rounded-md bg-background/80 border border-border/50 p-1.5 text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ─── Image Lightbox ──────────────────────────────────────────────────────────

function ImageWithLightbox({
  src,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt || ""}
        className="rounded-lg border shadow-sm cursor-zoom-in hover:shadow-md transition-shadow"
        loading="lazy"
        onClick={() => setOpen(true)}
        {...props}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt || ""}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}

// ─── Expandable Section ──────────────────────────────────────────────────────

function ExpandableSection({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg my-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left font-medium text-sm hover:bg-muted/50 transition-colors"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
        {summary}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t pt-3 text-sm">{children}</div>
      )}
    </div>
  );
}

// ─── Content Tabs ────────────────────────────────────────────────────────────

function ContentTabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs: { label: string; content: React.ReactNode }[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const props = child.props as Record<string, unknown>;
      const text = React.Children.toArray(props.children as React.ReactNode)
        .map((c) => (typeof c === "string" ? c : ""))
        .join("");
      const tabMatch = text.match(/^\[tab:([^\]]+)\]/);
      if (tabMatch) {
        tabs.push({
          label: tabMatch[1],
          content: (
            <div>
              {React.Children.map(
                props.children as React.ReactNode,
                (c) => {
                  if (typeof c === "string") {
                    return c.replace(/^\[tab:[^\]]+\]\s*/, "");
                  }
                  return c;
                }
              )}
            </div>
          ),
        });
      }
    }
  });

  if (tabs.length === 0) return <>{children}</>;

  return (
    <div className="border rounded-lg my-4 overflow-hidden">
      <div className="flex border-b bg-muted/30">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              i === activeTab
                ? "border-primary text-primary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">{tabs[activeTab]?.content}</div>
    </div>
  );
}

// ─── Main Renderer ───────────────────────────────────────────────────────────

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Pre-process content: convert <details>/<summary> to our expandable syntax
  const processedContent = content
    // Convert HTML details/summary to markdown-friendly syntax
    .replace(
      /<details>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/g,
      ":::details[$1]\n$2\n:::"
    );

  return (
    <div
      className={cn(
        "prose prose-slate dark:prose-invert max-w-none",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeHighlight,
        ]}
        components={{
          // Code blocks with copy button
          pre: ({ children, ...props }) => {
            // Extract text content for the copy button
            let codeText = "";
            React.Children.forEach(children, (child) => {
              if (React.isValidElement(child)) {
                const childProps = child.props as Record<string, unknown>;
                if (childProps?.children) {
                  const inner = React.Children.toArray(
                    childProps.children as React.ReactNode
                  );
                  codeText = inner
                    .map((c) => (typeof c === "string" ? c : ""))
                    .join("");
                }
              }
            });

            return (
              <div className="group relative">
                <pre
                  className="rounded-lg border border-border !bg-muted/50"
                  {...props}
                >
                  {children}
                </pre>
                {codeText && <CopyButton text={codeText.trim()} />}
              </div>
            );
          },

          // Custom callout blocks: > [!NOTE], > [!WARNING], > [!TIP], > [!DANGER]
          blockquote: ({ children }) => {
            const text = React.Children.toArray(children)
              .map((child) => {
                if (React.isValidElement(child)) {
                  const p = child.props as Record<string, unknown>;
                  if (p?.children) {
                    const inner = React.Children.toArray(
                      p.children as React.ReactNode
                    );
                    return inner
                      .map((c) => (typeof c === "string" ? c : ""))
                      .join("");
                  }
                }
                return typeof child === "string" ? child : "";
              })
              .join("");

            const calloutMatch = text.match(
              /^\[!(NOTE|WARNING|TIP|DANGER|INFO|CAUTION)\]/i
            );
            if (calloutMatch) {
              const type = calloutMatch[1].toLowerCase();
              const typeMap: Record<string, string> = {
                note: "info",
                info: "info",
                warning: "warning",
                caution: "warning",
                tip: "tip",
                danger: "danger",
              };
              const calloutType = typeMap[type] || "info";

              return (
                <div className={`callout callout-${calloutType}`}>
                  <div className="font-semibold capitalize mb-1">{type}</div>
                  {children}
                </div>
              );
            }

            return <blockquote>{children}</blockquote>;
          },

          // Task list styling
          input: ({ type, checked, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-2 rounded"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },

          // External links open in new tab
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },

          // Images with lightbox
          img: ({ src, alt, ...props }) => (
            <ImageWithLightbox src={src} alt={alt} {...props} />
          ),

          // Tables with responsive wrapper
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full" {...props}>
                {children}
              </table>
            </div>
          ),

          // Handle details/summary (expandable sections)
          // Custom :::details[title] blocks get converted to paragraphs starting with :::
          p: ({ children, ...props }) => {
            const text = React.Children.toArray(children)
              .map((c) => (typeof c === "string" ? c : ""))
              .join("");

            // Expandable section
            const detailsMatch = text.match(/^:::details\[(.+)\]/);
            if (detailsMatch) {
              const remaining = text
                .replace(/^:::details\[.+\]\s*/, "")
                .replace(/\s*:::$/, "");
              return (
                <ExpandableSection summary={detailsMatch[1]}>
                  <p>{remaining}</p>
                </ExpandableSection>
              );
            }

            // Skip closing ::: markers
            if (text.trim() === ":::") return null;

            return <p {...props}>{children}</p>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
