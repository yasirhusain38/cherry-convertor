import {
  makeCrypto,
  makeEos,
  makeFd,
  makeLoan,
  makeMortgage,
  makePriceSlab,
  makeProperty,
  makeRetirement,
  makeSip,
  makeSlab,
  makeStamp,
  makeTakehome,
  makeVat,
  makeWithholding,
  t,
  type FinanceTool,
} from "./finance-helpers";

const ca = { country: "Canada", countrySlug: "canada", currency: "C$" };
const au = { country: "Australia", countrySlug: "australia", currency: "A$" };
const sg = { country: "Singapore", countrySlug: "singapore", currency: "S$" };
const de = { country: "Germany", countrySlug: "germany", currency: "€" };
const us = { country: "United States", countrySlug: "united-states", currency: "$" };
const uk = { country: "United Kingdom", countrySlug: "united-kingdom", currency: "£" };
const inBits = { country: "India", countrySlug: "india", currency: "₹" };
const ae = { country: "United Arab Emirates", countrySlug: "uae", currency: "AED " };
const mx = { country: "Mexico", countrySlug: "mexico", currency: "MX$" };
const fr = { country: "France", countrySlug: "france", currency: "€" };
const es = { country: "Spain", countrySlug: "spain", currency: "€" };
const it = { country: "Italy", countrySlug: "italy", currency: "€" };
const nl = { country: "Netherlands", countrySlug: "netherlands", currency: "€" };
const ie = { country: "Ireland", countrySlug: "ireland", currency: "€" };
const ch = { country: "Switzerland", countrySlug: "switzerland", currency: "CHF " };
const se = { country: "Sweden", countrySlug: "sweden", currency: "kr " };
const pl = { country: "Poland", countrySlug: "poland", currency: "zł " };
const pt = { country: "Portugal", countrySlug: "portugal", currency: "€" };
const be = { country: "Belgium", countrySlug: "belgium", currency: "€" };
const at = { country: "Austria", countrySlug: "austria", currency: "€" };
const no = { country: "Norway", countrySlug: "norway", currency: "kr " };
const dk = { country: "Denmark", countrySlug: "denmark", currency: "kr " };
const fi = { country: "Finland", countrySlug: "finland", currency: "€" };
const cz = { country: "Czechia", countrySlug: "czechia", currency: "Kč " };
const gr = { country: "Greece", countrySlug: "greece", currency: "€" };
const hu = { country: "Hungary", countrySlug: "hungary", currency: "Ft " };
const ro = { country: "Romania", countrySlug: "romania", currency: "lei " };
const tr = { country: "Turkey", countrySlug: "turkey", currency: "₺" };
const sa = { country: "Saudi Arabia", countrySlug: "saudi-arabia", currency: "SAR " };
const qa = { country: "Qatar", countrySlug: "qatar", currency: "QAR " };
const kw = { country: "Kuwait", countrySlug: "kuwait", currency: "KD " };
const bh = { country: "Bahrain", countrySlug: "bahrain", currency: "BD " };
const om = { country: "Oman", countrySlug: "oman", currency: "OMR " };
const il = { country: "Israel", countrySlug: "israel", currency: "₪" };
const pk = { country: "Pakistan", countrySlug: "pakistan", currency: "Rs " };
const bd = { country: "Bangladesh", countrySlug: "bangladesh", currency: "৳" };
const lk = { country: "Sri Lanka", countrySlug: "sri-lanka", currency: "Rs " };
const np = { country: "Nepal", countrySlug: "nepal", currency: "Rs " };
const jp = { country: "Japan", countrySlug: "japan", currency: "¥" };
const kr = { country: "South Korea", countrySlug: "south-korea", currency: "₩" };
const cn = { country: "China", countrySlug: "china", currency: "CN¥" };
const hk = { country: "Hong Kong", countrySlug: "hong-kong", currency: "HK$" };
const my = { country: "Malaysia", countrySlug: "malaysia", currency: "RM " };
const id = { country: "Indonesia", countrySlug: "indonesia", currency: "Rp " };
const ph = { country: "Philippines", countrySlug: "philippines", currency: "₱" };
const th = { country: "Thailand", countrySlug: "thailand", currency: "฿" };
const vn = { country: "Vietnam", countrySlug: "vietnam", currency: "₫" };
const tw = { country: "Taiwan", countrySlug: "taiwan", currency: "NT$" };
const za = { country: "South Africa", countrySlug: "south-africa", currency: "R " };
const ng = { country: "Nigeria", countrySlug: "nigeria", currency: "₦" };
const ke = { country: "Kenya", countrySlug: "kenya", currency: "KSh " };
const gh = { country: "Ghana", countrySlug: "ghana", currency: "GH₵ " };
const ma = { country: "Morocco", countrySlug: "morocco", currency: "MAD " };
const eg = { country: "Egypt", countrySlug: "egypt", currency: "E£" };
const br = { country: "Brazil", countrySlug: "brazil", currency: "R$ " };
const ar = { country: "Argentina", countrySlug: "argentina", currency: "AR$ " };
const cl = { country: "Chile", countrySlug: "chile", currency: "CLP " };
const co = { country: "Colombia", countrySlug: "colombia", currency: "COL$ " };
const pe = { country: "Peru", countrySlug: "peru", currency: "S/ " };
const nz = { country: "New Zealand", countrySlug: "new-zealand", currency: "NZ$" };

