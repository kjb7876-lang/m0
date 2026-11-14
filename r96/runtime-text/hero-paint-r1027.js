// R1027 영웅 '도트' 스킬 이펙트 → 칠한 프레임 시트, 주기적으로 뜨는 정지 버프 그림 → 프레임 애니메이션.
//  사용자 2026-11-14 05:44Z "영웅들 스킬이펙트 아직 도트로 나오는것들 프레임애니메이션으로 개선" · "영웅들 버프? 같은 주기적으로 나오는 이미지 전수조사해서 어색한 부분 개선".
//  전수(qa/r1027/census*.mjs, 8영웅·스킬 8키·40초): 영웅 쪽에서 아직 도트로 나오던 것은
//   ① 엔진 PXF 픽셀 아틀라스(68px 칸을 보간 없이 키움): 적중 melee-spark·extra-01·pxf-08·extra-14·pxf-29, 휘두르기 claw-magic(네온)·pxf-28(슬레이어)·
//      pxf-05·silver-slash(라우렌), 탄 장식 pxf-18(서하)·pxf-05(기억사수), 보호막 pxf-17·막기 pxf-19·패링 pxf-06, 회복 틱 pxf-09
//   ② R163 픽셀 시트: 회복 문장마다 붙는 heal-aoe, 레벨업 level-up, 5연타 crit-hit
//   ③ 정지 그림 한 장이 커졌다 사라지는 문장: 막기(guardStart)마다 뜨는 육각 보호막 문장, 흡혈·5연타·레벨업마다 뜨는 십자 회복 문장 — 전투 중 몇 초마다 깜빡이는 '버프 그림'.
//  바꾸는 법: 엔진·다른 오버레이가 정말 그 그림을 그리는 순간(drawEffect 안의 ctx.drawImage)만 가로채 같은 자리·같은 회전에 칠한 시트 칸으로 바꿔 그린다.
//   → 다른 스레드가 숨긴 효과는 그대로 숨고(그리기 호출이 없으니), 판정·피해·시간·쿨다운은 건드리지 않는다(그림만, 정지 문장만 수명을 조금 늘려 프레임이 보이게).
//   · 적중: R411/R437/R912 칠한 적중이 이미 나오는 영웅(기억사수·슬레이어·서하·네온·라우렌·환도)은 도트 한 겹만 숨김, 헌터 → R912 화살 적중, 미카엘라 → R948 하트 적중.
//   · 휘두르기: R952 초승달 베기를 영웅 색으로 칠한 시트(scripts/r1027-hero-paint.py), 덧붙임 extra-* 는 숨김(한 겹만).
//   · 탄 장식: R912 칠한 탄 시트가 이미 있어 도트 숨김. 보호막·막기·패링 → R438 보호막 돔, 회복 틱 → R438 정화 고리(작게), 큰 회복 → R438 회복.
//  그리기는 원래 호출의 변환(이동·회전) 안에서 ctx.drawImage 로(Three 기록기에 그대로 잡힘), ctx.filter 는 'none' 만, 좌표는 유한값만. 끄기: localStorage storyworld.r1027.paint = off(또는 {"on":false}).
(()=>{'use strict';
if(window.__STORYWORLD_HERO_PAINT_R1027__)return;
const REV='R1027-hero-paint-1',KEY='storyworld.r1027.paint';
let prefs={on:true};
try{const raw=localStorage.getItem(KEY);if(raw!=null){if(raw==='off'||raw==='0'||raw==='false')prefs.on=false;else{const v=JSON.parse(raw);if(v&&typeof v==='object')prefs={...prefs,...v};else prefs.on=v!==false;}}}catch(_){}
const stats={replaced:{},hidden:0,drawn:0,fallback:0,lifeStretched:0,r163Dropped:{},r163Swapped:{},errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const T=()=>typeof time==='number'&&fin(time)?time:0;
const AH=()=>{try{const h=typeof actorHeight==='function'?actorHeight():60;return fin(h)&&h>0?h:60;}catch(_){return 60;}};
// 시트: assets/r1027/index.json 과 같은 값(검사가 대조). pivot = 칸 안 기준점, k = 원래 그림 상자 대비 크기, ground = 바닥 기준.
const SHEETS={
 barrier:{path:'assets/r1027/barrier.webp',cols:6,rows:4,frames:24,cw:160,ch:160,pivot:[80,94],k:1.3},
 heal:{path:'assets/r1027/heal.webp',cols:6,rows:4,frames:24,cw:160,ch:160,pivot:[80,130],k:1.15},
 mend:{path:'assets/r1027/mend.webp',cols:6,rows:4,frames:24,cw:160,ch:160,pivot:[80,96],k:1.05},
 'slash-lauren':{path:'assets/r1027/slash-lauren.webp',cols:5,rows:2,frames:10,cw:192,ch:128,pivot:[40,64],k:1.0,slash:true},
 'slash-neon':{path:'assets/r1027/slash-neon.webp',cols:5,rows:2,frames:10,cw:192,ch:128,pivot:[40,64],k:1.0,slash:true},
 'slash-hwando':{path:'assets/r1027/slash-hwando.webp',cols:5,rows:2,frames:10,cw:192,ch:128,pivot:[40,64],k:1.0,slash:true},
 'slash-slayer':{path:'assets/r1027/slash-slayer.webp',cols:5,rows:2,frames:10,cw:192,ch:128,pivot:[40,64],k:1.0,slash:true},
 'hit-hunter':{path:'assets/r912/pj02-hit.webp',cols:6,rows:1,frames:6,cw:256,ch:256,pivot:[125,130],k:1.35},
 'hit-michaela':{path:'assets/r948/heart-hit6.webp',cols:6,rows:1,frames:6,cw:256,ch:256,pivot:[128,128],k:1.3},
};
const HIDE=Object.freeze({act:'hide'});
const OWN_HIT={hunter:'hit-hunter',michaela:'hit-michaela'};
const R411_HIT={gunner:'hit-explosion',slayer:'hit-fire',seoha:'hit-ice-spikes',neon:'hit-chain-lightning',lauren:'hit-teleport'};
const PROJECTILE_DECOR=new Set(['pxf-18','pxf-05','pxf-16','pxf-10','pxf-08']);
const GUARD=new Set(['shield','blocked','parry','guard','ego-shield']);
const hero=()=>{try{return typeof player==='object'&&player?String(player.hero||''):'';}catch(_){return'';}};
const imgPath=im=>{try{return String(im?.__storyworldStaticTint?.path||im?.__storyworldStaticSource?.path||im?.currentSrc||im?.src||'');}catch(_){return'';}};
function classify(e){
 if(!prefs.on||!e||typeof e!=='object'||!fin(e.x)||!fin(e.y))return null;const h=hero();
 if(e.type==='pxfSprite'){
  if(e.pxfSide==='enemy')return null;const st=String(e.pxfStage||''),k=String(e.pxfKey||'');
  if(st==='hit'||st==='cold-hit'){const own=OWN_HIT[h];return own?{sheet:own,kind:'hit'}:HIDE;}
  if(st==='attack'||st==='flight'){
   if(/^extra-/.test(k))return HIDE;
   if(st==='flight'&&PROJECTILE_DECOR.has(k))return HIDE;
   const s='slash-'+h;return SHEETS[s]?{sheet:s,kind:'slash'}:(st==='attack'?HIDE:null);}
  if(GUARD.has(st))return {sheet:'barrier',kind:'guard'};
  if(st==='heal')return {sheet:'mend',kind:'heal'};
  return null;}
 if(e.type==='sigil'){const a=String(e.asset||'');if(!/barrier-sigil|healing-sigil/.test(a))return null;
  if(!e.r1027Hero){let px=null,py=null;try{px=player?.x;py=player?.y;}catch(_){}if(!fin(px)||!fin(py)||Math.hypot(e.x-px,e.y-py)>.9)return null;}/* 생길 때 영웅 자리였으면 영웅이 움직여도 영웅 것 */
  if(/barrier-sigil/.test(a))return {sheet:'barrier',kind:'sigil'};
  return {sheet:(fin(e.size)?e.size:1)>=1.05?'heal':'mend',kind:'sigil'};}
 return null;}
function frameAt(name,age,life){const S=SHEETS[name];if(!S||!fin(age)||!fin(life)||life<=0||age<=0)return 0;return Math.max(0,Math.min(S.frames-1,Math.floor(age/life*S.frames)));}
// 그림 불러오기(지역을 옮기면 엔진이 안 쓰는 그림을 내리므로 다시 부른다)
const asked=new Map(),firstAsk=new Map();
// 한 번 받았다가 지역 이동으로 내려간 그림은 다시 받는 동안(최대 4초) 정지 그림으로 되돌아가지 않고 그 한 장만 건너뛴다.
// 아직 한 번도 못 받은 그림은 원래 그림(도트)으로 둔다 — 효과가 통째로 사라지지 않게(설치 때부터 미리 받아 둔다).
const loadedOnce=new Set();const waiting=name=>{const p=SHEETS[name]?.path;if(!p||!loadedOnce.has(p))return false;const t=Date.now();if(!firstAsk.has(p))firstAsk.set(p,t);if(t-firstAsk.get(p)<4000)return true;firstAsk.delete(p);return false;};
function image(name){const S=SHEETS[name];if(!S)return null;try{const r=typeof readyImage==='function'?readyImage(S.path):null;if(r?.image){loadedOnce.add(S.path);firstAsk.delete(S.path);return r.image;}
 const t=Date.now();if(t-(asked.get(S.path)||0)>1500){asked.set(S.path,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([S.path])).catch(()=>{});}}catch(e){fail(e);}return null;}
function warm(){const h=hero();for(const n of ['barrier','heal','mend','slash-'+h,OWN_HIT[h]])if(n&&SHEETS[n])image(n);}
// 가로챈 한 번의 그리기를 칠한 칸으로: 원래 상자(dx,dy,dw,dh)의 가운데·크기를 기준으로, 원래 변환(이동·회전) 그대로.
function paint(target,draw,c,e,args){const S=SHEETS[c.sheet],im=image(c.sheet);if(!S)return false;if(!im){if(waiting(c.sheet)){stats.waited=(stats.waited||0)+1;return true;}stats.fallback++;return false;}
 let dx,dy,dw,dh;if(args.length>=8)[,,,,dx,dy,dw,dh]=args;else if(args.length>=4)[dx,dy,dw,dh]=args;else return false;
 if(![dx,dy,dw,dh].every(fin)||dw===0||dh===0)return false;
 const box=Math.max(Math.abs(dw),Math.abs(dh)),ah=AH();
 let size=box*S.k;if(c.kind==='slash')size=Math.max(ah*.9,Math.min(ah*1.8,size));else if(c.sheet==='barrier')size=Math.max(ah*1.05,Math.min(ah*3.2,size));else size=Math.max(ah*.55,Math.min(ah*2.6,size));
 const s=size/S.ch,fr=frameAt(c.sheet,e.age,e.life),sx=(fr%S.cols)*S.cw,sy=Math.floor(fr/S.cols)*S.ch;
 let ox,oy;if(c.kind==='slash'){ox=0;oy=0;}else{ox=dx+dw/2;oy=dy+dh/2+(c.sheet==='hit-hunter'||c.sheet==='hit-michaela'?0:Math.abs(dh)*.18);}
 const x=ox-S.pivot[0]*s,y=oy-S.pivot[1]*s,w=S.cw*s,hh=S.ch*s;if(![x,y,w,hh].every(fin))return false;
 target.save();try{const ga=fin(target.globalAlpha)?target.globalAlpha:1;if(ga<=0)return true;
  target.globalCompositeOperation='source-over';target.filter='none';target.imageSmoothingEnabled=true;
  target.globalAlpha=Math.min(1,c.kind==='sigil'?ga*1.5:ga*1.15);
  draw.call(target,im,sx,sy,S.cw,S.ch,x,y,w,hh);}finally{target.restore();}
 stats.drawn++;stats.replaced[c.sheet]=(stats.replaced[c.sheet]||0)+1;return true;}
function wrapDraw(){if(typeof drawEffect!=='function'||drawEffect.__r1027)return;const base=drawEffect;
 const w=function(e,...a){let c=null;try{c=classify(e);}catch(err){fail(err);}
  if(!c)return base.call(this,e,...a);let target=null;try{target=ctx;}catch(_){}if(!target)return base.call(this,e,...a);
  const pxf=e.type==='pxfSprite',had=Object.prototype.hasOwnProperty.call(target,'drawImage'),prev=target.drawImage;
  target.drawImage=function(im,...args){let mine=false;try{const p=imgPath(im);mine=pxf?/pxf-baked|pxf-[0-9]|extra-[0-9]|melee-spark|silver-slash|claw-magic|explosion-/.test(p):/barrier-sigil|healing-sigil/.test(p);}catch(_){}
   if(!mine)return prev.call(this,im,...args);
   if(c.act==='hide'){stats.hidden++;return;}
   try{if(paint(this,prev,c,e,args))return;}catch(err){fail(err);}return prev.call(this,im,...args);};
  try{return base.call(this,e,...a);}finally{try{if(had)target.drawImage=prev;else delete target.drawImage;}catch(_){}}};
 w.__r1027=true;drawEffect=w;}
// 막는 동안·보호막이 남은 동안 엔진 drawHero 가 영웅 몸에 정지 육각 보호막 문장을 계속 붙인다(texture(VFX.barrier)) → 칠한 보호막 돔의 가운데 12장을 왕복 재생.
const LOOP=[6,17];
function paintLoop(target,draw,args){const S=SHEETS.barrier,im=image('barrier');if(!im){if(waiting('barrier')){stats.waited=(stats.waited||0)+1;return true;}stats.fallback++;return false;}
 let dx,dy,dw,dh;if(args.length>=8)[,,,,dx,dy,dw,dh]=args;else if(args.length>=4)[dx,dy,dw,dh]=args;else return false;
 if(![dx,dy,dw,dh].every(fin)||dw===0||dh===0)return false;const ah=AH(),size=Math.max(ah*.9,Math.min(ah*2.2,Math.max(Math.abs(dw),Math.abs(dh))*1.2)),s=size/S.ch;
 const n=LOOP[1]-LOOP[0]+1,k=Math.floor(T()*12.5)%(2*n-2),fr=LOOP[0]+(k<n?k:2*n-2-k),sx=(fr%S.cols)*S.cw,sy=Math.floor(fr/S.cols)*S.ch;
 const x=dx+dw/2-80*s,y=dy+dh/2-80*s,w=S.cw*s,hh=S.ch*s;if(![x,y,w,hh].every(fin))return false;
 target.save();try{target.globalCompositeOperation='source-over';target.filter='none';target.imageSmoothingEnabled=true;target.globalAlpha=Math.min(1,(fin(target.globalAlpha)?target.globalAlpha:1)*1.25);
  draw.call(target,im,sx,sy,S.cw,S.ch,x,y,w,hh);}finally{target.restore();}stats.drawn++;stats.replaced['barrier-loop']=(stats.replaced['barrier-loop']||0)+1;return true;}
function wrapHero(){if(typeof drawHero!=='function'||drawHero.__r1027)return;const base=drawHero;
 const w=function(...a){if(!prefs.on)return base.apply(this,a);let target=null;try{target=ctx;}catch(_){}if(!target)return base.apply(this,a);
  const had=Object.prototype.hasOwnProperty.call(target,'drawImage'),prev=target.drawImage;
  target.drawImage=function(im,...args){let mine=false;try{mine=/barrier-sigil/.test(imgPath(im));}catch(_){}if(!mine)return prev.call(this,im,...args);
   try{if(paintLoop(this,prev,args))return;}catch(err){fail(err);}return prev.call(this,im,...args);};
  try{return base.apply(this,a);}finally{try{if(had)target.drawImage=prev;else delete target.drawImage;}catch(_){}}};
 w.__r1027=true;drawHero=w;}
// 정지 문장은 0.24~0.3초라 24장 시트가 거의 안 보인다 → 그림 수명만 늘림(판정 없음)
function wrapFx(){if(typeof fx!=='function'||fx.__r1027)return;const base=fx;
 const w=function(type,x,y,o,...a){const n=typeof effects!=='undefined'&&Array.isArray(effects)?effects.length:-1;const r=base.call(this,type,x,y,o,...a);
  try{if(prefs.on&&type==='sigil'&&n>=0){const e=effects[effects.length-1];if(e&&e.type==='sigil'&&e.x===x&&e.y===y){const c=classify(e);if(c)e.r1027Hero=true;
   if(c&&c.sheet){const min=c.sheet==='barrier'?.55:c.sheet==='heal'?.9:.5;if(!(e.life>=min)){e.life=min;stats.lifeStretched++;}}}}}catch(err){fail(err);}return r;};
 w.__r1027=true;fx=w;}
// R163 픽셀 시트 중 영웅 쪽(색 지정 없는 회복 고리·레벨업·5연타): 회복 고리·레벨업은 같은 순간 뜨는 회복 문장이 칠한 시트로 바뀌므로 빼고, 5연타는 칠한 적중으로.
const own=[],SENT={type:'r1027-paint',x:0,y:0,age:0,life:Infinity,r1027Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT))effects.push(SENT);}catch(_){}}
function spawn(sheet,x,y,o={}){if(!SHEETS[sheet]||!fin(x)||!fin(y))return;if(own.length>=8)own.shift();image(sheet);own.push({sheet,x,y,t0:T(),life:o.life||.5,size:o.size||1,angle:fin(o.angle)?o.angle:0});arm();}
function drawOwn(){if(!own.length||typeof project!=='function')return;let target=null;try{target=ctx;}catch(_){}if(!target)return;const t=T(),ah=AH();
 for(const o of own){const S=SHEETS[o.sheet],im=image(o.sheet),age=t-o.t0;if(!S||!im||age<0||age>=o.life)continue;const q=project(o.x,o.y);if(!fin(q?.x)||!fin(q?.y))continue;
  const size=ah*o.size,s=size/S.ch,fr=frameAt(o.sheet,age,o.life);
  const run=()=>{target.save();try{target.translate(q.x,q.y-ah*.35);if(S.slash)target.rotate(o.angle);target.globalCompositeOperation='source-over';target.filter='none';
   target.drawImage(im,(fr%S.cols)*S.cw,Math.floor(fr/S.cols)*S.ch,S.cw,S.ch,-S.pivot[0]*s,-S.pivot[1]*s,S.cw*s,S.ch*s);}finally{target.restore();}};
  try{if(typeof target.scope==='function')target.scope({id:'r1027:'+o.sheet+':'+o.t0.toFixed(3),kind:'effect',x:o.x,y:o.y,r1027:true},run);else run();stats.drawn++;stats.replaced[o.sheet]=(stats.replaced[o.sheet]||0)+1;}catch(err){fail(err);}}}
