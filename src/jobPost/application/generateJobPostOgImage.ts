import { Company } from 'company/domain/company';
import { JobPost, JobType } from 'jobPost/domain/jobPost';
import { formatJobPlaceLabel } from 'jobPost/domain/formatJobPlaceLabel';
import { formatSalaryHighlight } from 'jobPost/domain/formatSalaryRange';
import { renderJobPostOgImage } from 'jobPost/infrastructure/og/renderJobPostOgImage';

const JOB_TYPE_LABEL: Partial<Record<JobType, string>> = {
    [JobType.FullTime]: 'Full-time',
    [JobType.PartTime]: 'Part-time',
    [JobType.Contract]: 'Contract',
};

const buildJobPostOgMeta = (jobPost: JobPost): string | null => {
    const meta = [JOB_TYPE_LABEL[jobPost.type], formatJobPlaceLabel(jobPost)]
        .filter(Boolean)
        .join(' · ');

    return meta || null;
};

export const generateJobPostOgImage = async ({
    jobPost,
    company,
    logo = null,
    brandLogo = null,
}: {
    jobPost: JobPost;
    company: Company;
    logo?: Buffer | null;
    brandLogo?: Buffer | null;
}): Promise<Buffer> => {
    const salary = formatSalaryHighlight(jobPost.salaryRange);

    return renderJobPostOgImage({
        companyName: company.name,
        category: jobPost.category,
        title: jobPost.title,
        meta: buildJobPostOgMeta(jobPost),
        salaryAmount: salary?.amount ?? null,
        salaryCaption: salary?.caption ?? null,
        logo,
        brandLogo,
    });
};
