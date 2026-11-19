// R1233 헤드리스 브라우저 검사(소프트웨어 렌더링 — 그래픽·실기기 검증 아님): 임시로 얹은 R248 이름 시트(R290·R410 드라이브 후보)가
//  사용자 채택 그림·사몽 잔영을 덮던 몹이 이제 제 그림으로 나오는지 drawEnemy 가 실제 그린 몸 그림으로 본다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SHOTS=폴더] node r96/qa/r1233/r1233-browser.mjs
//  ① 대상 이름(사몽 에피소드 S-05·S-01, 스토리 사몽 꿈 층 ep1a10·ep1a11)의 몹이 모두(채택 그림 slot 밖·짙은 형상 포함) 그 이름의 채택 그림으로 그림
//  ② 경계: 그 몹 중 하나도 임시 후보 시트(R248·R290·R410)나 꼭두각시 한 장(blob)으로 떨어지지 않음
//  ③ 대조군: 대상 아닌 이름(마네킹 r410 m072)·스토리 층(부정의 잔영 M016, 거짓천국 근위천사 채택 그림)은 그대로  ④ 페이지 오류 0
import {createRequire} from 'node:module';const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SHOTS=process.env.SHOTS||'';
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS':'FAIL')+' '+m+(d!==undefined?' '+JSON.stringify(d).slice(0,500):''));};
const TEMP=/assets\/(r248|r290|r410|r1179)\/mobs\//;
// [구역(사몽 에피소드 구역 키 또는 스토리 지역:층), 이름, 그 이름이 모두 써야 할 채택 그림]
const CASES=[
 ['sz115-S05-2','호외 신문의 밀고자 잔영',/assets\/r200\/shades\/extra-informant\./],
 ['sz115-S05-2','찢긴 호외의 잔향',/assets\/r380\/mobs\/samong-s05-wraith-/],
 ['sz115-S05-3','찢긴 호외의 잔향',/assets\/r380\/mobs\/samong-s05-wraith-/],
 ['sz115-S05-3','호외 신문의 밀고자 잔영',/assets\/r200\/shades\/extra-informant\./],
 ['sz115-S01-3','꿰맨 아기 인형',/assets\/r380\/mobs\/r200-stitched-golem-v2\./],
 ['ep1a11:DREAM','거짓천국 근위천사',/assets\/r380\/mobs\/false-heaven-guard-v1\./],
 ['ep1a10:DREAM','부정의 잔영',/assets\/r380\/mobs\/samong-m066-v3\./],
 ['last305:STORY','피리 고블린',/assets\/r1233\/mobs\/m044\./],
 ['ep1a10:DREAM','갈망의 도시짐승',/assets\/r1233\/mobs\/m019\./],/* Dots DR-02 v1 손질 시트 */
 ['cult05:STORY','중간보스 · ID 배양 점액체',/assets\/r380\/mobs\/legacy-m130-slime-cult05-v2\./],/* R81 지역 수호자(앞말 붙은 일반몹) */
];
// 대조군: 손대지 않아야 할 이름·층
const CONTROL=[['sz115-S04-2','규칙을 어기지 않는 마네킹',/assets\/r410\/mobs\/m072\./],['sz115-S04-10','규칙을 어기지 않는 마네킹',/assets\/r410\/mobs\/m072\./],['sz115-S04-3','규칙을 어기지 않는 마네킹',/assets\/r410\/mobs\/m072\./],
 ['ep1a10:STORY','부정의 잔영',/assets\/r92\/mobs\/M016-|denial_specter/],['ep1a11:STORY','거짓천국 근위천사',/assets\/r380\/mobs\/false-heaven-guard-v1\./],['last305:STORY','숲 고블린',/M047-|Monster_Goblin/]];
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');localStorage.setItem('storyworld.r183.scene3d','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);}).catch(()=>{});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
ok('R1233 오버레이 실림',await p.evaluate(()=>!!window.__STORYWORLD_MOB_ART_RESTORE_R1233__));
await p.evaluate(()=>{window.__T={seen:new Map()};const bd=drawEnemy;drawEnemy=function(e,...a){const C=ctx&&ctx.commands,n0=C?C.length:0;const r=bd.call(this,e,...a);
 try{if(C&&e&&e.hp>0){let best=null,ba=0;for(const q of C.slice(n0))if(q&&q.kind==='image'&&q.points){const P=q.points;const ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));const sc=ar*((q.spatialRole||'')==='body'?100:1);if(sc>ba){ba=sc;best=q;}}
  if(best){const id=String(best.sourcePath||best.image?.__path||best.image?.src||'?').replace(/^https?:\/\/[^/]+\/(m0\/)?/,'');const o=__T.seen.get(e)||{};o[id]=(o[id]||0)+1;__T.seen.set(e,o);}}}catch(_){}return r;};});
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time,w0=Date.now();const f=()=>(time>t0+s||Date.now()-w0>9000)?r():setTimeout(f,40);f();}),s);
async function visit(z){if(z.includes(':')){const [id,l]=z.split(':');await p.evaluate(async([id,l])=>{await enterRegion(id,null,{layer:l,restore:true});},[id,l]);}else await p.evaluate(async id=>{await window.__STORYWORLD_SAMONG_R103__.goZone(id);},z);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.5);await skip();
 await p.evaluate(()=>{__T.seen=new Map();player.invincible=1e9;});
 for(let k=0;k<10;k++){const left=await p.evaluate(()=>{player.invincible=1e9;const L=(room.enemies||[]).filter(e=>e.hp>0&&!e.__t1233);const B=L.slice(0,9);B.forEach((e,n)=>{e.__t1233=1;e.speed=0;const a=n/9*6.283;e.x=player.x+Math.cos(a)*1.6;e.y=player.y+Math.sin(a)*1.1;});return L.length-B.length;});await waitGame(.6);await skip();if(left<=0)break;}
 return p.evaluate(()=>{const U=window.__STORYWORLD_MOB_UNIQUE_R248__,S=window.__STORYWORLD_STORY_COMBAT_R54__;const out=[];
  for(const [e,o] of __T.seen){let fp='';try{const f=S.frameFor(e,null);fp=String(f?.path||'');}catch(_){}out.push({name:e.name,base:U?.baseName?.(e.name)||e.name,drawn:o,frame:fp,cover:!!U?.covers?.(e),v:e.r1233?.v||null,boss:!!(e.boss||e.midboss),ward:!!e.wardChampionR81});}return out;});}
