/* R111 play polish (사용자 2026-10-28 00:12·00:24·00:36·00:40).
 * ① 전투 중 영웅은 늘 적을 본다: 공격·스킬 뒤 .55초 동안은 이동하면서도(뒤로 빠지며 때릴 때) 겨눈 적 쪽을 본다.
 * ② 공명은 777이 최대로 보인다(속값 0~100을 ×7.77로 표시). 차오르는 양은 1.35배, EGO 비용(30=233)·지속은 그대로.
 * ③ EGO 상태: 영웅 고유색 불꽃이 몸을 감싸고 가시 같은 기운이 위로 솟는 초사이어인풍 오라 + 번개 + 솟는 불티.
 * ④ 실검무: 가는 실선 고리 오라를 은빛 띠 두세 가닥이 몸을 휘감는 그림 오라로, 실검무 타격의 가는 선 그림을
 *    은빛 베기 그림(모티프마다 다른 모양)으로 바꾼다.
 * ⑤ 조형물: 벽에 너무 붙은 장식 소품(비차단)은 벽에서 떨어진 자리로 옮기고, 그림의 실제 발(밑동) 높이를 재서
 *    그림자 한가운데에 밑동이 닿도록 그린다(둥둥 떠 보이는 문제).
 * ⑥ 원거리 영웅(서하·미카엘라·헌터·기억사수, 00:55 "돌진이 아니라 자동회피나 사거리 상향, 캐릭터 특성에 맞게"): E 돌진은 적에게서
 *    물러나는 회피로, 기본 사거리는 영웅마다 조금 늘리고, 근접 공격이 자신을 겨누면 쿨타임마다 한 번 자동으로 물러난다.
 * ⑦ D키 공명 방어(01:06 "쿨타임 없이 누르고 있으면 모든 피해 77% 방어, 체력 초당 7% 회복, 공명 상태 이펙트 강화 — 누리의 기원 느낌"):
 *    누르는 동안 받는 피해 ×0.23(기존 ×0.4를 대신), 최대 체력의 7%/초 회복, 발밑 성스러운 문양·내려오는 빛기둥·머리 위 빛고리·
 *    내려앉는 빛 깃털(우리 텍스처로만 그린다, 외부 게임 그림을 쓰지 않음).
 * ⑧ 사몽 각성(01:26): 주인공 색은 그대로, 나머지(바닥·벽·조형물·몹)는 흑백. 흰 폭풍 선은 영웅 고유색+보조색 빛줄기로,
 *    선에 닿은 일반 몹은 현재 체력의 77% 피해와 영웅색 베기 이펙트(보스·중간보스·페르소나는 원래 피해 그대로).
 * ⑨ 아군 투사체(01:28): 총구 보정된 탄은 무기 끝에서 바로 나가 보이게(띄움 0→원래 높이), 기본 탄 1.55배+영웅색 빛무리.
 * ⑩ 보스 속박(01:28): 보스가 건 뿌리 속박은 보스 고유색 사본 그림+원소 장식, 기계 계열 보스는 강철 케이블색+보스색 전류(전선 촉수).
 * 판정·피해·쿨타임·저장은 바꾸지 않는다(공명 충전량 1.35배, 원거리 영웅 사거리·E 방향·자동 회피는 사용자 요청으로 바꿈). */
(()=>{'use strict';
if(window.__STORYWORLD_PLAY_R111__)return;
if(typeof tick!=='function'||typeof drawHero!=='function'||typeof drawEffect!=='function'||typeof project!=='function')return;
const REV='R111-play-1',TAU=Math.PI*2;
const stats={faces:0,kiteFaces:0,resGain:0,egoDraws:0,threadAuras:0,threadSlashes:0,propsMoved:0,propsChecked:0,feet:0,footShifts:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const finite=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const rnd=(seed,i)=>{const x=Math.sin(seed*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);};
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on()?s:null;};
const R102=()=>window.__STORYWORLD_HERO_FX_R102__;
const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};
const Z=()=>typeof zoom==='number'?zoom:1;

// ---- preferences ----------------------------------------------------------------------------
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r111.play';
const DEFAULTS=Object.freeze({facing:true,resonance777:true,egoAura:true,threadArt:true,props:true,ranged:true,guard:true,samong:true,shots:true,bossRoot:true});
const LABELS={facing:'전투 중 이동해도 적 바라보기',resonance777:'공명 777 표시·빨리 차기',egoAura:'EGO 불꽃 오라',threadArt:'실검무 은빛 오라·베기 그림',props:'조형물 벽 간격·그림자 접지',ranged:'원거리 영웅: E 회피·사거리 상향·자동 회피 (다시 불러오면 적용)',guard:'D 공명 방어: 피해 77% 감소·초당 7% 회복·빛 연출',samong:'사몽 각성: 주인공만 색·나머지 흑백·영웅색 폭풍 선·일반 몹 현재 체력 77%',shots:'아군 투사체: 무기 끝에서 시작·기본 탄 크게',bossRoot:'보스 속박: 보스 고유색·기계 보스는 전선 촉수'};
const prefs={...DEFAULTS};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}

