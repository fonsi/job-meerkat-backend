import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { CompanyId } from 'company/domain/company';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';

export const unmarshall = (item: Record<string, AttributeValue>): JobPost => {
    try {
        const minSalary = parseFloat(item['salaryMin']?.['N']) || null;
        const maxSalary = parseFloat(item['salaryMax']?.['N']) || null;
        const salaryCurrency = item['salaryCurrency']?.['S'] || null;
        const salaryPeriod =
            (item['salaryPeriod']?.['S'] as Period) || Period.Year;
        const salaryRange =
            minSalary | maxSalary && salaryCurrency
                ? {
                      min: minSalary,
                      max: maxSalary,
                      currency: salaryCurrency,
                      period: salaryPeriod,
                  }
                : null;

        return {
            id: item['id']['S'] as JobPostId,
            originalId: item['originalId']['S'],
            companyId: item['companyId']['S'] as CompanyId,
            type: item['type']['S'] as JobType,
            title: item['title']['S'],
            url: item['url']['S'],
            category: item['category']['S'] as Category,
            workplace: item['workplace']['S'] as Workplace,
            location: item['location']['S'],
            salaryRange,
            createdAt: parseInt(item['createdAt']['N']),
            closedAt: parseInt(item['closedAt']?.['N']) || null,
            slug: item['slug']?.['S'] || '',
        };
    } catch (e) {
        throw new UnmarshallError(e.message, 'JobPost', item);
    }
};
