/* R1039 영웅 EGO 오라·피격/적중 — 코드 그림을 손그림 프레임 시트로 (사용자 2026-11-14 12:10Z "미카엘라같이 도트나 코드로 아직 스킬 구현해서
 * 어색한 것도 … 프레임 애니메이션 이펙트로", 13:53Z "영웅들 스킬이펙트 프레임애니메이션으로 적용 … 가장 시급하게").
 * Dots CX-0099FX 시트가 오기 전, 저장소에 이미 있는 손그림 프레임 시트(R100 sig-aura·sig-gather 영웅색 12칸, 원화 F248·F114)로 먼저 바꾼다.
 *  ① EGO 오라(play-r111 egoBack/egoFront): R106 '코드로 만든 1장 그림'(가시 12개 부채·불꽃·고리·불티·번개)을 빼고
 *     발동 순간 sig-gather(바닥 소용돌이, 1회 12칸) → 그 뒤 sig-aura(몸을 감는 불꽃 고리, 12칸 반복)로 그린다. 영웅마다 R101 고유색.
 *  ② R101 피격·적중(heroHurt·heroHit·powerUp): 코드 선 줄기(stroke)와 R106 1장 고리를 뺀다(같이 그려지던 R100 손그림 sig 는 그대로).
 * 그림이 아직 안 받아졌으면 원래 그림을 그대로 둔다(효과가 통째로 사라지지 않게). 끄기: localStorage storyworld.r1039.paint = 'off'.
 * 판정·피해·시간은 바꾸지 않는다(그리기만). */
