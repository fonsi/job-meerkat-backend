import { CompanyId } from 'company/domain/company';
import { sendMessage } from 'shared/infrastructure/queue/sqs/sendMessage';

type CompanyEnqueuer = (companyId: CompanyId) => Promise<void>;

const QUEUE_URL = process.env.PROCESS_COMPANY_QUEUE_NAME;
const messageGroup = 'ProcessCompany';

export const enqueue: CompanyEnqueuer = async (companyId) =>
  await sendMessage({
    url: QUEUE_URL,
    message: companyId,
    groupId: messageGroup,
    deduplicationId: `${companyId}`,
  });
