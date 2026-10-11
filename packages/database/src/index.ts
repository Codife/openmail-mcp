import { createClient } from '@supabase/supabase-js';
export const createAdminClient=(url:string,secret:string)=>createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
export type WorkspaceRole='owner'|'admin'|'member'|'viewer';
