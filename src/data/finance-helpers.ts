export type FinanceField = {
  key: string;
  label: string;
  kind?: "number" | "select";
  suffix?: string;
  def: string;
  options?: Array<{ value: string; label: string }>;
};

export type FinanceTool = {
  slug: string;
  name: string;
  country: string;
  countrySlug: string | "global";
  kicker: string;
  h1: string;
  lede: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  engine: string;
  currency: string;
  fields: FinanceField[];
  faqs: Array<{ q: string; a: string }>;
  related: string[];
};

export function t(
  slug: string,
  name: string,
  country: string,
  countrySlug: string,
  kicker: string,
  h1: string,
  lede: string,
  keywords: string[],
  engine: string,
  currency: string,
  fields: FinanceField[],
  related: string[],
  extraFaq?: Array<{ q: string; a: string }>,
): FinanceTool {
  return {
    slug,
    name,
    country,
    countrySlug,
    kicker,
    h1,
    lede,
    metaTitle: `${name} Free – Cherry Converter`,
    metaDescription: `${lede} Runs in your browser. No upload, no account.`,
    keywords,
    engine,
    currency,
    fields,
    related,
    faqs: [
      {
        q: "Is my salary or loan data uploaded?",
        a: "No. The maths runs in this tab. Close the page and the numbers are gone.",
      },
      {
        q: "Are the tax rates official?",
        a: "They follow commonly published slabs for the current year, labelled as estimates. Confirm on the government site before you file.",
      },
      ...(extraFaq ?? []),
    ],
  };
}

export const emiFields = (principal: string, rate: string, years = "20"): FinanceField[] => [
  { key: "principal", label: "Loan amount", suffix: "amount", def: principal },
  { key: "rate", label: "Annual interest rate", suffix: "%", def: rate },
  { key: "years", label: "Tenure", suffix: "years", def: years },
  { key: "months", label: "Extra months", suffix: "months", def: "0" },
  { key: "extra", label: "Extra monthly payment", def: "0" },
];

const vatMode = (label: string): FinanceField => ({
  key: "mode",
  label: "Amount is",
  kind: "select",
  def: "exclusive",
  options: [
    { value: "exclusive", label: `Before ${label}` },
    { value: "inclusive", label: `Includes ${label}` },
  ],
});

type CountryBits = {
  country: string;
  countrySlug: string;
  currency: string;
};

export function makeVat(
  bits: CountryBits & { slug: string; rate: string; label?: string; related?: string[] },
): FinanceTool {
  const label = bits.label ?? "VAT";
  return t(
    bits.slug,
    `${bits.country} ${label} Calculator`,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  ${label}`,
    `${label} calculator (${bits.rate}%)`,
    `Add or strip ${bits.rate}% ${label} for ${bits.country}. Type a reduced rate if yours is different.`,
    [`${label.toLowerCase()} calculator ${bits.country.toLowerCase()}`, `${bits.country.toLowerCase()} ${label.toLowerCase()} calculator`],
    "vat",
    bits.currency,
    [
      { key: "amount", label: "Amount", def: "1000" },
      { key: "rate", label: `${label} rate`, suffix: "%", def: bits.rate },
      vatMode(label),
    ],
    bits.related ?? ["percentage-calculator", "loan-emi-calculator"],
  );
}

export function makeMortgage(
  bits: CountryBits & { slug: string; principal: string; rate: string; years?: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    `${bits.country} Mortgage Calculator`,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Mortgage`,
    `${bits.country} mortgage calculator`,
    `Monthly repayment, total interest, and total paid on a ${bits.country} home loan.`,
    [`${bits.country.toLowerCase()} mortgage calculator`, `home loan calculator ${bits.country.toLowerCase()}`],
    "emi",
    bits.currency,
    emiFields(bits.principal, bits.rate, bits.years ?? "25"),
    bits.related ?? ["loan-emi-calculator", "compound-interest-calculator"],
  );
}

