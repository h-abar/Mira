import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

const ZATCA_SETTING_KEYS = [
  'ZATCA_PRIVATE_KEY',
  'ZATCA_CERTIFICATE',
  'ZATCA_ENV',
  'ZATCA_VAT_NUMBER',
  'ZATCA_SELLER_NAME',
];

const DEFAULT_VAT_NUMBER = '310123456700003';
const DEFAULT_SELLER_NAME = 'ميرا';
const CURRENCY = 'SAR';

const OID_ECDSA_WITH_SHA256 = derOid([1, 2, 840, 10045, 4, 3, 2]);
const ALG_ECDSA_SHA256 = derSeq(OID_ECDSA_WITH_SHA256);

function derLength(value: number): Buffer {
  if (value < 0x80) return Buffer.from([value]);
  const bytes: number[] = [];
  let n = value;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n = Math.floor(n / 256);
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function derTag(tag: number, body: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), derLength(body.length), body]);
}

function derSeq(body: Buffer): Buffer {
  return derTag(0x30, body);
}

function derSet(body: Buffer): Buffer {
  return derTag(0x31, body);
}

function derInt(value: number): Buffer {
  const bytes: number[] = [];
  let n = value;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n = Math.floor(n / 256);
  }
  if (bytes.length === 0) bytes.push(0);
  if (bytes[0] & 0x80) bytes.unshift(0);
  return derTag(0x02, Buffer.from(bytes));
}

function derOid(parts: number[]): Buffer {
  if (parts.length < 2) throw new ApiError(500, 'Invalid OID.');
  const body: number[] = [parts[0] * 40 + parts[1]];
  for (let i = 2; i < parts.length; i += 1) {
    const value = parts[i];
    if (value < 128) {
      body.push(value);
    } else {
      const chunk: number[] = [];
      let n = value;
      while (n > 0) {
        chunk.unshift(n & 0x7f);
        n = Math.floor(n / 128);
      }
      for (let j = 0; j < chunk.length - 1; j += 1) chunk[j] |= 0x80;
      body.push(...chunk);
    }
  }
  return derTag(0x06, Buffer.from(body));
}

function derUtf8(value: string): Buffer {
  return derTag(0x0c, Buffer.from(value, 'utf8'));
}

function derPrintable(value: string): Buffer {
  return derTag(0x13, Buffer.from(value, 'ascii'));
}

function derUtcTime(date: Date): Buffer {
  const pad = (n: number) => String(n).padStart(2, '0');
  const s =
    pad(date.getUTCFullYear() % 100) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z';
  return derTag(0x17, Buffer.from(s, 'ascii'));
}

function derBitString(contents: Buffer): Buffer {
  return derTag(0x03, Buffer.concat([Buffer.from([0x00]), contents]));
}

function derExplicit(tag: number, contents: Buffer): Buffer {
  return derTag(0xa0 | tag, contents);
}

interface NamePart {
  oid: number[];
  value: string;
  encoding?: 'utf8' | 'printable';
}

function derName(parts: NamePart[]): Buffer {
  const rdns = parts.map((part) => {
    const value = part.encoding === 'printable' ? derPrintable(part.value) : derUtf8(part.value);
    return derSet(derSeq(Buffer.concat([derOid(part.oid), value])));
  });
  return derSeq(Buffer.concat(rdns));
}

function buildSubjectName(sellerName: string): NamePart[] {
  return [
    { oid: [2, 5, 4, 3], value: sellerName, encoding: 'utf8' },
    { oid: [2, 5, 4, 10], value: sellerName, encoding: 'utf8' },
    { oid: [2, 5, 4, 6], value: 'SA', encoding: 'printable' },
  ];
}

interface Tlv {
  tag: number;
  headerLength: number;
  value: Buffer;
}

function readTlv(buf: Buffer, offset = 0): Tlv {
  const tag = buf[offset];
  let length = buf[offset + 1];
  let headerLength = 2;
  if (length & 0x80) {
    const numBytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < numBytes; i += 1) {
      length = length * 256 + buf[offset + 2 + i];
    }
    headerLength = 2 + numBytes;
  }
  return {
    tag,
    headerLength,
    value: buf.subarray(offset + headerLength, offset + headerLength + length),
  };
}

