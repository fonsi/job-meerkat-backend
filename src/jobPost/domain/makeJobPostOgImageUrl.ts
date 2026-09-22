import { CompanyId } from 'company/domain/company';
import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';
import { JobPostId } from './jobPost';

export const makeJobPostOgImageKey = ({
    companyId,
    jobPostId,
}: {
    companyId: CompanyId;
    jobPostId: JobPostId;
}) => `company/${companyId}/jobpost/${jobPostId}/og.png`;

export const makeJobPostOgImageUrl = ({
    companyId,
    jobPostId,
}: {
    companyId: CompanyId;
    jobPostId: JobPostId;
}) => `${ASSETS_BASE_URL}/${makeJobPostOgImageKey({ companyId, jobPostId })}`;
