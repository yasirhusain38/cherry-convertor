export type YMD = { y: number; m: number; d: number };

export function parseYmd(value: string): YMD {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error("Use YYYY-MM-DD.");
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function toUtcNoon(ymd: YMD): Date {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12, 0, 0));
}

export function formatYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addYmd(ymd: YMD, years: number, months: number, days: number): YMD {
  const dt = toUtcNoon(ymd);
  dt.setUTCFullYear(dt.getUTCFullYear() + years);
  dt.setUTCMonth(dt.getUTCMonth() + months);
  dt.setUTCDate(dt.getUTCDate() + days);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function diffDays(a: YMD, b: YMD): number {
  const ms = toUtcNoon(b).getTime() - toUtcNoon(a).getTime();
  return Math.round(ms / 86400000);
}

export function ageOn(dob: YMD, on: YMD): { years: number; months: number; days: number } {
  let years = on.y - dob.y;
  let months = on.m - dob.m;
  let days = on.d - dob.d;
  if (days < 0) {
    const prev = new Date(Date.UTC(on.y, on.m - 1, 0)).getUTCDate();
    days += prev;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

export function nextBirthday(dob: YMD, today: YMD): YMD {
  let next = { y: today.y, m: dob.m, d: dob.d };
  if (diffDays(today, next) < 0) next = { ...next, y: today.y + 1 };
  return next;
}

export function isoWeek(ymd: YMD): { year: number; week: number } {
  const d = toUtcNoon(ymd);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function unixToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

export function isoToUnix(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new Error("Not a valid date.");
  return Math.floor(t / 1000);
}

export type HolidayPack = "none" | "us" | "uk" | "uae" | "in";

/** Recurring + a few dated holidays. Not an official gazette. */
export function isHoliday(ymd: YMD, pack: HolidayPack): boolean {
  if (pack === "none") return false;
  const key = `${ymd.m}-${ymd.d}`;
  if (pack === "us") {
    if (["1-1", "6-19", "7-4", "11-11", "12-25"].includes(key)) return true;
    if (ymd.m === 1 && nthWeekday(ymd.y, 1, 1, 3)) return same(ymd, nthWeekday(ymd.y, 1, 1, 3)!);
    if (ymd.m === 11 && nthWeekday(ymd.y, 11, 4, 4)) return same(ymd, nthWeekday(ymd.y, 11, 4, 4)!);
  }
  if (pack === "uk") {
    if (["1-1", "12-25", "12-26"].includes(key)) return true;
  }
  if (pack === "uae") {
    if (["1-1", "12-2", "12-3"].includes(key)) return true;
  }
  if (pack === "in") {
    if (["1-26", "8-15", "10-2"].includes(key)) return true;
  }
  return false;
}

function same(a: YMD, b: YMD) {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

function nthWeekday(year: number, month: number, weekday: number, n: number): YMD | null {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCMonth() !== month - 1) return null;
  return { y: year, m: month, d: dt.getUTCDate() };
}

export function isWeekend(ymd: YMD): boolean {
  const day = toUtcNoon(ymd).getUTCDay();
  return day === 0 || day === 6;
}

export function businessDaysBetween(a: YMD, b: YMD, pack: HolidayPack): number {
  const start = diffDays(a, b) >= 0 ? a : b;
  const end = diffDays(a, b) >= 0 ? b : a;
  let n = 0;
  let cur = start;
  while (diffDays(cur, end) > 0) {
    cur = addYmd(cur, 0, 0, 1);
    if (!isWeekend(cur) && !isHoliday(cur, pack)) n += 1;
  }
  return diffDays(a, b) >= 0 ? n : -n;
}

export type CityZone = { id: string; city: string; country: string; tz: string };

export const WORLD_CITIES: CityZone[] = [
  { id: "nyc", city: "New York", country: "United States", tz: "America/New_York" },
  { id: "chi", city: "Chicago", country: "United States", tz: "America/Chicago" },
  { id: "den", city: "Denver", country: "United States", tz: "America/Denver" },
  { id: "la", city: "Los Angeles", country: "United States", tz: "America/Los_Angeles" },
  { id: "tor", city: "Toronto", country: "Canada", tz: "America/Toronto" },
  { id: "van", city: "Vancouver", country: "Canada", tz: "America/Vancouver" },
  { id: "lon", city: "London", country: "United Kingdom", tz: "Europe/London" },
  { id: "dub", city: "Dublin", country: "Ireland", tz: "Europe/Dublin" },
  { id: "par", city: "Paris", country: "France", tz: "Europe/Paris" },
  { id: "ber", city: "Berlin", country: "Germany", tz: "Europe/Berlin" },
  { id: "ams", city: "Amsterdam", country: "Netherlands", tz: "Europe/Amsterdam" },
  { id: "zur", city: "Zurich", country: "Switzerland", tz: "Europe/Zurich" },
  { id: "sto", city: "Stockholm", country: "Sweden", tz: "Europe/Stockholm" },
  { id: "osl", city: "Oslo", country: "Norway", tz: "Europe/Oslo" },
  { id: "cph", city: "Copenhagen", country: "Denmark", tz: "Europe/Copenhagen" },
  { id: "mad", city: "Madrid", country: "Spain", tz: "Europe/Madrid" },
  { id: "rom", city: "Rome", country: "Italy", tz: "Europe/Rome" },
  { id: "waw", city: "Warsaw", country: "Poland", tz: "Europe/Warsaw" },
  { id: "ist", city: "Istanbul", country: "Turkey", tz: "Europe/Istanbul" },
  { id: "tlv", city: "Tel Aviv", country: "Israel", tz: "Asia/Jerusalem" },
  { id: "dxb", city: "Dubai", country: "United Arab Emirates", tz: "Asia/Dubai" },
  { id: "ruh", city: "Riyadh", country: "Saudi Arabia", tz: "Asia/Riyadh" },
  { id: "doh", city: "Doha", country: "Qatar", tz: "Asia/Qatar" },
  { id: "kwi", city: "Kuwait City", country: "Kuwait", tz: "Asia/Kuwait" },
  { id: "del", city: "New Delhi", country: "India", tz: "Asia/Kolkata" },
  { id: "sin", city: "Singapore", country: "Singapore", tz: "Asia/Singapore" },
  { id: "kul", city: "Kuala Lumpur", country: "Malaysia", tz: "Asia/Kuala_Lumpur" },
  { id: "mnl", city: "Manila", country: "Philippines", tz: "Asia/Manila" },
  { id: "jkt", city: "Jakarta", country: "Indonesia", tz: "Asia/Jakarta" },
  { id: "tyo", city: "Tokyo", country: "Japan", tz: "Asia/Tokyo" },
  { id: "sel", city: "Seoul", country: "South Korea", tz: "Asia/Seoul" },
  { id: "syd", city: "Sydney", country: "Australia", tz: "Australia/Sydney" },
  { id: "per", city: "Perth", country: "Australia", tz: "Australia/Perth" },
  { id: "akl", city: "Auckland", country: "New Zealand", tz: "Pacific/Auckland" },
  { id: "sao", city: "São Paulo", country: "Brazil", tz: "America/Sao_Paulo" },
  { id: "mex", city: "Mexico City", country: "Mexico", tz: "America/Mexico_City" },
  { id: "jnb", city: "Johannesburg", country: "South Africa", tz: "Africa/Johannesburg" },
];

export function zonedParts(date: Date, tz: string): { hour: number; minute: number; offset: string; label: string } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "shortOffset",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    offset: get("timeZoneName"),
    label: `${get("weekday")} ${get("day")} ${get("month")} ${get("hour")}:${get("minute")} ${get("timeZoneName")}`,
  };
}

export function convertInstant(isoLocal: string, fromTz: string, toTz: string): { iso: string; label: string } {
  const naive = isoLocal.includes("T") ? isoLocal : `${isoLocal}T12:00`;
  const asUtc = new Date(`${naive}:00Z`);
  const fromParts = zonedParts(asUtc, fromTz);
  const fakeUtcMinutes = asUtc.getUTCHours() * 60 + asUtc.getUTCMinutes();
  const fromMinutes = fromParts.hour * 60 + fromParts.minute;
  const shift = fakeUtcMinutes - fromMinutes;
  const instant = new Date(asUtc.getTime() + shift * 60000);
  const to = zonedParts(instant, toTz);
  return { iso: instant.toISOString(), label: to.label };
}

/** Hours (0–23) where every city is inside [start,end) local. */
export function overlapHours(
  date: Date,
  zones: string[],
  startHour = 9,
  endHour = 18,
): number[] {
  const hours: number[] = [];
  for (let h = 0; h < 24; h += 1) {
    const probe = new Date(date);
    probe.setUTCHours(h, 0, 0, 0);
    const ok = zones.every((tz) => {
      const { hour } = zonedParts(probe, tz);
      return hour >= startHour && hour < endHour;
    });
    if (ok) hours.push(h);
  }
  return hours;
}

export function bestSlotThisWeek(zones: string[]): { day: string; utcHour: number; labels: string[] } | null {
  const now = new Date();
  for (let d = 0; d < 7; d += 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d, 12));
    const hours = overlapHours(day, zones);
    if (hours.length) {
      const utcHour = hours[Math.floor(hours.length / 2)];
      const instant = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), utcHour));
      return {
        day: instant.toISOString().slice(0, 10),
        utcHour,
        labels: zones.map((tz) => zonedParts(instant, tz).label),
      };
    }
  }
  return null;
}
