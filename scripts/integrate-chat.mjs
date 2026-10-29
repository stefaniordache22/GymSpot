import {readFile,writeFile} from 'node:fs/promises';
let s=await readFile('app.js','utf8');
if(s.includes("from './chat-client.js'"))throw Error('Live integration is already applied.');
s="import {censorText} from './moderation.js';\nimport {liveChatCard,liveConnected,joinLive,updateLive,sendLive,refreshLive} from './chat-client.js';\nimport {mapsCard,drawMap} from './maps.js';\n"+s;
s=s.replace("const esc=v=>String(v??'').replace",'const esc=v=>censorText(v).replace');
s=s.replace("let selected='maya'","state.profile.name=censorText(state.profile.name);state.profile.gym=censorText(state.profile.gym);\nlet selected='maya'");
function replaceFunction(name,next,code){const start=s.indexOf('function '+name+'('),end=s.indexOf('function '+next+'(',start+1);if(start<0||end<0)throw Error('Missing '+name);s=s.slice(0,start)+code+'\n'+s.slice(end);}
replaceFunction('chats','chatList',`function chats(){return heading('GOOD CONNECTIONS','Your crew.','Turn a hello into your next session.')+liveChatCard()+\`<input class="search" id="chat-search" placeholder="Search conversations…" aria-label="Search conversations" value="\${esc(query)}"><div id="chat-list">\${chatList()}</div><button class="primary" data-go="discover">Discover more partners</button><p class="demo-tag">\${liveConnected()?'Live messages sync through your GymSpot server.':'Example conversations below are demos. Join live chat to message real members.'}</p>\`;}`);
replaceFunction('chatList','conversation',`function chatList(){const list=partners.filter(p=>(!liveConnected()||p.liveId)&&p.name.toLowerCase().includes(query.toLowerCase()));return list.map(p=>\`<button class="card conversation" style="margin-bottom:16px" data-chat="\${p.id}"><span class="row">\${avatar(p)}<span class="grow"><span class="row between"><strong>\${esc(p.name)}</strong><small>\${p.liveId?'Live':'Demo'}</small></span><span class="preview">\${esc(state.messages[p.id]?.at(-1)?.text||'Start a conversation')}</span></span></span></button>\`).join('')||'<p class="empty">No other members yet. Open GymSpot on your other device and join live chat there.</p>';}`);
// Keep the current session UI, but identify live conversations clearly.
s=s.replace("'Demo partner · Usually trains in the evenings'","p.liveId?'Live GymSpot member · '+esc(p.gym):'Demo partner · Messages stay on this device'");
s=s.replace('<small>DEMO CONVERSATION · SAVED LOCALLY</small>','<small>${p.liveId?\'LIVE CONVERSATION\':\'DEMO CONVERSATION · SAVED LOCALLY\'}</small><div id="conversation-messages" style="display:contents">');
s=s.replace("${esc(m.text)}</div>`).join('')}`;}","${esc(m.text)}</div>`).join('')}</div>`;}");
s=s.replace("if(view==='profile')document.querySelector('#profile-form').insertAdjacentHTML('afterend',healthCard());","if(view==='profile')document.querySelector('#profile-form').insertAdjacentHTML('afterend',healthCard()+mapsCard()+liveChatCard());");
s=s.replace("const name=data.get('name').trim(),gym=data.get('gym').trim();","const name=censorText(data.get('name').trim()),gym=censorText(data.get('gym').trim());");
s=s.replace("toast('Profile saved. Your next match starts here.');","toast('Profile saved. Your next match starts here.');if(liveConnected())updateLive(sharedProfile()).catch(error=>toast(error.message));");
s=s.replace("const id=location.hash.split('/')[1],message=data.get('message').trim();","const id=location.hash.split('/')[1],message=censorText(data.get('message').trim());");
s=s.replace("if(!message)return;state.messages[id]??=[];","if(!message)return;if(id.startsWith('live-')){const input=e.target.elements.message;const button=e.target.querySelector('button');const clientId=input.dataset.pendingId||newId();input.dataset.pendingId=clientId;button.disabled=true;sendLive(id.slice(5),message,clientId).then(()=>{input.value='';delete input.dataset.pendingId;input.focus();}).catch(error=>toast(error.message+' Your message was not sent.')).finally(()=>button.disabled=false);return;}state.messages[id]??=[];");
s=s.replace("toast('Session plan saved locally.');","toast('Session plan saved locally.');if(id.startsWith('live-'))sendLive(id.slice(5),'Session plan: '+data.get('type')+' at '+state.profile.gym+' on '+data.get('date')+' at '+data.get('time'),newId()).catch(error=>toast('Plan saved locally; chat notification failed: '+error.message));");
const mapStart=s.indexOf('async function loadMap()'),mapEnd=s.indexOf("document.addEventListener('gymspot:health-workouts'",mapStart);if(mapStart<0||mapEnd<0)throw Error('Map markers missing');
s=s.slice(0,mapStart)+`async function loadMap(){const container=$('#map');try{await drawMap(container,visiblePartners(),id=>{selected=id;render();});}catch(error){toast(error.message);}}\n`+s.slice(mapEnd);
s=s.replace("${p.level} · ${p.distance} km away","${esc(p.level)} · ${p.distance==null?'Gym location not set':p.distance+' km away'}");
s=s.replace("${p.name.split(' ')[0]}</button>","${esc(p.name.split(' ')[0])}</button>");
s=s.replace("p.distance<=radius","(p.distance==null||p.distance<=radius)");
s=s.replace("quote:'Starting my fitness journey. Anyone up for an easy run?'}];","quote:'Starting my fitness journey. Anyone up for an easy run?'}];");
s=s.replace("avatar(partners.find(p=>p.id===upcoming.partner))","avatar(partners.find(p=>p.id===upcoming.partner)||{initials:'GP'})");
s=s.replace("partners.find(p=>p.id===upcoming.partner).name.split(' ')[0]","(partners.find(p=>p.id===upcoming.partner)?.name||'your partner').split(' ')[0]");
const helpers=`
function newId(){return crypto.randomUUID?.()||'message-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
function sharedProfile(){return {name:censorText(state.profile.name),gym:censorText(state.profile.gym),level:state.profile.level,interests:state.profile.interests};}
document.addEventListener('click',async e=>{const button=e.target.closest('#live-join,#live-update');if(!button)return;button.disabled=true;try{if(button.id==='live-join')await joinLive(sharedProfile());else await updateLive(sharedProfile());render();toast('Your live chat profile is ready.');}catch(error){toast(error.message);}finally{button.disabled=false;}});
document.addEventListener('gymspot:live-members',e=>{const members=e.detail.members;partners.splice(3);for(const m of members)partners.push({id:'live-'+m.id,liveId:m.id,name:censorText(m.name),initials:censorText(m.name).split(' ').map(v=>v[0]).join('').slice(0,2).toUpperCase(),age:'',level:m.level,interests:m.interests,gym:censorText(m.gym),quote:'Trains at '+censorText(m.gym),distance:null,lat:m.lat,lng:m.lng});const view=location.hash.slice(1).split('/')[0];if(['chat','discover','conversation'].includes(view))render();});
document.addEventListener('gymspot:live-messages',e=>{const {peer,self,messages}=e.detail;const id='live-'+peer;const formatted=messages.map(m=>({text:censorText(m.text),mine:m.from===self,id:m.id}));if(JSON.stringify(state.messages[id])===JSON.stringify(formatted))return;state.messages[id]=formatted;const target=document.querySelector('#conversation-messages');if(location.hash==='#conversation/'+id&&target){target.innerHTML=formatted.map(m=>\`<div class="message \${m.mine?'mine':''}">\${esc(m.text)}</div>\`).join('');$('#content').scrollTop=$('#content').scrollHeight;}});
document.addEventListener('gymspot:live-left',()=>{partners.splice(3);for(const key of Object.keys(state.messages))if(key.startsWith('live-'))delete state.messages[key];save();location.hash='chat';render();toast('Shared chat profile and messages deleted from this server.');});
document.addEventListener('gymspot:live-status',e=>{const status=document.querySelector('#live-status');if(status)status.textContent=e.detail.message;});
document.addEventListener('gymspot:map-error',e=>toast(e.detail.message));
`;
s=s.replace('\nrender();\n',helpers+'\nrender();\n');
await writeFile('app.js',s);
console.log('Integrated moderated profiles, Maps settings, and opt-in shared chat.');
