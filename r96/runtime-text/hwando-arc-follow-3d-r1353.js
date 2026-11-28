// R1353 환도 기본 공격 하얀 반월(R292 기본 베기 띠, R302 은빛 재채색)을 3D 환도가 실제로 휘두르는 각도·궤적에 맞춘다.
//  · 사용자 11-27 01:28Z "환도 기본공격시 나오는 하얀반월이펙트 환도 휘두르는각도와궤적에 맞게 적용".
//  · 실측(헤드리스): R292 는 기본 공격 순간 겨눈 쪽(화면각)으로 띠를 한 번 돌려 영웅 몸 높이에 그린다 → R1347 검술 여덟 동작
//    (내려베기·올려베기·찌르기·횡베기·정수리 내려치기·역횡베기·낮게 찌르기·감아베기)이 다 달라도 반월은 늘 같은 모양·같은 방향이었다
//    (예: 적이 오른쪽인데 반월이 발밑 아래로, 내려베기인데 반월이 옆으로 누움).
//  · 고침: 3D 환도가 보이고 R1347 검술이 켜져 있을 때만 — (EGO 는 R1265 가 흰 환도 베기를 일부러 지우므로(사용자 11-20) 손대지 않는다)
//    ① 3D 장면을 그리는 순간마다 실제 칼끝(BladeTip) 화면 자리를 공격(동작)마다 기록한다(휘두름 시작 windup ~ 타격 strike+.18).
//       R1347 표 예측만 쓰면 R1320 손목·시야 보정·R1347b 벌리기 뒤 실제 칼과 최대 167° 어긋났다(1차 구현 헤드리스 실측) → 실제 칼을 따른다.
//    ② 칼이 타격 순간을 지나면, 지나온 칼끝 길의 시작 A·끝 B·줄에서 가장 먼 점 P 에 띠 그림의 칼자국(칸 좌표: 시작 S, 끝 E, 가운데 M — basic.webp 실측)을 맞춘다:
//       회전 = 길 방향, 크기 = 길 길이(원래 크기의 .6~1.8배), 휘는 쪽이 다르면 줄을 축으로 뒤집는다. 길이 화면에서 짧으면(<18px) 칼끝이 나아가는 쪽·원래 크기.
//    ③ 그 순간부터 .22초 동안 여덟 칸을 재생한다(칼보다 먼저 반월이 나오지 않고, 지나간 칼을 따라 잔상처럼).
//    ④ 같은 때 원래 R292 기본 베기 띠(적 쪽 고정 방향)는 그리지 않는다(반월 둘 겹침 방지). 띠 그림·색(R302 은빛·R1095 수묵)은 같은 것.
//  · 판정·피해·범위·쿨다운·색(R302·R1095)·다른 영웅·2D 영웅·3D 끔·검술 끔은 그대로. 띠 그림·R292·R349·R1347 파일은 고치지 않는다.
//  · 끄기: localStorage storyworld.r1353.arcFollow=off (원래 R292 방향으로 돌아감). API window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__)return;
const REV='R1360-hwando-arc-follow-4',KEY='storyworld.r1353.arcFollow',CELL=384,ATK_SEC=.5,STRIP='assets/r292/fx/hwando/basic.webp',HEROES=['hwando'];
// basic.webp 칼자국(밝기 가중 능선) 실측: 시작 (57,194) → 끝 (364,143), 가운데 (211,208) — 시작에서 끝으로 자라며, 가운데가 줄 아래(+v)로 휜다.
const STROKE=Object.freeze({S:[57,194],E:[364,143],M:[211,208]});
const TAIL=.18,MIN_PX=18,K_MIN=.6,K_MAX=1.8;
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}
const stats={revision:REV,wrapped:0,seen:0,drawn:0,fallback:0,mirrored:0,skippedEarly:0,errors:0,last:null};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);

