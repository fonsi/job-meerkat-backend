import React from 'react';
import { Body, Container, Head, Heading, Html, Row, Column, Section, Img, Text, Link, render, toPlainText } from '@react-email/components';
import { JobPostsByCompanyType } from 'report/application/sendDailyReport';

type BuildDailyReportTemplate = (props: DailyReportTemplateProps) => Promise<{
    html: string;
    text: string;
}>;

type DailyReportTemplateProps = {
    jobPostsByCompany: JobPostsByCompanyType;
    totalJobPosts: number;
    totalCompanies: number;
}

const DailyReportTemplate = ({ jobPostsByCompany, totalJobPosts, totalCompanies }: DailyReportTemplateProps) => {
    return (
        <Html lang="en">
            <Head title="Daily Jobs Report" />
            <Body>
                <Container style={{ width: '100%', maxWidth: '680px' }}>
                    <Section style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px 8px 0 0', color: '#fefefe' }}>
                        <Heading style={{ textAlign: 'center' }}>Daily Job Report</Heading>
                        <Text style={{ textAlign: 'center' }}>Your curated list of the latest job opportunities</Text>
                    </Section>
                    <Section style={{ marginTop: '24px' }}>
                        <Row>
                            <Column
                                align="center"
                                style={{
                                    width: '50%',
                                    height: 80,
                                }}
                            >
                                <Text style={{ textAlign: 'center', fontSize: '30px', fontWeight: 'bold' }}>{totalJobPosts}</Text>
                                <Text style={{ textAlign: 'center', fontSize: '16px' }}>New Jobs</Text>
                            </Column>
                            <Column
                                align="center"
                                style={{
                                    width: '50%',
                                    height: 80,
                                }}
                            >
                                <Text style={{ textAlign: 'center', fontSize: '30px', fontWeight: 'bold' }}>{totalCompanies}</Text>
                                <Text style={{ textAlign: 'center', fontSize: '16px' }}>Companies</Text>
                            </Column>
                        </Row>
                    </Section>
                    <Section>
                        {Object.values(jobPostsByCompany).map(({ company, jobPosts }) => (
                            <Section key={company.id}>
                                <Row style={{ backgroundColor: '#333', padding: '4px 8px', borderRadius: '4px', marginTop: '24px' }}>
                                    <Column width="60px">
                                        <Img 
                                            src={company.logo.url} 
                                            alt={company.name} 
                                            width={50}
                                            style={{ 
                                                width: '50px',
                                                height: 'auto',
                                                display: 'block'
                                            }} 
                                        />
                                    </Column>
                                    <Column>
                                        <Text style={{ fontSize: '20px', fontWeight: '600', color: '#fefefe' }}>{company.name}</Text>
                                    </Column>
                                </Row>
                                {jobPosts.map((jobPost) => (
                                    <Row style={{ marginTop: '16px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }} key={jobPost.id}>
                                        <Link style={{ textDecoration: 'none', color: '#333', fontSize: '24px', fontWeight: '600' }} href={jobPost.url}>{jobPost.title}</Link>
                                        {jobPost.location && (
                                            <Text style={{ fontSize: '14px', margin: '2px 0 1px' }}>📍 {jobPost.location}</Text>
                                        )}
                                        {jobPost.category && (
                                            <Text style={{ fontSize: '14px', margin: '1px 0' }}>🏷️ {jobPost.category}</Text>
                                        )}
                                        {jobPost.workplace && (
                                            <Text style={{ fontSize: '14px', margin: '1px 0' }}>💼 {jobPost.workplace}</Text>
                                        )}
                                        <Text style={{ fontSize: '18px', fontWeight: '600', margin: '2px 0' }}>{jobPost.salaryRange?.min ? `${jobPost.salaryRange.min}-${jobPost.salaryRange.max} ${jobPost.salaryRange.currency}/${jobPost.salaryRange.period}` : ''}</Text>
                                    </Row>
                                ))}
                            </Section>
                        ))}
                    </Section>
                    <Section style={{ marginTop: '24px' }}>
                        <Text style={{ textAlign: 'center', color: '#c1c1c1', margin: '4px 0' }}>Thank you for using JobMeerkat! 🎯</Text>
                        <Text style={{ textAlign: 'center', color: '#c1c1c1', margin: '4px 0' }}>This email was sent because you subscribed to our daily job reports.</Text>
                        <Text style={{ textAlign: 'center', color: '#c1c1c1', margin: '4px 0' }}>If you have any questions or feedback, please contact us at <Link href="mailto:jobmeerkat@gmail.com">jobmeerkat@gmail.com</Link></Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export const buildDailyReportTemplate: BuildDailyReportTemplate = async ({ jobPostsByCompany, totalJobPosts, totalCompanies }) => {
    const component = <DailyReportTemplate jobPostsByCompany={jobPostsByCompany} totalJobPosts={totalJobPosts} totalCompanies={totalCompanies} />;
    const html = await render(component);
    const text = toPlainText(html);

    return {
        html,
        text,
    }
};