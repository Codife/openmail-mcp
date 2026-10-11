import 'server-only';
import { createAdminClient } from '@openmail/database';

export function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url)
    throw new Error(
      'Server configuration error: NEXT_PUBLIC_SUPABASE_URL is missing',
    );
  if (!secret)
    throw new Error(
      'Server configuration error: SUPABASE_SECRET_KEY is missing',
    );
  return createAdminClient(url, secret);
}
