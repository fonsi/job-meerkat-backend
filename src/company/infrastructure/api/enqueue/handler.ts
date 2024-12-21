import 'source-map-support/register';
import { scheduleCompaniesToProcess } from 'company/application/scheduleCompaniesToProcess';

export const index = async () => {
    try {
        console.log('[SCHEDULING COMPANIES TO PROCESS]');
        await scheduleCompaniesToProcess();
        console.log('[END SCHEDULING COMPANIES]');
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
