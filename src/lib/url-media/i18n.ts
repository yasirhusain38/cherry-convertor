/** Copy for the URL tool. Add locales later without cloning 195 country pages. */
export const URL_MEDIA_COPY = {
  en: {
    paste: "Paste a public URL",
    detect: "Detect",
    none: "No public file to download.",
    convert: "Convert in this browser after fetch",
    video: "Download the original video file, or re-encode WebM / first frame in this tab.",
  },
} as const;

export type UrlMediaLocale = keyof typeof URL_MEDIA_COPY;

export function urlMediaCopy(locale: string) {
  const short = locale.slice(0, 2).toLowerCase() as UrlMediaLocale;
  return URL_MEDIA_COPY[short] ?? URL_MEDIA_COPY.en;
}
