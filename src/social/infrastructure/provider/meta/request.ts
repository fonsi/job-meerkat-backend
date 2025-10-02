import { logger } from 'shared/infrastructure/logger/logger';

const THREADS_API_BASE_URL = 'https://graph.threads.net/v1.0';
const THREADS_API_TOKEN = process.env.THREADS_API_TOKEN;
const TEXT_TYPE = 'TEXT';
const FINISHED_STATUS = 'FINISHED';
const PUBLISHED_STATUS = 'PUBLISHED';

const createAuthUrl = (url: string): URL => {
    const urlWithToken = new URL(url);
    urlWithToken.searchParams.append('access_token', THREADS_API_TOKEN);

    return urlWithToken;
};

const createContainer = async (
    mediaType: string,
    text: string,
    replyToId?: string,
): Promise<string> => {
    const url = createAuthUrl(`${THREADS_API_BASE_URL}/me/threads`);
    url.searchParams.append('media_type', mediaType);
    url.searchParams.append('text', text);

    if (replyToId) {
        url.searchParams.append('reply_to_id', replyToId);
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Error creating thread: ${await response.text()}`);
        }

        const data = await response.json();
        const createdPostId = data.id;

        return createdPostId;
    } catch (error) {
        console.error('Error creating thread:', error);
        throw error;
    }
};

const publishContainer = async (id: string): Promise<string> => {
    const url = createAuthUrl(`${THREADS_API_BASE_URL}/me/threads_publish`);
    url.searchParams.append('creation_id', id);

    const response = await fetch(url, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`Error publishing thread: ${await response.text()}`);
    }

    const data = await response.json();

    return data.id;
};

const waitFor = async (time: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

const waitUntilContainerStatus = async (
    id: string,
    status: string,
): Promise<string> => {
    const url = createAuthUrl(`${THREADS_API_BASE_URL}/${id}`);
    let retries = 0;

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            const response = await fetch(url, {
                method: 'GET',
            });

            if (!response.ok) {
                clearInterval(interval);
                reject(
                    new Error(
                        `Error getting thread status: ${await response.text()}`,
                    ),
                );
            }

            const data = await response.json();

            if (data.status === status) {
                clearInterval(interval);
                return resolve(data.id);
            }

            retries++;

            if (retries >= 10) {
                clearInterval(interval);
                return reject(
                    new Error(
                        `Thread ${id} status ${status} not updated after 10 retries`,
                    ),
                );
            }
        }, 1000);
    });
};

export const publishThread = async (posts: string[]): Promise<void> => {
    if (!THREADS_API_TOKEN) {
        throw new Error(
            'THREADS_API_TOKEN is not defined in environment variables',
        );
    }

    let firstPostId: string;

    for (let i = 0; i < posts.length; i++) {
        try {
            console.log(
                `[PUBLISH POST]: publishing post ${i + 1}/${posts.length}`,
            );
            const createdPostId = await createContainer(
                TEXT_TYPE,
                posts[i],
                firstPostId,
            );
            await waitUntilContainerStatus(createdPostId, FINISHED_STATUS);
            const publishedPostId = await publishContainer(createdPostId);
            await waitUntilContainerStatus(createdPostId, PUBLISHED_STATUS);

            if (!firstPostId) {
                firstPostId = publishedPostId;
                await waitFor(10000); // wait to first post to be published to be able to reply to it
            }
        } catch (error) {
            const errorText = 'Error creating and publishing thread:';
            console.log(errorText, error);
            logger.error(new Error(errorText), error);
        }
    }
};
