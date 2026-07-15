import { randomBytes } from 'crypto';

export const generateOpaqueToken = (): string =>
    randomBytes(32).toString('base64url');
