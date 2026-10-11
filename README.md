# OpenMail MCP

OpenMail MCP is a self-hosted, multi-workspace email control plane for MCP-compatible AI clients. It keeps message content at the provider by default and enforces workspace, mailbox, and operation scopes on every request.

The current release is Hostinger-first. It uses Hostinger IMAP for folders, listing, search, message retrieval, and attachments, plus Hostinger SMTP for sending and threaded replies. Drafts and message forwarding are reported as unsupported rather than emulated. See [implementation status](docs/implementation-status.md) for the verified feature matrix and remaining work.

## Requirements

- Node.js 22 or newer
- pnpm 10
- A Supabase project
- A Hostinger mailbox address and its mailbox password
- A deployment environment that permits outbound TCP to Hostinger IMAP port 993 and SMTP port 465

The Hostinger account API token is not a substitute for a mailbox password. OpenMail needs the mailbox password to authenticate to IMAP and SMTP.

## Local setup

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Configure the environment

Copy the example file:

```bash
cp .env.example .env
```

Generate independent secrets:

```bash
openssl rand -base64 32  # OPENMAIL_MASTER_KEY
openssl rand -base64 48  # MCP_TOKEN_PEPPER
openssl rand -base64 48  # WEBHOOK_SIGNING_SECRET
```

Fill in at least:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

OPENMAIL_MASTER_KEY=
OPENMAIL_MASTER_KEY_VERSION=1
MCP_TOKEN_PEPPER=
WEBHOOK_SIGNING_SECRET=

BOOTSTRAP_EMAIL=admin@example.com
BOOTSTRAP_PASSWORD=<temporary-strong-password>
BOOTSTRAP_WORKSPACE=My Workspace
ALLOW_PUBLIC_REGISTRATION=false

JOB_LEASE_SECONDS=60
MAX_ATTACHMENT_BYTES=10485760
LOG_LEVEL=info
```

`OPENMAIL_MASTER_KEY` must decode to exactly 32 bytes. Never expose `SUPABASE_SECRET_KEY`, `OPENMAIL_MASTER_KEY`, `MCP_TOKEN_PEPPER`, mailbox passwords, or MCP tokens through a `NEXT_PUBLIC_` variable. The checked-in `.gitignore` excludes `.env`.

### 3. Apply the database migrations

Authenticate and link the Supabase CLI:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm db:migrate
```

The migrations create the tenant schema, RLS policies, encrypted credential storage, MCP grants, audit logs, send idempotency, transaction-safe send limits, rate limiting, and one-time bootstrap function.

In Supabase Authentication settings:

- Disable public sign-ups unless you intentionally implement a registration workflow.
- Add `http://localhost:3000/auth/callback` for local development.
- Add `https://YOUR_DOMAIN/auth/callback` before production use.

### 4. Bootstrap the first administrator

Run the one-time setup from a trusted terminal:

```bash
pnpm setup --non-interactive
```

Bootstrap is transaction-serialized and cannot create a second initial workspace. After it succeeds:

1. Remove `BOOTSTRAP_PASSWORD` from `.env`.
2. Sign in at `/login`.
3. Replace the temporary password when prompted.
4. Do not place the new dashboard password in `.env`.

### 5. Start the application

```bash
pnpm dev
```

Open `http://localhost:3000`. The health endpoint is `http://localhost:3000/api/health`.

## Connect a Hostinger mailbox

1. Sign in as a workspace administrator.
2. Open `/dashboard/mailboxes`.
3. Enter the full Hostinger mailbox address and its mailbox password.
4. Select **Validate and connect**.

OpenMail validates both IMAP and SMTP before storing the mailbox. Credentials are encrypted with AES-256-GCM before being written to Supabase. Editing a mailbox without entering a new password retains its current credential; entering a new password reconnects and rotates the encrypted credential.

The default Hostinger endpoints are:

- IMAP: `imap.hostinger.com:993` with TLS
- SMTP: `smtp.hostinger.com:465` with TLS

## Create an MCP client

