/**
 * HTML Sanitizer for job descriptions.
 * Cleans raw HTML scraped from job sources (Greenhouse, Lever, Ashby, etc.)
 * Strips script tags, unsafe event handlers, inline styles, and enforces secure links.
 */

export function decodeHtmlEntities(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  const decoded = decodeHtmlEntities(rawHtml);

  // 1. Remove dangerous script, iframe, object, embed, style elements and their content
  let cleaned = decoded.replace(/<(script|iframe|object|embed|style)[\s\S]*?<\/\1>/gi, "");

  // 2. Remove inline event handlers like onclick="...", onload="..."
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 3. Remove javascript: URIs in href or src
  cleaned = cleaned.replace(/href\s*=\s*["']?\s*javascript:[^"'>]*["']?/gi, 'href="#"');
  cleaned = cleaned.replace(/src\s*=\s*["']?\s*javascript:[^"'>]*["']?/gi, "");

  // 4. Force external <a> links to open in a new tab securely with rel="noopener noreferrer"
  cleaned = cleaned.replace(/<a\s+([^>]*?)>/gi, (match, p1) => {
    let attrs = p1;
    // Remove existing target and rel attributes to prevent duplicates
    attrs = attrs.replace(/\s*(target|rel)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    return `<a ${attrs} target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800 transition">`;
  });

  return cleaned;
}