// ---- ① 전투 중 적 바라보기 ------------------------------------------------------------------
const ANGLES={e:0,se:Math.PI/4,s:Math.PI/2,sw:3*Math.PI/4,w:Math.PI,nw:-3*Math.PI/4,n:-Math.PI/2,ne:-Math.PI/4};
function sectorOf(dx,dy){const a=Math.atan2((dx+dy)*.5,dx-dy);let best='s',bd=Infinity;for(const k in ANGLES){const r=ANGLES[k],d=Math.abs(Math.atan2(Math.sin(a-r),Math.cos(a-r)));if(d<bd){bd=d;best=k;}}return best;}
const liveFoe=e=>!!e&&e.hp>0&&e.spawnState==='active'&&!e.deadRecorded&&e.visible!==false;
let combatUntil=0,faceFoe=null;
function foe(){const list=room?.enemies||[];const t=typeof target!=='undefined'?list.find(e=>e.id===target):null;
 if(liveFoe(t)&&Math.hypot(t.x-player.x,t.y-player.y)<7)return t;let best=null,bd=4.5;
 for(const e of list){if(!liveFoe(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd&&(typeof clearLine!=='function'||clearLine(player,e))){bd=d;best=e;}}return best;}
function faceTick(){faceFoe=null;if(!prefs.facing||!solo()||player.hp<=0||(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading))return;
 if(player.attackAnim>0||player.skillAnim>0)combatUntil=time+.55;if(time>=combatUntil||player.dashAnim>0)return;
 const e=foe();if(!e)return;const dx=e.x-player.x,dy=e.y-player.y;if(Math.hypot(dx,dy)<.05)return;
 if(typeof facing==='function')player.direction=facing(dx,dy);player.currentVisualSector=sectorOf(dx,dy);faceFoe=e;stats.faces++;if(player.moving)stats.kiteFaces++;}

// ---- ② 공명 777 ---------------------------------------------------------------------------------
const RES_SCALE=7.77,RES_GAIN=1.35;
const shown=v=>Math.round(clamp(finite(v),0,100)*RES_SCALE);
function resText(){if(!prefs.resonance777)return;const el=document.getElementById('resText');if(el&&typeof player!=='undefined'&&player){const t='공명 '+shown(player.resonance)+' / 777';if(el.textContent!==t)el.textContent=t;}
 const orb=document.querySelector('.r93-res b');if(orb&&typeof player!=='undefined'&&player){const t=shown(player.resonance)+'/777';if(orb.textContent!==t)orb.textContent=t;}}
const fixMsg=s=>typeof s==='string'&&prefs.resonance777?s.replace(/공명 30(이|으로)/g,'공명 233$1').replace(/공명 60/g,'공명 466'):s;
let textScanAt=0;
function fixDomText(){if(time<textScanAt)return;textScanAt=time+2.5;try{settingsSection();}catch(_){}if(!prefs.resonance777)return;try{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n,k=0;while((n=w.nextNode())&&k<4000){k++;const v=n.nodeValue;if(v&&v.includes('공명 30')){const f=fixMsg(v);if(f!==v)n.nodeValue=f;}}}catch(e){fail(e);}}

// ---- ③ EGO 초사이어인풍 오라 ------------------------------------------------------------------
const egoOn=p=>finite(p?.ego)>0||(p===player&&window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active===true);
const WHITE=Object.freeze({a:Object.freeze([255,255,255]),b:Object.freeze([255,255,255])});
const SILVER=Object.freeze({a:Object.freeze([214,222,234]),b:Object.freeze([255,255,255])});
function palOf(p){const P=R102()?.PALETTE?.[p?.hero]||R102()?.PALETTE?.hwando;return P?{a:P.a,b:P.b}:SILVER;}
const egoState=new WeakMap();
function heroFoot(p){const q=project(p.x,p.y),h=actorHeight(),lift=clamp(finite(p.visualLiftPx),0,h*.65);return{x:q.x,y:q.y-lift,h};}
function egoBack(p,S,F,I){const {x,y,h}=heroFoot(p),lo=lowFx(),st=egoState.get(p),age=st?time-st.at:9,burst=clamp(1-age/.7,0,1),swell=1+.35*burst,fr=Math.floor(time*14);
 S.draw('glow',F,x,y,h*2.6*swell,h*1.1*swell,{alpha:.3+.25*burst,squash:.5});// 발밑 빛 (R119: 영웅 몸이 하얗게 날아가지 않게 오라 밝기를 낮춤)
 S.draw('ring',I,x,y,h*(1.6+.3*Math.sin(time*7))*swell,h*(.8+.15*Math.sin(time*7))*swell,{alpha:.45});
 S.draw('flame',F,x,y+h*.06,h*1.55*swell,h*2.25*swell,{frame:fr,alpha:.55});// 바깥 불꽃
 S.draw('flame',I,x,y+h*.04,h*1.0*swell,h*1.75*swell,{frame:fr+2,alpha:.36});// 안쪽 밝은 불꽃
 const n=lo?7:12;for(let i=0;i<n;i++){const a=i*TAU/n+time*.8,depth=Math.sin(a);if(depth>0)continue;const fl=.7+.3*Math.sin(time*(11+i)+i*2.1),
  sx=x+Math.cos(a)*h*.34,sy=y+depth*h*.1-h*.04;S.draw('spike',i%3?F:I,sx,sy,h*.16,h*(1+.7*rnd(i,3))*fl*swell,{angle:Math.cos(a)*.38,alpha:.85});}
 S.draw('glow',I,x,y-h*.52,h*1.1,h*1.5,{alpha:.09+.05*Math.sin(time*9)});}
function egoFront(p,S,F,I){const {x,y,h}=heroFoot(p),lo=lowFx(),fr=Math.floor(time*14);
 const n=lo?7:12;for(let i=0;i<n;i++){const a=i*TAU/n+time*.8,depth=Math.sin(a);if(depth<=0)continue;const fl=.7+.3*Math.sin(time*(11+i)+i*2.1),
  sx=x+Math.cos(a)*h*.36,sy=y+depth*h*.1;S.draw('spike',i%3?F:I,sx,sy,h*.14,h*(.75+.5*rnd(i,3))*fl,{angle:Math.cos(a)*.38,alpha:.42,overHero:true});}
 S.draw('flame',F,x,y+h*.05,h*1.25,h*1.7,{frame:fr+1,alpha:.11,overHero:true});
 // 솟는 불티
 const m=lo?5:10;for(let i=0;i<m;i++){const ph=(time*(.9+.5*rnd(i,1))+rnd(i,2))%1,px=x+(rnd(i,4)-.5)*h*.9,py=y-h*(.1+1.6*ph);S.draw('spark',i%2?I:F,px,py,h*.32,h*.07,{angle:-Math.PI/2,alpha:Math.sin(Math.PI*ph)*.9,overHero:true});}
 // 번개(짧게 번쩍)
 const slot=Math.floor(time*6);if(rnd(slot,7)<(lo?.25:.5)){const a0=rnd(slot,8)*TAU,r0=h*.35,x0=x+Math.cos(a0)*r0,y0=y-h*(.3+.6*rnd(slot,9)),x1=x0+(rnd(slot,10)-.5)*h*.9,y1=y0-h*(.3+.4*rnd(slot,11));S.along('bolt',I,x0,y0,x1,y1,h*.22,{frame:slot,alpha:.9,overHero:true});}}
function egoTick(){const p=player;const on=egoOn(p);const st=egoState.get(p);if(on&&!st)egoState.set(p,{at:time});else if(!on&&st)egoState.delete(p);}

// ---- ④ 실검무 은빛 오라·베기 ------------------------------------------------------------------
const threadRank=p=>{try{return Number(window.__STORYWORLD_PROGRESSION_R62__?.ranks?.('threadDanceR63',p))||0;}catch(_){return 0;}};
// 가는 실선 대신 은빛 띠(텍스처 strip)가 기울어진 궤도를 돌며 몸을 휘감는다. 단계가 오를수록 가닥·꼬리가 늘어난다.
function ribbons(p,S,layer){const rank=threadRank(p);if(rank<=0)return false;const {x,y,h}=heroFoot(p),n=Math.min(3,1+Math.floor((rank-1)/3)),L=1.5+.12*Math.min(rank,7),m=lowFx()?7:12,seed=hash(p.coopIdR62||p.hero||'h')%628/100;
 for(let k=0;k<n;k++){const tilt=[.22,-.3,.05][k],cy=y-h*[.42,.62,.28][k],rx=h*(.46+.04*k),ry=h*(.13+.02*k),head=time*(1.7+.12*Math.min(rank,7))*(k%2?-1:1)+k*TAU/n+seed,dir=k%2?-1:1;
  const pt=a=>{const ex=Math.cos(a)*rx,ey=Math.sin(a)*ry;return[x+ex*Math.cos(tilt)-ey*Math.sin(tilt),cy+ex*Math.sin(tilt)+ey*Math.cos(tilt)];};
  for(let i=0;i<m;i++){const u0=i/m,u1=(i+1)/m,a0=head-dir*L*(1-u0),a1=head-dir*L*(1-u1),mid=(a0+a1)/2;if((Math.sin(mid)>0)!==(layer==='front'))continue;
   const [x0,y0]=pt(a0),[x1,y1]=pt(a1);S.along('slashline',SILVER,x0,y0,x1,y1,h*(.035+.07*u1),{alpha:.25+.7*u1,overHero:layer==='front'});}
  if((Math.sin(head)>0)===(layer==='front')){const [hx,hy]=pt(head);S.draw('flare',SILVER,hx,hy,h*.32,h*.32,{angle:time*3+k,alpha:.85,overHero:layer==='front'});S.draw('glow',SILVER,hx,hy,h*.45,h*.45,{alpha:.5,overHero:layer==='front'});}}
 if(layer==='back'&&rank>=3)S.draw('ring',SILVER,x,y,h*1.25,h*.62,{alpha:.18+.03*Math.min(rank,7)});
 return true;}
function threadAura(p){const S=SPR();if(!S||!p||p.hp<=0||!Number.isFinite(p.x+p.y))return false;if(window.__STORYWORLD_PROGRESSION_R62__?.state?.(p)?.visuals===false)return false;
 let ok=false;scope({id:'r111:thread-aura-back:'+String(p.coopIdR62||p.id||'hero'),kind:'effect',x:p.x,y:p.y,groundAligned:false},()=>{ctx.save();try{ok=ribbons(p,S,'back');}finally{ctx.restore();}});if(ok)stats.threadAuras++;return ok;}
function threadFront(p){const S=SPR();if(!S)return;scope({id:'r111:thread-aura-front:'+String(p.coopIdR62||p.id||'hero'),kind:'effect',x:p.x,y:p.y,groundAligned:false},()=>{ctx.save();try{ribbons(p,S,'front');}finally{ctx.restore();}});}
function installThreadAura(){const C=window.__STORYWORLD_CAMPAIGN_R63R1__;if(!C||C.r111Thread||typeof C.drawThreadAura!=='function')return false;const native=C.drawThreadAura;
 const next=Object.freeze({...C,r111Thread:true,nativeDrawThreadAura:native,drawThreadAura:(p=player)=>{try{if(prefs.threadArt&&SPR()&&threadAura(p))return true;}catch(e){fail(e);}return native(p);}});
 try{window.__STORYWORLD_CAMPAIGN_R63R1__=next;}catch(e){fail(e);return false;}return true;}
// 실검무 타격: 출발점→적 방향의 은빛 잔상 + 적 자리의 굵은 베기, 모티프마다 다른 모양(그림 텍스처).
function threadSlash(e){const S=SPR(),m=e.threadR63;if(!S||!m?.from||!m?.to)return false;const h=actorHeight(),u=clamp(e.age/Math.max(.001,e.life),0,1),fade=Math.sin(Math.PI*Math.min(.999,u)),
 s=project(m.from.x,m.from.y),t=project(m.to.x,m.to.y),lift=h*.45,ang=Math.atan2(t.y-s.y,t.x-s.x),grow=clamp(u/.25,0,1),cx=t.x,cy=t.y-lift,len=h*(1.25+.06*Math.min(7,finite(m.rank,0))),motif=m.motif||'cross',seed=finite(m.seed,0)+finite(m.hitIndex,0)*7;
 const cut=(a,l,th,al,o=0)=>{const dx=Math.cos(a)*l*.5*grow,dy=Math.sin(a)*l*.5*grow,ox=-Math.sin(a)*o,oy=Math.cos(a)*o;S.along('iai-cut',SILVER,cx+ox-dx,cy+oy-dy,cx+ox+dx,cy+oy+dy,th,{alpha:al*fade});S.along('slashline',WHITE,cx+ox-dx,cy+oy-dy,cx+ox+dx,cy+oy+dy,th*.32,{alpha:.8*al*fade});};
 // 순간이동 방향을 보여 주는 잔상
 S.along('slashline',SILVER,s.x,s.y-lift,t.x,t.y-lift,h*.12,{alpha:.45*fade*(1-u)});
 if(motif==='cross'){cut(ang+.6,len,h*.42,1);cut(ang-.6,len,h*.42,.95);cut(ang,len*.8,h*.3,.7);}
 else if(motif==='flower'){for(let i=0;i<4;i++)S.draw('petal',SILVER,cx+Math.cos(i*TAU/4+u*3)*h*.35*grow,cy+Math.sin(i*TAU/4+u*3)*h*.22*grow,h*.42,h*.3,{angle:i*TAU/4+u*3,alpha:fade});cut(ang,len*.9,h*.36,.9);}
 else if(motif==='fractal'){cut(ang,len,h*.4,1);for(let i=0;i<3;i++){const a=ang+(i-1)*.9+rnd(seed,i)*.3;S.along('bolt',SILVER,cx,cy,cx+Math.cos(a)*h*.9*grow,cy+Math.sin(a)*h*.55*grow,h*.2,{frame:seed+i,alpha:.85*fade});}}
 else if(motif==='claw'){for(let i=-1;i<=1;i++)cut(ang+.25,len*.95,h*.28,.95,i*h*.2);}
 else if(motif==='tsubamegaeshi'){for(let i=0;i<3;i++)cut(ang+i*TAU/3,len*.8,h*.32,.95);}
 else{cut(ang,len*1.45,h*.6,1);S.draw('slashwide',SILVER,cx,cy+h*.3,h*2.4*grow,h*1.3*grow,{angle:ang,alpha:.7*fade});}
 if(m.triangle&&motif!=='tsubamegaeshi')for(let i=0;i<3;i++)cut(ang+i*TAU/3+.3,len*.6,h*.2,.6);
 if(u<.35)S.draw('flare',WHITE,cx,cy,h*(.6+1.2*u),h*(.6+1.2*u),{angle:seed,alpha:(1-u/.35)});
 stats.threadSlashes++;return true;}
function withoutStrokes(fn){const c=typeof ctx!=='undefined'?ctx:null;if(!c)return fn();const had=Object.prototype.hasOwnProperty.call(c,'stroke');if(had)return fn();
 try{c.stroke=function(){};}catch(_){return fn();}try{return fn();}finally{try{delete c.stroke;}catch(_){}}}

// ---- ⑤ 조형물: 벽 간격·밑동 접지 ------------------------------------------------------------
const PH=()=>window.StoryPhase1;
const blockedAt=(L,x,y,s)=>{const a=PH();return typeof a?.explorationBlocked==='function'?a.explorationBlocked(L,x,y,s):false;};
const SPECIAL=p=>!!(p.door||p.portal||p.interact||p.objective||p.chest||p.npc||p.locked||p.r103Chest||p.kind==='door'||p.kind==='portal'||p.kind==='chest');
function wallNear(L,x,y,c,tall){if(blockedAt(L,x,y,c))return true;if(tall){for(const[dx,dy]of[[.9,.9],[.9,0],[0,.9]])if(blockedAt(L,x+dx,y+dy,.2))return true;}return false;}
const spaced=new WeakSet();
function spaceProps(r){if(!prefs.props||!r||spaced.has(r)||!Array.isArray(r.props)||!r.exploration?.floorCells?.length)return;const L=r.exploration;spaced.add(r);
 const keepOut=[L.entry,r.objective].filter(q=>q&&Number.isFinite(q.x+q.y));
 for(const p of r.props){if(!p||p.solid!==false&&!p.r80PresentationOnly&&!p.r81PresentationOnly||SPECIAL(p)||!Number.isFinite(p.x+p.y))continue;stats.propsChecked++;
  const tall=finite(p.height,60)>=95,c=tall?.85:.65;if(!wallNear(L,p.x,p.y,c,tall))continue;let best=null;
  for(let d=.35;d<=2.1&&!best;d+=.35)for(let k=0;k<12;k++){const a=k*TAU/12+(hash(p.id||p.path)%12)*.05,x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;
   if(wallNear(L,x,y,c,tall))continue;if(keepOut.some(q=>Math.hypot(q.x-x,q.y-y)<1.6))continue;if(r.props.some(o=>o!==p&&o&&Number.isFinite(o.x+o.y)&&Math.hypot(o.x-x,o.y-y)<.9))continue;best={x,y};break;}
  // 원본 배치 자료(위치·충돌)는 그대로 두고, 그릴 때만 옮긴 자리를 쓴다(숨은 속성이라 저장·비교 자료에 안 섞인다).
  if(best){try{Object.defineProperty(p,'r111To',{value:best,configurable:true});stats.propsMoved++;}catch(_){}}}}
// 그림 밑동: 가운데 띠(가로 35%)에서 불투명 픽셀이 처음으로 충분히 모이는 가장 아래 줄. 뿌리·천 자락이 아래로 흘러도
// 몸통이 땅에 닿는 높이를 찾는다. 한 그림당 한 번, 작은 CPU 캔버스로 잰다.
const feet=new Map();let footBudget=0,footCanvas=null;
function footOf(path,row){if(feet.has(path))return feet.get(path);if(footBudget<=0||!row?.image)return 1;footBudget--;let f=1;
 try{const im=row.image,cr=row.crop,sx=finite(cr?.x,0),sy=finite(cr?.y,0),sw=finite(cr?.w,im.naturalWidth),sh=finite(cr?.h,im.naturalHeight);if(sw>4&&sh>4){const W=48,H=Math.max(8,Math.min(160,Math.round(48*sh/sw)));
  footCanvas??=document.createElement('canvas');footCanvas.width=W;footCanvas.height=H;const c=footCanvas.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,W,H);c.drawImage(im,sx,sy,sw,sh,0,0,W,H);
  const d=c.getImageData(0,0,W,H).data,x0=Math.floor(W*.325),x1=Math.ceil(W*.675),need=Math.max(2,Math.round((x1-x0)*.3));
  for(let y=H-1;y>=Math.floor(H*.55);y--){let n=0;for(let x=x0;x<x1;x++)if(d[(y*W+x)*4+3]>110)n++;if(n>=need){f=(y+1)/H;break;}}stats.feet++;}}catch(e){fail(e);f=1;}
 feet.set(path,f);return f;}

