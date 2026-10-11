# Architecture

OpenMail MCP is a pnpm monorepo. `packages/core` owns provider-neutral contracts and authorization; it imports neither Next.js nor MCP. `packages/providers` adapts external APIs. `packages/auth` owns AES-256-GCM envelope encryption and bearer-token hashing. `packages/mcp` validates and dispatches tools. Both `apps/web` and `apps/worker` compose these services.

The web app uses cookie-backed Supabase SSR sessions. Trusted server paths validate claims; PostgreSQL RLS is the final tenant boundary. Provider ciphertext and MCP hashes have no authenticated Data API policies and are accessed only by server-side code with the secret key. Email bodies and attachment bytes are fetched from providers and are not indexed by default.

Remote MCP is stateless Streamable HTTP so requests can move between Vercel instances. Every operation resolves a credential to one workspace, checks the required tool scope and mailbox grant, then creates the provider adapter. Send operations require an idempotency key and are intended to be guarded by database uniqueness and configured send limits.

The optional worker claims jobs through `FOR UPDATE SKIP LOCKED` leases. It is required for IMAP/SMTP and long-running work, but API-backed provider operations remain usable without it.

## Trust boundaries

- Browser: publishable Supabase key only; never provider credentials or the secret key.
- Web/worker: decrypt secrets only immediately before an upstream request.
- PostgreSQL: workspace RLS plus server-side RBAC; service credentials bypass RLS and therefore remain server-only.
- Provider content: untrusted data; sanitize HTML before rendering and serve attachments with safe names, validated MIME types, and download headers.
