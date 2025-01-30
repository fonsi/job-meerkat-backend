type GetJobPostsParams = {
    companyName: string;
};

type JobPost = {
    atsId: string;
    title: string;
};

type GetJobPostsResponse = JobPost[];

type GetJobPostContentParams = {
    companyName: string;
    atsId: string;
};

const GEM_GRAPHQL_ENDPOINT = 'https://jobs.gem.com/api/public/graphql/batch';

export const getGemJobPosts = async ({
    companyName,
}: GetJobPostsParams): Promise<GetJobPostsResponse> => {
    const body = `[{"operationName":"JobBoardList","variables":{"boardId":"${companyName}"},"query":"query JobBoardList($boardId: String!) { publicJobPostings(externalId: $boardId) { jobPostings { id atsId title locations { id city atsId isRemote __typename } publicJob { id department { id name atsId __typename } locationType __typename } __typename } count __typename } publicJobPostingsFilters(externalId: $boardId) { type displayName rawValue value count __typename } jobBoardExternal(vanityUrlPath: $boardId) { id teamDisplayName descriptionHtml pageTitle __typename } } "}]`;
    const response = await fetch(GEM_GRAPHQL_ENDPOINT, {
        method: 'POST',
        body,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const content = await response.json();
    const jobPostings = content[0].data.publicJobPostings.jobPostings.map(
        (jobPost) => ({
            atsId: jobPost.atsId.toString(),
            title: jobPost.title,
        }),
    );

    return jobPostings;
};

export const getGemJobPostContent = async ({
    companyName,
    atsId,
}: GetJobPostContentParams): Promise<Record<string, unknown>> => {
    const body = `[{"operationName":"PublicJobPostingQuery","variables":{"boardId":"${companyName}","atsId":"${atsId}"},"query":"fragment PublicLocationFragment on PublicLocation { id city isoCountry isRemote locality __typename } query PublicJobPostingQuery($boardId: String!, $atsId: String!) { publicJobPosting(externalId: $boardId, atsId: $atsId) { id title description locations { id ...PublicLocationFragment __typename } startDateTs publishedDateTs companyLogo companyUrl atsType applyLink atsId status publicJob { id teamDisplayName locationType employmentType requisitionAtsId department { id name __typename } locations { id ...PublicLocationFragment __typename } __typename } __typename } oatsJobPostFieldsAndQuestions( jobBoardVanityPath: $boardId jobPostExtId: $atsId ) { fields { fieldType isRequired __typename } questions { extId answerType displayType text description isRequired options { extId value __typename } __typename } __typename } } "}]`;
    const response = await fetch(GEM_GRAPHQL_ENDPOINT, {
        method: 'POST',
        body,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const content = await response.json();

    return content[0].data.publicJobPosting;
};
