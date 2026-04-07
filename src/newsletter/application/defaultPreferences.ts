import {
    NewsletterPreferences,
    newsletterPreferencesDefaults,
    normalizeNewsletterPreferences,
} from 'report/domain/newsletterPreferences';

export const defaultNewsletterPreferences = newsletterPreferencesDefaults;

export const mergeStoredOrDefault = (
    stored: NewsletterPreferences | undefined,
): NewsletterPreferences => {
    if (!stored) {
        return newsletterPreferencesDefaults();
    }
    return normalizeNewsletterPreferences({
        ...newsletterPreferencesDefaults(),
        ...stored,
    });
};
