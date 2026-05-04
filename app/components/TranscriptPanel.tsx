"use client";

import { useEffect, useRef } from "react";
import { Segment } from "@/app/lib/types";

interface TranscriptPanelProps {
  segments: Segment[];
  activeSegmentId: number | null;
  onSegmentClick: (segment: Segment) => void;
}

export default function TranscriptPanel({
  segments,
  activeSegmentId,
  onSegmentClick,
}: TranscriptPanelProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSegmentId]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  if (segments.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
        <p className="text-sm">Transcript will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
      {segments.map((seg) => {
        const isActive = seg.id === activeSegmentId;
        return (
          <button
            key={seg.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSegmentClick(seg)}
            className={[
              "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
              isActive
                ? "bg-zinc-800 text-white shadow-sm scale-[1.01]"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
            ].join(" ")}
          >
            <span
              className={[
                "shrink-0 font-mono text-xs pt-0.5 tabular-nums",
                isActive ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-500",
              ].join(" ")}
            >
              {formatTime(seg.start)}
            </span>
            <span className={["text-sm leading-relaxed", isActive ? "font-medium" : ""].join(" ")}>
              {seg.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
