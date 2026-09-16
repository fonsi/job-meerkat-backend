import { marshall } from './marshall';
import {
    Category,
    JobPost,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';

const baseJobPost: JobPost = {
    id: '12345-31231-4123-13123-231312231231',
    originalId: '123456',
    companyId: '8547-5353-4986-4234-985394869',
    type: JobType.FullTime,
    url: 'https://jobs.com/careers/123456',
    title: 'Job title',
    category: Category.Frontend,
    salaryRange: {
        min: 6000,
        max: 7500,
        currency: 'eur',
        period: Period.Month,
    },
    workplace: Workplace.Remote,
    location: 'EMEA',
    createdAt: 1730217826109,
    closedAt: null,
    slug: 'job-title-at-test-company-123e4567',
};

const baseItem = {
    id: { S: baseJobPost.id },
    originalId: { S: baseJobPost.originalId },
    companyId: { S: baseJobPost.companyId },
    type: { S: 'fullTime' },
    title: { S: baseJobPost.title },
    url: { S: baseJobPost.url },
    category: { S: 'Frontend' },
    workplace: { S: 'remote' },
    location: { S: 'EMEA' },
    createdAt: { N: '1730217826109' },
    slug: { S: baseJobPost.slug },
    salaryCurrency: { S: 'eur' },
    salaryMin: { N: '6000' },
    salaryMax: { N: '7500' },
    salaryPeriod: { S: 'month' },
};

describe('DynamoDB job post marshall', () => {
    it('should omit details from the job post item', () => {
        expect(
            marshall({
                ...baseJobPost,
                details: {
                    summary: 'Build the customer dashboard.',
                    stack: ['TypeScript'],
                },
            }),
        ).toEqual(baseItem);
    });
});
