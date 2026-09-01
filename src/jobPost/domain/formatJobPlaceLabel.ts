import { JobPost, Workplace } from './jobPost';

const WORKPLACE_LABEL: Partial<Record<Workplace, string>> = {
    [Workplace.Remote]: 'Remote',
    [Workplace.OnSite]: 'On-site',
    [Workplace.Hybrid]: 'Hybrid',
};

const isUnknownLocation = (location: string | null | undefined): boolean => {
    const trimmed = location?.trim();

    return !trimmed || trimmed.toLowerCase() === 'unknown';
};

export const formatJobPlaceLabel = (
    jobPost: Pick<JobPost, 'workplace' | 'location'>,
): string | null => {
    const workplace =
        jobPost.workplace === Workplace.Unknown
            ? null
            : (WORKPLACE_LABEL[jobPost.workplace] ?? null);
    const location = isUnknownLocation(jobPost.location)
        ? null
        : jobPost.location.trim();
    const parts = [workplace, location].filter(Boolean);

    return parts.length > 0 ? parts.join(' — ') : null;
};
