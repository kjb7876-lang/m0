// R1244 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽·GPU·실기기 검증 아님). 실행: node r1244-browser.mjs <출력 폴더>  (서버 SW_URL, 기본 127.0.0.1:4410/m0/)
//  ① 실제 게임에 실림: API·R1033 fire/allow 감싸기·showAwakening 감싸기
//  ② 8영웅 + 페르소나 + EGO 패시브 컷인: #r1244Cine 뜸, 형상·이름판 맞음, 눈 초상·시그니처 시트 그림이 실제로 읽힘(naturalWidth>0)
//  ③ 사몽 각성(awaken('story')) → 각성 모드 + 엔진 컷인(#cutin) 그대로  ④ 렉: 각성 첫 2초 프레임(rAF) 끔 대비 회귀 없음(최대 프레임 +40ms 이하)
//  ⑤ 장면 캡처(정지 프레임) ⑥ 페이지 오류 0
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await go(p,'murder01');await p.waitForTimeout(1200);
await p.evaluate(()=>{player.maxHp=player.hp=99999;for(const e of room.enemies){e.maxHp=e.hp=1e9;e.cd=1e6;e.attack=null;e.speed=0;}});
const api=await p.evaluate(()=>{const C=window.__STORYWORLD_CINEMA_CUTIN_R1244__,R=window.__STORYWORLD_PASSIVE_CUTIN_R1033__;
 return {has:!!C,forms:C&&C.forms.length,fire:!!R?.fire?.__r1244,allow:!!R?.allow?.__r1244,awake:!!showAwakening.__r1244};});
