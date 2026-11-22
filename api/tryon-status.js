import {db,storage,config} from 'hatchable';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
 const uid=req.user.id,id=String(req.query?.id||'');if(!id)return res.status(400).json({error:'Try-on id is required.'});
 const q=await db.query('SELECT * FROM virtual_tryons WHERE id=$1 AND user_id=$2',[id,uid]);if(!q.rows.length)return res.status(404).json({error:'Try-on session not found.'});
 const row=q.rows[0];
 if(row.status!=='pending'||!row.provider_prediction_id){
  let result_image_url=row.result_image_url;
  if(row.result_storage_key){try{result_image_url=await storage.url(row.result_storage_key,{ttl:86400});}catch(error){console.error('Try-on image URL refresh failed:',error);result_image_url=null;}}
  return res.setHeader('Cache-Control','no-store').json({tryon:{id:row.id,status:row.status,result_image_url,error:row.error}});
 }
 try{
  const key=await config.get('FASHN_API_KEY');const r=await fetch('https://api.fashn.ai/v1/status/'+encodeURIComponent(row.provider_prediction_id),{headers:{'Authorization':'Bearer '+key},timeout_ms:12000});const d=await r.json().catch(()=>({}));
  if(!r.ok)return res.status(502).json({error:'Could not check the fitting status right now.'});
  if(d.status==='completed'&&Array.isArray(d.output)&&d.output[0]){
   const img=await fetch(d.output[0],{timeout_ms:15000});if(!img.ok)throw Error('Could not retrieve the generated fitting image.');
   const bytes=new Uint8Array(await img.arrayBuffer());const mime=img.headers.get('content-type')||'image/jpeg';const resultKey=uid+'/tryon/result-'+crypto.randomUUID();
   await storage.put(resultKey,bytes,mime);
   await db.query('UPDATE virtual_tryons SET status=$3,result_image_url=NULL,result_storage_key=$5,error=NULL WHERE id=$1 AND user_id=$2',[id,uid,'completed',null,resultKey]);
   const resultUrl=await storage.url(resultKey,{ttl:86400});
   return res.setHeader('Cache-Control','no-store').json({tryon:{id,status:'completed',result_image_url:resultUrl}});
  }
  if(d.status==='failed'||d.status==='canceled'){const msg=String(d.error?.message||d.error||'The fitting could not be completed.').slice(0,300);await db.query('UPDATE virtual_tryons SET status=$3,error=$4 WHERE id=$1 AND user_id=$2',[id,uid,'failed',msg]);return res.json({tryon:{id,status:'failed',error:msg}});}
  return res.json({tryon:{id,status:d.status||'pending'}});
 }catch(e){console.error('FASHN status failed',String(e.message||e));return res.status(502).json({error:'Could not retrieve the try-on result. Please retry in a moment.'});}
}