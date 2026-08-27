import { z } from 'zod';

export const updateSettingsSchema = z.object({
  values: z.record(z.string(), z.string()),
});
