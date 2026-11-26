// R1336 3D 몹이 죽을 때 2D 그림이 나오던 것(사용자 2026-11-26 10:16 실플레이 영상 "3d몹죽을때 2d이미지나오는거").
//  원인(헤드리스 실측): 엔진은 hp 0 인 순간 적을 room.enemies 에서 빼고 죽음 효과(drawBurnDeath3)만 남긴다. R462(15세 R1054 '어둠·재로 소멸')는
//   그 효과에서 '살아 있을 때 마지막으로 그린 그 몹의 2D 그림'을 주인 'scene' 으로 검게 그려 연기·재로 흩는다. 3D 몹 오버레이(R1312~R1322c)는
//   주인이 'enemy:<id>' 인 몸 명령만 3D 로 바꾸므로, 죽는 순간 3D 는 사라지고 2D 그림이 1초 남짓 남았다.
//  고침(그리기만 — 판정·보상·처치 수·저장·AI 그대로): 죽기 직전까지 3D 로 보이던 몹의 죽음 효과를 그릴 때, 그 효과가 그린 2D 몸 그림
//   (R462 look 경로)을 주인 'enemy:<id>'·alive:false 로 다시 달아 둔다 → 3D 오버레이가 그 몸을 빼고 3D 몸에 죽음 동작(Death)을 끝까지 튼다
//   (각 오버레이의 DEATH_HOLD 1.7초 뒤 숨김). Dots 죽음 시트(R1065c) 몸 그림도 같은 주인으로 다시 단다. 연기·재·불씨(15세)는 그대로.
//   3D 가 아닌 몹(2D 지역·3D 끔·상한 밖)은 손대지 않는다.
//  끄기: localStorage 'storyworld.r1336.mob3dDeath' = 'off'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_MOB3D_DEATH_R1336__)return;
const REV='R1336-mob3d-death-1',KEY='storyworld.r1336.mob3dDeath';
let on=true;try{const v=localStorage.getItem(KEY);if(v==='off'||v==='0'||v==='false')on=false;}catch(_){}
const stats={deaths:0,retagged:0,dotsRetagged:0,skipped2d:0,errors:0,wraps:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const key=s=>{const t=String(s||'');const m=t.match(/^.*?\.(?:webp|png|jpe?g|avif|gif)(?=$|[:?#])/i);return (m?m[0]:t).replace(/^https?:\/\/[^/]+\//,'').replace(/^.*?(assets\/)/,'$1');};
// 지금(또는 바로 앞 프레임) 3D 로 보이던 몹인가 — 모든 3D 몹 오버레이(__STORYWORLD_MOB3D_R*__)의 inspect().instances 를 본다(죽을 때 한 번).
function shown3d(id){const sid=String(id);for(const k of Object.keys(window)){if(!/^__STORYWORLD_MOB3D_R\d+[A-Za-z]?__$/.test(k))continue;
 try{const A=window[k];if(!A||typeof A.inspect!=='function')continue;/* on() 은 저장값만 돌려준다 — R1326 이 7대죄 지역에서 강제로 켠 경우를 놓치므로 실제로 보이는 인스턴스만 본다 */const I=A.inspect();if((I?.instances||[]).some(i=>String(i.id)===sid&&i.visible))return true;}catch(e){fail(e);}}return false;}
function wrap(){if(typeof drawBurnDeath3!=='function')return false;if(drawBurnDeath3.__r1336)return true;if(!drawBurnDeath3.__r462)return false; // R462 가 먼저 감싼 뒤 바깥에 선다
 const base=drawBurnDeath3;const w=function(fx,...a){
  if(!on||!fx||fx.sourceId==null)return base.apply(this,[fx,...a]);
  if(fx.r1336===undefined){fx.r1336=false;try{fx.r1336=shown3d(fx.sourceId);if(fx.r1336)stats.deaths++;else stats.skipped2d++;}catch(e){fail(e);}}
  if(!fx.r1336)return base.apply(this,[fx,...a]);
  const rec=typeof ctx==='object'&&ctx&&Array.isArray(ctx.commands)?ctx.commands:null,start=rec?rec.length:0;
  const r=base.apply(this,[fx,...a]);
  try{const look=fx.r462?.look;if(rec&&look){const lk=key(look.path);let df=null;try{const D=window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__?.deathFrame?.(look,+fx.age||0);df=D?key(D.path):null;}catch(_){}
    for(let i=rec.length-1;i>=start;i--){const c=rec[i];if(c?.kind!=='image')continue;const ck=key(c.sourcePath);
     // Dots 죽음 시트(R1065) 몹은 R462 가 look 경로 대신 시트 칸을 그린다 → 그 칸도 같은 주인으로 다시 달아 3D 가 받아 죽음 동작을 튼다(빼면 받을 명령이 없어 3D 가 바로 사라짐).
     if(ck===lk||(df&&ck===df)){c.owner={...(c.owner||{}),kind:'enemy',id:'enemy:'+fx.sourceId,x:+fx.x,y:+fx.y,alive:false,name:look.name||c.owner?.name,r1336Dying:true};stats.retagged++;if(ck!==lk)stats.dotsRetagged++;}}}}catch(e){fail(e);}
  return r;};
 w.__r462=true;w.__r1336=true;try{drawBurnDeath3=w;stats.wraps++;}catch(e){fail(e);return false;}return true;}
let tries=0;(function arm(){if(wrap())return;if(++tries<160)setTimeout(arm,250);})();
window.__STORYWORLD_MOB3D_DEATH_R1336__=Object.freeze({revision:REV,on:()=>on,set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},inspect:()=>({revision:REV,on,wrapped:typeof drawBurnDeath3==='function'&&!!drawBurnDeath3.__r1336,stats:{...stats},lastError})});
})();
