"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { resumeLines, themeOf, type AtsResume, type ResumeLine } from "@/lib/ats-resume";

const LETTER_W = 816;
const LETTER_H = 1056;

function LineView({ line }: { line: ResumeLine }) {
  const ghost = "ghost" in line && line.ghost ? " ats-ghost" : "";
  switch (line.kind) {
    case "name":
      return <h1 className={`ats-name${ghost}`}>{line.text}</h1>;
    case "role":
      return <p className={`ats-role${ghost}`}>{line.text}</p>;
    case "contact":
      return <p className={`ats-contact${ghost}`}>{line.text}</p>;
    case "heading":
      return <h2 className="ats-heading">{line.text}</h2>;
    case "body":
      return <p className={`ats-body${ghost}`}>{line.text}</p>;
    case "split":
      return (
        <div className={`ats-split${ghost}`}>
          <span className="ats-job-title">{line.left}</span>
          {line.right ? <span className="ats-job-dates">{line.right}</span> : null}
        </div>
      );
    case "meta":
      return <p className={`ats-meta${ghost}`}>{line.text}</p>;
    case "bullet":
      return <p className={`ats-bullet${ghost}`}>{line.text}</p>;
  }
}

export function ResumeSheet({ resume }: { resume: AtsResume }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(0.48);
  const [height, setHeight] = useState(LETTER_H * 0.48);
  const theme = themeOf(resume);
  const lines = resumeLines(resume, "preview");

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const sheet = sheetRef.current;
    if (!wrap || !sheet) return;
    const fit = () => {
      const s = Math.max(0.22, Math.min(1, wrap.clientWidth / LETTER_W));
      setScale(s);
      setHeight(Math.max(LETTER_H, sheet.scrollHeight) * s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [resume, theme.id]);

  return (
    <div className="ats-stage">
      <p className="ats-stage-caption">
        US Letter · 8.5 × 11 in · {theme.wordFont} · matches PDF and Word
      </p>
      <div ref={wrapRef} className="ats-stage-frame">
        <div className="ats-stage-inner" style={{ height }}>
          <article
            ref={sheetRef}
            className={`ats-sheet ats-sheet--${theme.id}`}
            style={{ transform: `scale(${scale})`, fontFamily: theme.cssFont }}
            aria-label={`${theme.name} resume, US Letter preview`}
          >
            {lines.map((line, i) => (
              <LineView key={`${line.kind}-${i}`} line={line} />
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
