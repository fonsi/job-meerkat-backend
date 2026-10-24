import { RateLimitStore } from './rateLimitStore';

/** In-memory store with the same semantics as the DynamoDB one (tests, local runs). */
export const createMemoryRateLimitStore = (): RateLimitStore & {
    keys: () => string[];
} => {
    const counters = new Map<string, number>();
    const claims = new Map<string, number>();

    return {
        hit: async (key, windowMs, now) => {
            const windowKey = `${key}#${Math.floor(now / windowMs) * windowMs}`;
            const hits = (counters.get(windowKey) ?? 0) + 1;
            counters.set(windowKey, hits);
            return hits;
        },
        claim: async (key, ttlMs, now) => {
            const expiresAt = claims.get(key);
            if (expiresAt !== undefined && expiresAt > now) {
                return false;
            }
            claims.set(key, now + ttlMs);
            return true;
        },
        keys: () => [...counters.keys(), ...claims.keys()],
    };
};
