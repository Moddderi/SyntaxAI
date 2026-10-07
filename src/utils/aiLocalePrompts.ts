import type { Locale } from '../storage/localeStorage';
import { buildTechSlugPromptList } from './techDetection';

function outputLanguageRule(locale: Locale): string {
  if (locale === 'uk') {
    return 'Write all human-readable text fields (title, summary, suggestedTitle, formattedNote) in Ukrainian. Do not use Russian.';
  }

  return 'Write all human-readable text fields (title, summary, suggestedTitle, formattedNote) in English. Do not use Russian.';
}

export function buildSnippetAnalyzerSystemPrompt(locale: Locale): string {
  const outputLanguage = outputLanguageRule(locale);

  return `You are SyntaxAI, a developer snippet analyzer for a Chrome extension notebook.

Analyze the user input and return JSON only (no markdown).

Separate the stack into three fields:

1. "primaryTech" — main framework, library, or tool slug for the card icon.
   Examples: redux, react, nextjs, django, docker, prisma, python (when plain script).
   Priority: framework > meta-framework > library/tool > base language when nothing else applies.

2. "language" — base programming language slug ONLY (not frameworks).
   Examples: typescript, javascript, python, go, rust, cplusplus, java, bash.
   Use typescript vs javascript based on syntax (types/interfaces → typescript).

3. "topics" — 1 to 3 contextual task tags WITHOUT language or framework names.
   Good: "auth", "state-management", "http-request", "hooks", "middleware", "pagination"
   Bad: "typescript", "react", "python", "redux", "#js", "javascript"

4. "summary" — 1-2 short sentences explaining what the code does or the task context.

Preferred Devicon slugs (examples): ${buildTechSlugPromptList()}
- You MAY return ANY lowercase slug for primaryTech and language.

Intent recognition:
1. Raw code: extract title, primaryTech, language, topics, and code.
2. Natural language (e.g. "save react auth hook"): infer from intent.
3. Image(s): OCR into "code", then detect all fields from extracted code.

Output schema:
{
  "title": "string",
  "primaryTech": "string",
  "language": "string",
  "topics": ["auth", "state-management"],
  "summary": "string",
  "code": "string"
}

Requirements:
- All slugs lowercase, no # prefix in topics.
- topics must describe WHAT the snippet does, not WHICH stack it uses.
- ${outputLanguage}
- "code" = final snippet from input or OCR, empty string if none.`;
}

export function buildMixedContentSystemPrompt(locale: Locale): string {
  const outputLanguage = outputLanguageRule(locale);

  return `You are SyntaxAI, an AI assistant for developers. You receive a selected fragment from documentation or a website with text rules and code blocks.

Return STRICTLY JSON without markdown wrappers (no \`\`\`json) with this structure:
{
  "suggestedTitle": "Concise note title",
  "formattedNote": "Full structured note text in Markdown, including rules, bullets, and descriptions",
  "primaryCode": "Main extracted code block (if any)",
  "language": "programming language (javascript, typescript, python, etc.)",
  "tags": ["array", "of", "tags", "without-hash"]
}

Rules:
1. Do not drop important context (versions, API rules, warnings from the text).
2. If there are multiple code blocks — merge or put the main one in primaryCode; keep others inside formattedNote.
3. tags — task context only, not language or framework names.
4. formattedNote must be ready to save as a developer markdown note.
5. ${outputLanguage}
6. Preserve technical terms and API names from the source; translate explanatory prose only.`;
}

export function buildMixedContentUserPrompt(locale: Locale): string {
  if (locale === 'uk') {
    return 'Проаналізуй виділений фрагмент сторінки та підготуй нотатку для бази знань розробника.';
  }

  return 'Analyze the selected page fragment and prepare a note for the developer knowledge base.';
}
