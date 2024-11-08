import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository'
import { enqueue } from 'company/infrastructure/queue/sqs/enqueue';

export const scheduleCompaniesToProcess = async (): Promise<void> => {
    const companies = await companyRepository.getAll();
    console.log(`Scheduling ${companies.length} companies`);
    const scheduleCompanyPromises = companies.map(company => enqueue(company.id));

    await Promise.all(scheduleCompanyPromises);
}