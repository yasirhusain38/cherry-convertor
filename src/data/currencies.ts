export type Currency = {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  popular?: boolean;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", popular: true },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", popular: true },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", popular: true },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", popular: true },
  { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪", popular: true },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", popular: true },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", popular: true },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", popular: true },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", popular: true },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", popular: true },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦", popular: true },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭", popular: true },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", flag: "🇹🇼" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", flag: "🇱🇰" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", flag: "🇳🇵" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QAR", flag: "🇶🇦" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD", flag: "🇰🇼" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD", flag: "🇧🇭" },
  { code: "OMR", name: "Omani Rial", symbol: "OMR", flag: "🇴🇲" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", flag: "🇲🇦" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨", flag: "🇲🇺" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", flag: "🇲🇽" },
  { code: "ARS", name: "Argentine Peso", symbol: "AR$", flag: "🇦🇷" },
  { code: "CLP", name: "Chilean Peso", symbol: "CLP", flag: "🇨🇱" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$", flag: "🇨🇴" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", flag: "🇵🇪" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "FJD", name: "Fiji Dollar", symbol: "FJ$", flag: "🇫🇯" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", flag: "🇷🇴" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", flag: "🇧🇬" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸", flag: "🇰🇿" },
  { code: "UZS", name: "Uzbekistani Som", symbol: "soʻm", flag: "🇺🇿" },
  { code: "ISK", name: "Icelandic Krona", symbol: "kr", flag: "🇮🇸" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", flag: "🇭🇷" },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин", flag: "🇷🇸" },
  { code: "BAM", name: "Bosnia-Herzegovina Mark", symbol: "KM", flag: "🇧🇦" },
  { code: "ALL", name: "Albanian Lek", symbol: "L", flag: "🇦🇱" },
  { code: "MKD", name: "Macedonian Denar", symbol: "ден", flag: "🇲🇰" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾", flag: "🇬🇪" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏", flag: "🇦🇲" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼", flag: "🇦🇿" },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br", flag: "🇧🇾" },
  { code: "MDL", name: "Moldovan Leu", symbol: "L", flag: "🇲🇩" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JD", flag: "🇯🇴" },
  { code: "LBP", name: "Lebanese Pound", symbol: "L£", flag: "🇱🇧" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", flag: "🇮🇶" },
  { code: "IRR", name: "Iranian Rial", symbol: "﷼", flag: "🇮🇷" },
  { code: "AFN", name: "Afghan Afghani", symbol: "؋", flag: "🇦🇫" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K", flag: "🇲🇲" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛", flag: "🇰🇭" },
  { code: "LAK", name: "Lao Kip", symbol: "₭", flag: "🇱🇦" },
  { code: "BND", name: "Brunei Dollar", symbol: "B$", flag: "🇧🇳" },
  { code: "MOP", name: "Macanese Pataca", symbol: "MOP", flag: "🇲🇴" },
  { code: "DZD", name: "Algerian Dinar", symbol: "DA", flag: "🇩🇿" },
  { code: "TND", name: "Tunisian Dinar", symbol: "DT", flag: "🇹🇳" },
  { code: "LYD", name: "Libyan Dinar", symbol: "LD", flag: "🇱🇾" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", flag: "🇪🇹" },
  { code: "XOF", name: "West African CFA", symbol: "CFA", flag: "🇸🇳" },
  { code: "XAF", name: "Central African CFA", symbol: "FCFA", flag: "🇨🇲" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", flag: "🇦🇴" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", flag: "🇿🇲" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", flag: "🇧🇼" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$", flag: "🇳🇦" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT", flag: "🇲🇿" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", flag: "🇷🇼" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡", flag: "🇨🇷" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$", flag: "🇩🇴" },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q", flag: "🇬🇹" },
  { code: "HNL", name: "Honduran Lempira", symbol: "L", flag: "🇭🇳" },
  { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$", flag: "🇳🇮" },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/.", flag: "🇵🇦" },
  { code: "PYG", name: "Paraguayan Guarani", symbol: "₲", flag: "🇵🇾" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U", flag: "🇺🇾" },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs", flag: "🇧🇴" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$", flag: "🇯🇲" },
  { code: "TTD", name: "Trinidad Dollar", symbol: "TT$", flag: "🇹🇹" },
  { code: "BSD", name: "Bahamian Dollar", symbol: "B$", flag: "🇧🇸" },
];

export const CURRENCY_MAP = new Map(CURRENCIES.map((item) => [item.code, item]));

export const POPULAR_PAIRS: Array<[string, string]> = [
  ["EUR", "USD"],
  ["GBP", "USD"],
  ["INR", "USD"],
  ["AED", "USD"],
  ["JPY", "USD"],
  ["AUD", "USD"],
  ["CAD", "USD"],
  ["SAR", "USD"],
  ["USD", "INR"],
  ["USD", "EUR"],
  ["USD", "GBP"],
  ["USD", "AED"],
];

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "IDR", "CLP", "HUF", "ISK", "UGX", "PYG", "KHR", "LAK", "MMK"]);
const THREE_DECIMAL = new Set(["BHD", "KWD", "OMR", "JOD", "TND", "LYD", "IQD"]);

export function currencyDigits(code: string, amount = 0): number {
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  if (amount !== 0 && Math.abs(amount) < 0.01) return 6;
  if (amount !== 0 && Math.abs(amount) < 1) return 4;
  return 2;
}

export function formatMoney(amount: number, code: string): string {
  const digits = currencyDigits(code, amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: digits,
      minimumFractionDigits: Math.min(2, digits),
    }).format(amount);
  } catch {
    const symbol = CURRENCY_MAP.get(code)?.symbol ?? code;
    return `${symbol} ${amount.toLocaleString("en", { maximumFractionDigits: digits })}`;
  }
}

/** ISO country → currency. Used for location detect. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  IN: "INR",
  AE: "AED",
  AU: "AUD",
  CA: "CAD",
  SG: "SGD",
  JP: "JPY",
  CN: "CNY",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  IE: "EUR",
  AT: "EUR",
  BE: "EUR",
  PT: "EUR",
  FI: "EUR",
  GR: "EUR",
  SA: "SAR",
  PK: "PKR",
  BD: "BDT",
  NZ: "NZD",
  ZA: "ZAR",
  BR: "BRL",
  MX: "MXN",
  KR: "KRW",
  MY: "MYR",
  ID: "IDR",
  PH: "PHP",
  TH: "THB",
  HK: "HKD",
  TW: "TWD",
  VN: "VND",
  QA: "QAR",
  KW: "KWD",
  BH: "BHD",
  OM: "OMR",
  IL: "ILS",
  TR: "TRY",
  EG: "EGP",
  NG: "NGN",
  KE: "KES",
  GH: "GHS",
  MA: "MAD",
  LK: "LKR",
  NP: "NPR",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  UA: "UAH",
  RU: "RUB",
  KZ: "KZT",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
};

const TZ_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Seoul": "KR",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Asia/Manila": "PH",
  "Asia/Kuala_Lumpur": "MY",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Sao_Paulo": "BR",
  "America/Mexico_City": "MX",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Australia/Sydney": "AU",
  "Pacific/Auckland": "NZ",
  "Africa/Johannesburg": "ZA",
};

export function currencyFromCountryCode(country: string): string | undefined {
  return COUNTRY_CURRENCY[country.toUpperCase()];
}

export function countryNameFromCode(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function detectLocaleLocation(): { country: string; currency: string } | null {
  if (typeof navigator === "undefined") return null;
  const locale = navigator.language || "";
  const region = locale.split("-")[1]?.toUpperCase();
  if (region && COUNTRY_CURRENCY[region]) {
    return { country: region, currency: COUNTRY_CURRENCY[region] };
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromTz = tz ? TZ_COUNTRY[tz] : undefined;
    if (fromTz && COUNTRY_CURRENCY[fromTz]) {
      return { country: fromTz, currency: COUNTRY_CURRENCY[fromTz] };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Converter defaults: output is always USD; input is local currency when known. */
export function localeCurrency(): { from: string; to: string } {
  const detected = detectLocaleLocation();
  const local = detected?.currency;
  if (!local || local === "USD") return { from: "EUR", to: "USD" };
  return { from: local, to: "USD" };
}
