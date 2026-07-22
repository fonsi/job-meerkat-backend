# Adding a company scraper

Step-by-step process to add a scrapeable company in the **development** environment. Follow this whenever asked to add more companies.

## Prerequisites

- Company has an ATS we already support: **Greenhouse**, **Ashby**, **Lever**, **Gem GraphQL**, or **Workable** (or a custom HTML pattern that already exists in `src/company/infrastructure/scrapping/`).
- Prefer companies with **&lt; 100 open jobs** unless explicitly asked otherwise.
- `homePage` is the company marketing homepage, **not** the careers page.

## 1. Identify the ATS and API slug

From the careers URL (or by probing the page HTML), determine platform + board slug:

| Platform | List URL pattern | Job content |
|---|---|---|
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true` | HTML via Cheerio (`.job__header`, `.job__description`) — or API `content` if HTML fails |
| Ashby | `https://api.ashbyhq.com/posting-api/job-board/{slug}` | `getAshbyJobPostContent` GraphQL helper |
| Lever | `https://api.lever.co/v0/postings/{slug}?mode=json` | HTML `.content`, or `descriptionPlain` from API if HTML fails |
| Gem | boardId in Gem GraphQL (`jobs.gem.com/{boardId}`) | `getGemJobPosts` / `getGemJobPostContent` |
| Workable | `apply.workable.com/api/v3/accounts/{slug}/jobs` | existing Workable scrapers as reference |

Quick checks:

```bash
# Greenhouse
curl -s "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true" | head -c 200

# Ashby
curl -s "https://api.ashbyhq.com/posting-api/job-board/{slug}" | head -c 200

# Lever
curl -s "https://api.lever.co/v0/postings/{slug}?mode=json" | head -c 200
```

Skip or defer if: dead link, aggregator-only page, blocked custom ATS, or too many jobs.

## 2. Create the company in the DB

**Required fields:** `name`, `homePage`, and `description`. Never create a company without a description — it is used for social post generation.

1. Edit `src/company/infrastructure/api/companyPost.event.json` body:

```json
"body": "{\"name\": \"Company Name\", \"homePage\": \"https://example.com\", \"description\": \"One or two sentences on what the company builds and who it serves.\"}"
```

Write `description` in the same style as existing DB entries: 1–2 plain sentences about the product/platform and customer outcome (not marketing fluff, not careers-page copy).

2. Run:

```bash
npm run local company -- --path src/company/infrastructure/api/companyPost.event.json
```

3. Save the returned `companyId` (UUID). Confirm the response/`getById` includes `description`.

`name` in the DB must match the scraper registry key (case-insensitive). The scraper’s exported `*_NAME` constant is usually the lowercase company name (e.g. `twitch`, `hopskipdrive`, `wispr-flow` only if that matches how you register it — prefer the folder/`NAME` used in `companyScrapper.ts`).

If a company was already created without a description, backfill it on `dev-company` (or the active stage table):

```bash
aws dynamodb update-item \
  --table-name dev-company \
  --profile jobmeerkat-aws \
  --region eu-west-1 \
  --key '{"id":{"S":"<companyId>"}}' \
  --update-expression "SET description = :d" \
  --expression-attribute-values '{":d":{"S":"<description>"}}'
```
## 3. Create the scraper

1. Add `src/company/infrastructure/scrapping/{folder}/index.ts`.
2. Copy the closest existing scraper for that ATS (good references):
   - Greenhouse: `discord`, `twitch`
   - Ashby: `astronomer`, `limitless`
   - Lever: `supermove` (HTML) or `regrello` (API content fallback)
   - Gem: `gem`
3. Export `COMPANY_NAME` and `companyScrapper`.
4. Implement:
   - `getListedJobPostsData` — list open roles (`id`, `url`, `title`, `createdAt`)
   - `scrapJobPost` — fetch/analyze each post via `openaiJobPostAnalyzer`

### Title filters (skip non-jobs)

In `getListedJobPostsData`, filter out talent-pool / catch-all posts when present. Existing patterns in the codebase:

- `open application` (tinybird)
- `general application` (limitless, attio)
- `spontaneous application` (wave)
- `general interest` (chromatic)
- `talent community` (checkly, zapier)
- `intern` / internship (astronomer, 1password, super)
- `future openings` / `talent pool` / `future opportunities` when they are waitlists, not real roles

After listing works, **scan all titles** before enabling full scrapes (see §5).

### Special cases

- **Consensys-style Greenhouse**: careers HTML selectors empty → use Greenhouse API `content` field.
- **Regrello-style Lever**: HTML scrape fails → use Lever `descriptionPlain` (or equivalent API field).
- Ashby: only include jobs with `jobData.isListed`.

## 4. Register the scraper

In `src/company/infrastructure/scrapping/companyScrapper.ts`:

1. Import `{ COMPANY_NAME, companyScrapper }` from `./{folder}`.
2. Add a `case COMPANY_NAME:` in `getNewCompanyScrapper` (keep alphabetical-ish with neighbors).

The switch matches `company.name?.toLowerCase()`, so DB name lowercased must equal `COMPANY_NAME`.

## 5. Validate (list titles first, then sample scrape)

### 5a. List-only check for skippable titles

Temporarily in `getListedJobPostsData`, after building the list:

```ts
console.log(jobPosts.map((j) => j.title));
return []; // stop before scrapJobPost / OpenAI
```

Or temporarily return `[]` after logging in `devScrapCompany` after `getListedJobPostsData`.

Put the `companyId` in `src/company/infrastructure/dev/scrapCompany.event.json`:

```json
{ "body": "<companyId>" }
```

Run:

```bash
npm run scrap-company
```

Review titles for open/general/spontaneous applications, internships, talent pools. Add filters, then remove the temporary early return / log-only hack.

### 5b. Sample scrape validation

- Temporarily slice listed jobs to ~5 in `getListedJobPostsData` (or in `devScrapCompany` before `scrapJobPost`).
- Run `npm run scrap-company`.
- Confirm each sample has a non-empty analyzed title (and sensible fields).
- Revert the slice so production-like listing returns all jobs again.
- Leave `devScrapCompany.ts` clean (no permanent list-only / slice helpers unless the user asks to keep them).

## 6. Track status

Update (or create) a tracking note with:

| Company | Company ID | Platform | API slug | Jobs | Status |
|---|---|---|---|---:|---|

Statuses used previously: pending, validated, validated (API content), no openings, skipped (&gt;100 jobs), not scrapeable.

## Checklist (per company)

- [ ] ATS + slug confirmed; job count acceptable
- [ ] Company created in DB **with `description`**; `companyId` saved
- [ ] Scraper folder + `*_NAME` + list/detail logic
- [ ] Registered in `companyScrapper.ts`
- [ ] Title skip filters for open application / internship / talent community as needed
- [ ] List titles reviewed
- [ ] ~5 sample job posts scrape with titles
- [ ] Temporary list/slice hacks reverted
- [ ] Tracking doc updated

## Batching tips

- Create scrapers from templates in parallel once ATS/slug is known.
- Create DB companies one-by-one (or carefully scripted JSON writes to `companyPost.event.json` — avoid naive string replace; it corrupts the file).
- Validate listings for all new companies before running expensive full OpenAI scrapes.
- Do not commit unless asked.
