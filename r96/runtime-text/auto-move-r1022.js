// R1022 자동 순간이동 켜고 끄기 — 사용자 2026-11-14 "모바일에서는 자동대시및 블링크등 자동으로 순간이동하는걸 키고 끌 수있도록 /
//  끄는 경우 그곳에 분신보내 스킬이펙트만 나가게", "모바일에서는 걷기이동+ 플레이어지시할때만 순간이동 나머지는 자동패시브화".
//  전수 조사(헤드리스, 8영웅 × 키 9개, qa/r1022/census*.mjs): 본체를 한 번에 옮기는 곳은
//   · 본편 E 돌진·회피(엔진 dash(), 8영웅 모두, 손으로 누르거나 오토·A키 오토·길잡이가 자동 시전) — moveActor 3.8칸(R663 범위 배수면 더 김)
//   · 엔진 블링크(S·터치 회피 단추 = 손 지시 / 길잡이 guideStep 이 체력 35% 아래에서 자동으로 부름)
//   · 원거리 자동 회피(play-r111 autoDodge, moveActor 1.7칸) · 문양 실검무 궤도(hero-threads-r174, 영웅 자리를 바로 바꿈)
//   · 엔진 실검무(R63/R74) — R706 이 이미 본체를 제자리에 두고 분신을 남긴다(그대로 둠). Q·W·R·T·A·D·F 는 본체를 안 옮김.
//  끔(모바일 기본): 걷기와 손으로 누른 블링크만 본체를 옮긴다. 나머지는 엔진 판정 그대로 끝점까지 옮겨 피해·이펙트를 낸 뒤
//   (피해 자리·양·쿨타임은 켬과 같음) 그리기 전에 본체를 제자리(+그 tick 의 걷기)로 되돌리고, 옮겨졌던 자리에 영웅 분신(R767)을 남긴다.
//   tick 안에서 부른 블링크(길잡이 자동 블링크)는 아무것도 안 한다(쿨타임도 안 씀).
//  켬(PC 기본): 예전과 같다. 지역 이동·쓰러짐·함께하기(호스트가 자리 권한)는 손대지 않는다. 숫자가 아닌 자리는 쓰지 않는다.
//  감싸기는 모든 스크립트가 읽힌 뒤(load)에 해서 R706·R174·R111 보다 바깥에서 돈다.
//  설정: 설정 창 '전투 화면' 구역(R1021 section#combatScreenR1021)에 한 줄, 없으면 #quickSettingsR114 끝.
//  끄기/켜기: localStorage 'storyworld.r1022.autoMove' = '0'/'1' 또는 __STORYWORLD_AUTO_MOVE_R1022__.set(bool).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_AUTO_MOVE_R1022__)return;
const REV='R1022-auto-move-1',KEY='storyworld.r1022.autoMove',LEAP=1,CLONE_MIN=.35;
const stats={ticks:0,restores:0,clones:0,autoBlinksBlocked:0,outsideRestores:0,skipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const g=f=>{try{return f();}catch(_){return undefined;}};
const fin=Number.isFinite;
const P=()=>g(()=>typeof player==='object'?player:null);
const ROOM=()=>g(()=>typeof room!=='undefined'?room:null);
const mobile=()=>g(()=>!!window.__STORYWORLD_MOBILE_R63__?.isMobile?.())===true;
const solo=()=>{const m=g(()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.());return !m||m==='off';};
function stored(){try{const v=localStorage.getItem(KEY);return v==='1'?true:v==='0'?false:null;}catch(_){return null;}}
const on=()=>{const s=stored();return s===null?!mobile():s;};
const off=()=>!on()&&solo();
// 한 tick(또는 tick 밖 한 번의 동작) 동안의 기록.
let depth=0,cur=null,manual=0,outside=null;
const fresh=p=>({start:{x:p.x,y:p.y},room:ROOM(),walk:{x:0,y:0},leap:false,ends:[]});
const r706=()=>g(()=>window.__STORYWORLD_DANCE_FREE_R706__);
const orbiting=()=>!!g(()=>window.__STORYWORLD_THREADS_R174__?.active?.());
function clone(x,y,dir,life,alpha){if(!fin(x)||!fin(y))return;try{if(window.__STORYWORLD_CLONE_R767__?.spawn?.(x,y,{life,alpha,dir}))stats.clones++;}catch(e){fail(e);}}
function blockedAt(x,y){return g(()=>typeof blocked==='function'&&blocked(x,y,.23))===true;}
// 본체를 rec.start + 걷기 자리로 되돌리고, 옮겨졌던 자리에 분신을 남긴다.
function settle(p,rec){
 if(!p||p!==P()||!(p.hp>0)||rec.room!==ROOM()||!off()){stats.skipped++;return false;}
 let tx=rec.start.x+rec.walk.x,ty=rec.start.y+rec.walk.y;
 if(!fin(tx)||!fin(ty)){tx=rec.start.x;ty=rec.start.y;}
 if(!fin(tx)||!fin(ty)){stats.skipped++;return false;}
 if(blockedAt(tx,ty)&&!blockedAt(rec.start.x,rec.start.y)){tx=rec.start.x;ty=rec.start.y;}
 const px=p.x,py=p.y,dir=p.direction||null;
 if(fin(px)&&fin(py)&&Math.sqrt((px-tx)**2+(py-ty)**2)>=CLONE_MIN){
  for(const e of rec.ends)if(e!==rec.ends[rec.ends.length-1]&&Math.sqrt((e.x-tx)**2+(e.y-ty)**2)>=CLONE_MIN)clone(e.x,e.y,dir,.22,.42);
  clone(px,py,dir,.4,.62);}
 p.x=tx;p.y=ty;stats.restores++;
 try{r706()?.rebase?.(tx,ty);}catch(e){fail(e);}
 return true;}
function install(){
 if(install.done)return;install.done=true;
 if(typeof moveActor==='function'){const base=moveActor;moveActor=function(actor,dx,dy,...a){const p=P();
  if(!p||actor!==p||manual||!off())return base.call(this,actor,dx,dy,...a);
  const d=Math.sqrt((+dx||0)**2+(+dy||0)**2),bx=p.x,by=p.y;let r;
  if(d<LEAP){r=base.call(this,actor,dx,dy,...a);if(cur&&fin(p.x-bx)&&fin(p.y-by)){cur.walk.x+=p.x-bx;cur.walk.y+=p.y-by;}return r;}
  if(!depth&&!outside){outside=fresh(p);const rec=outside;
   const q=typeof queueMicrotask==='function'?queueMicrotask:(f=>Promise.resolve().then(f));
   q(()=>{if(outside!==rec)return;outside=null;if(depth){return;}if(rec.leap&&settle(P(),rec))stats.outsideRestores++;});}
  const rec=depth?cur:outside;
  r=base.call(this,actor,dx,dy,...a);
  if(rec){rec.leap=true;if(fin(p.x)&&fin(p.y))rec.ends.push({x:p.x,y:p.y});}
  return r;};}
 if(typeof blink==='function'){const base=blink;blink=function(...a){
  if(depth&&off()){stats.autoBlinksBlocked++;return;}
  manual++;try{return base.apply(this,a);}finally{manual--;}};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const p=P();
  if(depth||!p||!off())return base.apply(this,a);
  cur=fresh(p);const rec=cur;depth++;let r;try{r=base.apply(this,a);}finally{depth--;cur=null;}
  try{stats.ticks++;if(rec.leap||orbiting())settle(p,rec);}catch(e){fail(e);}
  return r;};}
}
// 설정 창 한 줄.
function row(){const doc=typeof document!=='undefined'?document:null;if(!doc||doc.getElementById('autoMoveR1022'))return;
 const host=doc.getElementById('combatScreenR1021')||doc.getElementById('quickSettingsR114');if(!host)return;
 const d=doc.createElement('div');d.id='autoMoveR1022';d.className='r1021-row';
 d.innerHTML='<label><input type="checkbox" id="autoMoveR1022Toggle"> 기술이 영웅을 순간이동시키기</label>'+
  '<p class="small muted">끄면 걷기와 직접 누른 블링크만 영웅을 옮깁니다. 돌진·자동 회피·길잡이 블링크·문양 실검무는 분신이 대신 가서 같은 피해와 이펙트를 냅니다. 모바일 기본은 끔.</p>';
 host.appendChild(d);const el=d.querySelector('#autoMoveR1022Toggle');if(el){el.checked=on();el.onchange=()=>set(!!el.checked);}}
if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{row();}catch(e){fail(e);}return r;};}
function set(v){try{localStorage.setItem(KEY,v?'1':'0');}catch(_){}const el=typeof document!=='undefined'&&document.getElementById?.('autoMoveR1022Toggle');if(el)el.checked=on();return on();}
if(typeof document!=='undefined'&&document.readyState==='complete')install();
else window.addEventListener('load',install);
window.__STORYWORLD_AUTO_MOVE_R1022__=Object.freeze({revision:REV,on,set,install,row,stats:()=>({...stats,lastError})});
})();
