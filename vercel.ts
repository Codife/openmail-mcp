import type { VercelConfig } from '@vercel/config/v1';
export const config:VercelConfig={framework:'nextjs',buildCommand:'pnpm --filter @openmail/web build',installCommand:'pnpm install --frozen-lockfile'};
