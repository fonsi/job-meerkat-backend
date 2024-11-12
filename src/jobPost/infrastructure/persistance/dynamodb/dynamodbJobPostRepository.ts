import { marshall } from './marshall';
import { unmarshall } from './unmarshall';
import { getItem, putItem, scan, updateItem, UpdateItemExpression } from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import { JobPostRepository, Create, GetById, GetAllOpenByCompanyId, GetAll, GetAllByCompanyId, GetByOriginalIdAndCompanyId, Close, GetAllOpen } from 'jobPost/domain/jobPostRepository';
import { CompanyId } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';

const JOB_POST_TABLE = process.env.DYNAMODB_JOB_POST_TABLE_NAME;

const isOpen = (jobPost: JobPost) => !jobPost.closedAt;
const buildIsFromCompany = (companyId: CompanyId) => (jobPost: JobPost) => jobPost.companyId === companyId;
const buildIsFromCompanyAndIsOpen = (companyId: CompanyId) => {
  const isFromCompany = buildIsFromCompany(companyId);

  return (jobPost: JobPost) => isFromCompany(jobPost) && isOpen(jobPost);
};

const create: Create = async (jobPost) => {
  try {
    const item = marshall(jobPost);

    await putItem(JOB_POST_TABLE, item);

    return jobPost;
  } catch (e) {
    throw new DynamodbError(e);
  }
};

const getById: GetById = async (jobPostId) => {
  try {
    const result = await getItem(JOB_POST_TABLE, {
      id: {
        N: jobPostId.toString(),
      },
    });
    const item = result.Item;

    if (!item) {
      return null;
    }

    return unmarshall(item);
  } catch (e) {
    throw new DynamodbError(e);
  }
};

const getAll: GetAll = async () => {
  try {
    const results = await scan(JOB_POST_TABLE, {});
    const items = results.Items;

    if (!items) {
      return [];
    }

    return items.map(unmarshall);
  } catch (e) {
    throw new DynamodbError(e);
  }
};

const getAllOpen: GetAllOpen = async () => {
  try {
    const allItems = await getAll();
    
    return allItems.filter(isOpen);
  } catch (e) {
    throw new DynamodbError(e);
  }
};

const getAllByCompanyId: GetAllByCompanyId = async (companyId) => {
  try {
    const allItems = await getAll();
    const isFromCompany = buildIsFromCompany(companyId);

    return allItems.filter(isFromCompany);
  } catch (e) {
    throw new DynamodbError(e);
  }
}

const getAllOpenByCompanyId: GetAllOpenByCompanyId = async (companyId) => {
  try {
    const allItems = await getAll();
    const isFromCompanyAndOpen = buildIsFromCompanyAndIsOpen(companyId);
    
    return allItems.filter(isFromCompanyAndOpen);
  } catch (e) {
    throw new DynamodbError(e);
  }
}

const getByOriginalIdAndCompanyId: GetByOriginalIdAndCompanyId = async (originalId, companyId) => {
    const companyJobPosts = await getAllByCompanyId(companyId);

    return companyJobPosts.find(jobPost => jobPost.originalId === originalId);
}

const close: Close = async (jobPostId, companyId, closedAt) => {
    const update: UpdateItemExpression = {
      Key: {
        id: {
          S: jobPostId,
        },
        companyId: {
          S: companyId,
        },
      },
      UpdateExpression:
        'SET closedAt = :closedAt',
      ExpressionAttributeValues: {
        ':closedAt': {
          N: closedAt.toString(),
        },
      },
    };
    
    const result = await updateItem(JOB_POST_TABLE, update);
    const item = result.Attributes;

    if (!item) {
      return null;
    }

    return unmarshall(item);
}

export const jobPostRepository = {
  create,
  getAll,
  getAllOpen,
  getAllByCompanyId,
  getAllOpenByCompanyId,
  getById,
  getByOriginalIdAndCompanyId,
  close,
} as JobPostRepository;
