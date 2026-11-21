// R1295 실패 먼저 검사 — 윤서하 전투 중 '도리도리'(사용자 2026-11-21 11:46Z).
//  재현: 서하 좌우(화면)로 비슷한 거리에 적 둘(제자리·무적). 무리에 밀리는 것처럼 0.2초마다 둘의 거리를 2.0/2.15 로 번갈아 바꿈.
//  엔진 원거리 기본 공격은 매 발 '가장 가까운 적'을 새로 골라 → 발마다 왼쪽·오른쪽으로 몸이 뒤집힘.
//  기대(스타·워3 방식 표적 유지): 지금 표적이 살아 있고 사거리 안이면 계속 그 표적을 쏜다 → 화면 좌우 뒤집힘 0.
//  경계: ① 표적이 죽으면 다른 쪽으로 바꿔야 함(뒤집힘 1번 허용, 공격 계속) ② 표적이 사거리 밖이면 바꿔야 함
//        ③ 사용자가 직접 고른 표적(target)은 그대로 따름 ④ 회귀: 한쪽에만 적이 있을 때 공격이 계속 나감(발 수 기준선 이상).
//  시간은 게임 time 기준. 헤드리스 검사(그림 좌우는 drawHero 뒤 기록기 points 로 읽음).
import {chromium,boot,go} from '../r444/lib.mjs';
const HERO=process.env.HERO||'seoha',ZONE=process.env.ZONE||'cult02';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:process.env.OFF?{'storyworld.r1295.hold':'{"on":false}'}:null});
await go(p,ZONE);
await p.evaluate(()=>{const W=window.__R1295={rec:[],shots:0,on:false};const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:0;const r=base.apply(this,a);
 try{if(W.on&&rec&&Array.isArray(rec.commands)&&(a[0]===player||a[0]==null)){let best=null,ba=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!Array.isArray(c.points)||c.points.length<4)continue;const path=String(c.sourcePath||c.image?.src||'');if(/fx|effect|shadow|aura|ring|orb|shot|proj|barrier/i.test(path))continue;const w=Math.hypot(c.points[1][0]-c.points[0][0],c.points[1][1]-c.points[0][1]),h=Math.hypot(c.points[3][0]-c.points[0][0],c.points[3][1]-c.points[0][1]);if(w*h>ba){ba=w*h;best={flip:c.points[1][0]<c.points[0][0],path}}}
  if(best)W.rec.push({t:+time.toFixed(3),...best,dir:player.direction,sec:player.currentVisualSector,anim:+(+player.attackAnim||0).toFixed(2),hold:window.__STORYWORLD_TARGET_HOLD_R1295__?.inspect().hold?.id?.slice(-2)})}}catch(e){W.err=String(e)}return r};
 const bt=tick;window.tick=tick=function(dt){const cd=player.attackCD;const r=bt.apply(this,arguments);if(W.on&&player.attackCD>cd+.01&&(+player.attackAnim||0)>.2)W.shots++;if(W.on){player.hp=maxHP();W.place?.(Math.floor(time/.2));}return r};});
function face(x){const m=/-(se|ne|sw|nw|e|w|s|n|left|right)(?:[-_.][^/]*)?\.webp/.exec(x.path);if(!m)return null;const k=m[1];const nat=/^(e|se|ne|right)$/.test(k)?'R':/^(w|sw|nw|left)$/.test(k)?'L':null;if(!nat)return null;return x.flip?(nat==='R'?'L':'R'):nat}
async function waitT(dt){const t0=await p.evaluate(()=>time);for(;;){const s=await p.evaluate(t=>{if(storyScene)for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);return time>=t},t0+dt);if(s)return;await p.waitForTimeout(120);}}
// 화면 가로 = 세계 (dx-dy)/√2 방향. 왼쪽 적: 세계 (-d/√2, +d/√2), 오른쪽 적: (+d/√2, -d/√2)
async function setup({sides=['L','R'],pick=null,far=false}){await p.evaluate(([h,sides,pick,far])=>{ensureImages?.(heroPaths?.(h)||[]);player.hero=h;player.attackCD=0;target=null;
  const es=liveEnemies().filter(e=>!e.boss&&!e.midboss);for(const e of es){e.x=player.x+40;e.y=player.y+40;e.speed=0;}/* 나머지는 멀리 */
  const W=window.__R1295;W.es=[];W.mortal=new Set();const k=Math.SQRT1_2;
  sides.forEach((s,i)=>{const e=es[i];if(!e)return;e.side=s;e.speed=0;e.r1295=true;W.es.push(e);});
  for(const e of W.es){e.hp=1e9;e.maxHp=1e9;}
  const place=W.place=(ph)=>{for(const e of W.es){if(e.hp<=0)continue;e.hp=Math.max(e.hp,1e8);let d=(e.side==='L')===(ph%2===0)?2.0:2.15;if(far&&e.side==='L')d=40;const sx=e.side==='L'?-1:1;e.x=player.x+sx*d*k;e.y=player.y-sx*d*k;e.vx=0;e.vy=0;}};
  place(Math.floor(time/.2));/* tick 마다 자리 고정, 0.2초마다 거리 번갈아(무리에 밀리듯) */
  if(pick){const e=W.es.find(e=>e.side===pick);if(e)target=e.id;}
  W.rec.length=0;W.shots=0;W.on=true;keys.add('attack');},[HERO,sides,pick,far]);}
