import { IncomingMessage, ServerResponse } from 'node:http';
import { CompanyId } from 'company/domain/company';
import { generateCompanyLogo } from 'company/application/generateCompanyLogo';
import { generatePendingCompanyOgImage } from 'company/application/generatePendingCompanyOgImage';
import { getPendingCompanies } from 'company/application/getPendingCompanies';
import { promoteCompany } from 'company/application/promoteCompany';
import { replaceCompanyLogo } from 'company/application/replaceCompanyLogo';
import { readLogo, readOg } from './pendingArtifacts';

const json = (res: ServerResponse, status: number, body: unknown): void => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
};

const readBody = (req: IncomingMessage): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });

const pendingListPattern = /^\/api\/pending\/?$/;
const pendingActionPattern =
    /^\/api\/pending\/([^/]+)\/(logo|og|generate-logo|generate-og|promote)\/?$/;

const statusForError = (error: Error): number => {
    const message = error.message;
    if (message.includes('not found')) return 404;
    if (message.includes('already exists')) return 409;
    if (
        message.includes('Missing logo') ||
        message.includes('no homePage') ||
        message.includes('Missing logo at')
    ) {
        return 400;
    }

    return 500;
};

const sendPng = (
    res: ServerResponse,
    png: Buffer | null,
    missingMessage: string,
): void => {
    if (!png) {
        json(res, 404, { error: missingMessage });
        return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.end(png);
};

export const handleAdminApi = async (
    req: IncomingMessage,
    res: ServerResponse,
): Promise<void> => {
    try {
        const url = req.url?.split('?')[0] || '';
        const method = req.method || 'GET';

        if (method === 'GET' && pendingListPattern.test(url)) {
            const companies = await getPendingCompanies();
            json(res, 200, { companies });
            return;
        }

        const actionMatch = pendingActionPattern.exec(url);
        if (!actionMatch) {
            json(res, 404, { error: 'Not found' });
            return;
        }

        const companyId = actionMatch[1] as CompanyId;
        const action = actionMatch[2];

        if (method === 'GET' && action === 'logo') {
            sendPng(res, readLogo(companyId), 'Logo not generated yet');
            return;
        }

        if (method === 'GET' && action === 'og') {
            sendPng(res, readOg(companyId), 'OG image not generated yet');
            return;
        }

        if (method === 'POST' && action === 'generate-logo') {
            await generateCompanyLogo({ companyId });
            json(res, 200, { ok: true });
            return;
        }

        if (method === 'POST' && action === 'generate-og') {
            await generatePendingCompanyOgImage({ companyId });
            json(res, 200, { ok: true });
            return;
        }

        if (method === 'POST' && action === 'logo') {
            const input = await readBody(req);
            if (!input.length) {
                json(res, 400, { error: 'Empty logo upload' });
                return;
            }
            await replaceCompanyLogo({ companyId, input });
            json(res, 200, { ok: true });
            return;
        }

        if (method === 'POST' && action === 'promote') {
            await promoteCompany({ companyId });
            json(res, 200, { ok: true });
            return;
        }

        json(res, 405, { error: 'Method not allowed' });
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        json(res, statusForError(err), { error: err.message });
    }
};
