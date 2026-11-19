// R1192 흐린 보스 이펙트 더 잘 보이게 — 사용자 2026-11-19 "몇몇 흐린 이펙트 특히 보스들 이펙트 메테오류 더 잘보이게".
//  헤드리스 측정(발록 dist06, R241 운석 6개): 운석 그림 54조각의 평균 알파 .35, 가장 밝은 덧셈 조각도 떨어지는 순간 .42.
//   원인 ① R106 '큰 덧셈 조각 옅게'(R181 tame — 영웅 스킬이 겹쳐 하얗게 타는 것 막기)가 보스 운석에도 걸려 불덩이·빛이 .35배까지 옅어졌다
//         (운석 6개의 빛 넓이 합이 영웅 넓이 3배를 넘으면 나머지가 모두 옅어짐).
//   원인 ② 예고 그림자(먹빛)·불빛(덧셈)이 수묵화풍 회색 바닥에서 대비가 낮아 묻혔다.
//  바꾼 것(그리기만 — 판정·피해·시간·개수·자리는 그대로):
//   · 보스 이펙트를 그리는 동안(보스·중간보스가 주인인 위험지대, R241 운석·R330 재해·R105 보스 운석·R1040 패턴·R162 사몽 패턴 표지)
//     R106 그림에 overHero(영웅 근처 흐리기·프레임 예산 건너뛰기 빼기)·noTame(R181 옅게 빼기 빼기)을 넣는다.
//   · 그 동안 기록된 렌더러 명령의 알파를 곡선 a' = 1-(1-a)^1.7 로 올린다(옅은 것만 크게 오르고 이미 진한 것은 그대로, 1을 넘지 않음).
//     덮어 그리기(source-over) 조각은 .8 을 넘겨 올리지 않는다(R1040 안전지대 바깥 암흑 안개가 맵을 다시 덮지 않게).
//     그림 명령에는 saturate(1.3) contrast(1.12) 를 덧붙인다(Three 기록기가 아는 필터만 — 그림자·흐림 필터는 쓰지 않음).
//   · R241 운석 밑에 대비 바탕을 한 겹 깐다: 떨어질 자리에 먹빛 웅덩이 + 그 보스 색 물감 얼룩(덮어 그리기), 떨어지는 불덩이 뒤에 어두운 후광과
//     보스 색 불꽃(덮어 그리기) — 회색 바닥 위에서 덧셈 불빛이 분홍으로 날아가지 않고 색과 윤곽이 남는다. 도형(원·고리·룬)은 쓰지 않는다(R241 규칙).
//   · 주황 예고 도형(#712 삭제)은 되살리지 않는다. 수묵화풍(R1055)·수묵 이펙트 색(R1095)은 그대로.
//   · Three 기록기가 아닌 2D 캔버스(예비 경로)에서는 같은 곡선을 globalAlpha 설정에 건다.
//   · 기억 지역 몹 타격(R1177f Dots CX-0160MF 먹 번짐, pixelfx 'mob-memory')은 중간 회색 먹이라 어두운 바닥에서 옅다 → 그 그림 명령만 brightness(1.4) contrast(1.3) + 같은 알파 곡선.
// 끄기: localStorage['storyworld.r1192.bossFxVis']='{"on":false}'
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_BOSS_FX_VIS_R1192__)return;
const REV='R1192-boss-fx-vis-1',KEY='storyworld.r1192.bossFxVis',K=1.7,OVER_CAP=.8,FILTER='saturate(1.3) contrast(1.12)';
let on=true;try{const s=JSON.parse(window.localStorage?.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={effects:0,hazards:0,commands:0,sprites:0,under:0,legacy:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp01=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):(v===Infinity?1:0);
const curve=a=>{const x=clamp01(a);return x>=1?1:1-Math.pow(1-x,K);};
const inverse=a=>{const y=clamp01(a);return y>=1?1:1-Math.pow(1-y,1/K);};
const EFFECTS=new Set(['r241-fx','r105-meteor','r330-fx','r1040-fx','r162-samong']);
const major=e=>!!e&&!e.r61Summoned&&!!(e.boss||e.midboss||e.persona||e.cosmic||e.trial);
function enemyById(id){const r=typeof room!=='undefined'?room:null;const list=r&&Array.isArray(r.enemies)?r.enemies:[];for(const e of list)if(e&&e.id===id)return e;return null;}
function isBossHazard(h){if(!h||typeof h!=='object')return false;if(h.r241Meteor||h.r330||h.samongPattern||h.type==='story-pattern')return true;
 if(h.owner==null||h.owner==='player')return false;return major(enemyById(h.owner));}
const isBossEffect=e=>!!e&&typeof e==='object'&&EFFECTS.has(e.type);
// 기록된 명령 알파·필터 올리기(한 번만)
function boostCommands(list,from){if(!Array.isArray(list))return 0;let n=0;for(let i=Math.max(0,from|0);i<list.length;i++){const c=list[i];if(!c||c.r1192||c.kind==='text'||!c.style)continue;
 const s=c.style,a0=Number.isFinite(+s.globalAlpha)?+s.globalAlpha:0;let a=curve(a0);if((s.globalCompositeOperation||'source-over')!=='lighter')a=Math.max(Math.min(a,OVER_CAP),clamp01(a0));s.globalAlpha=a;
 if(c.kind==='image'){const f=String(s.filter||'none').trim();s.filter=(f&&f!=='none')?f+' '+FILTER:FILTER;}
 c.r1192=true;n++;}stats.commands+=n;return n;}
// 기억 지역 먹 번짐 타격(R1177f) — pixelfx 가 'r163:mob-memory:<시각>' 으로 그린 그림 명령만
const INK_ID=/^r163:mob-memory:/,INK_FILTER='brightness(1.4) contrast(1.3)';
function inkCommands(list,from){if(!Array.isArray(list))return 0;let n=0;for(let i=Math.max(0,from|0);i<list.length;i++){const c=list[i];if(!c||c.r1192ink||c.kind!=='image'||!c.style||!INK_ID.test(String(c.owner?.id||'')))continue;
 const s=c.style,f=String(s.filter||'none').trim();s.filter=(f&&f!=='none')?f+' '+INK_FILTER:INK_FILTER;s.globalAlpha=curve(Number.isFinite(+s.globalAlpha)?+s.globalAlpha:0);c.r1192ink=true;n++;}stats.ink=(stats.ink||0)+n;return n;}
// 2D 캔버스 예비 경로: globalAlpha 설정에 곡선을 건다(읽기는 역곡선 — save/restore·*= 가 섞여도 값이 일관)
function legacyEnter(c){try{if(!c||Object.prototype.hasOwnProperty.call(c,'globalAlpha'))return null;let P=Object.getPrototypeOf(c),d=null;while(P&&!d){d=Object.getOwnPropertyDescriptor(P,'globalAlpha');P=Object.getPrototypeOf(P);}
 if(!d||!d.set||!d.get)return null;Object.defineProperty(c,'globalAlpha',{configurable:true,get(){return inverse(d.get.call(c));},set(v){d.set.call(c,curve(v));}});stats.legacy++;return()=>{try{delete c.globalAlpha;}catch(_){}};}catch(e){fail(e);return null;}}
let depth=0;
function within(fn){const c=typeof ctx!=='undefined'?ctx:null;const rec=!!c&&Array.isArray(c.commands)&&typeof c.scope==='function';const from=rec?c.commands.length:0;const undo=(!rec&&depth===0)?legacyEnter(c):null;
 depth++;try{return fn();}finally{depth--;if(rec){try{boostCommands(c.commands,from);}catch(e){fail(e);}}if(undo)undo();}}
// R106 그림: 보스 이펙트 동안 영웅 근처 흐리기·예산 건너뛰기·R181 옅게 빼기를 끈다
let SP0=null;
function wrapSprites(){const S=window.__STORYWORLD_FX_SPRITES_R106__;if(!S||S.r1192||S===SP0)return;const d=S.draw;if(typeof d!=='function')return;
 const W={...S,r1192:true,draw(n,F,x,y,w,h,o){if(on&&depth>0){stats.sprites++;return d.call(this,n,F,x,y,w,h,{...(o||{}),overHero:true,noTame:true});}return d.call(this,n,F,x,y,w,h,o);}};
 SP0=Object.freeze(W);try{window.__STORYWORLD_FX_SPRITES_R106__=SP0;}catch(e){fail(e);}}
// R241 운석 밑 대비 바탕(덮어 그리기, 도형 없음)
const dark=(c,k)=>c.map(v=>Math.max(0,Math.min(255,Math.round(v*k))));
function meteorUnder(h){const S=window.__STORYWORLD_FX_SPRITES_R106__,PJ=typeof project==='function'?project:null;if(!S||!PJ||!h.r241Meteor)return;const m=h.r241Meteor,P=m.pal?.main;if(!P||!Array.isArray(P.a)||!Array.isArray(P.b))return;
 const q=PJ(h.x,h.y);if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.y))return;const ah=typeof actorHeight==='function'?actorHeight:null,H0=typeof ah==='function'?ah():60,H=(Number.isFinite(H0)&&H0>0?H0:60)*Math.max(.5,Math.min(4,(Number(h.radius)||1.25)/1.25));
 const age=Number(h.age)||0,warn=Math.max(.01,Number(h.warning)||1),INK={a:[10,5,7],b:dark(P.a,.3)},PAINT={a:P.a,b:P.b},seed=Number(m.seed)||0,t=typeof time==='number'?time:0;
 const sc=typeof ctx!=='undefined'?ctx:null,draw=()=>{if(age<warn){const u=Math.max(0,Math.min(1,age/warn)),v=u*u;
   S.draw('smoke',INK,q.x,q.y,H*(1.0+.9*u),H*(.5+.42*u),{alpha:.28+.4*u,blend:'source-over',angle:seed});
   S.draw('glow',PAINT,q.x,q.y-H*.04,H*(.55+.55*u),H*(.27+.28*u),{alpha:.25+.45*u,blend:'source-over'});
   if(u>.08){const sx=q.x+H*3.2,sy=q.y-H*7.5,mx=sx+(q.x-sx)*v,my=sy+(q.y-sy)*v,ang=Math.atan2(q.y-sy,q.x-sx);
    S.draw('glow',INK,mx,my,H*1.5,H*1.5,{alpha:.55,blend:'source-over'});
    S.draw('flame',PAINT,mx,my,H*.9,H*2.0,{frame:Math.floor(t*12)+(m.k|0)+1,angle:ang+Math.PI/2,alpha:.7,blend:'source-over',pivot:[.5,.2]});}}
  else{const v=Math.max(0,Math.min(1,(age-warn)/.45)),u=1-v;if(u<=.01)return;
   S.draw('smoke',INK,q.x,q.y-H*.3,H*(2.0+.6*v),H*(1.5+.4*v),{alpha:.5*u,blend:'source-over',angle:seed});
   S.draw('glow',PAINT,q.x,q.y-H*.2,H*1.3,H*.9,{alpha:.45*u,blend:'source-over'});}
  stats.under++;};
 if(sc&&typeof sc.scope==='function')sc.scope({id:'r1192:'+h.id,kind:'effect',x:h.x,y:h.y},draw);else draw();}
