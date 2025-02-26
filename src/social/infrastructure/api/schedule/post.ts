import { success } from 'shared/infrastructure/api/response';
import { scheduleSocialPosts } from 'social/application/scheduleSocialPosts';

export const socialSchedulePost = async () => {
    await scheduleSocialPosts();

    return success(null);
};
