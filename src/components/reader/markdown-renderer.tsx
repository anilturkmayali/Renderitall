"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeHighlight,
        ]}
        components={{
          // Custom callout blocks: > [!NOTE], > [!WARNING], > [!TIP], > [!DANGER]
          blockquote: ({ children }) => {
            const text = React.Children.toArray(children)
              .map((child) => {
                if (React.isValidElement(child)) {
                  const p = child.props as Record<string, unknown>;
                  if (p?.children) {
                    const inner = React.Children.toArray(p.children as React.ReactNode);
                    return inner.map((c) => (typeof c === "string" ? c : "")).join("");
                  }
                }
                return typeof child === "string" ? child : "";
              })
              .join("");

            const calloutMatch = text.match(/^\[!(NOTE|WARNING|TIP|DANGER|INFO|CAUTION)\]/i);
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
          // Image styling
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt || ""}
              className="rounded-lg border shadow-sm"
              loading="lazy"
              {...props}
            />
          ),
          // Table styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full" {...props}>
                {children}
              </table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
