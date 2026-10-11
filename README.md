# OpenMail MCP

OpenMail MCP is a self-hosted, multi-workspace email control plane for MCP-compatible AI clients. It keeps message content at the provider by default and enforces workspace, mailbox, and operation scopes on every request.

> The Hostinger-first workflow is implemented. See [implementation status](docs/implementation-status.md) for verified operations, intentionally unsupported capabilities, and live-verification requirements.

## Quick start

1. Install Node 22+ and pnpm 10.
2. Copy `.env.example` to `.env` and fill in Supabase, a 32-byte base64 master key (`openssl rand -base64 32`), and a random MCP pepper.
3. Run `pnpm install` and `pnpm db:migrate`.
4. Run `pnpm setup`, then remove `BOOTSTRAP_PASSWORD`.
5. Run `pnpm dev` and open `http://localhost:3000`.

Public registration defaults off. Provider OAuth settings are optional until that provider is connected. Never put `SUPABASE_SECRET_KEY` or `OPENMAIL_MASTER_KEY` in a `NEXT_PUBLIC_` variable or in Supabase.

## Commands

`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm db:migrate`, `pnpm setup --non-interactive`.

## Deployment

Create a Supabase project, push migrations, configure Auth redirect URLs to `https://YOUR_DOMAIN/auth/callback`, and run setup from a trusted terminal. On Vercel, set the variables in `.env.example`, set Root Directory to the repository root, and use the included `vercel.ts`. Use the Node.js runtime and confirm the hosting plan permits outbound TCP to Hostinger IMAP (993) and SMTP (465). Vercel plan limits and terms apply—free hosting is not unlimited, and plan eligibility must be checked for your use.

Read [architecture](docs/architecture.md), [security policy](SECURITY.md), and [implementation status](docs/implementation-status.md).
