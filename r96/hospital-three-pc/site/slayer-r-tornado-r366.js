// R366 슬레이어 R '피의 난도질' → 피의 회오리 — 사용자 2026-11-06 "슬레이어 r도 .) 이거 없애줘 이펙트 그리고 디아바바리안 돌면서
//  스킬쓰는것처럼 피토네이도스킬이펙트로 변경해줘".
// 재현(헤드리스, dist00, 슬레이어 Lv99, R 한 번): '.)' 로 보이던 것은 둘이다.
//  · fx-d2s-r106 'hammer'(소용돌이 칼날): R 원형이 슬레이어에선 hammer(R269 슬롯 표) — 'blade' 초승달 ')' + 그 뒤를 따르는 'glow' 빛점 '.' 셋 + 'flare'
//    가 3~10개 1.4초 동안 바깥으로 돈다(그림 기록 blade 872·glow 2616·flare 872회).
//  · skills-r209 release 층: 슬레이어 결 조각(bits='slash')이 바닥 원 둘레 5~7곳에 초승달 칼자국으로 1.1초(1000회) + 바닥 원·균열 문양.
//  → 둘 다 슬레이어 R 일 때만 띄우지 않는다(fx-d2s launch / r209 layer 가 owns('slayer','r') 를 본다). 73a 원천 그림·피격 불꽃·피해 숫자·
//    R102 대상 자리 충격(smash)은 그대로. 다른 영웅·슬롯·슬레이어 W/E/Q 는 그대로.
// 새 연출(그림만, 판정·피해·범위·재사용 대기 그대로): 시전(storySourceSkill 첫 단계, castId 한 번) 순간부터 1.45초 동안
//  ① 피의 회오리: assets/r366/tornado-{back,front}.webp(12칸, 0.5초에 한 바퀴, scripts/r366-blood-tornado.py 가 수식으로 그림) —
//     back 은 영웅 몸 앞에, front 는 몸 뒤에 그려 띠가 영웅 둘레를 감싸 돈다. 높이 = 영웅 키 × 1.9, 0.15초에 자라고 마지막 0.3초에 옅어짐.
//  ② 영웅 회전: 몸 그림(R351 공격 칸) 가로 폭을 cos(회전각)으로 줄였다 뒤집어 제자리에서 돈다(초당 2.4바퀴, 발 x 기준 — 발은 그대로).
//     R351 공격 그림이면 반 바퀴마다 공격 칸 1→4(검이 뻗는 칸)를 돌려 칼을 휘두르며 도는 모습. 위·아래 그림이 없는 슬레이어에 맞춘 방법.
// 비용: 회오리 2장 drawImage + 몸 명령 하나 고침. 저사양(lowFx)이면 front 만 그린다. 협동(R62 mode≠off)에서도 그림만이라 그대로 돈다.
// Three.js 기록기: ctx.filter 는 쓰지 않는다. 합성 source-over(어두운 핏빛). 끄기: localStorage['storyworld.r366.tornado']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_R_TORNADO_R366__)return;
const REV='R366-tornado-1',KEY='storyworld.r366.tornado',BASE='assets/r366/',HERO='slayer',SLOT='r';
const DUR=1.45,GROW=.15,FADE=.3,SPIN=2.4,HEIGHT=1.9,TAU=Math.PI*2;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={casts:0,drawn:0,back:0,front:0,spun:0,frames:0,waiting:0,cancelled:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const isHero=()=>typeof player==='object'&&player?.hero===HERO;
let IDX=null,idxReq=false;
function loadIndex(){if(IDX||idxReq||typeof fetch!=='function')return;idxReq=true;fetch(BASE+'index.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.layers){IDX=j;warm();}else idxReq=false;}).catch(e=>{idxReq=false;fail(e);});}
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1200){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
function warm(){if(IDX&&isHero())for(const k of ['back','front'])image(BASE+IDX.layers[k].file);}
const owns=(h,slot)=>on&&h===HERO&&slot===SLOT;
let cast=null;const seen=new Set();
function start(castId,x,y){if(castId!=null){if(seen.has(castId))return;seen.add(castId);if(seen.size>32)seen.delete(seen.values().next().value);}
 let r=null;try{r=room;}catch(_){}cast={t0:T(),castId,x:Number.isFinite(x)?x:player.x,y:Number.isFinite(y)?y:player.y,room:r};stats.casts++;loadIndex();warm();}
function active(){if(!cast||!on)return null;const age=T()-cast.t0;let r=null;try{r=room;}catch(_){}
 if(age<0||age>=DUR||!isHero()||!(player.hp>0)||r!==cast.room){if(r!==cast.room)stats.cancelled++;cast=null;return null;}return age;}
const lowFx=()=>{try{return !!(settings?.lowFx||window.__STORYWORLD_PERF_R97__?.low?.());}catch(_){return false;}};
// ---- 회오리 한 장 ----
function layer(kind,age){if(!IDX||typeof ctx==='undefined'||!ctx||typeof project!=='function')return false;const L=IDX.layers[kind],im=L&&image(BASE+L.file);if(!im)return false;
 const n=IDX.frames,[cw,ch]=IDX.cell,[ox,oy]=IDX.origin,fr=Math.floor(age/(IDX.loop_s||.5)*n)%n,h=typeof actorHeight==='function'?actorHeight():60;
 const grow=Math.min(1,age/GROW),fade=Math.min(1,(DUR-age)/FADE),s=h*HEIGHT/(IDX.height_px||250)*(.55+.45*grow),q=project(cast.x,cast.y);/* Codex P2: 피해가 나는 시전 원점(c.origin)에 고정 — 영웅 회전만 영웅을 따름 */
 const run=()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=Math.max(0,Math.min(1,grow*1.4))*Math.max(0,fade);
  ctx.drawImage(im,fr*cw,0,cw,ch,q.x-ox*s,q.y-oy*s,cw*s,ch*s);}finally{ctx.restore();}};
 run();stats[kind]++;stats.drawn++;stats.lastFrame=fr;return true;}
// ---- 몸 회전 ----
const BODY=/r351\/slayer\/|hero_direction|hero-authored|assets\/heroes\/|r121\/|r119\/heroes\/|r143\//;
function body(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;
  const s=String(c.sourcePath||c.image?.src||'');if(!(c.r351||BODY.test(s))||/r366|fx|effect/.test(s))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}return best;}
