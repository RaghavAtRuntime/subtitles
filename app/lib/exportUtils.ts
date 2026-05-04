import { Segment } from "./types";

function formatTime(seconds: number, delimiter = ","): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${delimiter}${String(ms).padStart(3, "0")}`;
}

export function toSRT(segments: Segment[]): string {
  return segments
    .map((seg, index) => {
      const start = formatTime(seg.start, ",");
      const end = formatTime(seg.end, ",");
      return `${index + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join("\n");
}

export function toVTT(segments: Segment[]): string {
  const body = segments
    .map((seg) => {
      const start = formatTime(seg.start, ".");
      const end = formatTime(seg.end, ".");
      return `${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
