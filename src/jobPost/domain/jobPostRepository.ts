import { CompanyId } from 'company/domain/company';
import { JobPost, JobPostId } from './jobPost';

export type Create = (jobPost: JobPost) => Promise<JobPost>;
export type GetAll = () => Promise<JobPost[]>;
export type GetAllOpen = () => Promise<JobPost[]>;
export type GetAllByCompanyId = (companyId: CompanyId) => Promise<JobPost[]>;
export type GetAllOpenByCompanyId = (
    companyId: CompanyId,
) => Promise<JobPost[]>;
export type GetById = (jobPostId: JobPostId) => Promise<JobPost>;
export type GetByIdAndCompanyId = (
    id: JobPostId,
    companyId: CompanyId,
) => Promise<JobPost | null>;
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
    getById: GetById;
    getByIdAndCompanyId: GetByIdAndCompanyId;
    close: Close;
}