async function collect(){return p.evaluate(()=>{const W=window.__R1295;W.on=false;W.place=null;for(const e of W.es||[])if(e.hp>0){e.x=player.x+40;e.y=player.y+40;}keys.delete('attack');target=null;return {rec:W.rec.slice(),shots:W.shots,err:W.err}});}
function flips(rec){let n=0,last=null;const seq=[];for(const x of rec){const f=face(x);if(!f)continue;if(last&&f!==last){n++;seq.push(x.t)}last=f}return {n,last,seq}}
const res={};let fail=0;const F=(c,msg)=>{if(!c){fail++;console.log('FAIL',msg)}else console.log('ok  ',msg)};
if(process.env.ONLYA){await setup({});await waitT(3);const r=await collect();for(const x of r.rec)console.log(x.t,face(x),x.flip?"F":"-",x.path.slice(-26),x.dir,x.sec,x.anim,x.hold);await b.close();process.exit(0)}
// A. 양옆 적, 거리 번갈아 — 도리도리 재현
await setup({});await waitT(5);let r=await collect();res.A={shots:r.shots,...flips(r.rec)};
F(r.shots>=6,`A ${HERO} 양옆 적: 공격이 계속 나감 (발 ${r.shots})`);
F(res.A.n<=1,`A ${HERO} 양옆 적: 화면 좌우 뒤집힘 ≤1 (실제 ${res.A.n}번, 처음 시각 ${res.A.seq.slice(0,6).join(',')})`);
// B. 표적이 죽으면 반대쪽으로 바꿈
await setup({});await waitT(1.5);const firstSide=await p.evaluate(()=>{const W=window.__R1295;const f=W.rec.at(-1);return f?{flip:f.flip,path:f.path}:null});
const fs=await p.evaluate(fv=>{const W=window.__R1295;const hid=window.__STORYWORLD_TARGET_HOLD_R1295__?.inspect?.().hold?.id;/* 지금 쏘는 적(유지 표적, 없으면 보이는 쪽)을 죽인다 */const e=W.es.find(e=>e.id===hid)||W.es.find(e=>e.side===fv);if(!e)return null;W.es=W.es.filter(q=>q!==e);e.hp=0;e.maxHp=1;W.killed=e;/* 바로 쓰러뜨림(낮은 체력으로 두면 무적 틈·재생으로 2초 안에 안 죽는 때가 있어 검사가 흔들림) */return e.side;},face(firstSide||{path:''}));
await waitT(2);res.Bdbg=await p.evaluate(()=>{const W=window.__R1295,k=W.killed;return {k:k?.id,hp:k?.hp,dead:k?.deadRecorded,inRoom:room.enemies.includes(k),hold:window.__STORYWORLD_TARGET_HOLD_R1295__?.inspect?.().hold?.id,others:W.es.map(e=>[e.id,e.side,e.hp>0]),dir:player.direction}});r=await collect();const tail=r.rec.filter(x=>face(x));res.B={first:fs,lastFace:tail.length?face(tail.at(-1)):null,shots:r.shots};
F(fs&&res.B.lastFace&&res.B.lastFace!==fs&&r.shots>=2,`B 표적이 죽으면 반대쪽 적으로 바꿔 계속 공격 (처음 ${fs} → 끝 ${res.B.lastFace}, 발 ${r.shots})`);
// C. 사용자가 고른 표적을 따름
await setup({pick:'R'});await waitT(3);r=await collect();res.C={...flips(r.rec),shots:r.shots};
F(res.C.last==='R'&&res.C.n<=1,`C 직접 고른 오른쪽 표적을 계속 봄 (끝 ${res.C.last}, 뒤집힘 ${res.C.n})`);
// D. 회귀: 한쪽만
await setup({sides:['R']});await waitT(3);r=await collect();res.D={...flips(r.rec),shots:r.shots};
F(r.shots>=4&&res.D.n===0&&res.D.last==='R',`D 한쪽(오른쪽) 적만: 공격 계속·뒤집힘 0 (발 ${r.shots}, 끝 ${res.D.last})`);
await b.close();console.log(JSON.stringify(res));console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