// ---- ⑥ 원거리 영웅 ------------------------------------------------------------------------------
// 영웅 특성: 서하(정밀·시간) 사거리 +1.2·자동 회피 7초, 미카엘라(빛·치유) 사거리 +0.8·자동 회피 8초,
// 헌터(속사) 사거리 +1.0·자동 회피 6초, 기억사수(팬텀 블링크) 사거리 +0.8·자동 회피 5초(가장 자주).
const RANGED=Object.freeze({seoha:{range:1.2,cd:7},michaela:{range:.8,cd:8},hunter:{range:1,cd:6},gunner:{range:.8,cd:5}});
const rangedState={applied:false,dodgeAt:-99,dodges:0,base:{}};
function applyRanged(){if(rangedState.applied||!prefs.ranged)return;const H=typeof HEROES!=='undefined'?HEROES:null,D=window.__STORYWORLD_WER__?.defs;if(!H)return;
 for(const[id,v]of Object.entries(RANGED)){const h=H[id];if(h&&Number.isFinite(h.range)&&!h.r111Range){rangedState.base[id]=h.range;try{h.range=+(h.range+v.range).toFixed(2);h.r111Range=true;}catch(e){fail(e);}}
  const e=D?.[id]?.e;if(Array.isArray(e)&&e[2]==='dash')try{e[2]='escape';}catch(err){fail(err);}}
 rangedState.applied=true;}
