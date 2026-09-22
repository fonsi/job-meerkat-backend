import { FollowerGrowthContent } from './followerGrowthContent';

export type GetAllFollowerGrowthContent = () => Promise<
    FollowerGrowthContent[]
>;
export type AddFollowerGrowthContent = (
    content: FollowerGrowthContent,
) => Promise<void>;

export interface FollowerGrowthContentRepository {
    getAll: GetAllFollowerGrowthContent;
    add: AddFollowerGrowthContent;
}
