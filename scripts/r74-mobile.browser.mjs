import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='out/r74';await fs.mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const html=await fs.readFile('_pages/docs/index.html'),fixed=html.includes('R74-MOBILE-WORLD');
const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),htmlSHA256:hash(html),fixed,sandbox:true,physicalDevice:false,physicalGPU:false,scope:'Real DOM taps/settings/code UI and actual compiled lifecycle. Labelled safe-position, learned-skill and low-risk combat fixtures isolate interaction/save behavior. This is not natural campaign completion or remote multiplayer.',cases:[],findings:[],errors:[],screenshots:[]};
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});report.browser=await browser.version();
const android='Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
async function scenes(page){for(let i=0;i<80&&await page.evaluate(()=>!!storyScene);i++){await page.locator('#storyNext').click();await page.waitForTimeout(60);}}
async function ready(page){await page.waitForFunction(()=>started&&!loading&&!window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy&&window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().transitionDepth===0,null,{timeout:90000});await scenes(page);await page.evaluate(()=>{auto=false;guide=false;route=[];command=null;settings.autoSkill=false;settings.sound=false;settings.music=false;settings.narration=false;if(!storyScene)closePanel(true);});}
async function open({width=390,height=844,userAgent=android}={}){const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2,...(userAgent?{userAgent}:{})}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:4391/',{timeout:90000});await page.locator('#campaignNew54').tap({timeout:90000});await page.locator('#slotConfirmR73').tap();await ready(page);return{context,page};}
async function capture(page,name){const file=name+'.png';await page.screenshot({path:out+'/'+file,fullPage:true});report.screenshots.push(file);}
function finding(key,ok,details){report.cases.push({key,ok,details});if(!ok)report.findings.push(key);}
async function warp(page,id){await page.locator('#mobileSettingsR63').tap();await page.getByRole('button',{name:'코드',exact:true}).tap();await page.locator('#story-code-input').fill('777');await page.locator('#codeApply').tap();await page.locator('#codeMap').selectOption(id);await page.locator('#codeGo').tap();await page.waitForFunction(id=>document.getElementById('r71DifficultyConfirm')||zone===id&&!loading,id,{timeout:90000});if(await page.locator('#r71DifficultyConfirm').count())await page.locator('#r71DifficultyConfirm').tap();await ready(page);}
async function light(page,value){await page.locator('#mobileSettingsR63').tap();await page.locator('#flashlightModeR58').setChecked(value);await page.locator('#settingsClose').tap();await page.waitForFunction(v=>window.__STORYWORLD_PHASE1__.controller.state.three?.sightState24?.uniforms.sightEnabled24.value===(v?1:0),value,{timeout:30000});return page.evaluate(()=>{const s=window.__STORYWORLD_SIGHT24__.geometry(),r=window.__STORYWORLD_PHASE1__.controller.state.three,u=r.sightState24.uniforms,m=window.__STORYWORLD_SIGHT24__.mask();return{zone,layer,on:settings.flashlight58,geometry:s.enabled,origin:s.o,player:{x:player.x,y:player.y},shader:u.sightEnabled24.value,min:u.sightMin24.value.toArray(),span:u.sightSpan24.value.toArray(),maskCentre:m.enabled?Array.from(m.canvas.getContext('2d').getImageData(64,64,1,1).data):null,camera:window.__STORYWORLD_CAMERA_R63__.inspect()};});}
try{
 if(process.env.R74_CASE!=='coop'){
 for(const [label,ua]of [['android',android],['coarse-desktop-ua',null]]){const {context,page}=await open({userAgent:ua});try{const data=await page.evaluate(()=>({mobile:window.__STORYWORLD_MOBILE_R63__.inspect(),light:window.__STORYWORLD_PRESENTATION_R58__.inspect(),ua:navigator.userAgent,touch:navigator.maxTouchPoints}));finding('mobile-default-light-'+label,data.mobile.mobile&&data.light.defaultFlashlight,data);}finally{await context.close();}}
 const {context,page}=await open();try{
  const identity=await page.evaluate(()=>({title:regionById[zone].title,nodes:['quest','minipanel','status','mobileMapR74'].map(id=>{const n=document.getElementById(id);return{id,text:n?.textContent,visible:!!n&&getComputedStyle(n).display!=='none'&&n.getBoundingClientRect().height>0};})}));finding('mobile-map-identity',identity.nodes.some(n=>n.visible&&n.text?.includes(identity.title)),identity);
  const objective=await page.evaluate(()=>{const q=room.objective;player.x=q.x+.55;player.y=q.y;cam={x:player.x,y:player.y};updateHUD();return{x:player.x,y:player.y,objective:{x:q.x,y:q.y},engaged:room.engaged};});await page.waitForTimeout(400);finding('objective-touch-control',await page.locator('#touchUse').isVisible(),objective);await capture(page,'01-mobile-objective-baseline');
  const portal=await page.evaluate(()=>{const s=window.__STORYWORLD_ROUTES_R72__.inspect().portals.find(p=>p.open);if(!s)return null;player.x=s.point.x+1.25;player.y=s.point.y;cam={x:player.x,y:player.y};updateHUD();window.__r74SavedInteract=interact;window.__r74SavedTravel=travel;window.__r74TapCalls=0;window.__r74TravelCalls=0;interact=()=>{window.__r74TapCalls++;};travel=()=>{window.__r74TravelCalls++;return false;};return s;});
  if(portal){await page.waitForTimeout(400);if(await page.locator('#touchUse').isVisible()){await page.locator('#touchUse').tap();const calls=await page.evaluate(()=>({current:window.__r74TapCalls,oldTravel:window.__r74TravelCalls}));finding('touch-dispatches-current-authority',calls.current===1,{calls,portal});}else finding('portal-touch-control',false,portal);await page.evaluate(()=>{player.x=room.objective.x+.55;player.y=room.objective.y;route=[];command=null;interact=window.__r74SavedInteract;travel=window.__r74SavedTravel;updateHUD();});await ready(page);}
  for(const id of ['dist00','ep1a08','ep1b09']){await warp(page,id);const off=await light(page,false);await capture(page,id+'-full');const on=await light(page,true);await capture(page,id+'-light');finding('light-mask-'+id,off.shader===0&&!off.geometry&&on.shader===1&&on.geometry&&Math.hypot(on.origin[0]-on.player.x,on.origin[1]-on.player.y)<.36&&on.maskCentre[0]>240,{off,on});}
  await page.setViewportSize({width:844,height:390});const landscape=await light(page,true);await capture(page,'02-mobile-landscape-light');finding('landscape-light',landscape.shader===1&&landscape.geometry,{landscape});
 }finally{await context.close();}
 }
 // Actual native restore stack; a ground aim does not require a nearby enemy.
 if(process.env.R74_CASE!=='mobile'){
 const coopGame=await open({width:844,height:390});try{
  const p=coopGame.page;const result=await p.evaluate(async()=>{
   await enterRegion('dist00',null,{noStory:true});for(let n=0;n<80&&storyScene;n++)$('storyNext')?.click();if(!storyScene)closePanel(true);
   auto=false;guide=false;route=[];command=null;settings.autoSkill=false;player.invincible=1e6;player.invReason='r74-transition-survival-fixture';
   const g=window.__STORYWORLD_GOLDEN_R72__,sim=window.__STORYWORLD_COOP_SIM_R62__,s=g.state();s.learned=true;s.designs=[{id:'transition-fixture',name:'전환 확인',strokes:StoryGoldenCoreR72.normalize([[{x:-1,y:0},{x:1,y:0}]])}];s.equipped=['transition-fixture'];
   const origin={x:player.x,y:player.y},key=window.__STORYWORLD_SAVE_SLOTS_R73__.key(),disk=localStorage.getItem(key),design=JSON.stringify({...s,readyIn:0});
   const candidates=[origin,...[2,4].flatMap(r=>Array.from({length:16},(_,i)=>({x:origin.x+Math.cos(i*Math.PI/8)*r,y:origin.y+Math.sin(i*Math.PI/8)*r})))];
   const aim=candidates.find(a=>StoryGoldenCoreR72.plan(s.designs[0].strokes,a,g.stats(player).size,q=>!blocked(q.x,q.y,.31),(a,b)=>clearPath3(a,b,.31),origin));
   if(!aim)return{admitted:false,reason:'no safe ground aim',origin};const cast=g.cast(0,aim);if(!cast)return{admitted:false,origin,aim,last:g.inspect().lastResult,modal,loading};
   tick(.2);const castPoint={x:player.x,y:player.y};await sim.start({role:'host',selfId:'r74-host',hero:player.hero,members:[{id:'r74-host',character:player.hero,nick:'검사'}]});const active=g.inspect().active;await sim.stop();
   return{admitted:true,origin,aim,castPoint,after:{x:player.x,y:player.y},active,storedBytesPreserved:localStorage.getItem(key)===disk,designPreserved:JSON.stringify({...g.state(),readyIn:0})===design,events:g.inspect().events.slice(-5)};
  });
  report.cases.push({key:'in-flight-coop-native-stack',ok:result.admitted&&result.active===0&&result.storedBytesPreserved&&result.designPreserved,details:result});if(result.admitted)finding('co-op-return-origin',Math.hypot(result.after.x-result.origin.x,result.after.y-result.origin.y)<.05,result);await capture(p,'03-coop-solo-return');
 }finally{await coopGame.context.close();}
 }
 for(const c of report.cases)if(c.key==='in-flight-coop-native-stack'&&!c.ok)report.findings.push('co-op-cast-admission-or-restore');
 report.ok=report.errors.length===0&&(!fixed||report.findings.length===0);assert.deepEqual(report.errors,[]);if(fixed)assert.deepEqual(report.findings,[]);console.log('R74_MOBILE_RESULT',JSON.stringify(report));
}catch(e){report.ok=false;report.error=String(e.stack);console.error('R74_MOBILE_FAILURE',JSON.stringify(report));throw e;}finally{await fs.writeFile(out+'/mobile-browser.json',JSON.stringify(report,null,2));await browser.close();}
