# Implementation status

Updated: 2026-10-11

## Hostinger-first release

The Hostinger workflow is implemented end to end using the interfaces Hostinger officially documents for mailbox clients: IMAP over TLS at `imap.hostinger.com:993` and SMTP over TLS at `smtp.hostinger.com:465`. Hostinger also documents SMTP STARTTLS on port 587 as a fallback; the provider supports server/port/TLS overrides internally, while the dashboard uses the secure defaults. References: [Hostinger configuration details](https://support.hostinger.com/en/articles/1575756-how-to-get-email-account-configuration-details-for-hostinger-email) and [Hostinger protocol support](https://support.hostinger.com/en/articles/1583644-does-hostinger-support-pop3-imap-and-smtp).

No Hostinger message-content REST API is assumed. A Hostinger hPanel API token is not used for mailbox messages.

### Verified in code and local automated checks

- Hostinger connection validation checks both IMAP login/INBOX access and SMTP authentication.
- Folder listing, newest-first message listing with cursors, server-side IMAP search, MIME message retrieval, SMTP sending, threaded replies, and attachment retrieval are implemented.
- Hostinger drafts, forwarding, and webhooks explicitly return unsupported capability errors. POP3 is not used because it lacks the mailbox semantics OpenMail needs.
- Administrators can add, validate, edit, reconnect, disable, re-enable, and remove Hostinger mailboxes. Passwords are encrypted with versioned AES-256-GCM and never returned to the browser.
- Administrators can create MCP clients, choose mailbox grants and scopes, receive a token once, rotate tokens, disable/re-enable clients, and revoke clients and credentials.
- MCP authentication checks credential/client status, expiry, scopes, mailbox grants, and a transaction-safe per-client request limit.
- Sends reserve a database idempotency record before delivery. Workspace and mailbox hourly limits are checked under a transaction lock. Successful results are replayed and in-flight duplicates are rejected.
- Success, denial, and failure outcomes are audited. Dashboard mutations are also audited.
- Retrieved HTML is allow-list sanitized before MCP delivery. Incoming/outgoing attachments are size limited; bytes are returned as explicit base64.
- Administrator bootstrap is one-time and transaction-serialized. It atomically creates the owner/workspace/settings, requires a strong temporary password, and forces password replacement before dashboard access.
- RLS isolates workspace rows. Provider credentials and MCP hashes have no authenticated-user policies and are accessed only by server code.

### Automated verification

- `pnpm typecheck`: passed
- `pnpm test`: passed (12 tests)
- `pnpm lint`: passed
- `pnpm build`: passed
- The build emits `/api/mcp`, `/auth/update-password`, and dashboard routes.

## Requires live credentials or external infrastructure

- A real Hostinger mailbox is required to live-verify login, provider-specific folder names, search behavior, delivery, reply threading, and representative attachments. These are not claimed as live verified.
- A configured Supabase project is required for live migration, RLS, and concurrent-send integration tests. No live project was available in this session.
- Playwright requires a running app and configured Supabase, so it was not run here.
- Deliverability depends on the domain's MX/SPF/DKIM/DMARC configuration and Hostinger limits.

## Exact deployment steps

1. Create a Supabase project. Disable public sign-ups and add `https://YOUR_DOMAIN/auth/callback` to Auth redirect URLs.
2. Copy `.env.example` to `.env`. Set the Supabase values, `NEXT_PUBLIC_APP_URL`, a 32-byte base64 `OPENMAIL_MASTER_KEY` (`openssl rand -base64 32`), and an independent `MCP_TOKEN_PEPPER` of at least 32 characters. Never expose secrets with a `NEXT_PUBLIC_` prefix.
3. Install Node.js 22+ and pnpm 10. Run `pnpm install --frozen-lockfile`.
4. Authenticate and link the Supabase CLI, then run `pnpm db:migrate`. Confirm all migrations applied.
5. From a trusted terminal set `BOOTSTRAP_EMAIL`, a strong temporary `BOOTSTRAP_PASSWORD`, and `BOOTSTRAP_WORKSPACE`; run `pnpm setup --non-interactive`. Remove `BOOTSTRAP_PASSWORD` immediately. Sign in and replace it when prompted.
6. Deploy with the Node.js runtime and the same non-bootstrap variables. The runtime must permit outbound TCP to ports 993 and 465.
7. In `/dashboard/mailboxes`, enter the full Hostinger address and mailbox password and select **Validate and connect**. Storage occurs only after IMAP and SMTP validate.
8. In `/dashboard/clients`, select least-privilege grants/scopes, create a client, and copy its one-time `omcp_...` token.
9. Configure the MCP client for `https://YOUR_DOMAIN/api/mcp` with `Authorization: Bearer omcp_...`.
10. Run `pnpm typecheck && pnpm test && pnpm lint && pnpm build`. In staging, run `pnpm test:e2e` and a controlled Hostinger inbox/read/search/send/reply/attachment test.

## Remaining work outside the Hostinger-first target

- OAuth authorization-server flow for dynamic MCP authorization; current credentials are administrator-issued bearer tokens.
- Gmail, Microsoft Graph, and Zoho parity, OAuth callbacks, and webhooks.
- Invitations/MFA UI and richer audit/job/settings presentation.
- Dedicated long-running synchronization and metadata indexing.
- Live Supabase RLS/concurrency and Hostinger contract tests in CI with protected credentials.
