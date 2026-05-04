"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Captions, Download, Loader2, AlertCircle } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import MediaPlayer, { MediaPlayerHandle } from "@/app/components/MediaPlayer";
import TranscriptPanel from "@/app/components/TranscriptPanel";
import { Segment, MediaType } from "@/app/lib/types";
import { toSRT, toVTT, downloadFile } from "@/app/lib/exportUtils";

type AppState = "idle" | "uploading" | "done" | "error";

function detectMediaType(file: File): "video" | "audio" {
  if (file.type.startsWith("video")) return "video";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "audio";
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<MediaPlayerHandle>(null);

  const activeSegmentId = useMemo(() => {
    const seg = segments.find(
      (s) => currentTime >= s.start && currentTime <= s.end
    );
    return seg?.id ?? null;
  }, [segments, currentTime]);

  const handleFileSelect = useCallback((file: File) => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setObjectUrl(url);
    setMediaType(detectMediaType(file));
    setSegments([]);
    setCurrentTime(0);
    setAppState("idle");
    setErrorMsg(null);
  }, [objectUrl]);

  const handleClear = useCallback(() => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setSelectedFile(null);
    setObjectUrl(null);
    setMediaType(null);
    setSegments([]);
    setCurrentTime(0);
    setAppState("idle");
    setErrorMsg(null);
  }, [objectUrl]);

  const handleTranscribe = useCallback(async () => {
    if (!selectedFile) return;
    setAppState("uploading");
    setErrorMsg(null);

    try {
      const form = new FormData();
      form.append("file", selectedFile);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Transcription failed.");
      }

      setSegments(data.segments ?? []);
      setAppState("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(message);
      setAppState("error");
    }
  }, [selectedFile]);

  const handleSegmentClick = useCallback((seg: Segment) => {
    playerRef.current?.seekTo(seg.start);
    setCurrentTime(seg.start);
  }, []);

  const handleExportSRT = useCallback(() => {
    if (segments.length === 0) return;
    const baseName = selectedFile?.name.replace(/\.[^.]+$/, "") ?? "subtitles";
    downloadFile(toSRT(segments), `${baseName}.srt`, "text/plain;charset=utf-8");
  }, [segments, selectedFile]);

  const handleExportVTT = useCallback(() => {
    if (segments.length === 0) return;
    const baseName = selectedFile?.name.replace(/\.[^.]+$/, "") ?? "subtitles";
    downloadFile(toVTT(segments), `${baseName}.vtt`, "text/vtt;charset=utf-8");
  }, [segments, selectedFile]);

  const showPlayer = objectUrl && mediaType;
  const showTranscript = appState === "done" || segments.length > 0;
  const isTranscribing = appState === "uploading";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5">
          <Captions className="text-indigo-400" size={22} />
          <span className="text-base font-semibold tracking-tight">SubtitleAI</span>
          <span className="ml-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
            Powered by Whisper
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {/* Upload section */}
        <section className="flex flex-col gap-4">
          <UploadZone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClear={handleClear}
          />

          {/* Transcribe button */}
          {selectedFile && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Transcribing…
                  </>
                ) : (
                  "Transcribe"
                )}
              </button>

              {/* Export buttons */}
              {segments.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportSRT}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                  >
                    <Download size={13} />
                    SRT
                  </button>
                  <button
                    onClick={handleExportVTT}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                  >
                    <Download size={13} />
                    VTT
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {appState === "error" && errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Player + Transcript */}
        {showPlayer && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Media player */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Player
              </h2>
              <MediaPlayer
                ref={playerRef}
                src={objectUrl}
                mediaType={mediaType}
                segments={segments}
                activeSegmentId={activeSegmentId}
                onTimeUpdate={setCurrentTime}
              />
            </div>

            {/* Transcript panel */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Transcript
                </h2>
                {isTranscribing && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Loader2 size={12} className="animate-spin" />
                    Processing…
                  </span>
                )}
                {showTranscript && segments.length > 0 && (
                  <span className="text-xs text-zinc-600">
                    {segments.length} segments
                  </span>
                )}
              </div>

              <div className="h-[420px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                {isTranscribing ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-600">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <p className="text-sm">Transcribing your media…</p>
                  </div>
                ) : (
                  <TranscriptPanel
                    segments={segments}
                    activeSegmentId={activeSegmentId}
                    onSegmentClick={handleSegmentClick}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Empty state when no file */}
        {!showPlayer && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-full bg-zinc-900 p-5">
              <Captions size={32} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">
                Upload a video or audio file to get started
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Supported: MP4, MOV, WEBM, MP3, WAV, M4A
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-600">
        SubtitleAI — AI-powered transcription with OpenAI Whisper
      </footer>
    </div>
  );
}
