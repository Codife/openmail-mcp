import type { SendMessageInput } from '@openmail/shared';
export type ProviderKind = 'gmail'|'microsoft'|'zoho'|'hostinger'|'imap-smtp';
export interface ProviderCapabilities { list: boolean; search: boolean; send: boolean; reply: boolean; forward: boolean; drafts: boolean; attachments: boolean; webhooks: boolean }
export interface MailFolder { id: string; name: string; type?: string; unreadCount?: number }
export interface MessageSummary { id: string; threadId?: string; folderId?: string; subject: string; from: string; to: string[]; receivedAt: string; snippet?: string; unread: boolean; hasAttachments: boolean }
export interface EmailMessage extends MessageSummary { cc: string[]; bcc: string[]; text?: string; html?: string; headers: Record<string,string>; attachments: AttachmentMetadata[] }
export interface AttachmentMetadata { id: string; filename: string; contentType: string; size: number }
export interface Page<T> { items: T[]; nextCursor?: string }
export interface MessageQuery { folderId?: string; cursor?: string; limit?: number }
export interface SearchQuery extends MessageQuery { query: string }
export interface Draft { id: string; message: Partial<SendMessageInput>; updatedAt: string }
export interface SendResult { messageId: string; threadId?: string; acceptedAt: string }
export interface EmailProvider {
  validateConnection(): Promise<{ ok: boolean; account?: string; error?: string }>;
  listFolders(): Promise<MailFolder[]>; listMessages(query: MessageQuery): Promise<Page<MessageSummary>>; getMessage(id: string): Promise<EmailMessage>; searchMessages(query: SearchQuery): Promise<Page<MessageSummary>>;
  sendMessage(input: SendMessageInput): Promise<SendResult>; replyToMessage(input: SendMessageInput & { messageId: string }): Promise<SendResult>; forwardMessage(input: SendMessageInput & { messageId: string }): Promise<SendResult>;
  listDrafts(): Promise<Draft[]>; getDraft(id: string): Promise<Draft>; createDraft(input: Partial<SendMessageInput>): Promise<Draft>; updateDraft(id: string,input: Partial<SendMessageInput>): Promise<Draft>; deleteDraft(id: string): Promise<void>;
  listAttachments(messageId: string): Promise<AttachmentMetadata[]>; getAttachment(messageId: string, attachmentId: string): Promise<{ metadata: AttachmentMetadata; bytes: Uint8Array }>;
  getCapabilities(): ProviderCapabilities;
}
export interface ProviderFactory { create(kind: ProviderKind, credentials: Record<string,string>, settings?: Record<string,unknown>): EmailProvider }