function spin(rec,st,age){const c=body(rec,st);if(!c)return false;const q=project(player.x,player.y),ang=age*SPIN*TAU,cs=Math.cos(ang),k=(cs<0?-1:1);/* R425: 종이처럼 가로 폭을 줄이지 않고 좌·우 반전으로만 돈다(사용자 2026-11-08) */
 // R351 공격 그림이면 반 바퀴마다 공격 칸 1→4(0부터 0~3)을 돈다(칼을 휘두르며 회전)
 const A=window.__STORYWORLD_SLAYER_R351__?.index?.()?.anims?.attack?.w;
 if(A&&String(c.sourcePath||'').includes(A.file)&&Array.isArray(c.sourceRect)){const cw=A.cell[0],chh=A.cell[1],fr=Math.min(A.n-1,Math.floor(((ang/Math.PI)%1)*4)),col=fr%A.cols,row=Math.floor(fr/A.cols);
  c.sourceRect=[col*cw,row*chh,cw,chh];stats.frames++;c.r366Frame=fr;}
 c.points=c.points.map(([x,y])=>[q.x+(x-q.x)*k,y]);c.r366Spin=+k.toFixed(3);stats.spun++;return true;}
// ---- 시전 감지 ----
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
 try{const o=opt||{};if(on&&type==='storySourceSkill'&&o.storyWER&&o.sourceHero===HERO&&o.sourceSlot===SLOT&&isHero()&&o.stage!=='hit'&&o.castId!=null&&!o.r139SamongUlt&&Number.isFinite(x)&&Number.isFinite(y))start(o.castId,x,y);/* Codex P2: 사몽 각성 적중(r139, castId 없음)은 받지 않음 */}catch(e){fail(e);}return r;};}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){let age=null;try{age=active();}catch(e){fail(e);}
 if(age==null)return base.apply(this,a);
 const rec=typeof ctx==='object'?ctx:null,lo=lowFx();
 try{if(!lo)layer('back',age);}catch(e){fail(e);}
 const st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(st>=0)spin(rec,st,age);}catch(e){fail(e);}
 try{layer('front',age);}catch(e){fail(e);}return r;};}
loadIndex();
window.__STORYWORLD_SLAYER_R_TORNADO_R366__=Object.freeze({revision:REV,owns,active:()=>active(),start,index:()=>IDX,
 inspect:()=>({revision:REV,on,ready:!!IDX,cast:cast&&{t0:cast.t0,castId:cast.castId},stats:{...stats},lastError}),
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}if(!on)cast=null;return on;}});
})();
