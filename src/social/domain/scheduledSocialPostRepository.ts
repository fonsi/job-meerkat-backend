import { ScheduledSocialPost } from './scheduledSocialPost';

export type GetAll = () => Promise<ScheduledSocialPost[]>;
export type Add = (scheduledSocialPost: ScheduledSocialPost) => Promise<void>;
export type Remove = (
    scheduledSocialPost: ScheduledSocialPost,
) => Promise<void>;

export interface ScheduledSocialPostRepository {
    getAll: GetAll;
    add: Add;
    remove: Remove;
}
