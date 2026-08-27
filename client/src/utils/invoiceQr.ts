import QRCode from 'qrcode';
import { buildZatcaQrTLV } from './zatcaQR';

export type QrDisplayMode = 'square' | 'text';

export interface InvoiceQrInput {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: number;
  vatAmount: number;
}

export function buildInvoiceQrPayload(input: InvoiceQrInput): string {
  return buildZatcaQrTLV(input);
}

export async function generateQrImageDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
