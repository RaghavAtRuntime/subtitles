"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { Segment } from "@/app/lib/types";

interface MediaPlayerProps {
  src: string;
  mediaType: "video" | "audio";
  segments: Segment[];
  activeSegmentId: number | null;
  onTimeUpdate: (time: number) => void;
}

export interface MediaPlayerHandle {
  seekTo: (time: number) => void;
}

const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(
  function MediaPlayer({ src, mediaType, segments, activeSegmentId, onTimeUpdate }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => ({
      seekTo(time: number) {
        if (videoRef.current) videoRef.current.currentTime = time;
        if (audioRef.current) audioRef.current.currentTime = time;
      },
    }));

    const handleTimeUpdate = () => {
      const el = videoRef.current ?? audioRef.current;
      if (el) onTimeUpdate(el.currentTime);
    };

    // Find active segment for caption overlay
    const activeSegment = segments.find((s) => s.id === activeSegmentId);

    if (mediaType === "audio") {
      return (
        <div className="flex flex-col items-center justify-center gap-6 rounded-xl bg-zinc-900 p-8 border border-zinc-800">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-indigo-400" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <audio
            ref={audioRef}
            src={src}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full"
          />
          {activeSegment && (
            <div className="w-full rounded-lg bg-zinc-800 px-4 py-3 text-center text-sm font-medium text-zinc-100 min-h-[48px]">
              {activeSegment.text}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full overflow-hidden rounded-xl bg-black border border-zinc-800">
        <video
          ref={videoRef}
          src={src}
          controls
          onTimeUpdate={handleTimeUpdate}
          className="w-full"
          style={{ maxHeight: "480px" }}
        />
        {activeSegment && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center px-6 pointer-events-none">
            <span className="rounded-md bg-black/75 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm text-center">
              {activeSegment.text}
            </span>
          </div>
        )}
      </div>
    );
  }
);

export default MediaPlayer;