// ── 순수 계산(검사용으로 내놓음) ──
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],len2=a=>Math.hypot(a[0],a[1]),cross=(a,b)=>a[0]*b[1]-a[1]*b[0],ang=a=>Math.atan2(a[1],a[0]);
// 칸 좌표(u,v) → 화면 을 잇는 닮음 변환. A·B·P = 칼끝 길 시작·끝·가운데(화면), base = 원래 크기(칸 1px 당 화면 px), dir0 = 길이 짧을 때 쓸 방향(라디안).
// 돌려줌: {A, rot, k, mirror, phi, S} — 그리기는 translate(A)·rotate(rot)·scale(k, mirror?-k:k)·rotate(-phi)·translate(-S).
function fit(A,B,P,base,dir0,stroke=STROKE){
 const S=stroke.S,E=stroke.E,M=stroke.M,se=sub(E,S),phi=ang(se),L0=len2(se),ab=sub(B,A),L=len2(ab);
 // 짧은 길(찌르기가 카메라 쪽 등): 나아가는 방향·원래 크기로, 칼자국 가운데를 칼끝 길 가운데에 둔다(시작점에 두면 반월이 칼끝에서 반 길이만큼 비켜 났다 — EGO 올려베기 42px 헤드리스 실측).
 if(!(L>=MIN_PX)||!fin(L)){const rot=fin(dir0)?dir0:0,mid=fin(B[0])&&fin(B[1])?[(A[0]+B[0])/2,(A[1]+B[1])/2]:A.slice(),h=base*(fin(L0)?L0:0)/2;
  const A0=[mid[0]-h*Math.cos(rot),mid[1]-h*Math.sin(rot)];return {A:fin(A0[0])&&fin(A0[1])?A0:A.slice(),rot,k:base,mirror:false,phi,S:S.slice(),short:true};}
 const k=Math.max(base*K_MIN,Math.min(base*K_MAX,L/L0)),side0=Math.sign(cross(se,sub(M,S)))||1,side=Math.sign(cross(ab,sub(P,A)))||side0;
 return {A:A.slice(),rot:ang(ab),k,mirror:side!==side0,phi,S:S.slice(),short:false};}
// 위 변환으로 칸 점을 화면으로(검사·측정용).
function apply(f,u,v){let x=u-f.S[0],y=v-f.S[1];const c0=Math.cos(-f.phi),s0=Math.sin(-f.phi);[x,y]=[x*c0-y*s0,x*s0+y*c0];x*=f.k;y*=f.mirror?-f.k:f.k;
 const c=Math.cos(f.rot),s=Math.sin(f.rot);return [f.A[0]+x*c-y*s,f.A[1]+x*s+y*c];}
// 띠 나이 → 칸 번호. 칼이 휘둘러지기 시작할 때(lead 초)부터 남은 시간에 여덟 칸을 나눈다. 그 전이면 -1(안 그림).
function frameAt(age,dur,frames,lead){if(!(age>=lead))return -1;const span=Math.max(1e-3,dur-lead);return Math.max(0,Math.min(frames-1,Math.floor((age-lead)/span*frames)));}

// ── 3D 칼끝 기록(실제로 그린 칼) ──
//  예측(R1347 표)만으로는 R1320 손목·시야 보정·R1347b 벌리기·땅 들기 뒤의 실제 칼과 최대 160° 넘게 어긋났다(헤드리스 실측) →
//  3D 장면을 그리는 순간(scene.onAfterRender, R1347 이 뼈를 되돌리기 전) 칼끝 화면 자리를 공격마다 기록해 그 길에 반월을 얹는다.
let T=null,hookedScene=null;
const host=()=>window.__STORYWORLD_PHASE1__?.controller?.state?.three||null;
const comboApi=()=>window.__STORYWORLD_SWORD_COMBO_R1347__||null;
function shownHero(){const R=window.__STORYWORLD_HWANDO3D_R1302__;if(!R?.inspect)return null;let i;try{i=R.inspect();}catch(_){return null;}return i&&i.shown&&HEROES.includes(i.hero)?i.hero:null;}
const parts=new Map();
function rig(r,id){const g=r.scene.getObjectByName('r1305-'+id+'-3d-shared');if(!g||!g.visible)return null;
 let p=parts.get(id);if(!p||p.g!==g){const m=g.getObjectByName('r1305-'+id+'-3d-model'),w=g.getObjectByName('r1313-'+id+'-weapon');let tip=null;w?.traverse(o=>{if(!tip&&/^BladeTip/.test(o.name||''))tip=o;});
  if(!m||!tip)return null;p={g,m,tip};parts.set(id,p);}return p;}
