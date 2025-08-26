import { AtpAgent, RichText } from '@atproto/api';

const BLUESKY_USER = process.env.BLUESKY_USER;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;
const BLUESKY_SERVICE = process.env.BLUESKY_SERVICE;

const agent = new AtpAgent({
    service: new URL(BLUESKY_SERVICE),
});

export const publishOnBluesky = async (posts: string[]): Promise<void> => {
    if (!BLUESKY_USER || !BLUESKY_PASSWORD) {
        throw new Error(
            '[BLUESKY] BLUESKY_USER or BLUESKY_PASSWORD is not defined in environment variables',
        );
    }

    let firstPostCid: string;
    let firstPostUri: string;
    let lastPostCid: string;
    let lastPostUri: string;

    for (let i = 0; i < posts.length; i++) {
        try {
            console.log(`[BLUESKY] publishing post ${i + 1}/${posts.length}`);

            if (!agent.hasSession) {
                await agent.login({
                    identifier: BLUESKY_USER,
                    password: BLUESKY_PASSWORD,
                });
            }

            const richText = new RichText({
                text: posts[i],
            });

            await richText.detectFacets(agent);

            const post = await agent.post({
                text: richText.text,
                facets: richText.facets,
                createdAt: new Date().toISOString(),
                reply: firstPostCid
                    ? {
                          root: {
                              cid: firstPostCid,
                              uri: firstPostUri,
                          },
                          parent: {
                              cid: lastPostCid,
                              uri: lastPostUri,
                          },
                      }
                    : undefined,
            });

            if (!firstPostCid) {
                firstPostCid = post.cid;
                firstPostUri = post.uri;
            }

            lastPostCid = post.cid;
            lastPostUri = post.uri;
        } catch (error) {
            console.error(
                '[BLUESKY] Error creating and publishing thread',
                error,
            );
            throw error;
        }
    }
};
