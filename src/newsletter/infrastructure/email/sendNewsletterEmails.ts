import { issueMagicLink } from 'magicLink/application/issueMagicLink';
import { MagicLinkPurpose } from 'magicLink/domain/magicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { Report } from 'report/domain/report';
import { buildSimpleEmailTemplate } from 'shared/infrastructure/email/templates/simpleEmailTemplate';
import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';

export const sendConfirmSubscriptionEmail = async ({
    to,
    linkUrl,
}: {
    to: string;
    linkUrl: string;
}) => {
    const { html, text } = await buildSimpleEmailTemplate({
        title: 'Confirm your subscription',
        preview: 'Confirm your JobMeerkat newsletter subscription',
        paragraphs: [
            'Thanks for joining JobMeerkat job digests. Confirm your email to start receiving curated opportunities.',
        ],
        cta: { label: 'Confirm subscription', url: linkUrl },
    });

    await sendEmail({
        to: [to],
        subject: 'Confirm your JobMeerkat newsletter subscription',
        text,
        html,
    });
};

export const sendNewsletterMagicLinkEmail = async ({
    to,
    linkUrl,
}: {
    to: string;
    linkUrl: string;
}) => {
    const { html, text } = await buildSimpleEmailTemplate({
        title: 'Manage your newsletter settings',
        preview: 'Open this link to edit your JobMeerkat newsletter filters',
        paragraphs: [
            'Use the button below to view or edit your newsletter filters, frequency, and preferences.',
        ],
        cta: { label: 'Open settings', url: linkUrl },
    });

    await sendEmail({
        to: [to],
        subject: 'Manage your JobMeerkat newsletter settings',
        text,
        html,
    });
};

export const sendUnsubscribeLinkEmail = async ({
    to,
    linkUrl,
}: {
    to: string;
    linkUrl: string;
}) => {
    const { html, text } = await buildSimpleEmailTemplate({
        title: 'Unsubscribe from job digests',
        preview: 'Open this link to unsubscribe from JobMeerkat digests',
        paragraphs: [
            'Sorry to see you go. Open the link below to confirm you want to unsubscribe from JobMeerkat job digests.',
        ],
        cta: { label: 'Unsubscribe', url: linkUrl },
    });

    await sendEmail({
        to: [to],
        subject: 'Unsubscribe from JobMeerkat job digests',
        text,
        html,
    });
};

export const issuePreferencesTokenForReport = async (
    report: Report,
): Promise<string | null> => {
    const { token } = await issueMagicLink({
        purpose: 'newsletter_preferences',
        subject: { type: 'report', reportId: report.id },
        email: report.email,
        repository: dynamodbMagicLinkRepository,
    });

    return token;
};

export const issueConfirmTokenForReport = async (
    report: Report,
): Promise<string> => {
    const { token } = await issueMagicLink({
        purpose: 'newsletter_confirm',
        subject: { type: 'report', reportId: report.id },
        email: report.email,
        repository: dynamodbMagicLinkRepository,
    });

    return token;
};

export const sendPreferencesLinkForReport = async (
    report: Report,
    buildUrl: (token: string) => string | null,
) => {
    const token = await issuePreferencesTokenForReport(report);
    if (!token) {
        return false;
    }

    const url = buildUrl(token);
    if (!url) {
        return false;
    }

    await sendNewsletterMagicLinkEmail({ to: report.email, linkUrl: url });
    return true;
};

export const sendConfirmLinkForReport = async (
    report: Report,
    buildUrl: (token: string) => string | null,
) => {
    const token = await issueConfirmTokenForReport(report);
    const url = buildUrl(token);

    if (!url) {
        return false;
    }

    await sendConfirmSubscriptionEmail({ to: report.email, linkUrl: url });
    return true;
};

export type NewsletterEmailPurpose = MagicLinkPurpose | 'unsubscribe_footer';