// R1360: R1347 이 '절도 있는 베기'(움츠림 → 짧고 빠른 베기 CUT → 멈춤 HOLD → 거두기)로 시간을 접으면, 칼끝이 실제로 베는 구간은 strike-CUT ~ strike 이고
//   strike 뒤 HOLD 동안 멈췄다가 되돌아간다 → 기록 구간을 그 베기 구간(+멈춤)으로 맞춘다(되돌아가는 길이 섞이면 반월이 휜다). 접기가 꺼져 있으면 예전 windup ~ strike+TAIL.
function win(P,mv){const sn=P&&typeof P.warp==='function'&&Number.isFinite(P.CUT)&&Math.abs(P.warp(mv,mv.strike)-mv.strike)>1e-6;
 return sn?[Math.max(mv.windup,mv.strike-P.CUT),Math.min(1,mv.strike+(Number.isFinite(P.HOLD)?P.HOLD:0))]:[mv.windup,Math.min(1,mv.strike+TAIL)];}
const swings=[];// {id, idx, move, windup, strike, t0, pts:[{t, rel:[x,y]}], lastT, shownAt}
const MAX_SWINGS=4,SHOW=.22;
function record(){if(!on)return;const r=host(),id=shownHero(),api=comboApi();if(!r?.scene||!r.camera||!id||!api?.on?.())return;T=r.T||T;if(!T)return;
 const last=api.inspect?.().last?.[id];if(!last||!(last.w>0)||!last.move||!fin(last.t))return;const q=rig(r,id);if(!q)return;
 const el=r.renderer?.domElement,cw=el?.clientWidth||el?.width,ch=el?.clientHeight||el?.height;if(!(cw>0&&ch>0))return;
 const P2=v=>{const p=v.project(r.camera);return [(p.x+1)/2*cw,(1-p.y)/2*ch];},f0=P2(q.m.getWorldPosition(new T.Vector3())),tp=P2(q.tip.getWorldPosition(new T.Vector3()));
 if(![...f0,...tp].every(fin))return;const now=typeof time==='number'?time:0;
 let s=swings[swings.length-1];
 if(!s||s.id!==id||s.idx!==last.idx||last.t<s.lastT-.05||now-s.t0>ATK_SEC*1.2){const mv=api.pure?.MOVES?.[last.idx];if(!mv)return;
  const W=win(api.pure,mv);s={id,idx:last.idx,move:mv.id,windup:mv.windup,strike:mv.strike,lo:W[0],hi:W[1],t0:now-last.t*ATK_SEC,pts:[],lastT:last.t,shownAt:null};swings.push(s);if(swings.length>MAX_SWINGS)swings.shift();stats.swings=(stats.swings|0)+1;}
 s.lastT=last.t;if(last.t>=s.lo-.02&&last.t<=s.hi+.02)s.pts.push({t:last.t,rel:[tp[0]-f0[0],tp[1]-f0[1]]});}
function hookScene(){const r=host();if(!r?.scene||r.scene===hookedScene)return;const c=comboApi()?.inspect?.();if(!c||!(c.hooks>0))return;// R1347 이 먼저 감싼 뒤 그 바깥에(되돌리기 전에 잰다)
 const sc=r.scene,prev=sc.onAfterRender;sc.onAfterRender=function(...a){try{record();}catch(e){fail(e);}return prev?.apply(this,a);};hookedScene=sc;stats.hooks=(stats.hooks|0)+1;}

