import { CompanyId } from 'company/domain/company';
import { randomUUID, UUID } from 'crypto';

export type JobPostId = UUID;
export type CategoryTree = Array<{
    name: string;
    categories: WebCategory[];
}>;

type WebCategory = {
    name: Category;
    slug: string;
};

export enum JobType {
    FullTime = 'fullTime',
    PartTime = 'partTime',
    Contract = 'contract',
    Unknown = 'unknown',
}
export enum Workplace {
    Remote = 'remote',
    OnSite = 'onSite',
    Hybrid = 'hybrid',
    Unknown = 'unknown',
}
export enum Period {
    Year = 'year',
    Month = 'month',
    Week = 'week',
    Day = 'day',
    Hour = 'hour',
}

export enum Category {
    Backend = 'Backend',
    Frontend = 'Frontend',
    Fullstack = 'Fullstack',
    Blockchain = 'Blockchain',
    AI = 'AI',
    Mobile = 'Mobile',
    QA = 'QA',
    DevOps = 'DevOps',
    Data = 'Data',
    GameDeveloper = 'Game developer',
    MachineLearning = 'Machine learning',
    EngineeringManager = 'Engineering manager',
    Product = 'Product',
    Design = 'Design',
    Marketing = 'Marketing',
    Sales = 'Sales',
    Operations = 'Operations',
    'People/HR' = 'People/HR',
    CustomerSuccess = 'Customer success',
    BusinessDevelopment = 'Business development',
    Legal = 'Legal',
    Other = 'Other',
}

export const EngineeringCategories: WebCategory[] = [
    {
        name: Category.Backend,
        slug: 'backend',
    },
    {
        name: Category.Frontend,
        slug: 'frontend',
    },
    {
        name: Category.Fullstack,
        slug: 'fullstack',
    },
    {
        name: Category.Blockchain,
        slug: 'blockchain',
    },
    {
        name: Category.AI,
        slug: 'ai',
    },
    {
        name: Category.Mobile,
        slug: 'mobile',
    },
    {
        name: Category.QA,
        slug: 'qa',
    },
    {
        name: Category.DevOps,
        slug: 'devops',
    },
    {
        name: Category.Data,
        slug: 'data',
    },
    {
        name: Category.GameDeveloper,
        slug: 'game-developer',
    },
    {
        name: Category.MachineLearning,
        slug: 'machine-learning',
    },
    {
        name: Category.EngineeringManager,
        slug: 'engineering-manager',
    },
];

export const ProductCategories: WebCategory[] = [
    {
        name: Category.Product,
        slug: 'product',
    },
    {
        name: Category.Design,
        slug: 'design',
    },
    {
        name: Category.Marketing,
        slug: 'marketing',
    },
];

export const OtherCategories: WebCategory[] = [
    {
        name: Category.Sales,
        slug: 'sales',
    },
    {
        name: Category.Operations,
        slug: 'operations',
    },
    {
        name: Category['People/HR'],
        slug: 'people-hr',
    },
    {
        name: Category.CustomerSuccess,
        slug: 'customer-success',
    },
    {
        name: Category.BusinessDevelopment,
        slug: 'business-development',
    },
    {
        name: Category.Legal,
        slug: 'legal',
    },
    {
        name: Category.Other,
        slug: 'other',
    },
];

export const categoryTree: CategoryTree = [
    {
        name: 'Engineering',
        categories: EngineeringCategories,
    },
    {
        name: 'Product',
        categories: ProductCategories,
    },
    {
        name: 'Other',
        categories: OtherCategories,
    },
];

export type JobPost = {
    id: JobPostId;
    originalId: string;
    companyId: CompanyId;
    type: JobType;
    url: string;
    title: string;
    category: Category;
    salaryRange: {
        min?: number;
        max: number;
        currency: string;
        period: Period;
    } | null;
    workplace: Workplace;
    location: string;
    createdAt: number;
    closedAt: number | null;
};

export type CreateJobPostData = Omit<
    JobPost,
    'id' | 'createdAt' | 'closedAt'
> & {
    createdAt?: number | null;
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
    };
};

export const closeJobPost = (jobPost: JobPost): JobPost => {
    const closedAt = Date.now();

    return {
        ...jobPost,
        closedAt,
    };
};
