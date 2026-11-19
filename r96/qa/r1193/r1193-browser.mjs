// R1193 헤드리스 브라우저 검사(소프트웨어 렌더링 — 그래픽·실기기 검증 아님): 스토리 사몽(꿈 층)에 남은 R248 임시 도트 몹과 스토리·꿈 층 도트 이펙트.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ [SHOTS=폴더] node r96/qa/r1193/r1193-browser.mjs
//  ① 꿈 층 12종: drawEnemy 가 실제 그린 몸 그림이 R248 임시 도트(assets/r248/mobs/)가 아니고 스토리와 같은 칠한 그림
//  ② 꿈 층 dist05 '마지막 길의 호위병' 출현 없음, dist06 '검은기둥 화염술사' → '검은기둥 주문사'(r410 m009 그림)
//  ③ 대조군: 같은 지역 스토리 층은 원래 그림 그대로, 꿈 층에서 Dots 몫(보라검 부활자 m008)은 아직 R248 그대로
//  ④ pixelfx 9줄(hands-blood·meteor·dark-explosion-blood·collect-burst·core-orb-teal·portal-teal·pvfx-rift-portal·pvfx-void-implosion·pvfx-choir-moths)이
//     스토리·꿈 층에서도 원래 도트 줄(하위 폴더 없는 파일)이 아님 ⑤ 페이지 오류 0
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SHOTS=process.env.SHOTS||'';
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS':'FAIL')+' '+m+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{window.__R1193={seen:{}};const bd=drawEnemy;drawEnemy=function(e,...a){const C=ctx&&ctx.commands,n0=C?C.length:0;const r=bd.call(this,e,...a);
 try{if(C&&e){const o=__R1193.seen[e.name]||(__R1193.seen[e.name]={});for(const q of C.slice(n0))if(q&&q.kind==='image'){const im=q.image;const id=String(q.sourcePath||im?.src||'').replace(/^https?:\/\/[^/]+\/m0\//,'');if(id.startsWith('assets/'))o[id]=(o[id]||0)+1;}}}catch(_){}return r;};});
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time,w0=Date.now();const f=()=>(time>t0+s||Date.now()-w0>9000)?r():setTimeout(f,40);f();}),s);
async function visit(id,l){await p.evaluate(async([id,l])=>{await enterRegion(id,null,{layer:l,restore:true});},[id,l]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.5);await skip();
 await p.evaluate(()=>{__R1193.seen={};player.invincible=1e9;});
 for(let k=0;k<10;k++){const left=await p.evaluate(()=>{player.invincible=1e9;const L=(room.enemies||[]).filter(e=>e.hp>0&&!e.__r1193);const B=L.slice(0,9);B.forEach((e,n)=>{e.__r1193=1;e.speed=0;const a=n/9*6.283;e.x=player.x+Math.cos(a)*2.2;e.y=player.y+Math.sin(a)*1.5;});return L.length-B.length;});await waitGame(.4);await skip();if(left<=0)break;}
 await waitGame(.6);
 return p.evaluate(()=>({names:[...new Set((room.enemies||[]).map(e=>e.name))],seen:__R1193.seen}));}
const base=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s*(후속 증원|증원|추격대|우두머리)$/,'').replace(/\s+\d+$/,'').trim();
function bodies(r,name){const out={};for(const [k,v] of Object.entries(r.seen))if(base(k)===name)for(const [pth,c] of Object.entries(v))out[pth]=(out[pth]||0)+c;return out;}
// [지역, 꿈 층 이름, 기대하는 칠한 그림(경로 일부)]
// 재 나방: 스토리 층도 R74 지도 아틀라스(칠한 그림, r74Monster 표시)와 ash-moth-v2 를 함께 쓴다 → 둘 중 하나면 스토리와 같다
const CASES=[['dist01','재 나방',/r380\/mobs\/ash-moth-v2|r74\/monsters\.png/],['dist04','되살아난 방패동료',/r380\/mobs\/reborn-shieldmate-v4/],['ep1a11','치료거부의 가면',/r380\/mobs\/treatment-refusal-mask-v1/],
 ['ep1b05','얼굴 없는 남자의 박수',/r275\/mobs\/curtain-mannequin|r223\/mobs\/curtain-mannequin|curtain-mannequin/],['ep1b08','육망성의 흑마술 실험체',/r380\/mobs\/hexagram-experiment-m031-v1/],
 ['u203','이동문 공허잔영',/r374\/mobs\/u203-e2-mech/],['u203','최종문 공명기사',/r374\/mobs\/u203-e3-mech/],['u205','학대기록 공허체',/r374\/mobs\/u205-e1-new/],
 ['u205','관리자 추적견',/r374\/mobs\/u205-e2-new/],['u205','역전기록 수집가',/r374\/mobs\/u205-e3-new/],['u206','기억이주 연결자',/r380\/mobs\/u206-mech-01-v1/]];
