// R880 브라우저 확인(헤드리스 — 실기기·GPU 확인이 아님): 실제 게임에서 지역 진입 → 컷씬 뜸 → 게임 시간 멈춤 → 건너뛰기 → 다시 안 뜸, 영화 모드 층, 장면별 화면.
// 실행: 정적 서버(포트 4410, /m0/ = 빌드 결과)를 띄우고  SW_URL='http://127.0.0.1:4410/m0/?cine880=1' node r96/qa/r880/r880-browser.mjs [화면 저장 폴더]
import {chromium,boot,go,skip} from '../r613/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'/tmp/r880-shots';fs.mkdirSync(OUT,{recursive:true});
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;console.log(c?'PASS':'FAIL',n,d===undefined?'':JSON.stringify(d));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const A=()=>p.evaluate(()=>window.__STORYWORLD_LINEART_R880__.inspect());
ok('API present, 25 zones (batch 1: 11, batch 2: 8, batch 3: 6)',await p.evaluate(()=>window.__STORYWORLD_LINEART_R880__.zones().length)===25);
await p.evaluate(()=>window.__STORYWORLD_LINEART_R880__.set({on:true,resetSeen:true}));
await p.evaluate(()=>{enterRegion('dist01',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='dist01',null,{timeout:150000});await skip(p);
let shown=true;try{await p.waitForSelector('#r880',{timeout:60000});}catch(_){shown=false;}
ok('cutscene appears after entering dist01',shown,await A());
const t0=await p.evaluate(()=>time);await p.waitForTimeout(2500);const t1=await p.evaluate(()=>time),i1=await A();
ok('game time frozen while playing',t1===t0,[t0,t1]);ok('scene advancing',i1.active&&i1.zone==='dist01'&&i1.t>0.5,i1);
ok('title uses region title',await p.evaluate(()=>document.querySelector('#r880 .chap').textContent.includes(regionById.dist01.title)));
const f0=i1.stats.frames;await p.waitForTimeout(3000);const i2=await A();console.log('INFO headless frames/s',((i2.stats.frames-f0)/3).toFixed(1),'sim t',i2.t,'filterDropped',i2.stats.filterDropped);
await p.screenshot({path:OUT+'/game_dist01_live.png'});
await p.keyboard.press('Escape');await p.waitForTimeout(900);
ok('Escape skips and removes overlay',!(await p.$('#r880'))&&(await A()).stats.skips===1);
const t2=await p.evaluate(()=>time);await p.waitForTimeout(2500);ok('game time resumes',await p.evaluate(()=>time)>t2);
await go(p,'hub');await go(p,'dist01');await p.waitForTimeout(3000);ok('no replay on revisit',!(await p.$('#r880'))&&(await A()).stats.plays===1,await A());
// 영화 모드: 그림만 깔리고 자막 층 아래
const cin=await p.evaluate(async()=>{const C=window.__STORYWORLD_CINEMA_MODE_R370__;if(!C?.prefs)return null;const was=C.prefs().on;try{C.set?.({on:true});}catch(_){}
 const on=C.prefs().on;window.__STORYWORLD_LINEART_R880__.play({zone:'dist03',at:9});await new Promise(r=>setTimeout(r,400));const el=document.getElementById('r880');
 const out={on,cls:el?.classList.contains('cinema'),z:el?getComputedStyle(el).zIndex:null,cap:el?getComputedStyle(el.querySelector('.cap')).display:null};window.__STORYWORLD_LINEART_R880__.skip();try{C.set?.({on:was});}catch(_){}return out;});
console.log('INFO cinema',JSON.stringify(cin));if(cin&&cin.on)ok('cinema mode: picture layer under cinema captions, own caption hidden',cin.cls&&cin.z==='8995'&&cin.cap==='none',cin);
await p.waitForTimeout(700);
for(const [z,ts] of Object.entries({dist01:[9.5,16],dist02:[7.5,16],dist03:[11,16.5],dist04:[7,15.5],dist05:[7.5,11.5],dist06:[7.6,16.5],ep1a08:[7.6,14],ep1a09:[5,15],last304:[6.8,16.5],last305:[8.8,13],last303:[6.8,16.6],ep1b01:[4.6,11],ep1b02:[6.5,14.6],ep1b03:[5.2,12.6],ep1b04:[2.6,14.5],ep1b05:[8,14],ep1b07:[3.6,16.9],ep1b08:[4.6,12],ep1b09:[5.4,17.2],u201:[7,15],u202:[4.6,9],u204:[7,16],u205:[8,15],u206:[4.4,12.6],u203:[8.8,12.6]}))for(const at of ts){
 await p.evaluate(([z,at])=>{window.__STORYWORLD_LINEART_R880__.skip();document.getElementById('r880')?.remove();return new Promise(r=>setTimeout(()=>{window.__STORYWORLD_LINEART_R880__.play({zone:z,at});r();},600));},[z,at]);await p.waitForTimeout(700);await p.screenshot({path:`${OUT}/game_${z}_${at}.png`});}
await p.setViewportSize({width:844,height:390});await p.waitForTimeout(500);await p.screenshot({path:OUT+'/game_mobile_last303.png'});
const fit=await p.evaluate(()=>{const c=document.querySelector('#r880 .cap').getBoundingClientRect(),s=document.querySelector('#r880 .skip').getBoundingClientRect();return{cap:[c.left,c.right,c.top,c.bottom],skip:[s.left,s.right,s.top,s.bottom],w:innerWidth,h:innerHeight};});
ok('phone landscape: caption and skip inside the screen, not overlapping',fit.cap[0]>=0&&fit.cap[1]<=fit.w&&fit.cap[3]<=fit.h&&fit.skip[1]<=fit.w&&fit.skip[3]<fit.cap[2],fit);
await p.evaluate(()=>window.__STORYWORLD_LINEART_R880__.skip());
const fin=await A();ok('no cutscene errors',fin.stats.errors===0&&!fin.lastError,fin.lastError);ok('no page errors',errs.length===0,errs.slice(0,3));
console.log(`R880 browser ${pass}/${total}`);await b.close();process.exit(pass===total?0:1);
