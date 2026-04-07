export type MagicLinkPurpose = 'newsletter_preferences';

export type MagicLinkSubject = {
    type: 'report';
    reportId: string;
};

export type StoredMagicLink = {
    tokenHash: string;
    subjectPurposeKey: string;
    purpose: MagicLinkPurpose;
    subject: MagicLinkSubject;
    email: string;
    issuedAt: number;
    expiresAt: number;
};
