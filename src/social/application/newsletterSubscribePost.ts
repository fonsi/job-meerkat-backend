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
            ? '1 new remote job with a public salary'
            : `${jobCount.toLocaleString('en-US')} new remote jobs with public salaries`;
    const message = `${jobs} today. Get them in your inbox: ${buildNewsletterPageUrl(UtmSource.Social)}`;

    return { bluesky: [message], threads: [message] };
};
