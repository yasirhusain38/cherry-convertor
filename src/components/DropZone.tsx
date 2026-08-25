"use client";

import { useCallback, useRef, useState } from "react";
import { ACCEPT_IMAGES, ACCEPT_VIDEO } from "@/lib/site";

type DropZoneProps = {
  multiple?: boolean;
  accept?: string;
  label?: string;
  hint?: string;
  media?: "image" | "video";
  onFiles: (files: File[]) => void;
};

function allowed(file: File, media: "image" | "video"): boolean {
  if (media === "video") {
    return file.type.startsWith("video") || /\.(mp4|webm|mov|mkv|m4v)$/i.test(file.name);
  }
  return file.type.startsWith("image") || /\.(heic|heif)$/i.test(file.name);
}

export function DropZone({
  multiple = false,
  media = "image",
  accept = media === "video" ? ACCEPT_VIDEO : ACCEPT_IMAGES,
  label = media === "video" ? "Drop a video, or browse" : "Drop an image, or browse",
  hint = media === "video"
    ? "MP4, WebM, MOV — graded and keyed on this device"
    : "JPG, PNG, WebP, HEIC — processed on this device",
  onFiles,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);

  const take = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const files = Array.from(list).filter((file) => allowed(file, media));
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
    [media, multiple, onFiles],
  );

  return (
    <div
      className="dropzone flex min-h-[280px] cursor-pointer flex-col items-center justify-center px-6 py-12 text-center"
      data-active={active}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        take(event.dataTransfer.files);
      }}
    >
      <p className="label mb-4">Upload</p>
      <p className="display text-3xl sm:text-4xl">{label}</p>
      <p className="mt-4 max-w-md text-sm leading-6 text-[var(--ink-soft)]">{hint}</p>
      <span className="btn btn-primary mt-8">Choose file{multiple ? "s" : ""}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
