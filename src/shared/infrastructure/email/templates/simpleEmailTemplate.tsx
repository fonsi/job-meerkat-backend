import React from 'react';
import { Link, Text } from '@react-email/components';
import {
    EmailShell,
    buildEmailHtml,
    emailColors,
} from './emailShell';

type SimpleEmailProps = {
    title: string;
    preview?: string;
    paragraphs: string[];
    cta?: { label: string; url: string };
    footerNote?: string;
};

const SimpleEmail = ({
    title,
    preview,
    paragraphs,
    cta,
    footerNote,
}: SimpleEmailProps) => (
    <EmailShell title={title} preview={preview}>
        {paragraphs.map((paragraph, index) => (
            <Text
                key={index}
                style={{
                    color: emailColors.text,
                    fontSize: '15px',
                    lineHeight: '1.6',
                    margin: '0 0 16px',
                }}
            >
                {paragraph}
            </Text>
        ))}
        {cta ? (
            <Text style={{ margin: '8px 0 16px', textAlign: 'center' as const }}>
                <Link
                    href={cta.url}
                    style={{
                        backgroundColor: emailColors.heroBg,
                        borderRadius: '4px',
                        color: '#ffffff',
                        display: 'inline-block',
                        fontSize: '15px',
                        fontWeight: 600,
                        padding: '12px 20px',
                        textDecoration: 'none',
                    }}
                >
                    {cta.label}
                </Link>
            </Text>
        ) : null}
        {cta ? (
            <Text
                style={{
                    color: emailColors.muted,
                    fontSize: '13px',
                    lineHeight: '1.5',
                    margin: '0 0 8px',
                    wordBreak: 'break-all' as const,
                }}
            >
                Or copy this link:{' '}
                <Link href={cta.url} style={{ color: emailColors.link }}>
                    {cta.url}
                </Link>
            </Text>
        ) : null}
        {footerNote ? (
            <Text
                style={{
                    color: emailColors.muted,
                    fontSize: '13px',
                    lineHeight: '1.5',
                    margin: '16px 0 0',
                }}
            >
                {footerNote}
            </Text>
        ) : null}
    </EmailShell>
);

export const buildSimpleEmailTemplate = async (
    props: SimpleEmailProps,
): Promise<{ html: string; text: string }> =>
    buildEmailHtml(<SimpleEmail {...props} />);
