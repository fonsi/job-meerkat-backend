import { MagicLinkPurpose, MagicLinkSubject } from 'magicLink/domain/magicLink';

export const buildSubjectPurposeKey = (
    purpose: MagicLinkPurpose,
    subject: MagicLinkSubject,
): string => {
    if (subject.type === 'report') {
        return `${purpose}#report#${subject.reportId}`;
    }

    throw new Error('unsupported magic link subject');
};
