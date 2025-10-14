import FormData from 'form-data';
// @ts-expect-error next-line
import { IMailgunClient } from 'mailgun.js/definitions';

let mailgun: IMailgunClient;

const domain = process.env.MAILGUN_DOMAIN;
const url = process.env.MAILGUN_URL;
const apiKey = process.env.MAILGUN_API_KEY;

const DEFAULT_FROM = `JobMeerkat <no-reply@${domain}>`;

const getMailgunClient = async () => {
    if (mailgun) {
        return mailgun;
    }

    const Mailgun = await import('mailgun.js');
    const mg = new Mailgun.default(FormData);

    mailgun = mg.client({
        username: 'api',
        key: apiKey,
        url,
    });

    return mailgun;
};

type SendEmailData = {
    to: string[];
    subject: string;
    text: string;
    html: string;
    from?: string;
};

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
    from = DEFAULT_FROM,
}: SendEmailData) => {
    const mailgunClient = await getMailgunClient();

    return mailgunClient.messages.create(domain, {
        from,
        to,
        subject,
        text,
        html,
    });
};
