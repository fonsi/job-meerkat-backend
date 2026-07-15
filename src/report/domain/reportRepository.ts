import { NewsletterPreferences } from './newsletterPreferences';
import { Report, ReportFrequency, ReportId } from './report';

export type GetAll = () => Promise<Report[]>;
export type GetById = (id: ReportId) => Promise<Report | null>;
export type GetByEmailNormalized = (
    emailNormalized: string,
) => Promise<Report | null>;
export type GetByUnsubscribeToken = (token: string) => Promise<Report | null>;
export type CreatePending = (input: {
    email: string;
    emailNormalized: string;
    unsubscribeToken: string;
}) => Promise<Report>;
export type Activate = (id: ReportId) => Promise<Report>;
export type Unsubscribe = (id: ReportId) => Promise<Report>;
export type UpdateFrequency = (
    id: ReportId,
    frequency: ReportFrequency,
) => Promise<Report>;
export type ResetToPending = (
    id: ReportId,
    unsubscribeToken: string,
) => Promise<Report>;
export type UpdatePreferences = (
    id: ReportId,
    preferences: NewsletterPreferences,
) => Promise<Report>;
export type UpdateUnsubscribeToken = (
    id: ReportId,
    unsubscribeToken: string,
) => Promise<Report>;

export interface ReportRepository {
    getAll: GetAll;
    getById: GetById;
    getByEmailNormalized: GetByEmailNormalized;
    getByUnsubscribeToken: GetByUnsubscribeToken;
    createPending: CreatePending;
    activate: Activate;
    unsubscribe: Unsubscribe;
    resetToPending: ResetToPending;
    updateFrequency: UpdateFrequency;
    updatePreferences: UpdatePreferences;
    updateUnsubscribeToken: UpdateUnsubscribeToken;
}
