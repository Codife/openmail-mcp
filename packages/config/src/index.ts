import { z } from 'zod';

const optionalUrl = z.string().url().optional();
export const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  OPENMAIL_MASTER_KEY: z.string().min(43),
  OPENMAIL_MASTER_KEY_VERSION: z.coerce.number().int().positive().default(1),
  ALLOW_PUBLIC_REGISTRATION: z.enum(['true', 'false']).default('false'),
  GOOGLE_CLIENT_ID: z.string().optional(), GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(), MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().default('common'),
  ZOHO_CLIENT_ID: z.string().optional(), ZOHO_CLIENT_SECRET: z.string().optional(),
  ZOHO_REGION: z.string().default('com'), HOSTINGER_API_TOKEN: z.string().optional(),
  MCP_TOKEN_PEPPER: z.string().min(32), WEBHOOK_SIGNING_SECRET: z.string().min(32).optional(),
  JOB_LEASE_SECONDS: z.coerce.number().int().positive().default(60),
  MAX_ATTACHMENT_BYTES: z.coerce.number().int().positive().default(10_485_760),
  LOG_LEVEL: z.enum(['debug','info','warn','error']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
});
export type Env = z.infer<typeof envSchema>;
export function getEnv(input: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(input);
}
