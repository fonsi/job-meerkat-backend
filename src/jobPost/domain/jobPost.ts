import { CompanyId } from 'company/domain/company';
import { randomUUID, UUID } from 'crypto';

export type JobPostId = UUID;
export type CategoryTree = Array<{
  name: string;
  categories: Category[]
}>;

export enum JobType { FullTime = 'fullTime', PartTime = 'partTime', Contract = 'contract', Unknown = 'unknown' };
export enum Workplace { Remote = 'remote', OnSite = 'onSite', Hybrid = 'hybrid', Unknown = 'unknown' };
export enum Period { Year = 'year', Month = 'month', Week = 'week', Day = 'day', Hour = 'hour' }
export enum Category {
  Backend = 'Backend',
  Frontend = 'Frontend',
  Fullstack = 'Fullstack',
  Mobile = 'Mobile',
  QA = 'QA',
  DevOps = 'DevOps',
  Data = 'Data',
  Product = 'Product',
  Design = 'Design',
  Marketing = 'Marketing',
  Sales = 'Sales',
  Operations = 'Operations',
  CustomerSuccess = 'Customer success',
  BusinessDevelopment = 'Business development',
  Other = 'Other',
};
export const categoryTree: CategoryTree = [
  {
    name: 'Engineering',
    categories: [
      Category.Backend,
      Category.Frontend,
      Category.Fullstack,
      Category.Mobile,
      Category.QA,
      Category.DevOps,
      Category.Data,
    ]
  },
  {
    name: 'Product',
    categories: [
      Category.Product,
      Category.Design,
      Category.Marketing,
    ],
  },
  {
    name: 'Other',
    categories: [
      Category.Sales,
      Category.Operations,
      Category.CustomerSuccess,
      Category.BusinessDevelopment,
    ]
  }
]

export type JobPost = {
    id: JobPostId;
    originalId: string;
    companyId: CompanyId;
    type: JobType;
    url: string;
    title: string;
    category: Category;
    salaryRange: {
      min?:  number;
      max:  number;
      currency: string;
      period: Period;
    } | null,
    workplace: Workplace;
    location: string;
    createdAt: number;
    closedAt: number | null;
}

export type CreateJobPostData = Omit<JobPost, 'id' | 'createdAt' | 'closedAt'> & {
  createdAt?: number  | null;
};

export const createJobPost = (data: CreateJobPostData): JobPost => {
    const id = randomUUID();
    const createdAt = data.createdAt || Date.now();
    const closedAt = null;

    return {
      id,
      createdAt,
      closedAt,
      ...data,
    }
}

export const closeJobPost = (jobPost: JobPost): JobPost => {
  const closedAt = Date.now();

  return {
    ...jobPost,
    closedAt,
  }
}