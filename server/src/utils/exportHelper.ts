import ExcelJS from 'exceljs';
import { Document as PDFDocument } from 'pdfkit';
import fs from 'fs';
import path from 'path';

export type ExportLang = 'ar' | 'en';

export interface ExportDataset {
  title: string;
  subtitle?: string;
  salonName?: string;
  lang: ExportLang;
  columns: string[];
  rows: (string | number)[][];
}

const FONT_DIR = (() => {
  const candidates = [process.cwd(), path.join(__dirname, '..', '..')];
  for (const base of candidates) {
    const dir = path.join(base, 'assets', 'fonts');
    if (fs.existsSync(path.join(dir, 'Tajawal-Regular.ttf'))) return dir;
  }
  return path.join(process.cwd(), 'assets', 'fonts');
})();

function fmtNumber(value: number, lang: ExportLang): string {
  return Number(value).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

function fmtDate(d: Date, lang: ExportLang): string {
  return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function buildExcel(dataset: ExportDataset): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = dataset.salonName ?? 'Mira';
  const sheet = workbook.addWorksheet(dataset.title, {
    views: [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 4,
        topLeftCell: 'A5',
        rightToLeft: dataset.lang === 'ar',
      },
    ],
  });

  const colCount = dataset.columns.length;
  const mainAlign = dataset.lang === 'ar' ? 'right' : 'left';
  const align = (horizontal: 'left' | 'right' | 'center') => ({
    horizontal,
    vertical: 'middle' as const,
  });

  // Row 1 — title band
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${dataset.salonName ?? 'Mira'} — ${dataset.title}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2185B' } };
  titleCell.alignment = align('center');
  sheet.getRow(1).height = 32;

  // Row 2 — subtitle
  sheet.mergeCells(2, 1, 2, colCount);
  const subCell = sheet.getCell(2, 1);
  subCell.value = dataset.subtitle ?? '';
  subCell.font = { size: 11, color: { argb: 'FF666666' } };
  subCell.alignment = align('center');
  sheet.getRow(2).height = 20;

  // Row 3 — spacer
  sheet.getRow(3).height = 8;

  // Row 4 — header
  const headerRow = sheet.getRow(4);
  headerRow.height = 22;
  dataset.columns.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF880E4F' } };
    cell.alignment = align(dataset.lang === 'ar' ? 'right' : 'center');
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFC2185B' } },
      bottom: { style: 'thin', color: { argb: 'FFC2185B' } },
    };
  });

  // Data rows
  dataset.rows.forEach((row, rIdx) => {
    const excelRow = sheet.getRow(5 + rIdx);
    excelRow.height = 20;
    row.forEach((value, cIdx) => {
      const cell = excelRow.getCell(cIdx + 1);
      cell.value = value;
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D5DB' } },
        left: { style: 'thin', color: { argb: 'FFE0D5DB' } },
        right: { style: 'thin', color: { argb: 'FFE0D5DB' } },
      };
      if (typeof value === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = align('right');
      } else {
        cell.alignment = align(mainAlign);
      }
      if (rIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6E7EE' } };
      }
    });
  });

  // Column widths (adaptive)
  for (let c = 1; c <= colCount; c++) {
    let len = dataset.columns[c - 1].length + 4;
    for (let r = 5; r < 5 + dataset.rows.length; r++) {
      const value = sheet.getRow(r).getCell(c).value;
      const strLen =
        typeof value === 'number'
          ? value.toLocaleString('en-US').length
          : String(value ?? '').length;
      len = Math.max(len, strLen + 4);
    }
    sheet.getColumn(c).width = Math.min(32, Math.max(14, len));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export function buildPdf(dataset: ExportDataset): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const arRegular = path.join(FONT_DIR, 'Tajawal-Regular.ttf');
    const arBold = path.join(FONT_DIR, 'Tajawal-Bold.ttf');
    let useArabicFont = fs.existsSync(arRegular) && fs.existsSync(arBold);
    if (useArabicFont) {
      try {
        doc.registerFont('ar', arRegular);
        doc.registerFont('ar-bold', arBold);
      } catch {
        useArabicFont = false;
      }
    }

    const isAr = dataset.lang === 'ar';
    const rtl = isAr ? { features: ['rtla'] } : {};
    const margin = 40;
    const pageWidth = doc.page.width - margin * 2;

    const setFont = (bold: boolean): void => {
      if (useArabicFont) doc.font(bold ? 'ar-bold' : 'ar');
      else doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
    };

    // Header band
    const bandH = 62;
    doc.save();
    doc.roundedRect(margin, margin, pageWidth, bandH, 8).fill('#c2185b');
    setFont(true);
    doc.fillColor('#ffffff').fontSize(20).text(dataset.salonName ?? 'Mira', margin + 16, margin + 8, {
      width: pageWidth - 32,
      align: 'center',
      ...rtl,
    });
    doc.fillColor('#ffffff').fontSize(12).text(dataset.title, margin + 16, margin + 34, {
      width: pageWidth - 32,
      align: 'center',
      ...rtl,
    });
    doc.restore();

    // Subtitle
    setFont(false);
    doc.fontSize(9);
    const subtitle = dataset.subtitle ?? '';
    const subH = doc.heightOfString(subtitle, { width: pageWidth - 16, ...rtl });
    doc.fillColor('#777777').text(subtitle, margin + 8, margin + bandH + 10, {
      width: pageWidth - 16,
      align: 'center',
      ...rtl,
    });

    // Footer (page numbers + generation date)
    let pageNo = 0;
    const drawFooter = (): void => {
      setFont(false);
      doc.fillColor('#aaaaaa').fontSize(8);
      const genLabel = isAr ? 'تم الإنشاء' : 'Generated';
      const pageLabel = isAr ? 'صفحة' : 'Page';
      doc.text(
        `${genLabel}: ${fmtDate(new Date(), dataset.lang)}`,
        margin,
        doc.page.height - doc.page.margins.bottom - 12,
        { width: pageWidth / 2, align: 'left', ...rtl },
      );
      doc.text(
        `${pageLabel} ${pageNo}`,
        margin + pageWidth / 2,
        doc.page.height - doc.page.margins.bottom - 12,
        { width: pageWidth / 2, align: 'right', ...rtl },
      );
    };
    doc.on('pageAdded', () => {
      pageNo += 1;
      drawFooter();
    });

    // Table
    const colWidth = pageWidth / dataset.columns.length;
    const pad = 5;
    const minRowH = 20;
    const cellText = (cell: string | number): string =>
      typeof cell === 'number' ? fmtNumber(cell, dataset.lang) : String(cell);

    const measure = (cells: (string | number)[], bold: boolean): number => {
      setFont(bold);
      doc.fontSize(bold ? 9 : 8.5);
      let h = minRowH;
      cells.forEach((cell) => {
        const cellH = doc.heightOfString(cellText(cell), { width: colWidth - pad * 2, ...rtl });
        h = Math.max(h, cellH + 7);
      });
      return h;
    };

    const drawRow = (
      cells: (string | number)[],
      bold: boolean,
      rowY: number,
      rowH: number,
      bg: string | null,
    ): void => {
      if (bg) doc.rect(margin, rowY, pageWidth, rowH).fill(bg);
      setFont(bold);
      doc.fontSize(bold ? 9 : 8.5);
      doc.fillColor(bold ? '#ffffff' : '#222222');
      cells.forEach((cell, c) => {
        const x = isAr ? margin + pageWidth - (c + 1) * colWidth : margin + c * colWidth;
        const text = cellText(cell);
        const cellH = doc.heightOfString(text, { width: colWidth - pad * 2, ...rtl });
        doc.text(text, x + pad, rowY + (rowH - cellH) / 2, {
          width: colWidth - pad * 2,
          ...rtl,
        });
      });
    };

    const headerH = measure(dataset.columns, true);
    const drawHeader = (): void => {
      drawRow(dataset.columns, true, y, headerH, '#880e4f');
      y += headerH;
    };

    let y = margin + bandH + 12 + subH + 10;
    drawHeader();

    dataset.rows.forEach((row, idx) => {
      const rh = measure(row, false);
      if (y + rh > doc.page.height - doc.page.margins.bottom - 18) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }
      drawRow(row, false, y, rh, idx % 2 === 1 ? '#f6e7ee' : null);
      y += rh;
    });

    drawFooter();
    doc.end();
  });
}

export async function exportDataset(
  dataset: ExportDataset,
  format: 'excel' | 'pdf',
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  if (format === 'excel') {
    const buffer = await buildExcel(dataset);
    return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' };
  }
  const buffer = await buildPdf(dataset);
  return { buffer, contentType: 'application/pdf', extension: 'pdf' };
}
