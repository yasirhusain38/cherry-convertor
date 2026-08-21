export type DocumentSpec = {
  id: string;
  label: string;
  defaultBytes: number;
  locked?: boolean;
  notes: string;
};

export const DOCUMENT_SPECS: DocumentSpec[] = [
  {
    id: "compress-pdf",
    label: "Compress PDF",
    defaultBytes: 2 * 1024 * 1024,
    notes: "Drop a PDF or photos of pages. We rebuild a smaller PDF in this browser.",
  },
  {
    id: "compress-pdf-to-2mb",
    label: "Compress PDF to 2MB",
    defaultBytes: 2 * 1024 * 1024,
    locked: true,
    notes: "Visa, university, and bank portals often reject files over 2 MB.",
  },
  {
    id: "compress-bank-statement",
    label: "Compress bank statement",
    defaultBytes: 2 * 1024 * 1024,
    notes: "Phone photos or a PDF statement. Output is a PDF at or under the cap you set.",
  },
  {
    id: "compress-pdf-to-200kb",
    label: "Compress PDF to 200KB",
    defaultBytes: 200 * 1024,
    locked: true,
    notes: "Strict embassy and job portals. Pages are rebuilt as JPEG so the whole PDF fits 200 KB.",
  },
  {
    id: "compress-pdf-to-500kb",
    label: "Compress PDF to 500KB",
    defaultBytes: 500 * 1024,
    locked: true,
    notes: "A common KYC and university attachment ceiling.",
  },
  {
    id: "compress-pdf-to-1mb",
    label: "Compress PDF to 1MB",
    defaultBytes: 1024 * 1024,
    locked: true,
    notes: "Email and many visa checklists stop at 1 MB per file.",
  },
  {
    id: "compress-marksheet",
    label: "Compress marksheet / degree",
    defaultBytes: 500 * 1024,
    notes: "Scan or photograph each page of a marksheet, transcript, or degree. Output is one PDF.",
  },
  {
    id: "compress-utility-bill",
    label: "Compress utility bill",
    defaultBytes: 500 * 1024,
    notes: "Proof-of-address scans (electricity, water, gas, broadband) for KYC and visas.",
  },
  {
    id: "compress-payslip",
    label: "Compress payslip / salary certificate",
    defaultBytes: 500 * 1024,
    notes: "UAE, UK, and embassy income proofs. Photos or PDF — rebuilt under your cap.",
  },
  {
    id: "compress-pcc",
    label: "Compress police clearance",
    defaultBytes: 500 * 1024,
    notes: "PCC / police certificate scans for visa packs. Photos or PDF, rebuilt under your cap.",
  },
  {
    id: "compress-tenancy",
    label: "Compress tenancy / Ejari",
    defaultBytes: 1024 * 1024,
    notes: "Tenancy contracts, Ejari, lease scans for UAE and UK proof of address.",
  },
  {
    id: "compress-birth-certificate",
    label: "Compress birth certificate",
    defaultBytes: 500 * 1024,
    notes: "Birth certificate scans for passports, visas, and school admissions.",
  },
  {
    id: "compress-employment-letter",
    label: "Compress employment / experience letter",
    defaultBytes: 500 * 1024,
    notes: "Experience letters, relieving letters, and contracts for job and visa files.",
  },
  {
    id: "compress-marriage-certificate",
    label: "Compress marriage certificate",
    defaultBytes: 500 * 1024,
    notes: "Marriage certificate scans for visas, passports, and name-change files.",
  },
  {
    id: "compress-medical-certificate",
    label: "Compress medical certificate",
    defaultBytes: 1024 * 1024,
    notes: "Medical reports, fitness certificates, and vaccination letters for visas and jobs.",
  },
  {
    id: "compress-itr",
    label: "Compress ITR / tax return",
    defaultBytes: 1024 * 1024,
    notes: "Income-tax return PDFs for visas, loans, and university financial proofs.",
  },
  {
    id: "compress-form-16",
    label: "Compress Form 16",
    defaultBytes: 500 * 1024,
    notes: "Indian Form 16 / TDS certificates for visa and loan attachments.",
  },
  {
    id: "compress-resume",
    label: "Compress resume / CV",
    defaultBytes: 500 * 1024,
    notes: "Resume or CV PDFs for job portals that cap attachments at 500 KB.",
  },
  {
    id: "compress-offer-letter",
    label: "Compress offer letter",
    defaultBytes: 500 * 1024,
    notes: "Job offer and appointment letters for visa and HR onboarding portals.",
  },
  {
    id: "compress-vaccine-certificate",
    label: "Compress vaccine certificate",
    defaultBytes: 300 * 1024,
    notes: "COVID / vaccination certificates. Many travel forms want a small JPEG or PDF.",
  },
  {
    id: "compress-rent-agreement",
    label: "Compress rent agreement",
    defaultBytes: 1024 * 1024,
    notes: "Indian rent agreements and lease scans for KYC, visas, and address proof.",
  },
  {
    id: "compress-passport-scan",
    label: "Compress passport scan",
    defaultBytes: 500 * 1024,
    notes: "Passport biodata-page scans for visas, KYC, and university portals.",
  },
];

export function getDocumentSpec(id: string): DocumentSpec {
  return DOCUMENT_SPECS.find((item) => item.id === id) ?? DOCUMENT_SPECS[0];
}
