/**
 * Robust and safe fetch wrapper for FältKoll.
 * Prevents "Unexpected token '<', "<html> <he"... is not valid JSON" crashes
 * by verifying the Content-Type header before attempting to parse JSON.
 * Seamlessly handles offline mode, Vite SPA HTML fallbacks, and static hosting (GitHub Pages, Netlify).
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isHtml?: boolean;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned an HTML page (Vite index.html fallback, 404/502/503 HTML, Netlify rewrite, etc.)
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      // If the response text looks like HTML (<doctype, <html, etc.)
      const isHtml = text.trim().startsWith('<');
      return {
        ok: false,
        status: res.status,
        isHtml,
        error: isHtml
          ? 'Servern svarade med en webbsida istället för data (möjligen statisk miljö eller offline).'
          : `Serverfel (${res.status}): Ogiltigt svar.`,
      };
    }

    try {
      const json = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: json?.error || `Begäran misslyckades med status ${res.status}`,
          data: json,
        };
      }
      return { ok: true, status: res.status, data: json };
    } catch {
      return {
        ok: false,
        status: res.status,
        error: 'Kunde inte tolka svaret från servern som giltig JSON.',
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Nätverksanslutningen misslyckades (enheten verkar vara offline).',
    };
  }
}
