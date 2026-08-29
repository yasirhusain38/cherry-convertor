export type QrKind =
  | "url"
  | "text"
  | "wifi"
  | "vcard"
  | "email"
  | "sms"
  | "whatsapp"
  | "geo"
  | "event"
  | "crypto";

export type QrFields = Record<string, string>;

function escWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildQrPayload(kind: QrKind, fields: QrFields): string {
  switch (kind) {
    case "url":
    case "text":
    case "crypto":
      return fields.text?.trim() || "";
    case "wifi": {
      const t = fields.security || "WPA";
      const hidden = fields.hidden === "yes" ? "true" : "false";
      return `WIFI:T:${t};S:${escWifi(fields.ssid || "")};P:${escWifi(fields.password || "")};H:${hidden};;`;
    }
    case "vcard":
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${fields.last || ""};${fields.first || ""}`,
        `FN:${[fields.first, fields.last].filter(Boolean).join(" ")}`,
        fields.org ? `ORG:${fields.org}` : "",
        fields.phone ? `TEL:${fields.phone}` : "",
        fields.email ? `EMAIL:${fields.email}` : "",
        fields.url ? `URL:${fields.url}` : "",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    case "email": {
      const q = new URLSearchParams();
      if (fields.subject) q.set("subject", fields.subject);
      if (fields.body) q.set("body", fields.body);
      const qs = q.toString();
      return `mailto:${fields.email || ""}${qs ? `?${qs}` : ""}`;
    }
    case "sms":
      return `SMSTO:${fields.phone || ""}:${fields.body || ""}`;
    case "whatsapp": {
      const phone = (fields.phone || "").replace(/\D/g, "");
      const text = encodeURIComponent(fields.body || "");
      return `https://wa.me/${phone}${text ? `?text=${text}` : ""}`;
    }
    case "geo":
      return `geo:${fields.lat || "0"},${fields.lng || "0"}`;
    case "event":
      return [
        "BEGIN:VEVENT",
        `SUMMARY:${fields.title || "Event"}`,
        fields.start ? `DTSTART:${fields.start.replace(/[-:]/g, "").replace("T", "")}` : "",
        fields.end ? `DTEND:${fields.end.replace(/[-:]/g, "").replace("T", "")}` : "",
        fields.location ? `LOCATION:${fields.location}` : "",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\n");
    default:
      return fields.text || "";
  }
}
