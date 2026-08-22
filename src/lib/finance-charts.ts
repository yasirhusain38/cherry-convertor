import type { CalcInput, CalcResult, ChartSeries, ChartSlice, FinanceChartSpec } from "./finance";

function n(input: CalcInput, key: string): number {
  const raw = input[key];
  const value = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function parseMoney(value: string | undefined): number {
  return Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;
}

function emi(principal: number, annualRate: number, years: number): number {
  const months = Math.max(1, years * 12);
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

function sip(monthly: number, annualRate: number, years: number): number {
  const months = Math.max(0, years * 12);
  const i = annualRate / 12 / 100;
  if (months === 0) return 0;
  if (i === 0) return monthly * months;
  return monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
}

function yearStops(years: number): number[] {
  const y = Math.max(1, Math.round(years));
  const step = y <= 8 ? 1 : y <= 16 ? 2 : y <= 30 ? 5 : 10;
  const out = [0];
  for (let i = step; i < y; i += step) out.push(i);
  if (out[out.length - 1] !== y) out.push(y);
  return out;
}

function slices(pairs: Array<[string, number]>): ChartSlice[] {
  return pairs.filter(([, value]) => Number.isFinite(value) && Math.abs(value) > 0.0001).map(([label, value]) => ({
    label,
    value: Math.abs(value),
  }));
}

function labeled(years: number[]): string[] {
  return years.map((year) => (year === 0 ? "Now" : `${year}y`));
}

function growth(
  title: string,
  donut: Array<[string, number]>,
  years: number[],
  series: ChartSeries[],
): FinanceChartSpec {
  return {
    title,
    slices: slices(donut),
    labels: labeled(years),
    series,
  };
}

function fromRows(result: CalcResult, title: string, skip = /rate|cagr|%|threshold/i): FinanceChartSpec {
  const numeric = result.rows
    .filter((row) => !skip.test(row.label) && !row.value.includes("%"))
    .map((row) => [row.label, parseMoney(row.value)] as [string, number]);
  return { title, slices: slices(numeric) };
}

export function buildFinanceChart(engine: string, input: CalcInput, result: CalcResult): FinanceChartSpec {
  const years = Math.max(1, n(input, "years") || 10);
  const rate = n(input, "rate") || n(input, "taxRate");
  const principal = n(input, "principal");
  const monthly = n(input, "monthly");
  const income = n(input, "income");
  const amount = n(input, "amount");
  const stops = yearStops(years);

  if (engine === "emi" || engine === "loan") {
    const payment = emi(principal, rate, years);
    const total = payment * years * 12;
    const interest = Math.max(0, total - principal);
    const r = rate / 12 / 100;
    const balance: number[] = [];
    const paid: number[] = [];
    for (const year of stops) {
      let bal = principal;
      const months = year * 12;
      for (let m = 0; m < months; m++) bal = bal * (1 + r) - payment;
      balance.push(Math.max(0, bal));
      paid.push(Math.min(total, payment * months));
    }
    return growth("Principal vs interest", [["Principal", principal], ["Interest", interest]], stops, [
      { name: "Remaining balance", values: balance },
      { name: "Paid so far", values: paid },
    ]);
  }

  if (engine === "sip") {
    const invested = stops.map((year) => monthly * 12 * year);
    const corpus = stops.map((year) => sip(monthly, rate, year));
    const lastInvest = monthly * 12 * years;
    const lastCorpus = sip(monthly, rate, years);
    return growth("Invested vs corpus", [["Invested", lastInvest], ["Gain", Math.max(0, lastCorpus - lastInvest)]], stops, [
      { name: "Corpus", values: corpus },
      { name: "Invested", values: invested },
    ]);
  }

  if (engine === "compound" || engine === "fd") {
    const freq = n(input, "frequency") || (engine === "fd" ? 4 : 1);
    const curve = stops.map((year) => principal * Math.pow(1 + rate / 100 / freq, freq * year));
    const start = stops.map(() => principal);
    const fv = curve[curve.length - 1] ?? principal;
    return growth("Growth over time", [["Principal", principal], ["Interest", Math.max(0, fv - principal)]], stops, [
      { name: "Value", values: curve },
      { name: "Principal", values: start },
    ]);
  }

  if (engine === "rd") {
    const invested = stops.map((year) => monthly * 12 * year);
    const corpus = stops.map((year) => sip(monthly, rate, year));
    const lastInvest = monthly * 12 * years;
    const lastCorpus = sip(monthly, rate, years);
    return growth("RD growth", [["Deposited", lastInvest], ["Interest", Math.max(0, lastCorpus - lastInvest)]], stops, [
      { name: "Maturity", values: corpus },
      { name: "Deposited", values: invested },
    ]);
  }

  if (engine === "gst" || engine === "vat") {
    const mode = String(input.mode ?? "exclusive");
    const taxRate = n(input, "rate");
    if (mode === "inclusive") {
      const base = amount / (1 + taxRate / 100);
      return { title: "Tax split", slices: slices([["Net", base], ["Tax", amount - base]]) };
    }
    const tax = amount * (taxRate / 100);
    return { title: "Tax split", slices: slices([["Net", amount], ["Tax", tax]]) };
  }

  if (engine === "percentage") {
    const base = n(input, "base");
    const percent = n(input, "percent");
    const part = (base * percent) / 100;
    const rest = Math.max(0, base - part);
    return {
      title: `${percent}% of ${base}`,
      slices: slices([
        [`${percent}%`, part],
        ["Remainder", rest],
      ]),
      labels: ["Amount", "Plus %", "Minus %"],
      series: [{ name: "Value", values: [base, base + part, Math.max(0, base - part)] }],
    };
  }

  if (engine === "currency") {
    const converted = amount * n(input, "rate");
    return {
      title: "Conversion",
      slices: slices([["From", amount], ["To", converted]]),
      labels: ["From", "To"],
      series: [{ name: "Amount", values: [amount, converted] }],
    };
  }

  if (engine === "inflation") {
    const future = stops.map((year) => amount * Math.pow(1 + rate / 100, year));
    const today = stops.map(() => amount);
    const last = future[future.length - 1] ?? amount;
    return growth("Rising cost of the same basket", [["Today", amount], ["Extra needed", Math.max(0, last - amount)]], stops, [
      { name: "Future cost", values: future },
      { name: "Today", values: today },
    ]);
  }

  if (engine === "investment-return") {
    const start = principal;
    const end = n(input, "final");
    return {
      title: "Invested vs today",
      slices: slices([
        ["Invested", start],
        ["Gain", Math.max(0, end - start)],
      ]),
      labels: ["Invested", "Today"],
      series: [{ name: "Value", values: [start, end] }],
    };
  }

  if (engine === "budget") {
    const housing = n(input, "housing");
    const living = n(input, "living");
    const other = n(input, "other");
    const left = income - housing - living - other;
    return {
      title: "Monthly mix",
      slices: slices([
        ["Housing / EMI", housing],
        ["Living", living],
        ["Other", other],
        ["Left to save", Math.max(0, left)],
      ]),
    };
  }

  if (engine === "retirement" || engine === "nps" || engine === "us-401k" || engine === "uk-pension") {
    const start = principal;
    const contrib = stops.map((year) => start + monthly * 12 * year);
    const corpus = stops.map((year) => start * Math.pow(1 + rate / 100, year) + sip(monthly, rate, year));
    const lastContrib = start + monthly * 12 * years;
    const lastCorpus = corpus[corpus.length - 1] ?? lastContrib;
    return growth("Retirement path", [["Contributed", lastContrib], ["Growth", Math.max(0, lastCorpus - lastContrib)]], stops, [
      { name: "Corpus", values: corpus },
      { name: "Contributed", values: contrib },
    ]);
  }

  if (engine === "ppf") {
    const yearly = n(input, "yearly");
    const ppfRate = rate || 7.1;
    const ppfStops = yearStops(15);
    const values: number[] = [];
    const deposited: number[] = [];
    for (const year of ppfStops) {
      let balance = 0;
      for (let i = 0; i < year; i++) balance = (balance + yearly) * (1 + ppfRate / 100);
      values.push(balance);
      deposited.push(yearly * year);
    }
    const maturity = values[values.length - 1] ?? 0;
    return growth("PPF over 15 years", [["Deposited", yearly * 15], ["Interest", Math.max(0, maturity - yearly * 15)]], ppfStops, [
      { name: "Balance", values },
      { name: "Deposited", values: deposited },
    ]);
  }

  if (engine === "epf") {
    const basic = n(input, "basic");
    const monthlyEpf = basic * 0.12 * 2;
    const contrib = stops.map((year) => monthlyEpf * 12 * year);
    const corpus = stops.map((year) => sip(monthlyEpf, rate || 8.25, year));
    const lastC = monthlyEpf * 12 * years;
    const lastV = sip(monthlyEpf, rate || 8.25, years);
    return growth("EPF corpus", [["Contributed", lastC], ["Interest", Math.max(0, lastV - lastC)]], stops, [
      { name: "Corpus", values: corpus },
      { name: "Contributed", values: contrib },
    ]);
  }

  if (engine === "gratuity" || engine === "india-gratuity") {
    const salary = n(input, "salary");
    const raw = (15 / 26) * salary * years;
    const capped = Math.min(raw, 2_000_000);
    return {
      title: "Formula vs cap",
      slices: slices([
        ["Payable", capped],
        ["Above cap", Math.max(0, raw - capped)],
      ]),
      labels: ["Formula", "Cap ₹20L", "Payable"],
      series: [{ name: "Amount", values: [raw, 2_000_000, capped] }],
    };
  }

  if (engine === "eos") {
    const salary = n(input, "salary");
    const daily = salary / 30;
    const first = Math.min(years, 5) * 21 * daily;
    const rest = Math.max(0, years - 5) * 30 * daily;
    const cap = salary * 24;
    const raw = first + rest;
    return {
      title: "End of service",
      slices: slices([
        ["First 5 years", first],
        ["After 5 years", rest],
      ]),
      labels: ["Formula", "2-yr cap", "Payable"],
      series: [{ name: "Amount", values: [raw, cap, Math.min(raw, cap)] }],
    };
  }

  if (engine === "month-severance") {
    const salary = n(input, "salary") || monthly;
    return {
      title: "Severance",
      slices: slices([["One month", salary], ["× years", salary * Math.max(0, years - 1)]]),
      labels: ["Monthly wage", "Severance"],
      series: [{ name: "Amount", values: [salary, salary * years] }],
    };
  }

  if (engine === "takehome-simple" || engine === "ireland-takehome" || engine === "india-takehome" || engine === "us-paycheck" || engine === "uk-takehome") {
    return fromRows(result, "Pay split", /rate|monthly|taxable|standard deduction|threshold|cess 4%/i);
  }

  if (engine === "property-tax") {
    const value = n(input, "value") || n(input, "price") || amount;
    const tax = value * (rate / 100);
    return { title: "Levy vs value", slices: slices([["Tax", tax], ["Net value", Math.max(0, value - tax)]]) };
  }

  if (engine.startsWith("income-slabs:") || engine.startsWith("takehome-slabs:")) {
    return fromRows(result, "Tax vs keep", /rate|taxable|monthly|effective/i);
  }

  if (engine === "hra") {
    return fromRows(result, "HRA split");
  }

  if (engine === "tds") {
    const tds = amount * (rate / 100);
    return { title: "Withholding", slices: slices([["TDS", tds], ["Net payable", Math.max(0, amount - tds)]]) };
  }

  if (engine === "india-tax" || engine === "us-federal-tax" || engine === "uk-income-tax" || engine === "uk-ni") {
    return fromRows(result, "Tax split", /rate|taxable|standard deduction|personal allowance|effective/i);
  }

  if (engine === "india-ltcg" || engine === "us-capital-gains") {
    return fromRows(result, "Gain vs tax", /rate|taxable/i);
  }

  if (engine === "uk-stamp-duty") {
    const price = n(input, "price");
    const duty = parseMoney(result.rows.find((row) => /sdlt/i.test(row.label))?.value);
    return { title: "Stamp duty", slices: slices([["SDLT", duty], ["Rest of price", Math.max(0, price - duty)]]) };
  }

  if (engine === "uk-student-loan") {
    const repay = parseMoney(result.rows.find((row) => /annual repayment/i.test(row.label))?.value);
    return { title: "Repayment vs income", slices: slices([["Repayment", repay], ["Take-home rest", Math.max(0, income - repay)]]) };
  }

  return fromRows(result, "Breakdown");
}
