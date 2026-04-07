import { issueMagicLink } from 'magicLink/application/issueMagicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { sendNewsletterMagicLinkEmail } from 'newsletter/infrastructure/email/sendNewsletterMagicLinkEmail';

type Body = {
    email?: string;
};

const buildSettingsUrl = (token: string): string | null => {
    const base = process.env.NEWSLETTER_SETTINGS_BASE_URL?.trim();
    if (!base) {
        console.warn(
            'NEWSLETTER_SETTINGS_BASE_URL is not set; skipping magic link email',
        );
        return null;
    }
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}token=${encodeURIComponent(token)}`;
};

export const requestNewsletterLink = async (event: {
    body?: string | null;
}): Promise<{ sent: boolean }> => {
    let body: Body = {};
    try {
        if (event.body) {
            body = JSON.parse(event.body) as Body;
        }
    } catch {
        return { sent: false };
    }

    const raw = body.email;
    if (typeof raw !== 'string' || !raw.trim()) {
        return { sent: false };
    }

    const email = normalizeEmail(raw);
    const report = await reportRepository.getByEmailNormalized(email);

    if (!report) {
        return { sent: false };
    }

    const { token } = await issueMagicLink({
        purpose: 'newsletter_preferences',
        subject: { type: 'report', reportId: report.id },
        email: report.email,
        repository: dynamodbMagicLinkRepository,
    });

    const url = buildSettingsUrl(token);
    if (url) {
        await sendNewsletterMagicLinkEmail({ to: report.email, linkUrl: url });
    }

    return { sent: !!url };
};
