import { SocialMediaPosts } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import {
    appendUtmCampaign,
    buildBlogPostPageUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';
import {
    fitBlueskyPost,
    fitThreadsPost,
} from 'social/application/enforceSocialPostLimits';

export const blogSocialPromoPosts = ({
    title,
    excerpt,
    slug,
}: {
    title: string;
    excerpt: string;
    slug: string;
}): SocialMediaPosts | null => {
    const url = appendUtmCampaign(
        buildBlogPostPageUrl(slug, UtmSource.Social),
        slug,
    );
    const base = `${title}\n\n${excerpt}\n\n${url}`;
    const threads = fitThreadsPost(base);
    const bluesky = fitBlueskyPost(base);
    if (!threads || !bluesky) return null;

    return { threads: [threads], bluesky: [bluesky] };
};
