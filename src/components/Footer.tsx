import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#B81D24] bg-[#221F1F]">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--ink-soft)]">
            Free image tools for the open web. Compress, resize, convert, and prepare document photos without a server
            in the loop.
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="label mb-4">Studio</p>
          <ul className="grid gap-2 text-sm text-[var(--ink-soft)]">
            <li>
              <Link href="/tools" className="hover:text-brand">
                All tools
              </Link>
            </li>
            <li>
              <Link href="/finance" className="hover:text-brand">
                Finance
              </Link>
            </li>
            <li>
              <Link href="/countries" className="hover:text-brand">
                Countries
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-brand">
                Search
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="label mb-4">Site</p>
          <ul className="grid gap-2 text-sm text-[var(--ink-soft)]">
            <li>
              <Link href="/about" className="hover:text-brand">
                About
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-brand">
                Journal
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-brand">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-brand">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="label mb-4">Start</p>
          <ul className="grid gap-2 text-sm text-[var(--ink-soft)]">
            <li>
              <Link href="/tools/resize-image-to-50kb" className="hover:text-brand">
                Resize to 50KB
              </Link>
            </li>
            <li>
              <Link href="/tools/passport-photo-maker" className="hover:text-brand">
                Passport photo
              </Link>
            </li>
            <li>
              <Link href="/tools/pdf-merger" className="hover:text-brand">
                Merge PDF
              </Link>
            </li>
            <li>
              <Link href="/tools/qr-code-generator" className="hover:text-brand">
                QR code
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-page flex flex-col gap-3 py-5 text-xs tracking-[0.12em] text-[var(--ink-faint)] uppercase sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cherry Converter — est. on this device</p>
          <p>No uploads. No account. No noise.</p>
        </div>
      </div>
    </footer>
  );
}
