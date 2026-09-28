import { readFileSync } from 'fs';
import { join } from 'path';

const ENV_KEYS = ['ASSETS_URL', 'ASSETS_BUCKET', 'PROFILE', 'REGION'];

const text = readFileSync(join(process.cwd(), '.env'), 'utf8');
for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!ENV_KEYS.includes(key)) continue;
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
}
if (process.env.PROFILE) process.env.AWS_PROFILE = process.env.PROFILE;
if (process.env.REGION) process.env.AWS_REGION = process.env.REGION;

const stageFlag = process.argv.indexOf('--stage');
const stage =
    stageFlag >= 0
        ? (process.argv[stageFlag + 1] ?? 'production')
        : 'production';
process.env.DYNAMODB_COMPANY_TABLE_NAME = `${stage}-company`;
