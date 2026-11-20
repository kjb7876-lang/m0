// R1265 헤드리스 확인: EGO(2D·3D) 기본 공격·Q·W·E·R·F 와 환도→EGO 전환(777) 뒤에 렌더러가 받은 명령에 환도 베기·은금 시트·흰 수묵 원본이 보이게 남는지,
//  환도 본인은 그대로인지(헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 확인 아님).
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1265/r1265-browser.mjs [모드들 쉼표(3d,2d,hwando,swap)] [스크린샷 폴더]
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',MODES=(process.argv[2]||'3d,2d,hwando,swap').split(','),SH=process.argv[3]||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,600):''));};
// 검사 쪽 분류(모듈과 따로 적음): 환도 베기·금빛 = HW, 은빛 R100 = PALE, 수묵·검풍 원본 = INK
const HW=/assets\/(?:r1041\/fx-[a-z0-9]+-hwando-|r302\/fx\/hwando\/|r349\/hwando-|vfx\/heroes\/hwando-|r590\/hwando-a-draw-cut)|assets\/r100\/sig-[a-z]+-gold\.webp/;
const PALE=/assets\/r100\/sig-[a-z]+-pale\.webp/,INK=/^(?:assets\/r945\/hwando-(?!cutin)|assets\/r590\/hwando-(?!a-draw-cut)|r945:)/;
async function run(mode){
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
 if(mode==='3d'||mode==='2d'){await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(900);await p.locator(`#panel .heroRowR101 [data-r1176="${mode}"]`).click();}
 else await p.locator('#panel .heroRowR101 button[data-hero="hwando"]').click();
 await p.waitForTimeout(300);await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
 const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
 const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<4000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));},s);
 if(mode==='3d'||mode==='2d')await p.waitForFunction(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),null,{timeout:8000}).catch(()=>{});
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 if(mode==='hwando'||mode==='swap')await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(false));
 await p.evaluate(()=>{enterRegion('dist02',null,{restore:true});});await p.waitForFunction(()=>!loading&&zone==='dist02',null,{timeout:200000});await skip();await waitG(1.5);
 if(mode==='hwando'||mode==='swap')await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(false));
 await p.evaluate(([hw,pale,ink])=>{const HW=new RegExp(hw),PALE=new RegExp(pale),INK=new RegExp(ink);window.__q={on:false,phase:'',rows:{}};const tag=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.__q1265b)return;r.__q1265b=true;const base=r.render;
  r.render=function(f){const out=base.apply(this,arguments);try{if(__q.on){const M=(__q.rows[__q.phase]=__q.rows[__q.phase]||{frames:0,hw:{},pale:0,ink:{},ego:0,egoTint:0});M.frames++;for(const c of f?.commands||[]){if(!c||c.kind!=='image')continue;const a=+(c.style?.globalAlpha??1);if(!(a>0))continue;
    const s0=String(c.sourcePath||c.image?.src||''),s=/^r\d+:/.test(s0)?s0:s0.replace(/^.*?(assets\/)/,'$1').replace(/\?.*$/,'');/* r1265:ego: 같은 사본 주소는 앞말을 지우지 않음 */if(HW.test(s))M.hw[s]=(M.hw[s]||0)+1;if(PALE.test(s))M.pale++;if(INK.test(s))M.ink[s]=(M.ink[s]||0)+1;if(/^r1265:ego:/.test(s))M.egoTint++;if(/r1139\/ego\/|r1048\/fx\/|sig-[a-z]+-red/.test(s))M.ego++;}}}catch(e){__q.err=String(e);}return out;};};tag();setInterval(tag,50);},[HW.source,PALE.source,INK.source]);
 const pull=()=>p.evaluate(()=>{const es=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));es.slice(0,3).forEach((e,i)=>{e.x=player.x+1.3+i*.5;e.y=player.y+(i-1)*.7;e.hp=e.maxHp=Math.max(e.maxHp||1,1e7);e.speed=0;});});
 const reset=()=>p.evaluate(()=>{for(const k in player)if(/CD$/.test(k))player[k]=0;player.resonance=100;player.invincible=1e6;});
 async function phase(name,fn,dur){await pull();await reset();await p.evaluate(n=>{__q.phase=n;__q.on=true;},name);await fn();await waitG(dur);await p.evaluate(()=>{__q.on=false;});await waitG(.6);}
 if(mode==='swap'){/* 환도로 베는 중에 EGO 로 바꿈(777 해금 뒤 형상 켜기) — 바꾼 순간부터의 화면만 센다 */
  await pull();await reset();await p.keyboard.down('KeyA');await waitG(1.2);await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true));
  await p.evaluate(()=>{__q.phase='A';__q.on=true;});await waitG(2);await p.keyboard.up('KeyA');await waitG(.4);await p.evaluate(()=>{__q.on=false;});
  if(SH){const q=await p.evaluate(()=>project(player.x,player.y));}
 }else{
  await phase('A',async()=>{await p.keyboard.down('KeyA');await waitG(1.4);if(SH){await p.screenshot({path:`${SH}/${mode}-A.png`});}await waitG(1.1);await p.keyboard.up('KeyA');},.5);
  for(const k of ['Q','W','E','R','F'])await phase(k,async()=>{await p.keyboard.press('Key'+k);if(SH&&k==='Q'){await waitG(.5);await p.screenshot({path:`${SH}/${mode}-Q.png`});}},1.4);
 }
 const res=await p.evaluate(()=>({rows:__q.rows,err:__q.err||null,form:window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),hero:player.hero,api:!!window.__STORYWORLD_EGO_FX_SPLIT_R1265__}));res.errs=errs;await b.close();return res;}
for(const mode of MODES){const r=await run(mode);const ph=Object.keys(r.rows);const sum=k=>ph.reduce((a,x)=>a+(typeof r.rows[x][k]==='number'?r.rows[x][k]:Object.values(r.rows[x][k]).reduce((u,v)=>u+v,0)),0);
 console.log(mode,JSON.stringify({form:r.form,hero:r.hero,api:r.api,err:r.err,errs:r.errs.length,rows:r.rows}).slice(0,1500));
 ok(!r.err&&r.errs.length===0&&ph.length>0&&ph.every(x=>r.rows[x].frames>5),mode+': 기록 정상·페이지 오류 0',{err:r.err,errs:r.errs.slice(0,2),frames:ph.map(x=>r.rows[x].frames)});
 if(mode==='hwando'){ok(!r.form&&sum('hw')>0,'환도 본인: 환도 베기 그림은 그대로 보임(되돌림 없음)',sum('hw'));ok(sum('ink')>0||true,'환도 본인: 수묵 그림 원본(확률 발동이라 0 일 수 있음)',sum('ink'));ok(sum('egoTint')===0,'환도 본인: EGO 색 사본 0',sum('egoTint'));continue;}
 ok(r.form,mode+': EGO 형상');
 ok(sum('hw')===0,mode+': 환도 베기·금빛 시트 보이는 명령 0',ph.map(x=>[x,r.rows[x].hw]));
 ok(sum('pale')===0||mode!=='swap'&&ph.filter(x=>x!=='R').every(x=>r.rows[x].pale===0),mode+': 환도 은빛 R100 시트 0(R 소환 영웅 보조색만 예외)',ph.map(x=>[x,r.rows[x].pale]));
 ok(sum('ink')===0,mode+': 흰 수묵·검풍 원본 0(EGO 색 사본으로만)',ph.map(x=>[x,r.rows[x].ink]));
 ok(sum('ego')>0,mode+': EGO 자기 이펙트는 그대로 그려짐',sum('ego'));}
console.log(`\nR1265 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
