// R1255 첫 사용 멈칫 세 가지 헤드리스 측정(스토리 murder03 보스방, 960×540). node trace.mjs  env: SW_URL, JUDGE=1
//  ① 몹 사망 연기: 환도 대본 각성 뒤 3게임초 동안 r108/eden/smoke 업로드 횟수(같은 그림을 다시 읽어 올림) — 1번 이하
//  ② F246 영웅 타격 아틀라스: 첫 적중 뒤 8게임초 쉬고 다시 적중했을 때 다시 올림 횟수 — 0번
//  ③ 네온 쌍갈래 뇌창: 네온으로 바꾸고 6게임초 뒤 뇌창을 강제로 터뜨렸을 때 창 시트 업로드 ms — 40ms 이하
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,'murder03');await p.waitForTimeout(1000);
await p.evaluate(()=>{player.maxHp=player.hp=1e9;player.hero='hwando';const R=window.__STORYWORLD_PHASE1__.controller.state.three.renderer;const gl=R.getContext();window.__U=[];
 for(const k of ['texImage2D','texSubImage2D']){const f=gl[k].bind(gl);gl[k]=function(...a){const t0=performance.now();const v=f(...a);const d=performance.now()-t0;for(const x of a)if(x&&typeof x==='object'&&'width' in x){const s=String(x.src||x.currentSrc||'');if(s)window.__U.push({t:+time.toFixed(2),s:s.replace(/^.*assets\//,''),d:+d.toFixed(1),px:(x.naturalWidth||x.width)*(x.naturalHeight||x.height)});break;}return v;};}});
const waitG=s=>p.evaluate(s=>new Promise(r=>{const t0=time;const f=()=>{if(modal)closePanel(true);player.hp=player.maxHp;time>=t0+s?r():setTimeout(f,30);};f();}),s);
const take=re=>p.evaluate(re=>{const R=new RegExp(re);const a=window.__U.filter(u=>R.test(u.s));window.__U.length=0;return a;},re);
const hitNear=()=>p.evaluate(()=>{const es=(room.enemies||[]).filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));const e=es[0];if(!e)return false;player.x=e.x-.8;player.y=e.y;player.attackAnim=.2;hitEnemy(e,1,{kind:'basic',sourceHero:player.hero});return true;});
const RES={};
// ② 먼저 첫 적중(F246 처음 올림) → 8초 쉼 → 다시 적중
await waitG(3);await take('.');for(let i=0;i<3;i++){await hitNear();await waitG(.3);}const f1=await take('final42-r88/effects/246');
await waitG(8);await take('.');for(let i=0;i<3;i++){await hitNear();await waitG(.3);}const f2=await take('final42-r88/effects/246');RES.f246={first:f1.length,again:f2.length,againMs:f2.reduce((s,u)=>s+u.d,0)};
// ① 대본 각성 뒤 사망 연기
await waitG(1);await take('.');await p.evaluate(()=>{player.samong=0;player.samongCD=0;awaken('story');});await waitG(3);const sm=await take('eden/smoke');RES.smoke={uploads:sm.length,ms:sm.reduce((s,u)=>s+u.d,0)};
await p.evaluate(()=>{player.samong=0;player.samongCD=30;});await waitG(2);
// ③ 네온 뇌창
await p.evaluate(()=>{player.hero='neon';});await waitG(6);await take('.');
await p.evaluate(()=>{const N=window.__STORYWORLD_NEON_STORM_R951__;N.qaRandom(()=>0);N.qaReset();N.qaForce('lance');});
for(let i=0;i<4;i++){await hitNear();await waitG(.4);}const ln=await take('r951/neon-lance\\.webp');const act=await p.evaluate(()=>window.__STORYWORLD_NEON_STORM_R951__.inspect().acts.length+'|'+JSON.stringify(window.__STORYWORLD_NEON_STORM_R951__.inspect().stats||{}).slice(0,160));
RES.lance={uploads:ln.length,ms:ln.reduce((s,u)=>s+u.d,0),px:ln.map(u=>u.px),acts:act};
const fu=await p.evaluate(()=>window.__STORYWORLD_FIRST_USE_R1255__?.inspect?.()||null);
console.log(JSON.stringify({RES,firstUse:fu},null,1));
if(process.env.JUDGE){let bad=0;const ok=(c,m)=>{if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
 ok(RES.smoke.uploads<=1,'① 대본 각성 3초 동안 몹 사망 연기 시트 업로드 '+RES.smoke.uploads+'번('+RES.smoke.ms.toFixed(0)+'ms) ≤ 1번');
 ok(RES.f246.first>=0&&RES.f246.again===0,'② 8초 쉬고 다시 적중할 때 F246 아틀라스 다시 올림 '+RES.f246.again+'번('+RES.f246.againMs.toFixed(0)+'ms) = 0번 (첫 적중 '+RES.f246.first+'번)');
 ok(RES.lance.ms<=40,'③ 네온 뇌창 첫 발동 장면 창 시트 업로드 '+RES.lance.ms.toFixed(0)+'ms('+RES.lance.uploads+'번 '+JSON.stringify(RES.lance.px)+'화소) ≤ 40ms');
 console.log(JSON.stringify({total:3,failed:bad,headless:true}));process.exitCode=bad?1:0;}
await b.close();
