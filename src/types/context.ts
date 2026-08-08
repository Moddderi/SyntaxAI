export type SiteType = 'github' | 'stackoverflow' | 'mdn' | 'devto' | 'general';

export interface PageContext {
  /** Plain-text fallback for search and legacy flows. */
  selectedText: string;
  /** Full formatted selection with paragraphs, lists, and code blocks. */
  rawContent: string;
  url: string;
  pageTitle: string;
  metaDescription?: string;
  siteType: SiteType;
  timestamp: number;
}

export interface AIAnalyzedContext {
  suggestedTitle: string;
  tags: string[];
  summary: string;
  language: string;
}

export interface MixedContentAnalysisResult {
  suggestedTitle: string;
  formattedNote: string;
  primaryCode: string;
  language: string;
  tags: string[];
  primaryTech: string;
}

export interface DraftNoteFromContext {
  title: string;
  code: string;
  body: string;
  tags: string[];
  sourceUrl: string;
  aiSummary: string;
  language: string;
  primaryTech: string;
}

export const CONTEXT_CAPTURE_STORAGE_KEY = 'syntaxai_pending_context_capture';

export interface PendingContextCapture {
  pageContext: PageContext;
  capturedAt: number;
}

export const CONTEXT_CAPTURE_MESSAGE = {
  GET_PAGE_CONTEXT: 'SYNTAXAI_GET_PAGE_CONTEXT',
} as const;

export const CONTEXT_MENU_CAPTURE_ID = 'syntaxai-capture-selection';

export type ContextCaptureMessageType =
  (typeof CONTEXT_CAPTURE_MESSAGE)[keyof typeof CONTEXT_CAPTURE_MESSAGE];

export interface GetPageContextMessage {
  type: typeof CONTEXT_CAPTURE_MESSAGE.GET_PAGE_CONTEXT;
}

export interface GetPageContextResponse {
  success: boolean;
  pageContext: PageContext | null;
}