function parseSubjectPublicKeyInfo(spki: Buffer): { algorithm: Buffer; bitString: Buffer } {
  const outer = readTlv(spki);
  if (outer.tag !== 0x30) throw new ApiError(500, 'Invalid public key.');
  const alg = readTlv(outer.value, 0);
  const algorithm = outer.value.subarray(0, alg.headerLength + alg.value.length);
  const bitOffset = alg.headerLength + alg.value.length;
  const bit = readTlv(outer.value, bitOffset);
  const bitString = outer.value.subarray(bitOffset, bitOffset + bit.headerLength + bit.value.length);
  return { algorithm: Buffer.from(algorithm), bitString: Buffer.from(bitString) };
}

function derToPem(der: Buffer, label: string): string {
  const base64 = der.toString('base64');
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

interface CertConfig {
  privateKeyPem: string;
  publicKeyPem: string;
  sellerName: string;
}

function generateKeyPairPem(): { privateKeyPem: string; publicKeyPem: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  return { privateKeyPem: privateKey, publicKeyPem: publicKey };
}

export function createSelfSignedCertificate(config: CertConfig): string {
  const publicKey = crypto.createPublicKey(config.publicKeyPem);
  const privateKey = crypto.createPrivateKey(config.privateKeyPem);
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const { algorithm, bitString } = parseSubjectPublicKeyInfo(spki);

  const notBefore = new Date(Date.now() - 60 * 60 * 1000);
  const notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const name = buildSubjectName(config.sellerName);

  const tbs = derSeq(
    Buffer.concat([
      derExplicit(0, derInt(2)),
      derInt(1),
      ALG_ECDSA_SHA256,
      derName(name),
      derSeq(Buffer.concat([derUtcTime(notBefore), derUtcTime(notAfter)])),
      derName(name),
      derSeq(Buffer.concat([algorithm, bitString])),
    ]),
  );

  const signature = crypto.sign('sha256', tbs, privateKey);
  const certDer = derSeq(Buffer.concat([tbs, ALG_ECDSA_SHA256, derBitString(signature)]));
  return derToPem(certDer, 'CERTIFICATE');
}

export function createCsrPem(config: CertConfig): string {
  const publicKey = crypto.createPublicKey(config.publicKeyPem);
  const privateKey = crypto.createPrivateKey(config.privateKeyPem);
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const { algorithm, bitString } = parseSubjectPublicKeyInfo(spki);

  const cri = derSeq(
    Buffer.concat([
      derInt(0),
      derName(buildSubjectName(config.sellerName)),
      derSeq(Buffer.concat([algorithm, bitString])),
      derTag(0xa0, Buffer.alloc(0)),
    ]),
  );

  const signature = crypto.sign('sha256', cri, privateKey);
  const csrDer = derSeq(Buffer.concat([cri, ALG_ECDSA_SHA256, derBitString(signature)]));
  return derToPem(csrDer, 'CERTIFICATE REQUEST');
}

function certificateInfo(certPem?: string): { valid: boolean; notAfter?: string } {
  if (!certPem) return { valid: false };
  try {
    const cert = new crypto.X509Certificate(certPem);
    const notAfter = new Date(cert.validTo);
    return { valid: notAfter.getTime() > Date.now(), notAfter: cert.validTo };
  } catch {
    return { valid: false };
  }
}

function signXml(xml: string, privateKeyPem: string): string {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign('sha256', Buffer.from(xml, 'utf8'), privateKey);
  return signature.toString('base64');
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0',
  )}:${String(date.getSeconds()).padStart(2, '0')}`;
}

export interface ZatcaConfig {
  sellerName: string;
  vatNumber: string;
  vatRate: number;
}

export interface ZatcaXmlItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ZatcaXmlInvoice {
  invoiceNo: string;
  date: Date;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  clientName: string;
  items: ZatcaXmlItem[];
}

export function buildInvoiceXml(invoice: ZatcaXmlInvoice, config: ZatcaConfig): string {
  const taxExclusive = round2(invoice.subtotal - invoice.discount);
  const taxInclusive = round2(taxExclusive + invoice.tax);
  const vatPercent = config.vatRate.toFixed(2);

  const lines = invoice.items
    .map(
      (item, index) => `    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA" unitCodeListID="UNECERec20">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${CURRENCY}">${item.lineTotal.toFixed(
        2,
      )}</cbc:LineExtensionAmount>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
      <cac:Item>
        <cbc:Name>${esc(item.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${vatPercent}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
    </cac:InvoiceLine>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${esc(invoice.invoiceNo)}</cbc:ID>
  <cbc:UUID>${crypto.randomUUID()}</cbc:UUID>
  <cbc:IssueDate>${formatDate(invoice.date)}</cbc:IssueDate>
  <cbc:IssueTime>${formatTime(invoice.date)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${CURRENCY}</cbc:DocumentCurrencyCode>
${lines}
  <cac:SupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(config.vatNumber)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(config.sellerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:SupplierParty>
  <cac:CustomerParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(invoice.clientName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:CustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${CURRENCY}">${invoice.tax.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${CURRENCY}">${taxExclusive.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${CURRENCY}">${invoice.tax.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${vatPercent}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${CURRENCY}">${invoice.subtotal.toFixed(
      2,
    )}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${CURRENCY}">${taxExclusive.toFixed(
      2,
    )}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${CURRENCY}">${taxInclusive.toFixed(
      2,
    )}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="${CURRENCY}">${invoice.discount.toFixed(
      2,
    )}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="${CURRENCY}">${invoice.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
}

function buildTlv(tag: number, value: string): Buffer {
  const data = Buffer.from(value, 'utf8');
  if (data.length > 255) throw new ApiError(500, 'QR TLV value exceeds 255 bytes.');
  return Buffer.concat([Buffer.from([tag, data.length]), data]);
}

export function buildQrBase64(input: {
  sellerName: string;
  vatNumber: string;
  timestamp: Date;
  total: number;
  vatAmount: number;
}): string {
  const tlv = Buffer.concat([
    buildTlv(1, input.sellerName),
    buildTlv(2, input.vatNumber),
    buildTlv(3, input.timestamp.toISOString()),
    buildTlv(4, input.total.toFixed(2)),
    buildTlv(5, input.vatAmount.toFixed(2)),
  ]);
  return tlv.toString('base64');
}

interface ZatcaSettings {
  privateKeyPem?: string;
  certificatePem?: string;
  env?: string;
  vatNumber?: string;
  sellerName?: string;
}

async function readZatcaSettings(): Promise<ZatcaSettings> {
  const rows = await prisma.setting.findMany({ where: { key: { in: ZATCA_SETTING_KEYS } } });
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    privateKeyPem: map.get('ZATCA_PRIVATE_KEY'),
    certificatePem: map.get('ZATCA_CERTIFICATE'),
    env: map.get('ZATCA_ENV'),
    vatNumber: map.get('ZATCA_VAT_NUMBER'),
    sellerName: map.get('ZATCA_SELLER_NAME'),
  };
}

async function writeZatcaSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

interface ResolvedConfig {
  privateKeyPem?: string;
  certificatePem?: string;
  env: string;
  vatNumber: string;
  sellerName: string;
  vatRate: number;
}

async function resolveConfig(): Promise<ResolvedConfig> {
  const [settings, salonNameRow, vatRateRow] = await Promise.all([
    readZatcaSettings(),
    prisma.setting.findUnique({ where: { key: 'SALON_NAME_AR' } }),
    prisma.setting.findUnique({ where: { key: 'VAT_RATE' } }),
  ]);

  const vatNumber = settings.vatNumber?.trim() || env.ZATCA_VAT_NUMBER || DEFAULT_VAT_NUMBER;
  const sellerName = settings.sellerName?.trim() || salonNameRow?.value?.trim() || DEFAULT_SELLER_NAME;
  const vatRate = Number.parseFloat(vatRateRow?.value ?? '') || 15;

  return {
    privateKeyPem: settings.privateKeyPem,
    certificatePem: settings.certificatePem,
    env: settings.env?.trim() || env.ZATCA_ENV || 'sandbox',
    vatNumber,
    sellerName,
    vatRate,
  };
}

async function getStatus() {
  const config = await resolveConfig();
  const cert = certificateInfo(config.certificatePem);
  return {
    success: true,
    configured: Boolean(config.certificatePem && config.vatNumber),
    env: config.env,
    vatNumber: config.vatNumber,
    sellerName: config.sellerName,
    certificateValid: cert.valid,
    certificateNotAfter: cert.notAfter ?? null,
  };
}

async function setup() {
  const current = await readZatcaSettings();
  const salonNameRow = await prisma.setting.findUnique({ where: { key: 'SALON_NAME_AR' } });
  const sellerName = current.sellerName?.trim() || salonNameRow?.value?.trim() || DEFAULT_SELLER_NAME;
  const vatNumber = current.vatNumber?.trim() || env.ZATCA_VAT_NUMBER || DEFAULT_VAT_NUMBER;

  const { privateKeyPem, publicKeyPem } = generateKeyPairPem();
  const certificatePem = createSelfSignedCertificate({ privateKeyPem, publicKeyPem, sellerName });

  await writeZatcaSetting('ZATCA_PRIVATE_KEY', privateKeyPem);
  await writeZatcaSetting('ZATCA_CERTIFICATE', certificatePem);
  await writeZatcaSetting('ZATCA_ENV', env.ZATCA_ENV || 'sandbox');
  await writeZatcaSetting('ZATCA_VAT_NUMBER', vatNumber);
  await writeZatcaSetting('ZATCA_SELLER_NAME', sellerName);

  return getStatus();
}

async function generateCsr() {
  let config = await resolveConfig();
  if (!config.privateKeyPem) {
    await setup();
    config = await resolveConfig();
  }
  if (!config.privateKeyPem) {
    throw new ApiError(500, 'Failed to generate certificate key pair.');
  }
  const publicKeyPem = crypto
    .createPublicKey(config.privateKeyPem)
    .export({ type: 'spki', format: 'pem' })
    .toString();
  const csrPem = createCsrPem({ privateKeyPem: config.privateKeyPem, publicKeyPem, sellerName: config.sellerName });
  return { csrPem };
}

type InvoiceWithItems = Prisma.InvoiceGetPayload<{
  include: { client: true; items: true };
}>;

function toXmlData(invoice: InvoiceWithItems): ZatcaXmlInvoice {
  return {
    invoiceNo: invoice.invoiceNo,
    date: invoice.date,
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    clientName: invoice.client.name || 'Walk-in Customer',
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}

async function requireConfigured() {
  const config = await resolveConfig();
  if (!config.privateKeyPem) {
    throw new ApiError(500, 'ZATCA certificate not configured. Run POST /api/zatca/setup first.');
  }
  return config;
}

async function getInvoiceXml(id: number) {
  const config = await requireConfigured();
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, items: true },
  });
  if (!invoice) {
    throw new ApiError(404, 'Invoice not found.');
  }
  const xml = buildInvoiceXml(toXmlData(invoice), config);
  const signatureB64 = signXml(xml, config.privateKeyPem as string);
  const qrBase64 = buildQrBase64({
    sellerName: config.sellerName,
    vatNumber: config.vatNumber,
    timestamp: invoice.date,
    total: Number(invoice.total),
    vatAmount: Number(invoice.tax),
  });
  return { xml, signatureB64, qrBase64, invoiceNo: invoice.invoiceNo };
}

