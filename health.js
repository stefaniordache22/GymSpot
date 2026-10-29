import {registerPlugin,Capacitor,unzipSync,strFromU8} from './assets/vendor/health-runtime.js';
import {parseHealthXML} from './health-core.js';
const native=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='ios';
const Health=registerPlugin('GymSpotHealth');
export function healthCard(){return `<section class="card" id="health-card"><h3>Apple Health</h3><p class="helper">${native?'Bring your recent Health workouts into your activity charts.':'Import workouts from an Apple Health export. Direct Health sync is available in the native iPhone version.'}</p>${native?'<button type="button" class="secondary" id="health-sync">Connect / sync Apple Health</button>':''}<label class="secondary health-file">Import Health export<input id="health-file" type="file" accept=".xml,.zip,application/zip,text/xml,application/xml" hidden></label><p class="helper">Workouts stay on this device. Health data isn’t shared with partners.</p><p id="health-status" role="status" aria-live="polite"></p></section>`;}
function status(message){const el=document.querySelector('#health-status');if(el)el.textContent=message;}
document.addEventListener('change',async e=>{
  if(e.target.id!=='health-file')return;const file=e.target.files[0];if(!file)return;
  try{
    if(file.size>128*1024*1024)throw Error('Please choose an export smaller than 128 MB.');
    status('Reading your Health export…');let xml;
    if(file.name.toLowerCase().endsWith('.zip')){
      let oversized=false;
      const entries=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:entry=>{if(!/(^|\/)export\.xml$/i.test(entry.name))return false;if(entry.originalSize>128*1024*1024){oversized=true;return false;}return true;}});
      if(oversized)throw Error('The XML inside this export is larger than 128 MB.');
      const data=Object.values(entries)[0];if(!data)throw Error('No export.xml was found inside this ZIP.');xml=strFromU8(data);
    }else xml=await file.text();
    const workouts=parseHealthXML(xml);if(!workouts.length)throw Error('No supported workouts were found in this export.');
    document.dispatchEvent(new CustomEvent('gymspot:health-workouts',{detail:{workouts}}));
  }catch(error){status(error.message||'Could not read the Health export.');}finally{e.target.value='';}
});
document.addEventListener('click',async e=>{
  const button=e.target.closest('#health-sync');if(!button)return;
  button.disabled=true;status('Opening Apple Health permissions…');
  try{await Health.requestAccess();const result=await Health.readWorkouts({days:30});if(!result.workouts.length){status('No readable workouts in the last 30 days. Health may have no data, or read access may be disabled.');return;}document.dispatchEvent(new CustomEvent('gymspot:health-workouts',{detail:{workouts:result.workouts}}));}
  catch(error){status(error.message||'Health sync could not complete. You can use a Health export instead.');}
  finally{button.disabled=false;}
});
