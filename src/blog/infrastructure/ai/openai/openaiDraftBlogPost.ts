import OpenAI from 'openai';
import { BlogMarketSnapshot } from 'blog/domain/blogSnapshot';
import { BlogPostType } from 'blog/domain/blogPost';

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

export type BlogDraft = {
    title: string;
    excerpt: string;
    paragraphs: string[];
};

const example: BlogDraft = {
    title: 'Example title',
    excerpt: 'One or two sentences.',
    paragraphs: ['Paragraph one.', 'Paragraph two.'],
};

const parseDraft = (raw: string | null | undefined): BlogDraft => {
    if (!raw) throw new Error('OpenAI blog draft was empty');
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('OpenAI blog draft was not an object');
    }
    const record = parsed as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const excerpt =
        typeof record.excerpt === 'string' ? record.excerpt.trim() : '';
    const paragraphs = Array.isArray(record.paragraphs)
        ? record.paragraphs.filter(
              (item): item is string =>
                  typeof item === 'string' && item.trim().length > 0,
          )
        : [];
    if (!title || !excerpt || paragraphs.length === 0) {
        throw new Error(
            'OpenAI blog draft missing title, excerpt, or paragraphs',
        );
    }

    return { title, excerpt, paragraphs };
};

export const openaiDraftBlogPost = async (
    snapshot: BlogMarketSnapshot,
): Promise<BlogDraft> => {
    const kindLabel =
        snapshot.kind === BlogPostType.MonthlyRecap
            ? `remote job market recap for ${snapshot.periodLabel}`
            : `${snapshot.category?.name ?? 'category'} jobs recap for ${snapshot.periodLabel}`;

    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                    'You write factual Jobmeerkat blog posts from listing snapshots. Never invent salaries, counts, companies, or job titles. Use only numbers and names in the JSON. Do not add a fallback topic if the data is thin.',
            },
            {
                role: 'user',
                content: `
Write a ${kindLabel} for Jobmeerkat from this snapshot only:
${JSON.stringify(snapshot)}

Rules:
- Facts only from the snapshot. If a figure is missing, omit it.
- Cover only periodLabel (${snapshot.periodLabel}: ${snapshot.periodStart} through ${snapshot.periodEnd}). Never describe the current incomplete month or week.
- Title and excerpt must name that completed period (e.g. include "${snapshot.periodLabel}").
- jobCount / newJobCount are listings created in that period only — do not call them "all open roles" or invent "newly listed" beyond that.
- Salary labels are single job ranges (medianSalaryLabel is one listing near the median max). Do not turn a label into a separate min/max band.
- 4–8 short paragraphs. No headings in the paragraph text.
- Mention figures are from Jobmeerkat listings for that period (asOf is the period end).
- Do not paste every listing; the page will list them.
- Keep listing URLs unchanged if you mention one.
- No generic filler ("insights into the state of", "healthy job market", career-coach advice, invented trends).

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return parseDraft(completion.choices[0].message.content);
};
