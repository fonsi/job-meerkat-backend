import { SocialMediaPosts } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { applyUtmSourcesToSocialPosts } from 'shared/infrastructure/url/applyUtmSourcesToSocialPosts';
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
    const tagged = applyUtmSourcesToSocialPosts(posts);

    if (platforms.includes(SocialPlatform.Threads)) {
        console.log('[PUBLISH POST]: start publishing in Threads');
        await publishThread(tagged.threads);
        console.log('[PUBLISH POST]: published in Threads');
    }

    if (platforms.includes(SocialPlatform.Bluesky)) {
        console.log('[PUBLISH POST]: start publishing in Bluesky');
        await publishOnBluesky(tagged.bluesky);
        console.log('[PUBLISH POST]: published in Bluesky');
    }

    if (platforms.includes(SocialPlatform.X)) {
        console.log('[PUBLISH POST]: start publishing in X');
        await publishOnX(tagged.twitter.slice(0, 2));
        console.log('[PUBLISH POST]: published in X');
    }
};
