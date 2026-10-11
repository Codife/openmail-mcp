import 'server-only'; import { createAdminClient } from '@openmail/database'; export const admin=()=>createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!);
