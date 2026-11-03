/**
 * Pure helpers for csp-reports (no Deno or network imports, so Node can unit-test them).
 * Every report field is untrusted input.
 */

export const MAX_URL = 2048;
export const MAX_POLICY = 4096;
export const MAX_SAMPLE = 40;

// URL-valued keys: query string and fragment removed, then length-capped.
const URL_KEYS = new Set([
  "documenturl", "blockedurl", "document-uri", "blocked-uri", "referrer",
  "source-file", "sourcefile", "url",
]);
const POLICY_KEYS = new Set(["originalpolicy", "original-policy"]);
const SAMPLE_KEYS = new Set(["sample", "script-sample", "scriptsample"]);

// Letters, digits, space and common punctuation. Anything else drops the sample.
const SAMPLE_ALLOWED = /^[A-Za-z0-9 .,;:!?'"()\[\]{}\-_\/=+<>@#%&*|]*$/;
// Token-like: a 24+ character unbroken run, or a JWT header. Drops the sample.
const TOKEN_LIKE = /[A-Za-z0-9_\-]{24,}|eyJ[A-Za-z0-9_\-]/;

export function stripUrl(v: string): string {
  const i = v.search(/[?#]/);
  return i === -1 ? v : v.slice(0, i);
}

// Returns the cleaned sample (max 40 chars) or null when it must be dropped.
export function sanitizeSample(v: unknown): string | null {
  if (typeof v !== "string") return null;
  if (!SAMPLE_ALLOWED.test(v)) return null;
  if (TOKEN_LIKE.test(v)) return null;
  return v.slice(0, MAX_SAMPLE);
}

// Deep copy: URL keys stripped and capped, policy capped, sample sanitized or removed.
export function clean(value: unknown, key = ""): unknown {
  const k = key.toLowerCase();
  if (typeof value === "string") {
    if (URL_KEYS.has(k)) return stripUrl(value).slice(0, MAX_URL);
    if (POLICY_KEYS.has(k)) return value.slice(0, MAX_POLICY);
    return value;
  }
  if (Array.isArray(value)) return value.map((x) => clean(x, key));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [kk, v] of Object.entries(value as Record<string, unknown>)) {
      if (SAMPLE_KEYS.has(kk.toLowerCase())) {
        const s = sanitizeSample(v);
        if (s !== null) out[kk] = s; // otherwise dropped entirely
        continue;
      }
      out[kk] = clean(v, kk);
    }
    return out;
  }
  return value;
}

// Origin policy: absent is allowed; present must be https on imagenationdex.com or a subdomain.
export function originAllowed(origin: string | null): boolean {
  if (origin === null) return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return h === "imagenationdex.com" || h.endsWith(".imagenationdex.com");
  } catch (_) {
    return false;
  }
}
