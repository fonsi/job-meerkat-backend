import { isRetriableEmailError } from './sendEmail';

const statusError = (status: number, message = 'Fail') => {
    const error = new Error(message);
    (error as Error & { status: number }).status = status;

    return error;
};

describe('isRetriableEmailError', () => {
    it('retries Mailgun 429 and Too Many Requests', () => {
        expect(
            isRetriableEmailError(statusError(429, 'Too Many Requests')),
        ).toBe(true);
        expect(isRetriableEmailError(new Error('Too Many Requests'))).toBe(
            true,
        );
        expect(isRetriableEmailError('Error: Too Many Requests')).toBe(true);
    });

    it('retries 5xx', () => {
        expect(isRetriableEmailError(statusError(500))).toBe(true);
        expect(isRetriableEmailError(statusError(503))).toBe(true);
    });

    it('does not retry client errors', () => {
        expect(isRetriableEmailError(statusError(400, 'Bad Request'))).toBe(
            false,
        );
        expect(isRetriableEmailError(statusError(401))).toBe(false);
        expect(isRetriableEmailError(new Error('invalid mailbox'))).toBe(false);
    });
});
