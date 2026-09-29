import { SocialMediaPosts } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import {
    buildNewsletterPageUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';

export const newsletterSubscribeSocialPosts = (
    jobCount: number,
): SocialMediaPosts => {
    const jobs =
        jobCount === 1
            ? '1 new job post'
            : `${jobCount.toLocaleString('en-US')} new job posts`;
    const message = `${jobs} today. Get them in your inbox: ${buildNewsletterPageUrl(UtmSource.Social)}`;

    return { bluesky: [message], threads: [message] };
};
