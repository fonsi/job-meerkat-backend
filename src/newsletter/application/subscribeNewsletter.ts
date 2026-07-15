import {
    sendConfirmLinkForReport,
    sendPreferencesLinkForReport,
} from 'newsletter/infrastructure/email/sendNewsletterEmails';
import {
    buildConfirmUrl,
    buildSettingsUrl,
} from 'newsletter/infrastructure/url/buildNewsletterUrls';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { generateOpaqueToken } from 'shared/infrastructure/token/generateOpaqueToken';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { parseEmailFromBody } from './parseEmailFromBody';

export const subscribeNewsletter = async (event: {
    body?: string | null;
}): Promise<{ ok: true }> => {
    const raw = parseEmailFromBody(event.body);
    if (!raw) {
        return { ok: true };
    }

    const email = normalizeEmail(raw);
    const existing = await reportRepository.getByEmailNormalized(email);

    if (!existing) {
        const report = await reportRepository.createPending({
            email: raw.trim(),
            emailNormalized: email,
            unsubscribeToken: generateOpaqueToken(),
        });
        await sendConfirmLinkForReport(report, buildConfirmUrl);
        return { ok: true };
    }

    if (existing.status === 'pending') {
        await sendConfirmLinkForReport(existing, buildConfirmUrl);
        return { ok: true };
    }

    if (existing.status === 'active') {
        await sendPreferencesLinkForReport(existing, buildSettingsUrl);
        return { ok: true };
    }

    const report = await reportRepository.resetToPending(
        existing.id,
        generateOpaqueToken(),
    );
    await sendConfirmLinkForReport(report, buildConfirmUrl);

    return { ok: true };
};
