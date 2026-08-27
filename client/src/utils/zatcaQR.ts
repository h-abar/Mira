export const ZATCA_VAT_NUMBER = '310123456700003';

export const ZATCA_SELLER_NAME = 'Mira';

export interface ZatcaQrParams {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: number;
  vatAmount: number;
}

const textEncoder = new TextEncoder();

function toFixedDecimal(value: number): string {
  return value.toFixed(2);
}

function tlvEntry(tag: number, value: Uint8Array): Uint8Array {
  const entry = new Uint8Array(2 + value.length);
  entry[0] = tag;
  entry[1] = value.length;
  entry.set(value, 2);
  return entry;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function buildZatcaQrTLV(params: ZatcaQrParams): string {
  const entries = [
    tlvEntry(1, textEncoder.encode(params.sellerName)),
    tlvEntry(2, textEncoder.encode(params.vatNumber)),
    tlvEntry(3, textEncoder.encode(params.timestamp)),
    tlvEntry(4, textEncoder.encode(toFixedDecimal(params.invoiceTotal))),
    tlvEntry(5, textEncoder.encode(toFixedDecimal(params.vatAmount))),
  ];
  const totalLength = entries.reduce((sum, entry) => sum + entry.length, 0);
  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const entry of entries) {
    bytes.set(entry, offset);
    offset += entry.length;
  }
  return bytesToBase64(bytes);
}
