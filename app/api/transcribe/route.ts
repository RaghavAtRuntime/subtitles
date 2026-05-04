import OpenAI from "openai";
import { Segment } from "@/app/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided." }, { status: 400 });
    }

    const allowedTypes = [
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/x-m4a",
    ];

    if (!allowedTypes.includes(file.type) && file.type !== "") {
      // Allow if type is empty (browser may not detect type for some formats)
    }

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = response as any;
    const rawSegments: Array<{
      id?: number;
      start: number;
      end: number;
      text: string;
    }> = raw.segments ?? [];

    const segments: Segment[] = rawSegments.map((seg, index) => ({
      id: seg.id ?? index,
      start: seg.start,
      end: seg.end,
      text: seg.text,
    }));

    return Response.json({ segments, language: raw.language ?? null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
