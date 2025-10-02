import { logger } from 'shared/infrastructure/logger/logger';
import crypto from 'crypto';

const X_API_BASE_URL = 'https://api.twitter.com/2';
const X_API_ENDPOINTS = {
    TWEETS: '/tweets',
} as const;

const OAUTH_VERSION = '1.0';
const OAUTH_SIGNATURE_METHOD = 'HMAC-SHA1';
const DELAY_BETWEEN_TWEETS = 1000; // 1 second

interface OAuthParameters {
    oauth_consumer_key: string;
    oauth_nonce: string;
    oauth_signature_method: string;
    oauth_timestamp: string;
    oauth_token: string;
    oauth_version: string;
    oauth_signature?: string;
}

interface TweetResponse {
    data: {
        id: string;
    };
}

const X_API_KEY = process.env.X_API_KEY;
const X_API_SECRET = process.env.X_API_SECRET;
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

const validateCredentials = (): void => {
    if (
        !X_API_KEY ||
        !X_API_SECRET ||
        !X_ACCESS_TOKEN ||
        !X_ACCESS_TOKEN_SECRET
    ) {
        throw new Error(
            'X API credentials must be defined in environment variables',
        );
    }
};

const generateOAuth1Header = (method: string, url: string): string => {
    validateCredentials();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const parameters: OAuthParameters = {
        oauth_consumer_key: X_API_KEY!,
        oauth_nonce: nonce,
        oauth_signature_method: OAUTH_SIGNATURE_METHOD,
        oauth_timestamp: timestamp,
        oauth_token: X_ACCESS_TOKEN!,
        oauth_version: OAUTH_VERSION,
    };

    const parameterString = Object.entries(parameters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
            ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
        )
        .join('&');

    const signatureBaseString = [
        method.toUpperCase(),
        encodeURIComponent(url),
        encodeURIComponent(parameterString),
    ].join('&');

    const signingKey = `${encodeURIComponent(X_API_SECRET!)}&${encodeURIComponent(X_ACCESS_TOKEN_SECRET!)}`;
    const signature = crypto
        .createHmac('sha1', signingKey)
        .update(signatureBaseString)
        .digest('base64');

    parameters.oauth_signature = signature;

    return (
        'OAuth ' +
        Object.entries(parameters)
            .map(
                ([key, value]) =>
                    `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`,
            )
            .join(', ')
    );
};

const createTweet = async (
    text: string,
    replyToId?: string,
): Promise<string> => {
    try {
        const url = `${X_API_BASE_URL}${X_API_ENDPOINTS.TWEETS}`;
        const body = JSON.stringify({
            text,
            ...(replyToId && { reply: { in_reply_to_tweet_id: replyToId } }),
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: generateOAuth1Header('POST', url),
                'Content-Type': 'application/json',
            },
            body,
        });

        if (!response.ok) {
            throw new Error(`Error creating tweet: ${await response.text()}`);
        }

        const data = (await response.json()) as TweetResponse;
        return data.data.id;
    } catch (error) {
        logger.error(new Error('Error creating tweet:'), error);
        throw error;
    }
};

export const publishOnX = async (posts: string[]): Promise<void> => {
    if (!posts.length) {
        return;
    }

    let previousTweetId: string | undefined;

    for (let i = 0; i < posts.length; i++) {
        try {
            console.log(
                `[PUBLISH POST]: publishing tweet ${i + 1}/${posts.length}`,
            );
            const tweetId = await createTweet(posts[i], previousTweetId);
            previousTweetId = tweetId;

            // Add a small delay between tweets to avoid rate limiting
            if (i < posts.length - 1) {
                await new Promise((resolve) =>
                    setTimeout(resolve, DELAY_BETWEEN_TWEETS),
                );
            }
        } catch (error) {
            const errorText = 'Error publishing tweet:';
            console.log(errorText, error);
            logger.error(new Error(errorText), error);
        }
    }
};
