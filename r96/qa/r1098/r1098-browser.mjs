// R1098 사몽 얼굴 — 헤드리스 브라우저 검사(그래픽 검증 아님: 헤드리스 소프트웨어 렌더, GPU·실기기 미검증).
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SW_SHOT=폴더] node r96/qa/r1098/r1098-browser.mjs
//  ① 사몽 최종 보스 미카엘라(sz115-M-1)의 몸 그림 = 미카엘라 본인 시트(꼭두각시·아르벨리아 아님)
//  ② 꼭두각시 몹·보스(sz115-P-2) 몸 그림 = 구운 먹·흰 실 인형(원본 두건·칼 시트 명령 0)
//  ③ 그리기 NaN·페이지 오류 0
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/',SH=process.env.SW_SHOT||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:800,height:450},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
// 사몽 길은 777(전체 해금)로 연다 — r444/lib.mjs 와 같은 방식
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{window.__R1098={cmds:null};const hook=()=>{try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&!r.render.__q1098){const f=r.render;const w=function(...a){for(const x of a)if(x&&Array.isArray(x.commands))window.__R1098.cmds=x.commands;return f.apply(this,a);};w.__q1098=1;for(const k of Object.keys(f))try{w[k]=f[k]}catch(_){};r.render=w;}}catch(_){}};setInterval(hook,200);hook();});
const T=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>t,t0+s,{timeout:s*60000+60000}).catch(()=>{});};
async function goZone(key,zone){await p.evaluate(async([key,zone])=>{const SM=__STORYWORLD_SAMONG_R103__,i=SM.episodes.findIndex(e=>e.key===key);await SM.go(i,null,{zone});},[key,zone]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();}
// 몸 명령(같은 적 소유 중 가장 큰 그림)의 경로를 모은다
const bodies=pred=>p.evaluate(pred=>{const c=window.__R1098.cmds||[];const f=new Function('e','return ('+pred+')(e)');const out={};const nan=[];
 for(const e of room.enemies){if(!(e.hp>0)||!f(e))continue;let best=null;for(const k of c){if(k?.kind!=='image'||!k.owner)continue;const id=String(k.owner.id||'');if(!(id==='enemy:'+e.id||id.endsWith(':'+e.id)))continue;const P=k.points;if(!Array.isArray(P))continue;if(P.some(q=>!Number.isFinite(q[0])||!Number.isFinite(q[1])))nan.push(id);const h=Math.max(...P.map(q=>q[1]))-Math.min(...P.map(q=>q[1]));if(!best||h>best.h)best={h,src:String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'')};}
  out[e.id]={name:e.name,src:best?best.src:null};}return {out,nan};},String(pred));
// ① 미카엘라
await goZone('M','sz115-M-1');
await p.evaluate(()=>{player.hp=player.maxHp=9e8;player.invincible=1e9;const e=room.enemies.find(e=>e.boss&&/^미카엘라/.test(e.name));if(e){e.x=player.x+2;e.y=player.y-1;e.homeX=e.x;e.homeY=e.y;e.spawnState='active';e.hidden=false;}window.__M=e;});
let mich=null;for(let k=0;k<12;k++){await T(.5);const r=await bodies('e=>e===window.__M');mich=Object.values(r.out)[0];if(mich?.src&&/persona-michaela/.test(mich.src))break;}
ok(!!mich,'사몽 최종 보스 미카엘라가 구역에 있음',mich);
ok(mich&&/persona-michaela-w/.test(mich.src||''),'미카엘라 몸 그림 = 미카엘라 본인 시트',mich);
ok(mich&&!/puppet-ego/.test(mich.src||''),'미카엘라가 꼭두각시(두건·칼) 시트로 그려지지 않음',mich);
if(SH){await p.screenshot({path:SH+'/michaela.png'});}
// ② 꼭두각시
await goZone('P','sz115-P-2');
await p.evaluate(()=>{player.hp=player.maxHp=9e8;player.invincible=1e9;const P=window.__STORYWORLD_SAMONG_R161__;const list=room.enemies.filter(e=>e.hp>0&&P.puppetOf(e)).slice(0,4);list.forEach((e,i)=>{const a=i*1.57+.4;e.x=player.x+Math.cos(a)*2.3;e.y=player.y+Math.sin(a)*2.3;e.homeX=e.x;e.homeY=e.y;e.spawnState='active';e.hidden=false;});window.__PL=new Set(list);});
await T(1.5);let pup=null;for(let k=0;k<6;k++){await T(.5);pup=await bodies('e=>window.__PL.has(e)');if(Object.values(pup.out).every(v=>v.src))break;}
const vals=Object.values(pup.out);const raw=vals.filter(v=>/puppet-ego/.test(v.src||''));
ok(vals.length>=2,'꼭두각시 몹·보스 2마리 이상 시험',vals.length);
ok(vals.length>0&&raw.length===0,'꼭두각시가 원본 두건·칼 시트로 그려지지 않음(구운 인형)',vals.slice(0,4));
const ins=await p.evaluate(()=>window.__STORYWORLD_SAMONG_FACE_R1098__?.inspect?.()||null);
ok(ins&&ins.baked&&ins.stats.puppetServed>0&&ins.stats.errors===0,'먹·흰 실 인형 시트를 굽고 내줌',ins&&{baked:ins.baked,stats:ins.stats,lastError:ins.lastError});
if(SH){await p.screenshot({path:SH+'/puppets.png'});}
ok(pup.nan.length===0,'그리기 NaN 없음',pup.nan);
ok(errs.length===0,'페이지 오류 없음',errs.slice(0,4));
console.log(JSON.stringify({total:n,failed:bad,method:'headless chromium, software render (not GPU/real device)'}));await b.close();process.exit(bad?1:0);
