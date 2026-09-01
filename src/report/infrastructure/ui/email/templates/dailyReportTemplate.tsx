import React from 'react';
import { Column, Img, Link, Row, Section, Text } from '@react-email/components';
import { formatJobPlaceLabel } from 'jobPost/domain/formatJobPlaceLabel';
import { formatSalaryRangeLabel } from 'jobPost/domain/formatSalaryRange';
import { selectVisibleJobPostsForReport } from 'report/application/selectVisibleJobPostsForReport';
import { JobPostsByCompanyType } from 'report/application/sendReport';
import { ReportFrequency } from 'report/domain/report';
import {
    EmailShell,
    buildEmailHtml,
    emailColors,
} from 'shared/infrastructure/email/templates/emailShell';
import {
    buildCompanyPageUrl,
    buildJobPostPageUrl,
    buildPublicSiteUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';

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

const openedWhenLabel = (frequency: ReportFrequency) =>
    frequency === 'weekly' ? 'last week' : 'yesterday';

const jobCountLabel = (count: number) =>
    count === 1 ? '1 new job' : `${count} new jobs`;

const moreJobPostsLinkLabel = (remaining: number, frequency: ReportFrequency) =>
    `View the other ${remaining} opened ${openedWhenLabel(frequency)} →`;

const remainingOpeningsLinkLabel = (remaining: number) =>
    remaining === 1
        ? 'Still 1 new opening to discover →'
        : `Still ${remaining} new openings to discover →`;

const categoryBadgeStyle = {
    backgroundColor: '#111111',
    borderRadius: '4px',
    color: '#fefefe',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '16px',
    padding: '4px 8px',
} as const;

const JobReportTemplate = ({
    jobPostsByCompany,
    totalJobPosts,
    totalCompanies,
    frequency,
    manageUrl,
    unsubscribeUrl,
}: JobReportTemplateProps) => {
    const title = titleForFrequency(frequency);
    const {
        companies: visibleCompanies,
        hiddenCompanyCount,
        remainingJobPostCount,
    } = selectVisibleJobPostsForReport(
        Object.values(jobPostsByCompany),
        totalJobPosts,
    );
    const allJobsUrl = buildPublicSiteUrl(UtmSource.Newsletter);

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

            {visibleCompanies.map(({ company, jobPosts, visibleJobPosts }) => {
                const remainingJobPosts =
                    jobPosts.length - visibleJobPosts.length;
                const companyPageUrl = buildCompanyPageUrl(
                    company.id,
                    UtmSource.Newsletter,
                );

                return (
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
                                    <Link
                                        href={companyPageUrl}
                                        style={{
                                            color: '#fefefe',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        {company.name}
                                    </Link>
                                    <span
                                        style={{
                                            color: '#cccccc',
                                            fontWeight: '400',
                                        }}
                                    >
                                        {` · ${jobCountLabel(jobPosts.length)}`}
                                    </span>
                                </Text>
                                {remainingJobPosts > 0 ? (
                                    <Text
                                        style={{
                                            margin: '4px 0 0',
                                        }}
                                    >
                                        <Link
                                            href={companyPageUrl}
                                            style={{
                                                color: '#cccccc',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            {moreJobPostsLinkLabel(
                                                remainingJobPosts,
                                                frequency,
                                            )}
                                        </Link>
                                    </Text>
                                ) : null}
                            </Column>
                        </Row>
                        {visibleJobPosts.map((jobPost) => {
                            const placeLabel = formatJobPlaceLabel(jobPost);
                            const salaryLabel = formatSalaryRangeLabel(
                                jobPost.salaryRange,
                            );

                            return (
                                <Row
                                    key={jobPost.id}
                                    style={{
                                        border: '1px solid #e5e5e5',
                                        borderRadius: '4px',
                                        marginTop: '12px',
                                        padding: '12px 14px',
                                    }}
                                >
                                    <Column>
                                        <Link
                                            style={{
                                                color: emailColors.text,
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                            }}
                                            href={buildJobPostPageUrl(
                                                jobPost.slug,
                                                UtmSource.Newsletter,
                                            )}
                                        >
                                            {jobPost.title}
                                        </Link>
                                        <table
                                            cellPadding={0}
                                            cellSpacing={0}
                                            role="presentation"
                                            style={{ marginTop: '8px' }}
                                        >
                                            <tbody>
                                                <tr>
                                                    <td
                                                        style={{
                                                            verticalAlign:
                                                                'middle',
                                                        }}
                                                    >
                                                        <span
                                                            style={
                                                                categoryBadgeStyle
                                                            }
                                                        >
                                                            {jobPost.category}
                                                        </span>
                                                    </td>
                                                    {placeLabel ? (
                                                        <td
                                                            style={{
                                                                color: emailColors.muted,
                                                                fontSize:
                                                                    '14px',
                                                                paddingLeft:
                                                                    '12px',
                                                                verticalAlign:
                                                                    'middle',
                                                            }}
                                                        >
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                style={{
                                                                    display:
                                                                        'inline-block',
                                                                    marginRight:
                                                                        '4px',
                                                                    verticalAlign:
                                                                        'middle',
                                                                }}
                                                            >
                                                                <path
                                                                    fill={
                                                                        emailColors.muted
                                                                    }
                                                                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5"
                                                                />
                                                            </svg>
                                                            <span
                                                                style={{
                                                                    verticalAlign:
                                                                        'middle',
                                                                }}
                                                            >
                                                                {placeLabel}
                                                            </span>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            </tbody>
                                        </table>
                                        {salaryLabel ? (
                                            <Text
                                                style={{
                                                    color: emailColors.text,
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    margin: '6px 0 0',
                                                }}
                                            >
                                                {salaryLabel}
                                            </Text>
                                        ) : null}
                                    </Column>
                                </Row>
                            );
                        })}
                    </Section>
                );
            })}

            {hiddenCompanyCount > 0 ? (
                <Section style={{ marginTop: '28px' }}>
                    <Text
                        style={{
                            color: emailColors.muted,
                            fontSize: '15px',
                            lineHeight: '1.6',
                            margin: '0',
                            textAlign: 'center',
                        }}
                    >
                        <Link
                            href={allJobsUrl}
                            style={{ color: emailColors.link }}
                        >
                            {remainingOpeningsLinkLabel(remainingJobPostCount)}
                        </Link>
                    </Text>
                </Section>
            ) : null}

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
