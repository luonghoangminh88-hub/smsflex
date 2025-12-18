"use client"

import ReactMarkdown from "react-markdown"
import { sanitizeUrl } from "@/lib/security/xss-protection"

interface SafeMarkdownProps {
  content: string
  className?: string
}

export function SafeMarkdown({ content, className }: SafeMarkdownProps) {
  return (
    <ReactMarkdown
      className={className}
      components={{
        a: ({ node, href, children, ...props }) => {
          const safeHref = href ? sanitizeUrl(href) : "#"
          return (
            <a href={safeHref} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          )
        },
        img: ({ node, src, alt, ...props }) => {
          const safeSrc = src ? sanitizeUrl(src) : ""
          return <img src={safeSrc || "/placeholder.svg"} alt={alt || ""} loading="lazy" {...props} />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
