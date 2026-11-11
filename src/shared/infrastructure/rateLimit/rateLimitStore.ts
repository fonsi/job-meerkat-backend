export interface RateLimitStore {
    /**
     * Count one hit for `key` in the fixed window that contains `now` and
     * return the number of hits in that window, including this one.
     */
    hit: (key: string, windowMs: number, now: number) => Promise<number>;
    /**
     * Try to take `key` for `ttlMs`. Returns `true` when this call took it,
     * `false` when someone else already holds it and it has not expired yet.
     * Atomic, so concurrent calls for the same key only let one through.
     */
    claim: (key: string, ttlMs: number, now: number) => Promise<boolean>;
}