const isRanged=p=>!!RANGED[p?.hero];
function autoDodge(){if(!prefs.ranged||!solo()||!isRanged(player)||player.hp<=0||(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading))return;
 const cd=RANGED[player.hero].cd;if(time-rangedState.dodgeAt<cd||player.dashAnim>0||finite(player.invincible)>.2)return;
 const fc=window.__STORYWORLD_FOOTPRINT154__;let threat=null;
 for(const e of room?.enemies||[]){const a=e.attack;if(!liveFoe(e)||!a||a.committed)continue;const windup=finite(a.castWindup150,finite(a.shape154?.windup,.4));if(a.elapsed<windup*.45||a.elapsed>=windup)continue;
  const g=a.footprint154;let inside=Math.hypot(e.x-player.x,e.y-player.y)<1.8;try{if(g&&typeof footprintContains154==='function')inside=footprintContains154(g,player.x,player.y,.3);}catch(_){}if(inside){threat=e;break;}}
 if(!threat)return;const dx=player.x-threat.x,dy=player.y-threat.y,d=Math.hypot(dx,dy)||1,ox=player.x,oy=player.y;
 if(typeof moveActor==='function')moveActor(player,dx/d*1.7,dy/d*1.7);if(Math.hypot(player.x-ox,player.y-oy)<.2)return;
 player.dashAnim=Math.max(finite(player.dashAnim),.16);player.invincible=Math.max(finite(player.invincible),.3);player.invReason='자동 회피';
 if(typeof facing==='function')player.direction=facing(threat.x-player.x,threat.y-player.y);rangedState.dodgeAt=time;rangedState.dodges++;
 try{if(typeof fx==='function')fx('text',player.x,player.y,{text:'회피',color:'#cfe8ff',life:.7});}catch(_){}}

// ---- ⑦ D 공명 방어 -------------------------------------------------------------------------------
const GUARD_TAKEN=.23,NATIVE_GUARD=.4,GUARD_HEAL=.07;
const HOLY=Object.freeze({a:Object.freeze([255,214,120]),b:Object.freeze([255,248,226])});
const guardState={on:false,at:0,healed:0,blocked:0};
function guardTick(dt){const on=!!(prefs.guard&&player.guard&&player.hp>0);if(on&&!guardState.on)guardState.at=time;guardState.on=on;
 if(on&&Number.isFinite(dt)&&dt>0&&typeof maxHP==='function'){const m=maxHP(),add=Math.min(m-player.hp,m*GUARD_HEAL*dt);if(add>0){player.hp+=add;guardState.healed+=add;}}}
