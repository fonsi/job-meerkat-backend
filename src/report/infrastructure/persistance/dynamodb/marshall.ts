import { Report } from 'report/domain/report';

export const marshallReport = (report: Report) => {
    const item: Record<string, { S: string } | { N: string }> = {
        id: { S: report.id },
        email: { S: report.email },
        emailNormalized: { S: report.emailNormalized },
        status: { S: report.status },
        frequency: { S: report.frequency },
        createdAt: { N: report.createdAt.toString() },
        unsubscribeToken: { S: report.unsubscribeToken },
    };

    if (report.confirmedAt != null) {
        item.confirmedAt = { N: report.confirmedAt.toString() };
    }

    if (report.unsubscribedAt != null) {
        item.unsubscribedAt = { N: report.unsubscribedAt.toString() };
    }

    if (report.preferences) {
        item.preferences = { S: JSON.stringify(report.preferences) };
    }

    return item;
};
