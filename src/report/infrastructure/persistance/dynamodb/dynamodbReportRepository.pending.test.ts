import { updateItem } from 'shared/infrastructure/persistance/dynamodb';
import { reportRepository } from './dynamodbReportRepository';

jest.mock('shared/infrastructure/persistance/dynamodb', () => ({
    deleteItem: jest.fn(),
    getItem: jest.fn(),
    putItem: jest.fn(),
    query: jest.fn(),
    scan: jest.fn(),
    updateItem: jest.fn(),
}));

describe('dynamodbReportRepository pending lifecycle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resetToPending refreshes createdAt and clears reminderSentAt', async () => {
        const now = 1_700_000_000_000;
        jest.spyOn(Date, 'now').mockReturnValue(now);

        (updateItem as jest.Mock).mockResolvedValue({
            Attributes: {
                id: { S: 'report-1' },
                email: { S: 'user@example.com' },
                emailNormalized: { S: 'user@example.com' },
                status: { S: 'pending' },
                frequency: { S: 'daily' },
                createdAt: { N: now.toString() },
                unsubscribeToken: { S: 'new-token' },
            },
        });

        const report = await reportRepository.resetToPending(
            'report-1',
            'new-token',
        );

        expect(updateItem).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                UpdateExpression:
                    'SET #status = :status, unsubscribeToken = :token, createdAt = :createdAt REMOVE confirmedAt, unsubscribedAt, reminderSentAt',
                ExpressionAttributeValues: {
                    ':status': { S: 'pending' },
                    ':token': { S: 'new-token' },
                    ':createdAt': { N: now.toString() },
                },
            }),
        );
        expect(report.createdAt).toBe(now);
        expect(report.reminderSentAt).toBeUndefined();

        jest.restoreAllMocks();
    });
});
