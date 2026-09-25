import { buildEmailParts, emailColors, escapeHtml } from './emailShell';

type SimpleEmailProps = {
    title: string;
    paragraphs: string[];
    cta?: { label: string; url: string };
    footerNote?: string;
};

const buildSimpleEmailPlainText = ({
    title,
    paragraphs,
    cta,
    footerNote,
}: SimpleEmailProps): string => {
    const lines = [title, '', ...paragraphs];
    if (cta) {
        lines.push('', cta.label, cta.url);
    }
    if (footerNote) lines.push('', footerNote);

    return lines.join('\n');
};

const buildSimpleEmailBody = ({
    paragraphs,
    cta,
    footerNote,
}: Omit<SimpleEmailProps, 'title'>): string => {
    const parts: string[] = paragraphs.map(
        (paragraph) =>
            `<p style="color:${emailColors.text};font-size:15px;line-height:1.6;margin:0 0 16px;">${escapeHtml(paragraph)}</p>`,
    );

    if (cta) {
        const safeUrl = escapeHtml(cta.url);
        const safeLabel = escapeHtml(cta.label);
        parts.push(
            `<p style="margin:8px 0 16px;text-align:center;"><a href="${safeUrl}" style="background-color:${emailColors.accent};border-radius:4px;color:${emailColors.accentText};display:inline-block;font-size:15px;font-weight:600;padding:12px 20px;text-decoration:none;">${safeLabel}</a></p>`,
            `<p style="color:${emailColors.muted};font-size:13px;line-height:1.5;margin:0 0 8px;word-break:break-all;">Or copy this link: <a href="${safeUrl}" style="color:${emailColors.link};">${safeUrl}</a></p>`,
        );
    }

    if (footerNote) {
        parts.push(
            `<p style="color:${emailColors.muted};font-size:13px;line-height:1.5;margin:16px 0 0;">${escapeHtml(footerNote)}</p>`,
        );
    }

    return parts.join('');
};

export const buildSimpleEmailTemplate = async (
    props: SimpleEmailProps,
): Promise<{ html: string; text: string }> =>
    buildEmailParts(
        props.title,
        buildSimpleEmailBody(props),
        buildSimpleEmailPlainText(props),
    );
