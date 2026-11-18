// R1139 헤드리스 확인: EGO 히든 영웅 — 페르소나 탄 크기, 분신 발밑 오라, 은·금 → 언주·흰, 기술 이름 글자
//  (헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 확인 아님). 실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1139/r1139-browser.mjs [스크린샷 폴더]
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SH=process.argv[2]||'';if(SH)fs.mkdirSync(SH,{recursive:true});
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const W=960,H=540;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(600);
await p.locator('#panel [data-ego-r1046]').first().click();await p.waitForTimeout(300);
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<3000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));},s);
const reset=()=>p.evaluate(()=>{for(const k in player)if(/CD$/.test(k))player[k]=0;player.resonance=100;player.invincible=1e6;});
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{enterRegion('dist02',null,{restore:true});});await p.waitForFunction(()=>!loading&&zone==='dist02',null,{timeout:200000});await skip();await waitG(1.5);
ok(await p.evaluate(()=>!safeRegion()&&window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive()&&window.__STORYWORLD_EGO_POLISH_R1139__?.active()),'전투 지역 · EGO 형상 · R1139 켜짐');
// 렌더러가 실제로 받은 명령을 render 뒤에 센다(R1139 처리 뒤 값)
await p.evaluate(()=>{window.__q={on:false,cloneAura:0,cloneBody:0,hwFx:0,egoFx:0,shotPx:[],byKey:{},frames:0};const A=window.__STORYWORLD_EGO_POLISH_R1139__;const tag=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.__q1139)return;r.__q1139=true;const base=r.render;
 r.render=function(f){const out=base.apply(this,arguments);try{if(__q.on){__q.frames++;for(const c of f?.commands||[]){if(!c||c.kind!=='image')continue;const sp=String(c.sourcePath||''),fl=c.style?.filter,a=+(c.style?.globalAlpha??1);
   if(A.isCloneInk(fl)){if(A.isAura(sp)&&a>0)__q.cloneAura++;if(/r1048\/ego\/|r1116\/ego-ink|r1112\/ego-ink/.test(sp)&&a>0)__q.cloneBody++;}
   if(c.owner?.r945Clone&&c.owner?.kind==='hero'&&a>0&&!A.isAura(sp))__q.cloneBody++;
   if(A.isHwandoFx(sp)&&!A.isCloneInk(fl))__q.hwFx++;/* 분신 먹 겹은 흑백이라 세지 않는다 */if(/^r1139:ego:r106fx:/.test(sp))__q.egoFx++;
   if(c.owner?.kind==='projectile'&&/persona-skills|^r1119:fx:/.test(sp)&&a>.9&&Array.isArray(c.points)){const P=c.points;const w=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]);__q.shotPx.push(w);const k=sp.replace(/^.*persona-skills\//,'raw:').replace(/:\d+$/,'');(__q.byKey[k]=__q.byKey[k]||{})[Math.round(w)]=1;}}}}catch(e){__q.err=String(e);}return out;};};tag();setInterval(tag,50);});
const pull=()=>p.evaluate(()=>{const es=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));es.slice(0,3).forEach((e,i)=>{e.x=player.x+1.3+i*.5;e.y=player.y+(i-1)*.7;e.hp=e.maxHp=Math.max(e.maxHp||1,1e7);});});
async function round(onFlag,shot){await p.evaluate(v=>{window.__STORYWORLD_EGO_POLISH_R1139__.set(v);Object.assign(__q,{on:true,cloneAura:0,cloneBody:0,hwFx:0,egoFx:0,shotPx:[],byKey:{},frames:0});window.__seen=[];window.__iv=setInterval(()=>{for(const s of projectiles)if(s.egoKitR1094&&!__seen.includes(s))__seen.push(s);},15);},onFlag);
 await pull();await reset();await p.evaluate(()=>window.__STORYWORLD_HWANDO_INK_R945__.force('clones'));await p.keyboard.press('KeyA');await waitG(.5);await reset();await p.keyboard.press('KeyQ');await waitG(.55);
 if(SH&&shot){const q=await p.evaluate(()=>project(player.x,player.y));await p.screenshot({path:SH+'/'+shot+'.png',clip:{x:Math.max(0,Math.min(W-520,q.x-260)),y:Math.max(0,Math.min(H-360,q.y-230)),width:520,height:360}});}
 await waitG(.5);await reset();await p.keyboard.press('KeyF');await waitG(.7);
 return p.evaluate(()=>{clearInterval(__iv);__q.on=false;const px=__q.shotPx;return {...__q,shotPx:undefined,byKey:Object.fromEntries(Object.entries(__q.byKey).map(([k,v])=>[k,Object.keys(v).join(',')])),shots:__seen.length,scales:[...new Set(__seen.map(s=>s.egoKitR1094+':'+(+s.scale).toFixed(2)))],radii:[...new Set(__seen.map(s=>+s.radius))],pxMin:px.length?Math.min(...px):null,pxMed:px.length?px.sort((a,b)=>a-b)[px.length>>1]:null,nPx:px.length};});}
const off=await round(false,'before-q');await waitG(1.5);const on=await round(true,'after-q');
console.log('끔',JSON.stringify(off));console.log('켬',JSON.stringify(on));
ok(off.shots>=4&&on.shots>=4,'Q·F 협주 탄이 나감(끔·켬)',[off.shots,on.shots]);
const ecl=o=>Math.max(0,...String(o.byKey['r1119:fx:eclipse-flight']||o.byKey['raw:eclipse.png']||'').split(',').map(Number).filter(Number.isFinite));
ok(ecl(off)>0&&ecl(on)>=ecl(off)*1.8,'같은 탄(욕망의 일식) 그림 폭이 1.8배 이상 커짐(화면 px)',{off:ecl(off),on:ecl(on)});
ok(on.pxMin>=20,'켬: 가장 작은 탄도 화면 20px 이상(960×540)',on.pxMin);
ok(on.radii.every(r=>r===.2||r===.3)&&JSON.stringify(on.radii.sort())===JSON.stringify(off.radii.sort()),'판정 반지름 그대로',{on:on.radii,off:off.radii});
ok(off.cloneBody>0&&on.cloneBody>0,'삼협묵희 분신 몸이 그려짐(검사 전제)',[off.cloneBody,on.cloneBody]);
ok(off.cloneAura>0,'끔: 분신 몫 오라가 그려짐(고치기 전 재현)',off.cloneAura);
ok(on.cloneAura===0,'켬: 분신 몫 오라 0',on.cloneAura);
ok(off.hwFx>0&&off.egoFx===0,'끔: 환도 은·금 절차 이펙트 그대로(고치기 전 재현)',[off.hwFx,off.egoFx]);
ok(on.hwFx===0&&on.egoFx>0,'켬: 은·금 이펙트 0 · 언주·흰 사본으로',[on.hwFx,on.egoFx]);
const I=await p.evaluate(()=>window.__STORYWORLD_EGO_POLISH_R1139__.inspect());
ok(I.stats.errors===0&&I.stats.baked>0&&I.stats.baked<200,'R1139 오류 0 · 다시 칠한 그림 수 적당(매 프레임 굽지 않음)',I);
ok(errs.length===0,'페이지 오류 0',errs);
await b.close();console.log(`\nR1139 browser: ${n-bad}/${n} 통과`);process.exit(bad?1:0);
