"use client";

import { useCallback, useState } from "react";
import { UploadCloud, FileVideo, FileAudio, X } from "lucide-react";
import { detectMediaType, isValidMediaFile } from "@/app/lib/types";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export default function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isValidMediaFile(file)) {
        setError("Unsupported file type. Please upload .mp4, .mov, .webm, .mp3, .wav, or .m4a");
        return;
      }
      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (selectedFile) {
    const isVideo = detectMediaType(selectedFile) === "video";
    const Icon = isVideo ? FileVideo : FileAudio;
    const sizeMB = (selectedFile.size / 1024 / 1024).toFixed(2);

    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className="shrink-0 text-indigo-400" size={22} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{selectedFile.name}</p>
            <p className="text-xs text-zinc-500">{sizeMB} MB</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="file-upload"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-all duration-200",
          dragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/60",
        ].join(" ")}
      >
        <UploadCloud
          size={36}
          className={dragging ? "text-indigo-400" : "text-zinc-500"}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">
            Drag & drop your file here
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            MP4, MOV, WEBM, MP3, WAV, M4A — up to 25 MB
          </p>
        </div>
        <span className="mt-1 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700">
          Browse files
        </span>
        <input
          id="file-upload"
          type="file"
          accept=".mp4,.mov,.webm,.mp3,.wav,.m4a,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4"
          className="sr-only"
          onChange={onInputChange}
        />
      </label>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
