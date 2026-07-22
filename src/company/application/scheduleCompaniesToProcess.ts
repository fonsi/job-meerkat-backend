import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { enqueue } from 'company/infrastructure/queue/sqs/enqueue';
import { isCompanyDisabled } from 'company/domain/company';

export const scheduleCompaniesToProcess = async (): Promise<void> => {
    const companies = (await companyRepository.getAll()).filter(
        (company) => !isCompanyDisabled(company),
    );
    console.log(`Scheduling ${companies.length} companies`);
    const scheduleCompanyPromises = companies.map((company) =>
        enqueue(company.id),
    );

    await Promise.all(scheduleCompanyPromises);
};
