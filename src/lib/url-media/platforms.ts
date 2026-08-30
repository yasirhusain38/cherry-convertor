import type { PlatformAdapter, PlatformId } from "./types";

export const PLATFORMS: PlatformAdapter[] = [
  { id: "youtube", name: "YouTube / Shorts", hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "youtube-nocookie.com"] },
  { id: "tiktok", name: "TikTok", hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"] },
  { id: "instagram", name: "Instagram", hosts: ["instagram.com", "www.instagram.com"] },
  { id: "facebook", name: "Facebook", hosts: ["facebook.com", "www.facebook.com", "fb.watch", "fb.com"] },
  { id: "x", name: "X / Twitter", hosts: ["x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"] },
  { id: "reddit", name: "Reddit", hosts: ["reddit.com", "www.reddit.com", "old.reddit.com", "i.redd.it", "v.redd.it", "preview.redd.it"] },
  { id: "pinterest", name: "Pinterest", hosts: ["pinterest.com", "www.pinterest.com", "pin.it"] },
  { id: "vimeo", name: "Vimeo", hosts: ["vimeo.com", "www.vimeo.com", "player.vimeo.com"] },
  { id: "twitch", name: "Twitch", hosts: ["twitch.tv", "www.twitch.tv", "clips.twitch.tv"] },
  { id: "dailymotion", name: "Dailymotion", hosts: ["dailymotion.com", "www.dailymotion.com", "dai.ly"] },
  { id: "telegram", name: "Telegram", hosts: ["t.me", "telegram.me"] },
  { id: "soundcloud", name: "SoundCloud", hosts: ["soundcloud.com", "www.soundcloud.com", "on.soundcloud.com"] },
  { id: "vk", name: "VK", hosts: ["vk.com", "www.vk.com", "m.vk.com"] },
  { id: "odnoklassniki", name: "OK.ru", hosts: ["ok.ru", "www.ok.ru"] },
  { id: "bilibili", name: "Bilibili", hosts: ["bilibili.com", "www.bilibili.com", "b23.tv"] },
  { id: "weibo", name: "Weibo", hosts: ["weibo.com", "www.weibo.com", "m.weibo.cn"] },
  { id: "douyin", name: "Douyin", hosts: ["douyin.com", "www.douyin.com"] },
  { id: "kuaishou", name: "Kuaishou", hosts: ["kuaishou.com", "www.kuaishou.com"] },
  { id: "likee", name: "Likee", hosts: ["likee.video", "likeevideo.com"] },
  { id: "kwai", name: "Kwai", hosts: ["kwai.com", "www.kwai.com"] },
  { id: "niconico", name: "Niconico", hosts: ["nicovideo.jp", "www.nicovideo.jp"] },
  { id: "navertv", name: "Naver TV", hosts: ["tv.naver.com", "naver.com"] },
  { id: "moj", name: "Moj", hosts: ["mojapp.in"] },
  { id: "josh", name: "Josh", hosts: ["joshapp.com"] },
  { id: "sharechat", name: "ShareChat", hosts: ["sharechat.com"] },
  { id: "chingari", name: "Chingari", hosts: ["chingari.io"] },
];

const HOST_INDEX = new Map<string, PlatformAdapter>();
for (const p of PLATFORMS) {
  for (const h of p.hosts) HOST_INDEX.set(h, p);
}

export function detectPlatform(url: URL): PlatformAdapter | null {
  const host = url.hostname.toLowerCase();
  const stripped = host.replace(/^www\./, "");
  const exact =
    HOST_INDEX.get(host) ?? HOST_INDEX.get(stripped) ?? HOST_INDEX.get(`www.${stripped}`) ?? null;
  if (exact) return exact;
  for (const p of PLATFORMS) {
    for (const base of p.hosts) {
      if (hostEqualsOrSub(host, base)) return p;
    }
  }
  return null;
}

export function platformName(id: PlatformId): string {
  if (id === "direct") return "Direct file";
  if (id === "unknown") return "Unknown site";
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}

export const STREAM_BLOCK =
  "This platform does not provide a public media file for third-party download. We do not bypass login, DRM, or their player. If you have a direct .mp4 / .mp3 / image URL, paste that instead — or convert a file you already have.";

export const YOUTUBE_VIDEO_BLOCK =
  "YouTube does not give other sites the video file. There is no public mp4 to fetch, and we will not rip their player. Watch it on YouTube (or use YouTube’s own download if they offer one). Thumbnails below are still images, not the video.";

export function streamBlock(id: PlatformId): string {
  if (id === "youtube") return YOUTUBE_VIDEO_BLOCK;
  return STREAM_BLOCK;
}

/** Player / stream CDNs — never treated as a public downloadable video file. */
export const VIDEO_STREAM_CDNS = [
  "googlevideo.com",
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "tiktokv.com",
  "byteoversea.com",
  "ibyteimg.com",
  "muscdn.com",
  "cdninstagram.com",
  "fbcdn.net",
  "video.twimg.com",
  "pscp.tv",
  "periscope.tv",
  "ttvnw.net",
  "jtvnw.net",
  "twitchcdn.net",
  "vimeocdn.com",
  "vod-adaptive.akamaized.net",
  "vod-progressive.akamaized.net",
];

function hostKey(host: string): string {
  return host.toLowerCase().replace(/^\[|\]$/g, "").replace(/^www\./, "");
}

export function hostEqualsOrSub(host: string, base: string): boolean {
  const h = hostKey(host);
  const b = hostKey(base);
  return h === b || h.endsWith(`.${b}`);
}

export function isPlatformHost(host: string): boolean {
  const h = hostKey(host);
  for (const p of PLATFORMS) {
    for (const base of p.hosts) {
      if (hostEqualsOrSub(h, base)) return true;
    }
  }
  return false;
}

export function isVideoStreamCdn(host: string): boolean {
  return VIDEO_STREAM_CDNS.some((base) => hostEqualsOrSub(host, base));
}

/** True when a URL's host is a watch-page platform or a known stream CDN. */
export function isPlayerOrStreamHost(host: string): boolean {
  return isPlatformHost(host) || isVideoStreamCdn(host);
}