function guardBack(p,S){const {x,y,h}=heroFoot(p),age=time-guardState.at,open=clamp(age/.35,0,1),pulse=1+.05*Math.sin(time*5);
 S.draw('glow',HOLY,x,y,h*3*open,h*1.3*open,{alpha:.5,squash:.5});
 S.draw('rune',HOLY,x,y,h*2.1*open*pulse,h*2.1*open*pulse,{squash:.5,angle:time*.7,alpha:.85});
 S.draw('rune',S.pal(HOLY.b),x,y,h*1.35*open,h*1.35*open,{squash:.5,angle:-time*1.1,alpha:.6});
 S.draw('ring',HOLY,x,y,h*2.5*open,h*1.25*open,{alpha:.35+.2*Math.sin(time*3)});
 S.draw('pillar',HOLY,x,y+h*.05,h*(.9+.08*Math.sin(time*4)),h*(2.6+.4*(1-open)),{alpha:.55*open});}
function guardFront(p,S){const {x,y,h}=heroFoot(p),age=time-guardState.at,open=clamp(age/.35,0,1),lo=lowFx();
 S.draw('halo',HOLY,x,y-h*1.12+Math.sin(time*2)*h*.02,h*.62,h*.24,{alpha:.95*open,overHero:true});
 const n=lo?4:8;for(let i=0;i<n;i++){const ph=(time*.45+i/n)%1,px=x+(rnd(i,5)-.5)*h*1.2+Math.sin(time*1.5+i)*h*.08,py=y-h*(1.9-1.85*ph);
  S.draw('feather',i%2?HOLY:S.pal(HOLY.b),px,py,h*.08,h*.24,{angle:Math.sin(time*2+i)*.6,alpha:.8*Math.sin(Math.PI*ph),overHero:true});}
 S.draw('glow',HOLY,x,y-h*.5,h*1.0,h*1.4,{alpha:.18+.08*Math.sin(time*6),overHero:true});
 if(age<.45){const k=age/.45;S.draw('flare',HOLY,x,y-h*.55,h*(1+2*k),h*(1+2*k),{alpha:1-k,overHero:true});}}

// ---- ⑧ 사몽 각성: 주인공만 색, 나머지 흑백 · 폭풍 선은 영웅 고유색 · 선에 닿은 일반 몹은 현재 체력의 77% --------------
// three 기록기는 ctx.filter를 무시하므로, 각성 동안 영웅·이펙트·투사체가 아닌 그림(바닥·벽·조형물·몹·그림자)은
// 미리 흑백으로 만든 사본 캔버스로 바꿔 넘기고(정적 원본 표시를 달아 매 프레임 복사하지 않게), 채움·선 색도 회색으로 바꾼다.
const SAMONG_CUT=.77,GRAY_KEEP=new Set(['hero','effect','projectile']);
const samongState={on:false,grayImages:0,grayPixels:0,grayFills:0,cuts:0,cutDamage:0,bossSkips:0,lines:0};
let grayMap=new WeakMap(),grayList=[],grayBudget=0;
const samongOn=()=>{try{return !!(prefs.samong&&live()&&window.__STORYWORLD_SAMONG_R75__?.active?.());}catch(_){return false;}};
function grayOf(image){if(!image)return null;const got=grayMap.get(image);if(got)return got;
 const mutable=typeof image.getContext==='function'&&!image.__storyworldStaticSource&&!image.__storyworldStaticTint;if(mutable)return null;
 const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;if(!(w>0&&h>0))return null;
 if(grayBudget<=0||samongState.grayPixels+w*h>(lowFx()?12e6:28e6))return null;grayBudget-=w*h;
 try{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.filter='grayscale(1) contrast(1.08) brightness(.92)';g.drawImage(image,0,0);
  const src=image.__storyworldStaticSource||image.__storyworldStaticTint,path=String(src?.path||image.src||image.path||'');
  c.__storyworldStaticSource=Object.freeze({...(src||{}),path,immutable:true,r111SamongGray:true,sourceFilter:g.filter});
  grayMap.set(image,c);grayList.push(c);samongState.grayImages++;samongState.grayPixels+=w*h;return c;}catch(e){fail(e);return null;}}
function grayReset(){for(const c of grayList){c.width=1;c.height=1;}grayMap=new WeakMap();grayList=[];samongState.grayPixels=0;}
const HEX=/^#([0-9a-f]{3,8})$/i,RGB=/^rgba?\(([^)]+)\)$/i;
function grayColour(v){if(typeof v!=='string')return v;let r,g,b,a=1,m=v.trim().match(HEX);
 if(m){let h=m[1];if(h.length<=4)h=h.split('').map(c=>c+c).join('');r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16);if(h.length===8)a=parseInt(h.slice(6,8),16)/255;}
 else if((m=v.trim().match(RGB))){const n=m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat);[r,g,b]=n;if(n.length>3)a=n[3];}else return v;
 if(![r,g,b,a].every(Number.isFinite))return v;const y=Math.round(clamp((.299*r+.587*g+.114*b)*.95,0,255));return 'rgba('+y+','+y+','+y+','+a+')';}
function installGray(){const DC=window.StoryPhase1?.DrawCommands,P=DC?.prototype;if(!P||P.r111Gray||Object.isFrozen(P))return false;
 const imageBase=P.drawImage,pushBase=P.push;
 P.drawImage=function(image,...a){if(rootState.theme&&image){const t=tintOf(image);if(t)image=t;}if(samongState.on&&image&&!GRAY_KEEP.has(this.owner?.kind)){const g=grayOf(image);if(g)image=g;}return imageBase.call(this,image,...a);};
 P.push=function(kind,data){const r=pushBase.call(this,kind,data);if(samongState.on&&(kind==='fill'||kind==='stroke')&&!GRAY_KEEP.has(this.owner?.kind)){const c=this.commands[this.commands.length-1],st=c?.style;
   if(st){for(const k of ['fillStyle','strokeStyle'])if(typeof st[k]==='string')st[k]=grayColour(st[k]);samongState.grayFills++;}}return r;};
 Object.defineProperty(P,'r111Gray',{value:true});return true;}
