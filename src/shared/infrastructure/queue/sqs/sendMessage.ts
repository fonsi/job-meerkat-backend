import { SQS, SendMessageRequest } from '@aws-sdk/client-sqs';

type QueueMessage = string | Record<string, unknown>;

const buildMessage = (message: QueueMessage): string =>
    typeof message === 'string' ? message : JSON.stringify(message);

interface SendMessageData {
    url: string;
    message: QueueMessage;
    groupId?: string;
    deduplicationId?: string;
}

export const sendMessage = async ({
    url,
    message,
    groupId,
    deduplicationId,
}: SendMessageData): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const request: SendMessageRequest = {
            QueueUrl: url,
            MessageBody: buildMessage(message),
            MessageGroupId: groupId,
            MessageDeduplicationId: deduplicationId,
        };

        const queue = new SQS({
            useQueueUrlAsEndpoint: false,
        });
        queue.sendMessage(request, (err, res) => {
            if (err) {
                console.log('[SQS SEND MESSAGE][ERROR]', err);
                return reject(err);
            }

            console.log('[SQS SEND MESSAGE]', res);
            return resolve();
        });
    });
};
