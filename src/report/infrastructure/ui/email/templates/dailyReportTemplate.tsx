import React from 'react';
import {
    Column,
    Img,
    Link,
    Row,
    Section,
    Text,
} from '@react-email/components';
import { JobPostsByCompanyType } from 'report/application/sendReport';
import { ReportFrequency } from 'report/domain/report';
import {
    EmailShell,
    buildEmailHtml,
    emailColors,
} from 'shared/infrastructure/email/templates/emailShell';
import { buildJobPostPageUrl } from 'shared/infrastructure/url/buildJobPostPageUrl';

type BuildJobReportTemplate = (props: JobReportTemplateProps) => Promise<{
    html: string;
    text: string;
}>;

type JobReportTemplateProps = {
    jobPostsByCompany: JobPostsByCompanyType;
    totalJobPosts: number;
    totalCompanies: number;
    frequency: ReportFrequency;
    manageUrl: string;
    unsubscribeUrl: string;
};

const titleForFrequency = (frequency: ReportFrequency) =>
    frequency === 'weekly' ? 'Weekly Job Report' : 'Daily Job Report';

const cadenceLabel = (frequency: ReportFrequency) =>
    frequency === 'weekly' ? 'weekly' : 'daily';

const JobReportTemplate = ({
    jobPostsByCompany,
    totalJobPosts,
    totalCompanies,
    frequency,
    manageUrl,
    unsubscribeUrl,
}: JobReportTemplateProps) => {
    const title = titleForFrequency(frequency);

    return (
        <EmailShell
            title={title}
            preview={`Your curated list of ${totalJobPosts} new job opportunities`}
        >
            <Text
                style={{
                    color: emailColors.muted,
                    fontSize: '15px',
                    lineHeight: '1.6',
                    margin: '0 0 24px',
                }}
            >
                Your curated list of the latest job opportunities.
            </Text>

            <Section style={{ marginBottom: '8px' }}>
                <Row>
                    <Column align="center" style={{ width: '50%' }}>
                        <Text
                            style={{
                                color: emailColors.text,
                                fontSize: '28px',
                                fontWeight: 'bold',
                                margin: '0',
                                textAlign: 'center',
                            }}
                        >
                            {totalJobPosts}
                        </Text>
                        <Text
                            style={{
                                color: emailColors.muted,
                                fontSize: '14px',
                                margin: '4px 0 0',
                                textAlign: 'center',
                            }}
                        >
                            New Jobs
                        </Text>
                    </Column>
                    <Column align="center" style={{ width: '50%' }}>
                        <Text
                            style={{
                                color: emailColors.text,
                                fontSize: '28px',
                                fontWeight: 'bold',
                                margin: '0',
                                textAlign: 'center',
                            }}
                        >
                            {totalCompanies}
                        </Text>
                        <Text
                            style={{
                                color: emailColors.muted,
                                fontSize: '14px',
                                margin: '4px 0 0',
                                textAlign: 'center',
                            }}
                        >
                            Companies
                        </Text>
                    </Column>
                </Row>
            </Section>

            {Object.values(jobPostsByCompany).map(({ company, jobPosts }) => (
                <Section key={company.id} style={{ marginTop: '28px' }}>
                    <Row
                        style={{
                            backgroundColor: '#111111',
                            borderRadius: '4px',
                            padding: '8px 12px',
                        }}
                    >
                        <Column width="56px">
                            <Img
                                src={company.logo.url}
                                alt={company.name}
                                width={44}
                                style={{
                                    display: 'block',
                                    height: 'auto',
                                    width: '44px',
                                }}
                            />
                        </Column>
                        <Column>
                            <Text
                                style={{
                                    color: '#fefefe',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    margin: '0',
                                }}
                            >
                                {company.name}
                            </Text>
                        </Column>
                    </Row>
                    {jobPosts.map((jobPost) => (
                        <Row
                            key={jobPost.id}
                            style={{
                                border: '1px solid #e5e5e5',
                                borderRadius: '4px',
                                marginTop: '12px',
                                padding: '12px 14px',
                            }}
                        >
                            <Link
                                style={{
                                    color: emailColors.text,
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                }}
                                href={buildJobPostPageUrl(jobPost.slug)}
                            >
                                {jobPost.title}
                            </Link>
                            {jobPost.location ? (
                                <Text
                                    style={{
                                        color: emailColors.muted,
                                        fontSize: '14px',
                                        margin: '6px 0 0',
                                    }}
                                >
                                    {jobPost.location}
                                </Text>
                            ) : null}
                            {jobPost.category ? (
                                <Text
                                    style={{
                                        color: emailColors.muted,
                                        fontSize: '14px',
                                        margin: '2px 0 0',
                                    }}
                                >
                                    {jobPost.category}
                                </Text>
                            ) : null}
                            {jobPost.workplace ? (
                                <Text
                                    style={{
                                        color: emailColors.muted,
                                        fontSize: '14px',
                                        margin: '2px 0 0',
                                    }}
                                >
                                    {jobPost.workplace}
                                </Text>
                            ) : null}
                            {jobPost.salaryRange ? (
                                <Text
                                    style={{
                                        color: emailColors.text,
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        margin: '6px 0 0',
                                    }}
                                >
                                    {jobPost.salaryRange.min
                                        ? `${jobPost.salaryRange.min}-${jobPost.salaryRange.max} ${jobPost.salaryRange.currency}/${jobPost.salaryRange.period}`
                                        : `${jobPost.salaryRange.max} ${jobPost.salaryRange.currency}/${jobPost.salaryRange.period}`}
                                </Text>
                            ) : null}
                        </Row>
                    ))}
                </Section>
            ))}

            <Section style={{ marginTop: '32px' }}>
                <Text
                    style={{
                        color: emailColors.muted,
                        fontSize: '13px',
                        margin: '4px 0',
                        textAlign: 'center',
                    }}
                >
                    Thank you for using JobMeerkat.
                </Text>
                <Text
                    style={{
                        color: emailColors.muted,
                        fontSize: '13px',
                        margin: '4px 0',
                        textAlign: 'center',
                    }}
                >
                    This email was sent because you subscribed to our{' '}
                    {cadenceLabel(frequency)} job reports.
                </Text>
                {manageUrl ? (
                    <Text
                        style={{
                            color: emailColors.muted,
                            fontSize: '13px',
                            margin: '4px 0',
                            textAlign: 'center',
                        }}
                    >
                        <Link
                            href={manageUrl}
                            style={{ color: emailColors.link }}
                        >
                            Manage your subscription
                        </Link>
                    </Text>
                ) : null}
                {unsubscribeUrl ? (
                    <Text
                        style={{
                            color: emailColors.muted,
                            fontSize: '13px',
                            margin: '4px 0',
                            textAlign: 'center',
                        }}
                    >
                        <Link
                            href={unsubscribeUrl}
                            style={{ color: emailColors.link }}
                        >
                            Unsubscribe
                        </Link>
                    </Text>
                ) : null}
                <Text
                    style={{
                        color: emailColors.muted,
                        fontSize: '13px',
                        margin: '4px 0',
                        textAlign: 'center',
                    }}
                >
                    Questions or feedback?{' '}
                    <Link
                        href="mailto:jobmeerkat@gmail.com"
                        style={{ color: emailColors.link }}
                    >
                        jobmeerkat@gmail.com
                    </Link>
                </Text>
            </Section>
        </EmailShell>
    );
};

export const buildJobReportTemplate: BuildJobReportTemplate = async (props) =>
    buildEmailHtml(<JobReportTemplate {...props} />);

/** @deprecated Use buildJobReportTemplate */
export const buildDailyReportTemplate = buildJobReportTemplate;
