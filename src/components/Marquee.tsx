const ITEMS = [
  "Compress",
  "Passport",
  "OCR",
  "PDF",
  "QR",
  "HEIC",
  "EMI",
  "GST",
  "Aadhaar",
  "Watermark",
  "50 KB",
  "EXIF",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="marquee-item">
            {item}
            <span className="marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
