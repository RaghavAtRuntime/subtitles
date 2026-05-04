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

export const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);
export const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a"]);
export const ALL_EXTENSIONS = new Set([...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS]);

export function detectMediaType(file: File): "video" | "audio" {
  if (file.type.startsWith("video")) return "video";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.has(ext) ? "video" : "audio";
}

export function isValidMediaFile(file: File): boolean {
  if (
    [
      "video/mp4", "video/quicktime", "video/webm",
      "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a",
    ].includes(file.type)
  ) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALL_EXTENSIONS.has(ext);
}
