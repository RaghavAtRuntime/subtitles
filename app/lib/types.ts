export interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  segments: Segment[];
  language?: string;
}

export type MediaType = "video" | "audio" | null;
