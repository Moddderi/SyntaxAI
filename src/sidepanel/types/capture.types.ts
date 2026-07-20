export type SidePanelMode = 'capture' | 'search';

export const MAX_CAPTURE_IMAGES = 3;

export const CAPTURE_IMAGE_THUMB_SIZE_PX = 64;
export const CAPTURE_IMAGE_THUMB_GAP_PX = 8;

export interface PastedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface DetectedNote {
  technologyLabel: string;
  title: string;
  tags: string[];
}

export type LanguageFilterId = 'all' | 'ts' | 'py' | 'go' | 'sql' | 'rs';

export interface LanguageFilterOption {
  id: LanguageFilterId;
  label: string;
  tech?: string;
}

export interface SearchResultItem {
  id: string;
  tech: string;
  title: string;
  capturedAt: string;
  codePreview: string;
  tags: string[];
  language: LanguageFilterId;
}
