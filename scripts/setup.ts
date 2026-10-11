import { createInterface } from 'node:readline/promises'; import { stdin,stdout } from 'node:process'; import { randomBytes } from 'node:crypto'; import { createAdminClient } from '@openmail/database';
const nonInteractive=process.argv.includes('--non-interactive');
const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','OPENMAIL_MASTER_KEY','MCP_TOKEN_PEPPER'] as const;
for(const key of required)if(!process.env[key])throw new Error(`Missing required environment variable: ${key}`);
if(Buffer.from(process.env.OPENMAIL_MASTER_KEY!,'base64').length!==32)throw new Error('OPENMAIL_MASTER_KEY must be a base64-encoded 32-byte key');
const rl=createInterface({input:stdin,output:stdout});
async function value(name:string,prompt:string){const existing=process.env[name];if(existing)return existing;if(nonInteractive)throw new Error(`${name} is required in non-interactive mode`);return (await rl.question(`${prompt}: `)).trim();}
try{
  const email=await value('BOOTSTRAP_EMAIL','Initial owner email'); const password=await value('BOOTSTRAP_PASSWORD','Temporary owner password'); const workspaceName=await value('BOOTSTRAP_WORKSPACE','Workspace name');
  if(password.length<12||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||!/[^A-Za-z0-9]/.test(password))throw new Error('Bootstrap password must be 12+ characters and include upper, lower, number, and symbol characters');
  const db=createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!);
  const marker=await db.from('system_settings').select('value').eq('key','bootstrap').maybeSingle();
  if(marker.data){console.log('Bootstrap is already complete. No changes were made.');process.exitCode=0;}else{
    const created=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:email.split('@')[0],password_change_required:true}});
    if(created.error&&!/already/i.test(created.error.message))throw created.error;
    let user=created.data.user;if(!user){const listed=await db.auth.admin.listUsers();user=listed.data.users.find(x=>x.email?.toLowerCase()===email.toLowerCase())??null;}if(!user)throw new Error('Unable to resolve owner account');
    const slug=`workspace-${randomBytes(4).toString('hex')}`;const bootstrapped=await db.rpc('bootstrap_administrator',{owner_id:user.id,owner_name:user.user_metadata.display_name,workspace_name:workspaceName,workspace_slug:slug});if(bootstrapped.error){if(created.data.user)await db.auth.admin.deleteUser(created.data.user.id);throw bootstrapped.error;}
    const verify=await db.auth.signInWithPassword({email,password});if(verify.error)throw new Error(`Bootstrap created records but auth verification failed: ${verify.error.message}`);await db.auth.signOut();
    console.log(`Setup complete. Dashboard: ${process.env.NEXT_PUBLIC_APP_URL??'http://localhost:3000'}/login`);console.log('Remove BOOTSTRAP_PASSWORD from the environment now and require the owner to reset it.');
  }
}finally{rl.close();}
