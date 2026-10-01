import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';

export type JobPostPageCache = {
    id: JobPost['id'];
    slug: string;
    title: string;
    url: string;
    type: JobPost['type'];
    company: {
        id: Company['id'];
        name: string;
        logo: Company['logo'];
        description?: string;
    };
    salaryRange: JobPost['salaryRange'];
    workplace: JobPost['workplace'];
    location: string;
    createdAt: number;
    closedAt: number | null;
    category: JobPost['category'];
    details?: JobPost['details'];
};

export const jobPostPageCacheKey = (slug: string): string =>
    `jobpost/${slug}.json`;

export const toJobPostPageCache = (
    jobPost: JobPost,
    company: Pick<Company, 'id' | 'name' | 'logo' | 'description'>,
): JobPostPageCache => ({
    id: jobPost.id,
    slug: jobPost.slug,
    title: jobPost.title,
    url: jobPost.url,
    type: jobPost.type,
    company: {
        id: company.id,
        name: company.name,
        logo: company.logo,
        ...(company.description ? { description: company.description } : {}),
    },
    salaryRange: jobPost.salaryRange,
    workplace: jobPost.workplace,
    location: jobPost.location,
    createdAt: jobPost.createdAt,
    closedAt: jobPost.closedAt,
    category: jobPost.category,
    ...(jobPost.details ? { details: jobPost.details } : {}),
});
