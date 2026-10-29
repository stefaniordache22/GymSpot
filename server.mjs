import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {networkInterfaces} from 'node:os';
import {createChatAPI} from './chat-server.mjs';
const root=resolve(import.meta.dirname);
const port=Number(process.env.PORT)||5173;
const chatAPI=await createChatAPI(process.env.GYMSPOT_DATA_DIR||resolve(root,'.gymspot-data'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(await chatAPI(req,res,url))return;
  if(url.pathname==='/api/config'){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify({googleMapsKey:process.env.GOOGLE_MAPS_API_KEY||'',googleMapId:process.env.GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID',lanReady:true,chatEnabled:true,mapMode:'gyms',sharesCoordinates:false}));}
  let pathname;
  try{pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);}catch{res.writeHead(400);return res.end('Invalid URL');}
  const path=resolve(root,'.'+pathname);
  if(!path.startsWith(root+sep)||path.split(sep).some(p=>p.startsWith('.'))|| !types[extname(path)]){res.writeHead(404);return res.end('Not found');}
  try{const file=await readFile(path);res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(file);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'0.0.0.0',()=>{
  console.log(`GymSpot running at http://localhost:${port}`);
  for(const addresses of Object.values(networkInterfaces()))for(const n of addresses||[])if(n.family==='IPv4'&&!n.internal)console.log(`Phone / same Wi-Fi: http://${n.address}:${port}`);
});