1. Open `/dashboard/clients`.
2. Give the client a descriptive name.
3. Select only the mailboxes it needs.
4. Select the minimum required scopes.
5. Create the client and copy the displayed `omcp_...` token immediately.

Configure the MCP client with:

```text
Endpoint: https://YOUR_DOMAIN/api/mcp
Authorization: Bearer omcp_...
```

The plaintext token is displayed once. Rotation revokes the previous token immediately. Disabling a client blocks it without deleting its configuration; revocation permanently revokes its active credentials.

## Deploy to Vercel

### Project settings

Import the GitHub repository into Vercel and configure:

- Production branch: `main`
- Root directory: repository root
- Framework preset: Next.js
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @openmail/web build`
- Output directory: `apps/web/.next`
- Node.js version: 22

These values are also declared in the repository's `vercel.json`. Do not use the removed TypeScript configuration file; Vercel compiles configuration before running the application build.

Vercel permits outbound SMTP except on port 25; OpenMail uses port 465 and awaits delivery before returning. The Node.js runtime supports the TCP sockets required by IMAP and SMTP. Do not select the Edge runtime for `/api/mcp`.

### Production environment variables

Add these in Vercel for the Production environment:

```dotenv
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
OPENMAIL_MASTER_KEY=
OPENMAIL_MASTER_KEY_VERSION=1
ALLOW_PUBLIC_REGISTRATION=false
MCP_TOKEN_PEPPER=
WEBHOOK_SIGNING_SECRET=
JOB_LEASE_SECONDS=60
MAX_ATTACHMENT_BYTES=3000000
LOG_LEVEL=info
```

Do not add `BOOTSTRAP_PASSWORD` after bootstrap is complete. Provider OAuth variables are optional for the Hostinger-first workflow.

Vercel Functions have a 4.5 MB request/response payload limit. The recommended production attachment limit is therefore 3,000,000 bytes because base64 increases the response size. Larger attachment delivery requires a separate streaming or signed-download design.

### Production checklist

1. Deploy the latest successful `main` commit.
2. Add `https://YOUR_DOMAIN/auth/callback` to Supabase Auth redirect URLs.
3. Confirm `https://YOUR_DOMAIN/api/health` returns an `ok` response.
4. Sign in and validate the Hostinger mailbox.
5. Create a restricted MCP client and test `accounts_list`.
6. Test inbox listing, retrieval, search, sending, reply threading, and a small attachment.
7. Review `/dashboard/activity` for the corresponding audit events.

## Updating credentials

- Hostinger mailbox password: change it in Hostinger, then use **Edit / reconnect** in OpenMail. Other mail clients using the old password must also be updated.
- MCP client token: use **Rotate token** in the dashboard and update the consuming client immediately.
- `MCP_TOKEN_PEPPER`: changing it invalidates every existing MCP token; redeploy and issue new client tokens.
- `WEBHOOK_SIGNING_SECRET`: update both sides of any webhook integration before enabling the new value.
- `OPENMAIL_MASTER_KEY`: do not replace it directly. Existing encrypted credentials would become unreadable. Retain the old key until a key-migration process has re-encrypted credentials, or reconnect every mailbox after a controlled rotation.

## Verification commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod --audit-level high
```

`pnpm test:e2e` additionally requires a running application and configured Supabase environment.

## Common commands

| Command                        | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `pnpm dev`                     | Start the web dashboard locally                           |
| `pnpm build`                   | Build every workspace package and the Next.js application |
| `pnpm lint`                    | Run repository linting                                    |
| `pnpm typecheck`               | Type-check every workspace package                        |
| `pnpm test`                    | Run unit and in-process integration tests                 |
| `pnpm test:e2e`                | Run Playwright smoke tests                                |
| `pnpm db:migrate`              | Push pending Supabase migrations                          |
| `pnpm setup --non-interactive` | Run one-time administrator bootstrap                      |

## Documentation

- [Architecture](docs/architecture.md)
- [Implementation status and limitations](docs/implementation-status.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