export const WORLD_FINANCE_TOOLS: FinanceTool[] = [
  makeCrypto({ ...inBits, slug: "india-crypto-tax-calculator", rate: "30", related: ["india-capital-gains-calculator"] }),
  makeCrypto({ ...us, slug: "us-crypto-tax-calculator", rate: "15", related: ["us-capital-gains-calculator"] }),
  makeProperty({ ...us, slug: "us-property-tax-calculator", value: "400000", rate: "1.1", related: ["us-mortgage-calculator"] }),
  makeLoan({ ...us, slug: "us-student-loan-calculator", name: "US Student Loan Calculator", principal: "35000", rate: "6.5", years: "10", related: ["us-paycheck-calculator"] }),
  makeCrypto({ ...uk, slug: "uk-crypto-tax-calculator", rate: "18", related: ["uk-income-tax-calculator"] }),
  makeProperty({ ...uk, slug: "uk-council-tax-calculator", name: "UK Council Tax Calculator", value: "280000", rate: "0.5", related: ["uk-stamp-duty-calculator"] }),
  makeRetirement({ ...uk, slug: "uk-isa-calculator", name: "UK ISA Calculator", principal: "15000", monthly: "300", rate: "5", years: "20", related: ["uk-pension-calculator"] }),
  makeTakehome({ ...ae, slug: "uae-take-home-salary", incomeDef: "180000", taxRate: "0", socialRate: "0", related: ["uae-gratuity-calculator"] }),
  makeLoan({ ...ae, slug: "uae-personal-loan-calculator", name: "UAE Personal Loan Calculator", principal: "80000", rate: "7.5", years: "4", related: ["uae-mortgage-calculator"] }),

  makeSlab({ ...ca, slug: "canada-income-tax-calculator", pack: "canada-federal-2025", incomeDef: "85000", related: ["canada-gst-hst-calculator"] }),
  makeTakehome({ ...ca, slug: "canada-take-home-salary", incomeDef: "85000", taxRate: "22", socialRate: "7.6", socialLabel: "CPP + EI (approx.)", related: ["canada-income-tax-calculator"] }),
  makeRetirement({ ...ca, slug: "canada-tfsa-calculator", name: "Canada TFSA Calculator", principal: "25000", monthly: "300", rate: "6", years: "20", related: ["canada-rrsp-calculator"] }),
  makeProperty({ ...ca, slug: "canada-property-tax-calculator", value: "650000", rate: "0.7", related: ["canada-mortgage-calculator"] }),
  makeStamp({ ...ca, slug: "canada-land-transfer-calculator", name: "Canada Land Transfer Tax Calculator", price: "650000", rate: "1.5", related: ["canada-mortgage-calculator"] }),

  makeSlab({ ...au, slug: "australia-income-tax-calculator", pack: "australia-2025", incomeDef: "95000", related: ["australia-gst-calculator"] }),
  makeTakehome({ ...au, slug: "australia-take-home-salary", incomeDef: "95000", taxRate: "24", socialRate: "0", related: ["australia-income-tax-calculator"] }),
  makeStamp({ ...au, slug: "australia-stamp-duty-calculator", price: "750000", rate: "4", related: ["australia-mortgage-calculator"] }),
  makeWithholding({ ...au, slug: "australia-hecs-calculator", name: "Australia HECS-HELP Calculator", amount: "95000", rate: "5", related: ["australia-take-home-salary"] }),
  makeCrypto({ ...au, slug: "australia-crypto-tax-calculator", rate: "32", related: ["australia-income-tax-calculator"] }),

  makeSlab({ ...sg, slug: "singapore-income-tax-calculator", pack: "singapore-ya2025", incomeDef: "72000", related: ["singapore-cpf-calculator"] }),
  makePriceSlab({
    ...sg,
    slug: "singapore-stamp-duty-calculator",
    pack: "sg-bsd",
    priceDef: "1200000",
    name: "Singapore Stamp Duty Calculator",
    kicker: "Singapore  /  BSD",
    lede: "Buyer’s stamp duty on residential property. ABSD is extra — confirm IRAS.",
    related: ["singapore-gst-calculator"],
  }),
  makeMortgage({ ...sg, slug: "singapore-mortgage-calculator", principal: "800000", rate: "3.2", related: ["singapore-stamp-duty-calculator"] }),
  makeTakehome({ ...sg, slug: "singapore-take-home-salary", incomeDef: "72000", taxRate: "7", socialRate: "20", socialLabel: "Employee CPF", related: ["singapore-cpf-calculator"] }),

  makeSlab({ ...de, slug: "germany-income-tax-calculator", pack: "germany-2025", incomeDef: "55000", related: ["germany-vat-calculator"] }),
  makeTakehome({ ...de, slug: "germany-take-home-salary", incomeDef: "55000", taxRate: "22", socialRate: "20", socialLabel: "Sozialabgaben (approx.)", related: ["germany-income-tax-calculator"] }),
  makeCrypto({ ...de, slug: "germany-crypto-tax-calculator", rate: "26.375", related: ["germany-income-tax-calculator"] }),

  makeVat({ ...mx, slug: "mexico-vat-calculator", rate: "16", label: "IVA", related: ["percentage-calculator"] }),
  makeMortgage({ ...mx, slug: "mexico-mortgage-calculator", principal: "1800000", rate: "11", related: ["mexico-vat-calculator"] }),
  makeSlab({ ...mx, slug: "mexico-income-tax-calculator", pack: "mexico-isr", incomeDef: "420000", name: "Mexico ISR Calculator", related: ["mexico-vat-calculator"] }),
  makeTakehome({ ...mx, slug: "mexico-take-home-salary", incomeDef: "420000", taxRate: "20", socialRate: "2.8", socialLabel: "IMSS employee", related: ["mexico-income-tax-calculator"] }),
  makeRetirement({ ...mx, slug: "mexico-afore-calculator", name: "Mexico AFORE Calculator", principal: "80000", monthly: "1500", rate: "5", years: "25", related: ["mexico-take-home-salary"] }),

  makeVat({ ...fr, slug: "france-vat-calculator", rate: "20", label: "TVA" }),
  makeMortgage({ ...fr, slug: "france-mortgage-calculator", principal: "280000", rate: "3.4" }),
  makeSlab({ ...fr, slug: "france-income-tax-calculator", pack: "france-2025", incomeDef: "42000" }),
  makeTakehome({ ...fr, slug: "france-take-home-salary", incomeDef: "42000", taxRate: "14", socialRate: "22", socialLabel: "Charges salariales" }),
  makeProperty({ ...fr, slug: "france-taxe-fonciere-calculator", name: "France Taxe Foncière Calculator", value: "280000", rate: "0.8" }),

  makeVat({ ...es, slug: "spain-vat-calculator", rate: "21", label: "IVA" }),
  makeMortgage({ ...es, slug: "spain-mortgage-calculator", principal: "220000", rate: "3.3" }),
  makeSlab({ ...es, slug: "spain-income-tax-calculator", pack: "spain-irpf", incomeDef: "38000", name: "Spain IRPF Calculator" }),
  makeTakehome({ ...es, slug: "spain-take-home-salary", incomeDef: "38000", taxRate: "18", socialRate: "6.5", socialLabel: "Seguridad Social" }),
  makeStamp({ ...es, slug: "spain-itp-calculator", name: "Spain ITP Calculator", price: "220000", rate: "6" }),

  makeVat({ ...it, slug: "italy-vat-calculator", rate: "22", label: "IVA" }),
  makeMortgage({ ...it, slug: "italy-mortgage-calculator", principal: "230000", rate: "3.5" }),
  makeSlab({ ...it, slug: "italy-income-tax-calculator", pack: "italy-irpef", incomeDef: "36000", name: "Italy IRPEF Calculator" }),
  makeTakehome({ ...it, slug: "italy-take-home-salary", incomeDef: "36000", taxRate: "23", socialRate: "9.5" }),
  makeProperty({ ...it, slug: "italy-imu-calculator", name: "Italy IMU Calculator", value: "230000", rate: "1.06" }),

  makeVat({ ...nl, slug: "netherlands-vat-calculator", rate: "21", label: "BTW" }),
  makeMortgage({ ...nl, slug: "netherlands-mortgage-calculator", principal: "380000", rate: "3.6" }),
  makeSlab({ ...nl, slug: "netherlands-income-tax-calculator", pack: "netherlands-box1", incomeDef: "48000", name: "Netherlands Box 1 Calculator" }),
  makeTakehome({ ...nl, slug: "netherlands-take-home-salary", incomeDef: "48000", taxRate: "37", socialRate: "0" }),

  makeVat({ ...ie, slug: "ireland-vat-calculator", rate: "23" }),
  makeMortgage({ ...ie, slug: "ireland-mortgage-calculator", principal: "340000", rate: "3.9" }),
  makeSlab({ ...ie, slug: "ireland-income-tax-calculator", pack: "ireland-income", incomeDef: "52000" }),
  t(
    "ireland-take-home-salary",
    "Ireland Take-home Salary Calculator",
    "Ireland",
    "ireland",
    "Ireland  /  Salary",
    "Ireland take-home salary calculator",
    "PAYE, USC, and PRSI for a single person. Tax credits sketched at €4,000.",
    ["ireland take home calculator", "usc calculator"],
    "ireland-takehome",
    "€",
    [{ key: "income", label: "Annual gross", def: "52000" }],
    ["ireland-income-tax-calculator", "ireland-mortgage-calculator"],
  ),
  makeStamp({ ...ie, slug: "ireland-stamp-duty-calculator", price: "380000", rate: "1" }),

  makeVat({ ...ch, slug: "switzerland-vat-calculator", rate: "8.1", label: "MWST" }),
  makeMortgage({ ...ch, slug: "switzerland-mortgage-calculator", principal: "900000", rate: "1.8" }),
  makeSlab({ ...ch, slug: "switzerland-income-tax-calculator", pack: "switzerland-fed", incomeDef: "120000", name: "Switzerland Federal Tax Calculator" }),
  makeTakehome({ ...ch, slug: "switzerland-take-home-salary", incomeDef: "120000", taxRate: "18", socialRate: "6.4", socialLabel: "AHV / IV / EO + ALV" }),

  makeVat({ ...se, slug: "sweden-vat-calculator", rate: "25", label: "Moms" }),
  makeMortgage({ ...se, slug: "sweden-mortgage-calculator", principal: "3200000", rate: "3.5" }),
  makeSlab({ ...se, slug: "sweden-income-tax-calculator", pack: "sweden-2025", incomeDef: "480000" }),
  makeTakehome({ ...se, slug: "sweden-take-home-salary", incomeDef: "480000", taxRate: "32", socialRate: "7" }),

  makeVat({ ...pl, slug: "poland-vat-calculator", rate: "23" }),
  makeMortgage({ ...pl, slug: "poland-mortgage-calculator", principal: "450000", rate: "7" }),
  makeSlab({ ...pl, slug: "poland-income-tax-calculator", pack: "poland-pit", incomeDef: "90000", name: "Poland PIT Calculator" }),
  makeTakehome({ ...pl, slug: "poland-take-home-salary", incomeDef: "90000", taxRate: "12", socialRate: "13.7" }),

  makeVat({ ...pt, slug: "portugal-vat-calculator", rate: "23", label: "IVA" }),
  makeMortgage({ ...pt, slug: "portugal-mortgage-calculator", principal: "220000", rate: "3.4" }),
  makeSlab({ ...pt, slug: "portugal-income-tax-calculator", pack: "portugal-irs", incomeDef: "28000", name: "Portugal IRS Calculator" }),
  makeStamp({ ...pt, slug: "portugal-imt-calculator", name: "Portugal IMT Calculator", price: "250000", rate: "6" }),
  makeTakehome({ ...pt, slug: "portugal-take-home-salary", incomeDef: "28000", taxRate: "23", socialRate: "11", socialLabel: "Segurança Social" }),

  makeVat({ ...be, slug: "belgium-vat-calculator", rate: "21", label: "TVA" }),
  makeMortgage({ ...be, slug: "belgium-mortgage-calculator", principal: "320000", rate: "3.3" }),
  makeSlab({ ...be, slug: "belgium-income-tax-calculator", pack: "belgium-2025", incomeDef: "45000" }),
  makeTakehome({ ...be, slug: "belgium-take-home-salary", incomeDef: "45000", taxRate: "38", socialRate: "13.07" }),

  makeVat({ ...at, slug: "austria-vat-calculator", rate: "20", label: "USt" }),
  makeMortgage({ ...at, slug: "austria-mortgage-calculator", principal: "350000", rate: "3.4" }),
  makeSlab({ ...at, slug: "austria-income-tax-calculator", pack: "austria-2025", incomeDef: "50000" }),
  makeTakehome({ ...at, slug: "austria-take-home-salary", incomeDef: "50000", taxRate: "28", socialRate: "18" }),

  makeVat({ ...no, slug: "norway-vat-calculator", rate: "25", label: "MVA" }),
  makeMortgage({ ...no, slug: "norway-mortgage-calculator", principal: "3800000", rate: "5" }),
  makeSlab({ ...no, slug: "norway-income-tax-calculator", pack: "norway-2025", incomeDef: "650000" }),
  makeTakehome({ ...no, slug: "norway-take-home-salary", incomeDef: "650000", taxRate: "25", socialRate: "7.8" }),

  makeVat({ ...dk, slug: "denmark-vat-calculator", rate: "25", label: "Moms" }),
  makeMortgage({ ...dk, slug: "denmark-mortgage-calculator", principal: "2500000", rate: "4" }),
  makeSlab({ ...dk, slug: "denmark-income-tax-calculator", pack: "denmark-2025", incomeDef: "450000" }),
  makeTakehome({ ...dk, slug: "denmark-take-home-salary", incomeDef: "450000", taxRate: "38", socialRate: "8", socialLabel: "AM-bidrag" }),

  makeVat({ ...fi, slug: "finland-vat-calculator", rate: "25.5", label: "ALV" }),
  makeMortgage({ ...fi, slug: "finland-mortgage-calculator", principal: "220000", rate: "3.5" }),
  makeSlab({ ...fi, slug: "finland-income-tax-calculator", pack: "finland-2025", incomeDef: "45000" }),
  makeTakehome({ ...fi, slug: "finland-take-home-salary", incomeDef: "45000", taxRate: "20", socialRate: "10.5" }),

  makeVat({ ...cz, slug: "czechia-vat-calculator", rate: "21", label: "DPH" }),
  makeMortgage({ ...cz, slug: "czechia-mortgage-calculator", principal: "4500000", rate: "5" }),
  makeSlab({ ...cz, slug: "czechia-income-tax-calculator", pack: "czechia-2025", incomeDef: "600000" }),
  makeTakehome({ ...cz, slug: "czechia-take-home-salary", incomeDef: "600000", taxRate: "15", socialRate: "11.6" }),

  makeVat({ ...gr, slug: "greece-vat-calculator", rate: "24", label: "FPA" }),
  makeMortgage({ ...gr, slug: "greece-mortgage-calculator", principal: "180000", rate: "4.2" }),
  makeSlab({ ...gr, slug: "greece-income-tax-calculator", pack: "greece-2025", incomeDef: "28000" }),
  makeTakehome({ ...gr, slug: "greece-take-home-salary", incomeDef: "28000", taxRate: "22", socialRate: "13.9" }),

  makeVat({ ...hu, slug: "hungary-vat-calculator", rate: "27", label: "ÁFA" }),
  makeMortgage({ ...hu, slug: "hungary-mortgage-calculator", principal: "40000000", rate: "6" }),
  makeSlab({ ...hu, slug: "hungary-income-tax-calculator", pack: "hungary-2025", incomeDef: "6000000" }),
  makeTakehome({ ...hu, slug: "hungary-take-home-salary", incomeDef: "6000000", taxRate: "15", socialRate: "18.5" }),

  makeVat({ ...ro, slug: "romania-vat-calculator", rate: "19", label: "TVA" }),
  makeMortgage({ ...ro, slug: "romania-mortgage-calculator", principal: "400000", rate: "6" }),
  makeSlab({ ...ro, slug: "romania-income-tax-calculator", pack: "romania-2025", incomeDef: "90000" }),
  makeTakehome({ ...ro, slug: "romania-take-home-salary", incomeDef: "90000", taxRate: "10", socialRate: "35", socialLabel: "CAS + CASS" }),

  makeVat({ ...tr, slug: "turkey-vat-calculator", rate: "20", label: "KDV" }),
  makeMortgage({ ...tr, slug: "turkey-mortgage-calculator", principal: "2500000", rate: "36" }),
  makeSlab({ ...tr, slug: "turkey-income-tax-calculator", pack: "turkey-gelir", incomeDef: "600000", name: "Turkey Gelir Vergisi Calculator" }),
  makeTakehome({ ...tr, slug: "turkey-take-home-salary", incomeDef: "600000", taxRate: "20", socialRate: "15" }),

  makeVat({ ...sa, slug: "saudi-vat-calculator", rate: "15" }),
  makeMortgage({ ...sa, slug: "saudi-mortgage-calculator", principal: "800000", rate: "5" }),
  makeEos({ ...sa, slug: "saudi-gratuity-calculator", salary: "8000" }),
  makeTakehome({ ...sa, slug: "saudi-take-home-salary", incomeDef: "120000", taxRate: "0", socialRate: "0" }),

  makeMortgage({ ...qa, slug: "qatar-mortgage-calculator", principal: "1500000", rate: "5" }),
  makeEos({ ...qa, slug: "qatar-gratuity-calculator", salary: "12000" }),
  makeLoan({ ...qa, slug: "qatar-personal-loan-calculator", name: "Qatar Personal Loan Calculator", principal: "100000", rate: "6", years: "4" }),

  makeMortgage({ ...kw, slug: "kuwait-mortgage-calculator", principal: "120000", rate: "4.5" }),
  makeEos({ ...kw, slug: "kuwait-indemnity-calculator", salary: "900" }),
  makeLoan({ ...kw, slug: "kuwait-personal-loan-calculator", name: "Kuwait Personal Loan Calculator", principal: "8000", rate: "4", years: "5" }),

  makeVat({ ...bh, slug: "bahrain-vat-calculator", rate: "10" }),
  makeMortgage({ ...bh, slug: "bahrain-mortgage-calculator", principal: "120000", rate: "5.5" }),
  makeEos({ ...bh, slug: "bahrain-gratuity-calculator", salary: "800" }),

  makeVat({ ...om, slug: "oman-vat-calculator", rate: "5" }),
  makeMortgage({ ...om, slug: "oman-mortgage-calculator", principal: "80000", rate: "5" }),
  makeEos({ ...om, slug: "oman-gratuity-calculator", salary: "700" }),

  makeVat({ ...il, slug: "israel-vat-calculator", rate: "18", label: "Ma'am" }),
  makeMortgage({ ...il, slug: "israel-mortgage-calculator", principal: "1600000", rate: "4.5" }),
  makeSlab({ ...il, slug: "israel-income-tax-calculator", pack: "israel-2025", incomeDef: "180000" }),
  makeTakehome({ ...il, slug: "israel-take-home-salary", incomeDef: "180000", taxRate: "20", socialRate: "7", socialLabel: "Bituah Leumi" }),

  makeVat({ ...pk, slug: "pakistan-gst-calculator", rate: "18", label: "GST" }),
  makeMortgage({ ...pk, slug: "pakistan-home-loan-calculator", principal: "8000000", rate: "16" }),
  makeSlab({ ...pk, slug: "pakistan-income-tax-calculator", pack: "pakistan-2025", incomeDef: "1800000" }),
  makeWithholding({ ...pk, slug: "pakistan-withholding-tax-calculator", name: "Pakistan Withholding Tax Calculator", amount: "100000", rate: "10" }),
  makeSip({ ...pk, slug: "pakistan-mutual-fund-calculator", name: "Pakistan Mutual Fund Calculator", monthly: "15000", rate: "12", years: "10" }),
  makeFd({ ...pk, slug: "pakistan-profit-rate-calculator", name: "Pakistan Saving / Profit Calculator", principal: "500000", rate: "11", years: "1" }),
  makeTakehome({ ...pk, slug: "pakistan-take-home-salary", incomeDef: "1800000", taxRate: "5", socialRate: "0" }),

  makeVat({ ...bd, slug: "bangladesh-vat-calculator", rate: "15", label: "VAT" }),
  makeMortgage({ ...bd, slug: "bangladesh-home-loan-calculator", principal: "5000000", rate: "9" }),
  makeSlab({ ...bd, slug: "bangladesh-income-tax-calculator", pack: "bangladesh-2025", incomeDef: "900000" }),
  makeFd({ ...bd, slug: "bangladesh-fdr-calculator", name: "Bangladesh FDR Calculator", principal: "200000", rate: "11", years: "1" }),
  makeSip({ ...bd, slug: "bangladesh-dps-calculator", name: "Bangladesh DPS Calculator", monthly: "5000", rate: "8", years: "10" }),
  makeTakehome({ ...bd, slug: "bangladesh-take-home-salary", incomeDef: "900000", taxRate: "10", socialRate: "0" }),

  makeVat({ ...lk, slug: "sri-lanka-vat-calculator", rate: "18" }),
  makeMortgage({ ...lk, slug: "sri-lanka-home-loan-calculator", principal: "8000000", rate: "12" }),
  makeSlab({ ...lk, slug: "sri-lanka-income-tax-calculator", pack: "sri-lanka-2025", incomeDef: "1800000" }),
  makeTakehome({ ...lk, slug: "sri-lanka-take-home-salary", incomeDef: "1800000", taxRate: "18", socialRate: "8", socialLabel: "EPF employee" }),

  makeVat({ ...np, slug: "nepal-vat-calculator", rate: "13" }),
  makeMortgage({ ...np, slug: "nepal-home-loan-calculator", principal: "5000000", rate: "10" }),
  makeSlab({ ...np, slug: "nepal-income-tax-calculator", pack: "nepal-2025", incomeDef: "800000" }),
  makeTakehome({ ...np, slug: "nepal-take-home-salary", incomeDef: "800000", taxRate: "10", socialRate: "0" }),

  makeVat({ ...jp, slug: "japan-vat-calculator", rate: "10", label: "Consumption tax" }),
  makeMortgage({ ...jp, slug: "japan-mortgage-calculator", principal: "35000000", rate: "1.2" }),
  makeSlab({ ...jp, slug: "japan-income-tax-calculator", pack: "japan-income", incomeDef: "6000000" }),
  makeTakehome({ ...jp, slug: "japan-take-home-salary", incomeDef: "6000000", taxRate: "10", socialRate: "15", socialLabel: "Shakai hoken" }),
  makeRetirement({ ...jp, slug: "japan-nenkin-calculator", name: "Japan Nenkin / Retirement Calculator", principal: "2000000", monthly: "20000", rate: "3", years: "25" }),

  makeVat({ ...kr, slug: "korea-vat-calculator", rate: "10" }),
  makeMortgage({ ...kr, slug: "korea-mortgage-calculator", principal: "300000000", rate: "3.8" }),
  makeSlab({ ...kr, slug: "korea-income-tax-calculator", pack: "korea-2025", incomeDef: "50000000" }),
  makeTakehome({ ...kr, slug: "korea-take-home-salary", incomeDef: "50000000", taxRate: "15", socialRate: "9.4" }),
  t(
    "korea-severance-calculator",
    "Korea Severance Pay Calculator",
    "South Korea",
    "south-korea",
    "South Korea  /  Severance",
    "Korea severance pay calculator",
    "One month of average wage per year of service (퇴직금). Confirm the Labour Standards Act definition of average wage.",
    ["퇴직금 계산기", "korea severance calculator"],
    "month-severance",
    "₩",
    [
      { key: "salary", label: "Average monthly wage", def: "4000000" },
      { key: "years", label: "Years of service", def: "8" },
    ],
    ["korea-take-home-salary", "korea-income-tax-calculator"],
  ),

  makeVat({ ...cn, slug: "china-vat-calculator", rate: "13" }),
  makeMortgage({ ...cn, slug: "china-mortgage-calculator", principal: "2000000", rate: "3.5" }),
  makeSlab({ ...cn, slug: "china-income-tax-calculator", pack: "china-iit", incomeDef: "180000", name: "China IIT Calculator" }),
  makeTakehome({ ...cn, slug: "china-take-home-salary", incomeDef: "180000", taxRate: "10", socialRate: "10.5", socialLabel: "Social insurance + housing fund (employee)" }),
  makeRetirement({ ...cn, slug: "china-housing-fund-calculator", name: "China Housing Provident Fund Calculator", principal: "50000", monthly: "2000", rate: "2", years: "15" }),

  makeStamp({ ...hk, slug: "hong-kong-stamp-duty-calculator", price: "8000000", rate: "3.75" }),
  makeMortgage({ ...hk, slug: "hong-kong-mortgage-calculator", principal: "6000000", rate: "3.5" }),
  makeSlab({ ...hk, slug: "hong-kong-salaries-tax-calculator", pack: "hk-salaries", incomeDef: "480000", name: "Hong Kong Salaries Tax Calculator" }),
  makeTakehome({ ...hk, slug: "hong-kong-take-home-salary", incomeDef: "480000", taxRate: "8", socialRate: "5", socialLabel: "MPF employee" }),
  makeRetirement({ ...hk, slug: "hong-kong-mpf-calculator", name: "Hong Kong MPF Calculator", principal: "200000", monthly: "1500", rate: "4", years: "25" }),

  makeVat({ ...my, slug: "malaysia-sst-calculator", rate: "8", label: "SST" }),
  makeMortgage({ ...my, slug: "malaysia-housing-loan-calculator", principal: "500000", rate: "4.2" }),
  makeSlab({ ...my, slug: "malaysia-income-tax-calculator", pack: "malaysia-2025", incomeDef: "72000", name: "Malaysia PCB / Income Tax Calculator" }),
  makeWithholding({ ...my, slug: "malaysia-pcb-calculator", name: "Malaysia PCB Calculator", amount: "6000", rate: "8" }),
  makeTakehome({ ...my, slug: "malaysia-take-home-salary", incomeDef: "72000", taxRate: "8", socialRate: "11", socialLabel: "EPF employee" }),
  makeRetirement({ ...my, slug: "malaysia-epf-calculator", name: "Malaysia EPF Calculator", principal: "40000", monthly: "550", rate: "5.5", years: "25" }),
  makeStamp({ ...my, slug: "malaysia-stamp-duty-calculator", price: "500000", rate: "2" }),

  makeVat({ ...id, slug: "indonesia-vat-calculator", rate: "12", label: "PPN" }),
  makeMortgage({ ...id, slug: "indonesia-kpr-calculator", principal: "500000000", rate: "6" }),
  makeSlab({ ...id, slug: "indonesia-income-tax-calculator", pack: "indonesia-pph", incomeDef: "120000000", name: "Indonesia PPh 21 Calculator" }),
  makeTakehome({ ...id, slug: "indonesia-take-home-salary", incomeDef: "120000000", taxRate: "15", socialRate: "3", socialLabel: "BPJS employee" }),
  makeRetirement({ ...id, slug: "indonesia-bpjs-calculator", name: "Indonesia BPJS / JHT Calculator", principal: "20000000", monthly: "400000", rate: "5", years: "20" }),

  makeVat({ ...ph, slug: "philippines-vat-calculator", rate: "12" }),
  makeMortgage({ ...ph, slug: "philippines-housing-loan-calculator", principal: "2500000", rate: "6.5" }),
  makeSlab({ ...ph, slug: "philippines-income-tax-calculator", pack: "ph-train", incomeDef: "480000" }),
  makeWithholding({ ...ph, slug: "philippines-withholding-tax-calculator", name: "Philippines Withholding Tax Calculator", amount: "40000", rate: "10" }),
  makeTakehome({ ...ph, slug: "philippines-take-home-salary", incomeDef: "480000", taxRate: "15", socialRate: "8", socialLabel: "SSS + PhilHealth + Pag-IBIG" }),
  makeRetirement({ ...ph, slug: "philippines-pagibig-calculator", name: "Philippines Pag-IBIG Calculator", principal: "50000", monthly: "2000", rate: "6", years: "20" }),

  makeVat({ ...th, slug: "thailand-vat-calculator", rate: "7" }),
  makeMortgage({ ...th, slug: "thailand-mortgage-calculator", principal: "3000000", rate: "5" }),
  makeSlab({ ...th, slug: "thailand-income-tax-calculator", pack: "thailand-pit", incomeDef: "600000" }),
  makeTakehome({ ...th, slug: "thailand-take-home-salary", incomeDef: "600000", taxRate: "10", socialRate: "5", socialLabel: "Social security" }),

  makeVat({ ...vn, slug: "vietnam-vat-calculator", rate: "10" }),
  makeMortgage({ ...vn, slug: "vietnam-mortgage-calculator", principal: "2000000000", rate: "8" }),
  makeSlab({ ...vn, slug: "vietnam-income-tax-calculator", pack: "vietnam-pit", incomeDef: "180000000" }),
  makeTakehome({ ...vn, slug: "vietnam-take-home-salary", incomeDef: "180000000", taxRate: "10", socialRate: "10.5" }),

  makeVat({ ...tw, slug: "taiwan-vat-calculator", rate: "5", label: "GST" }),
  makeMortgage({ ...tw, slug: "taiwan-mortgage-calculator", principal: "8000000", rate: "2.3" }),
  makeSlab({ ...tw, slug: "taiwan-income-tax-calculator", pack: "taiwan-2025", incomeDef: "720000" }),
  makeTakehome({ ...tw, slug: "taiwan-take-home-salary", incomeDef: "720000", taxRate: "12", socialRate: "7" }),

  makeVat({ ...za, slug: "south-africa-vat-calculator", rate: "15" }),
  makeMortgage({ ...za, slug: "south-africa-mortgage-calculator", principal: "1800000", rate: "11" }),
  makeSlab({ ...za, slug: "south-africa-income-tax-calculator", pack: "sa-2026", incomeDef: "480000" }),
  makeStamp({ ...za, slug: "south-africa-transfer-duty-calculator", name: "South Africa Transfer Duty Calculator", price: "1800000", rate: "3" }),
  makeTakehome({ ...za, slug: "south-africa-take-home-salary", incomeDef: "480000", taxRate: "26", socialRate: "1", socialLabel: "UIF" }),
  makeRetirement({ ...za, slug: "south-africa-retirement-calculator", name: "South Africa Retirement Annuity Calculator", principal: "150000", monthly: "2500", rate: "7", years: "25" }),

  makeVat({ ...ng, slug: "nigeria-vat-calculator", rate: "7.5" }),
  makeMortgage({ ...ng, slug: "nigeria-mortgage-calculator", principal: "25000000", rate: "18" }),
  makeSlab({ ...ng, slug: "nigeria-income-tax-calculator", pack: "nigeria-2025", incomeDef: "4800000", name: "Nigeria PAYE Calculator" }),
  makeTakehome({ ...ng, slug: "nigeria-take-home-salary", incomeDef: "4800000", taxRate: "15", socialRate: "8", socialLabel: "Pension" }),
  makeRetirement({ ...ng, slug: "nigeria-pension-calculator", name: "Nigeria Pension Calculator", principal: "500000", monthly: "32000", rate: "8", years: "25" }),

  makeVat({ ...ke, slug: "kenya-vat-calculator", rate: "16" }),
  makeMortgage({ ...ke, slug: "kenya-mortgage-calculator", principal: "5000000", rate: "14" }),
  makeSlab({ ...ke, slug: "kenya-income-tax-calculator", pack: "kenya-2025", incomeDef: "1200000", name: "Kenya PAYE Calculator" }),
  makeTakehome({ ...ke, slug: "kenya-take-home-salary", incomeDef: "1200000", taxRate: "25", socialRate: "8.5", socialLabel: "SHIF + NSSF + housing levy" }),
  makeRetirement({ ...ke, slug: "kenya-nssf-calculator", name: "Kenya NSSF Calculator", principal: "100000", monthly: "2160", rate: "6", years: "25" }),

  makeVat({ ...gh, slug: "ghana-vat-calculator", rate: "15" }),
  makeMortgage({ ...gh, slug: "ghana-mortgage-calculator", principal: "400000", rate: "22" }),
  makeSlab({ ...gh, slug: "ghana-income-tax-calculator", pack: "ghana-2025", incomeDef: "72000", name: "Ghana PAYE Calculator" }),
  makeTakehome({ ...gh, slug: "ghana-take-home-salary", incomeDef: "72000", taxRate: "17.5", socialRate: "5.5", socialLabel: "SSNIT" }),

  makeVat({ ...ma, slug: "morocco-vat-calculator", rate: "20", label: "TVA" }),
  makeMortgage({ ...ma, slug: "morocco-mortgage-calculator", principal: "800000", rate: "4.5" }),
  makeSlab({ ...ma, slug: "morocco-income-tax-calculator", pack: "morocco-2025", incomeDef: "120000" }),
  makeTakehome({ ...ma, slug: "morocco-take-home-salary", incomeDef: "120000", taxRate: "20", socialRate: "6.4", socialLabel: "CNSS" }),

  makeVat({ ...eg, slug: "egypt-vat-calculator", rate: "14" }),
  makeMortgage({ ...eg, slug: "egypt-mortgage-calculator", principal: "1500000", rate: "18" }),
  makeSlab({ ...eg, slug: "egypt-income-tax-calculator", pack: "egypt-2025", incomeDef: "180000" }),
  makeTakehome({ ...eg, slug: "egypt-take-home-salary", incomeDef: "180000", taxRate: "15", socialRate: "11" }),

  makeVat({ ...br, slug: "brazil-vat-calculator", rate: "17", label: "ICMS" }),
  makeMortgage({ ...br, slug: "brazil-financing-calculator", principal: "400000", rate: "9" }),
  makeSlab({ ...br, slug: "brazil-income-tax-calculator", pack: "brazil-irpf", incomeDef: "72000", name: "Brazil IRPF Calculator" }),
  makeTakehome({ ...br, slug: "brazil-take-home-salary", incomeDef: "72000", taxRate: "15", socialRate: "14", socialLabel: "INSS + FGTS sketch" }),
  makeProperty({ ...br, slug: "brazil-iptu-calculator", name: "Brazil IPTU Calculator", value: "400000", rate: "1" }),
  makeRetirement({ ...br, slug: "brazil-fgts-calculator", name: "Brazil FGTS Calculator", principal: "15000", monthly: "400", rate: "3", years: "20" }),

  makeVat({ ...ar, slug: "argentina-vat-calculator", rate: "21", label: "IVA" }),
  makeMortgage({ ...ar, slug: "argentina-mortgage-calculator", principal: "80000000", rate: "40" }),
  makeSlab({ ...ar, slug: "argentina-income-tax-calculator", pack: "argentina-2025", incomeDef: "15000000", name: "Argentina Ganancias Calculator" }),
  makeTakehome({ ...ar, slug: "argentina-take-home-salary", incomeDef: "15000000", taxRate: "20", socialRate: "17" }),

  makeVat({ ...cl, slug: "chile-vat-calculator", rate: "19", label: "IVA" }),
  makeMortgage({ ...cl, slug: "chile-mortgage-calculator", principal: "90000000", rate: "4.5" }),
  makeSlab({ ...cl, slug: "chile-income-tax-calculator", pack: "chile-2025", incomeDef: "18000000" }),
  makeTakehome({ ...cl, slug: "chile-take-home-salary", incomeDef: "18000000", taxRate: "8", socialRate: "17", socialLabel: "AFP + salud" }),

  makeVat({ ...co, slug: "colombia-vat-calculator", rate: "19", label: "IVA" }),
  makeMortgage({ ...co, slug: "colombia-mortgage-calculator", principal: "250000000", rate: "12" }),
  makeSlab({ ...co, slug: "colombia-income-tax-calculator", pack: "colombia-2025", incomeDef: "72000000" }),
  makeTakehome({ ...co, slug: "colombia-take-home-salary", incomeDef: "72000000", taxRate: "19", socialRate: "8" }),

  makeVat({ ...pe, slug: "peru-vat-calculator", rate: "18", label: "IGV" }),
  makeMortgage({ ...pe, slug: "peru-mortgage-calculator", principal: "250000", rate: "8" }),
  makeSlab({ ...pe, slug: "peru-income-tax-calculator", pack: "peru-2025", incomeDef: "48000" }),
  makeTakehome({ ...pe, slug: "peru-take-home-salary", incomeDef: "48000", taxRate: "8", socialRate: "13", socialLabel: "ONP / AFP" }),

  makeVat({ ...nz, slug: "new-zealand-gst-calculator", rate: "15", label: "GST" }),
  makeMortgage({ ...nz, slug: "new-zealand-mortgage-calculator", principal: "650000", rate: "6.2" }),
  makeSlab({ ...nz, slug: "new-zealand-income-tax-calculator", pack: "nz-2025", incomeDef: "78000" }),
  makeTakehome({ ...nz, slug: "new-zealand-take-home-salary", incomeDef: "78000", taxRate: "24", socialRate: "3", socialLabel: "KiwiSaver employee" }),
  makeRetirement({ ...nz, slug: "new-zealand-kiwisaver-calculator", name: "New Zealand KiwiSaver Calculator", principal: "40000", monthly: "250", rate: "5", years: "30" }),
];
