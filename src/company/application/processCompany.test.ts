import { processCompany } from './processCompany';
import { Company, CompanyId } from 'company/domain/company';
import { JobPost, JobType, Category, Workplace } from 'jobPost/domain/jobPost';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { getNewCompanyScrapper } from 'company/infrastructure/scrapping/companyScrapper';
import { createJobPost } from 'jobPost/application/createJobPost';
import { enqueueJobPostOgImage } from 'jobPost/infrastructure/queue/sqs/enqueue';
import { closeJobPost } from 'jobPost/application/closeJobPost';
import { logger } from 'shared/infrastructure/logger/logger';

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
    () => ({
        companyRepository: {
            getById: jest.fn(),
        },
    }),
);

jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
    () => ({
        jobPostRepository: {
            getAllByCompanyId: jest.fn(),
            update: jest.fn(async (jobPost) => jobPost),
        },
    }),
);

jest.mock('company/infrastructure/scrapping/companyScrapper', () => ({
    getNewCompanyScrapper: jest.fn(),
}));

jest.mock('jobPost/application/createJobPost', () => ({
    createJobPost: jest.fn(async (command) => ({
        id: '123e4567-e89b-12d3-a456-426614174222',
        companyId: command.company.id,
    })),
}));

jest.mock('jobPost/infrastructure/queue/sqs/enqueue', () => ({
    enqueueJobPostOgImage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('jobPost/application/closeJobPost', () => ({
    closeJobPost: jest.fn(),
}));

jest.mock('jobPost/application/storeJobPostPageCache', () => ({
    storeJobPostPageCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('shared/infrastructure/logger/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

const completeScrapedPost = (
    companyId: CompanyId,
    originalId: string,
    title: string,
) => ({
    originalId,
    companyId,
    type: JobType.FullTime,
    title,
    url: `https://jobs.example.com/${originalId}`,
    category: Category.Backend,
    salaryRange: null,
    workplace: Workplace.Remote,
    location: 'worldwide',
});

describe('processCompany', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (createJobPost as jest.Mock).mockImplementation(async (command) => ({
            id: '123e4567-e89b-12d3-a456-426614174222',
            companyId: command.company.id,
        }));
    });

    it('reopens an existing closed job post instead of creating a duplicate', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        const closedJobPost = {
            id: '123e4567-e89b-12d3-a456-426614174111',
            companyId,
            originalId: 'external-1',
            type: JobType.FullTime,
            title: 'Backend Engineer',
            url: 'https://jobs.example.com/1',
            category: Category.Backend,
            salaryRange: null,
            workplace: Workplace.Remote,
            location: 'worldwide',
            createdAt: 1700000000000,
            closedAt: 1701000000000,
            slug: 'backend-engineer-at-test-company-post1',
        } as unknown as JobPost;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue([
            closedJobPost,
        ]);

        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 'external-1',
                    url: 'https://jobs.example.com/1',
                    title: 'Backend Engineer',
                },
            ]),
            scrapJobPost: jest.fn().mockResolvedValue([
                {
                    originalId: 'external-1',
                    companyId,
                    type: JobType.FullTime,
                    title: 'Backend Engineer Updated',
                    url: 'https://jobs.example.com/1',
                    category: Category.Backend,
                    salaryRange: null,
                    workplace: Workplace.Remote,
                    location: 'worldwide',
                },
            ]),
        }));

        await processCompany({ companyId });

        expect(jobPostRepository.update).toHaveBeenCalledTimes(1);
        expect(createJobPost).not.toHaveBeenCalled();
        expect(closeJobPost).not.toHaveBeenCalled();
        expect(enqueueJobPostOgImage).toHaveBeenCalledWith({
            companyId,
            jobPostId: closedJobPost.id,
        });
    });

    it('skips scraping when the company is disabled', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
            status: 'disabled',
            statusMessage: 'Shut down',
        } as unknown as Company;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);

        await processCompany({ companyId });

        expect(getNewCompanyScrapper).not.toHaveBeenCalled();
        expect(createJobPost).not.toHaveBeenCalled();
        expect(closeJobPost).not.toHaveBeenCalled();
    });

    it('skips updates when the job listing is unavailable', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest
                .fn()
                .mockRejectedValue(
                    new Error('Response status code 404: Not Found'),
                ),
            scrapJobPost: jest.fn(),
        }));

        await processCompany({ companyId });

        expect(jobPostRepository.getAllByCompanyId).not.toHaveBeenCalled();
        expect(createJobPost).not.toHaveBeenCalled();
        expect(closeJobPost).not.toHaveBeenCalled();
    });

    it('skips incomplete scraped posts instead of creating them', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue(
            [],
        );
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 'external-1',
                    url: 'https://jobs.example.com/1',
                    title: 'Backend Engineer',
                },
                {
                    id: 'external-2',
                    url: 'https://jobs.example.com/2',
                    title: 'Frontend Engineer',
                },
            ]),
            scrapJobPost: jest.fn().mockResolvedValue([
                {
                    originalId: 'external-1',
                    companyId,
                    url: 'https://jobs.example.com/1',
                },
                {
                    originalId: 'external-2',
                    companyId,
                    type: JobType.FullTime,
                    title: 'Frontend Engineer',
                    url: 'https://jobs.example.com/2',
                    category: Category.Frontend,
                    salaryRange: null,
                    workplace: Workplace.Remote,
                    location: 'worldwide',
                },
            ]),
        }));

        await processCompany({ companyId });

        expect(createJobPost).toHaveBeenCalledTimes(1);
        expect(createJobPost).toHaveBeenCalledWith(
            expect.objectContaining({ originalId: 'external-2' }),
        );
        expect(enqueueJobPostOgImage).toHaveBeenCalledWith({
            companyId,
            jobPostId: '123e4567-e89b-12d3-a456-426614174222',
        });
        expect(jobPostRepository.update).not.toHaveBeenCalled();
    });

    it('does not reopen a closed job from an incomplete scrape', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        const closedJobPost = {
            id: '123e4567-e89b-12d3-a456-426614174111',
            companyId,
            originalId: 'external-1',
            type: JobType.FullTime,
            title: 'Backend Engineer',
            url: 'https://jobs.example.com/1',
            category: Category.Backend,
            salaryRange: null,
            workplace: Workplace.Remote,
            location: 'worldwide',
            createdAt: 1700000000000,
            closedAt: 1701000000000,
            slug: 'backend-engineer-at-test-company-post1',
        } as unknown as JobPost;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue([
            closedJobPost,
        ]);
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 'external-1',
                    url: 'https://jobs.example.com/1',
                    title: 'Backend Engineer',
                },
            ]),
            scrapJobPost: jest.fn().mockResolvedValue([
                {
                    originalId: 'external-1',
                    companyId,
                    url: 'https://jobs.example.com/1',
                },
            ]),
        }));

        await processCompany({ companyId });

        expect(jobPostRepository.update).not.toHaveBeenCalled();
        expect(createJobPost).not.toHaveBeenCalled();
    });

    it('creates other job posts when one create fails', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue(
            [],
        );
        (createJobPost as jest.Mock)
            .mockRejectedValueOnce(new Error('dynamodb write failed'))
            .mockResolvedValueOnce({
                id: '123e4567-e89b-12d3-a456-426614174222',
                companyId,
            });
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 'external-1',
                    url: 'https://jobs.example.com/1',
                    title: 'Backend Engineer',
                },
                {
                    id: 'external-2',
                    url: 'https://jobs.example.com/2',
                    title: 'Frontend Engineer',
                },
            ]),
            scrapJobPost: jest.fn().mockResolvedValue([
                completeScrapedPost(
                    companyId,
                    'external-1',
                    'Backend Engineer',
                ),
                {
                    ...completeScrapedPost(
                        companyId,
                        'external-2',
                        'Frontend Engineer',
                    ),
                    category: Category.Frontend,
                },
            ]),
        }));

        await expect(processCompany({ companyId })).rejects.toThrow(
            'Failed to persist 1 job post(s) for test-company',
        );

        expect(createJobPost).toHaveBeenCalledTimes(2);
        expect(enqueueJobPostOgImage).toHaveBeenCalledTimes(1);
    });

    it('matches numeric listed ids to stored string originalIds without create or close', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        const openJobPost = {
            id: '123e4567-e89b-12d3-a456-426614174111',
            companyId,
            originalId: '8855945002',
            type: JobType.FullTime,
            title: 'Lead Product Manager',
            url: 'https://lattice.com/job?gh_jid=8855945002',
            category: Category.Product,
            salaryRange: null,
            workplace: Workplace.Remote,
            location: 'worldwide',
            createdAt: 1700000000000,
            closedAt: null,
            slug: 'lead-product-manager-at-test-company-post1',
        } as unknown as JobPost;

        const scrapJobPost = jest.fn().mockResolvedValue([]);

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue([
            openJobPost,
        ]);
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 8855945002 as unknown as string,
                    url: 'https://lattice.com/job?gh_jid=8855945002',
                    title: 'Lead Product Manager',
                },
            ]),
            scrapJobPost,
        }));

        await processCompany({ companyId });

        expect(createJobPost).not.toHaveBeenCalled();
        expect(closeJobPost).not.toHaveBeenCalled();
        expect(jobPostRepository.update).not.toHaveBeenCalled();
        expect(scrapJobPost).toHaveBeenCalledWith([]);
    });

    it('does not reopen or duplicate when open and closed twins share an originalId', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        const openJobPost = {
            id: '123e4567-e89b-12d3-a456-426614174111',
            companyId,
            originalId: '8855945002',
            type: JobType.FullTime,
            title: 'Lead Product Manager',
            url: 'https://lattice.com/job?gh_jid=8855945002',
            category: Category.Product,
            salaryRange: null,
            workplace: Workplace.Remote,
            location: 'worldwide',
            createdAt: 1700000000000,
            closedAt: null,
            slug: 'lead-product-manager-at-test-company-open',
        } as unknown as JobPost;

        const closedJobPost = {
            id: '123e4567-e89b-12d3-a456-426614174222',
            companyId,
            originalId: '8855945002',
            type: JobType.FullTime,
            title: 'Lead Product Manager',
            url: 'https://lattice.com/job?gh_jid=8855945002',
            category: Category.Product,
            salaryRange: null,
            workplace: Workplace.Remote,
            location: 'worldwide',
            createdAt: 1690000000000,
            closedAt: 1701000000000,
            slug: 'lead-product-manager-at-test-company-closed',
        } as unknown as JobPost;

        const scrapJobPost = jest.fn().mockResolvedValue([]);

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue([
            openJobPost,
            closedJobPost,
        ]);
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 8855945002 as unknown as string,
                    url: 'https://lattice.com/job?gh_jid=8855945002',
                    title: 'Lead Product Manager',
                },
            ]),
            scrapJobPost,
        }));

        await processCompany({ companyId });

        expect(createJobPost).not.toHaveBeenCalled();
        expect(closeJobPost).not.toHaveBeenCalled();
        expect(jobPostRepository.update).not.toHaveBeenCalled();
        expect(scrapJobPost).toHaveBeenCalledWith([]);
    });

    it('creates a genuinely new job once when listed id is numeric', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue(
            [],
        );
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 8855945002 as unknown as string,
                    url: 'https://lattice.com/job?gh_jid=8855945002',
                    title: 'Lead Product Manager',
                },
            ]),
            scrapJobPost: jest
                .fn()
                .mockResolvedValue([
                    completeScrapedPost(
                        companyId,
                        '8855945002',
                        'Lead Product Manager',
                    ),
                ]),
        }));

        await processCompany({ companyId });

        expect(createJobPost).toHaveBeenCalledTimes(1);
        expect(createJobPost).toHaveBeenCalledWith(
            expect.objectContaining({ originalId: '8855945002' }),
        );
        expect(closeJobPost).not.toHaveBeenCalled();
        expect(jobPostRepository.update).not.toHaveBeenCalled();
    });

    it('skips listed job posts with a missing id instead of treating them as new', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        const scrapJobPost = jest.fn().mockResolvedValue([]);

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue(
            [],
        );
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: null as unknown as string,
                    url: 'https://jobs.example.com/missing',
                    title: 'Missing Id Role',
                },
            ]),
            scrapJobPost,
        }));

        await processCompany({ companyId });

        expect(logger.info).toHaveBeenCalledWith(
            'Skipping listed job post with missing id for test-company',
            expect.objectContaining({
                companyId,
                title: 'Missing Id Role',
            }),
        );
        expect(createJobPost).not.toHaveBeenCalled();
        expect(closeJobPost).not.toHaveBeenCalled();
        expect(scrapJobPost).toHaveBeenCalledWith([]);
    });
    it('warns when a scraped originalId does not match the listed id', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;
        const warnSpy = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue(
            [],
        );
        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: '5797272',
                    url: 'https://feeldco.workable.com/jobs/5797272',
                    title: 'Director of Global Markets',
                },
            ]),
            scrapJobPost: jest
                .fn()
                .mockResolvedValue([
                    completeScrapedPost(
                        companyId,
                        '24D9AA3784',
                        'Director of Global Markets',
                    ),
                ]),
        }));

        await processCompany({ companyId });

        expect(warnSpy).toHaveBeenCalledWith(
            'Scraped originalId does not match any listed id for test-company',
            expect.objectContaining({ originalId: '24D9AA3784' }),
        );
        expect(logger.info).toHaveBeenCalledWith(
            'Scraped originalId does not match any listed id for test-company',
            expect.objectContaining({ companyId, originalId: '24D9AA3784' }),
        );
        warnSpy.mockRestore();
    });
});
