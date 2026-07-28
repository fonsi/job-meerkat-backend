import { SocialMediaPosts } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import {
    applyUtmSourceToJobmeerkatUrls,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';

export const applyUtmSourcesToSocialPosts = (
    posts: SocialMediaPosts,
): SocialMediaPosts => ({
    linkedin: applyUtmSourceToJobmeerkatUrls(
        posts.linkedin,
        UtmSource.LinkedIn,
    ),
    twitter: posts.twitter.map((post) =>
        applyUtmSourceToJobmeerkatUrls(post, UtmSource.X),
    ),
    bluesky: posts.bluesky.map((post) =>
        applyUtmSourceToJobmeerkatUrls(post, UtmSource.Bluesky),
    ),
    threads: posts.threads.map((post) =>
        applyUtmSourceToJobmeerkatUrls(post, UtmSource.Threads),
    ),
});
