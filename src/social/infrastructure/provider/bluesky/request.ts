import { AtpAgent, RichText } from '@atproto/api';
import { getErrorLogData } from 'shared/infrastructure/logger/getErrorLogData';
import { logger } from 'shared/infrastructure/logger/logger';
import {
    fitBlueskyPost,
    graphemeCount,
    truncateToGraphemes,
} from 'social/application/enforceSocialPostLimits';
import { BLUESKY_MAX_GRAPHEMES } from 'social/domain/socialPostLimits';
import {
    isRetriablePublishError,
    withRetry,
} from 'social/infrastructure/provider/retryPublish';

const BLUESKY_USER = process.env.BLUESKY_USER;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;
const BLUESKY_SERVICE = process.env.BLUESKY_SERVICE;

const agent = new AtpAgent({
    service: new URL(BLUESKY_SERVICE),
});

const fitToBlueskyLimit = (text: string): string => {
    let next = fitBlueskyPost(text);
    let richText = new RichText({ text: next });
    while (richText.graphemeLength > BLUESKY_MAX_GRAPHEMES && next.length > 0) {
        next = truncateToGraphemes(next, Math.max(graphemeCount(next) - 1, 0));
        richText = new RichText({ text: next });
    }

    return next;
};

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
        const text = fitToBlueskyLimit(posts[i]);
        if (!text) continue;

        try {
            console.log(`[BLUESKY] publishing post ${i + 1}/${posts.length}`);

            const post = await withRetry(async () => {
                if (!agent.hasSession) {
                    await agent.login({
                        identifier: BLUESKY_USER,
                        password: BLUESKY_PASSWORD,
                    });
                }

                const richText = new RichText({ text });
                await richText.detectFacets(agent);

                return agent.post({
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
            }, isRetriablePublishError);

            if (!firstPostCid) {
                firstPostCid = post.cid;
                firstPostUri = post.uri;
            }

            lastPostCid = post.cid;
            lastPostUri = post.uri;
        } catch (error) {
            const errorText = 'Error creating and publishing in bluesky';
            console.log(errorText, error);
            logger.error(
                new Error(errorText),
                getErrorLogData(error, {
                    platform: 'bluesky',
                    postIndex: i,
                    postCount: posts.length,
                }),
            );
        }
    }
};
