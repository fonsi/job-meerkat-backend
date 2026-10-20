import { index } from './handler';
import { processCompany } from 'company/application/processCompany';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';

jest.mock('company/application/processCompany', () => ({
    processCompany: jest.fn(),
}));

jest.mock('shared/infrastructure/logger/logger', () => ({
    initializeLogger: jest.fn(),
    logger: {
        error: jest.fn(),
        wait: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('processCompanyConsumer handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rethrows after logging so SQS can retry', async () => {
        (processCompany as jest.Mock).mockRejectedValue(
            new Error('dynamodb write failed'),
        );

        await expect(
            index({
                Records: [{ body: '123e4567-e89b-12d3-a456-426614174000' }],
            }),
        ).rejects.toThrow(
            'Process companies consumer error - dynamodb write failed',
        );

        expect(initializeLogger).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
        expect(logger.wait).toHaveBeenCalled();
    });
});
