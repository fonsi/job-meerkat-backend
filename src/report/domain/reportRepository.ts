import { Report } from './report';

export type GetAll = () => Promise<Report[]>;

export interface ReportRepository {
    getAll: GetAll;
}
