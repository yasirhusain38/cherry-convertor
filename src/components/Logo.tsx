import Link from "next/link";

export function CherryMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#F2013F" />
      <path
        d="M21.2 8.4c-1.1-1.4-2.8-2.2-4.7-2.2C12.1 6.2 9 9.4 9 13.6c0 4.3 3.1 7.6 7.5 7.6 1.9 0 3.6-.8 4.8-2.2"
        stroke="#F5F5F1"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="22.4" cy="9.2" r="2.15" fill="#F5F5F1" />
      <path
        d="M22.5 7.2c.15-1.5 1.55-2.45 2.7-2"
        stroke="#F5F5F1"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 no-underline"
      aria-label="Cherry Convertor home"
    >
      <CherryMark className="h-8 w-8 shrink-0" />
      {compact ? null : (
        <span
          className={`text-[15px] font-medium tracking-[-0.03em] ${
            inverted ? "text-[#F5F5F1]" : "text-ink"
          }`}
        >
          Cherry Convertor
        </span>
      )}
    </Link>
  );
}