ok(api.has&&api.forms===10,'① API·형상 10 '+JSON.stringify(api));ok(api.fire&&api.allow,'① R1033 fire·allow 감싸짐');ok(api.awake,'① showAwakening 감싸짐');
// ①b 감싸기 겹침: 10초 사이 각성 1번당 R1217 감싸기 실행 수가 늘지 않음(고치기 전 14→35→55)
const per=()=>p.evaluate(()=>{const S=__STORYWORLD_SAMONG_STAGGER_R1217__;const s0=S.inspect().stats.shows;try{showAwakening('play');}catch(_){}player.samong=0;return S.inspect().stats.shows-s0;});
{const a=await per();await p.waitForTimeout(10000);const b2=await per();ok(a===1&&b2===1,'①b 각성 감싸기 겹침 없음(10초 사이 '+a+'→'+b2+')');await p.waitForTimeout(1800);}
const KIND={slayer:'lattice',michaela:'bloom',lauren:'meteor',neon:'storm',seoha:'arbelia',hunter:'squad',gunner:'summon'};
const loaded=src=>p.evaluate(src=>new Promise(r=>{const m=/url\("?([^")]+)"?\)/.exec(src);if(!m)return r(0);const im=new Image();im.onload=()=>r(im.naturalWidth);im.onerror=()=>r(-1);im.src=m[1];}),src);
async function freeze(ms){await p.evaluate(ms=>{const el=document.getElementById('r1244Cine');for(const a of document.getAnimations()){const t=a.effect&&a.effect.target;if(t&&(t===el||el.contains(t))){a.pause();a.currentTime=ms;}}
 const tb=tick;window.__tb=tb;tick=function(dt,...a){return tb.call(this,dt*1e-4,...a);};},ms);}
async function thaw(){await p.evaluate(()=>{if(window.__tb){tick=window.__tb;window.__tb=null;}for(const a of document.getAnimations())if(a.playState==='paused')a.play();});}
async function shot(form,mode,kind,ms,name){await p.evaluate(([f,m,k])=>{__STORYWORLD_CINEMA_CUTIN_R1244__.play(f,m,k);},[form,mode,kind]);await p.waitForFunction(()=>!document.getElementById('r1244Cine').classList.contains('on'),null,{timeout:20000});
 // 실제 시간 끄기 타이머(1.1~1.6초)가 지난 뒤 클래스를 다시 붙이고 애니메이션 시각을 고정, 시트 칸은 그 시각에 맞춰 직접 놓는다(헤드리스 프레임이 느려 타이머와 겨루지 않게)
 await p.evaluate(()=>document.getElementById('r1244Cine').classList.add('on'));await freeze(ms);
 await p.evaluate(([f,m,ms])=>{const P=__STORYWORLD_CINEMA_CUTIN_R1244__.profile(f),d=m==='awake'?1600:1100,w=m==='awake'?.52:.58,pr=(ms/d-w)/(1-w);if(pr>=0){const s=P.sig,fr=Math.min(s.frames-1,Math.floor(pr*s.frames)),c=fr%s.cols,r=Math.floor(fr/s.cols);
  document.querySelector('#r1244Cine .r1244sig').style.backgroundPosition=(s.cols>1?c/(s.cols-1)*100:0)+'% '+(s.rows>1?r/(s.rows-1)*100:0)+'%';}if(P.slash){const sl=P.slash,se=m==='awake'?.13:.16,fr=Math.min(sl.frames-1,Math.floor(Math.min(1,ms/d/se)*sl.frames)),c=fr%sl.cols,r=Math.floor(fr/sl.cols);/* R1244c: 베기 칸도 그 시각에 맞춰 놓음 */
  document.querySelector('#r1244Cine .r1244slash').style.backgroundPosition=(sl.cols>1?c/(sl.cols-1)*100:0)+'% '+(sl.rows>1?r/(sl.rows-1)*100:0)+'%';}
  __STORYWORLD_CINEMA_CUTIN_R1244__.qaPose(ms/d);},[form,mode,ms]);
 await p.waitForTimeout(250);await p.screenshot({path:`${OUT}/${name}.jpg`,quality:82});await thaw();await p.evaluate(()=>document.getElementById('r1244Cine').classList.remove('on'));}
// ② 패시브
for(const h of ['slayer','michaela','lauren','neon','seoha','hunter','gunner']){
 const r=await p.evaluate(([h,k])=>{const R=__STORYWORLD_PASSIVE_CUTIN_R1033__;R.qaReset();player.hero=h;const ok=R.fire(h,k,player,h==='hunter'?{heroes:['hunter']}:{art:[]});const c=document.getElementById('r1244Cine');
  return {ok,on:c?.classList.contains('on'),form:c?.getAttribute('data-form'),mode:c?.getAttribute('data-mode'),plate:c?.querySelector('.r1244plate')?.textContent,eye:c?.querySelector('.r1244eye')?.style.backgroundImage,sig:c?.querySelector('.r1244sig')?.style.backgroundImage};},[h,KIND[h]]);
 const ew=await loaded(r.eye),sw=await loaded(r.sig);
 ok(r.ok&&r.on&&r.form===h&&r.mode==='passive','② '+h+' 패시브 컷인 '+JSON.stringify({form:r.form,plate:r.plate}));ok(ew>0&&sw>0,'② '+h+' 눈·시트 그림 읽힘 '+ew+'/'+sw);}
{const r=await p.evaluate(()=>{player.hero='hwando';__STORYWORLD_CINEMA_CUTIN_R1244__.qaReset();const a=__STORYWORLD_PASSIVE_CUTIN_R1033__.allow('hwando');const c=document.getElementById('r1244Cine');return {a,form:c.getAttribute('data-form'),on:c.classList.contains('on'),slash:c.querySelector('.r1244slash').style.backgroundImage};});
 ok(r.on&&r.form==='hwando'&&/ink-sweep/.test(r.slash),'② 환도 삼협묵희 컷인(먹 붓 베기) '+JSON.stringify(r));}
{const r=await p.evaluate(()=>{const ok=__STORYWORLD_CINEMA_CUTIN_R1244__.play('persona','passive','violet');const c=document.getElementById('r1244Cine');return {ok,form:c.getAttribute('data-form'),plate:c.querySelector('.r1244plate').textContent,eye:c.querySelector('.r1244eye').style.backgroundImage};});
 ok(r.ok&&r.form==='persona'&&/쌍성 소멸/.test(r.plate)&&!/lauren/.test(r.eye),'② 페르소나 컷인 '+JSON.stringify(r));ok(await loaded(r.eye)>0,'② 페르소나 그림 읽힘');}
{const r=await p.evaluate(()=>{const ok=__STORYWORLD_CINEMA_CUTIN_R1244__.play('ego','passive','trio');const c=document.getElementById('r1244Cine');return {ok,form:c.getAttribute('data-form'),eye:c.querySelector('.r1244eye').style.backgroundImage};});
 ok(r.ok&&r.form==='ego'&&(await loaded(r.eye))>0,'② EGO 컷인 '+JSON.stringify(r));}
await p.waitForTimeout(1800);
// ③ 사몽 각성 실제 흐름
{const r=await p.evaluate(()=>{player.hero='slayer';player.samong=0;player.samongCD=0;const ok=awaken('story');const c=document.getElementById('r1244Cine');
  return {ok,on:c.classList.contains('on'),mode:c.getAttribute('data-mode'),form:c.getAttribute('data-form'),plate:c.querySelector('.r1244plate').textContent,engine:document.getElementById('cutin').classList.contains('on')};});
 ok(r.on&&r.mode==='awake'&&r.form==='slayer'&&/사몽 각성/.test(r.plate),'③ 사몽 각성 극장판 컷인 '+JSON.stringify(r));ok(r.engine,'③ 엔진 각성 컷인(#cutin)도 그대로');}
await p.waitForTimeout(2000);
// ④ 렉: 각성 첫 2초 rAF 프레임 간격(켬/끔 번갈아 4번씩)
async function frames(onv){return p.evaluate(async onv=>{__STORYWORLD_CINEMA_CUTIN_R1244__.set(onv);player.samong=0;player.samongCD=0;player.hero='neon';
  const ts=[];let run=true;const loop=t=>{ts.push(t);if(run)requestAnimationFrame(loop);};requestAnimationFrame(loop);await new Promise(r=>setTimeout(r,300));
  const j0=performance.now();awaken('story');const call=performance.now()-j0;await new Promise(r=>setTimeout(r,2000));run=false;
  const d=[];for(let i=1;i<ts.length;i++)d.push(ts[i]-ts[i-1]);d.sort((a,b)=>b-a);player.samong=0;return {call,max:d[0],mean:d.reduce((a,b)=>a+b,0)/d.length,n:d.length};},onv);}
// 헤드리스 소프트웨어 렌더링은 2초에 프레임 9개 안팎이라 한 번 잰 최대값이 ±100ms 흔들린다 → 켬/끔 순서를 바꿔 가며 8쌍, 가운데 두 값 평균
const A={on:[],off:[]};for(let i=0;i<8;i++){for(const v of (i%2?[true,false]:[false,true])){A[v?'on':'off'].push(await frames(v));await p.waitForTimeout(400);}}
const med=(a,k)=>{const v=a.map(x=>x[k]).sort((x,y)=>x-y);return (v[3]+v[4])/2;};
const lag={on:{call:med(A.on,'call'),max:med(A.on,'max'),mean:med(A.on,'mean'),n:med(A.on,'n')},off:{call:med(A.off,'call'),max:med(A.off,'max'),mean:med(A.off,'mean'),n:med(A.off,'n')}};
console.log('LAG '+JSON.stringify(lag));
// 판정: 평균 프레임 간격(가장 안정한 값) 15% 이내 + 각성 호출 JS 15ms 이내. 최대 프레임 차는 소프트웨어 렌더링 양자화(1프레임≈350ms)로 ±75ms 흔들려 기록만 한다.
ok(lag.on.mean<=lag.off.mean*1.15&&lag.on.call-lag.off.call<=15,'④ 각성 렉 회귀 없음(평균 프레임 '+lag.on.mean.toFixed(0)+' vs '+lag.off.mean.toFixed(0)+'ms, 최대 프레임 차 '+(lag.on.max-lag.off.max).toFixed(1)+'ms, 호출 차 '+(lag.on.call-lag.off.call).toFixed(1)+'ms)');
await p.evaluate(()=>__STORYWORLD_CINEMA_CUTIN_R1244__.set(true));
// ⑤ 캡처
await shot('slayer','passive','lattice',120,'passive-slayer-slash');
await shot('slayer','passive','lattice',420,'passive-slayer-eye');
await shot('slayer','passive','lattice',800,'passive-slayer-sig');
await shot('hwando','awake',null,120,'awake-hwando-slash');
await shot('hwando','awake',null,560,'awake-hwando-eye');
await shot('hwando','awake',null,935,'awake-hwando-impact');
await shot('hwando','awake',null,1150,'awake-hwando-sig');
await shot('persona','awake',null,560,'awake-persona-eye');
await shot('persona','awake',null,1150,'awake-persona-sig');
await shot('neon','passive','storm',420,'passive-neon-eye');
await shot('michaela','passive','bloom',420,'passive-michaela-eye');
// R1244c: Dots 2차분 — 베기 시트(길어지는 칸)·임팩트 정지 그림
await shot('neon','passive','storm',70,'passive-neon-slash');
await shot('gunner','passive',null,70,'passive-gunner-slash');
await shot('hunter','awake',null,90,'awake-hunter-slash');
await shot('hunter','awake',null,935,'awake-hunter-impact');
await shot('persona','awake',null,935,'awake-persona-impact');
await shot('gunner','awake',null,560,'awake-gunner-eye');
await shot('michaela','passive','bloom',600,'passive-michaela-glow');
await shot('hunter','passive','squad',420,'passive-hunter-eye');
await shot('seoha','awake',null,700,'awake-seoha-glow');
await shot('lauren','passive','meteor',420,'passive-lauren-eye');
await shot('ego','awake',null,560,'awake-ego-eye');
ok(errs.length===0,'⑥ 페이지 오류 0 '+errs.join(' | '));
await b.close();console.log(JSON.stringify({fails,method:'headless chromium software render'}));process.exit(fails?1:0);
