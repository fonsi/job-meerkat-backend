export const parseTokenFromBody = (
    body: string | null | undefined,
): string | null => {
    if (!body) {
        return null;
    }

    try {
        const parsed = JSON.parse(body) as { token?: unknown };
        if (typeof parsed.token !== 'string' || !parsed.token.trim()) {
            return null;
        }

        return parsed.token.trim();
    } catch {
        return null;
    }
};
