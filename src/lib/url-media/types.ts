export type MediaKind = "image" | "video" | "audio" | "document" | "file";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  label: string;
  format: string;
  mime: string;
  url: string;
  width?: number;
  height?: number;
  bytes?: number | null;
  note?: string;
  /** Only true for a public, fetchable file (not a watch page). */
  downloadable: boolean;
};

export type PlatformId =
  | "direct"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "x"
  | "reddit"
  | "pinterest"
  | "vimeo"
  | "twitch"
  | "dailymotion"
  | "telegram"
  | "soundcloud"
  | "vk"
  | "odnoklassniki"
  | "bilibili"
  | "weibo"
  | "douyin"
  | "kuaishou"
  | "likee"
  | "kwai"
  | "niconico"
  | "navertv"
  | "moj"
  | "josh"
  | "sharechat"
  | "chingari"
  | "unknown";

export type InspectResult = {
  platform: PlatformId;
  platformName: string;
  pageUrl: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  items: MediaItem[];
  /** Shown when video/audio files are not offered. */
  blockedReason?: string;
};

export type PlatformAdapter = {
  id: PlatformId;
  name: string;
  hosts: string[];
  match?: (url: URL) => boolean;
};
