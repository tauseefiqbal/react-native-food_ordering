/**
 * Throws an error if any of the keys are missing from the object
 * @param {*} obj
 * @param {string[]} keys
 */
export function throwIfMissing(obj, keys) {
  const missing = keys.filter((key) => !obj[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

// Only send the browser back to the app (custom scheme or Expo Go), never to arbitrary sites.
const APP_REDIRECT_PREFIXES = (process.env.APP_REDIRECT_PREFIXES ?? 'fastfood://,exp://')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

// The runtime passes query values through still percent-encoded.
/** @param {unknown} value */
export function safeDecode(value) {
  if (typeof value !== 'string') return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** @param {unknown} url */
export function isAllowedAppRedirect(url) {
  return typeof url === 'string' && APP_REDIRECT_PREFIXES.some((p) => url.startsWith(p));
}
