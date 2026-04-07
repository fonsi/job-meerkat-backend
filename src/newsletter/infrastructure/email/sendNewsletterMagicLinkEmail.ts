import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';

export const sendNewsletterMagicLinkEmail = async ({
    to,
    linkUrl,
}: {
    to: string;
    linkUrl: string;
}) => {
    await sendEmail({
        to: [to],
        subject: 'Manage your daily job report preferences',
        text: `Open this link to view or edit your newsletter filters. It expires in 30 minutes:\n\n${linkUrl}`,
        html: `<p>Open this link to view or edit your newsletter filters. It expires in 30 minutes:</p><p><a href="${linkUrl}">${linkUrl}</a></p>`,
    });
};