export function makeLoan(
  bits: CountryBits & { slug: string; name: string; principal: string; rate: string; years: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    bits.name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Loan`,
    bits.name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Instalment, total interest, and total payment. Runs on this device.`,
    [bits.name.toLowerCase(), `${bits.country.toLowerCase()} loan calculator`],
    "emi",
    bits.currency,
    emiFields(bits.principal, bits.rate, bits.years),
    bits.related ?? ["loan-emi-calculator"],
  );
}

export function makeSlab(
  bits: CountryBits & { slug: string; pack: string; incomeDef: string; name?: string; related?: string[] },
): FinanceTool {
  const name = bits.name ?? `${bits.country} Income Tax Calculator`;
  return t(
    bits.slug,
    name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Tax`,
    name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Resident income-tax estimate for ${bits.country}. Slabs are labelled as estimates — confirm before you file.`,
    [`income tax calculator ${bits.country.toLowerCase()}`, `${bits.country.toLowerCase()} tax calculator`],
    `income-slabs:${bits.pack}`,
    bits.currency,
    [
      { key: "income", label: "Annual income", def: bits.incomeDef },
      { key: "deduction", label: "Extra deduction", def: "0" },
    ],
    bits.related ?? ["loan-emi-calculator", "percentage-calculator"],
  );
}

export function makePriceSlab(
  bits: CountryBits & { slug: string; pack: string; priceDef: string; name: string; kicker: string; lede: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    bits.name,
    bits.country,
    bits.countrySlug,
    bits.kicker,
    bits.name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    bits.lede,
    [bits.name.toLowerCase()],
    `income-slabs:${bits.pack}`,
    bits.currency,
    [{ key: "price", label: "Property price", def: bits.priceDef }],
    bits.related ?? ["loan-emi-calculator"],
  );
}

export function makeTakehome(
  bits: CountryBits & { slug: string; incomeDef: string; taxRate: string; socialRate: string; socialLabel?: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    `${bits.country} Take-home Salary Calculator`,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Salary`,
    `${bits.country} take-home salary calculator`,
    `Gross minus an income-tax % and a social-contribution % you can edit. Monthly in-hand estimate.`,
    [`take home salary calculator ${bits.country.toLowerCase()}`, `${bits.country.toLowerCase()} salary calculator`],
    "takehome-simple",
    bits.currency,
    [
      { key: "income", label: "Annual gross", def: bits.incomeDef },
      { key: "taxRate", label: "Income tax rate", suffix: "%", def: bits.taxRate },
      { key: "socialRate", label: bits.socialLabel ?? "Social contributions", suffix: "%", def: bits.socialRate },
    ],
    bits.related ?? ["budget-calculator"],
  );
}

export function makeRetirement(
  bits: CountryBits & { slug: string; name: string; principal: string; monthly: string; rate: string; years: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    bits.name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Retirement`,
    bits.name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Current pot plus monthly contributions grown at an assumed return.`,
    [bits.name.toLowerCase()],
    "retirement",
    bits.currency,
    [
      { key: "principal", label: "Current balance", def: bits.principal },
      { key: "monthly", label: "Monthly contribution", def: bits.monthly },
      { key: "rate", label: "Expected return", suffix: "%", def: bits.rate },
      { key: "years", label: "Years", def: bits.years },
    ],
    bits.related ?? ["compound-interest-calculator"],
  );
}

export function makeWithholding(
  bits: CountryBits & { slug: string; name: string; amount: string; rate: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    bits.name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Withholding`,
    bits.name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Withholding / PAYE-style cut at the rate you type.`,
    [bits.name.toLowerCase()],
    "tds",
    bits.currency,
    [
      { key: "amount", label: "Amount", def: bits.amount },
      { key: "rate", label: "Rate", suffix: "%", def: bits.rate },
    ],
    bits.related ?? ["percentage-calculator"],
  );
}

export function makeProperty(
  bits: CountryBits & { slug: string; name?: string; value: string; rate: string; related?: string[] },
): FinanceTool {
  const name = bits.name ?? `${bits.country} Property Tax Calculator`;
  return t(
    bits.slug,
    name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Property tax`,
    name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Annual levy from property value × rate. Edit the local rate your council publishes.`,
    [name.toLowerCase(), `property tax calculator ${bits.country.toLowerCase()}`],
    "property-tax",
    bits.currency,
    [
      { key: "value", label: "Assessed value", def: bits.value },
      { key: "rate", label: "Annual rate", suffix: "%", def: bits.rate },
    ],
    bits.related ?? ["loan-emi-calculator"],
  );
}

export function makeStamp(
  bits: CountryBits & { slug: string; name?: string; price: string; rate: string; related?: string[] },
): FinanceTool {
  const name = bits.name ?? `${bits.country} Stamp Duty Calculator`;
  return t(
    bits.slug,
    name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Stamp duty`,
    name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Transfer / stamp duty as price × rate. Type the rate your state or land registry uses.`,
    [name.toLowerCase(), `stamp duty calculator ${bits.country.toLowerCase()}`],
    "property-tax",
    bits.currency,
    [
      { key: "value", label: "Property price", def: bits.price },
      { key: "rate", label: "Duty rate", suffix: "%", def: bits.rate },
    ],
    bits.related ?? ["loan-emi-calculator"],
  );
}

export function makeCrypto(
  bits: CountryBits & { slug: string; rate: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    `${bits.country} Crypto Tax Calculator`,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Crypto`,
    `${bits.country} crypto tax calculator`,
    `Gain × the rate you pick. Confirm whether your country treats crypto as income or capital gains.`,
    [`crypto tax calculator ${bits.country.toLowerCase()}`, "crypto tax calculator"],
    "us-capital-gains",
    bits.currency,
    [
      { key: "gain", label: "Taxable gain", def: "10000" },
      { key: "rate", label: "Tax rate", suffix: "%", def: bits.rate },
    ],
    bits.related ?? ["investment-return-calculator"],
  );
}

