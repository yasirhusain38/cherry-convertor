import { buildFinanceChart } from "./finance-charts";

export type CalcInput = Record<string, number | string>;
export type CalcRow = { label: string; value: string; emphasize?: boolean };
export type ChartSlice = { label: string; value: number };
export type ChartSeries = { name: string; values: number[] };
export type FinanceChartSpec = {
  title: string;
  slices?: ChartSlice[];
  labels?: string[];
  series?: ChartSeries[];
};
export type CalcTable = { title: string; headers: string[]; rows: string[][] };
export type CalcResult = { rows: CalcRow[]; note?: string; chart?: FinanceChartSpec; table?: CalcTable };

function n(input: CalcInput, key: string): number {
  const raw = input[key];
  const value = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function money(value: number, currency: string): string {
  if (/^[A-Z]{3}$/.test(currency)) {
    try {
      const abs = Math.abs(value);
      const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : 4;
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
      }).format(value);
    } catch {
      /* fall through */
    }
  }
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : 4;
  return `${currency}${value.toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: 0 })}`;
}

function pct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function parseDisplayed(value: string | undefined): number {
  return Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;
}

export function emiMonthly(principal: number, annualRate: number, years: number): number {
  const months = Math.max(1, years * 12);
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

function futureSip(monthly: number, annualRate: number, years: number): number {
  const months = Math.max(1, years * 12);
  const i = annualRate / 12 / 100;
  if (i === 0) return monthly * months;
  return monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
}

function slabTax(income: number, slabs: Array<[limit: number, rate: number]>): number {
  let tax = 0;
  let prev = 0;
  for (const [limit, rate] of slabs) {
    const slice = Math.min(income, limit) - prev;
    if (slice > 0) tax += slice * (rate / 100);
    prev = limit;
    if (income <= limit) break;
  }
  return tax;
}

type SlabPack = {
  slabs: Array<[number, number]>;
  deduction?: number;
  rebate?: number;
  extraRate?: number;
  extraOn?: "tax" | "income" | "taxable";
  extraLabel?: string;
  socialRate?: number;
  socialLabel?: string;
  note: string;
};

const TAX_PACKS: Record<string, SlabPack> = {
  "canada-federal-2025": {
    deduction: 16129,
    slabs: [
      [57375, 15],
      [114750, 20.5],
      [177882, 26],
      [253414, 29],
      [Infinity, 33],
    ],
    note: "2025 federal brackets after a basic personal amount of C$16,129. Provincial tax is not included.",
  },
  "australia-2025": {
    slabs: [
      [18200, 0],
      [45000, 16],
      [135000, 30],
      [190000, 37],
      [Infinity, 45],
    ],
    extraRate: 2,
    extraOn: "taxable",
    extraLabel: "Medicare levy 2%",
    note: "2024–25 resident rates plus a flat 2% Medicare levy. Offsets and HELP not modelled.",
  },
  "singapore-ya2025": {
    slabs: [
      [20000, 0],
      [30000, 2],
      [40000, 3.5],
      [80000, 7],
      [120000, 11.5],
      [160000, 15],
      [200000, 18],
      [240000, 19],
      [280000, 19.5],
      [320000, 20],
      [500000, 22],
      [1000000, 23],
      [Infinity, 24],
    ],
    note: "YA 2025 resident rates. CPF relief and other personal reliefs are the deduction field.",
  },
  "sg-bsd": {
    slabs: [
      [180000, 1],
      [360000, 2],
      [1000000, 3],
      [1500000, 4],
      [3000000, 5],
      [Infinity, 6],
    ],
    note: "Singapore buyer’s stamp duty on residential property (citizen / PR standard). ABSD is extra.",
  },
  "germany-2025": {
    deduction: 12096,
    slabs: [
      [5334, 14],
      [56334, 24],
      [265730, 42],
      [Infinity, 45],
    ],
    extraRate: 5.5,
    extraOn: "tax",
    extraLabel: "Solidarity surcharge (simplified)",
    note: "Rough 2025 Einkommensteuer with Grundfreibetrag €12,096. The real curve is a formula, not flat 14–24%. Kirchensteuer not included.",
  },
  "france-2025": {
    slabs: [
      [11497, 0],
      [29315, 11],
      [83823, 30],
      [180294, 41],
      [Infinity, 45],
    ],
    note: "2025 barème for a single part (quotient familial = 1). Décote and social charges not modelled.",
  },
  "spain-irpf": {
    slabs: [
      [12450, 19],
      [20200, 24],
      [35200, 30],
      [60000, 37],
      [300000, 45],
      [Infinity, 47],
    ],
    note: "Combined state + general IRPF-style bands. Autonomous-community rates differ.",
  },
  "italy-irpef": {
    slabs: [
      [28000, 23],
      [50000, 35],
      [Infinity, 43],
    ],
    extraRate: 2,
    extraOn: "tax",
    extraLabel: "Addizionali sketch (~2% of IRPEF)",
    note: "2025 IRPEF three brackets plus a 2% addizionali sketch. Regional / municipal rates differ — confirm on the Agenzia delle Entrate.",
  },
  "netherlands-box1": {
    slabs: [
      [38441, 35.82],
      [76817, 37.48],
      [Infinity, 49.5],
    ],
    note: "2025 Box 1 including national-insurance share in the first two brackets. Box 3 not modelled.",
  },
  "japan-income": {
    deduction: 480000,
    slabs: [
      [1950000, 5],
      [3300000, 10],
      [6950000, 20],
      [9000000, 23],
      [18000000, 33],
      [40000000, 40],
      [Infinity, 45],
    ],
    extraRate: 10,
    extraOn: "taxable",
    extraLabel: "Residence tax ~10%",
    note: "National income tax after a simplified ¥480,000 basic deduction, plus ~10% residence tax. Reconstruction surtax not modelled.",
  },
  "nz-2025": {
    slabs: [
      [15600, 10.5],
      [53500, 17.5],
      [78100, 30],
      [180000, 33],
      [Infinity, 39],
    ],
    extraRate: 1.6,
    extraOn: "income",
    extraLabel: "ACC levy (approx.)",
    note: "2025–26 PAYE bands plus a simplified ACC levy. Independent earner tax credit not modelled.",
  },
  "za-transfer-duty": {
    slabs: [
      [1_100_000, 0],
      [1_512_500, 3],
      [2_117_500, 6],
      [7_262_500, 8],
      [13_262_500, 11],
      [Infinity, 13],
    ],
    note: "SARS transfer-duty bands (from 1 Mar 2020, still the published table). 0% to R1.1m, then 3 / 6 / 8 / 11 / 13% on slices. Not advice — confirm on SARS before you pay.",
  },
  "sa-2026": {
    slabs: [
      [237100, 18],
      [370500, 26],
      [512800, 31],
      [673000, 36],
      [857900, 39],
      [1817000, 41],
      [Infinity, 45],
    ],
    rebate: 17235,
    note: "2025/26 SARS individual rates with primary rebate R17,235. Medical tax credits not modelled.",
  },
  "malaysia-2025": {
    slabs: [
      [5000, 0],
      [20000, 1],
      [35000, 3],
      [50000, 6],
      [70000, 11],
      [100000, 19],
      [400000, 25],
      [600000, 26],
      [2000000, 28],
      [Infinity, 30],
    ],
    note: "YA 2025 resident rates. Reliefs (EPF, lifestyle) go in the deduction field.",
  },
  "hk-salaries": {
    slabs: [
      [50000, 2],
      [100000, 6],
      [150000, 10],
      [200000, 14],
      [Infinity, 17],
    ],
    deduction: 132000,
    note: "Progressive salaries tax after a basic allowance of HK$132,000. Standard-rate alternative not auto-selected.",
  },
  "korea-2025": {
    slabs: [
      [14000000, 6],
      [50000000, 15],
      [88000000, 24],
      [150000000, 35],
      [300000000, 38],
      [500000000, 40],
      [1000000000, 42],
      [Infinity, 45],
    ],
    extraRate: 10,
    extraOn: "tax",
    extraLabel: "Local income tax 10%",
    note: "2025 종합소득세-style bands plus 10% local income tax. Personal deductions go in the deduction field.",
  },
  "china-iit": {
    deduction: 60000,
    slabs: [
      [36000, 3],
      [144000, 10],
      [300000, 20],
      [420000, 25],
      [660000, 30],
      [960000, 35],
      [Infinity, 45],
    ],
    note: "Annualised IIT comprehensive-income bands after the ¥60,000 basic deduction. Special additional deductions are the extra field.",
  },
  "ph-train": {
    slabs: [
      [250000, 0],
      [400000, 15],
      [800000, 20],
      [2000000, 25],
      [8000000, 30],
      [Infinity, 35],
    ],
    note: "TRAIN/CREATE resident compensation bands. SSS, PhilHealth, and Pag-IBIG are separate.",
  },
  "indonesia-pph": {
    slabs: [
      [60000000, 5],
      [250000000, 15],
      [500000000, 25],
      [5000000000, 30],
      [Infinity, 35],
    ],
    note: "UU HPP PPh 21 annual bands. Occupations with different ter rates are not modelled.",
  },
  "pakistan-2025": {
    slabs: [
      [600000, 0],
      [1200000, 5],
      [2200000, 15],
      [3200000, 25],
      [4100000, 30],
      [Infinity, 35],
    ],
    note: "Salaried-person sketch used in recent finance bills. Confirm the current FBR table.",
  },
  "bangladesh-2025": {
    slabs: [
      [350000, 0],
      [450000, 5],
      [850000, 10],
      [1350000, 15],
      [1850000, 20],
      [3850000, 25],
      [Infinity, 30],
    ],
    note: "General taxpayer 2024–25 style bands (first slab ৳3.5 lakh). Women / senior slabs differ.",
  },
  "mexico-isr": {
    slabs: [
      [8952, 1.92],
      [75985, 6.4],
      [133536, 10.88],
      [155230, 16],
      [185853, 21.36],
      [374838, 23.52],
      [590796, 30],
      [1127927, 32],
      [1503902, 34],
      [4511707, 36],
      [Infinity, 37],
    ],
    note: "Annual ISR-style federal bands. State payroll tax and subsidies not included.",
  },
  "brazil-irpf": {
    slabs: [
      [28560, 0],
      [33920, 7.5],
      [45013, 15],
      [55976, 22.5],
      [Infinity, 27.5],
    ],
    note: "Simplified annualised IRPF bands. INSS and the simplified 20% desconto are not auto-applied.",
  },
  "nigeria-2025": {
    slabs: [
      [800000, 0],
      [3000000, 15],
      [12000000, 18],
      [25000000, 21],
      [50000000, 23],
      [Infinity, 25],
    ],
    note: "2025 tax-act style PAYE sketch (first ₦800,000 exempt). Confirm your state board table.",
  },
  "kenya-2025": {
    slabs: [
      [288000, 10],
      [388000, 25],
      [6000000, 30],
      [Infinity, 35],
    ],
    rebate: 28800,
    note: "Monthly PAYE annualised with personal relief KES 28,800. SHIF, NSSF, and housing levy are separate.",
  },
  "turkey-gelir": {
    slabs: [
      [158000, 15],
      [330000, 20],
      [800000, 27],
      [4300000, 35],
      [Infinity, 40],
    ],
    note: "2025 gelir vergisi wage bands. Stamp on salary and social security not included.",
  },
  "israel-2025": {
    slabs: [
      [84120, 10],
      [120720, 14],
      [193800, 20],
      [269280, 31],
      [560280, 35],
      [721560, 47],
      [Infinity, 50],
    ],
    note: "2025 mas hachnasa bands. Credit points (nekudot zikui) go in the deduction field as shekels.",
  },
  "egypt-2025": {
    slabs: [
      [40000, 0],
      [55000, 10],
      [70000, 15],
      [200000, 20],
      [400000, 22.5],
      [1200000, 25],
      [Infinity, 27.5],
    ],
    note: "Recent personal-income bands. Annual exemption and Takaful/Karama interactions not modelled.",
  },
  "ireland-income": {
    slabs: [
      [44000, 20],
      [Infinity, 40],
    ],
    rebate: 4000,
    note: "Single 20%/40% with a €4,000 tax-credit sketch. USC and PRSI live on the take-home tool.",
  },
  "poland-pit": {
    deduction: 30000,
    slabs: [
      [120000, 12],
      [Infinity, 32],
    ],
    note: "2025 PIT 12%/32% after a PLN 30,000 tax-free amount. Health-insurance interaction not modelled.",
  },
  "portugal-irs": {
    slabs: [
      [8059, 13],
      [12160, 16.5],
      [17233, 22],
      [22306, 25],
      [28400, 32],
      [41459, 35.5],
      [44987, 43.5],
      [83696, 45],
      [Infinity, 48],
    ],
    note: "Mainland IRS-style bands. Quotient and deductions belong in the extra-deduction field.",
  },
  "belgium-2025": {
    slabs: [
      [15200, 25],
      [26830, 40],
      [46440, 45],
      [Infinity, 50],
    ],
    note: "Federal brackets only. Communal tax (typically ~7%) is not added.",
  },
  "austria-2025": {
    slabs: [
      [13308, 0],
      [21617, 20],
      [35836, 30],
      [69166, 40],
      [103072, 48],
      [1000000, 50],
      [Infinity, 55],
    ],
    note: "2025 Einkommensteuer bands. Social security is separate.",
  },
  "sweden-2025": {
    deduction: 0,
    slabs: [
      [625800, 32],
      [Infinity, 52],
    ],
    note: "Sketch: municipal ~32% then national 20% above the skiktgräns (~625,800). Kommuner differ.",
  },
  "norway-2025": {
    slabs: [
      [208050, 0],
      [297900, 1.7],
      [306050, 4],
      [697150, 13.6],
      [942400, 16.6],
      [Infinity, 17.6],
    ],
    extraRate: 22,
    extraOn: "taxable",
    extraLabel: "General income 22%",
    note: "Bracket tax (trinnskatt) plus 22% on ordinary income. Personal allowance is the deduction field.",
  },
  "denmark-2025": {
    slabs: [
      [588900, 38],
      [Infinity, 52],
    ],
    note: "Very simplified: municipal ~25% + bottom tax, then top tax. AM-bidrag 8% is not auto-deducted.",
  },
  "finland-2025": {
    slabs: [
      [19900, 0],
      [29700, 6],
      [44900, 17.25],
      [78500, 21.25],
      [Infinity, 31.25],
    ],
    extraRate: 7.5,
    extraOn: "income",
    extraLabel: "Municipal tax (edit via extra; default ~7.5% sketch on gross)",
    note: "State tax bands plus a flat municipal sketch. Church tax and Yle tax not included.",
  },
  "greece-2025": {
    slabs: [
      [10000, 9],
      [20000, 22],
      [30000, 28],
      [40000, 36],
      [Infinity, 44],
    ],
    note: "Employment-income ENFIA is separate. Solidarity contributions may still apply at high incomes.",
  },
  "czechia-2025": {
    slabs: [
      [1677288, 15],
      [Infinity, 23],
    ],
    note: "15% then 23% above ~36× average wage. Social and health (employee ~11% + 4.5%) are separate.",
  },
  "hungary-2025": {
    slabs: [[Infinity, 15]],
    note: "Flat 15% SZJA. Employee social contributions live on the take-home tool.",
  },
  "romania-2025": {
    slabs: [[Infinity, 10]],
    note: "Flat 10% income tax. CAS / CASS belong on the take-home tool.",
  },
  "switzerland-fed": {
    slabs: [
      [18200, 0],
      [32800, 0.77],
      [42900, 0.88],
      [57200, 2.64],
      [75200, 2.97],
      [81000, 5.94],
      [107400, 6.6],
      [139700, 8.8],
      [182700, 11],
      [783200, 13.2],
      [Infinity, 11.5],
    ],
    note: "Direct federal tax only (single). Cantonal / communal tax is usually larger — use the take-home tool for a combined %.",
  },
  "thailand-pit": {
    slabs: [
      [150000, 0],
      [300000, 5],
      [500000, 10],
      [750000, 15],
      [1000000, 20],
      [2000000, 25],
      [5000000, 30],
      [Infinity, 35],
    ],
    note: "Thai PIT bands. Expense deduction (50% capped) belongs in the deduction field.",
  },
  "vietnam-pit": {
    slabs: [
      [60000000, 5],
      [120000000, 10],
      [216000000, 15],
      [384000000, 20],
      [624000000, 25],
      [960000000, 30],
      [Infinity, 35],
    ],
    note: "Resident PIT on employment, annualised from monthly bands.",
  },
  "taiwan-2025": {
    slabs: [
      [590000, 5],
      [1330000, 12],
      [2660000, 20],
      [4980000, 30],
      [Infinity, 40],
    ],
    note: "2025 comprehensive-income brackets. Basic exemption is the deduction field.",
  },
  "sri-lanka-2025": {
    slabs: [
      [1200000, 6],
      [1700000, 12],
      [2200000, 18],
      [2700000, 24],
      [3200000, 30],
      [Infinity, 36],
    ],
    note: "Recent PAYE-style personal bands. Reliefs go in the deduction field.",
  },
  "nepal-2025": {
    slabs: [
      [500000, 1],
      [700000, 10],
      [1000000, 20],
      [2000000, 30],
      [5000000, 36],
      [Infinity, 39],
    ],
    note: "Individual (unmarried) sketch. Couple bands and social security tax 1% may differ.",
  },
  "ghana-2025": {
    slabs: [
      [5880, 0],
      [7308, 5],
      [8784, 10],
      [176352, 17.5],
      [238320, 25],
      [Infinity, 30],
    ],
    note: "GRA PAYE annualised sketch. Confirm the current monthly table; SSNIT is separate.",
  },
  "morocco-2025": {
    slabs: [
      [40000, 0],
      [60000, 10],
      [80000, 20],
      [100000, 30],
      [180000, 34],
      [Infinity, 37],
    ],
    note: "IR bands commonly published for wages. CNSS is separate.",
  },
  "colombia-2025": {
    slabs: [
      [1300 * 47000, 0],
      [2200 * 47000, 19],
      [4100 * 47000, 28],
      [8100 * 47000, 33],
      [18000 * 47000, 35],
      [31000 * 47000, 37],
      [Infinity, 39],
    ],
    note: "UVT-based sketch (UVT assumed ~47,000). Confirm DIAN’s current UVT.",
  },
  "chile-2025": {
    slabs: [
      [11150000, 0],
      [24800000, 4],
      [41400000, 8],
      [58000000, 13.5],
      [74600000, 23],
      [99500000, 30],
      [248700000, 35],
      [Infinity, 40],
    ],
    note: "Global complementary / second-category sketch in CLP. Confirm SII UTM table.",
  },
  "argentina-2025": {
    slabs: [
      [1500000, 5],
      [3000000, 9],
      [4500000, 12],
      [6500000, 15],
      [9000000, 19],
      [13000000, 23],
      [19000000, 27],
      [28000000, 31],
      [Infinity, 35],
    ],
    note: "Ganancias-style progressive sketch. Bands move with inflation — treat as an order-of-magnitude estimate.",
  },
  "peru-2025": {
    slabs: [
      [7 * 5150, 8],
      [12 * 5150, 14],
      [27 * 5150, 17],
      [54 * 5150, 20],
      [Infinity, 30],
    ],
    deduction: 7 * 5150,
    note: "5th-category bands in UIT (UIT assumed S/5,150) after 7 UIT non-taxable.",
  },
};

function computeFinance(engine: string, input: CalcInput): CalcResult {
  const c = String(input.currency ?? "₹");

  if (engine === "emi" || engine === "loan") {
    const p = n(input, "principal");
    const rate = n(input, "rate");
    const months = Math.max(1, Math.round(n(input, "years") * 12 + n(input, "months")));
    const extra = n(input, "extra");
    const r = rate / 12 / 100;
    const emi = r === 0 ? p / months : (p * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const pay = emi + extra;
    let bal = p;
    let interestTotal = 0;
    const yearly: string[][] = [];
    let yInt = 0;
    let yPrin = 0;
    let m = 0;
    const cap = extra > 0 ? months * 3 : months;
    while (bal > 0.01 && m < cap) {
      m += 1;
      const interest = r === 0 ? 0 : bal * r;
      let prin = pay - interest;
      if (prin > bal) prin = bal;
      if (prin < 0) prin = 0;
      bal = Math.max(0, bal - prin);
      interestTotal += interest;
      yInt += interest;
      yPrin += prin;
      if (m % 12 === 0 || bal <= 0.01) {
        yearly.push([
          String(yearly.length + 1),
          money(yPrin, c),
          money(yInt, c),
          money(bal, c),
        ]);
        yInt = 0;
        yPrin = 0;
      }
    }
    return {
      rows: [
        { label: "Monthly EMI", value: money(emi, c), emphasize: true },
        { label: "Total payment", value: money(p + interestTotal, c) },
        { label: "Total interest", value: money(interestTotal, c) },
        { label: "Tenure used", value: `${m} months` },
      ],
      table: yearly.length
        ? { title: "Yearly amortization", headers: ["Year", "Principal paid", "Interest", "Balance"], rows: yearly }
        : undefined,
    };
  }

  if (engine === "sip") {
    const monthly = n(input, "monthly");
    const rate = n(input, "rate");
    const years = n(input, "years");
    const invested = monthly * years * 12;
    const corpus = futureSip(monthly, rate, years);
    return {
      rows: [
        { label: "Invested", value: money(invested, c) },
        { label: "Estimated corpus", value: money(corpus, c), emphasize: true },
        { label: "Estimated gain", value: money(corpus - invested, c) },
      ],
      note: "Assumes a constant rate of return, compounded monthly. Not a guarantee.",
    };
  }

  if (engine === "compound") {
    const p = n(input, "principal");
    const rate = n(input, "rate");
    const years = Math.max(0, n(input, "years"));
    const freq = n(input, "frequency") || 12;
    const contrib = n(input, "contribution");
    const i = rate / 100 / Math.max(1, freq);
    const periods = freq * years;
    const fvPrincipal = p * Math.pow(1 + i, periods);
    const pmt = contrib * (12 / Math.max(1, freq));
    const fvContrib = i === 0 ? pmt * periods : pmt * ((Math.pow(1 + i, periods) - 1) / i);
    const fv = fvPrincipal + fvContrib;
    const deposited = p + contrib * 12 * years;
    const tableRows: string[][] = [];
    for (let y = 1; y <= Math.min(40, Math.ceil(years)); y++) {
      const nper = freq * y;
      const value = p * Math.pow(1 + i, nper) + (i === 0 ? pmt * nper : pmt * ((Math.pow(1 + i, nper) - 1) / i));
      tableRows.push([String(y), money(p + contrib * 12 * y, c), money(value, c)]);
    }
    return {
      rows: [
        { label: "Future value", value: money(fv, c), emphasize: true },
        { label: "Total deposited", value: money(deposited, c) },
        { label: "Interest earned", value: money(fv - deposited, c) },
      ],
      table: tableRows.length ? { title: "Year by year", headers: ["Year", "Deposited", "Balance"], rows: tableRows } : undefined,
    };
  }

  if (engine === "fd") {
    const p = n(input, "principal");
    const rate = n(input, "rate");
    const years = n(input, "years");
    const freq = n(input, "frequency") || 4;
    const fv = p * Math.pow(1 + rate / 100 / freq, freq * years);
    return {
      rows: [
        { label: "Maturity amount", value: money(fv, c), emphasize: true },
        { label: "Interest", value: money(fv - p, c) },
      ],
    };
  }

  if (engine === "rd") {
    const monthly = n(input, "monthly");
    const rate = n(input, "rate");
    const years = n(input, "years");
    const months = years * 12;
    const i = rate / 4 / 100;
    const nq = years * 4;
    const fv = monthly * 3 * ((Math.pow(1 + i, nq) - 1) / (1 - Math.pow(1 + i, -1 / 3)));
    const invested = monthly * months;
    return {
      rows: [
        { label: "Deposited", value: money(invested, c) },
        { label: "Maturity (approx.)", value: money(fv, c), emphasize: true },
        { label: "Interest", value: money(fv - invested, c) },
      ],
      note: "Uses the common quarterly-compounding RD formula. Banks may round differently.",
    };
  }

  if (engine === "gst" || engine === "vat") {
    const amount = n(input, "amount");
    const rate = n(input, "rate");
    const mode = String(input.mode ?? "exclusive");
    if (mode === "inclusive") {
      const base = amount / (1 + rate / 100);
      return {
        rows: [
          { label: "Net amount", value: money(base, c) },
          { label: "Tax", value: money(amount - base, c) },
          { label: "Gross (you typed)", value: money(amount, c), emphasize: true },
        ],
      };
    }
    const tax = amount * (rate / 100);
    return {
      rows: [
        { label: "Net amount", value: money(amount, c) },
        { label: "Tax", value: money(tax, c) },
        { label: "Gross", value: money(amount + tax, c), emphasize: true },
      ],
    };
  }

  if (engine === "percentage") {
    const base = n(input, "base");
    const percent = n(input, "percent");
    const other = n(input, "compare");
    const part = (base * percent) / 100;
    const rows = [
      { label: `${percent}% of number`, value: money(part, c), emphasize: true },
      { label: "Number + percent", value: money(base + part, c) },
      { label: "Number − percent", value: money(base - part, c) },
    ];
    if (other) {
      rows.push({ label: "Number is this % of the second", value: pct(other ? (base / other) * 100 : 0) });
      rows.push({ label: "% change (number → second)", value: pct(base ? ((other - base) / base) * 100 : 0) });
    }
    return { rows };
  }

  if (engine === "currency") {
    const amount = n(input, "amount");
    const rate = n(input, "rate");
    return {
      rows: [{ label: "Converted amount", value: money(amount * rate, ""), emphasize: true }],
      note: "Type the rate yourself (for example 83.2). Nothing is fetched from a bank feed.",
    };
  }

  if (engine === "inflation") {
    const amount = n(input, "amount");
    const rate = n(input, "rate");
    const years = Math.max(0, n(input, "years"));
    const mode = String(input.mode ?? "future");
    const factor = Math.pow(1 + rate / 100, years);
    const tableRows: string[][] = [];
    for (let y = 0; y <= Math.min(40, Math.ceil(years)); y++) {
      const f = Math.pow(1 + rate / 100, y);
      tableRows.push([String(y), money(amount * f, c), money(amount / f, c)]);
    }
    if (mode === "past") {
      const past = amount / (factor || 1);
      return {
        rows: [
          { label: "Amount today", value: money(amount, c) },
          { label: `${years} years ago`, value: money(past, c), emphasize: true },
          { label: "Inflation over the period", value: pct((factor - 1) * 100) },
        ],
        table: { title: "Year by year", headers: ["Year", "Future cost", "Buying power"], rows: tableRows },
      };
    }
    const future = amount * factor;
    return {
      rows: [
        { label: "Today", value: money(amount, c) },
        { label: `Costs in ${years} years`, value: money(future, c), emphasize: true },
        { label: "What today's money will buy then", value: money(amount / (factor || 1), c) },
        { label: "Purchasing power drop", value: pct(future ? 100 - (amount / future) * 100 : 0) },
      ],
      table: { title: "Year by year", headers: ["Year", "Future cost", "Buying power"], rows: tableRows },
    };
  }

  if (engine === "investment-return") {
    const start = n(input, "principal");
    const end = n(input, "final");
    const years = Math.max(0.01, n(input, "years"));
    const cagr = (Math.pow(end / Math.max(start, 0.01), 1 / years) - 1) * 100;
    const total = start ? ((end - start) / start) * 100 : 0;
    const tableRows: string[][] = [];
    for (let y = 0; y <= Math.min(40, Math.ceil(years)); y++) {
      tableRows.push([String(y), money(start * Math.pow(1 + cagr / 100, y), c)]);
    }
    return {
      rows: [
        { label: "Absolute gain", value: money(end - start, c) },
        { label: "Total return", value: pct(total) },
        { label: "CAGR", value: pct(cagr), emphasize: true },
      ],
      table: { title: "Implied growth path", headers: ["Year", "Value"], rows: tableRows },
    };
  }

  if (engine === "budget") {
    const income = n(input, "income");
    const housing = n(input, "housing");
    const living = n(input, "living");
    const food = n(input, "food");
    const transport = n(input, "transport");
    const other = n(input, "other");
    const savings = n(input, "savings");
    const spent = housing + living + food + transport + other + savings;
    const left = income - spent;
    const needs = housing + living + food + transport;
    return {
      rows: [
        { label: "Spent", value: money(spent, c) },
        { label: "Left over", value: money(left, c), emphasize: true },
        { label: "Savings rate", value: pct(income ? ((left + savings) / income) * 100 : 0) },
        { label: "Needs (50% guide)", value: `${money(needs, c)} / ${money(income * 0.5, c)}` },
        { label: "Wants (30% guide)", value: `${money(other, c)} / ${money(income * 0.3, c)}` },
        { label: "Savings (20% guide)", value: `${money(left + savings, c)} / ${money(income * 0.2, c)}` },
      ],
    };
  }

  if (engine === "retirement" || engine === "nps" || engine === "us-401k" || engine === "uk-pension") {
    const monthly = n(input, "monthly");
    const rate = n(input, "rate");
    const years = n(input, "years");
    const start = n(input, "principal");
    const corpus = start * Math.pow(1 + rate / 100, years) + futureSip(monthly, rate, years);
    const withdraw = n(input, "withdraw");
    const contributed = start + monthly * years * 12;
    const rows: CalcRow[] = [
      { label: "Estimated corpus", value: money(corpus, c), emphasize: true },
      { label: "Your contributions", value: money(contributed, c) },
      { label: "Assumed growth", value: money(corpus - contributed, c) },
    ];
    if (withdraw > 0) {
      rows.push({ label: `Annual withdrawal (${withdraw}%)`, value: money(corpus * (withdraw / 100), c) });
      rows.push({ label: "Monthly withdrawal", value: money((corpus * (withdraw / 100)) / 12, c) });
    }
    return {
      rows,
      note: "Constant return assumption. Fees, tax, sequence-of-returns risk, and inflation are not modelled. A 4% withdrawal is a rule of thumb, not advice.",
    };
  }

  if (engine === "ppf") {
    const yearly = n(input, "yearly");
    const rate = n(input, "rate") || 7.1;
    const years = 15;
    let balance = 0;
    for (let i = 0; i < years; i++) balance = (balance + yearly) * (1 + rate / 100);
    return {
      rows: [
        { label: "Deposited (15 yrs)", value: money(yearly * 15, c) },
        { label: "Maturity", value: money(balance, c), emphasize: true },
      ],
      note: "15-year PPF with annual compounding. Rate is editable — confirm the current MoF rate.",
    };
  }

  if (engine === "epf") {
    const basic = n(input, "basic");
    const rate = n(input, "rate") || 8.25;
    const years = n(input, "years");
    const monthly = basic * 0.12 * 2;
    const corpus = futureSip(monthly, rate, years);
    return {
      rows: [
        { label: "Monthly EPF (12% + 12%)", value: money(monthly, c) },
        { label: "Estimated corpus", value: money(corpus, c), emphasize: true },
      ],
      note: "Employee 12% + employer 12% of basic. EPS split is ignored.",
    };
  }

  if (engine === "gratuity" || engine === "india-gratuity") {
    const salary = n(input, "salary");
    const years = n(input, "years");
    const raw = (15 / 26) * salary * years;
    const capped = Math.min(raw, 2_000_000);
    return {
      rows: [
        { label: "Formula amount", value: money(raw, c) },
        { label: "Payable (₹20 lakh cap)", value: money(capped, c), emphasize: true },
      ],
      note: "Payment of Gratuity Act: 15/26 × last drawn salary × completed years. Confirm if your employer is covered.",
    };
  }

  if (engine === "month-severance") {
    const salary = n(input, "salary") || n(input, "monthly");
    const years = n(input, "years");
    return {
      rows: [
        { label: "Severance (1 month × years)", value: money(salary * years, c), emphasize: true },
      ],
      note: "Common statutory pattern (Korea 퇴직금 and similar). Confirm your labour code and average-wage definition.",
    };
  }

  if (engine === "eos") {
    const salary = n(input, "salary");
    const years = n(input, "years");
    const daily = salary / 30;
    const first = Math.min(years, 5) * 21 * daily;
    const rest = Math.max(0, years - 5) * 30 * daily;
    const raw = first + rest;
    const cap = salary * 24;
    const payable = Math.min(raw, cap);
    return {
      rows: [
        { label: "Formula amount", value: money(raw, c) },
        { label: "Payable (2-year wage cap)", value: money(payable, c), emphasize: true },
      ],
      note: "Common Gulf pattern: 21 days/year for the first five years, 30 days after. Cap and limited-contract rules differ — confirm local labour law.",
    };
  }

  if (engine === "takehome-simple") {
    const gross = n(input, "income");
    const taxRate = n(input, "taxRate") || n(input, "rate");
    const socialRate = n(input, "socialRate") || n(input, "social");
    const tax = gross * (taxRate / 100);
    const social = gross * (socialRate / 100);
    const home = gross - tax - social;
    return {
      rows: [
        { label: "Income tax", value: money(tax, c) },
        { label: "Social / other", value: money(social, c) },
        { label: "Annual take-home", value: money(home, c) },
        { label: "Monthly take-home", value: money(home / 12, c), emphasize: true },
      ],
      note: "Simple percentage model. Edit both rates to match your bracket and statutory deductions.",
    };
  }

  if (engine === "property-tax") {
    const value = n(input, "value") || n(input, "price") || n(input, "amount");
    const rate = n(input, "rate");
    const tax = value * (rate / 100);
    return {
      rows: [
        { label: "Annual amount", value: money(tax, c), emphasize: true },
        { label: "Monthly", value: money(tax / 12, c) },
      ],
    };
  }

  if (engine.startsWith("income-slabs:") || engine.startsWith("takehome-slabs:")) {
    const packId = engine.slice(engine.indexOf(":") + 1);
    const pack = TAX_PACKS[packId];
    if (!pack) return { rows: [{ label: "Result", value: "Unknown tax pack" }] };
    const income = n(input, "income") || n(input, "price") || n(input, "amount") || n(input, "value");
    const extraDeduction = n(input, "deduction");
    const taxable = Math.max(0, income - (pack.deduction ?? 0) - extraDeduction);
    let tax = slabTax(taxable, pack.slabs);
    if (pack.rebate) tax = Math.max(0, tax - pack.rebate);
    let extra = 0;
    if (pack.extraRate) {
      const base = pack.extraOn === "tax" ? tax : pack.extraOn === "income" ? income : taxable;
      extra = base * (pack.extraRate / 100);
    }
    const total = tax + extra;
    const social = income * ((pack.socialRate ?? 0) / 100);
    const takehome = engine.startsWith("takehome-slabs:");
    return {
      rows: [
        { label: "Taxable amount", value: money(taxable, c) },
        { label: "Income / duty", value: money(tax, c) },
        ...(pack.extraRate ? [{ label: pack.extraLabel ?? "Additional", value: money(extra, c) }] : []),
        { label: "Total tax", value: money(total, c), emphasize: !takehome },
        { label: "Effective rate", value: pct(income ? (total / income) * 100 : 0) },
        ...(takehome
          ? [
              ...(pack.socialRate
                ? [{ label: pack.socialLabel ?? "Social contributions", value: money(social, c) }]
                : []),
              { label: "Annual take-home", value: money(income - total - social, c) },
              { label: "Monthly take-home", value: money((income - total - social) / 12, c), emphasize: true },
            ]
          : [{ label: "After tax", value: money(income - total, c) }]),
      ],
      note: pack.note,
    };
  }

  if (engine === "ireland-takehome") {
    const income = n(input, "income");
    const cutoff = 44000;
    let tax = Math.min(income, cutoff) * 0.2 + Math.max(0, income - cutoff) * 0.4;
    tax = Math.max(0, tax - 4000);
    const usc =
      income <= 13000
        ? 0
        : slabTax(income, [
            [12012, 0.5],
            [27382, 2],
            [70044, 3],
            [Infinity, 8],
          ]);
    const prsi = income * 0.041;
    const home = income - tax - usc - prsi;
    return {
      rows: [
        { label: "Income tax (after credits)", value: money(tax, c) },
        { label: "USC", value: money(usc, c) },
        { label: "PRSI 4.1%", value: money(prsi, c) },
        { label: "Annual take-home", value: money(home, c) },
        { label: "Monthly", value: money(home / 12, c), emphasize: true },
      ],
      note: "Single-person 2025-style bands: 20% to €44,000 then 40%, €4,000 tax credits, USC, employee PRSI. Not official Revenue output.",
    };
  }

  if (engine === "hra") {
    const basic = n(input, "basic");
    const hra = n(input, "hra");
    const rent = n(input, "rent");
    const metro = String(input.metro ?? "yes") === "yes" ? 0.5 : 0.4;
    const exempt = Math.max(0, Math.min(hra, metro * basic, rent - 0.1 * basic));
    return {
      rows: [
        { label: "Exempt HRA", value: money(exempt, c), emphasize: true },
        { label: "Taxable HRA", value: money(Math.max(0, hra - exempt), c) },
      ],
      note: "Least of: actual HRA, 50% (metro) / 40% (non-metro) of basic, rent minus 10% of basic.",
    };
  }

  if (engine === "tds") {
    const amount = n(input, "amount");
    const rate = n(input, "rate");
    const tds = amount * (rate / 100);
    return {
      rows: [
        { label: "TDS", value: money(tds, c), emphasize: true },
        { label: "Net payable", value: money(amount - tds, c) },
      ],
    };
  }

  if (engine === "india-tax") {
    const income = n(input, "income");
    const deduction = n(input, "deduction");
    const taxable = Math.max(0, income - deduction);
    const tax = slabTax(taxable, [
      [400000, 0],
      [800000, 5],
      [1200000, 10],
      [1600000, 15],
      [2000000, 20],
      [2400000, 25],
      [Infinity, 30],
    ]);
    const afterRebate = taxable <= 1200000 ? 0 : tax;
    const cess = afterRebate * 0.04;
    const total = afterRebate + cess;
    return {
      rows: [
        { label: "Taxable income", value: money(taxable, c) },
        { label: "Tax (new regime)", value: money(afterRebate, c) },
        { label: "Cess 4%", value: money(cess, c) },
        { label: "Total tax", value: money(total, c), emphasize: true },
        { label: "Take-home after tax", value: money(income - total, c) },
      ],
      note: "FY 2025–26 new-regime slabs with rebate up to ₹12 lakh. Surcharge not modelled. Confirm on incometax.gov.in.",
    };
  }

  if (engine === "india-takehome") {
    const gross = n(input, "income");
    const basic = n(input, "basic") || gross * 0.5;
    const pf = basic * 0.12;
    const taxRes = runFinance("india-tax", { income: gross, deduction: 75000, currency: c });
    const tax = parseDisplayed(taxRes.rows[3]?.value);
    const home = gross - tax - pf;
    return {
      rows: [
        { label: "Employee PF (12% of basic)", value: money(pf, c) },
        { label: "Income tax + cess", value: money(tax, c) },
        { label: "Monthly take-home (approx.)", value: money(home / 12, c), emphasize: true },
        { label: "Annual take-home", value: money(home, c) },
      ],
      note: "New-regime tax with ₹75,000 standard deduction. Professional tax and other allowances ignored.",
    };
  }

  if (engine === "india-ltcg") {
    const gain = n(input, "gain");
    const rate = n(input, "rate") || 12.5;
    const exemption = n(input, "exemption");
    const taxable = Math.max(0, gain - exemption);
    const tax = taxable * (rate / 100);
    return {
      rows: [
        { label: "Taxable gain", value: money(taxable, c) },
        { label: "Tax", value: money(tax, c), emphasize: true },
      ],
      note: "Default 12.5% listed-equity LTCG after ₹1.25 lakh exemption. Confirm current CBDT rates.",
    };
  }

  if (engine === "us-federal-tax") {
    const income = n(input, "income");
    const status = String(input.status ?? "single");
    const std = status === "married" ? 30000 : 15000;
    const taxable = Math.max(0, income - std);
    const slabs: Array<[number, number]> =
      status === "married"
        ? [
            [23850, 10],
            [96950, 12],
            [206700, 22],
            [394600, 24],
            [501050, 32],
            [751600, 35],
            [Infinity, 37],
          ]
        : [
            [11925, 10],
            [48475, 12],
            [103350, 22],
            [197300, 24],
            [250525, 32],
            [626350, 35],
            [Infinity, 37],
          ];
    const tax = slabTax(taxable, slabs);
    return {
      rows: [
        { label: "Standard deduction (approx.)", value: money(std, c) },
        { label: "Taxable income", value: money(taxable, c) },
        { label: "Federal tax", value: money(tax, c), emphasize: true },
        { label: "Effective rate", value: pct(income ? (tax / income) * 100 : 0) },
      ],
      note: "TY 2025 federal brackets, standard deduction only. State tax, credits, and FICA are not included.",
    };
  }

  if (engine === "us-paycheck") {
    const gross = n(input, "income");
    const federal = runFinance("us-federal-tax", { ...input, currency: c });
    const fed = parseDisplayed(federal.rows[2]?.value);
    const ss = Math.min(gross, 176100) * 0.062;
    const medicare = gross * 0.0145;
    const home = gross - fed - ss - medicare;
    return {
      rows: [
        { label: "Federal income tax", value: money(fed, c) },
        { label: "Social Security 6.2%", value: money(ss, c) },
        { label: "Medicare 1.45%", value: money(medicare, c) },
        { label: "Annual take-home (approx.)", value: money(home, c), emphasize: true },
        { label: "Monthly", value: money(home / 12, c) },
      ],
      note: "Federal + FICA only. State income tax not included.",
    };
  }

  if (engine === "us-capital-gains") {
    const gain = n(input, "gain");
    const rate = n(input, "rate") || 15;
    return {
      rows: [{ label: "Estimated tax", value: money(gain * (rate / 100), c), emphasize: true }],
      note: "Long-term federal rates are often 0 / 15 / 20% by income. Pick the rate that matches your bracket.",
    };
  }

  if (engine === "uk-stamp-duty") {
    const price = n(input, "price");
    const first = String(input.first ?? "no") === "yes";
    const bands: Array<[number, number]> = first
      ? [
          [425000, 0],
          [625000, 5],
          [925000, 5],
          [1500000, 10],
          [Infinity, 12],
        ]
      : [
          [250000, 0],
          [925000, 5],
          [1500000, 10],
          [Infinity, 12],
        ];
    const tax = slabTax(price, bands);
    return {
      rows: [
        { label: "SDLT", value: money(tax, c), emphasize: true },
        { label: "Effective rate", value: pct(price ? (tax / price) * 100 : 0) },
      ],
      note: "England & Northern Ireland standard residential SDLT. Scotland LBTT and Wales LTT differ. First-home relief simplified.",
    };
  }

  if (engine === "uk-income-tax") {
    const income = n(input, "income");
    const pa = income > 125140 ? 0 : Math.max(0, 12570 - Math.max(0, income - 100000) / 2);
    const taxable = Math.max(0, income - pa);
    const tax = slabTax(taxable, [
      [37700, 20],
      [125140, 40],
      [Infinity, 45],
    ]);
    return {
      rows: [
        { label: "Personal allowance", value: money(pa, c) },
        { label: "Income tax", value: money(tax, c), emphasize: true },
        { label: "Net after income tax", value: money(income - tax, c) },
      ],
      note: "England/NI 2025–26 bands. Scotland uses different rates. National Insurance is a separate tool.",
    };
  }

  if (engine === "uk-ni") {
    const income = n(input, "income");
    const primary = 12570;
    const uel = 50270;
    const ni =
      Math.max(0, Math.min(income, uel) - primary) * 0.08 + Math.max(0, income - uel) * 0.02;
    return {
      rows: [{ label: "Employee NI (approx.)", value: money(ni, c), emphasize: true }],
      note: "Class 1 employee 2025–26: 8% between £12,570 and £50,270, 2% above. Employer NI not included.",
    };
  }

  if (engine === "uk-takehome") {
    const income = n(input, "income");
    const tax = runFinance("uk-income-tax", { income, currency: c });
    const ni = runFinance("uk-ni", { income, currency: c });
    const t = parseDisplayed(tax.rows[1]?.value);
    const nI = parseDisplayed(ni.rows[0]?.value);
    return {
      rows: [
        { label: "Income tax", value: money(t, c) },
        { label: "National Insurance", value: money(nI, c) },
        { label: "Annual take-home", value: money(income - t - nI, c), emphasize: true },
        { label: "Monthly", value: money((income - t - nI) / 12, c) },
      ],
    };
  }

  if (engine === "uk-student-loan") {
    const income = n(input, "income");
    const plan = String(input.plan ?? "2");
    const threshold = plan === "1" ? 24990 : plan === "4" ? 31395 : plan === "5" ? 25000 : 27295;
    const repay = Math.max(0, income - threshold) * 0.09;
    return {
      rows: [
        { label: "Threshold", value: money(threshold, c) },
        { label: "Annual repayment", value: money(repay, c), emphasize: true },
        { label: "Monthly", value: money(repay / 12, c) },
      ],
      note: "9% of income above the plan threshold. Confirm your plan on gov.uk.",
    };
  }

  if (engine === "discount") {
    const amount = n(input, "amount");
    const percent = n(input, "percent");
    const off = amount * (percent / 100);
    return {
      rows: [
        { label: "You save", value: money(off, c) },
        { label: "Sale price", value: money(amount - off, c), emphasize: true },
      ],
    };
  }

  if (engine === "profit-margin") {
    const cost = n(input, "cost");
    const price = n(input, "price");
    const profit = price - cost;
    return {
      rows: [
        { label: "Profit", value: money(profit, c), emphasize: true },
        { label: "Margin (profit ÷ price)", value: pct(price ? (profit / price) * 100 : 0) },
        { label: "Markup (profit ÷ cost)", value: pct(cost ? (profit / cost) * 100 : 0) },
      ],
      note: "Margin is profit over selling price. Markup is profit over cost. They are not the same number.",
    };
  }

  if (engine === "markup") {
    const cost = n(input, "cost");
    const percent = n(input, "percent");
    const price = cost * (1 + percent / 100);
    return {
      rows: [
        { label: "Selling price", value: money(price, c), emphasize: true },
        { label: "Profit", value: money(price - cost, c) },
        { label: "Margin", value: pct(price ? ((price - cost) / price) * 100 : 0) },
      ],
    };
  }

  if (engine === "break-even") {
    const fixed = n(input, "fixed");
    const price = n(input, "price");
    const variable = n(input, "variable");
    const contrib = price - variable;
    const units = contrib > 0 ? Math.ceil(fixed / contrib) : 0;
    return {
      rows: [
        { label: "Contribution per unit", value: money(contrib, c) },
        { label: "Break-even units", value: String(units), emphasize: true },
        { label: "Break-even revenue", value: money(units * price, c) },
      ],
      note: contrib <= 0 ? "Price is not above variable cost — there is no break-even." : "Ignores tax, inventory, and changing prices.",
    };
  }

  if (engine === "gst-invoice") {
    const amount = n(input, "amount");
    const qty = Math.max(0, n(input, "qty") || 1);
    const rate = n(input, "rate");
    const taxable = amount * qty;
    const gst = taxable * (rate / 100);
    const intra = String(input.supply ?? "intra") !== "inter";
    const rows: CalcRow[] = [
      { label: "Taxable value", value: money(taxable, c) },
    ];
    if (intra) {
      rows.push({ label: "CGST", value: money(gst / 2, c) });
      rows.push({ label: "SGST", value: money(gst / 2, c) });
    } else {
      rows.push({ label: "IGST", value: money(gst, c) });
    }
    rows.push({ label: "Invoice total", value: money(taxable + gst, c), emphasize: true });
    return { rows, note: "Estimate only. Confirm HSN/SAC and place of supply before you invoice." };
  }

  if (engine === "simple-interest") {
    const p = n(input, "principal");
    const rate = n(input, "rate");
    const years = n(input, "years");
    const si = (p * rate * years) / 100;
    return {
      rows: [
        { label: "Simple interest", value: money(si, c) },
        { label: "Maturity", value: money(p + si, c), emphasize: true },
      ],
      note: "SI = P × R × T ÷ 100. Compounding is not applied — use the compound-interest page for that.",
    };
  }

  if (engine === "ltv") {
    const loan = n(input, "principal");
    const value = n(input, "value");
    const ltv = value ? (loan / value) * 100 : 0;
    return {
      rows: [
        { label: "Loan-to-value", value: pct(ltv), emphasize: true },
        { label: "Equity", value: money(value - loan, c) },
      ],
      note: "Many lenders cap LTV. This is the ratio only — not an approval.",
    };
  }

  if (engine === "dti") {
    const debt = n(input, "debt");
    const income = n(input, "income");
    const dti = income ? (debt / income) * 100 : 0;
    return {
      rows: [
        { label: "Debt-to-income", value: pct(dti), emphasize: true },
        { label: "Left after debts", value: money(income - debt, c) },
      ],
      note: "US underwriting often looks for DTI under ~43%. Rules vary by lender and country.",
    };
  }

  if (engine === "net-worth") {
    const assets = n(input, "cash") + n(input, "investments") + n(input, "property") + n(input, "other");
    const debts = n(input, "mortgage") + n(input, "loans") + n(input, "cards");
    return {
      rows: [
        { label: "Assets", value: money(assets, c) },
        { label: "Liabilities", value: money(debts, c) },
        { label: "Net worth", value: money(assets - debts, c), emphasize: true },
      ],
    };
  }

  if (engine === "savings-goal") {
    const target = n(input, "target");
    const start = n(input, "principal");
    const monthly = n(input, "monthly");
    const rate = n(input, "rate");
    const monthlyRate = rate / 12 / 100;
    let bal = start;
    let months = 0;
    const cap = 12 * 80;
    while (bal < target && months < cap) {
      months += 1;
      bal = bal * (1 + monthlyRate) + monthly;
    }
    return {
      rows: [
        { label: "Months to goal", value: months >= cap && bal < target ? "80+ years at this rate" : String(months), emphasize: true },
        { label: "Years", value: (months / 12).toFixed(1) },
        { label: "Projected balance", value: money(bal, c) },
      ],
      note: monthly <= 0 && start < target ? "Add a monthly amount, or the goal is never reached if returns are low." : "Constant return; deposits at month-end.",
    };
  }

  if (engine === "rent-vs-buy") {
    const rent = n(input, "rent");
    const price = n(input, "price");
    const down = n(input, "principal");
    const rate = n(input, "rate");
    const tenure = Math.max(1, n(input, "tenure") || 30);
    const years = Math.max(1, n(input, "years"));
    const taxPct = n(input, "taxRate");
    const maintPct = n(input, "maintain");
    const invest = n(input, "invest");
    const loan = Math.max(0, price - down);
    const emi = emiMonthly(loan, rate, tenure);
    const months = Math.round(years * 12);
    const r = rate / 12 / 100;
    let bal = loan;
    for (let m = 0; m < months && bal > 0; m += 1) {
      const interest = r === 0 ? 0 : bal * r;
      bal = Math.max(0, bal - (emi - interest));
    }
    const taxMaint = ((price * (taxPct + maintPct)) / 100 / 12) * months;
    const buyCash = down + emi * months + taxMaint;
    const equity = price - bal;
    const buyNet = equity - 0;
    const rentPaid = rent * months;
    const investedDown = down * Math.pow(1 + invest / 100, years);
    const extra = Math.max(0, emi + (price * (taxPct + maintPct)) / 100 / 12 - rent);
    const extraFv = extra * months; // simple; not compounded monthly to keep honest-ish
    const renterWealth = investedDown + extra * ((Math.pow(1 + invest / 12 / 100, months) - 1) / Math.max(invest / 12 / 100, 1e-9));
    return {
      rows: [
        { label: "Buy: cash spent", value: money(buyCash, c) },
        { label: "Buy: remaining loan", value: money(bal, c) },
        { label: "Buy: home equity (price − loan, no appreciation)", value: money(equity, c), emphasize: true },
        { label: "Rent: rent paid", value: money(rentPaid, c) },
        { label: "Rent: down payment invested", value: money(investedDown, c) },
        { label: "Rent: wealth if monthly gap is also invested", value: money(renterWealth, c), emphasize: true },
      ],
      note: "Home price is held flat. No selling costs, tax relief, or rent inflation. Compare equity vs renter investments — not a recommendation.",
    };
  }

  if (engine === "fuel-cost") {
    const distance = n(input, "distance");
    const trips = Math.max(1, n(input, "trips") || 1);
    const economy = n(input, "economy");
    const price = n(input, "price");
    const mpg = String(input.unit ?? "kml") === "mpg";
    const totalDist = distance * trips;
    const volume = economy > 0 ? totalDist / economy : 0;
    const cost = volume * price;
    return {
      rows: [
        { label: mpg ? "Miles" : "Kilometres", value: totalDist.toFixed(1) },
        { label: mpg ? "Gallons" : "Litres", value: volume.toFixed(2) },
        { label: "Fuel cost", value: money(cost, c), emphasize: true },
        { label: mpg ? "Per mile" : "Per km", value: money(totalDist ? cost / totalDist : 0, c) },
      ],
    };
  }

  return { rows: [{ label: "Result", value: "Enter values to calculate" }] };
}

export function runFinance(engine: string, input: CalcInput): CalcResult {
  const result = computeFinance(engine, input);
  return { ...result, chart: buildFinanceChart(engine, input, result) };
}
