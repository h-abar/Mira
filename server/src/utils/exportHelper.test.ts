import { describe, it, expect } from 'vitest';
import { fmtNumber, fmtMoney, fmtDate, containsArabic, buildExcel, buildPdf, exportDataset } from './exportHelper';

describe('exportHelper', () => {
  describe('fmtNumber', () => {
    it('formats integers with commas and without unnecessary decimals', () => {
      expect(fmtNumber(0)).toBe('0');
      expect(fmtNumber(15)).toBe('15');
      expect(fmtNumber(1250)).toBe('1,250');
      expect(fmtNumber(1000000)).toBe('1,000,000');
    });

    it('formats decimal numbers with 2 fixed decimal places', () => {
      expect(fmtNumber(15.5)).toBe('15.50');
      expect(fmtNumber(1250.75)).toBe('1,250.75');
      expect(fmtNumber(99.999)).toBe('100.00');
    });

    it('handles non-number or NaN gracefully', () => {
      expect(fmtNumber(NaN)).toBe('0');
    });
  });

  describe('fmtMoney', () => {
    it('always formats with 2 decimal places', () => {
      expect(fmtMoney(0)).toBe('0.00');
      expect(fmtMoney(150)).toBe('150.00');
      expect(fmtMoney(1234.5)).toBe('1,234.50');
    });
  });

  describe('fmtDate', () => {
    it('formats date cleanly with Western numerals', () => {
      const d = new Date('2026-08-30T15:30:00Z');
      const formatted = fmtDate(d);
      expect(formatted).toMatch(/^2026-\d{2}-\d{2}/);
    });

    it('handles null or undefined', () => {
      expect(fmtDate(null)).toBe('—');
      expect(fmtDate(undefined)).toBe('—');
    });
  });

  describe('containsArabic', () => {
    it('correctly detects Arabic text vs Latin and numbers', () => {
      expect(containsArabic('ميرا')).toBe(true);
      expect(containsArabic('تقرير المبيعات')).toBe(true);
      expect(containsArabic('123.45')).toBe(false);
      expect(containsArabic('Sales Report')).toBe(false);
      expect(containsArabic('2026-08-30')).toBe(false);
    });
  });

  describe('buildExcel and buildPdf', () => {
    const dataset = {
      title: 'تقرير المبيعات',
      subtitle: 'الفترة: 2026-08-01 إلى 2026-08-30',
      salonName: 'ميرا',
      lang: 'ar' as const,
      columns: ['التاريخ', 'الإجمالي (ر.س)', 'عدد الفواتير'],
      rows: [
        ['2026-08-28', 1250.5, 12],
        ['2026-08-29', 3400.0, 25],
        ['2026-08-30', 500.25, 4],
      ],
    };

    it('builds an Excel buffer without errors', async () => {
      const buffer = await buildExcel(dataset);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });

    it('keeps wide Arabic tables inside the page when building PDF', async () => {
      const wide = {
        ...dataset,
        columns: ['الموظفة', 'بداية الوردية', 'نهاية الوردية', 'الحالة', 'الفواتير', 'المبيعات', 'نقدي', 'بطاقة', 'المتوقع', 'الفعلي', 'الفرق'],
        rows: [
          ['نورة / Noura', '2026-08-30 09:00', '2026-08-30 17:00', 'مغلقة', 12, 3400.5, 1200, 2200.5, 1500, 1480, -20],
        ],
      };
      const pdfResult = await buildPdf(wide);
      expect(pdfResult.length).toBeGreaterThan(1000);
    });

    it('exportDataset returns proper content types', async () => {
      const excelResult = await exportDataset(dataset, 'excel');
      expect(excelResult.extension).toBe('xlsx');
      expect(excelResult.contentType).toContain('openxmlformats');

      const pdfResult = await exportDataset(dataset, 'pdf');
      expect(pdfResult.extension).toBe('pdf');
      expect(pdfResult.contentType).toBe('application/pdf');
    });
  });
});
