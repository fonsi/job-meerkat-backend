type Params = {
    companyName: string;
    jobPostId: string | number;
};

const ASHBY_GRAPHQL_ENDPOINT =
    'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting';

export const getAshbyJobPostContent = async ({
    companyName,
    jobPostId,
}: Params): Promise<Record<string, unknown>> => {
    const body = `{"operationName":"ApiJobPosting","variables":{"organizationHostedJobsPageName":"${companyName}","jobPostingId":"${jobPostId}"},"query":"query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) { jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName jobPostingId: $jobPostingId) { id title departmentName locationName workplaceType employmentType descriptionHtml isListed isConfidential teamNames applicationForm { ...FormRenderParts  __typename } surveyForms { ...FormRenderParts __typename } secondaryLocationNames compensationTierSummary compensationTiers { id title tierSummary __typename } applicationDeadline compensationTierGuideUrl scrapeableCompensationSalarySummary compensationPhilosophyHtml applicationLimitCalloutHtml shouldAskForTextingConsent candidateTextingPrivacyPolicyUrl automatedProcessingLegalNotice { automatedProcessingLegalNoticeRuleId automatedProcessingLegalNoticeHtml __typename } __typename } } fragment JSONBoxParts on JSONBox { value __typename } fragment FileParts on File { id filename __typename } fragment FormFieldEntryParts on FormFieldEntry { id field fieldValue { ... on JSONBox { ...JSONBoxParts __typename } ... on File { ...FileParts __typename } ... on FileList { files { ...FileParts __typename } __typename } __typename } isRequired descriptionHtml isHidden __typename } fragment FormRenderParts on FormRender { id formControls { identifier title __typename } errorMessages sections { title descriptionHtml fieldEntries { ...FormFieldEntryParts __typename } isHidden __typename } sourceFormDefinitionId __typename }" }`;
    const response = await fetch(ASHBY_GRAPHQL_ENDPOINT, {
        method: 'POST',
        body,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return await response.json();
};
