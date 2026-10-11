export interface OAuthTokenSet { accessToken: string; refreshToken?: string; expiresAt?: number; scope?: string }
export async function refreshOAuthToken(input: { tokenUrl: string; clientId: string; clientSecret: string; refreshToken: string; extra?: Record<string,string> }): Promise<OAuthTokenSet> {
  const response = await fetch(input.tokenUrl,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:input.clientId,client_secret:input.clientSecret,refresh_token:input.refreshToken,...input.extra})});
  if (!response.ok) throw new Error(`OAuth refresh failed (${response.status})`);
  const data = await response.json() as { access_token:string; refresh_token?:string; expires_in?:number; scope?:string };
  return { accessToken:data.access_token, ...(data.refresh_token?{refreshToken:data.refresh_token}:{}), ...(data.expires_in?{expiresAt:Date.now()+data.expires_in*1000}:{}), ...(data.scope?{scope:data.scope}:{}) };
}
