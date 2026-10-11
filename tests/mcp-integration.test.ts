import { describe,expect,it,vi } from 'vitest';
import { executeTool,type McpContext } from '@openmail/mcp';
import { HostingerProvider } from '@openmail/providers';
import type { EmailProvider } from '@openmail/core';

const accountId='11111111-1111-4111-8111-111111111111';
function context(overrides:Partial<McpContext>={}):McpContext{const provider={getCapabilities:()=>({list:true,search:true,send:true,reply:true,forward:false,drafts:false,attachments:true,webhooks:false}),sendMessage:vi.fn(async()=>({messageId:'sent-1',acceptedAt:'2026-10-11T00:00:00.000Z'}))} as unknown as EmailProvider;return{principal:{workspaceId:'workspace-a',scopes:['accounts:read','messages:send'],mailboxIds:[accountId]},accounts:{list:async workspaceId=>workspaceId==='workspace-a'?[{id:accountId,provider:'hostinger',displayName:'Mailbox',emailAddress:'owner@example.com',credentials:{password:'never-leak'}}]:[],get:async(workspaceId,id)=>workspaceId==='workspace-a'&&id===accountId?{id:accountId,provider:'hostinger',displayName:'Mailbox',emailAddress:'owner@example.com',credentials:{email:'owner@example.com',password:'secret'}}:null},providers:{create:()=>provider},audit:vi.fn(async()=>undefined),...overrides};}

describe('MCP integration boundaries',()=>{
  it('returns accounts without provider credentials',async()=>{const result=await executeTool(context(),'accounts_list',{}) as Record<string,unknown>[];expect(result[0]).not.toHaveProperty('credentials');});
  it('rejects a mailbox outside the principal grant before provider access',async()=>{await expect(executeTool(context(),'messages_send',{accountId:'22222222-2222-4222-8222-222222222222',message:{to:[{address:'to@example.com'}],cc:[],bcc:[],subject:'x',text:'hello',attachments:[],idempotencyKey:'1234567890abcdef'}})).rejects.toThrow(/Mailbox/);});
  it('routes sends through the idempotency guard',async()=>{const send=vi.fn(async(_account:string,_key:string,operation:()=>Promise<unknown>)=>operation());await executeTool(context({send}),'messages_send',{accountId,message:{to:[{address:'to@example.com'}],cc:[],bcc:[],subject:'x',text:'hello',attachments:[],idempotencyKey:'1234567890abcdef'}});expect(send).toHaveBeenCalledWith(accountId,'1234567890abcdef',expect.any(Function));});
});

describe('Hostinger provider contract',()=>{it('advertises only implemented protocol capabilities',()=>{expect(new HostingerProvider({email:'x@example.com',password:'x'}).getCapabilities()).toEqual({list:true,search:true,send:true,reply:true,forward:false,drafts:false,attachments:true,webhooks:false});});});
