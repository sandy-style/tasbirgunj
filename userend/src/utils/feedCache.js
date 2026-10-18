const CACHE_PREFIX = "tg-explore-feed-v2:";
const MAX_CACHE_BYTES = 3_000_000;

function getAccountKey() {
  try {
    const token = localStorage.getItem("token");

    if (!token) return "public";

    // Use a fingerprint, never the actual token, in the storage key.
    let hash = 2166136261;

    for (let i = 0; i < token.length; i += 1) {
      hash ^= token.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return `account-${(hash >>> 0).toString(36)}`;
  } catch {
    return "public";
  }
}

function getCacheKey() {
  return `${CACHE_PREFIX}${getAccountKey()}`;
}

export function readFeedCache() {
  try {
    const raw = localStorage.getItem(getCacheKey());

    if (!raw) return null;

    const cached = JSON.parse(raw);

    if (!Array.isArray(cached.posts)) return null;

    // Serve stale data too; the API refreshes it in the background.
    return {
      posts: cached.posts,
      timestamp: cached.timestamp || 0,
    };
  } catch {
    return null;
  }
}

export function writeFeedCache(posts) {
  if (!Array.isArray(posts)) return;

  try {
    const payload = JSON.stringify({
      timestamp: Date.now(),
      posts,
    });

    // Avoid filling localStorage with huge feed responses.
    if (payload.length > MAX_CACHE_BYTES) return;

    localStorage.setItem(getCacheKey(), payload);
  } catch {
    // Storage can be full or disabled. The feed must still work.
  }
}

export function clearFeedCache() {
  try {
    localStorage.removeItem(getCacheKey());
  } catch {
    // Ignore storage errors.
  }
}