// ── 반월 그리기: 칼이 타격 순간(strike)을 지나면, 지나온 칼끝 길(휘두름 시작~지금)에 띠를 맞춰 SHOW 초 동안 여덟 칸을 재생 ──
// 칸 전체(384²)가 아니라 칼자국이 실제로 있는 곳만 잘라 그린다(여덟 칸 알파>12 합집합 50~369 × 136~229 + 여백).
//  R350 영웅 가림은 그림 사각형으로 영웅과 겹친 정도를 재서 옅게 하는데, 칼 궤적을 따라 돌린 384² 칸은 거의 늘 영웅을 다 덮어 알파가 .15 로 떨어졌다(원래 띠 .42).
const CROP=Object.freeze([46,130,328,104]);
// 그래도 칼 궤적은 영웅 몸을 감아 돌므로 R350 은 거의 늘 .15 까지 깎았다(헤드리스 실측) → R1034 검흔처럼 R350 가림에서 빼고(owner.r350),
//  원래 띠가 옆으로 칠 때 보이던 세기(R350 이 깎은 뒤 .42)와 R1095 수묵 필터를 직접 준다. 가는 반월·screen 합성이라 영웅 몸은 가리지 않는다.
const ALPHA=.45,FILTER='saturate(.06) brightness(1.04)';
const SENT={type:'r1353-arc',x:0,y:0,age:0,life:Infinity,r1353Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function pathOf(s){const pts=s.pts.filter(p=>p.t>=s.lo-.02&&p.t<=s.hi+.02);return pts.length>=3?pts.map(p=>p.rel):null;}
function drawOne(s,now){const row=window.__STORYWORLD_SKILL_FX_R292__?.row?.('hwando','basic');if(!row)return;
 if(s.shownAt==null){if(!(s.lastT>=s.strike))return;s.shownAt=now;}
 const fr=frameAt(now-s.shownAt,SHOW,row.frames||8,0);if(fr<0||now-s.shownAt>SHOW)return;
 const rel=pathOf(s);if(!rel)return;const im=typeof readyImage==='function'?readyImage(STRIP)?.image:null;if(!im)return;
 const b=typeof project==='function'&&typeof player==='object'&&player?project(player.x,player.y):null;if(!b)return;
 const path=rel.map(p=>[b.x+p[0],b.y+p[1]]),A=path[0],B=path[path.length-1];let P=path[path.length>>1],best=-1;
 // 휜 쪽 = 줄 양쪽 넓이 합이 큰 쪽(감아베기처럼 처음에 작은 고리가 반대로 튀어도 본 획의 휨을 따른다 — #1049 뒤 헤드리스 실측), 그쪽에서 줄과 가장 먼 점.
 let area=0;for(const q of path)area+=cross(sub(B,A),sub(q,A));const sg=area<0?-1:1;
 for(const q of path){const dd=sg*cross(sub(B,A),sub(q,A));if(dd>best){best=dd;P=q;}}
 const unit=(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1),base=row.scale*unit/CELL,d0=sub(path[Math.min(path.length-1,2)],A),f=fit(A,B,P,base,len2(d0)>.5?ang(d0):0);
 const run=()=>{ctx.save();try{ctx.globalCompositeOperation=row.blend||'screen';ctx.globalAlpha=(Number.isFinite(ctx.globalAlpha)?ctx.globalAlpha:1)*ALPHA;ctx.filter=FILTER;ctx.translate(f.A[0],f.A[1]);ctx.rotate(f.rot);ctx.scale(f.k,f.mirror?-f.k:f.k);ctx.rotate(-f.phi);ctx.translate(-f.S[0],-f.S[1]);
  const [cx,cy,cw,ch]=CROP;ctx.drawImage(im,fr*CELL+cx,cy,cw,ch,cx,cy,cw,ch);}finally{ctx.restore();}};
 const meta={id:'r1353:arc:'+s.t0.toFixed(4),kind:'effect',x:typeof player==='object'?player.x:0,y:typeof player==='object'?player.y:0,r1353:true,r350:true,sourcePath:STRIP};
 if(typeof ctx.scope==='function')ctx.scope(meta,run);else run();
 stats.drawn++;if(f.short)stats.fallback++;if(f.mirror)stats.mirrored++;
 stats.last={id:s.id,move:s.move,idx:s.idx,frame:fr,t0:+s.t0.toFixed(3),points:path.length,rot:+(f.rot*180/Math.PI).toFixed(1),k:+(f.k/base).toFixed(2),mirror:f.mirror,short:f.short,A:A.map(x=>+x.toFixed(1)),B:B.map(x=>+x.toFixed(1))};}
function drawAll(){if(typeof ctx==='undefined'||!ctx)return;const now=typeof time==='number'?time:0;for(const s of swings)try{drawOne(s,now);}catch(e){fail(e);}}
// 3D 환도 + R1347 검술이 켜져 있으면 원래 R292 기본 베기 띠(적 쪽 고정 방향)는 그리지 않는다 — 반월이 둘로 겹치지 않게.
function replacing(){return on&&!!shownHero()&&!!comboApi()?.on?.()&&!!window.__STORYWORLD_SKILL_FX_R292__?.row?.('hwando','basic');}
const RE=/^r292:hwando:basic:/;
function carryR1381(w,base){try{for(const k of Object.keys(base))if(/^__r\d/.test(k)&&!(k in w))w[k]=base[k];}catch(_){}return w;}
function wrapScope(){try{if(typeof ctx==='undefined'||!ctx||typeof ctx.scope!=='function'||ctx.scope.__r1353)return;const base=ctx.scope;
 const w=function(meta,run,...rest){if(meta&&typeof meta.id==='string'&&RE.test(meta.id)&&replacing()){stats.hidden=(stats.hidden|0)+1;return;}return base.call(this,meta,run,...rest);};
 w.__r1353=true;/* R1381: 바깥 표식 이어받기 — visual-r93 등과 서로 다시 감싸는 핑퐁 막기 */carryR1381(w,base);ctx.scope=w;stats.wrapped++;}catch(e){fail(e);}}
// 2D 그리기는 프레임마다 ctx 를 명령 기록기(DrawCommands)로 잠깐 바꿔 끼운 동안 돈다(index captureVisual) → 평소 ctx 에는 scope 가 없다.
//  그래서 기록 중에 불리는 drawEffect 안에서 그때의 ctx(기록기 인스턴스)를 감싸고, 이 오버레이의 표지 효과면 반월을 그린다.
if(typeof drawEffect==='function'){const baseDE=drawEffect;drawEffect=function(e,...a){if(on)wrapScope();if(e&&e.type==='r1353-arc'){if(on)drawAll();return;}return baseDE.apply(this,[e,...a]);};}
if(typeof tick==='function'){const baseT=tick;tick=function(...a){const r=baseT.apply(this,a);try{hookScene();const now=typeof time==='number'?time:0;
  for(let i=swings.length-1;i>=0;i--){const s=swings[i];if(now-s.t0>2||now<s.t0-1)swings.splice(i,1);}
  if(on&&swings.some(s=>s.shownAt==null||now-s.shownAt<=SHOW))arm();else disarm();}catch(e){fail(e);}return r;};}
setInterval(()=>{try{hookScene();wrapScope();}catch(e){fail(e);}},400);
window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__=Object.freeze({revision:REV,on:()=>on,
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},
 pure:Object.freeze({STROKE,fit,apply,frameAt,win,TAIL,MIN_PX,K_MIN,K_MAX,SHOW,CROP,ALPHA}),
 inspect:()=>({...stats,on,lastError,replacing:replacing(),swings:swings.map(s=>({move:s.move,t0:+s.t0.toFixed(3),pts:s.pts.length,lastT:+s.lastT.toFixed(2),shown:s.shownAt!=null}))})});
})();