(()=>{'use strict';
if(window.__STORYWORLD_EGO_PAINT_R1039__)return;
const REV='R1039-ego-paint-1',KEY='storyworld.r1039.paint';
const fin=Number.isFinite,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const stats={egoScopes:0,egoPainted:0,egoFallback:0,suppressed:0,strokesCut:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let on=true;try{const v=localStorage.getItem(KEY);if(v==='off'||v==='0'||v==='false')on=false;}catch(_){}
// R101 고유색 이름(sig) — R100 시트 색 이름과 같다.
const SIGCOL={hwando:'pale',seoha:'cyan',neon:'teal',michaela:'magenta',lauren:'violet',hunter:'orange',slayer:'red',gunner:'blue'};
const SHEET={aura:{size:160,frames:12},gather:{size:192,frames:12}};
const colourOf=hero=>{try{const c=window.__STORYWORLD_POLISH_R101__?.palette?.(hero)?.sig;if(typeof c==='string'&&/^[a-z]+$/.test(c))return c;}catch(_){}return SIGCOL[hero]||'pale';};
const pathOf=(kind,c)=>'assets/r100/sig-'+kind+'-'+c+'.webp';
const asked=new Map();
function image(path){try{const r=typeof readyImage==='function'?readyImage(path):null;if(r?.image)return r.image;const t=Date.now();if(t-(asked.get(path)||0)>1500){asked.set(path,t);if(typeof addImage==='function')addImage(path,'R1039 EGO paint');else if(typeof ensureImages==='function')Promise.resolve(ensureImages([path])).catch(()=>{});}}catch(e){fail(e);}return null;}
function warm(hero){const c=colourOf(hero);image(pathOf('aura',c));image(pathOf('gather',c));}
// 같은 순간 칸 번호(시간 기준). 반복은 14fps, 발동 1회는 .7초에 12칸.
function frameLoop(n,t,seed=0){if(!fin(t))return 0;return ((Math.floor(t*14+seed)%n)+n)%n;}
function frameOnce(n,age,life){if(!fin(age)||!fin(life)||life<=0||age<0)return n-1;return Math.max(0,Math.min(n-1,Math.floor(age/life*n)));}
// 지금 어떤 그리기 범위 안인가(play-r111·polish-r101 의 scope 이름으로 가른다).
let mode=null;
const egoOf=id=>id==='r111:ego-back'?'back':id==='r111:ego-front'?'front':null;
const r101Own=o=>!!(o&&o.r101===true&&typeof o.id==='string'&&/^r101:\d+$/.test(o.id));
// EGO 발동 시각: 오라 그리기가 .4초 넘게 끊겼다 다시 시작되면 새 발동.
let egoStart=-9,egoLast=-9;
const nowT=()=>{try{return typeof time==='number'&&fin(time)?time:0;}catch(_){return 0;}};
function heroBox(o){const p=typeof player!=='undefined'?player:null;let x=o?.x,y=o?.y;if(!fin(x)||!fin(y)){x=p?.x;y=p?.y;}
 if(!fin(x)||!fin(y)||typeof project!=='function')return null;const q=project(x,y),h=typeof actorHeight==='function'?actorHeight():60,lift=clamp(Number(p?.visualLiftPx)||0,0,h*.65);
 if(!fin(q?.x)||!fin(q?.y)||!fin(h)||h<=0)return null;return {x:q.x,y:q.y-lift,h};}
function paintEgo(target,which,o){const hero=(typeof player!=='undefined'&&player?.hero)||'hwando',c=colourOf(hero),A=image(pathOf('aura',c)),G=image(pathOf('gather',c));
 if(!A||!G)return false;const b=heroBox(o);if(!b)return true;const t=nowT(),age=t-egoStart,draw=target.drawImage;
 const put=(im,S,fr,cx,cy,w,hh,alpha,blend)=>{const x=cx-w/2,y=cy-hh/2;if(![x,y,w,hh].every(fin)||w<=0||hh<=0)return;target.save();try{target.globalCompositeOperation=blend;target.filter='none';target.imageSmoothingEnabled=true;target.globalAlpha=clamp((fin(target.globalAlpha)?target.globalAlpha:1)*alpha,0,1);draw.call(target,im,fr*S,0,S,S,x,y,w,hh);}finally{target.restore();}};
 const {x,y,h}=b,burst=clamp(1-age/.7,0,1);
 if(which==='back'){
  // 발동: 바닥 소용돌이가 한 번 휘몰아친다(납작 타원).
  if(age<.9){const g=frameOnce(12,age,.9);put(G,SHEET.gather.size,g,x,y-h*.02,h*2.8,h*1.4,.9,'source-over');put(G,SHEET.gather.size,g,x,y-h*.02,h*2.8,h*1.4,.5,'lighter');}
  // 몸을 감는 불꽃 고리(뒤쪽 층): 그림 가운데의 고리가 발 높이에 오도록.
  // 그림 자체로 보이게(source-over) + 빛을 한 겹 더(lighter). 밝은 바닥에서 lighter 만으로는 묻힌다(헤드리스 캡처로 확인).
  const s=h*(2.6+.4*burst),fr=frameLoop(12,t);put(A,SHEET.aura.size,fr,x,y-h*.36,s,s,1,'source-over');put(A,SHEET.aura.size,fr,x,y-h*.36,s,s,.8,'source-over');put(A,SHEET.aura.size,fr,x,y-h*.36,s,s,.75,'lighter');
 }else{
  // 앞쪽 층: 같은 고리를 엇박 칸으로 옅게 — 몸 앞을 지나는 불꽃.
  const s=h*2.3;put(A,SHEET.aura.size,frameLoop(12,t,6),x,y-h*.32,s,s,.55,'lighter');
 }
 return true;}
// R106 거르개: EGO 범위·R101 피격/적중 범위 안의 코드 1장 그림은 그리지 않는다.
function filter(name){if(!on||!mode)return true;if(mode==='ego-painted'){stats.suppressed++;return false;}if(mode==='r101'&&(name==='ring'||name==='pillar')){stats.suppressed++;return false;}return true;}
(function hook(n=0){try{const S=window.__STORYWORLD_FX_SPRITES_R106__;if(S?.addFilter){S.addFilter(filter);return;}}catch(e){fail(e);}if(n<60&&typeof setTimeout==='function')setTimeout(()=>hook(n+1),250);})();
function wrapScope(){const DC=window.StoryPhase1?.DrawCommands;if(!DC?.prototype||DC.prototype.__r1039)return !!DC?.prototype?.__r1039;const base=DC.prototype.scope;if(typeof base!=='function')return false;
 const w=function(owner,fn){if(!on||mode)return base.call(this,owner,fn);let which=null,own=false;try{which=egoOf(owner?.id);own=!which&&r101Own(owner);}catch(_){}
  if(which){const self=this;stats.egoScopes++;const t=nowT();if(which==='back'){if(t-egoLast>.4)egoStart=t;egoLast=t;}
   return base.call(this,owner,function(...a){let painted=false;try{painted=paintEgo(self,which,owner);}catch(e){fail(e);}
    if(!painted){stats.egoFallback++;return fn.apply(this,a);}stats.egoPainted++;mode='ego-painted';try{return fn.apply(this,a);}finally{mode=null;}});}
  if(own){const self=this;return base.call(this,owner,function(...a){const had=Object.prototype.hasOwnProperty.call(self,'stroke'),old=self.stroke;mode='r101';
   self.stroke=function(){stats.strokesCut++;};try{return fn.apply(this,a);}finally{mode=null;if(had)self.stroke=old;else delete self.stroke;}});}
  return base.call(this,owner,fn);};
 w.__r1039=true;DC.prototype.scope=w;DC.prototype.__r1039=true;return true;}
// perf-r97 처럼 인스턴스에 scope 를 복사해 둔 기록기가 있으면 그것도 감싼다.
function wrapInst(){try{const c=typeof ctx!=='undefined'?ctx:null;if(c&&Object.prototype.hasOwnProperty.call(c,'scope')&&!c.scope.__r1039){const P=window.StoryPhase1?.DrawCommands?.prototype;if(P?.scope?.__r1039)c.scope=P.scope;}}catch(_){}}
let nextWarm=0;
function wrapTick(){if(typeof tick!=='function'||tick.__r1039)return;const base=tick;const w=function(...a){const r=base.apply(this,a);try{if(on&&Date.now()>nextWarm){nextWarm=Date.now()+2000;wrapScope();wrapInst();if(typeof player!=='undefined'&&player)warm(player.hero);}}catch(e){fail(e);}return r;};w.__r1039=true;tick=w;}
function install(){try{wrapScope();wrapTick();if(on&&typeof player!=='undefined'&&player)warm(player.hero);}catch(e){fail(e);}}
install();
window.__STORYWORLD_EGO_PAINT_R1039__=Object.freeze({revision:REV,sheet:SHEET,colourOf,pathOf,frameLoop,frameOnce,egoOf,r101Own,filter,
 set(v){on=v!==false&&v!=='off';try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,installed:!!window.StoryPhase1?.DrawCommands?.prototype?.__r1039})});
})();
