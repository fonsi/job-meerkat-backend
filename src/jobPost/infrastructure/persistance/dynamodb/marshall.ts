import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { JobPost } from 'jobPost/domain/jobPost';

export const marshall = (jobPost: JobPost): Record<string, AttributeValue> => {
  const { id, originalId, companyId, type, title, url, category, salaryRange, workplace, location, createdAt, closedAt } = jobPost;

  const item = {
    id: {
      S: id,
    },
    originalId: {
      S: originalId,
    },
    companyId: {
      S: companyId,
    },
    type: {
      S: type,
    },
    title: {
      S: title,
    },
    url: {
      S: url,
    },
    category: {
      S: category,
    },
    workplace: {
      S: workplace, 
    },
    location: {
      S: location,
    },
    createdAt: {
      N: createdAt.toString(),
    }
  };

  if (salaryRange) {
    if (salaryRange.currency) {
      item['salaryCurrency'] = {
        S: salaryRange.currency,
      }
    }

    if (salaryRange.min) {
      item['salaryMin'] = {
        N: salaryRange.min.toString(),
      }
    }

    if (salaryRange.max) {
      item['salaryMax'] = {
        N: salaryRange.max.toString(),
      }
    }
  }

  if (closedAt) {
    item['closedAt'] = {
      N: closedAt.toString(),
    }
  }

  return item;
};
