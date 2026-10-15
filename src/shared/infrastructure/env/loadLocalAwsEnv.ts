import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const stripQuotes = (value: string): string => {
    const quote = value[0];
    if (
        (quote === '"' || quote === "'") &&
        value.length >= 2 &&
        value[value.length - 1] === quote
    ) {
        return value.slice(1, -1);
    }

    return value;
};

export const loadLocalAwsEnv = (): void => {
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
        for (const line of readFileSync(envPath, 'utf8').split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            const key = trimmed.slice(0, eq).trim();
            const value = stripQuotes(trimmed.slice(eq + 1).trim());
            if (process.env[key] === undefined) process.env[key] = value;
        }
    }

    if (process.env.PROFILE) process.env.AWS_PROFILE = process.env.PROFILE;
    if (process.env.REGION) process.env.AWS_REGION = process.env.REGION;
};
