import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import { unmarshall } from './unmarshall';
import { JobPost, JobType, Period, Workplace } from 'jobPost/domain/jobPost';

const baseDbItem = {
  id: {
    S: '12345-31231-4123-13123-231312231231',
  },
  originalId: {
    S: '123456',
  },
  companyId: {
    S: '8547-5353-4986-4234-985394869',
  },
  type: {
    S: 'fullTime',
  },
  title: {
    S: 'Job title',
  },
  url: {
    S: 'https://jobs.com/careers/123456',
  },
  category: {
    S: 'frontend',
  },
  salaryCurrency: {
    S: 'eur',
  },
  salaryMin: {
    N: '6000',
  },
  salaryMax: {
    N: '7500',
  },
  salaryPeriod: {
    S: 'month',
  },
  workplace: {
    S: 'remote',
  },
  location: {
    S: 'EMEA',
  },
  createdAt: {
    N: '1730217826109',
  },
  closedAt: {
    N: null,
  },
};

const baseJobPost: JobPost = {
  id: '12345-31231-4123-13123-231312231231',
  originalId: '123456',
  companyId: '8547-5353-4986-4234-985394869',
  type: JobType.FullTime,
  url: 'https://jobs.com/careers/123456',
  title: 'Job title',
  category: 'frontend',
  salaryRange: {
    min:  6000,
    max:  7500,
    currency: 'eur',
    period: Period.Month,
  },
  workplace: Workplace.Remote,
  location: 'EMEA',
  createdAt: 1730217826109,
  closedAt: null,
};

describe('DynamoDB job post unmarshall', () => {
  it('should return a JobPost from an Item', () => {
    expect(unmarshall(baseDbItem)).toEqual(baseJobPost);
  });

  it('should return a JobPost without salary data', () => {
    const item = {
      ...baseDbItem,
      salaryCurrency: {
        S: null,
      },
      salaryMin: {
        N: null,
      },
      salaryMax: {
        N: null,
      },
    };

    const jobPost: JobPost = {
      ...baseJobPost,
      salaryRange: null,
    };

    expect(unmarshall(item)).toEqual(jobPost);
  });

  it('should return a closed JobPost', () => {
    const item = {
      ...baseDbItem,
      closedAt: {
        N: '1730218065637',
      },
    };

    const jobPost: JobPost = {
      ...baseJobPost,
      closedAt: 1730218065637,
    };

    expect(unmarshall(item)).toEqual(jobPost);
  });

  it('should return a JobPost without salary period', () => {
    const item = {
      ...baseDbItem,
      salaryPeriod: undefined,
    };

    const jobPost: JobPost = {
      ...baseJobPost,
      salaryRange: {
        ...baseJobPost.salaryRange,
        period: Period.Year,
      }
    };

    expect(unmarshall(item)).toEqual(jobPost);
  });

  it('should throw UnmarshallError if something goes wrong', () => {
    const item = {
      id: {
        S: 'fea19519-c97b-47e6-b916-5a475d6a41c1',
      },
    };

    expect(() => unmarshall(item)).toThrow(UnmarshallError);
  });
});
