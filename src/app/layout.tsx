import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Header } from "@/components/Header";
import { Intro } from "@/components/motion/Intro";
import { PageCurtain } from "@/components/motion/PageCurtain";
import { SiteCursor } from "@/components/motion/SiteCursor";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { SITE, absoluteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Free image tools, processed in your browser`,
    template: `%s – ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: "#F2013F",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: absoluteUrl("/favicon-192x192.png"), sizes: "192x192", type: "image/png" },
      { url: absoluteUrl("/favicon-48x48.png"), sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: absoluteUrl("/apple-touch-icon.png"), sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <SiteJsonLd />
        <GoogleAnalytics />
        <SiteCursor />
        <Intro />
        <PageCurtain />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
