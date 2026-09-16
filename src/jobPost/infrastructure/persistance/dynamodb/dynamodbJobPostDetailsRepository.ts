import { AttributeValue, TransactWriteItem } from '@aws-sdk/client-dynamodb';
import { CompanyId } from 'company/domain/company';
import {
    JobPostDetails,
    JobPostId,
    normalizeJobPostDetails,
} from 'jobPost/domain/jobPost';
import {
    deleteItem,
    getItem,
    putItem,
} from 'shared/infrastructure/persistance/dynamodb';

const JOB_POST_DETAIL_TABLE = process.env.DYNAMODB_JOB_POST_DETAIL_TABLE_NAME;

type PutJobPostDetailsData = {
    jobPostId: JobPostId;
    companyId: CompanyId;
    details: JobPostDetails | null | undefined;
};

export const marshallJobPostDetailItem = (
    jobPostId: JobPostId,
    companyId: CompanyId,
    details: JobPostDetails,
): Record<string, AttributeValue> => ({
    jobPostId: { S: jobPostId },
    companyId: { S: companyId },
    details: { S: JSON.stringify(details) },
});

export const unmarshallJobPostDetailItem = (
    item?: Record<string, AttributeValue>,
): JobPostDetails | undefined => {
    if (!item?.details?.S) return undefined;

    try {
        return normalizeJobPostDetails(JSON.parse(item.details.S));
    } catch {
        return undefined;
    }
};

const detailsKey = (jobPostId: JobPostId) => ({
    jobPostId: { S: jobPostId },
});

export const putJobPostDetailTransactItem = ({
    jobPostId,
    companyId,
    details,
}: PutJobPostDetailsData): TransactWriteItem | undefined => {
    const normalized = normalizeJobPostDetails(details);
    if (!normalized) return undefined;

    return {
        Put: {
            TableName: JOB_POST_DETAIL_TABLE,
            Item: marshallJobPostDetailItem(jobPostId, companyId, normalized),
        },
    };
};

export const deleteJobPostDetailTransactItem = (
    jobPostId: JobPostId,
): TransactWriteItem => ({
    Delete: {
        TableName: JOB_POST_DETAIL_TABLE,
        Key: detailsKey(jobPostId),
    },
});

const put = async ({
    jobPostId,
    companyId,
    details,
}: PutJobPostDetailsData): Promise<JobPostDetails | undefined> => {
    const normalized = normalizeJobPostDetails(details);
    if (!normalized) return undefined;

    await putItem(
        JOB_POST_DETAIL_TABLE,
        marshallJobPostDetailItem(jobPostId, companyId, normalized),
    );

    return normalized;
};

const getByJobPostId = async (
    jobPostId: JobPostId,
): Promise<JobPostDetails | undefined> => {
    const result = await getItem(JOB_POST_DETAIL_TABLE, detailsKey(jobPostId));

    return unmarshallJobPostDetailItem(result.Item);
};

const remove = async (jobPostId: JobPostId): Promise<void> => {
    await deleteItem(JOB_POST_DETAIL_TABLE, detailsKey(jobPostId));
};

export const jobPostDetailsRepository = {
    put,
    getByJobPostId,
    remove,
    putTransactItem: putJobPostDetailTransactItem,
    deleteTransactItem: deleteJobPostDetailTransactItem,
};
