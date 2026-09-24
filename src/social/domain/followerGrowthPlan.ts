import { Category, JobPostDetails } from 'jobPost/domain/jobPost';
import { FollowerGrowthFamily } from './followerGrowthContent';

export const FOLLOWER_GROWTH_DATA_REQUEST_KINDS = [
    'salaryDistribution',
    'categoryDistribution',
    'locationDistribution',
    'jobTypeDistribution',
    'topListings',
    'listingDetails',
    'detailPatterns',
    'compareGroups',
] as const;

export const FOLLOWER_GROWTH_DETAIL_FIELDS = [
    'summary',
    'team',
    'stack',
    'responsibilities',
    'requirements',
    'niceToHave',
    'benefits',
    'hiringProcess',
] as const satisfies ReadonlyArray<keyof JobPostDetails>;

export type FollowerGrowthCurrency = 'USD' | 'EUR';
export type FollowerGrowthDetailField =
    (typeof FOLLOWER_GROWTH_DETAIL_FIELDS)[number];

export const FOLLOWER_GROWTH_EVIDENCE_ROLES = [
    'illustrate',
    'support',
    'challenge',
] as const;

export type FollowerGrowthEvidenceRole =
    (typeof FOLLOWER_GROWTH_EVIDENCE_ROLES)[number];

export type FollowerGrowthConcept = {
    family: FollowerGrowthFamily;
    readerProblem: string;
    editorialThesis: string;
    readerValue: string;
    evidenceRole: FollowerGrowthEvidenceRole;
};

type DataFilters = {
    category?: Category;
    currency?: FollowerGrowthCurrency;
};

export type FollowerGrowthDataRequest =
    | ({ kind: 'salaryDistribution' } & DataFilters)
    | { kind: 'categoryDistribution' }
    | ({ kind: 'locationDistribution' } & Pick<DataFilters, 'category'>)
    | ({ kind: 'jobTypeDistribution' } & Pick<DataFilters, 'category'>)
    | ({
          kind: 'topListings';
          limit: number;
      } & DataFilters)
    | ({
          kind: 'listingDetails';
          fields: FollowerGrowthDetailField[];
          sampleSize: number;
      } & DataFilters)
    | ({
          kind: 'detailPatterns';
          fields: FollowerGrowthDetailField[];
          sampleSize: number;
      } & DataFilters)
    | {
          kind: 'compareGroups';
          dimension: 'category' | 'jobType' | 'location';
          groups: string[];
          metric: 'count' | 'salary';
          currency?: FollowerGrowthCurrency;
      };

export type FollowerGrowthPlan = FollowerGrowthConcept & {
    dataRequests: FollowerGrowthDataRequest[];
};
