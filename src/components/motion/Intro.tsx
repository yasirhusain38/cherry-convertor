"use client";

import { useEffect, useState } from "react";

export function Intro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("cc-intro") === "1") return;
      sessionStorage.setItem("cc-intro", "1");
    } catch {
      return;
    }
    setShow(true);
    const id = window.setTimeout(() => setShow(false), 1600);
    return () => window.clearTimeout(id);
  }, []);

  if (!show) return null;

  return (
    <div className="intro-screen" aria-hidden="true">
      <div className="intro-screen-inner">
        <svg viewBox="0 0 32 32" fill="none" className="h-14 w-14">
          <path
            d="M21.2 8.4c-1.1-1.4-2.8-2.2-4.7-2.2C12.1 6.2 9 9.4 9 13.6c0 4.3 3.1 7.6 7.5 7.6 1.9 0 3.6-.8 4.8-2.2"
            stroke="#F5F5F1"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="22.4" cy="9.2" r="2.15" fill="#F5F5F1" />
          <path d="M22.5 7.2c.15-1.5 1.55-2.45 2.7-2" stroke="#F5F5F1" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <p className="display mt-6 text-5xl text-[#F5F5F1] md:text-7xl">Cherry</p>
      </div>
    </div>
  );
}
