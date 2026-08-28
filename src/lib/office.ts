import JSZip from "jszip";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentTypes(parts: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package-relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
${parts}
</Types>`;
}

function rels(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${inner}</Relationships>`;
}

export async function textToDocx(pages: string[], title = "Cherry Converter"): Promise<Blob> {
  const paragraphs = pages.flatMap((page, index) => {
    const body = page.split(/\n/).map((line) => {
      const t = esc(line || " ");
      return `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
    });
    if (index < pages.length - 1) {
      body.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    }
    return body;
  });

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${paragraphs.join("\n")}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>
</w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    contentTypes(
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>`,
    ),
  );
  zip.file(
    "_rels/.rels",
    rels(
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>`,
    ),
  );
  zip.file("word/document.xml", document);
  zip.file(
    "docProps/core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${esc(title)}</dc:title>
<dc:creator>Cherry Converter</dc:creator>
</cp:coreProperties>`,
  );
  return zip.generateAsync({ type: "blob" });
}

export async function rowsToXlsx(sheets: Array<{ name: string; rows: string[][] }>): Promise<Blob> {
  const zip = new JSZip();
  const sheetOverrides = sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  zip.file(
    "[Content_Types].xml",
    contentTypes(
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheetOverrides}`,
    ),
  );
  zip.file(
    "_rels/.rels",
    rels(
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`,
    ),
  );
  const workbookSheets = sheets
    .map((sheet, i) => `<sheet name="${esc(sheet.name.slice(0, 31) || `Sheet${i + 1}`)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${workbookSheets}</sheets>
</workbook>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    rels(
      sheets
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
        )
        .join(""),
    ),
  );

  sheets.forEach((sheet, s) => {
    const sheetRows = sheet.rows
      .map((row, r) => {
        const cells = row
          .map((value, c) => {
            const col = colName(c);
            const text = esc(value ?? "");
            if (text && /^-?\d+(\.\d+)?$/.test(text)) {
              return `<c r="${col}${r + 1}"><v>${text}</v></c>`;
            }
            return `<c r="${col}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
          })
          .join("");
        return `<row r="${r + 1}">${cells}</row>`;
      })
      .join("");
    zip.file(
      `xl/worksheets/sheet${s + 1}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
    );
  });

  return zip.generateAsync({ type: "blob" });
}

function colName(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
