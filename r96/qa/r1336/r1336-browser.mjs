// R1336 플레이 영상(사용자 2026-11-26 10:16) 오류 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 3D 영웅 투명화: EGO(F)·보호막·막기 중에 drawHero 가 영웅 몫으로 그리는 이펙트 그림(VFX.aura·VFX.barrier, 경로 끝에 ':hero:<영웅>' 이 붙음)을
//     R1302 가 '몸'으로 골라 3D 불투명도가 그 이펙트 알파(.21~.52)로 떨어지고, 그 이펙트는 2D 에서 지워졌다.
//     기대: 그 상태에서도 3D 불투명도 ≥ .98. 그 이펙트(2D 에선 몸 뒤에 그리던 것)는 예전처럼 3D 에서 숨김 — 3D 몸 앞에 남기면 흰 막이 몸을 덮는다(실측).
//     회귀: 평소 대기·걷기도 2D 몸은 빠지고 3D 불투명.
//  ② 기억사수 '잔영 위장'(R953 은신): 3D 몸은 반투명 껍질로 바뀌지 않는다(불투명도 ≥ .98), 은신 판정·궁극기 단축은 그대로(cloaked() true).
//  ③ EGO(각성 영웅) 공격 이펙트 잘림: R1139b 가로 베기 궤적(trail-horizontal)·적중(impact) 시트는 영웅 몫 그림이고 경로에 'ego' 가 들어
//     R1302 가 3D EGO 의 '몸'으로 함께 골라 지웠다(남는 건 R350 반투명 복사 조각뿐). 기대: 3D EGO 기본 공격 중 궤적·적중 그림이 화면에 그대로 남는다.
//     회귀: EGO 몸 시트(slash-right 등)는 3D 로 바뀌어 빠진다.
//     실측 원인(2D EGO, 영상 속 경우): R1048 이 베기 띠를 두 쪽(r1048s0·s1)으로 나눠 각자 자르기 상자(clip)를 걸어 그리는데, R1139b 가 s1 을 끄고
//     s0 을 Dots 궤적 한 장으로 바꾸면서 s0 의 반쪽 자르기 상자를 그대로 물려받았다 → 초승달 궤적의 앞쪽이 잘림.
//     기대: 화면에 가는 궤적 명령의 자르기 상자가 궤적 사각형을 덮는다(자르기 없음 또는 궤적 전체 포함).
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1336/r1336-browser.mjs` (HEROES=a,b 로 일부만)
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=(process.env.HEROES||'gunner,hunter,hwando,ego,michaela').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:960,height:540}});await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
// R1302 의 몸 빼기 바깥에서 render 직전·직후 명령을 본다(__r1304 표지를 달아 R1302 가 다시 바깥에 서지 않게).
await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,sc=r.commands,base=sc.render;
 const rows=cmds=>cmds.filter(c=>c?.kind==='image'&&c.owner?.kind==='hero'&&!c.owner.r350&&!c.owner.r945Clone).map(c=>({path:(String(c.sourcePath||'').match(/^.*?\.(webp|png|jpe?g|avif)/i)||[String(c.sourcePath||'')])[0],a:+(c.style?.globalAlpha??1)}));
 const w=function(cmds){const q=window.__r1336Q;if(q&&!q.out){q.before=rows(cmds);}const out=base.apply(this,arguments);if(q&&q.before&&!q.out){q.out={before:q.before,after:rows(cmds),ins:window.__STORYWORLD_HWANDO3D_R1302__.inspect()};}return out;};w.__r1304=true;sc.render=w;});
const snap=async()=>{await p.evaluate(()=>{window.__r1336Q={};});await p.waitForFunction(()=>window.__r1336Q?.out,null,{timeout:90000});return p.evaluate(()=>{const o=window.__r1336Q.out;window.__r1336Q=null;return o;});};
const pick=async h=>{await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;player.ego=0;player.shield=0;player.guard=false;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===h&&i.shown;},h,{timeout:240000});await p.waitForTimeout(1500);};
const isFx=x=>/\/(barrier|aura|vfx)[^/]*\.(webp|png)$/i.test(x.path)||/assets\/r1027\//.test(x.path);
const isBody=(x,h)=>!isFx(x)&&x.path.includes('/'+(h==='ego'?'':h));
const op=o=>o.ins.opacity;
for(const h of HEROES){
 await pick(h);
 {const o=await snap();ok(op(o)>=.98,`회귀 ${h} 대기: 3D 불투명 (${op(o)})`);ok(o.ins.shown&&!o.after.some(x=>!isFx(x)&&x.a>.9&&o.before.some(y=>y.path===x.path&&!isFx(y))&&x.path.includes('/'+h+'/')),`회귀 ${h} 대기: 2D 몸은 3D 로 바뀌어 빠짐`);}
 for(const [name,set,clr] of [['EGO','player.ego=8','player.ego=0'],['보호막','player.shield=50','player.shield=0'],['막기','player.guard=true','player.guard=false']]){
  await p.evaluate(s=>{(0,eval)(s);},set);await p.waitForTimeout(700);
  const o=await snap(),fxBefore=o.before.filter(isFx),fxAfter=o.after.filter(isFx);
  ok(op(o)>=.98,`① ${h} ${name}: 3D 몸이 투명해지지 않음 (불투명도 ${op(o)})`);
  ok(fxBefore.length>0&&fxAfter.length===0,`① ${h} ${name}: 몸 뒤 이펙트(${fxBefore.map(x=>x.path.split('/').pop()).join(',')||'없음'})는 예전처럼 3D 에서 숨김 — 3D 몸 앞에 흰 막으로 덮이지 않게 (${fxBefore.length}→${fxAfter.length})`);
  await p.evaluate(s=>{(0,eval)(s);},clr);await p.waitForTimeout(300);}
 // 걷기 + EGO (사용자: 걸을 때도 투명)
 await p.evaluate(()=>{player.ego=8;let dir=1;clearInterval(window.__r1336W);window.__r1336W=setInterval(()=>{if(!route.length){dir=-dir;route=[{x:player.x+dir*3,y:player.y+dir*1.5}];}},8);});
 await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.walk>.9,null,{timeout:90000});
 {const o=await snap();ok(op(o)>=.98,`① ${h} 걷기+EGO: 3D 불투명 (${op(o)})`);}
 await p.evaluate(()=>{clearInterval(window.__r1336W);route.length=0;player.moving=false;player.ego=0;});
 if(h==='gunner'){const V='__STORYWORLD_GUNNER_VEIL_R953__';
  const f=await p.evaluate(V=>{try{const r=window[V].force('cloak');const e=room.enemies.find(e=>e.hp>0);if(e){e.visible=true;e.x=player.x+2;e.y=player.y;}let n=0;clearInterval(window.__r1336A);window.__r1336A=setInterval(()=>{if(window[V].cloaked()||++n>80){clearInterval(window.__r1336A);return;}player.attackCD=0;try{basicAttack(true);}catch(_){}},60);return r;}catch(e){return String(e);}},V);
  await p.waitForFunction(V=>window[V].cloaked(),V,{timeout:30000}).catch(()=>{});await p.waitForTimeout(700);
  const o=await snap(),c=await p.evaluate(V=>window[V].cloaked(),V);
  const iv=await p.evaluate(V=>JSON.stringify(window[V].inspect()).slice(0,400),V);ok(c===true,`② 기억사수 잔영 위장 발동(판정 유지) (force ${JSON.stringify(f)}, cloaked ${c}) ${c?'':iv}`);
  ok(op(o)>=.98,`② 기억사수 잔영 위장: 3D 몸 불투명 (${op(o)})`);}
}
if(HEROES.includes('ego')){await pick('ego');
 await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&!e.boss);e.visible=true;e.x=player.x-1.3;e.y=player.y+.2;e.hp=e.maxHp=1e9;e.speed=0;e.damage=0;
  window.__r1336E={trail:[0,0],impact:[0,0],body:[0,0]};const sc=window.__STORYWORLD_PHASE1__.controller.state.three.commands,base=sc.render;
  const cnt=(cmds,re)=>cmds.filter(c=>c?.kind==='image'&&!c.owner?.r350&&re.test(String(c.sourcePath||''))).length;
  const w=function(cmds){const E=window.__r1336E;const b={trail:cnt(cmds,/r1139\/ego\/trail-horizontal/),impact:cnt(cmds,/r1139\/ego\/impact/),body:cnt(cmds,/r1139\/ego\/slash-(right|front|rear)/)};const out=base.apply(this,arguments);
   const a={trail:cnt(cmds,/r1139\/ego\/trail-horizontal/),impact:cnt(cmds,/r1139\/ego\/impact/),body:cnt(cmds,/r1139\/ego\/slash-(right|front|rear)/)};for(const k in E){E[k][0]+=b[k];E[k][1]+=a[k];}return out;};w.__r1304=true;sc.render=w;
  clearInterval(window.__r1336A);window.__r1336A=setInterval(()=>{player.attackCD=0;try{basicAttack(true);}catch(_){}},500);});
 await p.waitForTimeout(6000);const E=await p.evaluate(()=>{clearInterval(window.__r1336A);return window.__r1336E;});
 // 처음 가설('R1302 가 궤적을 몸으로 골라 지운다')은 실측으로 틀림: 3D EGO 에서는 R1048 베기 띠 자체가 안 나와 궤적이 그려진 적이 없다(그린 0).
 //  3D EGO 기본 공격은 3D 모델 베기 모션이 맡는다(R1319). 궤적 유무는 이 검사에서 단언하지 않고 숫자만 남긴다.
 console.log(`정보 EGO 3D 공격: 궤적 그린 ${E.trail[0]}→화면 ${E.trail[1]}, 적중 ${E.impact[0]}→${E.impact[1]}`);
 ok(E.body[0]>0&&E.body[1]===0,`③ 회귀 EGO 2D 몸 시트는 3D 로 바뀌어 빠짐 (그린 ${E.body[0]} → 화면 ${E.body[1]})`);}
if(HEROES.includes('ego')){await pick('ego');await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(false));await p.waitForTimeout(1500);
 await p.evaluate(()=>{const e=room.enemies.find(e=>e.hp>0&&!e.boss);e.visible=true;e.x=player.x-1.3;e.y=player.y+.2;e.hp=e.maxHp=1e9;
  window.__r1336C={n:0,cut:0,worst:1};const sc=window.__STORYWORLD_PHASE1__.controller.state.three.commands,base=sc.render;
  const box=pts=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];};
  const w=function(cmds){const out=base.apply(this,arguments);const C=window.__r1336C;for(const c of cmds){if(c?.kind!=='image'||!/r1139\/ego\/trail-horizontal/.test(String(c.sourcePath||''))||!(c.style?.globalAlpha>0))continue;C.n++;
    const q=box(c.points),A=(q[2]-q[0])*(q[3]-q[1]);let keep=1;for(const cl of (c.clips||[]))for(const pth of (cl.paths||[])){const b=box(pth.points),ix=Math.max(0,Math.min(q[2],b[2])-Math.max(q[0],b[0])),iy=Math.max(0,Math.min(q[3],b[3])-Math.max(q[1],b[1]));keep=Math.min(keep,ix*iy/Math.max(1e-9,A));}
    if(keep<.98)C.cut++;C.worst=Math.min(C.worst,keep);}return out;};w.__r1304=true;sc.render=w;
  clearInterval(window.__r1336A);window.__r1336A=setInterval(()=>{player.attackCD=0;try{basicAttack(true);}catch(_){}},500);});
 await p.waitForTimeout(6000);const C=await p.evaluate(()=>{clearInterval(window.__r1336A);return window.__r1336C;});
 ok(C.n>0&&C.cut===0,`③ EGO 2D 공격: 가로 베기 궤적이 자르기 상자에 잘리지 않음 (궤적 ${C.n}장 중 잘림 ${C.cut}, 가장 많이 남은 비율 ${C.worst.toFixed(2)})`);
 await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));}
console.log(fail?`R1336 브라우저 실패 ${fail}`:'R1336 브라우저 통과');await b.close();process.exit(fail?1:0);
