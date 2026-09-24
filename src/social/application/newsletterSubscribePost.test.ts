import { applyUtmSourcesToSocialPosts } from 'shared/infrastructure/url/applyUtmSourcesToSocialPosts';
import { newsletterSubscribeSocialPosts } from './newsletterSubscribePost';

describe('newsletterSubscribeSocialPosts', () => {
    it('is one message per platform with the newsletter url', () => {
        const posts = newsletterSubscribeSocialPosts(73);

        expect(posts.bluesky).toHaveLength(1);
        expect(posts.threads).toHaveLength(1);
        expect(posts.bluesky[0]).toBe(posts.threads[0]);
        expect(posts.bluesky[0]).toBe(
            '73 new remote jobs with public salaries today. Get them in your inbox: https://jobmeerkat.com/newsletter?utm_source=_social',
        );
    });

    it('rewrites the shared url per platform at publish', () => {
        const tagged = applyUtmSourcesToSocialPosts(
            newsletterSubscribeSocialPosts(73),
        );

        expect(tagged.bluesky[0]).toContain('utm_source=bluesky');
        expect(tagged.threads[0]).toContain('utm_source=threads');
        expect(tagged.bluesky[0]).toContain(
            'https://jobmeerkat.com/newsletter',
        );
    });
});
