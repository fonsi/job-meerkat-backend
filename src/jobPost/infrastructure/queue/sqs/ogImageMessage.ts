import { CompanyId } from 'company/domain/company';
import { JobPostId } from 'jobPost/domain/jobPost';

export type GenerateJobPostOgImageMessage = {
    companyId: CompanyId;
    jobPostId: JobPostId;
};
