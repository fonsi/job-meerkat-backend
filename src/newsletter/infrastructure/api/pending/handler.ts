import 'source-map-support/register';
import { processPendingSubscriptions } from 'newsletter/application/processPendingSubscriptions';

export const index = async () => {
    try {
        console.log('[PENDING SUBSCRIPTIONS]');
        const result = await processPendingSubscriptions();
        console.log(
            `[PENDING SUBSCRIPTIONS DONE] scanned=${result.scanned} reminded=${result.reminded} deleted=${result.deleted} failed=${result.failed}`,
        );
    } catch (e) {
        console.log(`[Error]: ${e.message}`);

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Something went wrong',
            }),
        };
    }
};
