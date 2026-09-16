import {
    deleteItem,
    putItem,
} from 'shared/infrastructure/persistance/dynamodb';
import { CompanyId } from 'company/domain/company';
import { JobPostId } from 'jobPost/domain/jobPost';
import {
    jobPostDetailsRepository,
    marshallJobPostDetailItem,
    unmarshallJobPostDetailItem,
} from './dynamodbJobPostDetailsRepository';

jest.mock('shared/infrastructure/persistance/dynamodb', () => ({
    deleteItem: jest.fn(),
    getItem: jest.fn(),
    putItem: jest.fn(),
}));

const jobPostId = '12345-31231-4123-13123-231312231231' as JobPostId;
const companyId = '8547-5353-4986-4234-985394869' as CompanyId;
const details = {
    summary: 'Build the customer dashboard.',
    stack: ['TypeScript', 'React'],
};

describe('job post detail marshall', () => {
    it('round-trips summarized details as JSON', () => {
        const item = marshallJobPostDetailItem(jobPostId, companyId, details);

        expect(item).toEqual({
            jobPostId: { S: jobPostId },
            companyId: { S: companyId },
            details: { S: JSON.stringify(details) },
        });
        expect(unmarshallJobPostDetailItem(item)).toEqual(details);
    });

    it('omits empty details', () => {
        expect(
            unmarshallJobPostDetailItem({
                jobPostId: { S: jobPostId },
                details: { S: JSON.stringify({ summary: '  ', stack: [] }) },
            }),
        ).toBeUndefined();
    });

    it('omits corrupt details JSON', () => {
        expect(
            unmarshallJobPostDetailItem({
                jobPostId: { S: jobPostId },
                details: { S: '{not-json' },
            }),
        ).toBeUndefined();
    });
});

describe('job post detail repository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not delete when details are missing', async () => {
        await expect(
            jobPostDetailsRepository.put({
                jobPostId,
                companyId,
                details: undefined,
            }),
        ).resolves.toBeUndefined();

        expect(deleteItem).not.toHaveBeenCalled();
        expect(putItem).not.toHaveBeenCalled();
    });

    it('does not delete when details normalize to empty', async () => {
        await expect(
            jobPostDetailsRepository.put({
                jobPostId,
                companyId,
                details: { summary: '  ', stack: [] },
            }),
        ).resolves.toBeUndefined();

        expect(deleteItem).not.toHaveBeenCalled();
        expect(putItem).not.toHaveBeenCalled();
    });
});