function samongTick(){const on=samongOn();if(on!==samongState.on){samongState.on=on;if(!on)grayReset();}grayBudget=lowFx()?2e6:6e6;}
const majorFoe=e=>!!(e&&(e.boss||e.midboss||e.persona||e.majorBoss||e.r54Boss||e.combatProfile?.boss));
function samongLine(e){const ray=e.r75Storm;if(!ray||!Array.isArray(ray.runs))return false;const S=SPR(),F=palOf(player),age=time-ray.start,active=age>=.18&&age<=.34,
 a=age<.18?.25+age/.18*.35:Math.max(0,1-(age-.18)/.36),lo=lowFx();let n=0;
 for(const run of ray.runs){if(n++>=(lo?16:48))break;const p=project(run.a.x,run.a.y),q=project(run.b.x,run.b.y),len=Math.hypot(q.x-p.x,q.y-p.y);if(!(len>1))continue;
  scope({id:'r111:samong-line:'+ray.id+':'+n,kind:'effect',x:run.b.x,y:run.b.y,groundAligned:true},()=>{ctx.save();try{
   const rgb=c=>'rgb('+c[0]+','+c[1]+','+c[2]+')',z=Z();ctx.lineCap='round';
   ctx.globalAlpha*=a*(active?.32:.16);ctx.strokeStyle=rgb(F.b);ctx.lineWidth=Math.max(2,z*(active?7:4));ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
   ctx.globalAlpha=a*(active?.95:.45);ctx.strokeStyle=rgb(F.a);ctx.lineWidth=Math.max(1,z*(active?2.6:1.3));ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
   if(S&&active&&!lo){const ang=Math.atan2(q.y-p.y,q.x-p.x);S.draw('slashline',F,(p.x+q.x)/2,(p.y+q.y)/2,len,Math.max(6,z*10),{angle:ang,alpha:a*.7});}
  }finally{ctx.restore();}});}samongState.lines++;return true;}
function samongCutFx(e){const S=SPR();if(!S)return;const F=palOf(player),k=clamp(e.age/e.life,0,1),q=project(e.x,e.y),h=actorHeight(),y=q.y-h*.45;
 S.draw('slashwide',F,q.x,y,h*(1.1+.6*k),h*.36,{angle:e.angle||-.5,alpha:1-k});
 S.draw('slashline',S.pal(F.b),q.x,y,h*(1.3+.5*k),h*.14,{angle:(e.angle||-.5)+1.25,alpha:(1-k)*.9});
 S.draw('flare',F,q.x,y,h*(.5+.9*k),h*(.5+.9*k),{alpha:(1-k)*.8});}
function samongHit(e,value,source){if(!prefs.samong||source?.kind!=='hero-samong-storm-r75'||!e||!(e.hp>0))return value;if(majorFoe(e)){samongState.bossSkips++;return value;}
 const v=Math.max(finite(value),e.hp*SAMONG_CUT);samongState.cuts++;samongState.cutDamage+=v;
 try{if(typeof fx==='function')fx('r111SamongCut',e.x,e.y,{life:.42,angle:-.4-rnd(samongState.cuts,1)*.9});}catch(_){}return v;}

// ---- ⑨ 아군 투사체(01:28): 무기 끝에서 시작 · 기본 투사체를 크고 잘 보이게 ----------------------------------------
// 원래 총구(무기 끝) 보정은 발사 지점을 화면상 무기 끝에 맞춘 땅 좌표로 옮긴 뒤, 그리기에서 다시 18px(×zoom) 위로 띄워
// 무기보다 한 뼘 위에서 나가 보였다. 총구 보정이 된 탄은 막 나온 순간 띄움을 0으로 두고 .16초에 걸쳐 원래 높이로 올린다.
// 기본(스킬 아닌) 아군 탄은 1.55배로 그리고 영웅 고유색 빛무리를 뒤에 깐다. 판정 반경·속도·피해는 그대로.
const SHOT_SCALE=1.55,SHOT_RISE=.16;const shotState={drawn:0,muzzleFix:0,enlarged:0};
function shotDraw(base,self,p,a){const muzzle=!!p.currentPublicMuzzle?.applied,basic=p.attackKind9!=='skill'&&!p.storyWER&&!p.sourceProjectile5,age=finite(p.age,1),
 drop=muzzle?18*Z()*(1-clamp(age/SHOT_RISE,0,1)):0,scale=p.scale;let pj=null;
 if(drop>0){pj=project;project=function(x,y,...r){const o=pj.call(this,x,y,...r);return o&&Number.isFinite(o.y)?{...o,y:o.y+drop}:o;};shotState.muzzleFix++;}
 if(basic&&Number.isFinite(scale)){p.scale=scale*SHOT_SCALE;shotState.enlarged++;}
 try{const S=basic?SPR():null;if(S&&Number.isFinite(p.x+p.y)){const q=(pj||project)(p.x,p.y),F=palOf(player),sz=Math.min(90,18*finite(scale,1)*SHOT_SCALE*Z());
   S.draw('glow',F,q.x,q.y-18*Z()+drop,sz*2.2,sz*1.6,{alpha:.55});S.draw('flare',S.pal(F.b),q.x,q.y-18*Z()+drop,sz*1.1,sz*1.1,{alpha:.45,angle:time*4});}
  shotState.drawn++;return base.call(self,p,...a);}finally{if(pj)project=pj;if(basic&&Number.isFinite(scale))p.scale=scale;}}

// ---- ⑩ 보스 속박(01:28): 보스가 건 뿌리 속박은 그 보스 고유색으로, 기계 계열 보스는 전선 촉수로 ----------------------------
// 건 쪽은 속박 상태 줄의 owner로 찾고, owner가 없는 속박이면 14칸 안의 보스·중간보스·페르소나 중 가장 가까운 쪽으로 본다.
// 가시 뿌리 그림(R96 앞뒤 장·R100 통짜·F091 접촉 가시·F110 봉인 절단)은 그동안 보스 색 사본으로 바꿔 그리고,
// 원소마다 발밑 불씨·서리 조각·검은 연기·번개를 덧붙인다. 기계 계열은 뿌리를 강철 케이블색으로 바꾸고 보스색 전류가 타고 오른다.
// 일반 몹이 건 속박은 원래 그림 그대로. 속박 시간·피해·탈출 판정은 바꾸지 않는다.
const ROOT_ART=/final42-r88\/r96\/(back|front)-compact-page|r100\/root-full|final42-r88\/effects\/(091|110)\//;
const MECHA_IDS=new Set(['b09-boss','mb-ep1b09','u201-mid','u202-mid','u204-mid','u205-mid','mb-hando01','mb-hando02']),MECHA_NAME=/사이보그|기계|로봇|메카|드론|부트로더|연산|검열기|전쟁관리자|교정관|역전 관리자|코어 운반/;
const rootState={on:false,theme:null,binds:0,themed:0,tinted:0,tintPixels:0,draws:0};let tintMap=new Map();
function rootedNow(){try{const a=window.__STORYWORLD_STATUS_R96__?.inspect?.().active?.some(r=>r.kind==='root'&&r.releaseAt==null);return !!(a||window.__STORYWORLD_POLISH_R100__?.rooted?.());}catch(_){return false;}}
function binderOf(){for(const api of [window.__STORYWORLD_FIELDS_R61__,window.__STORYWORLD_REGIONAL_COMBAT_R58__,window.__STORYWORLD_HOSPITAL_WOUNDS_R53__]){let rows=[];try{rows=api?.statusRows?.()||[];}catch(_){}
  for(const r of rows)if((r.key==='bind'||r.key==='속박'||r.label==='속박')&&r.owner!=null){const e=(room?.enemies||[]).find(v=>v.id===r.owner);if(e)return majorFoe(e)?e:null;}}
 let best=null,bd=14;for(const e of room?.enemies||[]){if(!(e?.hp>0)||!majorFoe(e))continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}return best;}