export function makeEos(
  bits: CountryBits & { slug: string; salary: string; years?: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    `${bits.country} Gratuity / EOS Calculator`,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Gratuity`,
    `${bits.country} end-of-service calculator`,
    `21 days’ wage per year for the first five years, 30 days after, on the monthly wage you type. Confirm local labour law.`,
    [`${bits.country.toLowerCase()} gratuity calculator`, `end of service calculator ${bits.country.toLowerCase()}`],
    "eos",
    bits.currency,
    [
      { key: "salary", label: "Monthly basic wage", def: bits.salary },
      { key: "years", label: "Years of service", def: bits.years ?? "6" },
    ],
    bits.related ?? ["loan-emi-calculator"],
  );
}

export function makeSip(
  bits: CountryBits & { slug: string; name: string; monthly: string; rate: string; years: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    bits.name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Invest`,
    bits.name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Monthly contributions grown at an assumed annual return.`,
    [bits.name.toLowerCase()],
    "sip",
    bits.currency,
    [
      { key: "monthly", label: "Monthly amount", def: bits.monthly },
      { key: "rate", label: "Expected return", suffix: "%", def: bits.rate },
      { key: "years", label: "Years", def: bits.years },
    ],
    bits.related ?? ["compound-interest-calculator", "investment-return-calculator"],
  );
}

export function makeFd(
  bits: CountryBits & { slug: string; name: string; principal: string; rate: string; years: string; related?: string[] },
): FinanceTool {
  return t(
    bits.slug,
    bits.name,
    bits.country,
    bits.countrySlug,
    `${bits.country}  /  Deposit`,
    bits.name.replace(/ Calculator$/i, "").toLowerCase() + " calculator",
    `Maturity value with the compounding frequency you type.`,
    [bits.name.toLowerCase()],
    "fd",
    bits.currency,
    [
      { key: "principal", label: "Deposit", def: bits.principal },
      { key: "rate", label: "Interest rate", suffix: "%", def: bits.rate },
      { key: "years", label: "Years", def: bits.years },
      { key: "frequency", label: "Compounds per year", def: "4" },
    ],
    bits.related ?? ["compound-interest-calculator"],
  );
}
