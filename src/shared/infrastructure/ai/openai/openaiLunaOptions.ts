import type OpenAI from 'openai';

/** Luna Chat Completions option; SDK types still omit `'none'`. */
export const LUNA_REASONING_EFFORT =
    'none' as unknown as OpenAI.Chat.ChatCompletionReasoningEffort;
