import { SalaryRange } from './jobPost';

const beautifySalary = (salary: number): string => {
    if (salary / 1000 < 1) return String(salary);

    return `${(salary / 1000).toFixed()}K`;
};

const beautifyCurrency = (currency: string): string => currency.toUpperCase();

export type SalaryHighlight = {
    amount: string;
    caption: string;
};

export const formatSalaryHighlight = (
    salaryRange: SalaryRange | null | undefined,
): SalaryHighlight | null => {
    if (!salaryRange) return null;

    const min = salaryRange.min;
    const max = salaryRange.max;
    if (!min && !max) return null;

    const caption = `${beautifyCurrency(salaryRange.currency)} / ${salaryRange.period}`;
    if (!min && max) return { amount: `Up to ${beautifySalary(max)}`, caption };
    if (!max && min) return { amount: `From ${beautifySalary(min)}`, caption };

    return {
        amount: `${beautifySalary(min as number)}–${beautifySalary(max as number)}`,
        caption,
    };
};

export const formatSalaryRangeLabel = (
    salaryRange: SalaryRange | null | undefined,
): string | null => {
    if (!salaryRange) return null;

    const min = salaryRange.min;
    const max = salaryRange.max;
    if (!min && !max) return null;

    const currency = beautifyCurrency(salaryRange.currency);
    const period = salaryRange.period;
    if (!min && max)
        return `Up to ${beautifySalary(max)} ${currency} / ${period}`;
    if (!max && min)
        return `From ${beautifySalary(min)} ${currency} / ${period}`;

    return `${beautifySalary(min as number)} - ${beautifySalary(max as number)} ${currency} / ${period}`;
};
