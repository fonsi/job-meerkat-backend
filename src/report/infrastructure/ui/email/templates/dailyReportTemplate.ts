import { formatJobPlaceLabel } from 'jobPost/domain/formatJobPlaceLabel';
import { formatSalaryHighlight } from 'jobPost/domain/formatSalaryRange';
import { selectVisibleJobPostsForReport } from 'report/application/selectVisibleJobPostsForReport';
import { JobPostsByCompanyType } from 'report/application/sendReport';
import { ReportFrequency } from 'report/domain/report';
import {
    buildEmailParts,
    emailColors,
    escapeHtml,
} from 'shared/infrastructure/email/templates/emailShell';
import {
    buildCompanyPageUrl,
    buildJobPostPageUrl,
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

const jobCountLabel = (count: number) =>
    count === 1 ? '1 new' : `${count} new`;

const jobMetaLine = (category: string, placeLabel: string | null): string =>
    placeLabel ? `${category} · ${placeLabel}` : category;

const buildReportPlainText = ({
    title,
    totalJobPosts,
    totalCompanies,
    frequency,
    manageUrl,
    unsubscribeUrl,
}: {
    title: string;
    totalJobPosts: number;
    totalCompanies: number;
    frequency: ReportFrequency;
    manageUrl: string;
    unsubscribeUrl: string;
}): string => {
    const lines = [
        title,
        '',
        `${totalJobPosts} new jobs · ${totalCompanies} companies`,
        '',
        'Browse all on Jobmeerkat: https://jobmeerkat.com/?utm_source=newsletter',
        '',
        `Sent because you subscribed to ${cadenceLabel(frequency)} JobMeerkat reports.`,
    ];
    if (manageUrl) lines.push(`Manage: ${manageUrl}`);
    if (unsubscribeUrl) lines.push(`Unsubscribe: ${unsubscribeUrl}`);
    lines.push('jobmeerkat@gmail.com');

    return lines.join('\n');
};

const buildReportBodyHtml = ({
    jobPostsByCompany,
    totalJobPosts,
    totalCompanies,
    frequency,
    manageUrl,
    unsubscribeUrl,
}: JobReportTemplateProps): string => {
    const { companies: visibleCompanies } = selectVisibleJobPostsForReport(
        Object.values(jobPostsByCompany),
        totalJobPosts,
    );

    const rows: string[] = [];

    for (const { company, jobPosts, visibleJobPosts } of visibleCompanies) {
        const remainingJobPosts = jobPosts.length - visibleJobPosts.length;
        const companyPageUrl = escapeHtml(
            buildCompanyPageUrl(company.id, UtmSource.Newsletter),
        );
        const seeAll =
            remainingJobPosts > 0
                ? ` · <a href="${companyPageUrl}" style="color:${emailColors.accent};font-weight:500;text-decoration:none;">See all →</a>`
                : '';

        rows.push(
            `<tr><td colspan="2" style="background-color:${emailColors.heroBg};border-radius:4px;color:#fefefe;font-size:14px;font-weight:600;padding:8px 10px;">` +
                `<a href="${companyPageUrl}" style="color:#fefefe;text-decoration:none;">${escapeHtml(company.name)}</a>` +
                `<span style="color:#cccccc;font-weight:400;"> · ${jobCountLabel(jobPosts.length)}</span>` +
                seeAll +
                '</td></tr>',
        );

        for (const jobPost of visibleJobPosts) {
            const placeLabel = formatJobPlaceLabel(jobPost);
            const salary = formatSalaryHighlight(jobPost.salaryRange);
            const meta = escapeHtml(jobMetaLine(jobPost.category, placeLabel));
            const jobUrl = escapeHtml(
                buildJobPostPageUrl(jobPost.slug, UtmSource.Newsletter),
            );
            const salaryCell = salary
                ? '<td style="padding:8px 0;text-align:right;vertical-align:top;white-space:nowrap;width:1%;">' +
                  `<span style="color:${emailColors.text};display:block;font-size:14px;font-weight:700;line-height:1.3;">${escapeHtml(salary.amount)}</span>` +
                  `<span style="color:${emailColors.muted};display:block;font-size:11px;line-height:1.3;margin-top:1px;">${escapeHtml(salary.caption)}</span>` +
                  '</td>'
                : '<td style="padding:8px 0;width:1%;"></td>';

            rows.push(
                '<tr>' +
                    '<td style="border-bottom:1px solid #eee;padding:8px 10px 8px 0;vertical-align:top;">' +
                    `<a href="${jobUrl}" style="color:${emailColors.text};font-size:14px;font-weight:600;line-height:1.3;text-decoration:none;">${escapeHtml(jobPost.title)}</a>` +
                    `<span style="color:${emailColors.muted};display:block;font-size:12px;line-height:1.3;margin-top:2px;">${meta}</span>` +
                    '</td>' +
                    salaryCell +
                    '</tr>',
            );
        }
    }

    const footerLinks: string[] = [];
    if (manageUrl) {
        footerLinks.push(
            `<a href="${escapeHtml(manageUrl)}" style="color:${emailColors.link};text-decoration:none;">Manage</a>`,
        );
    }
    if (unsubscribeUrl) {
        footerLinks.push(
            `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${emailColors.link};text-decoration:none;">Unsubscribe</a>`,
        );
    }
    footerLinks.push(
        `<a href="mailto:jobmeerkat@gmail.com" style="color:${emailColors.link};text-decoration:none;">jobmeerkat@gmail.com</a>`,
    );

    return (
        `<p style="color:${emailColors.muted};font-size:13px;line-height:1.4;margin:0 0 12px;">` +
        `<span style="color:${emailColors.text};font-weight:700;">${totalJobPosts}</span> new jobs · ` +
        `<span style="color:${emailColors.text};font-weight:700;">${totalCompanies}</span> companies` +
        '</p>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0;width:100%;">' +
        `<tbody>${rows.join('')}</tbody>` +
        '</table>' +
        `<p style="color:${emailColors.muted};font-size:12px;margin:20px 0 0;text-align:center;">` +
        `Sent because you subscribed to ${cadenceLabel(frequency)} JobMeerkat reports.<br>` +
        footerLinks.join(' · ') +
        '</p>'
    );
};

export const buildJobReportTemplate: BuildJobReportTemplate = async (props) => {
    const title = titleForFrequency(props.frequency);

    return buildEmailParts(
        title,
        buildReportBodyHtml(props),
        buildReportPlainText({
            title,
            totalJobPosts: props.totalJobPosts,
            totalCompanies: props.totalCompanies,
            frequency: props.frequency,
            manageUrl: props.manageUrl,
            unsubscribeUrl: props.unsubscribeUrl,
        }),
    );
};

/** @deprecated Use buildJobReportTemplate */
export const buildDailyReportTemplate = buildJobReportTemplate;
