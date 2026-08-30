export interface MoyasarChargeInput {
  amount: number;
  currency: string; // e.g., 'SAR'
  method: string; // payment method name
}

export interface MoyasarChargeResult {
  transactionId: string;
}

/**
 * Simple placeholder implementation for Moyasar payment gateway.
 * In a real project you would call Moyasar's API using fetch/axios.
 * Here we simulate a successful charge and return a fake transactionId.
 */
export class MoyasarGateway {
  private apiKey: string;
  private publicKey: string;
  private env: string; // 'sandbox' | 'production'

  constructor(opts: { apiKey: string; publicKey: string; env?: string }) {
    this.apiKey = opts.apiKey;
    this.publicKey = opts.publicKey;
    this.env = opts.env ?? 'sandbox';
  }

  async createCharge(input: MoyasarChargeInput): Promise<MoyasarChargeResult> {
    // Simulated delay to mimic network call
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Generate a deterministic fake transaction id for reproducibility
    const txId = `MOYASAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return { transactionId: txId };
  }
}
