export type SidePanelTab = 'active-capture' | 'recent-logs';

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

export interface RecentLogItem {
  id: string;
  title: string;
  tags: string[];
  capturedAt: string;
}
