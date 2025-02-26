import { CompanyId } from 'company/domain/company';
import { JobPost, JobPostId } from './jobPost';

export const FROM_WHEN = 86400000; // 1 day

export type Create = (jobPost: JobPost) => Promise<JobPost>;
export type GetAll = () => Promise<JobPost[]>;
export type GetAllOpen = () => Promise<JobPost[]>;
export type GetAllByCompanyId = (companyId: CompanyId) => Promise<JobPost[]>;
export type GetAllOpenByCompanyId = (
    companyId: CompanyId,
) => Promise<JobPost[]>;
export type GetByIdAndCompanyId = (
    id: JobPostId,
    companyId: CompanyId,
) => Promise<JobPost | null>;
export type GetLatest = () => Promise<JobPost[]>;
export type Close = (
    jobPostId: JobPostId,
    companyId: CompanyId,
    closedAt: number,
) => Promise<JobPost>;

export interface JobPostRepository {
    create: Create;
    getAll: GetAll;
    getAllOpen: GetAllOpen;
    getAllByCompanyId: GetAllByCompanyId;
    getAllOpenByCompanyId: GetAllOpenByCompanyId;
    getByIdAndCompanyId: GetByIdAndCompanyId;
    getLatest: GetLatest;
    close: Close;
}
