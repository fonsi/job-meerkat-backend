import { SocialMediaPosts } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { SocialPlatform } from 'social/domain/socialPlatform';
import { publishOnBluesky } from 'social/infrastructure/provider/bluesky/request';
import { publishThread } from 'social/infrastructure/provider/meta/request';
import { publishOnX } from 'social/infrastructure/provider/x/request';

export const publishToPlatforms = async ({
    platforms,
    posts,
}: {
    platforms: SocialPlatform[];
    posts: SocialMediaPosts;
}): Promise<void> => {
    if (platforms.includes(SocialPlatform.Threads)) {
        console.log('[PUBLISH POST]: start publishing in Threads');
        await publishThread(posts.threads);
        console.log('[PUBLISH POST]: published in Threads');
    }

    if (platforms.includes(SocialPlatform.Bluesky)) {
        console.log('[PUBLISH POST]: start publishing in Bluesky');
        await publishOnBluesky(posts.bluesky);
        console.log('[PUBLISH POST]: published in Bluesky');
    }

    if (platforms.includes(SocialPlatform.X)) {
        console.log('[PUBLISH POST]: start publishing in X');
        await publishOnX(posts.twitter.slice(0, 2));
        console.log('[PUBLISH POST]: published in X');
    }
};
