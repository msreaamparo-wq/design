import { db, storage } from 'hatchable';
export const access = 'user';
export const methods = ['GET','POST','PUT','DELETE'];
async function withFreshImageUrls(rows){
 return Promise.all(rows.map(async row=>{
  if(!row.storage_key)return row;
  try{return {...row,image_url:await storage.url(row.storage_key,{ttl:86400})};}
  catch(error){console.error('Wardrobe image URL refresh failed:',error);return {...row,image_url:null};}
 }));
}
export default async function(req,res){
 const uid=req.user.id;
 if(req.method==='GET'){
  const {rows}=await db.query('SELECT * FROM wardrobe_items WHERE user_id=$1 ORDER BY created_at DESC',[uid]);
  return res.setHeader('Cache-Control','no-store').json({items:await withFreshImageUrls(rows)});
 }
 if(req.method==='POST'){
  if(req.body?.action==='bulk'){
   const files=(req.files||[]).filter(f=>f.field==='images');const category=String(req.body?.category||'').trim();
   if(!category)return res.status(400).json({error:'Choose a category for these wardrobe photos.'});
   if(!files.length||files.length>15)return res.status(400).json({error:'Choose between 1 and 15 images.'});
   if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.contentType)||file.buffer.length>8*1024*1024))return res.status(400).json({error:'Every image must be JPG, PNG or WebP and under 8 MB.'});
   const saved=[];
   for(const file of files){
    const filename=String(file.filename||'Wardrobe item');
    const base=filename.split('.').slice(0,-1).join('.').replaceAll('_',' ').replaceAll('-',' ').trim().slice(0,90)||'Wardrobe item';
    const key=uid+'/wardrobe/'+crypto.randomUUID();
    await storage.put(key,file.buffer,file.contentType);
    const q=await db.query('INSERT INTO wardrobe_items(user_id,name,category,description,image_url,storage_key) VALUES($1,$2,$3,$4,NULL,$5) RETURNING *',[uid,base,category,String(req.body.description||''),key]);
    saved.push(q.rows[0]);
   }
   return res.status(201).json({items:await withFreshImageUrls(saved),count:saved.length});
  }
  const name=String(req.body?.name||'').trim();const category=String(req.body?.category||'').trim();
  if(!name||!category)return res.status(400).json({error:'Name and category are required.'});
  let storage_key=null;
  const file=req.files?.find(f=>f.field==='image');
  if(file){
   if(!/^image\/(jpeg|png|webp)$/.test(file.contentType)||file.buffer.length>8*1024*1024)return res.status(400).json({error:'Use a JPG, PNG or WebP image under 8 MB.'});
   storage_key=uid+'/wardrobe/'+crypto.randomUUID()+'-'+String(file.filename||'garment').replace(/[^a-zA-Z0-9._-]/g,'');
   await storage.put(storage_key,file.buffer,file.contentType);
  }
  const {rows}=await db.query('INSERT INTO wardrobe_items(user_id,name,category,description,image_url,storage_key,colors,pattern,fabric,style) VALUES($1,$2,$3,$4,NULL,$5,$6::jsonb,$7,$8,$9) RETURNING *',[uid,name,category,String(req.body.description||''),storage_key,JSON.stringify(req.body.colors||[]),req.body.pattern||null,req.body.fabric||null,req.body.style||null]);
  return res.status(201).json({item:(await withFreshImageUrls(rows))[0]});
 }
 const id=String(req.body?.id||req.query?.id||'');if(!id)return res.status(400).json({error:'Item id is required.'});
 const found=await db.query('SELECT * FROM wardrobe_items WHERE id=$1 AND user_id=$2',[id,uid]);if(!found.rows.length)return res.status(404).json({error:'Wardrobe item not found.'});
 if(req.method==='DELETE'){
  if(found.rows[0].storage_key)await storage.del(found.rows[0].storage_key);
  await db.query('DELETE FROM wardrobe_items WHERE id=$1 AND user_id=$2',[id,uid]);return res.json({ok:true});
 }
 const {rows}=await db.query('UPDATE wardrobe_items SET name=$3,category=$4,description=$5,favorite=$6 WHERE id=$1 AND user_id=$2 RETURNING *',[id,uid,String(req.body.name||found.rows[0].name),String(req.body.category||found.rows[0].category),String(req.body.description??found.rows[0].description),Boolean(req.body.favorite??found.rows[0].favorite)]);
 return res.json({item:(await withFreshImageUrls(rows))[0]});
}