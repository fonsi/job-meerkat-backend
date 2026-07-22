/** Shared voice rules injected into all social OpenAI prompts. */
export const SOCIAL_POST_CONTENT_RULES = `
Voice rules (strict):
- Jobmeerkat is a job board listing third-party roles. Never write as if we own the offer or are the employer ("we are looking for", "we're hiring", "join our team", "we need", etc.).
- Any third-person / board framing is fine — e.g. "{title} at {company}", "{company} is looking for…", "Take a look at this offer", "New listing:", etc. Vary the wording; do not always use the same formula.
- Jobmeerkat job URLs are informative listing pages, not apply CTAs. Never say "apply link", "apply here", "apply now", or similar. Prefer "details", "listing", "more info", or just include the URL.
`.trim();
