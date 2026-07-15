import { NewsletterPreferences } from './newsletterPreferences';

export type ReportId = string;
export type SubscriptionStatus = 'pending' | 'active' | 'unsubscribed';
export type ReportFrequency = 'daily' | 'weekly';

export type Report = {
    id: ReportId;
    email: string;
    emailNormalized: string;
    status: SubscriptionStatus;
    frequency: ReportFrequency;
    createdAt: number;
    confirmedAt?: number;
    unsubscribedAt?: number;
    unsubscribeToken: string;
    preferences?: NewsletterPreferences;
};
