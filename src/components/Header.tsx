"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/tools/compress-image", label: "Compress" },
  { href: "/tools/resize-image", label: "Resize" },
  { href: "/tools/convert", label: "Convert" },
  { href: "/tools/passport-photo-maker", label: "Documents" },
  { href: "/tools", label: "All tools" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const home = pathname === "/";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-40 border-b text-[#F5F5F1] backdrop-blur-md ${
        home
          ? "border-[#B81D24] bg-[#F2013F]/95"
          : "border-[var(--line)] bg-[#221F1F]/92"
      }`}
    >
      {home ? null : <div className="h-1 bg-[#F2013F]" aria-hidden />}
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo inverted />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`label no-underline transition-colors ${
                home
                  ? "label-light hover:opacity-100 opacity-90"
                  : "text-[#F5F5F1]/60 hover:text-[#F2013F]"
              } ${!home && pathname === item.href ? "text-[#F2013F]" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Link
            href="/tools/resize-image-to-50kb"
            className={`btn ${home ? "btn-dark" : "btn-primary"}`}
          >
            Resize to 50KB
          </Link>
        </div>
        <button
          type="button"
          className="btn btn-ghost px-3 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div
          id="mobile-nav"
          className={`border-t lg:hidden ${
            home ? "border-[#B81D24] bg-[#F2013F]" : "border-[var(--line)] bg-[#221F1F]"
          }`}
        >
          <nav className="container-page flex flex-col py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-[#F5F5F1]/20 py-3 text-sm tracking-[0.14em] text-[#F5F5F1] uppercase no-underline"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/tools/resize-image-to-50kb"
              className={`btn mt-4 ${home ? "btn-dark" : "btn-primary"}`}
            >
              Resize to 50KB
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
