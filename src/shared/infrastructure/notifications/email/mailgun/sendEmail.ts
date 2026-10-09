import FormData from 'form-data';
// @ts-expect-error next-line
import { IMailgunClient } from 'mailgun.js/definitions';

let mailgun: IMailgunClient;

const domain = process.env.MAILGUN_DOMAIN;
const url = process.env.MAILGUN_URL;
const apiKey = process.env.MAILGUN_API_KEY;

const DEFAULT_FROM = `JobMeerkat <no-reply@${domain}>`;
const EMAIL_RETRY_DELAYS_MS = [2000, 5000, 15000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || !error || !('status' in error)) {
        return undefined;
    }
    const status = (error as { status?: unknown }).status;

    return typeof status === 'number' ? status : undefined;
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;

    return '';
};

export const isRetriableEmailError = (error: unknown): boolean => {
    const status = getErrorStatus(error);
    if (status === 429 || (status != null && status >= 500)) return true;

    return /too many requests/i.test(getErrorMessage(error));
};

const withEmailRetry = async <T>(
    fn: () => Promise<T>,
    delaysMs: number[] = EMAIL_RETRY_DELAYS_MS,
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (delaysMs.length === 0 || !isRetriableEmailError(error)) throw error;
        const [delayMs, ...remainingDelaysMs] = delaysMs;
        console.log(
            `[SEND EMAIL] Retriable error, retrying in ${delayMs}ms:`,
            getErrorMessage(error) || error,
        );
        await sleep(delayMs);

        return withEmailRetry(fn, remainingDelaysMs);
    }
};

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

    return withEmailRetry(() =>
        mailgunClient.messages.create(domain, {
            from,
            to,
            subject,
            text,
            html,
        }),
    );
};
