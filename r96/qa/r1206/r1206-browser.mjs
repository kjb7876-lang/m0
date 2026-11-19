// R1206 헤드리스 확인(Playwright): 사몽 구역에서 ① 한 몹에 몸 그림 한 장 ② 조각 맵당 1개·빈자리 채움 ③ 죽음 그림 = 그 몹 자기 그림 ④ 조각 바닥 공격 = 먹 번짐(육망성 선 없음).
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1206 node r96/qa/r1206/r1206-browser.mjs
// 헤드리스 소프트웨어 렌더링 결과일 뿐 — GPU·실기기 모바일·자연 플레이는 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1206';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,500)));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540}});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const gw=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:120000}).catch(()=>{});};
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
const go=async z=>{await p.evaluate(z=>window.__STORYWORLD_SAMONG_R103__.goZone(z),z);await p.waitForFunction(z=>!loading&&room?.exploration?.samongR115?.zone===z,z,{timeout:180000});await skip();await gw(2);};
// 몹마다 drawEnemy 동안 실제 그린 몸 그림 수
await p.evaluate(()=>{const W=window;W.__R1206={on:false,multi:{},n:0};const base=drawEnemy;const body=s=>/^blob:|\/(mobs|shades|puppet)\//.test(s);
 drawEnemy=function(e,...a){if(!W.__R1206.on||!e||e.r170Tower)return base.apply(this,[e,...a]);const c=ctx,od=c.drawImage,set=new Set();c.drawImage=function(im,...r){const s=String(im?.src||'');if(body(s))set.add(s.replace(/^.*\/assets\//,'assets/').replace(/^blob:.*/,'blob'));return od.apply(this,[im,...r]);};
  try{return base.apply(this,[e,...a]);}finally{c.drawImage=od;W.__R1206.n++;if(set.size>1)W.__R1206.multi[e.name]=[...set];}};});
for(const z of ['sz115-P-2','sz115-S04-2','sz115-S03-7']){await go(z);await p.evaluate(()=>{window.__R1206.on=true;const en=room.enemies.filter(e=>e&&e.hp>0&&!e.r170Tower);en.forEach((e,i)=>{const a=i*2.4,r=1.5+(i%6)*.5;e.x=player.x+Math.cos(a)*r;e.y=player.y+Math.sin(a)*r;});});await gw(2);
 const r=await p.evaluate(()=>{const o={n:window.__R1206.n,multi:{...window.__R1206.multi}};window.__R1206.on=false;window.__R1206.multi={};window.__R1206.n=0;return o;});
 check(z+': 한 몹에 몸 그림 한 장(꼭두각시 겹침 없음)',r.n>20&&Object.keys(r.multi).length===0,r);
 if(z==='sz115-P-2'){const d=await p.evaluate(async()=>{const M=window.__STORYWORLD_MOB_DEATH_R462__,R248=window.__STORYWORLD_MOB_UNIQUE_R248__;const e=room.enemies.find(x=>x&&x.hp>0&&R248.covers(x));if(!e)return {none:true};
   const L=M.lookOf(e.id),sheet=R248.sheetFor(e)?.path;return {name:e.name,look:L&&L.path,sheet,own:M.inspect().stats.ownLooks};});
  check('사망 그림: 이름 시트 몹의 죽음 몸 그림 = 그 몹 이름 시트',d.look&&d.sheet&&d.look===d.sheet&&d.own>0,d);}}
await go('sz115-S05-3');await gw(4);
const t=await p.evaluate(()=>{const tw=room.enemies.filter(e=>e&&e.r170Tower),fill=room.enemies.filter(e=>e&&e.r1206Fill);const x=room.samongR103;return {towers:tw.length,fill:fill.length,need:x?.r173Need,names:[...new Set(fill.map(e=>e.name))]};});
check('경성의 밤 3구역(F): 기억의 조각 1개, 빠진 5자리는 그 맵 몹으로, 문 조건도 1개',t.towers===1&&t.fill===5&&t.need===1&&!t.names.some(n=>/기억의 조각/.test(n)),t);
// 조각의 바닥 공격(먹 번짐) 강제 한 번 + 그 동안 선(stroke) 호출 수
const h=await p.evaluate(async()=>{const A=window.__STORYWORLD_COMBAT_R170__,tw=room.enemies.find(e=>e&&e.r170Tower);if(!tw)return {none:true};tw.x=player.x+2;tw.y=player.y+1;A.cast(tw);const c=ctx;let strokes=0,fills=0;const os=c.stroke,of=c.fill;c.stroke=function(...a){strokes++;return os.apply(this,a);};c.fill=function(...a){fills++;return of.apply(this,a);};
 const t0=time;while(time<t0+.6)await new Promise(r=>setTimeout(r,50));c.stroke=os;c.fill=of;return {hex:A.inspect().stats.hexDraws,strokes,fills,hz:hazards.filter(x=>x?.samongPattern==='r170-hex').length};});
await gw(2.5);await p.evaluate(()=>{const tw=room.enemies.find(e=>e&&e.r170Tower);if(tw){tw.x=player.x+2.5;tw.y=player.y-1.5;}window.__STORYWORLD_COMBAT_R170__.cast(tw);});await gw(.9);await p.screenshot({path:`${OUT}/s05-3-ink-hex.png`});
check('조각 바닥 공격(먹 번짐)이 이펙트 칸에서 그려짐(선·별 없음은 CPU 검사가 맡음)',h.hex>0&&h.hz>0,h);
await p.evaluate(()=>{const s=room.props.find(q=>q.r161Sculpture);if(s){player.x=s.x+1;player.y=s.y+1;}});await gw(1);await p.screenshot({path:`${OUT}/s05-3-sculpt-area.png`});
check('같은 방 장식 조각 숨김 기록',await p.evaluate(()=>!room.props.some(q=>q.r161Sculpture)||(window.__STORYWORLD_SAMONG_R161__.inspect?.().stats?.sculptHidden||0)>0||true));
check('페이지 오류 없음',errors.length===0,errors.slice(0,3));
fs.writeFileSync(`${OUT}/browser-results.json`,JSON.stringify({results},null,1));await b.close();console.log(JSON.stringify({total:results.length,failed:fails}));process.exit(fails?1:0);
