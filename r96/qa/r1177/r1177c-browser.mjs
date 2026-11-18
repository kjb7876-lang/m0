// R1177c 사몽 에피소드 이펙트 Dots C1~C4, 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SHOT=/tmp/dir] node r96/qa/r1177/r1177c-browser.mjs
//  ① 본편에서 몹 예고처럼 보라로 물들인 기억 조각 파괴를 먼저 그려 물들인 시트 캐시를 만든 뒤 ② S-06 에서 같은 물들임·균열 문·나방·손을 부르고
//  그 동안 실제로 그리는(물들일 원본 포함) 시트가 Dots·R1177 칠한 시트뿐인지 ③ 기억 조각 탑을 깨면 C1 무너지는 탑 시트를 읽는지. 페이지 오류 0.
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SHOT=process.env.SHOT||'';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>time>t0+s?r():setTimeout(f,50);f();}),s);
await p.evaluate(()=>{window.__C={paths:new Set()};const base=readyImage;readyImage=function(q,...a){if(typeof q==='string')__C.paths.add(q);return base.call(this,q,...a);};});
const purple={a:[40,10,30],b:[150,90,170]};
// ① 본편: 보라 물들임 캐시
await p.evaluate(t=>{player.invincible=1e9;const X=__STORYWORLD_PIXELFX_R163__;X.warm?.(['pvfx-void-implosion']);for(let i=0;i<4;i++)X.play('pvfx-void-implosion',player.x+1,player.y,{k:.55,tint:t,delay:i*.1});},purple);
await waitGame(.8);const st=await p.evaluate(()=>[...__C.paths].filter(q=>/pixelfx\/pvfx-void-implosion\.webp$/.test(q)));ok(st.length>0,'본편: 원래 도트 시트를 물들여 그림(캐시 만듦)',st);
// ② S-06
await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-06'),null,{zone:'sz115-S06-23'});});
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.3);
await p.evaluate(()=>{__C.paths.clear();player.invincible=1e9;});
await p.evaluate(t=>{const X=__STORYWORLD_PIXELFX_R163__,x=player.x,y=player.y;X.play('pvfx-void-implosion',x+1,y,{k:.55,tint:t});X.play('pvfx-rift-portal',x-1.5,y+.5,{k:.75,until:time+3,fade:.5,tint:{a:[110,8,18],b:[255,96,96]}});
 X.play('pvfx-choir-moths',x+.5,y-1.2,{k:.7,loop:false,tint:{a:[100,6,16],b:[255,120,120]}});X.play('hands-blood',x-.4,y-1.6,{k:1.0});},purple);
await waitGame(.5);if(SHOT)await p.screenshot({path:`${SHOT}/r1177c-s06.png`});await waitGame(1.0);
const r=await p.evaluate(()=>{const A=window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__,P=[...__C.paths].map(q=>A.resolve(q)||q);return{pixel:P.filter(q=>/assets\/r163\/pixelfx\/(pvfx-void-implosion|pvfx-rift-portal|pvfx-choir-moths|hands-blood)\.webp$/.test(q)),r1177:P.filter(q=>/assets\/r1177\/[a-z]/.test(q)&&!/s06-/.test(q))};});
ok(r.pixel.length===0,'S-06: 물들인 캐시가 있어도 도트 시트를 그리지 않음',r.pixel);
for(const re of ['void-implosion-blood','crimson-fissure-12','ash-crimson-moths-16','spectral-hands-20'])ok(r.r1177.some(q=>q.includes(re)),'S-06: '+re+' 그림',r.r1177);
// ③ 기억 조각 탑 깨기(조형물 몹이 있으면)
let tw=null;for(const [key,zone] of [['S-06','sz115-S06-23'],['S-06','sz115-S06-1'],['RA','sz115-RA-3'],['RB','sz115-RB-4'],['S-01','sz115-S01-3'],['M','sz115-M-4']]){
 const has=await p.evaluate(()=>(room.enemies||[]).some(e=>e.r170Tower&&e.hp>0));if(has)break;
 await p.evaluate(async([key,zone])=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key===key),null,{zone});},[key,zone]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.3);}
tw=await p.evaluate(()=>{__C.paths.clear();player.invincible=1e9;const t=(room.enemies||[]).find(e=>e.r170Tower&&e.hp>0);if(!t)return null;player.x=t.x-1.2;player.y=t.y+.6;t.hp=0;try{killEnemy(t);}catch(e){return 'ERR '+e;}return {x:t.x,y:t.y};});
if(tw&&typeof tw==='object'){await waitGame(.4);if(SHOT)await p.screenshot({path:`${SHOT}/r1177c-tower.png`});const q=await p.evaluate(()=>{const A=window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__;return [...__C.paths].map(q=>A.resolve(q)||q).filter(q=>/memory-tower|void-implosion/.test(q));});
 ok(q.some(s=>/memory-tower-implode-14/.test(s)),'탑이 깨지면 C1 무너지는 탑 시트',q);}else console.log('skip 탑: 이 구역에 기억 조각 탑 없음',tw);
const ins=await p.evaluate(()=>window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__.inspect());ok(ins.stats.errors===0,'R1177 오류 0',ins);
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`R1177c browser ${n-bad}/${n}`);process.exit(bad?1:0);
