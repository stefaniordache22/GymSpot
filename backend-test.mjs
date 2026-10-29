import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {censorText} from './moderation.js';
const dir=await mkdtemp(resolve('test-results/chat-api-'));
let server;
function start(){server=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:'5174',GYMSPOT_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{server.once('error',reject);server.stdout.on('data',s=>{if(String(s).includes('running at'))resolve();});server.stderr.on('data',s=>reject(Error(String(s))));});}
async function stop(){if(server?.exitCode===null){const ended=new Promise(r=>server.once('exit',r));server.kill();await ended;}}
const api=async(path,{token,method='GET',data,origin}={})=>{const r=await fetch('http://127.0.0.1:5174/api/chat/'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,data:await r.json()};};
try{
  for(const word of ['fuck','shit!','f u c k','sh1t','fúck','f\u200buck','💪 fuck','nigger','faggot','muie'])assert.ok(censorText(word).includes('****'));
  for(const text of ['class','assistant','Scunthorpe','Dickinson','Push harder 💪','assessment'])assert.equal(censorText(text),text);
  await start();assert.equal((await api('members')).status,401);assert.equal((await api('join',{method:'POST',origin:'https://untrusted.example',data:{name:'X',gym:'Y'}})).status,403);
  const a=(await api('join',{method:'POST',data:{name:'Alice shit',gym:'Gym fuck',level:'Intermediate',interests:['Strength'],lat:44.432,lng:26.106,workouts:[{privateHealth:true}]}})).data;
  assert.ok(!('lat' in a.member)&&!('lng' in a.member),'Coordinates must never be accepted or returned');
  const b=(await api('join',{method:'POST',data:{name:'Bob',gym:'Gym B',level:'Beginner',interests:['Running']}})).data;
  const c=(await api('join',{method:'POST',data:{name:'Chris',gym:'Gym C'}})).data;
  assert.equal(a.member.name,'Alice ****');assert.equal(a.member.gym,'Gym ****');assert.equal((await api('members',{token:a.token})).data.members.length,2);
  const message=(await api('messages',{method:'POST',token:a.token,data:{peer:b.member.id,text:'hello sh1t 💪 fuck!',clientId:'same-send'}})).data.message;
  assert.equal(message.text,'hello **** 💪 ****!');assert.equal((await api('messages',{method:'POST',token:a.token,data:{peer:b.member.id,text:'hello sh1t 💪 fuck!',clientId:'same-send'}})).data.message.id,message.id);
  const history=(await api('messages?peer='+a.member.id,{token:b.token})).data.messages;assert.equal(history.length,1);assert.equal(history[0].from,a.member.id);
  assert.equal((await api('messages?peer='+a.member.id,{token:c.token})).data.messages.length,0);
  assert.equal((await api('messages',{method:'POST',token:a.token,data:{peer:'maya',text:'Hey'}})).status,404);
  assert.equal((await api('messages',{method:'POST',token:a.token,data:{peer:b.member.id,text:'x'.repeat(2001)}})).status,400);
  await stop();const legacy=JSON.parse(await readFile(resolve(dir,'chat.json'),'utf8'));legacy.members[0].lat=44.432;legacy.members[0].lng=26.106;await writeFile(resolve(dir,'chat.json'),JSON.stringify(legacy));await start();assert.equal((await api('messages?peer='+a.member.id,{token:b.token})).data.messages.length,1);
  const migrated=(await api('members',{token:a.token})).data.self;assert.ok(!('lat' in migrated)&&!('lng' in migrated));
  const disk=await readFile(resolve(dir,'chat.json'),'utf8');assert.ok(!disk.includes(a.token));assert.ok(!disk.includes('privateHealth'));assert.ok(!disk.includes('sh1t'));assert.ok(!disk.includes('Gym fuck'));
  assert.ok(!disk.includes('44.432')&&!disk.includes('26.106'),'Legacy coordinates must be removed from disk');
  await api('profile',{method:'DELETE',token:a.token});assert.equal((await api('members',{token:a.token})).status,401);assert.equal((await api('messages?peer='+a.member.id,{token:b.token})).status,404);
  console.log('PASS moderation boundaries/obfuscation/emoji, authenticated chat, participant isolation, server filtering, idempotency, disk persistence, deletion, and Health-data exclusion.');
}finally{await stop();}
