import type { NextConfig } from 'next';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
const rootEnv=resolve(process.cwd(),'../../.env');
if(!process.env.NEXT_PUBLIC_SUPABASE_URL&&existsSync(rootEnv))loadEnvFile(rootEnv);
const config: NextConfig={transpilePackages:['@openmail/auth','@openmail/config','@openmail/core','@openmail/database','@openmail/providers','@openmail/shared'],experimental:{serverActions:{bodySizeLimit:'2mb'}}};
export default config;
