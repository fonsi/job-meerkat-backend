import { ListedJobPostsData } from './companyScrapper';
import { fetchJobListingJson } from './fetchJobListingJson';
import { JobListingUnavailableError } from './jobListingUnavailableError';

export type PinpointPosting = {
    id: string;
    title: string;
    url: string;
    description?: string;
    key_responsibilities?: string;
    key_responsibilities_header?: string;
    skills_knowledge_expertise?: string;
    skills_knowledge_expertise_header?: string;
    benefits?: string;
    benefits_header?: string;
    compensation?: string;
    compensation_visible?: boolean;
    workplace_type_text?: string;
    employment_type_text?: string;
    location?: { name?: string };
};

type PinpointPostingsResponse = {
    data?: PinpointPosting[];
};

type GetPinpointJobPostsParams = {
    companyName: string;
    subdomain: string;
};

export const getPinpointPostingsUrl = (subdomain: string): string =>
    `https://${subdomain}.pinpointhq.com/postings.json`;

export const buildPinpointJobContent = (jobData: PinpointPosting): string => {
    const sections: string[] = [];

    if (jobData.location?.name) {
        sections.push(`Location: ${jobData.location.name}`);
    }
    if (jobData.workplace_type_text) {
        sections.push(`Workplace: ${jobData.workplace_type_text}`);
    }
    if (jobData.employment_type_text) {
        sections.push(`Employment: ${jobData.employment_type_text}`);
    }
    if (jobData.compensation_visible && jobData.compensation) {
        sections.push(`Compensation: ${jobData.compensation}`);
    }
    if (jobData.description) {
        sections.push(jobData.description);
    }
    if (jobData.key_responsibilities) {
        sections.push(
            `${jobData.key_responsibilities_header || 'Responsibilities'}\n${jobData.key_responsibilities}`,
        );
    }
    if (jobData.skills_knowledge_expertise) {
        sections.push(
            `${jobData.skills_knowledge_expertise_header || 'Requirements'}\n${jobData.skills_knowledge_expertise}`,
        );
    }
    if (jobData.benefits) {
        sections.push(
            `${jobData.benefits_header || 'Benefits'}\n${jobData.benefits}`,
        );
    }

    return sections.join('\n\n');
};

export const getPinpointJobPosts = async ({
    companyName,
    subdomain,
}: GetPinpointJobPostsParams): Promise<ListedJobPostsData[]> => {
    const url = getPinpointPostingsUrl(subdomain);
    const jobsData = await fetchJobListingJson<PinpointPostingsResponse>({
        companyName,
        url,
    });

    if (!Array.isArray(jobsData.data)) {
        throw new JobListingUnavailableError(companyName, url);
    }

    return jobsData.data.map((jobData) => ({
        id: jobData.id,
        url: jobData.url,
        title: jobData.title,
        content: buildPinpointJobContent(jobData),
    }));
};
