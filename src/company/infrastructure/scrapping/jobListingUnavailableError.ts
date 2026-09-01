export class JobListingUnavailableError extends Error {
    readonly status?: number;

    constructor(companyName: string, url: string, status?: number) {
        const statusPart = status ? ` (${status})` : '';
        super(
            `Job listing unavailable for ${companyName}${statusPart}: ${url}`,
        );
        this.name = 'JobListingUnavailableError';
        this.status = status;
    }
}

export const isJobListingUnavailableError = (error: unknown): boolean => {
    if (error instanceof JobListingUnavailableError) return true;
    if (!(error instanceof Error)) return false;

    const message = error.message;

    return (
        /status code 404/i.test(message) ||
        /job listing unavailable/i.test(message) ||
        /"Not Found" is not valid JSON/i.test(message) ||
        /Unexpected token 'N'.+"Not Found"/i.test(message)
    );
};
