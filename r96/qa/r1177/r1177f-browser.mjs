// R1177f 기억 지역 몹 타격(mob-memory) Dots CX-0160MF, 헤드리스 브라우저 검사(그래픽·GPU 검증 아님).
//  실행: SW_URL=http://127.0.0.1:4396/m0/ [SHOT=/tmp/dir] node r96/qa/r1177/r1177f-browser.mjs
//  본편 mob-memory → Dots CX-0160MF 시트만 읽음, 페이지 오류 0.
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
const look=re=>p.evaluate(s=>{const A=window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__,R=new RegExp(s);return [...__C.paths].map(q=>A.resolve(q)||q).filter(q=>R.test(q));},re);
await p.evaluate(()=>{player.invincible=1e9;const X=__STORYWORLD_PIXELFX_R163__;X.warm?.(['mob-memory']);for(let i=0;i<3;i++)X.play('mob-memory',player.x+1.2-i*1.2,player.y-.8,{k:1.3,rate:1.2,tint:'#7a3040',delay:i*.15});});
await waitGame(.35);if(SHOT)await p.screenshot({path:`${SHOT}/r1177f-memory.png`});await waitGame(1.2);
let r=await look('mob-memory');ok(r.length>0&&r.every(q=>/r1177\/mob-memory-dots-12/.test(q)),'본편: mob-memory 는 Dots 시트만',r);
// S-06 침공병: R161 인형 칸으로 그려지는지 — R380 승인 그림(dys-pulse-raider)이 맡으면 R1169 피격·사망 표가 이미 적용되므로 R161 쪽에 붙일 필요 없음
await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-06'),null,{zone:'sz115-S06-1'});});
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.3);
const inv=await p.evaluate(()=>{const S=__STORYWORLD_SAMONG_R161__,src=(room.enemies||[]).find(e=>e.hp>0&&e.samongR103);if(!src)return null;const e={...src,name:'외계 침공군'};
 const a=window.__STORYWORLD_APPROVED_MOBS_R380__?.assign?.(e);return {puppet:S.puppetOf(e),approved:a?String(a.key||a.id||a.path||a.base||JSON.stringify(a)).slice(0,120):null};});
console.log('침공병 확인',JSON.stringify(inv));
const ins=await p.evaluate(()=>[window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__.inspect().stats.errors]);ok(ins[0]===0,'R1177 오류 0',ins);
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`R1177f browser ${n-bad}/${n}`);process.exit(bad?1:0);
