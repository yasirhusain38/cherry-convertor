import { WORLD_FINANCE_TOOLS } from "./finance-world";
import { emiFields, t, type FinanceField, type FinanceTool } from "./finance-helpers";

export type { FinanceField, FinanceTool };

const CORE_FINANCE_TOOLS: FinanceTool[] = [
  t("compound-interest-calculator", "Compound Interest Calculator", "Global", "global", "Finance  /  Interest", "Compound interest calculator", "Principal, rate, compounding frequency, optional monthly add-on, and a year-by-year table.", ["compound interest calculator"], "compound", "USD", [
    { key: "principal", label: "Principal", def: "10000" },
    { key: "rate", label: "Annual rate", suffix: "%", def: "8" },
    { key: "years", label: "Years", def: "10" },
    { key: "frequency", label: "Compounds", kind: "select", def: "12", options: [
      { value: "1", label: "Annually" }, { value: "2", label: "Half-yearly" }, { value: "4", label: "Quarterly" }, { value: "12", label: "Monthly" }, { value: "365", label: "Daily" },
    ] },
    { key: "contribution", label: "Monthly contribution", def: "0" },
  ], ["percentage-calculator", "inflation-calculator", "loan-emi-calculator"]),
  t("percentage-calculator", "Percentage Calculator", "Global", "global", "Finance  /  Percent", "Percentage calculator", "Percent of a number, increase/decrease, and percent change between two numbers.", ["percentage calculator"], "percentage", "USD", [
    { key: "base", label: "Number", def: "2500" },
    { key: "percent", label: "Percent", suffix: "%", def: "18" },
    { key: "compare", label: "Second number (optional)", def: "4000" },
  ], ["compound-interest-calculator", "gst-calculator-india", "currency-converter"]),
  t("currency-converter", "Currency Converter", "Global", "global", "Finance  /  FX", "Live currency converter", "Pick any two currencies, swap, and convert with live mid-market rates. 150+ currencies. Amount never leaves this tab.", ["currency converter", "live exchange rate", "usd to inr", "eur to inr", "gbp to usd", "aed to inr"], "currency", "", [
    { key: "amount", label: "Amount", def: "100" },
  ], ["percentage-calculator", "inflation-calculator", "loan-emi-calculator"], [
    { q: "Are the rates live?", a: "Yes. The pair is refreshed from live market feeds (Yahoo Finance when available, otherwise Coinbase) about every 30 seconds. Banks still add a spread, so cash payouts differ." },
    { q: "Is my amount uploaded?", a: "No. Only a public rate table is downloaded. The figure you type never leaves this browser tab." },
    { q: "Which currencies can I convert?", a: "Major and regional currencies — USD, EUR, GBP, INR, AED, JPY, and 150+ more. Search by code or name in From / To." },
  ]),
  t("inflation-calculator", "Inflation Calculator", "Global", "global", "Finance  /  Inflation", "Inflation calculator", "Future cost and past purchasing power from an annual inflation rate.", ["inflation calculator"], "inflation", "USD", [
    { key: "amount", label: "Amount today", def: "10000" },
    { key: "rate", label: "Inflation rate", suffix: "%", def: "6" },
    { key: "years", label: "Years", def: "10" },
    { key: "mode", label: "Direction", kind: "select", def: "future", options: [
      { value: "future", label: "What it will cost later" }, { value: "past", label: "What it was worth before" },
    ] },
  ], ["compound-interest-calculator", "investment-return-calculator"]),
  t("loan-emi-calculator", "EMI / Loan Calculator", "Global", "global", "Finance  /  EMI", "EMI / loan calculator", "Monthly instalment, total interest, and total payment for any currency.", ["emi calculator", "loan calculator"], "emi", "USD", emiFields("25000", "9"), ["india-home-loan-emi", "us-mortgage-calculator", "uk-mortgage-calculator"]),
  t("budget-calculator", "Budget Calculator", "Global", "global", "Finance  /  Budget", "Monthly budget calculator", "Needs, wants, and savings vs the 50/30/20 guide. Runs on this device.", ["budget calculator"], "budget", "USD", [
    { key: "income", label: "Monthly income", def: "5000" },
    { key: "housing", label: "Rent / EMI", def: "1500" },
    { key: "food", label: "Food", def: "600" },
    { key: "living", label: "Utilities", def: "250" },
    { key: "transport", label: "Transport", def: "300" },
    { key: "other", label: "Wants / other", def: "400" },
    { key: "savings", label: "Planned savings", def: "800" },
  ], ["india-take-home-salary", "us-paycheck-calculator"]),
  t("investment-return-calculator", "Investment Return Calculator", "Global", "global", "Finance  /  CAGR", "CAGR / investment return calculator", "Absolute gain and compound annual growth from start and end values.", ["cagr calculator", "investment return calculator"], "investment-return", "USD", [
    { key: "principal", label: "Amount invested", def: "10000" },
    { key: "final", label: "Value today", def: "18500" },
    { key: "years", label: "Years held", def: "5" },
  ], ["compound-interest-calculator", "india-sip-calculator", "simple-interest-calculator"]),
  t("discount-calculator", "Discount Calculator", "Global", "global", "Finance  /  Retail", "Discount calculator", "Sale price and amount saved from a list price and percent off.", ["discount calculator", "sale price calculator"], "discount", "USD", [
    { key: "amount", label: "List price", def: "199" },
    { key: "percent", label: "Discount", suffix: "%", def: "20" },
  ], ["profit-margin-calculator", "markup-calculator", "percentage-calculator"]),
  t("profit-margin-calculator", "Profit Margin Calculator", "Global", "global", "Finance  /  Margin", "Profit margin calculator", "Profit, margin %, and markup % from cost and selling price.", ["profit margin calculator", "margin calculator"], "profit-margin", "USD", [
    { key: "cost", label: "Cost", def: "80" },
    { key: "price", label: "Selling price", def: "120" },
  ], ["markup-calculator", "break-even-calculator", "discount-calculator"]),
  t("markup-calculator", "Markup Calculator", "Global", "global", "Finance  /  Markup", "Markup calculator", "Selling price from cost and markup percent.", ["markup calculator", "cost plus markup"], "markup", "USD", [
    { key: "cost", label: "Cost", def: "80" },
    { key: "percent", label: "Markup", suffix: "%", def: "50" },
  ], ["profit-margin-calculator", "discount-calculator", "break-even-calculator"]),
  t("break-even-calculator", "Break-even Calculator", "Global", "global", "Finance  /  Break-even", "Break-even calculator", "Units you need to sell to cover fixed costs.", ["break even calculator", "breakeven point"], "break-even", "USD", [
    { key: "fixed", label: "Fixed costs", def: "25000" },
    { key: "price", label: "Price per unit", def: "40" },
    { key: "variable", label: "Variable cost per unit", def: "18" },
  ], ["profit-margin-calculator", "markup-calculator", "gst-invoice-calculator"]),
  t("gst-invoice-calculator", "GST Invoice Calculator", "Global", "global", "Finance  /  GST invoice", "GST invoice calculator", "Taxable value, CGST/SGST or IGST, and invoice total. India rates as a starting point.", ["gst invoice calculator", "gst bill calculator"], "gst-invoice", "₹", [
    { key: "amount", label: "Taxable amount (per unit)", def: "1000" },
    { key: "qty", label: "Quantity", def: "1" },
    { key: "rate", label: "GST rate", kind: "select", def: "18", options: [
      { value: "5", label: "5%" }, { value: "12", label: "12%" }, { value: "18", label: "18%" }, { value: "28", label: "28%" },
    ] },
    { key: "supply", label: "Supply", kind: "select", def: "intra", options: [
      { value: "intra", label: "Intra-state (CGST + SGST)" }, { value: "inter", label: "Inter-state (IGST)" },
    ] },
  ], ["gst-calculator-india", "profit-margin-calculator", "percentage-calculator"]),
  t("simple-interest-calculator", "Simple Interest Calculator", "Global", "global", "Finance  /  Interest", "Simple interest calculator", "P × R × T ÷ 100. Maturity = principal + interest.", ["simple interest calculator", "si calculator"], "simple-interest", "USD", [
    { key: "principal", label: "Principal", def: "10000" },
    { key: "rate", label: "Annual rate", suffix: "%", def: "8" },
    { key: "years", label: "Time (years)", def: "3" },
  ], ["compound-interest-calculator", "investment-return-calculator", "loan-emi-calculator"]),
  t("loan-to-value-calculator", "Loan-to-Value Calculator", "Global", "global", "Finance  /  LTV", "Loan-to-value calculator", "Loan amount divided by property value. Lenders often cap LTV.", ["ltv calculator", "loan to value"], "ltv", "USD", [
    { key: "principal", label: "Loan amount", def: "400000" },
    { key: "value", label: "Property value", def: "500000" },
  ], ["debt-to-income-calculator", "loan-emi-calculator", "rent-vs-buy-calculator"]),
  t("debt-to-income-calculator", "Debt-to-Income Ratio", "Global", "global", "Finance  /  DTI", "Debt-to-income ratio calculator", "Monthly debt payments ÷ monthly gross income. A common underwriting screen.", ["dti calculator", "debt to income ratio"], "dti", "USD", [
    { key: "debt", label: "Monthly debt payments", def: "1800" },
    { key: "income", label: "Monthly gross income", def: "6000" },
  ], ["loan-to-value-calculator", "budget-calculator", "net-worth-calculator"]),
  t("net-worth-calculator", "Net Worth Calculator", "Global", "global", "Finance  /  Net worth", "Net worth calculator", "Assets minus liabilities. Figures stay in this tab.", ["net worth calculator", "assets minus liabilities"], "net-worth", "USD", [
    { key: "cash", label: "Cash / bank", def: "15000" },
    { key: "investments", label: "Investments", def: "80000" },
    { key: "property", label: "Home / property", def: "350000" },
    { key: "other", label: "Other assets", def: "10000" },
    { key: "mortgage", label: "Mortgage balance", def: "220000" },
    { key: "loans", label: "Other loans", def: "12000" },
    { key: "cards", label: "Credit cards", def: "2500" },
  ], ["budget-calculator", "debt-to-income-calculator", "savings-goal-calculator"]),
  t("savings-goal-calculator", "Savings Goal Calculator", "Global", "global", "Finance  /  Savings", "Savings goal calculator", "Months to hit a target with a monthly deposit and optional return.", ["savings goal calculator", "how long to save"], "savings-goal", "USD", [
    { key: "target", label: "Goal", def: "20000" },
    { key: "principal", label: "Already saved", def: "2500" },
    { key: "monthly", label: "Monthly save", def: "400" },
    { key: "rate", label: "Annual return", suffix: "%", def: "4" },
  ], ["retirement-calculator", "compound-interest-calculator", "budget-calculator"]),
  t("retirement-calculator", "Retirement Calculator", "Global", "global", "Finance  /  Retirement", "Retirement calculator", "Corpus from current savings plus monthly contributions, then a withdrawal rule of thumb.", ["retirement calculator", "retirement corpus calculator"], "retirement", "USD", [
    { key: "principal", label: "Current savings", def: "50000" },
    { key: "monthly", label: "Monthly contribution", def: "500" },
    { key: "rate", label: "Expected return", suffix: "%", def: "7" },
    { key: "years", label: "Years to retirement", def: "25" },
    { key: "withdraw", label: "Withdrawal rate", suffix: "%", def: "4" },
  ], ["savings-goal-calculator", "us-401k-calculator", "india-nps-calculator"]),
  t("rent-vs-buy-calculator", "Rent vs Buy Calculator", "Global", "global", "Finance  /  Housing", "Rent vs buy calculator", "Compare renting with investing the down payment vs buying on a mortgage over a horizon. Prices assumed flat.", ["rent vs buy", "rent or buy calculator"], "rent-vs-buy", "USD", [
    { key: "rent", label: "Monthly rent", def: "1800" },
    { key: "price", label: "Home price", def: "400000" },
    { key: "principal", label: "Down payment", def: "80000" },
    { key: "rate", label: "Mortgage rate", suffix: "%", def: "6.5" },
    { key: "tenure", label: "Loan tenure", suffix: "years", def: "30" },
    { key: "years", label: "Horizon", suffix: "years", def: "7" },
    { key: "taxRate", label: "Property tax", suffix: "% / yr", def: "1.1" },
    { key: "maintain", label: "Maintenance", suffix: "% / yr", def: "1" },
    { key: "invest", label: "If renting, invest down payment at", suffix: "%", def: "7" },
  ], ["loan-to-value-calculator", "loan-emi-calculator", "us-mortgage-calculator"]),
  t("fuel-cost-calculator", "Fuel Cost Calculator", "Global", "global", "Finance  /  Fuel", "Fuel cost calculator", "Trip fuel from distance, economy, and price. Kilometres/litres or miles/MPG.", ["fuel cost calculator", "gas cost calculator", "trip fuel calculator"], "fuel-cost", "USD", [
    { key: "distance", label: "Distance (one way)", def: "120" },
    { key: "trips", label: "Trips (1 = one way, 2 = return)", def: "2" },
    { key: "economy", label: "Economy", def: "14" },
    { key: "price", label: "Fuel price", def: "1.4" },
    { key: "unit", label: "Units", kind: "select", def: "kml", options: [
      { value: "kml", label: "Kilometres, km per litre" },
      { value: "mpg", label: "Miles per gallon" },
    ] },
  ], ["budget-calculator", "percentage-calculator", "discount-calculator"]),

  t("india-emi-calculator", "India EMI Calculator", "India", "india", "India  /  EMI", "EMI calculator (India)", "Home, car, and personal loan EMI in rupees. Principal, rate, tenure.", ["emi calculator india", "home loan emi"], "emi", "₹", emiFields("4000000", "8.5"), ["india-home-loan-emi", "india-fd-calculator", "loan-emi-calculator"]),
  t("india-home-loan-emi", "India Home Loan EMI Calculator", "India", "india", "India  /  Home loan", "Home loan EMI calculator", "Housing-loan instalment with total interest over the full tenure.", ["home loan emi calculator", "housing loan emi"], "emi", "₹", emiFields("7500000", "8.4"), ["india-emi-calculator", "india-income-tax-calculator"]),
  t("india-sip-calculator", "India SIP Calculator", "India", "india", "India  /  SIP", "SIP calculator", "Monthly SIP corpus at an assumed annual return. Mutual-fund planning.", ["sip calculator", "mutual fund sip calculator"], "sip", "₹", [
    { key: "monthly", label: "Monthly SIP", def: "10000" },
    { key: "rate", label: "Expected return", suffix: "%", def: "12" },
    { key: "years", label: "Years", def: "15" },
  ], ["india-fd-calculator", "india-ppf-calculator", "india-nps-calculator"]),
  t("india-fd-calculator", "India FD Calculator", "India", "india", "India  /  FD", "Fixed deposit calculator", "Maturity value with quarterly or monthly compounding.", ["fd calculator", "fixed deposit calculator"], "fd", "₹", [
    { key: "principal", label: "Deposit", def: "200000" },
    { key: "rate", label: "Interest rate", suffix: "%", def: "7.1" },
    { key: "years", label: "Years", def: "5" },
    { key: "frequency", label: "Compounds per year", def: "4" },
  ], ["india-rd-calculator", "india-ppf-calculator"]),
  t("india-rd-calculator", "India RD Calculator", "India", "india", "India  /  RD", "Recurring deposit calculator", "Monthly RD maturity using the common quarterly-compounding formula.", ["rd calculator", "recurring deposit calculator"], "rd", "₹", [
    { key: "monthly", label: "Monthly deposit", def: "5000" },
    { key: "rate", label: "Interest rate", suffix: "%", def: "6.5" },
    { key: "years", label: "Years", def: "5" },
  ], ["india-fd-calculator", "india-sip-calculator"]),
  t("india-ppf-calculator", "India PPF Calculator", "India", "india", "India  /  PPF", "PPF calculator (15 years)", "Public Provident Fund maturity with annual deposits.", ["ppf calculator"], "ppf", "₹", [
    { key: "yearly", label: "Yearly deposit", def: "150000" },
    { key: "rate", label: "PPF rate", suffix: "%", def: "7.1" },
  ], ["india-epf-calculator", "india-nps-calculator"]),
  t("gst-calculator-india", "India GST Calculator", "India", "india", "India  /  GST", "GST calculator (5%, 12%, 18%, 28%)", "Add or remove GST. Inclusive and exclusive modes.", ["gst calculator", "gst calculator india"], "gst", "₹", [
    { key: "amount", label: "Amount", def: "10000" },
    { key: "rate", label: "GST rate", kind: "select", def: "18", options: [
      { value: "5", label: "5%" }, { value: "12", label: "12%" }, { value: "18", label: "18%" }, { value: "28", label: "28%" },
    ] },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Before GST" }, { value: "inclusive", label: "Includes GST" },
    ] },
  ], ["india-tds-calculator", "percentage-calculator"]),
  t("india-income-tax-calculator", "India Income Tax Calculator", "India", "india", "India  /  Tax", "Income tax calculator (new regime)", "FY 2025–26 new-regime slabs with rebate up to ₹12 lakh and 4% cess.", ["income tax calculator india", "new regime tax calculator"], "india-tax", "₹", [
    { key: "income", label: "Annual taxable income", def: "1200000" },
    { key: "deduction", label: "Standard / other deduction", def: "75000" },
  ], ["india-take-home-salary", "india-hra-calculator", "india-tds-calculator"]),
  t("india-hra-calculator", "India HRA Calculator", "India", "india", "India  /  HRA", "HRA exemption calculator", "Least of actual HRA, 50%/40% of basic, and rent minus 10% of basic.", ["hra calculator", "hra exemption calculator"], "hra", "₹", [
    { key: "basic", label: "Annual basic salary", def: "600000" },
    { key: "hra", label: "HRA received", def: "240000" },
    { key: "rent", label: "Annual rent paid", def: "300000" },
    { key: "metro", label: "Metro city", kind: "select", def: "yes", options: [
      { value: "yes", label: "Metro (50%)" }, { value: "no", label: "Non-metro (40%)" },
    ] },
  ], ["india-income-tax-calculator", "india-take-home-salary"]),
  t("india-tds-calculator", "India TDS Calculator", "India", "india", "India  /  TDS", "TDS calculator", "Withholding at 1%, 2%, 10%, 20%, or any rate you type.", ["tds calculator"], "tds", "₹", [
    { key: "amount", label: "Payment amount", def: "100000" },
    { key: "rate", label: "TDS rate", suffix: "%", def: "10" },
  ], ["gst-calculator-india", "india-income-tax-calculator"]),
  t("india-epf-calculator", "India EPF Calculator", "India", "india", "India  /  EPF", "EPF / provident fund calculator", "12% employee + 12% employer of basic, compounded at the EPF rate you type.", ["epf calculator", "pf calculator"], "epf", "₹", [
    { key: "basic", label: "Monthly basic + DA", def: "40000" },
    { key: "rate", label: "Interest rate", suffix: "%", def: "8.25" },
    { key: "years", label: "Years", def: "20" },
  ], ["india-nps-calculator", "india-ppf-calculator", "india-gratuity-calculator"]),
  t("india-nps-calculator", "India NPS Calculator", "India", "india", "India  /  NPS", "NPS calculator", "Monthly contribution grown at an assumed return until retirement.", ["nps calculator"], "nps", "₹", [
    { key: "principal", label: "Current corpus", def: "0" },
    { key: "monthly", label: "Monthly contribution", def: "5000" },
    { key: "rate", label: "Expected return", suffix: "%", def: "10" },
    { key: "years", label: "Years to retirement", def: "25" },
  ], ["india-epf-calculator", "india-sip-calculator"]),
  t("india-gratuity-calculator", "India Gratuity Calculator", "India", "india", "India  /  Gratuity", "Gratuity calculator", "15/26 × last drawn salary × years, capped at ₹20 lakh.", ["gratuity calculator"], "gratuity", "₹", [
    { key: "salary", label: "Last drawn monthly salary (basic + DA)", def: "50000" },
    { key: "years", label: "Completed years", def: "10" },
  ], ["india-epf-calculator", "india-take-home-salary"]),
  t("india-take-home-salary", "India Take-home Salary Calculator", "India", "india", "India  /  Salary", "Take-home salary calculator", "New-regime tax, 4% cess, and 12% EPF on basic. Monthly in-hand estimate.", ["take home salary calculator", "in hand salary calculator"], "india-takehome", "₹", [
    { key: "income", label: "Annual CTC / gross", def: "1200000" },
    { key: "basic", label: "Annual basic (optional)", def: "600000" },
  ], ["india-income-tax-calculator", "india-hra-calculator"]),
  t("india-capital-gains-calculator", "India Capital Gains Calculator", "India", "india", "India  /  LTCG", "Capital gains tax calculator", "Listed-equity LTCG at 12.5% after the exemption you type (default ₹1.25 lakh).", ["capital gains calculator india", "ltcg calculator"], "india-ltcg", "₹", [
    { key: "gain", label: "Capital gain", def: "300000" },
    { key: "exemption", label: "Exemption", def: "125000" },
    { key: "rate", label: "Tax rate", suffix: "%", def: "12.5" },
  ], ["india-income-tax-calculator", "investment-return-calculator"]),

  t("us-mortgage-calculator", "US Mortgage Calculator", "United States", "united-states", "United States  /  Mortgage", "US mortgage calculator", "Monthly P&I, total interest, and total paid. Standard 30-year default.", ["mortgage calculator", "home loan calculator usa"], "emi", "$", emiFields("400000", "6.5"), ["us-auto-loan-calculator", "us-paycheck-calculator"]),
  t("us-auto-loan-calculator", "US Auto Loan Calculator", "United States", "united-states", "United States  /  Auto", "Auto loan calculator", "Car-loan EMI in dollars.", ["auto loan calculator", "car payment calculator"], "emi", "$", [
    { key: "principal", label: "Loan amount", def: "35000" },
    { key: "rate", label: "APR", suffix: "%", def: "7.2" },
    { key: "years", label: "Years", def: "5" },
  ], ["us-mortgage-calculator", "loan-emi-calculator"]),
  t("us-federal-income-tax", "US Federal Income Tax Calculator", "United States", "united-states", "United States  /  Tax", "Federal income tax calculator", "TY 2025 brackets, standard deduction. Single or married filing jointly.", ["federal income tax calculator", "us tax calculator"], "us-federal-tax", "$", [
    { key: "income", label: "Annual taxable income", def: "85000" },
    { key: "status", label: "Filing status", kind: "select", def: "single", options: [
      { value: "single", label: "Single" }, { value: "married", label: "Married filing jointly" },
    ] },
  ], ["us-paycheck-calculator", "us-capital-gains-calculator"]),
  t("us-paycheck-calculator", "US Paycheck Calculator", "United States", "united-states", "United States  /  Paycheck", "Take-home paycheck calculator", "Federal income tax plus Social Security 6.2% and Medicare 1.45%.", ["paycheck calculator", "take home pay calculator usa"], "us-paycheck", "$", [
    { key: "income", label: "Annual gross", def: "85000" },
    { key: "status", label: "Filing status", kind: "select", def: "single", options: [
      { value: "single", label: "Single" }, { value: "married", label: "Married filing jointly" },
    ] },
  ], ["us-federal-income-tax", "us-401k-calculator"]),
  t("us-401k-calculator", "US 401(k) Calculator", "United States", "united-states", "United States  /  401(k)", "401(k) calculator", "Monthly contributions grown to retirement at an assumed return.", ["401k calculator", "401 k calculator"], "us-401k", "$", [
    { key: "principal", label: "Current balance", def: "25000" },
    { key: "monthly", label: "Monthly contribution", def: "500" },
    { key: "rate", label: "Expected return", suffix: "%", def: "7" },
    { key: "years", label: "Years", def: "30" },
  ], ["us-roth-ira-calculator", "us-paycheck-calculator"]),
  t("us-roth-ira-calculator", "US Roth IRA Calculator", "United States", "united-states", "United States  /  Roth IRA", "Roth IRA calculator", "After-tax contributions compounded to retirement.", ["roth ira calculator"], "us-401k", "$", [
    { key: "principal", label: "Current balance", def: "15000" },
    { key: "monthly", label: "Monthly contribution", def: "500" },
    { key: "rate", label: "Expected return", suffix: "%", def: "7" },
    { key: "years", label: "Years", def: "25" },
  ], ["us-401k-calculator", "compound-interest-calculator"]),
  t("us-capital-gains-calculator", "US Capital Gains Tax Calculator", "United States", "united-states", "United States  /  CGT", "Capital gains tax calculator", "Pick 0%, 15%, or 20% long-term federal rate.", ["capital gains calculator usa"], "us-capital-gains", "$", [
    { key: "gain", label: "Long-term gain", def: "20000" },
    { key: "rate", label: "Federal rate", kind: "select", def: "15", options: [
      { value: "0", label: "0%" }, { value: "15", label: "15%" }, { value: "20", label: "20%" },
    ] },
  ], ["us-federal-income-tax", "investment-return-calculator"]),
  t("us-sales-tax-calculator", "US Sales Tax Calculator", "United States", "united-states", "United States  /  Sales tax", "Sales tax calculator", "Type the combined state + local rate. No portrait, no upload.", ["sales tax calculator"], "vat", "$", [
    { key: "amount", label: "Amount", def: "100" },
    { key: "rate", label: "Sales tax rate", suffix: "%", def: "7.25" },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Before tax" }, { value: "inclusive", label: "Includes tax" },
    ] },
  ], ["percentage-calculator", "us-federal-income-tax"]),

  t("uk-stamp-duty-calculator", "UK Stamp Duty Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  SDLT", "Stamp duty land tax calculator", "England & NI residential SDLT, with optional first-home relief.", ["stamp duty calculator", "sdlt calculator"], "uk-stamp-duty", "£", [
    { key: "price", label: "Property price", def: "450000" },
    { key: "first", label: "First-time buyer", kind: "select", def: "no", options: [
      { value: "no", label: "No" }, { value: "yes", label: "Yes" },
    ] },
  ], ["uk-mortgage-calculator", "uk-income-tax-calculator"]),
  t("uk-mortgage-calculator", "UK Mortgage Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  Mortgage", "UK mortgage calculator", "Monthly repayment on a sterling home loan.", ["uk mortgage calculator", "repayment mortgage calculator"], "emi", "£", emiFields("350000", "4.5"), ["uk-stamp-duty-calculator", "uk-take-home-salary"]),
  t("uk-income-tax-calculator", "UK Income Tax Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  Tax", "UK income tax calculator", "England/NI 2025–26 bands and personal allowance taper.", ["uk income tax calculator", "paye calculator"], "uk-income-tax", "£", [
    { key: "income", label: "Annual income", def: "45000" },
  ], ["uk-national-insurance", "uk-take-home-salary"]),
  t("uk-national-insurance", "UK National Insurance Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  NI", "National Insurance calculator", "Class 1 employee NI at 8% / 2%.", ["national insurance calculator"], "uk-ni", "£", [
    { key: "income", label: "Annual income", def: "45000" },
  ], ["uk-income-tax-calculator", "uk-take-home-salary"]),
  t("uk-take-home-salary", "UK Take-home Salary Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  Salary", "UK take-home salary calculator", "Income tax plus employee National Insurance. Monthly in-hand.", ["uk take home calculator", "uk salary calculator"], "uk-takehome", "£", [
    { key: "income", label: "Annual gross", def: "45000" },
  ], ["uk-income-tax-calculator", "uk-student-loan-calculator"]),
  t("uk-vat-calculator", "UK VAT Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  VAT", "VAT calculator (20%)", "Add or strip UK standard-rate VAT. Type 5 or 0 if you need a reduced rate.", ["vat calculator uk"], "vat", "£", [
    { key: "amount", label: "Amount", def: "1000" },
    { key: "rate", label: "VAT rate", suffix: "%", def: "20" },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Ex VAT" }, { value: "inclusive", label: "Inc VAT" },
    ] },
  ], ["percentage-calculator", "uk-income-tax-calculator"]),
  t("uk-student-loan-calculator", "UK Student Loan Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  Student loan", "Student loan repayment calculator", "Plan 1, 2, 4, or 5 — 9% above the threshold.", ["student loan calculator uk"], "uk-student-loan", "£", [
    { key: "income", label: "Annual income", def: "35000" },
    { key: "plan", label: "Plan", kind: "select", def: "2", options: [
      { value: "1", label: "Plan 1" }, { value: "2", label: "Plan 2" }, { value: "4", label: "Plan 4 (Scotland)" }, { value: "5", label: "Plan 5" },
    ] },
  ], ["uk-take-home-salary", "uk-income-tax-calculator"]),
  t("uk-pension-calculator", "UK Pension Calculator", "United Kingdom", "united-kingdom", "United Kingdom  /  Pension", "Workplace pension calculator", "Monthly contributions grown at an assumed return.", ["uk pension calculator"], "uk-pension", "£", [
    { key: "principal", label: "Current pot", def: "20000" },
    { key: "monthly", label: "Monthly contribution", def: "300" },
    { key: "rate", label: "Expected return", suffix: "%", def: "5" },
    { key: "years", label: "Years", def: "30" },
  ], ["uk-take-home-salary", "compound-interest-calculator"]),

  t("canada-mortgage-calculator", "Canada Mortgage Calculator", "Canada", "canada", "Canada  /  Mortgage", "Canada mortgage calculator", "Monthly payment on a Canadian home loan.", ["canada mortgage calculator"], "emi", "C$", emiFields("550000", "5.2"), ["loan-emi-calculator", "canada-rrsp-calculator"]),
  t("canada-rrsp-calculator", "Canada RRSP Calculator", "Canada", "canada", "Canada  /  RRSP", "RRSP calculator", "Monthly RRSP contributions compounded to retirement.", ["rrsp calculator"], "retirement", "C$", [
    { key: "principal", label: "Current RRSP", def: "30000" },
    { key: "monthly", label: "Monthly contribution", def: "400" },
    { key: "rate", label: "Expected return", suffix: "%", def: "6" },
    { key: "years", label: "Years", def: "25" },
  ], ["canada-mortgage-calculator", "compound-interest-calculator"]),
  t("canada-gst-hst-calculator", "Canada GST/HST Calculator", "Canada", "canada", "Canada  /  GST", "GST / HST calculator", "5% GST or 13–15% HST. Type the rate for your province.", ["gst calculator canada", "hst calculator"], "vat", "C$", [
    { key: "amount", label: "Amount", def: "100" },
    { key: "rate", label: "GST/HST rate", suffix: "%", def: "13" },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Before tax" }, { value: "inclusive", label: "Includes tax" },
    ] },
  ], ["percentage-calculator"]),

  t("australia-mortgage-calculator", "Australia Mortgage Calculator", "Australia", "australia", "Australia  /  Mortgage", "Australia home-loan calculator", "Monthly repayment in Australian dollars.", ["australia mortgage calculator", "home loan calculator australia"], "emi", "A$", emiFields("650000", "6.1"), ["australia-gst-calculator", "loan-emi-calculator"]),
  t("australia-gst-calculator", "Australia GST Calculator", "Australia", "australia", "Australia  /  GST", "GST calculator (10%)", "Add or remove 10% GST.", ["gst calculator australia"], "vat", "A$", [
    { key: "amount", label: "Amount", def: "220" },
    { key: "rate", label: "GST rate", suffix: "%", def: "10" },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Ex GST" }, { value: "inclusive", label: "Inc GST" },
    ] },
  ], ["percentage-calculator"]),
  t("australia-super-calculator", "Australia Super Calculator", "Australia", "australia", "Australia  /  Super", "Superannuation calculator", "SG contributions grown at an assumed return.", ["super calculator australia"], "retirement", "A$", [
    { key: "principal", label: "Current super", def: "80000" },
    { key: "monthly", label: "Monthly contribution", def: "600" },
    { key: "rate", label: "Expected return", suffix: "%", def: "6" },
    { key: "years", label: "Years", def: "25" },
  ], ["australia-mortgage-calculator"]),

  t("uae-vat-calculator", "UAE VAT Calculator", "United Arab Emirates", "uae", "UAE  /  VAT", "UAE VAT calculator (5%)", "Add or strip 5% UAE VAT.", ["uae vat calculator", "vat calculator dubai"], "vat", "AED ", [
    { key: "amount", label: "Amount", def: "1000" },
    { key: "rate", label: "VAT rate", suffix: "%", def: "5" },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Ex VAT" }, { value: "inclusive", label: "Inc VAT" },
    ] },
  ], ["uae-gratuity-calculator", "percentage-calculator"]),
  t("uae-gratuity-calculator", "UAE Gratuity Calculator", "United Arab Emirates", "uae", "UAE  /  Gratuity", "UAE end-of-service gratuity calculator", "Uses 21 days’ pay per year for the first five years, 30 days after, on the wage you type. Confirm UAE Labour Law for your contract.", ["uae gratuity calculator", "end of service calculator uae"], "eos", "AED ", [
    { key: "salary", label: "Monthly basic wage", def: "8000" },
    { key: "years", label: "Years of service", def: "6" },
  ], ["uae-vat-calculator", "loan-emi-calculator"]),
  t("uae-mortgage-calculator", "UAE Mortgage Calculator", "United Arab Emirates", "uae", "UAE  /  Mortgage", "UAE mortgage calculator", "Monthly payment on an AED home loan.", ["uae mortgage calculator", "dubai mortgage calculator"], "emi", "AED ", emiFields("1500000", "4.5"), ["uae-vat-calculator", "loan-emi-calculator"]),

  t("singapore-gst-calculator", "Singapore GST Calculator", "Singapore", "singapore", "Singapore  /  GST", "GST calculator (9%)", "Add or strip 9% GST.", ["gst calculator singapore"], "vat", "S$", [
    { key: "amount", label: "Amount", def: "100" },
    { key: "rate", label: "GST rate", suffix: "%", def: "9" },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Before GST" }, { value: "inclusive", label: "Includes GST" },
    ] },
  ], ["singapore-cpf-calculator"]),
  t("singapore-cpf-calculator", "Singapore CPF Calculator", "Singapore", "singapore", "Singapore  /  CPF", "CPF contribution calculator", "Type monthly wage and an employee rate (default 20%).", ["cpf calculator"], "tds", "S$", [
    { key: "amount", label: "Monthly wage", def: "4500" },
    { key: "rate", label: "Employee rate", suffix: "%", def: "20" },
  ], ["singapore-gst-calculator", "loan-emi-calculator"]),

  t("germany-vat-calculator", "Germany VAT Calculator", "Germany", "germany", "Germany  /  MwSt", "VAT calculator (19%)", "German MwSt 19% (type 7 for reduced).", ["mwst rechner", "germany vat calculator"], "vat", "€", [
    { key: "amount", label: "Amount", def: "100" },
    { key: "rate", label: "VAT rate", suffix: "%", def: "19" },
    { key: "mode", label: "Amount is", kind: "select", def: "exclusive", options: [
      { value: "exclusive", label: "Netto" }, { value: "inclusive", label: "Brutto" },
    ] },
  ], ["germany-mortgage-calculator"]),
  t("germany-mortgage-calculator", "Germany Mortgage Calculator", "Germany", "germany", "Germany  /  Mortgage", "Immobilienkredit calculator", "Monthly repayment on a euro mortgage.", ["immobilienkredit rechner", "germany mortgage calculator"], "emi", "€", emiFields("350000", "3.6"), ["germany-vat-calculator", "loan-emi-calculator"]),
];

export const FINANCE_TOOLS: FinanceTool[] = [...CORE_FINANCE_TOOLS, ...WORLD_FINANCE_TOOLS];

export function getFinanceTool(slug: string): FinanceTool | undefined {
  return FINANCE_TOOLS.find((item) => item.slug === slug);
}

export function financeToolsForCountry(countrySlug: string): FinanceTool[] {
  const local = FINANCE_TOOLS.filter((item) => item.countrySlug === countrySlug);
  const global = FINANCE_TOOLS.filter((item) => item.countrySlug === "global");
  return [...local, ...global];
}

export function financeCountries(): string[] {
  return [...new Set(FINANCE_TOOLS.filter((item) => item.countrySlug !== "global").map((item) => item.country))];
}
