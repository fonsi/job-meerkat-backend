const appendToken = (base: string, param: string, token: string): string => {
    const trimmed = base.trim();
    if (!trimmed) {
        return '';
    }

    const sep = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${sep}${param}=${encodeURIComponent(token)}`;
};

export const buildConfirmUrl = (token: string): string | null => {
    const base = process.env.NEWSLETTER_CONFIRM_BASE_URL?.trim();
    return base ? appendToken(base, 'token', token) : null;
};

export const buildSettingsUrl = (token: string): string | null => {
    const base = process.env.NEWSLETTER_SETTINGS_BASE_URL?.trim();
    return base ? appendToken(base, 'token', token) : null;
};

export const buildUnsubscribeUrl = (token: string): string | null => {
    const base = process.env.NEWSLETTER_UNSUBSCRIBE_BASE_URL?.trim();
    return base ? appendToken(base, 't', token) : null;
};

export const buildManageSettingsLandingUrl = (): string | null => {
    const base = process.env.NEWSLETTER_SETTINGS_BASE_URL?.trim();
    return base || null;
};
