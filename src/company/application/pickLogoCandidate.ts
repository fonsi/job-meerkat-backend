import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import type { HomepageCapture } from 'company/infrastructure/admin/captureHomepage';

const VISION_MODEL = 'gpt-4o';

export type PickLogoCandidateCommand = {
    companyName: string;
    homePage: string;
    capture: HomepageCapture;
};

export type PickedLogoCandidate = HomepageCapture['candidates'][number];

type VisionPick = {
    candidateId: number;
    reason?: string;
};

let openai: OpenAI | undefined;

const getOpenAI = (): OpenAI => {
    if (!openai) openai = new OpenAI();

    return openai;
};

const candidateSummary = (capture: HomepageCapture): string =>
    capture.candidates
        .map((candidate) => {
            const parts = [
                `id=${candidate.id}`,
                `tag=${candidate.tag}`,
                candidate.alt ? `alt="${candidate.alt}"` : null,
                candidate.className ? `class="${candidate.className}"` : null,
                candidate.src ? `src=${candidate.src}` : null,
            ].filter(Boolean);

            return `- ${parts.join(' ')}`;
        })
        .join('\n');

export const pickLogoCandidate = async ({
    companyName,
    homePage,
    capture,
}: PickLogoCandidateCommand): Promise<PickedLogoCandidate> => {
    if (capture.candidates.length === 0) {
        throw new Error(`No header logo candidates found on ${homePage}`);
    }

    const content: ChatCompletionContentPart[] = [
        {
            type: 'text',
            text: `You are looking at a screenshot of ${companyName}'s homepage (${homePage}, landed on ${capture.finalUrl}).
Identify THIS company's own logo. It is almost always in the top-left of the header.
Do NOT pick customer, partner, "trusted by", press, social, app-store, or favicon icons.

Header/top-left candidates found in the DOM:
${candidateSummary(capture)}

Return JSON: { "candidateId": number, "reason": string }
candidateId must be one of the ids listed.`,
        },
        {
            type: 'image_url',
            image_url: {
                url: `data:image/png;base64,${capture.screenshotPng.toString('base64')}`,
                detail: 'high',
            },
        },
    ];

    for (const candidate of capture.candidates.slice(0, 6)) {
        content.push({
            type: 'text',
            text: `Crop of candidate id=${candidate.id}:`,
        });
        content.push({
            type: 'image_url',
            image_url: {
                url: `data:image/png;base64,${candidate.cropPng.toString('base64')}`,
                detail: 'low',
            },
        });
    }

    const response = await getOpenAI().chat.completions.create({
        model: VISION_MODEL,
        response_format: { type: 'json_object' },
        max_tokens: 300,
        messages: [{ role: 'user', content }],
    });
    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Vision model returned an empty logo pick');

    const parsed = JSON.parse(raw) as VisionPick;
    const picked = capture.candidates.find(
        (candidate) => candidate.id === parsed.candidateId,
    );
    if (!picked) {
        throw new Error(
            `Vision picked unknown candidateId ${parsed.candidateId}`,
        );
    }

    console.log(
        `[pickLogoCandidate] ${companyName} ← id=${picked.id} ${picked.src || picked.tag}${
            parsed.reason ? ` (${parsed.reason})` : ''
        }`,
    );

    return picked;
};
