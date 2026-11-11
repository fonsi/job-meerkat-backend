import {
    NEWSLETTER_HONEYPOT_FIELD,
    parseSubscribeRequest,
} from './parseSubscribeRequest';

describe('parseSubscribeRequest', () => {
    it('reads email, honeypot and captcha token', () => {
        expect(
            parseSubscribeRequest(
                JSON.stringify({
                    email: '  User@Example.com ',
                    [NEWSLETTER_HONEYPOT_FIELD]: ' http://spam.example ',
                    captchaToken: 'tok',
                }),
            ),
        ).toEqual({
            email: 'User@Example.com',
            honeypot: 'http://spam.example',
            captchaToken: 'tok',
        });
    });

    it('treats a missing or blank honeypot as empty', () => {
        expect(
            parseSubscribeRequest(JSON.stringify({ email: 'a@b.co' })),
        ).toEqual({ email: 'a@b.co', honeypot: '', captchaToken: null });
        expect(
            parseSubscribeRequest(
                JSON.stringify({
                    email: 'a@b.co',
                    [NEWSLETTER_HONEYPOT_FIELD]: '   ',
                }),
            ).honeypot,
        ).toBe('');
    });

    it.each([null, undefined, '', 'not json', 'null', '[]', '{"email":5}'])(
        'returns no email for %p',
        (body) => {
            expect(parseSubscribeRequest(body).email).toBeNull();
        },
    );
});
