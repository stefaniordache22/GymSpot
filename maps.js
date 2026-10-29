export function mapsCard(){return `<section class="card"><h3>Google Maps</h3><p class="helper">Show gyms in a city or area you choose. Enable Maps JavaScript API, Places API (New), and billing in Google Cloud, then restrict the key to your app’s addresses.</p><form id="maps-form"><label>Google Maps API key<input name="key" type="password" placeholder="AIza…" autocomplete="off" spellcheck="false"></label><label>Map ID (optional)<input name="mapId" placeholder="DEMO_MAP_ID" autocomplete="off"></label><button class="secondary">Save Maps settings</button><button type="button" class="secondary" id="maps-clear">Remove saved Maps key</button></form><p class="helper">GymSpot never requests GPS access or puts people on the map. Your chosen search area is sent to Google to find gyms; it is not shared with GymSpot members.</p><a href="https://developers.google.com/maps/api-security-best-practices" target="_blank" rel="noopener noreferrer">Google key setup and restrictions</a><p id="maps-status" role="status" class="helper"></p></section>`;}
export async function mapSettings(){let saved={};try{saved=JSON.parse(localStorage.getItem('gymspot-maps'))||{};}catch{}let config={};if(!window.Capacitor?.isNativePlatform?.()){try{config=await fetch('/api/config').then(r=>r.json());}catch{}}return {key:saved.key||config.googleMapsKey||'',mapId:saved.mapId||config.googleMapId||'DEMO_MAP_ID'};}
function message(text){const status=document.querySelector('#maps-status');if(status)status.textContent=text;}
document.addEventListener('submit',e=>{if(e.target.id!=='maps-form')return;e.preventDefault();try{const data=new FormData(e.target);const key=data.get('key').trim(),mapId=data.get('mapId').trim();if(!/^AIza[\w-]{20,80}$/.test(key))throw Error('Enter a valid Google Maps API key beginning with AIza.');if(mapId&&!/^[\w-]{1,80}$/.test(mapId))throw Error('Enter a valid Map ID.');localStorage.setItem('gymspot-maps',JSON.stringify({key,mapId:mapId||'DEMO_MAP_ID'}));message('Maps settings saved. Open Discover to load your map. If a map was already loaded, refresh the page to apply the new key.');e.target.reset();}catch(error){message(error.message);}});
document.addEventListener('click',e=>{if(!e.target.closest('#maps-clear'))return;localStorage.removeItem('gymspot-maps');message('Saved key removed. The server key, if configured, will be used. Refresh to apply this change.');});
let loader;
export function browseArea(){try{return localStorage.getItem('gymspot-browse-area')||'Bucharest';}catch{return 'Bucharest';}}

export async function drawMap(container){
  const status=document.querySelector('#gym-results');const searchButton=document.querySelector('#search-visible-area');
  const {key,mapId}=await mapSettings();if(!container.isConnected)return;
  if(!key){if(status)status.textContent='Add your Google Maps key in Profile to see real gyms in the area you choose.';return;}
  const settingsKey=key+'|'+mapId;
  if(loader?.key&&loader.key!==settingsKey)throw Error('Refresh the page to apply your changed Maps settings.');
  if(!loader){loader={key:settingsKey};loader.promise=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Google Maps timed out. Check your connection.')),15000);
    window.gymspotMapReady=()=>{clearTimeout(timer);resolve();};
    window.gm_authFailure=()=>{clearTimeout(timer);reject(Error('Google Maps rejected the key. Check API enablement, billing, and website restrictions.'));document.dispatchEvent(new CustomEvent('gymspot:map-error',{detail:{message:'Google Maps rejected this key. Check your Google Cloud settings.'}}));};
    const script=document.createElement('script');script.async=true;script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&libraries=marker,places&callback=gymspotMapReady`;script.onerror=()=>{clearTimeout(timer);reject(Error('Google Maps could not load.'));};document.head.appendChild(script);
  });}
  await loader.promise;if(!container.isConnected)return;
  const map=new google.maps.Map(container,{center:{lat:44.431,lng:26.104},zoom:13,mapId,mapTypeControl:false,streetViewControl:false,fullscreenControl:false});
  const form=document.querySelector('#gym-search-form');let markers=[],requestId=0;
  if(form)form.querySelector('button').disabled=false;
  if(searchButton)searchButton.disabled=false;
  async function search(area,visibleOnly=false){
    if(!container.isConnected)return;const current=++requestId;
    if(status)status.textContent='Finding gyms…';
    try{
      const request={textQuery:visibleOnly?'gyms':'gyms in '+area,fields:['id','displayName','formattedAddress','location','googleMapsURI'],includedType:'gym',useStrictTypeFiltering:true,maxResultCount:20};
      if(visibleOnly){const bounds=map.getBounds();if(!bounds)throw Error('Wait for the map to finish loading, then try again.');request.locationRestriction=bounds;}
      const {places}=await google.maps.places.Place.searchByText(request);
      if(current!==requestId||!container.isConnected)return;
      for(const marker of markers)marker.map=null;markers=[];status?.replaceChildren();
      const gyms=(places||[]).filter(place=>place.location);
      if(!gyms.length){if(status)status.textContent='No gyms found. Try another city or pan to another area.';return;}
      const bounds=new google.maps.LatLngBounds();
      for(const gym of gyms){
        bounds.extend(gym.location);
        const result=document.createElement('section');result.className='card';const title=document.createElement('h3');title.textContent=gym.displayName||'Gym';const address=document.createElement('p');address.className='helper';address.textContent=gym.formattedAddress||'';result.append(title,address);
        if(/^https:\/\//.test(gym.googleMapsURI||'')){const link=document.createElement('a');link.href=gym.googleMapsURI;link.target='_blank';link.rel='noopener noreferrer';link.textContent='View gym on Google Maps';result.append(link);}
        const marker=new google.maps.marker.AdvancedMarkerElement({position:gym.location,map,title:gym.displayName||'Gym'});marker.addListener('click',()=>{result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});});markers.push(marker);status?.appendChild(result);
      }
      if(!visibleOnly)map.fitBounds(bounds);
    }catch(error){if(current!==requestId||!container.isConnected)return;if(status)status.textContent='Gym search is unavailable. Enable Places API (New), check key restrictions, or try again. '+(error.message||'');}
  }
  form?.addEventListener('submit',e=>{e.preventDefault();const area=new FormData(form).get('area').trim();if(!area||area.length>100){if(status)status.textContent='Enter a city or area (up to 100 characters).';return;}try{localStorage.setItem('gymspot-browse-area',area);}catch{}search(area);});
  searchButton?.addEventListener('click',()=>search('',true));
  await search(form?.elements.area.value||browseArea());
}