// 가장 바깥에서 감싸야 R241·R105·R330·R1040·R162 가 자기 표지를 처리하고 돌아가기 전에 잡는다 → 누가 뒤에 감싸면 다시 바깥을 감싼다(15초 동안)
let myDE=null,myDH=null,effW=false,hazW=false;
function install(){wrapSprites();
 if(typeof drawEffect==='function'&&drawEffect!==myDE){const base=drawEffect;myDE=function(e,...a){if(on&&e&&e.type==='r163-pixelfx'){const c=typeof ctx!=='undefined'?ctx:null,rec=!!c&&Array.isArray(c.commands);const from=rec?c.commands.length:0;try{return base.apply(this,[e,...a]);}finally{if(rec){try{inkCommands(c.commands,from);}catch(err){fail(err);}}}}
  if(!on||!isBossEffect(e))return base.apply(this,[e,...a]);const top=depth===0;if(top)stats.effects++;wrapSprites();
   return within(()=>{if(top&&e.type==='r241-fx'){try{const hz=typeof hazards!=='undefined'?hazards:null;if(Array.isArray(hz))for(const h of hz)if(h&&h.r241Meteor)meteorUnder(h);}catch(err){fail(err);}}return base.apply(this,[e,...a]);});};
  drawEffect=myDE;effW=true;}
 if(typeof drawHazard==='function'&&drawHazard!==myDH){const base=drawHazard;myDH=function(h,...a){let b=false;try{b=on&&isBossHazard(h);}catch(err){fail(err);}if(!b)return base.apply(this,[h,...a]);if(depth===0)stats.hazards++;wrapSprites();return within(()=>base.apply(this,[h,...a]));};
  drawHazard=myDH;hazW=true;}}
let tries=0;(function arm(){try{install();}catch(e){fail(e);}if(++tries<60&&typeof setTimeout==='function')setTimeout(arm,250);})();
window.__STORYWORLD_BOSS_FX_VIS_R1192__=Object.freeze({revision:REV,curve,inverse,isBossHazard,isBossEffect,boostCommands,inkCommands,
 inspect:()=>({revision:REV,on,installed:{effect:effW,hazard:hazW,sprites:!!SP0},stats:{...stats},lastError}),
 set:v=>{on=v!==false;try{window.localStorage?.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
