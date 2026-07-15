export const parseEmailFromBody = (
    body: string | null | undefined,
): string | null => {
    if (!body) {
        return null;
    }

    try {
        const parsed = JSON.parse(body) as { email?: unknown };
        if (typeof parsed.email !== 'string' || !parsed.email.trim()) {
            return null;
        }

        return parsed.email.trim();
    } catch {
        return null;
    }
};