const ctlMiss=[];const byZone={};for(const c of [...CASES,...CONTROL])(byZone[c[0]]=byZone[c[0]]||[]).push(c);
const ONLY=process.env.ONLY?new RegExp(process.env.ONLY):null;/* 실패한 구역만 다시 볼 때 ONLY=정규식 */
for(const [z,list] of Object.entries(byZone)){if(ONLY&&!ONLY.test(z))continue;const R=await visit(z);
 for(const [,name,re] of list){const L=R.filter(r=>(r.base===name||r.name===name||String(r.name).startsWith(name+' '))&&!r.boss);const ctl=CONTROL.some(c=>c[0]===z&&c[1]===name);
  if(ctl){if(!L.length&&/마네킹/.test(name)){ctlMiss.push(z);continue;}ok(`대조군 ${z} ${name}: 원래 그림 그대로`,L.length>0&&L.every(r=>Object.keys(r.drawn).some(k=>re.test(k))),L.map(r=>r.drawn));continue;}
  ok(`${z} ${name}: 몹이 나옴`,L.length>0,[...new Set(R.map(r=>r.base))]);
  ok(`${z} ${name}: ${L.length}마리 모두 채택 그림으로 그림`,L.length>0&&L.every(r=>Object.keys(r.drawn).some(k=>re.test(k))),L.map(r=>[r.name,r.drawn]));
  ok(`${z} ${name}: 임시 후보 시트(R248·R290·R410)·꼭두각시 한 장으로 그린 몹 없음`,L.every(r=>!Object.keys(r.drawn).some(k=>TEMP.test(k)||/^blob:/.test(k))),L.filter(r=>Object.keys(r.drawn).some(k=>TEMP.test(k)||/^blob:/.test(k))).map(r=>[r.name,r.drawn]));}
 if(SHOTS)await p.screenshot({path:`${SHOTS}/r1233-${z}.jpg`,quality:85});}
ok('대조군 마네킹이 S-04 세 구역 중 하나 이상에서 나옴(구역마다 몹 구성이 무작위)',ctlMiss.length<3,ctlMiss);
ok('페이지 오류 0',errs.length===0,errs.slice(0,3));
console.log(`\nR1233 browser ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
