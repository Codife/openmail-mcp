import type { NextConfig } from 'next';
const config: NextConfig={transpilePackages:['@openmail/auth','@openmail/config','@openmail/core','@openmail/database','@openmail/providers','@openmail/shared'],experimental:{serverActions:{bodySizeLimit:'2mb'}}};
export default config;