function themeOf(e){const B=window.__STORYWORLD_BOSS_FX_R105__,P=B?.palOf?.(e);if(!P)return null;const id=e.nativeId||e.id,mecha=MECHA_IDS.has(id)||MECHA_NAME.test(String(e.name||''));
 return{key:(mecha?'mecha:':'root:')+P.a.join('.'),P:{a:P.a,b:P.b},elem:P.elem||'corruption',mecha,boss:id,name:String(e.name||'')};}
function rootTick(){const on=!!(prefs.bossRoot&&live()&&player.hp>0&&rootedNow());
 if(on&&!rootState.on){rootState.binds++;const e=binderOf();rootState.theme=e?themeOf(e):null;if(rootState.theme)rootState.themed++;}
 if(!on&&rootState.on){const t=rootState.theme;setTimeout(()=>{if(!rootState.on&&rootState.theme===t){rootState.theme=null;}},1200);}
 rootState.on=on;if(!rootState.theme&&tintMap.size){for(const c of tintMap.values()){c.width=1;c.height=1;}tintMap=new Map();rootState.tintPixels=0;}}
function tintOf(image){const T=rootState.theme;if(!T||!image)return null;const src=image.__storyworldStaticSource||image.__storyworldStaticTint,path=String(src?.path||image.src||image.path||'');if(!ROOT_ART.test(path))return null;
 const key=T.key+'|'+path+'|'+(src?.r55MaterialRect||'');let c=tintMap.get(key);if(c)return c;const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;if(!(w>0&&h>0)||grayBudget<=0||rootState.tintPixels+w*h>24e6)return null;grayBudget-=w*h;
 try{c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),A=T.P.a,B=T.P.b,rgb=(v,k=1)=>'rgba('+v[0]+','+v[1]+','+v[2]+','+k+')';
  if(T.mecha){g.filter='grayscale(1) contrast(1.7) brightness(.6)';g.drawImage(image,0,0);g.filter='none';g.globalCompositeOperation='multiply';g.fillStyle='rgb(112,124,142)';g.fillRect(0,0,w,h);g.globalCompositeOperation='screen';g.fillStyle=rgb(A,.12);g.fillRect(0,0,w,h);}
  else{g.drawImage(image,0,0);g.globalCompositeOperation='color';g.fillStyle=rgb(A);g.fillRect(0,0,w,h);g.globalCompositeOperation='soft-light';g.fillStyle=rgb(B,.35);g.fillRect(0,0,w,h);}
  g.globalCompositeOperation='destination-in';g.drawImage(image,0,0);
  c.__storyworldStaticSource=Object.freeze({...(src||{}),path,immutable:true,r111RootTheme:T.key});tintMap.set(key,c);rootState.tinted++;rootState.tintPixels+=w*h;return c;}catch(e){fail(e);return null;}}
function rootAccent(p,S){const T=rootState.theme;if(!T||!rootState.on)return;const {x,y,h}=heroFoot(p),A={a:T.P.a,b:T.P.b},lo=lowFx();rootState.draws++;
 S.draw('glow',A,x,y,h*1.6,h*.7,{alpha:.4,squash:.5});
 if(T.mecha){S.draw('circuit',A,x,y,h*1.7,h*1.7,{squash:.5,angle:time*.4,alpha:.55});
  const n=lo?2:4;for(let i=0;i<n;i++){const slot=Math.floor(time*14)+i*7,a=i/n*TAU+time*.8,x0=x+Math.cos(a)*h*.42,y0=y+Math.sin(a)*h*.12,x1=x+(rnd(slot,3)-.5)*h*.5,y1=y-h*(.45+.5*rnd(slot,4));
   S.along('bolt',A,x0,y0,x1,y1,h*.2,{frame:slot,alpha:.95,overHero:true});S.draw('glow',A,x1,y1,h*.3,h*.3,{alpha:.6,overHero:true});}
  for(let i=0;i<(lo?2:5);i++){const ph=(time*1.7+i/5)%1;S.draw('spark',A,x+(rnd(i,7)-.5)*h*.7,y-h*ph*.9,h*.16,h*.05,{angle:-1.2+rnd(i,8),alpha:1-ph,overHero:true});}}
 else if(T.elem==='fire'){S.draw('flame',A,x,y+h*.04,h*1.1,h*.75,{frame:Math.floor(time*12),alpha:.5});}
 else if(T.elem==='frost'){for(let i=0;i<(lo?3:6);i++){const a=i/6*TAU+.3;S.draw('shard',S.pal(A.b),x+Math.cos(a)*h*.45,y+Math.sin(a)*h*.16,h*.12,h*.3,{angle:Math.cos(a)*.5,alpha:.75});}}
 else if(T.elem==='shock'){const slot=Math.floor(time*12);S.along('bolt',S.pal(A.b),x-h*.35,y,x+h*.3,y-h*.6,h*.14,{frame:slot,alpha:.75,overHero:true});}
 else{S.draw('smoke',A,x,y-h*.1,h*1.4,h*.8,{angle:time*.3,alpha:.35});}}

