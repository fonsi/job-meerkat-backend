import { MagicLinkPurpose } from 'magicLink/domain/magicLink';

export const MAGIC_LINK_TTL_MS = 30 * 60 * 1000;

export const MAGIC_LINK_TTL_BY_PURPOSE: Record<MagicLinkPurpose, number> = {
    newsletter_confirm: 60 * 60 * 1000,
    newsletter_preferences: 2 * 60 * 60 * 1000,
};

export const magicLinkTtlMs = (purpose: MagicLinkPurpose): number =>
    MAGIC_LINK_TTL_BY_PURPOSE[purpose] ?? MAGIC_LINK_TTL_MS;
