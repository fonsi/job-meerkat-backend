export const maskEmail = (email: string): string => {
    const at = email.indexOf('@');
    if (at <= 0) {
        return '***';
    }

    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    const visible = local.slice(0, Math.min(1, local.length));

    return `${visible}***@${domain}`;
};
