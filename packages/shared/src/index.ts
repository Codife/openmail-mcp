import { z } from 'zod';

export const emailAddressSchema = z.object({ name: z.string().max(200).optional(), address: z.string().email() });
export const attachmentSchema = z.object({ filename: z.string().min(1).max(255), contentType: z.string().min(1), size: z.number().int().nonnegative(), content: z.string().optional() });
export const sendMessageSchema = z.object({
  to: z.array(emailAddressSchema).min(1).max(100), cc: z.array(emailAddressSchema).max(100).default([]), bcc: z.array(emailAddressSchema).max(100).default([]),
  subject: z.string().max(998), text: z.string().max(2_000_000).optional(), html: z.string().max(2_000_000).optional(),
  attachments: z.array(attachmentSchema).max(20).default([]), idempotencyKey: z.string().min(16).max(200),
}).refine((v) => v.text || v.html, 'A text or HTML body is required');
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EmailAddress = z.infer<typeof emailAddressSchema>;
export const redact = (value: unknown): unknown => JSON.parse(JSON.stringify(value, (key, item) => /token|secret|password|authorization|cookie/i.test(key) ? '[REDACTED]' : item));