const byZone={};for(const c of CASES)(byZone[c[0]]=byZone[c[0]]||[]).push(c);
for(const [z,list] of Object.entries(byZone)){const r=await visit(z,'DREAM');
 for(const [,name,re] of list){const bd=bodies(r,name),keys=Object.keys(bd);
  ok(`꿈 층 ${z} ${name}: R248 임시 도트 시트를 그리지 않음`,keys.length>0&&!keys.some(k=>/assets\/r248\/mobs\//.test(k)),bd);
  ok(`꿈 층 ${z} ${name}: 스토리와 같은 칠한 그림`,keys.some(k=>re.test(k)),bd);}
 if(z==='dist04'){const bd=bodies(r,'보라검 부활자');ok('대조군: 꿈 층 보라검 부활자(Dots 몫)는 아직 R248 시트',Object.keys(bd).some(k=>/r248\/mobs\/m008/.test(k)),bd);}
 if(SHOTS&&z==='dist04')await p.screenshot({path:SHOTS+'/r1193-dream-dist04.jpg',quality:85});}
{const r=await visit('dist05','DREAM');ok('꿈 층 dist05: 마지막 길의 호위병 출현 없음',!r.names.some(n=>/마지막 길의 호위병/.test(n)),r.names);}
{const r=await visit('dist06','DREAM');ok('꿈 층 dist06: 검은기둥 화염술사 이름 없음',!r.names.some(n=>/검은기둥 화염술사/.test(n)),r.names);
 const bd=bodies(r,'검은기둥 주문사');ok('꿈 층 dist06: 검은기둥 주문사 그림(r410 m009)',Object.keys(bd).some(k=>/r410\/mobs\/m009/.test(k))&&!Object.keys(bd).some(k=>/r248\/mobs\/m012/.test(k)),bd);}
for(const [z,name,re] of [['dist04','되살아난 방패동료',/reborn-shieldmate-v4/],['u205','관리자 추적견',/u205-e2-new/]]){const r=await visit(z,'STORY');const bd=bodies(r,name);ok(`대조군 스토리 ${z} ${name}: 원래 칠한 그림 그대로`,Object.keys(bd).some(k=>re.test(k)),bd);}
const KEYS=['hands-blood','meteor','dark-explosion-blood','collect-burst','core-orb-teal','portal-teal','pvfx-rift-portal','pvfx-void-implosion','pvfx-choir-moths'];
for(const [z,l] of [['dist05','STORY'],['cult04','DREAM']]){await p.evaluate(async([id,l])=>{await enterRegion(id,null,{layer:l,restore:true});},[z,l]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.4);
 const m=await p.evaluate(K=>{const M=window.__STORYWORLD_PIXELFX_R163__.meta();return Object.fromEntries(K.map(k=>[k,M[k]?.file]));},KEYS);
 ok(`${l} ${z}: pixelfx 9줄이 원래 도트 줄이 아님`,KEYS.every(k=>typeof m[k]==='string'&&m[k].includes('/')),m);}
ok('페이지 오류 0',errs.length===0,errs.slice(0,3));
console.log(`\nR1193 browser ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
