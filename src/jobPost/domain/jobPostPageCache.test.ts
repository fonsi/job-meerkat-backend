import { CompanyId } from 'company/domain/company';
import { Category, JobPost, JobType, Workplace } from 'jobPost/domain/jobPost';
import { jobPostPageCacheKey, toJobPostPageCache } from './jobPostPageCache';

const jobPost = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    originalId: 'orig',
    companyId: '123e4567-e89b-12d3-a456-426614174001' as CompanyId,
    type: JobType.FullTime,
    url: 'https://example.com/jobs/1',
    title: 'Engineer',
    category: Category.Backend,
    salaryRange: null,
    workplace: Workplace.Remote,
    location: 'EU',
    createdAt: 1,
    closedAt: null,
    slug: 'engineer-at-acme-abc',
} as JobPost;

describe('jobPostPageCache', () => {
    it('builds the private object key from the slug', () => {
        expect(jobPostPageCacheKey(jobPost.slug)).toBe(
            'jobpost/engineer-at-acme-abc.json',
        );
    });

    it('keeps the company fields the page renders', () => {
        expect(
            toJobPostPageCache(jobPost, {
                id: '123e4567-e89b-12d3-a456-426614174001' as CompanyId,
                name: 'Acme',
                logo: { url: 'https://cdn.example/logo.png' },
                description: 'Tools',
            }),
        ).toMatchObject({
            slug: jobPost.slug,
            company: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Acme',
                description: 'Tools',
            },
        });
    });
});
