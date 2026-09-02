import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { kitFilename } from "./ats-kit";
import { formatResume, resumeLines, resumePlainText, themeOf, type AtsResume } from "./ats-resume";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function halfPt(pt: number): number {
  return Math.round(pt * 2);
}

function pdfSafe(text: string): string {
  return text.replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/•/g, "-");
}

export function resumeTxt(resume: AtsResume): Blob {
  return new Blob([resumePlainText(resume)], { type: "text/plain;charset=utf-8" });
}

export function resumePdf(raw: AtsResume): Blob {
  const resume = formatResume(raw);
  const theme = themeOf(resume);
  const pdf = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = theme.marginIn * 72;
  const maxW = pageW - margin * 2;
  const font = theme.pdfFont;
  const headCenter = theme.align === "center";
  let y = margin;

  const ensure = (need: number) => {
    if (y + need > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const styleOf = (bold: boolean, italic: boolean) =>
    bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";

  const write = (text: string, bold: boolean, size: number, alignCenter = false, italic = false) => {
    pdf.setFont(font, styleOf(bold, italic));
    pdf.setFontSize(size);
    const chunks = pdf.splitTextToSize(pdfSafe(text), maxW) as string[];
    const lh = Math.max(theme.linePt, size + 3);
    for (const chunk of chunks) {
      ensure(lh);
      if (alignCenter) pdf.text(chunk, pageW / 2, y, { align: "center" });
      else pdf.text(chunk, margin, y);
      y += lh;
    }
  };

  for (const line of resumeLines(resume, "file")) {
    switch (line.kind) {
      case "name":
        write(line.text, true, theme.namePt, headCenter);
        y -= 2;
        break;
      case "role":
        write(line.text, false, theme.rolePt, headCenter);
        break;
      case "contact":
        write(line.text, false, theme.bodyPt - 0.5, headCenter);
        break;
      case "heading":
        y += theme.headingGapPt;
        ensure(theme.linePt + 8);
        pdf.setFont(font, "bold");
        pdf.setFontSize(theme.headingPt);
        pdf.text(pdfSafe(line.text.toUpperCase()), margin, y);
        y += 4;
        pdf.setDrawColor(17);
        pdf.setLineWidth(theme.id === "executive" ? 1.15 : 0.7);
        pdf.line(margin, y, margin + maxW, y);
        y += theme.linePt - 2;
        break;
      case "body":
        write(line.text, false, theme.bodyPt);
        break;
      case "split": {
        pdf.setFont(font, "bold");
        pdf.setFontSize(theme.bodyPt + 0.5);
        const dateW = line.right ? pdf.getTextWidth(pdfSafe(line.right)) + 14 : 0;
        const chunks = pdf.splitTextToSize(pdfSafe(line.left), Math.max(120, maxW - dateW)) as string[];
        ensure(theme.linePt);
        pdf.text(chunks[0] || "", margin, y);
        if (line.right) {
          pdf.setFont(font, "normal");
          pdf.text(pdfSafe(line.right), pageW - margin, y, { align: "right" });
        }
        y += theme.linePt;
        pdf.setFont(font, "bold");
        for (const extra of chunks.slice(1)) {
          ensure(theme.linePt);
          pdf.text(extra, margin, y);
          y += theme.linePt;
        }
        break;
      }
      case "meta":
        write(line.text, false, theme.bodyPt - 0.5, false, true);
        break;
      case "bullet": {
        pdf.setFont(font, "normal");
        pdf.setFontSize(theme.bodyPt);
        const chunks = pdf.splitTextToSize(pdfSafe(`-  ${line.text}`), maxW - 8) as string[];
        for (const chunk of chunks) {
          ensure(theme.linePt);
          pdf.text(chunk, margin + 6, y);
          y += theme.linePt;
        }
        break;
      }
    }
  }

  return pdf.output("blob");
}

export async function resumeDocx(raw: AtsResume): Promise<Blob> {
  const resume = formatResume(raw);
  const theme = themeOf(resume);
  const font = theme.wordFont;
  const margin = Math.round(theme.marginIn * 1440);
  const contentW = 12240 - margin * 2;
  const after = theme.id === "compact" ? 40 : theme.id === "executive" ? 100 : 80;
  const beforeH = theme.id === "compact" ? 120 : theme.id === "executive" ? 200 : 160;

  const rPr = (size: number, bold = false, italic = false) =>
    `<w:rPr>${bold ? "<w:b/>" : ""}${italic ? "<w:i/>" : ""}<w:sz w:val="${halfPt(size)}"/><w:szCs w:val="${halfPt(size)}"/><w:rFonts w:ascii="${esc(font)}" w:hAnsi="${esc(font)}" w:cs="${esc(font)}"/></w:rPr>`;

  const run = (text: string, size: number, bold = false, italic = false) =>
    `<w:r>${rPr(size, bold, italic)}<w:t xml:space="preserve">${esc(text || " ")}</w:t></w:r>`;

  const p = (inner: string, extraPPr = "") => {
    const spacing = extraPPr.includes("<w:spacing") ? "" : `<w:spacing w:after="${after}"/>`;
    return `<w:p><w:pPr>${spacing}${extraPPr}</w:pPr>${inner}</w:p>`;
  };

  const jc = theme.align === "center" ? `<w:jc w:val="center"/>` : "";

  const parts: string[] = [];
  for (const line of resumeLines(resume, "file")) {
    switch (line.kind) {
      case "name":
        parts.push(p(run(line.text, theme.namePt, true), jc));
        break;
      case "role":
        parts.push(p(run(line.text, theme.rolePt), jc));
        break;
      case "contact":
        parts.push(p(run(line.text, theme.bodyPt - 0.5), jc));
        break;
      case "heading":
        parts.push(
          p(
            run(line.text.toUpperCase(), theme.headingPt, true),
            `<w:spacing w:before="${beforeH}" w:after="60"/><w:pBdr><w:bottom w:val="single" w:sz="${theme.id === "executive" ? "16" : "10"}" w:space="1" w:color="111111"/></w:pBdr>`,
          ),
        );
        break;
      case "body":
        parts.push(p(run(line.text, theme.bodyPt)));
        break;
      case "split":
        parts.push(
          p(
            `${run(line.left, theme.bodyPt + 0.5, true)}${line.right ? `<w:r>${rPr(theme.bodyPt)}<w:tab/></w:r>${run(line.right, theme.bodyPt)}` : ""}`,
            `<w:tabs><w:tab w:val="right" w:pos="${contentW}"/></w:tabs>`,
          ),
        );
        break;
      case "meta":
        parts.push(p(run(line.text, theme.bodyPt - 0.5, false, true)));
        break;
      case "bullet":
        parts.push(
          p(
            run(`•  ${line.text}`, theme.bodyPt),
            `<w:ind w:left="288" w:hanging="180"/>`,
          ),
        );
        break;
    }
  }

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${parts.join("\n")}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}"/></w:sectPr>
</w:body>
</w:document>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults>
<w:rPrDefault><w:rPr><w:rFonts w:ascii="${esc(font)}" w:hAnsi="${esc(font)}" w:cs="${esc(font)}"/><w:sz w:val="${halfPt(theme.bodyPt)}"/><w:szCs w:val="${halfPt(theme.bodyPt)}"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="${after}" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault>
</w:docDefaults>
</w:styles>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );
  zip.file("word/styles.xml", styles);
  zip.file("word/document.xml", document);
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function fileBase(resume: AtsResume): string {
  return kitFilename(resume);
}
