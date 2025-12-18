import DOMPurify from "isomorphic-dompurify"

// Safe HTML rendering component
export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "span"],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  })

  return <div className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
}

// Sanitize URL to prevent javascript: and data: URIs
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"]
  const lowerUrl = trimmed.toLowerCase()

  if (dangerousProtocols.some((protocol) => lowerUrl.startsWith(protocol))) {
    return "#"
  }

  // Allow only http, https, mailto, tel
  if (!/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) {
    return "#"
  }

  return trimmed
}

// Sanitize object values recursively
export function deepSanitize(obj: any): any {
  if (typeof obj === "string") {
    return DOMPurify.sanitize(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitize)
  }

  if (obj && typeof obj === "object") {
    const sanitized: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = deepSanitize(obj[key])
      }
    }
    return sanitized
  }

  return obj
}