let r163Done=false;
function swapR163(){if(r163Done)return;const P=window.__STORYWORLD_PIXELFX_R163__;if(!P||typeof P.play!=='function')return;r163Done=true;
 const base=P.play;const play=function(name,x,y,o){try{if(prefs.on&&!(o&&o.tint)){const h=hero();
   if(name==='heal-aoe'||name==='level-up'){stats.r163Dropped[name]=(stats.r163Dropped[name]||0)+1;return null;}
   if(name==='crit-hit'){const r411=window.__STORYWORLD_SKILL_SHEETS_R411__;
    if(R411_HIT[h]&&r411?.play){r411.play(R411_HIT[h],x,y,{size:1.3});}else spawn(OWN_HIT[h]||'slash-hwando',x,y,{size:OWN_HIT[h]?1.25:1.1,life:OWN_HIT[h]?.48:.42,angle:Math.random()*Math.PI*2});
    stats.r163Swapped[name]=(stats.r163Swapped[name]||0)+1;return null;}}}catch(err){fail(err);}return base.apply(this,arguments);};
 try{window.__STORYWORLD_PIXELFX_R163__=Object.freeze({...P,play,r1027Wrapped:true});}catch(err){fail(err);}}
function wrapTick(){if(typeof tick!=='function'||tick.__r1027)return;const base=tick;let next=0;
 const w=function(...a){const r=base.apply(this,a);try{swapR163();const t=T();for(let i=own.length-1;i>=0;i--)if(t-own[i].t0>=own[i].life||t<own[i].t0-2)own.splice(i,1);
  if(!own.length){const i=typeof effects!=='undefined'&&Array.isArray(effects)?effects.indexOf(SENT):-1;if(i>=0)effects.splice(i,1);}
  if(prefs.on&&Date.now()>next){next=Date.now()+2000;warm();}}catch(err){fail(err);}return r;};w.__r1027=true;tick=w;}
function install(){try{wrapDraw();wrapHero();wrapFx();wrapTick();swapR163();if(prefs.on)warm();}catch(e){fail(e);}}
install();
try{setTimeout(()=>{try{for(const n of ['barrier','heal','mend'])image(n);}catch(_){}},0);}catch(_){}
try{if(typeof drawEffect==='function'){const inner=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r1027-paint'){try{drawOwn();}catch(err){fail(err);}return;}return inner.call(this,e,...a);};drawEffect.__r1027=true;}}catch(e){fail(e);}
try{setTimeout(swapR163,0);}catch(_){}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false&&v!=='off'})};if(!prefs.on)own.length=0;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_HERO_PAINT_R1027__=Object.freeze({revision:REV,sheets:SHEETS,classify,frameAt,set,spawn,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:JSON.parse(JSON.stringify(stats)),own:own.length,lastError})});
})();
