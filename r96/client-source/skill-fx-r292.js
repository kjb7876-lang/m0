// R292 영웅 버튼별 손그림 프레임 이펙트 띠 — 사용자 2026-11-04 승인("dots 생성 → 사용자 승인"): 영웅마다 버튼(동작)별로 다르게 보이도록
//  dots 가 그린 384×384 칸 가로 띠(8~12장)를 그 동작이 일어나는 순간 한 번 재생한다. 키가 아니라 동작에 건다(R291 키 재배치와 무관):
//   basic = basicAttack(기본공격) · blink = blink(블링크) · special = special(고유기술) · w/e/r = 73a 원천 스토리 기술 슬롯(storySourceSkill 단계).
//  표: assets/r292/fx/index.json (scripts/r292-fx-strips.py 가 만든다 — 새 띠는 그 스크립트 ROWS 에 한 줄 + sync). 영웅→동작→{file,frames,anchor,origin,dur,scale,blend,fit}.
//   anchor dir = 오른쪽을 향한 띠를 겨눈 방향(화면각)으로 돌려 기준점(origin)을 영웅 몸 높이에 놓는다. 왼쪽을 볼 때는 위아래를 뒤집어(거울) 칼자국 휘는 쪽을 유지.
//          fit 'path' = 기준점→기준점+288px 를 실제 이동(블링크·대시 시작→끝)의 화면 거리에 맞춰 늘인다(0.6~1.8배).
//   anchor radial = 칸 가운데를 영웅(W·R 은 시전 원점, E 표식형은 표적)에 놓는다. scale = 칸 한 변이 화면 몇 칸(TILE×zoom)인지.
//  겹쳐 어색한 '일반' 그림만 그리지 않는다(효과 객체는 그대로 두고 그리기에서만 건너뜀 — 다른 오버레이의 쿨다운·감지 훅은 그대로 돈다):
//   · 기본공격(띠 있는 근접 영웅): 엔진 공용 'slash'(VFX.slash) 베기 그림
//   · 블링크(띠 있는 영웅): 엔진 공용 착지 문양 'sigil'(VFX.blink). 잔상(ghost)은 남긴다.
//   · 환도 고유기술: 엔진 공용 'slash'(VFX.flare) 세 줄기(0.5초 안)
//   · W/E/R(띠 있는 영웅·슬롯): 73a 원천 정지 그림 storySourceSkill 의 warning·release·flight 단계. 'hit'(맞은 자리 불꽃)·피해 숫자·R160 적중 연출은 그대로.
//  판정·피해·쿨다운·범위·타이밍은 바꾸지 않는다(그림만). 미카엘라는 표에 있어도 쓰지 않는다(R269·R247 그대로).
//  Three.js 기록기: ctx.filter 는 쓰지 않는다. 합성은 screen(밝은 띠) / source-over(어두운 보라 띠). 동시 8개, 같은 영웅·동작 2개까지.
//  끄기: localStorage['storyworld.r292.fx']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_SKILL_FX_R292__)return;
const REV='R292-skill-fx-1',KEY='storyworld.r292.fx',DIR='assets/r292/fx/',MAX=8,PER=2,CELL=384,FIT=288;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={plays:{},drawn:0,skipped:0,suppressed:{},errors:0,loaded:0};let lastError=null,table=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const hero=()=>typeof player==='object'&&player?player.hero:null;
const fin=v=>typeof v==='number'&&Number.isFinite(v);
function row(h,action){if(!on||!table||!h||h==='michaela')return null;return table[h]?.[action]||null;}
const asked=new Map();
function image(r){const p=DIR+r.file;try{const got=typeof readyImage==='function'?readyImage(p):null;if(got?.image){if(!asked.get(p+':ok')){asked.set(p+':ok',1);stats.loaded++;}return got.image;}
 const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
let warmed=null;function warm(){const h=hero();if(!table||!h||h===warmed)return;warmed=h;for(const a of Object.keys(table[h]||{}))if(row(h,a))image(table[h][a]);}
fetch(DIR+'index.json').then(r=>r.ok?r.json():null).then(j=>{table=j?.effects||null;warm();}).catch(fail);
const list=[],SENT={type:'r292-skill-fx',x:0,y:0,age:0,life:Infinity,r292Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
// play(영웅, 동작, {x,y: 기준 자리(월드), angle: 월드각, tx,ty: path 끝(월드)})
function play(h,action,o){const r=row(h,action);if(!r||!o||!fin(o.x)||!fin(o.y))return null;image(r);
 const key=h+':'+action,same=list.filter(e=>e.key===key);if(same.length>=PER)list.splice(list.indexOf(same[0]),1);if(list.length>=MAX)list.shift();
 const e={key,hero:h,action,r,x:o.x,y:o.y,angle:fin(o.angle)?o.angle:0,tx:fin(o.tx)?o.tx:null,ty:fin(o.ty)?o.ty:null,t0:T()};list.push(e);stats.plays[key]=(stats.plays[key]||0)+1;arm();return e;}
function screenAngle(x,y,a){const p=project(x,y),q=project(x+Math.cos(a),y+Math.sin(a));return Math.atan2(q.y-p.y,q.x-p.x);}
function drawOne(e){const r=e.r,age=T()-e.t0;if(age<0||age>=r.dur)return;const im=image(r);if(!im){stats.skipped++;return;}
 const fr=Math.min(r.frames-1,Math.floor(age/r.dur*r.frames)),unit=(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1),q=project(e.x,e.y),lift=H()*.3;
 let s=r.scale*unit/CELL,ang=0;
 if(r.anchor==='dir'){if(r.fit==='path'&&e.tx!=null){const to=project(e.tx,e.ty),d=Math.hypot(to.x-q.x,to.y-q.y);ang=d>1?Math.atan2(to.y-q.y,to.x-q.x):screenAngle(e.x,e.y,e.angle);if(d>1)s=Math.max(s*.6,Math.min(s*1.8,d/FIT));}else ang=screenAngle(e.x,e.y,e.angle);}
 const flip=r.anchor==='dir'&&Math.cos(ang)<0;
 ctx.save();try{const run=()=>{ctx.globalCompositeOperation=r.blend||'screen';ctx.translate(q.x,q.y-lift);if(ang)ctx.rotate(ang);ctx.scale(s,flip?-s:s);ctx.drawImage(im,fr*CELL,0,CELL,CELL,-r.origin[0],-r.origin[1],CELL,CELL);};
  if(typeof ctx.scope==='function')ctx.scope({id:'r292:'+e.key+':'+e.t0,kind:'effect',x:e.x,y:e.y,r292:true},run);else run();stats.drawn++;e.lastFrame=fr;e.lastAngle=ang;e.lastScale=s;e.lastFlip=flip;}catch(err){fail(err);}finally{ctx.restore();}}
function drawAll(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;for(const e of list)drawOne(e);}
// ---- 일반 그림 숨기기(그리기만) -------------------------------------------------------------------------
const hide=(eff,why)=>{if(!eff||eff.r292Hidden)return;eff.r292Hidden=why;stats.suppressed[why]=(stats.suppressed[why]||0)+1;};
function pushed(type,x,y,from){try{for(let i=effects.length-1;i>=Math.max(0,from-1);i--){const f=effects[i];if(f&&f.type===type&&f.x===x&&f.y===y&&!f.r292Seen){f.r292Seen=true;return f;}}}catch(_){}return null;}
let cap=null;const flareUntil={};const werSeen=new Map();
const WER_STAGE={w:'release',e:'flight',r:'warning'},WER_HIDE=new Set(['warning','release','flight']);
try{
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const n0=typeof effects!=='undefined'&&Array.isArray(effects)?effects.length:0,res=base.apply(this,arguments);
  try{const o=opt||{},h=hero();
   if(cap&&cap.angle==null&&(type==='slash'||type==='link')){if(fin(o.angle)&&type==='slash')cap.angle=o.angle;else if(fin(o.tx)&&fin(o.ty))cap.angle=Math.atan2(o.ty-y,o.tx-x);}
   if(cap&&cap.kind==='basic'&&type==='slash'&&typeof VFX==='object'&&o.asset===VFX.slash&&row(h,'basic'))hide(pushed(type,x,y,n0),'basic-slash');
   if(cap&&cap.kind==='blink'&&type==='sigil'&&typeof VFX==='object'&&o.asset===VFX.blink&&row(h,'blink'))hide(pushed(type,x,y,n0),'blink-sigil');
   if(type==='slash'&&typeof VFX==='object'&&o.asset===VFX.flare&&flareUntil[h]>T()&&row(h,'special'))hide(pushed(type,x,y,n0),'special-flare');
   if(type==='storySourceSkill'&&o.storyWER&&o.sourceHero===h&&row(h,o.sourceSlot)){const slot=o.sourceSlot;
    if(WER_HIDE.has(o.stage))hide(pushed(type,x,y,n0),'wer-'+slot+'-'+o.stage);
    const want=WER_STAGE[slot]||'warning',id=o.castId;
    if(o.stage===want&&!werSeen.has(id)){werSeen.set(id,1);if(werSeen.size>64)werSeen.delete(werSeen.keys().next().value);
     const a=fin(o.visualWorldAngle35)?o.visualWorldAngle35:fin(o.tx)?Math.atan2(o.ty-y,o.tx-x):0;play(h,slot,{x,y,angle:a,tx:o.tx,ty:o.ty});}}
  }catch(err){fail(err);}return res;};}
 if(typeof makeShot==='function'){const base=makeShot;makeShot=function(x,y,a){try{if(cap&&cap.angle==null&&fin(a))cap.angle=a;}catch(_){}return base.apply(this,arguments);};}
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...args){const p=typeof player==='object'?player:null,before=p?.combo,cd0=p?.attackCD,prev=cap;cap={kind:'basic',angle:null};let res;
  try{res=base.apply(this,args);}finally{const c=cap;cap=prev;try{if(p&&p===player&&(p.combo!==before||c.angle!=null||(!(cd0>0)&&p.attackCD>0)))play(p.hero,'basic',{x:p.x,y:p.y,angle:c.angle??(typeof storyAim22==='function'?storyAim22():0)});}catch(err){fail(err);}}return res;};}
 if(typeof blink==='function'){const base=blink;blink=function(...args){const p=typeof player==='object'?player:null,before=p?.blinkCD,old=p?{x:p.x,y:p.y}:null,prev=cap;cap={kind:'blink',angle:null};let res;
  try{res=base.apply(this,args);}finally{cap=prev;try{if(p&&p===player&&!(before>0)&&p.blinkCD>0)play(p.hero,'blink',{x:old.x,y:old.y,tx:p.x,ty:p.y,angle:Math.atan2(p.y-old.y,p.x-old.x)});}catch(err){fail(err);}}return res;};}
 if(typeof special==='function'){const base=special;special=function(...args){const p=typeof player==='object'?player:null,before=p?.specialCD;let a=null;
  try{if(p&&!(before>0)&&row(p.hero,'special')){const e=typeof nearestEnemy==='function'?nearestEnemy(12):null;a=e?Math.atan2(e.y-p.y,e.x-p.x):typeof storyAim22==='function'?storyAim22():0;flareUntil[p.hero]=T()+.5;}}catch(err){fail(err);}
  const res=base.apply(this,args);
  try{if(p&&p===player&&!(before>0)&&p.specialCD>0&&a!=null)play(p.hero,'special',{x:p.x,y:p.y,angle:a});else if(p)flareUntil[p.hero]=0;}catch(err){fail(err);}return res;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r292-skill-fx'){try{drawAll();}catch(err){fail(err);}return;}if(e&&e.r292Hidden&&on)return;return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{warm();const t=T();for(let i=list.length-1;i>=0;i--){const e=list[i];if(t-e.t0>=e.r.dur||t<e.t0-1)list.splice(i,1);}
   if(list.length)arm();else if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);list.length=0;return r;};}
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)list.length=0;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_SKILL_FX_R292__=Object.freeze({revision:REV,dir:DIR,set,on:()=>on,play,row,table:()=>table,
 inspect:()=>({revision:REV,on,ready:!!table,heroes:table?Object.keys(table):[],stats:JSON.parse(JSON.stringify(stats)),
  active:list.map(e=>({key:e.key,age:+(T()-e.t0).toFixed(3),frame:e.lastFrame??null,angle:e.lastAngle??null,scale:e.lastScale??null,flip:!!e.lastFlip,x:e.x,y:e.y,tx:e.tx,ty:e.ty})),lastError})});
})();
