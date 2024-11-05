import 'source-map-support/register';
import { SQSEvent, SQSHandler } from 'aws-lambda';
import { processCompany } from 'company/application/processCompany';
import { CompanyId } from 'company/domain/company';

const companiesIdsToString = (event: SQSEvent): string =>
  event.Records.map((record) => (record.body as unknown) as string).join(',');

export const index: SQSHandler = async (event): Promise<void> => {
  try {
    console.log(`[COMPANIES IDS TO PROCESS]: ${companiesIdsToString(event)}`);

    const processCompaniesBatch: Promise<void>[] = event.Records.map((record) => {
      const companyId = (record.body as unknown) as CompanyId;

      return processCompany({ companyId });
    });

    await Promise.all(processCompaniesBatch);
  } catch (e) {
    console.log('Company consumer error', e);
  }
};
