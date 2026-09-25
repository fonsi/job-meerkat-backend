import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';

const LOGO_SRC = `${ASSETS_BASE_URL}/jobmeerkat-logo-text-white.png`;
const LOGO_WIDTH = 180;
const LOGO_HEIGHT = 20;

export const emailColors = {
    heroBg: '#111111',
    pageBg: '#f4f4f4',
    contentBg: '#ffffff',
    text: '#111111',
    muted: '#999999',
    link: '#111111',
    accent: '#D6FF3F',
    accentText: '#111111',
} as const;

export const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const FONT =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Minimal email chrome: one outer + one card table (no React Email nesting). */
export const wrapEmailShell = (title: string, bodyHtml: string): string => {
    const safeTitle = escapeHtml(title);

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${emailColors.pageBg};font-family:${FONT};">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${emailColors.pageBg};">
<tr><td align="center" style="padding:12px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color:${emailColors.contentBg};border-radius:8px;max-width:600px;overflow:hidden;width:100%;">
<tr><td align="center" style="background-color:${emailColors.heroBg};padding:16px 20px;">
<img src="${LOGO_SRC}" alt="JobMeerkat" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" style="display:block;height:${LOGO_HEIGHT}px;margin:0 auto;width:${LOGO_WIDTH}px;">
</td></tr>
<tr><td style="background-color:${emailColors.accent};font-size:0;height:3px;line-height:0;padding:0;">&nbsp;</td></tr>
<tr><td style="background-color:${emailColors.contentBg};color:${emailColors.text};padding:20px 16px;">
<h1 style="color:${emailColors.text};font-size:18px;font-weight:700;line-height:1.3;margin:0 0 8px;">${safeTitle}</h1>
${bodyHtml}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
};

export const buildEmailParts = (
    title: string,
    bodyHtml: string,
    plainText: string,
): { html: string; text: string } => ({
    html: wrapEmailShell(title, bodyHtml),
    text: plainText,
});
