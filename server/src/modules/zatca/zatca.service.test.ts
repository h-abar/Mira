import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';

vi.mock('../../config/database', () => ({ prisma: {} }));

import {
  buildQrBase64,
  buildInvoiceXml,
  createSelfSignedCertificate,
  createCsrPem,
} from './zatca.service';
import { ApiError } from '../../utils/ApiError';

function parseTlv(buf: Buffer): Array<{ tag: number; value: Buffer }> {
  const entries: Array<{ tag: number; value: Buffer }> = [];
  let offset = 0;
  while (offset < buf.length) {
    const tag = buf[offset];
    const length = buf[offset + 1];
    entries.push({ tag, value: buf.subarray(offset + 2, offset + 2 + length) });
    offset += 2 + length;
  }
  return entries;
}

describe('buildQrBase64', () => {
  it('encodes the five ZATCA TLV tags in order', () => {
    const timestamp = new Date('2026-08-19T10:30:00.000Z');
    const qr = buildQrBase64({
      sellerName: 'Mira Salon',
      vatNumber: '310123456700003',
      timestamp,
      total: 115.5,
      vatAmount: 15.5,
    });
    const entries = parseTlv(Buffer.from(qr, 'base64'));
    expect(entries.map((e) => e.tag)).toEqual([1, 2, 3, 4, 5]);
    expect(entries[0].value.toString('utf8')).toBe('Mira Salon');
    expect(entries[1].value.toString('utf8')).toBe('310123456700003');
    expect(entries[2].value.toString('utf8')).toBe('2026-08-19T10:30:00.000Z');
    expect(entries[3].value.toString('utf8')).toBe('115.50');
    expect(entries[4].value.toString('utf8')).toBe('15.50');
  });

  it('pads totals and vat to two decimals before encoding', () => {
    const qr = buildQrBase64({
      sellerName: 'S',
      vatNumber: 'V',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      total: 9.99,
      vatAmount: 1.49,
    });
    const entries = parseTlv(Buffer.from(qr, 'base64'));
    expect(entries[3].value.toString('utf8')).toBe('9.99');
    expect(entries[4].value.toString('utf8')).toBe('1.49');
  });

  it('throws when a value exceeds 255 bytes', () => {
    expect(() =>
      buildQrBase64({
        sellerName: 'x'.repeat(300),
        vatNumber: 'V',
        timestamp: new Date(),
        total: 1,
        vatAmount: 0,
      }),
    ).toThrow(ApiError);
  });

  it('encodes Arabic seller names as UTF-8 bytes', () => {
    const qr = buildQrBase64({
      sellerName: 'صالون ميرا',
      vatNumber: 'V',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      total: 5,
      vatAmount: 0.75,
    });
    const entries = parseTlv(Buffer.from(qr, 'base64'));
    expect(entries[0].value.toString('utf8')).toBe('صالون ميرا');
    expect(entries[0].value.length).toBeGreaterThan(7);
  });
});

describe('buildInvoiceXml', () => {
  const config = { sellerName: 'Mira & Co', vatNumber: '310123456700003', vatRate: 15 };

  it('escapes XML special characters in text fields', () => {
    const xml = buildInvoiceXml(
      {
        invoiceNo: 'INV-20260819-AB12CD',
        date: new Date(2026, 7, 19, 9, 5, 30),
        subtotal: 100,
        discount: 10,
        tax: 13.5,
        total: 103.5,
        clientName: 'O\'Brien & Sons',
        items: [{ description: 'Hair & <Beauty>', quantity: 1, unitPrice: 100, lineTotal: 100 }],
      },
      config,
    );
    expect(xml).toContain('&lt;Beauty&gt;');
    expect(xml).toContain('O&apos;Brien &amp; Sons');
    expect(xml).toContain('Mira &amp; Co');
    expect(xml).toContain('310123456700003');
  });

  it('computes taxExclusive and taxInclusive amounts', () => {
    const xml = buildInvoiceXml(
      {
        invoiceNo: 'INV-1',
        date: new Date(2026, 7, 19),
        subtotal: 230.5,
        discount: 20.25,
        tax: 31.5375,
        total: 241.7875,
        clientName: 'Client',
        items: [{ description: 'S', quantity: 2, unitPrice: 115.25, lineTotal: 230.5 }],
      },
      config,
    );
    expect(xml).toContain('<cbc:TaxExclusiveAmount currencyID="SAR">210.25</cbc:TaxExclusiveAmount>');
    expect(xml).toContain('<cbc:TaxInclusiveAmount currencyID="SAR">241.79</cbc:TaxInclusiveAmount>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="SAR">241.79</cbc:PayableAmount>');
  });

  it('renders quantities, VAT percent and a UUID', () => {
    const xml = buildInvoiceXml(
      {
        invoiceNo: 'INV-2',
        date: new Date(2026, 7, 19),
        subtotal: 50,
        discount: 0,
        tax: 7.5,
        total: 57.5,
        clientName: 'C',
        items: [{ description: 'S', quantity: 3, unitPrice: 50, lineTotal: 50 }],
      },
      config,
    );
    expect(xml).toContain('<cbc:InvoicedQuantity unitCode="EA" unitCodeListID="UNECERec20">3</cbc:InvoicedQuantity>');
    expect(xml).toContain('<cbc:Percent>15.00</cbc:Percent>');
    expect(xml).toMatch(/<cbc:UUID>[0-9a-f-]{36}<\/cbc:UUID>/);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});

describe('createSelfSignedCertificate / createCsrPem', () => {
  it('produces a parseable self-signed certificate PEM', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const certPem = createSelfSignedCertificate({
      privateKeyPem: privateKey,
      publicKeyPem: publicKey,
      sellerName: 'Mira Salon',
    });
    expect(certPem.startsWith('-----BEGIN CERTIFICATE-----')).toBe(true);
    const cert = new crypto.X509Certificate(certPem);
    expect(cert.subject).toContain('CN=Mira Salon');
    expect(cert.verify(crypto.createPublicKey(publicKey))).toBe(true);
  });

  it('produces a CSR PEM for the same key pair', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const csrPem = createCsrPem({ privateKeyPem: privateKey, publicKeyPem: publicKey, sellerName: 'Mira Salon' });
    expect(csrPem.startsWith('-----BEGIN CERTIFICATE REQUEST-----')).toBe(true);
    expect(csrPem.endsWith('-----END CERTIFICATE REQUEST-----')).toBe(true);
  });
});