// ---- install --------------------------------------------------------------------------------------
function install(){
 const tickBase=tick;tick=function(dt,...a){const r0=typeof player!=='undefined'&&player?finite(player.resonance,NaN):NaN;const out=tickBase.call(this,dt,...a);
  try{if(live()){footBudget=lowFx()?2:4;
   if(prefs.resonance777&&Number.isFinite(r0)&&Number.isFinite(player.resonance)&&player.resonance>r0&&player.resonance-r0<20){const want=Math.min(100,r0+(player.resonance-r0)*RES_GAIN);stats.resGain+=want-player.resonance;player.resonance=want;}
   applyRanged();autoDodge();guardTick(dt);samongTick();rootTick();faceTick();egoTick();fixDomText();if(prefs.props)spaceProps(room);}}catch(e){fail(e);}return out;};
 if(typeof updateHUD==='function'){const hudBase=updateHUD;updateHUD=function(...a){const r=hudBase.apply(this,a);try{resText();}catch(e){fail(e);}return r;};}
 if(typeof hurt==='function'){const hurtBase=hurt;hurt=function(damage,...a){if(prefs.guard&&live()&&player.guard&&Number.isFinite(damage)&&damage>0){const d=damage*GUARD_TAKEN/NATIVE_GUARD;guardState.blocked+=damage-d;damage=d;}return hurtBase.call(this,damage,...a);};}
 if(typeof toast==='function'){const toastBase=toast;toast=function(msg,...a){return toastBase.call(this,fixMsg(msg),...a);};}
 const heroBase=drawHero;drawHero=function(...a){const p=live()?player:null,ok=!!(p&&p.hp>0&&p.visible!==false&&Number.isFinite(p.x+p.y));const S=ok?SPR():null,ego=!!(S&&prefs.egoAura&&egoOn(p)),F=ego?palOf(p):null,I=ego?S.pal(F.b):null;
  const guardOn=!!(S&&prefs.guard&&p.guard);if(guardOn)try{scope({id:'r111:guard-back',kind:'effect',x:p.x,y:p.y,groundAligned:false},()=>{ctx.save();try{guardBack(p,S);}finally{ctx.restore();}});}catch(e){fail(e);}
  if(ego)try{scope({id:'r111:ego-back',kind:'effect',x:p.x,y:p.y,groundAligned:false},()=>{ctx.save();try{egoBack(p,S,F,I);}finally{ctx.restore();}});stats.egoDraws++;}catch(e){fail(e);}
  // 뒤로 빠지며 싸울 때 걷는 그림도 적 쪽을 보게, 그리는 동안만 이동 벡터를 적 방향으로 돌린다.
  let swap=null;if(ok&&faceFoe&&p.moving&&liveFoe(faceFoe)){const vx=finite(p.moveVX150),vy=finite(p.moveVY150),sp=Math.hypot(vx,vy);if(sp>.001){const dx=faceFoe.x-p.x,dy=faceFoe.y-p.y,d=Math.hypot(dx,dy)||1;swap=[vx,vy];p.moveVX150=dx/d*sp;p.moveVY150=dy/d*sp;}}
  let r;try{r=heroBase.apply(this,a);}finally{if(swap){p.moveVX150=swap[0];p.moveVY150=swap[1];}}
  if(ego)try{scope({id:'r111:ego-front',kind:'effect',x:p.x,y:p.y,groundAligned:false},()=>{ctx.save();try{egoFront(p,S,F,I);}finally{ctx.restore();}});}catch(e){fail(e);}
  if(guardOn)try{scope({id:'r111:guard-front',kind:'effect',x:p.x,y:p.y,groundAligned:false},()=>{ctx.save();try{guardFront(p,S);}finally{ctx.restore();}});}catch(e){fail(e);}
  if(ok&&S&&prefs.threadArt&&threadRank(p)>0)try{threadFront(p);}catch(e){fail(e);}
  if(ok&&S&&prefs.bossRoot&&rootState.theme&&rootState.on)try{scope({id:'r111:boss-root',kind:'effect',x:p.x,y:p.y,groundAligned:false},()=>{ctx.save();try{rootAccent(p,S);}finally{ctx.restore();}});}catch(e){fail(e);}
  return r;};
 const effectBase=drawEffect;drawEffect=function(e,...a){if(e&&prefs.samong&&e.type==='r111SamongCut'){try{scope({id:'r111:samong-cut:'+e.x.toFixed(2)+':'+e.y.toFixed(2),kind:'effect',x:e.x,y:e.y},()=>{ctx.save();try{samongCutFx(e);}finally{ctx.restore();}});}catch(err){fail(err);}return;}
  if(e&&e.type==='samongStormR75'&&samongOn()){let ok=false;try{ok=samongLine(e);}catch(err){fail(err);}if(ok)return;}
  if(prefs.threadArt&&e&&e.type==='threadSlashR63'&&e.threadR63&&SPR()){let mine=false;try{scope({id:'r111:thread-slash:'+(e.threadR63.seed??'')+':'+(e.threadR63.hitIndex??''),kind:'effect',x:e.x,y:e.y},()=>{ctx.save();try{mine=threadSlash(e);}finally{ctx.restore();}});}catch(err){fail(err);}
   if(mine)return withoutStrokes(()=>effectBase.call(this,e,...a));}return effectBase.call(this,e,...a);};
 if(typeof drawProp==='function'&&typeof sprite==='function'){const propBase=drawProp;drawProp=function(p,...a){const to=prefs.props&&p?.r111To;if(!to)return propDraw.call(this,p,...a);const ox=p.x,oy=p.y;p.x=to.x;p.y=to.y;try{return propDraw.call(this,p,...a);}finally{p.x=ox;p.y=oy;}};
   const propDraw=function(p,...a){if(!prefs.props||!p||typeof readyImage!=='function')return propBase.call(this,p,...a);
   const row=readyImage(p.path);if(!row)return propBase.call(this,p,...a);const f=footOf(p.r99Tree?'r99tree:'+p.r99Tree.kind:p.path,row);// R114: 흔들리는 나무 12장은 한 번 잰 밑동을 같이 쓴다(장마다 따로 재면 2~3px씩 들썩였다)if(!(f<.97))return propBase.call(this,p,...a);
   const shift=Math.min(.22,1-f)*finite(p.height,60)*Z(),spriteBase=sprite;
   sprite=function(path,x,y,...b){return spriteBase.call(this,path,x,path===p.path?y+shift:y,...b);};stats.footShifts++;
   try{return propBase.call(this,p,...a);}finally{sprite=spriteBase;}};}
 if(typeof makeRoom==='function'){const b=makeRoom;makeRoom=function(...a){const r=b.apply(this,a);try{spaceProps(r);}catch(e){fail(e);}return r;};}
 if(typeof hitEnemy==='function'){const hitBase=hitEnemy;hitEnemy=function(e,value,source,...rest){try{value=samongHit(e,value,source);}catch(err){fail(err);}return hitBase.call(this,e,value,source,...rest);};}
 if(typeof drawProjectile==='function'){const shotBase=drawProjectile;drawProjectile=function(p,...a){if(!prefs.shots||!p||p.friendly!==true||!live()||typeof project!=='function')return shotBase.call(this,p,...a);try{return shotDraw(shotBase,this,p,a);}catch(err){fail(err);return shotBase.call(this,p,...a);}};}
 installThreadAura();if(!installGray())setTimeout(()=>{try{installGray();}catch(e){fail(e);}},0);
}
try{install();}catch(e){fail(e);}

function settingsSection(){const host=document.getElementById('retroSettingsR98Combat')||document.getElementById('retroSettingsR93')||document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR111'))return;
 const s=document.createElement('section');s.id='retroSettingsR111';s.innerHTML='<h3>전투·오라·조형물 (R111)</h3>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r111-'+k+'"> '+LABELS[k]+'</label> ').join('');
 host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r111-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}

window.__STORYWORLD_PLAY_R111__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,resonance:{scale:RES_SCALE,gain:RES_GAIN,max:777,shown},ranged:RANGED,foot:path=>feet.get(path),sectorOf,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,faceFoe:faceFoe?.id||null,combatLeft:+(combatUntil-(typeof time==='number'?time:0)).toFixed(2),ego:live()?egoOn(player):false,threadRank:live()?threadRank(player):0,threadInstalled:!!window.__STORYWORLD_CAMPAIGN_R63R1__?.r111Thread,guard:{on:guardState.on,healed:Math.round(guardState.healed),blocked:Math.round(guardState.blocked),taken:GUARD_TAKEN,heal:GUARD_HEAL},shots:{...shotState},bossRoot:{...rootState,theme:rootState.theme&&{key:rootState.theme.key,boss:rootState.theme.boss,elem:rootState.theme.elem,mecha:rootState.theme.mecha}},samong:{...samongState,grayInstalled:!!window.StoryPhase1?.DrawCommands?.prototype?.r111Gray},ranged:{applied:rangedState.applied,dodges:rangedState.dodges,base:{...rangedState.base}},presentationOnly:true,resonanceGainChanged:true})});
})();
