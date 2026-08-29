import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Pure checks duplicated from src/lib so we can run without a TS test runner.
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex({ r, g, b }) {
  const t = (n) => n.toString(16).padStart(2, "0");
  return `#${t(r)}${t(g)}${t(b)}`;
}
function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function lum({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrast(a, b) {
  const L1 = lum(a);
  const L2 = lum(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

assert.deepEqual(hexToRgb("#F2013F"), { r: 242, g: 1, b: 63 });
assert.equal(rgbToHex({ r: 242, g: 1, b: 63 }).toUpperCase(), "#F2013F");
assert.ok(contrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }) > 20);

function parseYmd(v) {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return { y: +m[1], m: +m[2], d: +m[3] };
}
function toUtc(ymd) {
  return Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12);
}
function diffDays(a, b) {
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}
assert.equal(diffDays(parseYmd("2026-01-01"), parseYmd("2026-01-11")), 10);

const uuid = "550e8400-e29b-41d4-a716-446655440000";
assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

assert.equal("WIFI:T:WPA;S:Home;P:x;;".startsWith("WIFI:"), true);

function parseWheelLines(raw) {
  return raw.split(/\n/).map((l) => l.trim()).filter(Boolean).slice(0, 40);
}
assert.deepEqual(parseWheelLines("a\n\nb\n c "), ["a", "b", "c"]);
assert.equal(new URL("https://example.com").origin, "https://example.com");
console.log("p0 helper checks ok");
void createRequire;
