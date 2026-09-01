import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
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

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabic(text: string): boolean {
  return ARABIC_REGEX.test(text);
}

/**
 * Format a number cleanly with Western Arabic numerals (1, 2, 3...)
 * - Integers: 1, 15, 1,250
 * - Decimals / Money: 15.00, 1,250.50
 */
export function fmtNumber(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  if (Number.isInteger(value)) {
    return Number(value).toLocaleString('en-US');
  }
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format monetary values strictly with 2 decimal places
 */
export function fmtMoney(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0.00';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format dates cleanly with standard Western numerals (YYYY-MM-DD or DD/MM/YYYY HH:mm)
 */
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  // If time is midnight (00:00:00), format as YYYY-MM-DD
  if (dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && dateObj.getSeconds() === 0) {
    return `${year}-${month}-${day}`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes}`;
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
  headerRow.height = 24;
  dataset.columns.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF880E4F' } };
    cell.alignment = align('center');
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFC2185B' } },
      bottom: { style: 'thin', color: { argb: 'FFC2185B' } },
    };
  });

  // Data rows
  dataset.rows.forEach((row, rIdx) => {
    const excelRow = sheet.getRow(5 + rIdx);
    excelRow.height = 22;
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
        if (Number.isInteger(value)) {
          cell.numFmt = '#,##0';
        } else {
          cell.numFmt = '#,##0.00';
        }
        cell.alignment = align('right');
      } else {
        cell.alignment = align(mainAlign);
      }

      if (rIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F0F4' } };
      }
    });
  });

  // Adaptive column widths with generous margin to avoid ###
  for (let c = 1; c <= colCount; c++) {
    let maxLen = dataset.columns[c - 1].length + 6;
    for (let r = 5; r < 5 + dataset.rows.length; r++) {
      const value = sheet.getRow(r).getCell(c).value;
      const strLen =
        typeof value === 'number'
          ? fmtNumber(value).length
          : String(value ?? '').length;
      maxLen = Math.max(maxLen, strLen + 6);
    }
    sheet.getColumn(c).width = Math.min(42, Math.max(14, maxLen));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export function buildPdf(dataset: ExportDataset): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const landscape = dataset.columns.length >= 6;
    const doc = new PDFDocument({ size: 'A4', layout: landscape ? 'landscape' : 'portrait', margin: 36 });
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
    const margin = 36;
    const pageWidth = doc.page.width - margin * 2;

    const setFont = (bold: boolean): void => {
      if (useArabicFont) doc.font(bold ? 'ar-bold' : 'ar');
      else doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
    };

    // Header band
    const bandH = 60;
    doc.save();
    doc.roundedRect(margin, margin, pageWidth, bandH, 6).fill('#c2185b');
    setFont(true);

    const salonTitle = dataset.salonName ?? 'Mira';
    const titleRtl = containsArabic(salonTitle) ? { features: ['rtla'] } : {};
    doc.fillColor('#ffffff').fontSize(18).text(salonTitle, margin + 12, margin + 8, {
      width: pageWidth - 24,
      align: 'center',
      ...titleRtl,
    });

    const datasetTitleRtl = containsArabic(dataset.title) ? { features: ['rtla'] } : {};
    doc.fillColor('#ffffff').fontSize(12).text(dataset.title, margin + 12, margin + 34, {
      width: pageWidth - 24,
      align: 'center',
      ...datasetTitleRtl,
    });
    doc.restore();

    // Subtitle
    setFont(false);
    doc.fontSize(9);
    const subtitle = dataset.subtitle ?? '';
    const subtitleRtl = containsArabic(subtitle) ? { features: ['rtla'] } : {};
    const subH = doc.heightOfString(subtitle, { width: pageWidth - 16, ...subtitleRtl });
    doc.fillColor('#666666').text(subtitle, margin + 8, margin + bandH + 8, {
      width: pageWidth - 16,
      align: 'center',
      ...subtitleRtl,
    });

    // Footer (page numbers + generation date)
    let pageNo = 1;
    const drawFooter = (): void => {
      setFont(false);
      doc.fillColor('#999999').fontSize(8);
      const genLabel = isAr ? 'تاريخ الإنشاء' : 'Generated';
      const pageLabel = isAr ? 'صفحة' : 'Page';
      const dateText = `${genLabel}: ${fmtDate(new Date())}`;
      const dateRtl = isAr ? { features: ['rtla'] } : {};

      doc.text(
        dateText,
        margin,
        doc.page.height - doc.page.margins.bottom - 10,
        { width: pageWidth / 2, align: 'left', ...dateRtl },
      );
      doc.text(
        `${pageLabel} ${pageNo}`,
        margin + pageWidth / 2,
        doc.page.height - doc.page.margins.bottom - 10,
        { width: pageWidth / 2, align: 'right', ...dateRtl },
      );
    };

    doc.on('pageAdded', () => {
      pageNo += 1;
      drawFooter();
    });

    // Calculate adaptive column widths based on column headers and content
    const numCols = dataset.columns.length;
    const colWeights: number[] = new Array(numCols).fill(1);

    // Give narrower width for short numeric / ID columns and wider for names/descriptions
    dataset.columns.forEach((col, idx) => {
      let maxLen = col.length;
      dataset.rows.slice(0, 30).forEach((row) => {
        const val = row[idx];
        const len = typeof val === 'number' ? fmtNumber(val).length : String(val ?? '').length;
        maxLen = Math.max(maxLen, len);
      });
      if (maxLen <= 4) colWeights[idx] = 0.6;
      else if (maxLen <= 8) colWeights[idx] = 0.8;
      else if (maxLen <= 14) colWeights[idx] = 1.0;
      else if (maxLen <= 22) colWeights[idx] = 1.4;
      else colWeights[idx] = 1.8;
    });

    const totalWeight = colWeights.reduce((a, b) => a + b, 0);
    const colWidths = colWeights.map((w) => (w / totalWeight) * pageWidth);

    const pad = 4;
    const minRowH = 22;
    const maxRowH = 48;

    const cellText = (cell: string | number): string =>
      typeof cell === 'number' ? fmtNumber(cell) : String(cell ?? '—');

    const visualOrder = <T,>(items: T[]): T[] => (isAr ? [...items].reverse() : items);

    const measureRow = (cells: (string | number)[], bold: boolean): number => {
      setFont(bold);
      doc.fontSize(bold ? 8 : 7.5);
      const visCells = visualOrder(cells);
      const visWidths = visualOrder(colWidths);
      let maxH = minRowH;
      visCells.forEach((cell, cIdx) => {
        const text = cellText(cell);
        const hasArabic = containsArabic(text);
        const rtlOpt = hasArabic ? { features: ['rtla'] } : {};
        const innerW = Math.max(8, visWidths[cIdx] - pad * 2);
        const cellH = doc.heightOfString(text, { width: innerW, ...rtlOpt });
        maxH = Math.max(maxH, Math.min(maxRowH, cellH + 8));
      });
      return maxH;
    };

    const drawRow = (
      cells: (string | number)[],
      bold: boolean,
      rowY: number,
      rowH: number,
      bg: string | null,
    ): void => {
      if (bg) {
        doc.rect(margin, rowY, pageWidth, rowH).fill(bg);
      }

      const visCells = visualOrder(cells);
      const visWidths = visualOrder(colWidths);
      let x = margin;

      visCells.forEach((cell, cIdx) => {
        const width = visWidths[cIdx];
        const text = cellText(cell);
        const isNum = typeof cell === 'number';
        const hasArabic = containsArabic(text);
        const rtlOption = hasArabic ? { features: ['rtla'] } : {};
        const alignOption: 'center' | 'left' | 'right' = bold
          ? 'center'
          : isNum
            ? (isAr ? 'left' : 'right')
            : hasArabic
              ? (isAr ? 'right' : 'left')
              : 'center';

        doc.save();
        doc.rect(x, rowY, width, rowH).clip();
        setFont(bold);
        doc.fontSize(bold ? 8 : 7.5);
        doc.fillColor(bold ? '#ffffff' : '#222222');
        doc.text(text, x + pad, rowY + 4, {
          width: Math.max(8, width - pad * 2),
          height: Math.max(10, rowH - 8),
          align: alignOption,
          ellipsis: true,
          lineBreak: true,
          ...rtlOption,
        });
        doc.restore();

        doc.lineWidth(0.4).strokeColor('#d7c7ce');
        doc.rect(x, rowY, width, rowH).stroke();
        x += width;
      });

      // Keep PDFKit's flowing cursor from leaking into the next row.
      doc.x = margin;
      doc.y = rowY + rowH;
    };

    const headerH = measureRow(dataset.columns, true);
    const drawHeader = (): void => {
      drawRow(dataset.columns, true, y, headerH, '#880e4f');
      y += headerH;
    };

    let y = margin + bandH + 10 + subH + 8;
    drawHeader();

    dataset.rows.forEach((row, idx) => {
      const rh = measureRow(row, false);
      if (y + rh > doc.page.height - doc.page.margins.bottom - 16) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }
      drawRow(row, false, y, rh, idx % 2 === 1 ? '#fcf4f7' : null);
      y += rh;
    });

    drawFooter();
    doc.end();
  });
}

export async function exportDataset(
  dataset: ExportDataset,
  format: 'excel' | 'pdf',
): Promise<{ buffer: Buffer; contentType: string; mime: string; extension: string }> {
  if (format === 'excel') {
    const buffer = await buildExcel(dataset);
    const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return { buffer, contentType, mime: contentType, extension: 'xlsx' };
  }
  const buffer = await buildPdf(dataset);
  const contentType = 'application/pdf';
  return { buffer, contentType, mime: contentType, extension: 'pdf' };
}
