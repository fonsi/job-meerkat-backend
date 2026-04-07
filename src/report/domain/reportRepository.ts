import { NewsletterPreferences } from './newsletterPreferences';
import { Report, ReportId } from './report';

export type GetAll = () => Promise<Report[]>;
export type GetById = (id: ReportId) => Promise<Report | null>;
export type GetByEmailNormalized = (
    emailNormalized: string,
) => Promise<Report | null>;
export type UpdatePreferences = (
    id: ReportId,
    preferences: NewsletterPreferences,
) => Promise<Report>;

export interface ReportRepository {
    getAll: GetAll;
    getById: GetById;
    getByEmailNormalized: GetByEmailNormalized;
    updatePreferences: UpdatePreferences;
}
