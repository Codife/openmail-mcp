import { AuthorizationError } from './errors';
export const MCP_SCOPES = ['accounts:read','messages:read','messages:search','messages:send','messages:reply','messages:forward','drafts:read','drafts:write','attachments:read'] as const;
export type McpScope = typeof MCP_SCOPES[number];
export interface Principal { workspaceId: string; scopes: readonly string[]; mailboxIds: readonly string[]; disabled?: boolean; expiresAt?: Date | null }
export function authorize(principal: Principal, scope: McpScope, mailboxId?: string, now = new Date()): void {
  if (principal.disabled) throw new AuthorizationError('Credential is revoked');
  if (principal.expiresAt && principal.expiresAt <= now) throw new AuthorizationError('Credential is expired');
  if (!principal.scopes.includes(scope)) throw new AuthorizationError(`Missing scope: ${scope}`);
  if (mailboxId && !principal.mailboxIds.includes(mailboxId)) throw new AuthorizationError('Mailbox is not granted');
}
