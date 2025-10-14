import { sendMessage } from 'shared/infrastructure/queue/sqs/sendMessage';
import { ReportEventData } from './reportEvent';

type ReportEnqueuer = (report: ReportEventData) => Promise<void>;

const QUEUE_URL = process.env.SEND_REPORT_QUEUE_NAME;

export const enqueue: ReportEnqueuer = async (report) =>
    await sendMessage({
        url: QUEUE_URL,
        message: JSON.stringify(report),
    });
