import { getEnv } from '@openmail/config'; import { createAdminClient } from '@openmail/database';
const env=getEnv();const db=createAdminClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SECRET_KEY);const owner=`worker-${process.pid}`;
async function tick(){const {data,error}=await db.schema('private').rpc('claim_job',{worker_id:owner,lease_seconds:env.JOB_LEASE_SECONDS});if(error)console.error('job claim failed',error.message);else if(data)console.log('claimed job',data.id);}setInterval(()=>void tick(),5_000);void tick();
