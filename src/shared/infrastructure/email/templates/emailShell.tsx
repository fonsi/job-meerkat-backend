import React, { PropsWithChildren } from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    render,
    toPlainText,
} from '@react-email/components';
import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';

const LOGO_SRC = `${ASSETS_BASE_URL}/jobmeerkat-logo-text-white.png`;
const LOGO_WIDTH = 220;
const LOGO_HEIGHT = 24;

const colors = {
    heroBg: '#111111',
    pageBg: '#f4f4f4',
    contentBg: '#ffffff',
    text: '#111111',
    muted: '#555555',
    link: '#111111',
};

type EmailShellProps = PropsWithChildren<{
    title: string;
    preview?: string;
}>;

export const EmailShell = ({ title, preview, children }: EmailShellProps) => (
    <Html lang="en">
        <Head />
        {preview ? <Preview>{preview}</Preview> : null}
        <Body
            style={{
                backgroundColor: colors.pageBg,
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif',
                margin: 0,
                padding: '24px 0',
            }}
        >
            <Container
                style={{
                    backgroundColor: colors.contentBg,
                    borderRadius: '8px',
                    margin: '0 auto',
                    maxWidth: '680px',
                    overflow: 'hidden',
                    width: '100%',
                }}
            >
                <Section
                    style={{
                        backgroundColor: colors.heroBg,
                        padding: '28px 24px',
                        textAlign: 'center' as const,
                    }}
                >
                    <Img
                        src={LOGO_SRC}
                        alt="JobMeerkat"
                        width={LOGO_WIDTH}
                        height={LOGO_HEIGHT}
                        style={{
                            display: 'block',
                            height: `${LOGO_HEIGHT}px`,
                            margin: '0 auto',
                            width: `${LOGO_WIDTH}px`,
                        }}
                    />
                </Section>
                <Section
                    style={{
                        backgroundColor: colors.contentBg,
                        color: colors.text,
                        padding: '32px 28px',
                    }}
                >
                    <Heading
                        as="h1"
                        style={{
                            color: colors.text,
                            fontSize: '22px',
                            fontWeight: 700,
                            lineHeight: '1.3',
                            margin: '0 0 16px',
                        }}
                    >
                        {title}
                    </Heading>
                    {children}
                </Section>
            </Container>
        </Body>
    </Html>
);

export const emailColors = colors;

export const buildEmailHtml = async (
    component: React.ReactElement,
): Promise<{ html: string; text: string }> => {
    const html = await render(component);
    return { html, text: toPlainText(html) };
};