async function getInvoiceQr(id: number) {
  const config = await requireConfigured();
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { invoiceNo: true, date: true, total: true, tax: true },
  });
  if (!invoice) {
    throw new ApiError(404, 'Invoice not found.');
  }
  const qrBase64 = buildQrBase64({
    sellerName: config.sellerName,
    vatNumber: config.vatNumber,
    timestamp: invoice.date,
    total: Number(invoice.total),
    vatAmount: Number(invoice.tax),
  });
  return { qrBase64, invoiceNo: invoice.invoiceNo };
}

async function test() {
  let config = await resolveConfig();
  if (!config.privateKeyPem || !config.certificatePem) {
    await setup();
    config = await resolveConfig();
  }
  if (!config.privateKeyPem) {
    throw new ApiError(500, 'ZATCA certificate generation failed.');
  }

  const date = new Date();
  const itemTotal = round2(100);
  const vatAmount = round2(itemTotal * (config.vatRate / 100));
  const sample: ZatcaXmlInvoice = {
    invoiceNo: 'ZATCA-TEST-001',
    date,
    subtotal: itemTotal,
    discount: 0,
    tax: vatAmount,
    total: round2(itemTotal + vatAmount),
    clientName: 'ZATCA Test Customer',
    items: [{ description: 'Test Service', quantity: 1, unitPrice: itemTotal, lineTotal: itemTotal }],
  };

  const xml = buildInvoiceXml(sample, config);
  const signatureB64 = signXml(xml, config.privateKeyPem);
  const qrBase64 = buildQrBase64({
    sellerName: config.sellerName,
    vatNumber: config.vatNumber,
    timestamp: date,
    total: sample.total,
    vatAmount,
  });

  return {
    success: true,
    qrBase64,
    signatureB64,
    xml,
    configured: true,
    env: config.env,
    vatNumber: config.vatNumber,
    sellerName: config.sellerName,
    certificateValid: certificateInfo(config.certificatePem).valid,
  };
}

export const zatcaService = {
  getStatus,
  setup,
  generateCsr,
  getInvoiceXml,
  getInvoiceQr,
  test,
};
