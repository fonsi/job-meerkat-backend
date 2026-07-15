export type ReportEventData = {
    reportType: 'daily' | 'weekly';
    data: {
        email: string;
    };
};
