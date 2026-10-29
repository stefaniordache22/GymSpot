process.env.PLAYWRIGHT_BROWSERS_PATH=require('node:path').join(__dirname,'.playwright');
const {chromium,webkit,devices}=require('playwright-core');
const assert=require('node:assert/strict');
const base=process.env.SPOTTER_TEST_URL||'http://192.168.0.54:5173';
async function test(engine,name,device){
  const browser=await engine.launch(engine===chromium?{headless:true,channel:'msedge'}:{headless:true});
  try{
    const context=await browser.newContext({...devices[device]});
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.evaluate(()=>localStorage.clear());await page.reload();
    assert.equal(await page.evaluate(()=>window.isSecureContext),false,'Test must use the real HTTP LAN origin');
    await page.getByRole('button',{name:'+ Log a workout'}).tap();await page.locator('[name=minutes]').fill('35');await page.getByRole('button',{name:'Log workout',exact:true}).tap();assert.match(await page.locator('.stats').innerText(),/35/);
    await page.getByRole('link',{name:'Profile',exact:true}).tap();await page.locator('#name').fill(name+' tester');await page.getByRole('button',{name:'Dark',exact:true}).tap();await page.getByRole('button',{name:'Save changes'}).tap();await page.reload();assert.equal(await page.locator('#name').inputValue(),name+' tester');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.getByRole('link',{name:'Discover',exact:true}).tap();await page.getByRole('button',{name:'My level',exact:true}).tap();assert.equal(await page.locator('.pin').count(),0);await page.getByRole('button',{name:'Say hello to Maya'}).tap();
    await page.getByRole('button',{name:'Save session plan'}).tap();assert.match(await page.locator('main').innerText(),/60 minute session/);
    await page.getByRole('textbox',{name:'Message',exact:true}).fill('Hello from '+name);await page.getByRole('button',{name:'Send message'}).tap();assert.match(await page.locator('main').innerText(),new RegExp('Hello from '+name));
    assert.equal(await page.evaluate(()=>{const input=document.querySelector('.composer input').getBoundingClientRect();const button=document.querySelector('.composer button').getBoundingClientRect();return button.left>=input.right&&Math.abs(button.top-input.top)<10;}),true,'Composer send button must sit beside the input');
    await page.screenshot({path:`test-results/${name}-chat.png`});
    await page.setViewportSize({width:device.includes('iPhone')?393:412,height:430});await page.getByRole('textbox',{name:'Message',exact:true}).fill('Keyboard resize check');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.evaluate(()=>document.querySelector('.composer').getBoundingClientRect().bottom<=innerHeight+1),true);
    await page.setViewportSize({width:844,height:390});await page.getByRole('link',{name:'Home',exact:true}).tap();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Landscape overflow');await page.getByRole('button',{name:'Mark completed · log 60 min'}).tap();assert.match(await page.locator('.stats').innerText(),/95/);
    await page.setViewportSize({width:320,height:568});await page.getByRole('link',{name:'Profile',exact:true}).tap();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Small-phone overflow');await page.getByRole('button',{name:'Light',exact:true}).tap();await page.getByRole('button',{name:'Save changes'}).tap();await page.screenshot({path:`test-results/${name}-small-profile.png`});
    const manifest=await context.request.get(base+'/manifest.webmanifest');assert.equal(manifest.status(),200);assert.equal((await manifest.json()).display,'standalone');for(const size of [192,512]){const icon=await context.request.get(base+`/assets/icon-${size}.png`);assert.equal(icon.status(),200);assert.ok((await icon.body()).length>1000);}
    assert.deepEqual(errors,[]);console.log(`PASS ${name}: LAN origin, touch flows, workout logging, saved profile, themes, filters, session creation without secure-context UUID, chat, resized viewport, landscape, 320px layout, manifest, icons.`);
    await context.close();
  }finally{await browser.close();}
}
(async()=>{await test(webkit,'iphone-webkit','iPhone 13');await test(chromium,'android-chromium','Pixel 7');const browser=await chromium.launch({headless:true,channel:'msedge'});try{const context=await browser.newContext();const page=await context.newPage();await page.goto('http://localhost:5173');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await page.getByRole('link',{name:'Discover',exact:true}).click();await page.waitForSelector('#gym-search-form');assert.equal(await page.locator('.pin').count(),0);console.log('PASS offline app shell on a secure localhost origin.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});



