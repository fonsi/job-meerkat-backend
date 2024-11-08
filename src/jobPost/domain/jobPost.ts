import { CompanyId } from 'company/domain/company';
import { randomUUID, UUID } from 'crypto';

export type JobPostId = UUID;

export enum JobType { FullTime = 'fullTime', PartTime = 'partTime', Contract = 'contract', Unknown = 'unknown' };
export enum Workplace { Remote = 'remote', OnSite = 'onSite', Hybrid = 'hybrid', Unknown = 'unknown' };

export type JobPost = {
    id: JobPostId;
    originalId: string;
    companyId: CompanyId;
    type: JobType;
    url: string;
    title: string;
    category: string;
    salaryRange: {
      min?:  number;
      max:  number;
      currency: string;
    } | null,
    workplace: Workplace;
    location: string;
    createdAt: number;
    closedAt: number | null;
}

export type CreateJobPostData = Omit<JobPost, 'id' | 'createdAt' | 'closedAt'> & {
  createdAt?: number  | null;
};

export const createJobPost = (data: CreateJobPostData): JobPost => {
    const id = randomUUID();
    const createdAt = data.createdAt || Date.now();
    const closedAt = null;

    return {
      id,
      createdAt,
      closedAt,
      ...data,
    }
}

export const closeJobPost = (jobPost: JobPost): JobPost => {
  const closedAt = Date.now();

  return {
    ...jobPost,
    closedAt,
  }
}