import { UUID } from 'crypto';
import { putItem, scan } from 'shared/infrastructure/persistance/dynamodb';
import { FollowerGrowthContent } from 'social/domain/followerGrowthContent';
import {
    followerGrowthContentRepository,
    marshallFollowerGrowthContent,
    unmarshallFollowerGrowthContent,
} from './dynamodbFollowerGrowthContentRepository';

jest.mock('shared/infrastructure/persistance/dynamodb', () => ({
    putItem: jest.fn(),
    scan: jest.fn(),
}));

const content: FollowerGrowthContent = {
    id: '12345-31231-4123-13123-231312231231' as UUID,
    generatedAt: 1789912800000,
    family: 'salaryIntelligence',
    topicKey: 'backend-salary-ceilings',
    summary: 'A comparison of current backend salary ceilings.',
};

describe('follower growth content persistence', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('round-trips DynamoDB items', () => {
        expect(
            unmarshallFollowerGrowthContent(
                marshallFollowerGrowthContent(content),
            ),
        ).toEqual(content);
    });

    it('loads and stores history', async () => {
        const item = marshallFollowerGrowthContent(content);
        (scan as jest.Mock).mockResolvedValue({ Items: [item] });
        (putItem as jest.Mock).mockResolvedValue({});

        await expect(followerGrowthContentRepository.getAll()).resolves.toEqual(
            [content],
        );
        await followerGrowthContentRepository.add(content);

        expect(putItem).toHaveBeenCalledWith(undefined, item);
    });

    it('rejects invalid stored families', () => {
        expect(() =>
            unmarshallFollowerGrowthContent({
                ...marshallFollowerGrowthContent(content),
                family: { S: 'invalid' },
            }),
        ).toThrow('Invalid follower growth family');
    });
});
