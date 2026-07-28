import { SocialMediaPosts } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import {
    applyUtmSourceToJobmeerkatUrls,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';

export const applyUtmSourcesToSocialPosts = (
    posts: SocialMediaPosts,
): SocialMediaPosts => ({
    bluesky: posts.bluesky.map((post) =>
        applyUtmSourceToJobmeerkatUrls(post, UtmSource.Bluesky),
    ),
    threads: posts.threads.map((post) =>
        applyUtmSourceToJobmeerkatUrls(post, UtmSource.Threads),
    ),
});
