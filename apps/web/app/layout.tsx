import type { Metadata } from 'next'; import './globals.css';
export const metadata:Metadata={title:'OpenMail MCP',description:'Secure, self-hosted multi-provider email for MCP clients'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
