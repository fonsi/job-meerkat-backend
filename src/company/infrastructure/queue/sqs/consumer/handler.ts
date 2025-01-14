import 'source-map-support/register';
import { processCompany } from 'company/application/processCompany';
import { CompanyId } from 'company/domain/company';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';

const companiesIdsToString = (event): string =>
    event.Records.map((record) => record.body as unknown as string).join(',');

export const index = async (event): Promise<void> => {
    initializeLogger();

    let companiesToProcess = '';

    try {
        companiesToProcess = companiesIdsToString(event);

        console.log(`[COMPANIES IDS TO PROCESS]: ${companiesToProcess}`);

        const processCompaniesBatch: Promise<void>[] = event.Records.map(
            (record) => {
                const companyId = record.body as unknown as CompanyId;

                return processCompany({ companyId });
            },
        );

        await Promise.all(processCompaniesBatch);
    } catch (e) {
        const error = errorWithPrefix(e, 'Process companies consumer error');

        logger.error(error, {
            companiesToProcess,
        });

        await logger.wait();
    }
};
