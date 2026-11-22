import { db, storage } from 'hatchable';
export const access = 'user';
export const methods = ['GET','PUT','POST'];

export default async function(req,res){
  const uid=req.user?.id;
  if(!uid) return res.status(401).json({error:'Please sign in again to update your profile.'});

  if(req.method==='GET'){
    const [p,pref]=await Promise.all([
      db.query('SELECT user_id,display_name,avatar_storage_key FROM profiles WHERE user_id=$1',[uid]),
      db.query('SELECT styles,favorite_colors,fit_preference,size_notes FROM user_preferences WHERE user_id=$1',[uid])
    ]);
    const profile=p.rows[0]||{display_name:req.user.name||'',avatar_storage_key:null};
    let avatar_url=req.user.image||'';
    if(profile.avatar_storage_key){
      try{avatar_url=await storage.url(profile.avatar_storage_key,{ttl:3600});}
      catch(error){console.error('Profile avatar URL refresh failed:',error);avatar_url='';}
    }
    return res.setHeader('Cache-Control','no-store').json({
      profile:{display_name:profile.display_name||'',avatar_url},
      preferences:pref.rows[0]||{styles:[],favorite_colors:[],fit_preference:'',size_notes:''},
      user:{email:req.user.email||''}
    });
  }

  if(req.method==='POST'){
    const file=req.files?.find(f=>f.field==='avatar');
    if(!file) return res.status(400).json({error:'Choose a profile photo first.'});
    if(!/^image\/(jpeg|png|webp)$/.test(file.contentType)||file.buffer.length>5*1024*1024)
      return res.status(400).json({error:'Use a JPG, PNG or WebP image under 5 MB.'});

    const key=uid+'/profile/'+crypto.randomUUID();
    await storage.put(key,file.buffer,file.contentType);
    const old=await db.query('SELECT avatar_storage_key FROM profiles WHERE user_id=$1',[uid]);
    await db.query(
      "INSERT INTO profiles(user_id,display_name,avatar_url,avatar_storage_key) VALUES($1,$2,NULL,$3) ON CONFLICT(user_id) DO UPDATE SET avatar_storage_key=EXCLUDED.avatar_storage_key,updated_at=now()",
      [uid,req.user.name||'',key]
    );
    if(old.rows[0]?.avatar_storage_key){
      try{await storage.del(old.rows[0].avatar_storage_key);}catch(error){console.error('Old profile photo cleanup failed:',error);}
    }
    const avatar_url=await storage.url(key,{ttl:3600});
    return res.status(200).json({ok:true,avatar_url});
  }

  const body=req.body||{};
  const name=String(body.display_name??'').trim().slice(0,80);
  const styles=Array.isArray(body.styles)?body.styles:[];
  const colors=Array.isArray(body.favorite_colors)?body.favorite_colors:[];
  const fit=String(body.fit_preference??'');
  const notes=String(body.size_notes??'').slice(0,500);
  await db.query(
    "INSERT INTO profiles(user_id,display_name) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,updated_at=now()",
    [uid,name]
  );
  await db.query(
    "INSERT INTO user_preferences(user_id,styles,favorite_colors,fit_preference,size_notes) VALUES($1,$2::jsonb,$3::jsonb,$4,$5) ON CONFLICT(user_id) DO UPDATE SET styles=EXCLUDED.styles,favorite_colors=EXCLUDED.favorite_colors,fit_preference=EXCLUDED.fit_preference,size_notes=EXCLUDED.size_notes,updated_at=now()",
    [uid,JSON.stringify(styles),JSON.stringify(colors),fit,notes]
  );
  const [p,pref]=await Promise.all([
    db.query('SELECT display_name FROM profiles WHERE user_id=$1',[uid]),
    db.query('SELECT styles,favorite_colors,fit_preference,size_notes FROM user_preferences WHERE user_id=$1',[uid])
  ]);
  return res.json({ok:true,profile:p.rows[0],preferences:pref.rows[0]});
}