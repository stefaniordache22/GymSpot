import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {censorText} from './moderation.js';
export async function createChatAPI(directory){
  await mkdir(directory,{recursive:true});const file=join(directory,'chat.json');let db;
  try{db=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(db.members)||!Array.isArray(db.messages))throw Error('Invalid chat database');}catch(e){if(e.code!=='ENOENT')throw e;db={members:[],messages:[]};}
  let queue=Promise.resolve();const limits=new Map();let removedCoordinates=false;
  for(const member of db.members)for(const key of ['lat','lng','gymLat','gymLng'])if(key in member){delete member[key];removedCoordinates=true;}
  const hash=t=>createHash('sha256').update(t).digest('hex');
  const publicMember=m=>({id:m.id,name:censorText(m.name),gym:censorText(m.gym),level:m.level,interests:m.interests});
  const save=()=>{queue=queue.catch(()=>{}).then(async()=>{await writeFile(file+'.tmp',JSON.stringify(db),'utf8');await rename(file+'.tmp',file);});return queue;};
  if(removedCoordinates)await save();
  const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const profile=data=>{
    const name=censorText(String(data.name||'').trim()).slice(0,60),gym=censorText(String(data.gym||'').trim()).slice(0,100);
    if(!name||!gym)throw Error('A name and preferred gym are required.');
    const level=['Beginner','Intermediate','Advanced'].includes(data.level)?data.level:'Beginner';
    const interests=Array.isArray(data.interests)?data.interests.filter(i=>['Strength','Running','Mobility','HIIT'].includes(i)):[];
    return {name,gym,level,interests};
  };
  const body=async req=>{let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16384)throw Error('Request too large.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw Error('Invalid JSON.');}};
  const rate=(key,max)=>{const now=Date.now();const times=(limits.get(key)||[]).filter(t=>now-t<60000);if(times.length>=max)return false;times.push(now);limits.set(key,times);if(limits.size>10000)for(const [k,v]of limits)if(now-v.at(-1)>60000)limits.delete(k);return true;};
  return async(req,res,url)=>{
    if(!url.pathname.startsWith('/api/chat/'))return false;
    const origin=req.headers.origin;
    const ownOrigin=`http://${req.headers.host}`;
    if(origin&&origin!==ownOrigin&&!['capacitor://localhost','http://localhost','https://localhost'].includes(origin)){send(res,403,{error:'This origin is not allowed.'});return true;}
    if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');}
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return true;}
    try{
      if(req.method==='POST'&&url.pathname==='/api/chat/join'){
        if(!rate('join:'+req.socket.remoteAddress,20)){send(res,429,{error:'Please wait a minute before creating another chat profile.'});return true;}
        const p=profile(await body(req));const token=randomBytes(32).toString('hex');const member={id:randomUUID(),tokenHash:hash(token),...p};db.members.push(member);await save();send(res,201,{token,member:publicMember(member)});return true;
      }
      const token=req.headers.authorization?.replace(/^Bearer /,'');const member=token&&db.members.find(m=>m.tokenHash===hash(token));
      if(!member){send(res,401,{error:'Join live chat on this device first.'});return true;}
      if(url.pathname==='/api/chat/profile'&&req.method==='PATCH'){Object.assign(member,profile(await body(req)));await save();send(res,200,{member:publicMember(member)});return true;}
      if(url.pathname==='/api/chat/profile'&&req.method==='DELETE'){db.members=db.members.filter(m=>m.id!==member.id);db.messages=db.messages.filter(m=>m.from!==member.id&&m.to!==member.id);await save();send(res,200,{ok:true});return true;}
      if(url.pathname==='/api/chat/members'&&req.method==='GET'){send(res,200,{self:publicMember(member),members:db.members.filter(m=>m.id!==member.id).map(publicMember)});return true;}
      if(url.pathname==='/api/chat/messages'&&req.method==='GET'){
        const peer=url.searchParams.get('peer');if(!db.members.some(m=>m.id===peer&&m.id!==member.id)){send(res,404,{error:'This member is no longer available.'});return true;}
        const messages=db.messages.filter(m=>(m.from===member.id&&m.to===peer)||(m.from===peer&&m.to===member.id)).slice(-500).map(m=>({...m,text:censorText(m.text)}));send(res,200,{messages});return true;
      }
      if(url.pathname==='/api/chat/messages'&&req.method==='POST'){
        const data=await body(req);if(typeof data.text!=='string'||!data.text.trim()||data.text.length>2000){send(res,400,{error:'Messages must contain 1–2000 characters.'});return true;}
        if(!db.members.some(m=>m.id===data.peer&&m.id!==member.id)){send(res,404,{error:'Choose another GymSpot member.'});return true;}
        const clientId=typeof data.clientId==='string'?data.clientId.slice(0,100):randomUUID();const previous=db.messages.find(m=>m.from===member.id&&m.clientId===clientId&&m.to===data.peer);if(previous){send(res,200,{message:previous});return true;}
        if(!rate('send:'+member.id,60)){send(res,429,{error:'You’re sending messages too quickly. Try again shortly.'});return true;}
        const message={id:randomUUID(),clientId,from:member.id,to:data.peer,text:censorText(data.text.trim()),createdAt:new Date().toISOString()};db.messages.push(message);await save();send(res,201,{message});return true;
      }
      send(res,404,{error:'Unknown chat endpoint.'});
    }catch(error){send(res,400,{error:error.message||'The chat request could not be completed.'});}
    return true;
  };
}
