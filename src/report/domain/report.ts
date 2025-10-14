export type ReportId = string;
export type ReportType = 'daily';

export type Report = {
    id: ReportId;
    type: ReportType;
    email: string;
    createdAt: number;
};
