/* R114 몹·보스 고유색과 환영 공격 (사용자 요청 2026-10-28 05:35~05:38)
 * ① 고유색·보조색: 몹·보스마다 자기 그림에서 가장 많이 쓰인 색(고유색)과 두 번째 색(보조색)을 쓴다
 *    (palette-r114-data.js, scripts/r114-mob-palette.py). 이름에 색이 들어간 몹·보스는 그 색이 고유색이다.
 *    그림의 색은 어둡고 탁해서 이펙트에 그대로 쓰면 보이지 않으므로, 빛나는 이펙트에는 같은 색상(hue)을
 *    밝고 진하게 올린 "발광색"을 쓴다(검은색 이름은 어두운 보라 연기 + 보조색 빛).
 *    - 보스 광역 스킬(R105 운석·불덩이·장판): 보스 팔레트 표를 고유색·보조색으로 바꾼다.
 *    - 몹 스킬 그림(R98/R99 예고·명중·시전 그림, R100 고유색 줄): 고유색에 가장 가까운 색 줄을 고른다.
 *    - 환영·던진 물체의 폭발(R113), 환영 기 모으기·꼬리: 고유색·보조색.
 * ② 환영 공격(R61 'echo' — 몹 모습이 날아오는 공격, 모든 몹이 사용):
 *    - 쓰기 전에 기를 모은다(준비 시간 +0.8초, 보스급 +0.6초, 고유색 빛이 몸으로 모여든다).
 *    - 데미지 ×1.9(보스급 ×1.5). 대신 같은 몹의 다음 던지기까지 4초 더 쉰다.
 *    - 환영이 풀려날 때 몹도 환영 방향으로 짧게 돌진한다(최대 2.4칸, 영웅 0.9칸 앞에서 멈춤, 벽에서 멈춤).
 *    - 첫 환영 뒤 두 번째 환영까지 45초(보스급 30초), 그다음부터 30초(보스급 20초) 동안 같은 몹은 환영을 쓰지 않는다
 *      (그사이 차례가 오면 물체 던지기로 넘긴다).
 * 체력·저장 형식·충돌·방 자료는 바꾸지 않는다. 설정 키 r114.combat. */
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_R114__||typeof tick!=='function')return;
const REV='R114-combat-3';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r114.combat';
const prefs={palette:true,echo:true,heroSize:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
function set(patch={}){for(const k of Object.keys(prefs))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}applyPalettes();return{...prefs};}
const stats={paletteHits:0,paletteMiss:0,bossPalettes:0,echoes:0,echoBlocked:0,dashes:0,charges:0,tints:0,tintedDraws:0,propSkipped:0,propThrows:0,weaponThrows:0,propsHidden:0,booms:0,thrownDraws:0,samongExtra:0,samongKills:0,camHolds:0,camAnchored:0,bodyScans:0,heroFits:0,heroFitK:1,heroSwaps:0,walkFrames:0};
let lastError=null,failures=0;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=(v,d=0)=>Number.isFinite(v)?v:d,TAU=Math.PI*2;
const now=()=>typeof time==='number'?time:0;
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const major=e=>!!(e?.boss||e?.midboss||e?.persona||e?.cosmic||e?.trial);
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on()?s:null;};
const scope=(o,fn)=>{if(typeof ctx!=='undefined'&&typeof ctx?.scope==='function')return ctx.scope(o,fn);return fn();};

// ---- ① 팔레트 ----------------------------------------------------------------------------------
const DATA=window.__STORYWORLD_PALETTE_R114_DATA__||{};
function rgb2hsv([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;}return[h,mx?d/mx:0,mx];}
function hsv2rgb([h,s,v]){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;const[r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return[r,g,b].map(t=>Math.round((t+m)*255));}
// 발광색: 같은 색상(hue)으로 밝고 진하게. 무채색(채도<0.1)은 밝은 회백색, 아주 어두운 이름색(검은)은 어두운 보라 빛.
function glow(c){const[h,s,v]=rgb2hsv(c);if(v<.28&&s<.6)return[150,96,190];if(s<.1)return hsv2rgb([h,0,Math.max(.86,v)]);return hsv2rgb([h,clamp(s*1.35+.12,.45,1),Math.max(.9,v)]);}
const cache=new WeakMap();
function entryOf(e){if(!e)return null;const f=e.profile?.frames?.idle,path=f?.path||e.path,rect=f?.assetFrame?.sourceRect;
 return DATA[e.nativeId]||(Array.isArray(rect)&&DATA[path+'#'+rect.join(',')])||DATA[path]||null;}
function palette(e){if(!e)return null;if(cache.has(e))return cache.get(e);const d=entryOf(e);let out=null;
 if(d){out=Object.freeze({p:d.p,s:d.s,gp:glow(d.p),gs:glow(d.s),src:d.src,dark:/검은/.test(d.src)});stats.paletteHits++;}else stats.paletteMiss++;
 cache.set(e,out);return out;}
const BUCKETS=()=>window.__STORYWORLD_POLISH_R100_DATA__?.sigColours||null;
function bucket(c){const B=BUCKETS();if(!B||!c)return null;let best=null,bd=1e9;for(const[k,v]of Object.entries(B)){const d=(v[0]-c[0])**2+(v[1]-c[1])**2+(v[2]-c[2])**2;if(d<bd){bd=d;best=k;}}return best;}
// R100 고유색 줄(이름 붙은 14색): 고유색의 발광색에 가장 가까운 줄
let polBase=null;
function installColourOf(){const P=window.__STORYWORLD_POLISH_R100__;if(!P||P.r114)return;polBase=P;
 window.__STORYWORLD_POLISH_R100__=Object.freeze({...P,r114:true,colourOf(e){if(prefs.palette){const pl=palette(e);if(pl){const b=pl.dark?'dark':bucket(pl.gp);if(b)return b;}}return P.colourOf(e);}});}
// R105 보스 광역 스킬 팔레트: 보스·중간보스 표를 고유색·보조색으로(기존 원소·모양은 유지)
const pristine=new Map();
function applyPalettes(){const B=window.__STORYWORLD_BOSS_FX_R105__;const PAL=B?.palette;if(!PAL||Object.isFrozen(PAL))return;
 for(const[k,d]of Object.entries(DATA)){if(k.includes('/'))continue;const was=PAL[k]||null;if(!pristine.has(k))pristine.set(k,was?{...was}:null);
  if(!prefs.palette){const o=pristine.get(k);if(o)PAL[k]=o;else delete PAL[k];continue;}
  if(!was&&!/boss|mb-|mid|persona|great|-b\d|lord/.test(k))continue;
  const fb=was||B.palOf({nativeId:k,name:d.name,id:k})||{elem:'corruption',style:'meteor'};
  PAL[k]={...fb,a:glow(d.p),b:glow(d.s),r114:true};stats.bossPalettes++;}}

// ---- ② 환영 공격 ---------------------------------------------------------------------------------
const F=()=>window.__STORYWORLD_FIELDS_R61__;
const echo=new WeakMap(); // e -> {count, readyAt}
const tracked=new Set();   // 진행 중인 환영 행동
function gateSteps(){const api=F();if(!api?.state)return;const t=now();
 for(const e of room.enemies){if(!e||e.hp<=0||e.spawnState!=='active')continue;let s;try{s=api.state(e);}catch(_){continue;}if(!s||!Number.isFinite(s.step))continue;const g=echo.get(e),wait=g&&t<g.readyAt;
  // R61 차례: 잡몹 ['echo','prop'][step%2], 보스급 ['field','echo','prop'][step%3]
  if(major(e)){if(wait&&s.step%3===1){s.step++;stats.echoBlocked++;}continue;}
  // 잡몹은 조형물을 던지지 않는다(보스·중간보스만): 늘 환영 차례로 두고, 환영이 쉬는 동안은 R61 던지기 자체를 미룬다.
  if(s.step%2===1){s.step++;stats.propSkipped++;}
  if(wait&&Number.isFinite(s.next)&&s.next<g.readyAt){s.next=g.readyAt;stats.echoBlocked++;}}}
function adopt(){const api=F();const t=now();
 for(const e of room.enemies){const a=e?.r61Action;if(!a||a.r114||a.room!==room||a.cancelled)continue;
  if(a.kind==='prop'){if(major(e))try{adoptThrow(e,a);}catch(err){fail(err);a.r114={throw:'error'};}else a.r114={throw:'mob'};continue;}
  if(a.kind!=='echo')continue;a.r114={charge:major(e)?.6:.8,dashed:false};
  const extra=a.r114.charge;a.releaseAt+=extra;a.endAt+=extra;e.r61BusyUntil=a.endAt;
  if(Number.isFinite(a.damage))a.damage*=major(e)?1.5:1.9;
  const g=echo.get(e)||{count:0,readyAt:0};g.count++;g.readyAt=a.endAt+(g.count===1?(major(e)?30:45):(major(e)?20:30));echo.set(e,g);
  try{const s=api?.state?.(e);if(s&&Number.isFinite(s.next))s.next=Math.max(s.next,a.endAt)+4;}catch(_){}
  tracked.add({e,a});stats.echoes++;}}
function stepEcho(dt){const t=now();
 for(const row of [...tracked]){const{e,a}=row;if(!e||e.hp<=0||a.cancelled||a.room!==room||t>a.endAt+.6){tracked.delete(row);continue;}
  if(t<a.releaseAt){if(!row.chargeSeen){row.chargeSeen=true;stats.charges++;}continue;}
  if(!a.r114.dashed){a.r114.dashed=true;const d=Math.hypot(player.x-e.x,player.y-e.y),len=clamp(d-.9,0,2.4);if(len>.2){row.dash={left:len,ux:Math.cos(a.angle),uy:Math.sin(a.angle),until:t+.24};stats.dashes++;}}
  if(row.dash&&row.dash.left>0&&t<=row.dash.until+.1&&typeof moveActor==='function'){const sp=row.dash.left/Math.max(.05,row.dash.until-t+dt),step=Math.min(row.dash.left,sp*dt),ox=e.x,oy=e.y;
   try{moveActor(e,row.dash.ux*step,row.dash.uy*step,finite(e.radius,.3));}catch(err){fail(err);}const moved=Math.hypot(e.x-ox,e.y-oy);row.dash.left-=step;if(moved<step*.3)row.dash.left=0;}}}
// 기 모으기·환영 꼬리 그림
function drawCharge(e){const row=[...tracked].find(r=>r.e===e);if(!row)return;const a=row.a,t=now(),S=SPR();if(!S||t>=a.releaseAt||typeof project!=='function')return;
 const pl=palette(e)||{gp:[200,120,255],gs:[255,230,250]},span=Math.max(.2,a.releaseAt-a.start),k=clamp((t-a.start)/span,0,1),q=project(e.x,e.y),z=typeof zoom==='number'?zoom:1,T=typeof TILE==='number'?TILE:34,h=(typeof actorHeight==='function'?actorHeight():60)*(major(e)?1.6:1);
 const P=S.pal(pl.gp,pl.gs),cy=q.y-h*.5;
 scope({id:'r114:charge:'+e.id,kind:'effect',x:e.x,y:e.y},()=>{ctx.save();try{
  const r=T*z*(1.9-1.3*k);S.draw('ring',P,q.x,cy,r*2,r*1.1,{alpha:.25+.55*k,angle:t*3});
  for(let i=0;i<5;i++){const ang=t*2.4+i*TAU/5,rr=r*(1.1-.2*((t*3+i)%1));S.draw('flare',P,q.x+Math.cos(ang)*rr,cy+Math.sin(ang)*rr*.55,T*z*.35,T*z*.35,{alpha:.35+.5*k,angle:ang});}
  S.draw('glow',P,q.x,cy,h*(.5+.6*k),h*(.6+.7*k),{alpha:.18+.42*k,overHero:true});}finally{ctx.restore();}});}
function drawEchoTrail(b){if(!b?.r61Shot||b.r61Shot.kind!=='echo'||b.dead)return;const S=SPR();if(!S||typeof project!=='function')return;const pl=palette(b.r61Shot.owner);if(!pl)return;
 const q=project(b.x,b.y),pr=project(b.x-b.vx*.12,b.y-b.vy*.12),z=typeof zoom==='number'?zoom:1,P=S.pal(pl.gp,pl.gs);
 scope({id:'r114:echo-trail:'+(b.r61Shot.token??''),kind:'effect',x:b.x,y:b.y},()=>{ctx.save();try{S.along('smoke',P,pr.x,pr.y-18*z,q.x,q.y-18*z,22*z,{alpha:.35});S.draw('glow',P,q.x,q.y-18*z,40*z,34*z,{alpha:.5});}finally{ctx.restore();}});}

// ---- ③ 보스·몹 그림 이펙트(FINAL42) 고유색 ------------------------------------------------------------
// 보스 명중 때 땅에서 솟는 흰 Y자(F117 봉인 파편)와 회색 소용돌이(F114)·라벤더 불꽃(F250) 같은 그림 이펙트는
// 모든 보스·몹이 같은 색·같은 크기로 써서 반복티가 났다. 그려진 명령을 받아 주인(보스·몹)의 고유색·보조색으로
// 물들인 아틀라스(절반 해상도, 최대 10장 보관)로 바꾸고, 같은 주인 안에서도 매번 크기·기울기·좌우가 조금씩 다르게 한다.
const ENEMY_FX=new Set('F215 F243 F213 F091 F249 F110 F098 F250 F114 F261 F111 F094 F247 F112 F101 F095 F244 F097 F248 F130 F096 F116 F090 F117 F217 F115'.split(' '));
const BOSS_ONLY=new Set(['F117','F114','F250','F090']);
const tints=new Map();
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0)/4294967296;};
function fxOwner(o){const list=typeof room!=='undefined'&&room?.enemies||[];if(o.nativeOwner){const e=list.find(e=>e&&e.id===o.nativeOwner);if(e)return e;}
 const id=fxId(o);let best=null,bd=BOSS_ONLY.has(id)?7:4.5;for(const e of list){if(!e||e.hp<=0&&!(e.deadAt>now()-1))continue;let d=Math.hypot(e.x-o.x,e.y-o.y);if(major(e))d-=BOSS_ONLY.has(id)?3:.6;if(d<bd){bd=d;best=e;}}return best;}
function fxId(o){if(o._r114id!==undefined)return o._r114id;const m=/effects\/(\d+)\//.exec(String(o.r88AtlasPath||''));return o._r114id=m?'F'+m[1].padStart(3,'0'):null;}
function tintAtlas(image,path,pl){const key=path+'|'+pl.gp+'|'+pl.gs;let c=tints.get(key);if(c){tints.delete(key);tints.set(key,c);return c;}
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;if(!(iw>0&&ih>0))return null;
 c=document.createElement('canvas');c.width=Math.max(8,Math.round(iw/2));c.height=Math.max(8,Math.round(ih/2));const g=c.getContext('2d');if(!g)return null;
 const css=(v,k=1)=>'rgba('+v[0]+','+v[1]+','+v[2]+','+k+')';
 g.drawImage(image,0,0,c.width,c.height);g.globalCompositeOperation='multiply';g.fillStyle=css(pl.gp);g.fillRect(0,0,c.width,c.height);
 g.globalCompositeOperation='soft-light';g.fillStyle=css(pl.gs,.55);g.fillRect(0,0,c.width,c.height);
 g.globalCompositeOperation='screen';g.fillStyle=css(pl.gp,.12);g.fillRect(0,0,c.width,c.height);
 g.globalCompositeOperation='destination-in';g.drawImage(image,0,0,c.width,c.height);
 c.__storyworldStaticSource=Object.freeze({path:path+'#r114-tint-'+pl.gp.join('-')+'-'+pl.gs.join('-'),immutable:true,r114Tint:true});
 tints.set(key,c);stats.tints++;while(tints.size>10){const k=tints.keys().next().value,old=tints.get(k);tints.delete(k);old.width=old.height=1;}return c;}
function tintCommands(rec,owner,start){if(!prefs.palette||!owner?.r88Final42)return;const id=fxId(owner);if(!id||!ENEMY_FX.has(id))return;const e=fxOwner(owner),pl=e&&palette(e);if(!pl)return;
 const r=hash(owner.id||''),r2=hash((owner.id||'')+'b'),jit=!owner.groundAligned;
 for(let i=start;i<(rec.commands?.length||0);i++){const c=rec.commands[i];if(c?.kind!=='image'||!c.image||c.immutableTint?.r114Tint)continue;
  const t=tintAtlas(c.image,String(c.sourcePath||''),pl);if(!t)continue;const iw=c.imageSize[0],ih=c.imageSize[1],kx=t.width/iw,ky=t.height/ih;
  c.image=t;c.immutableTint=t.__storyworldStaticSource;c.sourcePath=t.__storyworldStaticSource.path;c.sourceRect=[c.sourceRect[0]*kx,c.sourceRect[1]*ky,c.sourceRect[2]*kx,c.sourceRect[3]*ky];c.imageSize=[t.width,t.height];
  if(jit&&Array.isArray(c.points)&&c.points.length===4){const P=c.points,bx=(P[2][0]+P[3][0])/2,by=(P[2][1]+P[3][1])/2,sc=.78+.5*r,ang=(r2-.5)*.7,cs=Math.cos(ang)*sc,sn=Math.sin(ang)*sc;
   let Q=P.map(([x,y])=>{const dx=x-bx,dy=y-by;return[bx+dx*cs-dy*sn,by+dx*sn+dy*cs];});if(r2>.5)Q=[Q[1],Q[0],Q[3],Q[2]];c.points=Q;}
  stats.tintedDraws++;}}
function installTint(){const DC=window.StoryPhase1?.DrawCommands;if(!DC?.prototype||DC.prototype.__r114)return false;const base=DC.prototype.scope;
 DC.prototype.scope=function(owner,fn){if(!owner?.r88Final42||!prefs.palette)return base.call(this,owner,fn);const start=this.commands?.length||0;try{return base.call(this,owner,fn);}finally{try{tintCommands(this,owner,start);}catch(e){fail(e);}}};
 Object.defineProperty(DC.prototype,'__r114',{value:true});return true;}

// ---- ④ 던지기: 조형물은 보스급만·원래 크기·던진 자리에서 사라짐, 보스 무기 던지기 --------------------------
const WEAP=window.__STORYWORLD_WEAPONS_R114_DATA__||{};
const throwInfo=new Map(); // action token -> {kind:'prop'|'weapon', height, prop, weapon, col}
const hidden=[];
const weaponCanvas=new Map();
function weaponArt(w){if(weaponCanvas.has(w.path))return weaponCanvas.get(w.path);const row=typeof readyImage==='function'?readyImage(w.path):null;if(!row?.image)return null;
 const[x,y,cw,ch]=w.rect,c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');g.drawImage(row.image,x,y,cw,ch,0,0,cw,ch);
 // 잘라 낸 가장자리가 네모로 보이지 않게 테두리를 부드럽게 지운다.
 g.globalCompositeOperation='destination-in';const gr=g.createRadialGradient(cw/2,ch/2,Math.min(cw,ch)*.32,cw/2,ch/2,Math.max(cw,ch)*.62);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,cw,ch);
 c.__storyworldStaticSource=Object.freeze({path:w.path+'#r114-weapon-'+w.rect.join('-'),immutable:true});weaponCanvas.set(w.path,c);return c;}
function propSource(a){const P=a.prop;if(!P)return null;const pools=[room?.exploration?.scenery59?.props||[],room?.props||[]];
 for(const list of pools)for(const p of list){if(!p||p.path!==P.path)continue;if(P.id!=null?p.id===P.id:Math.hypot(p.x-P.x,p.y-P.y)<.05)return p;}return null;}
const hideable=p=>!!p&&!p.solid&&!p.terrainWall&&!p.blocking&&p.visible!==false&&!/door|wall|gate|stair|문|벽|계단/i.test(String(p.visualHospitalFrame||p.kind||p.name||''));
function hideProp(p){if(!p||p.r114Hidden)return;p.r114Hidden={visible:Object.prototype.hasOwnProperty.call(p,'visible')?p.visible:undefined,room};p.visible=false;hidden.push(p);stats.propsHidden++;}
function restoreProps(){for(const p of hidden.splice(0)){const h=p.r114Hidden;if(!h)continue;if(h.visible===undefined)delete p.visible;else p.visible=h.visible;delete p.r114Hidden;}}
function adoptThrow(e,a){const g=echo.get(e)||{count:0,readyAt:0};g.props=(g.props||0)+1;echo.set(e,g);
 const w=WEAP[e.nativeId],src=propSource(a),canHide=hideable(src),useWeapon=!!w&&(!canHide||g.props%2===0),pl=palette(e);
 const H=typeof actorHeight==='function'?actorHeight():60,body=H*(e.boss?2.05:1)*(Number(e.defScale)||1);
 const info={kind:useWeapon?'weapon':'prop',weapon:useWeapon?w:null,prop:useWeapon?null:src,path:a.path,col:pl?.gp||null,col2:pl?.gs||null,
  height:useWeapon?Math.max(H*.45,w.size*body):Math.max(H*.5,finite(src?.height,H*.9)),body,owner:e};
 a.r114={throw:info.kind};throwInfo.set(a.token,info);if(throwInfo.size>40)throwInfo.delete(throwInfo.keys().next().value);
 if(Number.isFinite(a.damage))a.damage*=useWeapon?1.35:1.15;
 if(!useWeapon&&canHide)hideProp(src);stats[useWeapon?'weaponThrows':'propThrows']++;}
function adoptShots(){if(typeof projectiles==='undefined')return;for(const b of projectiles){const m=b?.r61Shot;if(!m||b.r114Seen||b.dead)continue;b.r114Seen=true;const pl=palette(m.owner);if(pl)b.r114Col=pl.gp;
 const info=throwInfo.get(m.token);if(!info||m.kind!=='prop')continue;b.r114Throw=info;const T=typeof TILE==='number'?TILE:34;b.radius=clamp(info.height/T*.16,.24,.62);
 b.r114OnPop=(x,y)=>boom(x,y,info);}}
function boom(x,y,info){const R=window.__STORYWORLD_PLAY_R113__,k=clamp(info.height/90,.8,2.6),col=info.col||[255,170,90];
 if(R?.popAt){R.popAt(x,y,true,col);for(let i=0;i<Math.round(k);i++){const a=i*2.4;R.popAt(x+Math.cos(a)*.35*k,y+Math.sin(a)*.35*k,true,i%2?info.col2||col:col);}}
 if(typeof fx==='function'&&typeof VFX!=='undefined'&&VFX?.burst)try{fx('sigil',x,y,{asset:VFX.burst,size:.7+.35*k,life:.5});}catch(_){}
 if(typeof shakeCamera==='function')try{shakeCamera(.12*k);}catch(_){}stats.booms++;}
function drawThrown(b){const info=b.r114Throw;if(!info||typeof project!=='function')return false;const q=project(b.x,b.y),z=typeof zoom==='number'?zoom:1,
 fl=Math.max(.12,b.r61Shot.flight||.6),u=clamp(b.age/fl,0,1),lift=Math.sin(Math.PI*u)*info.height*z*.35+info.height*z*.25,h=info.height*z,spin=b.age*(info.kind==='weapon'?13:4.5)*(b.vx<0?-1:1);
 if(typeof shadow==='function')try{shadow(q.x,q.y,Math.max(10*z,h*.3),{alpha:.7,lift:.4});}catch(_){}
 scope({id:'r114:thrown:'+b.id,kind:'effect',x:b.x,y:b.y},()=>{ctx.save();try{
  const S=SPR(),pl=info.col?{a:info.col,b:info.col2||info.col}:null;if(S&&pl)S.draw('glow',S.pal(pl.a,pl.b),q.x,q.y-lift,h*1.1,h*.9,{alpha:.35});
  if(info.kind==='weapon'){const c=weaponArt(info.weapon);if(!c)return;const w=h*c.width/c.height;ctx.translate(q.x,q.y-lift);ctx.rotate(spin);ctx.drawImage(c,-w/2,-h/2,w,h);}
  else if(typeof drawImage==='function'&&typeof readyImage==='function'){const row=readyImage(info.path);if(!row)return;const cr=row.crop||{w:row.image.naturalWidth,h:row.image.naturalHeight};drawImage(info.path,q.x,q.y-lift,h*cr.w/cr.h,h,{angle:spin*.35});}
 }finally{ctx.restore();}});stats.thrownDraws++;return true;}
function drawWindup(e,a){const info=throwInfo.get(a.token);if(!info||typeof project!=='function')return;const t=now(),u=clamp((t-a.start)/Math.max(.2,a.releaseAt-a.start),0,1),z=typeof zoom==='number'?zoom:1,q=project(e.x,e.y),h=info.height*z;
 scope({id:'r114:windup:'+e.id,kind:'effect',x:e.x,y:e.y},()=>{ctx.save();try{
  if(info.kind==='weapon'){const c=weaponArt(info.weapon);if(!c)return;const w=h*c.width/c.height,hx=q.x+(info.weapon.hand[0]-.5)*info.body*z*.55*(Math.cos(a.angle)<0?-1:1),hy=q.y-info.body*z*(1-info.weapon.hand[1])-h*.15*u;
   ctx.translate(hx,hy);ctx.rotate(-.9*u*(Math.cos(a.angle)<0?-1:1));ctx.globalAlpha*=.5+.5*u;ctx.drawImage(c,-w/2,-h/2,w,h);}
  else{const P=info.prop||a.prop||a.origin,v=clamp(u/.7,0,1),x=P.x+(e.x-P.x)*v,y=P.y+(e.y-P.y)*v,p=project(x,y),row=readyImage?.(info.path);if(!row)return;const cr=row.crop||{w:row.image.naturalWidth,h:row.image.naturalHeight};
   drawImage(info.path,p.x,p.y-h*.5-info.body*z*.55*v,h*cr.w/cr.h,h,{angle:Math.sin(t*9)*.08*v,alpha:.95});}
 }finally{ctx.restore();}});}

// ---- ⑤ 사몽선(R75 사몽 폭풍의 빛줄기) 상향 (사용자 요청 2026-10-28 06:05) ---------------------------------------
// 일반몹은 사몽선에 맞으면 즉사한다(보스·중간보스·페르소나 등 보스급은 원래 피해 그대로).
// 사몽 패시브(R103 확률 발동 패시브, 현재 영웅의 W·E·R 단계 합 0~21)가 오를수록 사몽선이 늘어난다:
// 0.12초마다 R75가 2줄을 긋고, R114가 단계 3마다 1줄씩 더한다. 상한 +4줄(합 6줄), 동시에 떠 있는 추가 줄 24개(간소화 VFX 12개).
const SAM=()=>window.__STORYWORLD_SAMONG_R75__,GROW=()=>window.__STORYWORLD_GROWTH_R103__;
const extraRays=[];let extraNext=0,extraSerial=0;
function samongLevel(){try{const g=GROW()?.state?.();const h=typeof player!=='undefined'?player?.hero:null;if(!g||!h)return 0;let n=0;for(const k of ['w','e','r'])n+=Math.max(0,Math.min(7,Number(g.procs?.[h+':'+k])||0));return n;}catch(_){return 0;}}
const extraPerWave=()=>Math.min(4,Math.floor(samongLevel()/3));
function extraBlade(at){if(!room?.exploration||typeof blocked!=='function')return;const B=room.exploration.bounds||[1,1,29,29],cx=(B[0]+B[2])/2,cy=(B[1]+B[3])/2,R=Math.hypot(B[2]-B[0],B[3]-B[1])*.58,
 n=++extraSerial,ang=n*2.399963+1.1,off=Math.sin(n*1.618+.7)*R*.62,dx=Math.cos(ang),dy=Math.sin(ang),a={x:cx-dx*R-dy*off,y:cy-dy*R+dx*off},b={x:cx+dx*R-dy*off,y:cy+dy*R+dx*off},count=Math.min(512,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.38)),runs=[];let first=null,last=null;
 for(let i=0;i<=count;i++){const p={x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count},safe=!blocked(p.x,p.y,.12,room);if(safe){if(!first)first=p;last=p;}if((!safe||i===count)&&first){if(Math.hypot(first.x-last.x,first.y-last.y)>.35&&runs.length<8)runs.push({a:first,b:last});first=last=null;}}
 if(!runs.length||typeof effects==='undefined'||effects.length>=150)return;const id='r114-'+n,effect={type:'samongStormR75',x:cx,y:cy,age:Math.max(0,now()-at),life:.54,r75Storm:{id,start:at,life:.54,runs,ownerId:'solo',cycle:'r114'}};
 effects.push(effect);extraRays.push({id,start:at,runs,effect,checked:false,room});stats.samongExtra++;}
function samongTick(){const S=SAM();if(!S?.active?.()||!solo()){if(extraRays.length){for(const r of extraRays.splice(0)){const i=effects.indexOf(r.effect);if(i>=0)effects.splice(i,1);}}extraNext=0;return;}
 const t=now(),k=extraPerWave(),cap=(typeof settings!=='undefined'&&settings.lowFx)?12:24;
 for(let i=extraRays.length-1;i>=0;i--){const r=extraRays[i];if(t-r.start>=.54||r.room!==room){extraRays.splice(i,1);const j=effects.indexOf(r.effect);if(j>=0&&r.room!==room)effects.splice(j,1);}}
 if(k>0){if(t-extraNext>.3)extraNext=t;let waves=0;while(t+1e-7>=extraNext&&waves++<2){const at=extraNext;extraNext+=.12;for(let i=0;i<k&&extraRays.length<cap;i++)extraBlade(at);}}
 for(const r of extraRays){const age=t-r.start;if(r.checked||age<.18)continue;r.checked=true;if(age>.34)continue;
  for(const e of (room.enemies||[]).slice(0,96)){if(!e||e.hp<=0||e.spawnState!=='active'||e.deadRecorded)continue;if(!r.runs.some(q=>typeof segmentDistance==='function'&&segmentDistance(e.x,e.y,q.a.x,q.a.y,q.b.x,q.b.y)<=.42+(e.combatProfile?.hurtbox?.r||.25)))continue;
   const value=major(e)?(typeof attackPower==='function'?attackPower()*.055:0):e.hp+1;if(value>0&&typeof hitEnemy==='function')try{if(hitEnemy(e,value,{kind:'hero-samong-storm-r114',ability:'samong',hero:player.hero,eventId:'r114-storm:'+r.id+':'+e.id})&&!major(e))stats.samongKills++;}catch(err){fail(err);}}}}
function installSamong(){if(typeof hitEnemy!=='function')return;const base=hitEnemy;
 hitEnemy=function(e,value,meta,...a){if(meta?.kind==='hero-samong-storm-r75'&&e&&!major(e)&&e.hp>0&&Number.isFinite(e.hp)){value=Math.max(Number(value)||0,e.hp+1);stats.samongKills++;}return base.call(this,e,value,meta,...a);};}

// ---- ⑥ 원거리 영웅 카메라 (사용자 요청 2026-10-28 06:14) -------------------------------------------------
// 원거리 영웅이 실검무(R74 춤)로 적 옆에 잠깐 옮겨졌다가 돌아올 때, 카메라(R81 안정 추적)는 실제 위치를 따라가서
// 적에게 갔다가 돌아오는 것처럼 보였다. R113이 춤 동안 그리는 기준점(dance.anchor)을 두고 있으므로 카메라도 그 점을 따른다.
// 춤이 아닌 짧은 순간이동(0.6초 안에 4칸 넘게 갔다가 1.5칸 안으로 돌아옴)도 같은 방식으로 카메라를 붙잡는다.
const RANGED_HEROES=new Set(['seoha','michaela','hunter','gunner','lauren']);
const camHold={x:null,y:null,until:0,last:null};
function cameraAnchor(){if(!live()||!RANGED_HEROES.has(player.hero))return null;let a=null;try{a=window.__STORYWORLD_PLAY_R113__?.dance?.()?.anchor||null;}catch(_){}
 if(a&&Number.isFinite(a.x+a.y))return a;const t=now(),L=camHold.last;
 if(L&&t-L.t<.25){const jump=Math.hypot(player.x-L.x,player.y-L.y);if(jump>4&&!camHold.until){camHold.x=L.x;camHold.y=L.y;camHold.until=t+.6;stats.camHolds++;}}
 camHold.last={x:player.x,y:player.y,t};
 if(camHold.until){if(t>camHold.until||Math.hypot(player.x-camHold.x,player.y-camHold.y)<1.5){camHold.until=0;return null;}return{x:camHold.x,y:camHold.y};}return null;}
function installCamera(){if(typeof cameraTick!=='function')return;const base=cameraTick;
 cameraTick=function(dt,...a){let A=null;try{A=cameraAnchor();}catch(e){fail(e);}if(!A)return base.call(this,dt,...a);const ox=player.x,oy=player.y;player.x=A.x;player.y=A.y;stats.camAnchored++;try{return base.call(this,dt,...a);}finally{player.x=ox;player.y=oy;}};}

// ---- ⑦ 영웅 크기 일관성 (사용자 요청 2026-10-28 06:14, 환도 기준) ---------------------------------------------
// 영웅 그림은 장면마다(8방향 정지 그림, 걷기·공격 아틀라스, 기존 동작 그림) 몸이 차지하는 비율이 달라서, 같은 높이로 그려도
// 몸이 커졌다 작아졌다 했다. 그림마다 창·활 같은 가는 선을 뺀 "몸 높이"를 한 번 재고(알파 행 너비가 가장 넓은 행의 12% 이상인 행),
// 그려진 몸 높이가 환도 몸 높이(actorHeight의 BODY배)와 같아지도록 발밑 기준으로 0.85~1.15배 안에서 맞춘다.
const BODY=.98; // 환도 걷기·공격 아틀라스 실측: 그려진 몸 52.7px / actorHeight 53.7px (zoom .813)
const bodyCache=new WeakMap();
function bodyFrac(image,rect){let m=bodyCache.get(image);if(!m){m=new Map();bodyCache.set(image,m);}const key=rect.map(v=>Math.round(v)).join(',');if(m.has(key))return m.get(key);
 let out=null;try{const[sx,sy,sw,sh]=rect,H=64,W=Math.max(8,Math.round(64*sw/sh)),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,sx,sy,sw,sh,0,0,W,H);
  const d=g.getImageData(0,0,W,H).data,rows=[];for(let y=0;y<H;y++){let n=0;for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>100)n++;rows.push(n);}const mx=Math.max(...rows);if(mx>0){const th=mx*.12;let a=-1,b=-1;for(let y=0;y<H;y++)if(rows[y]>=th){if(a<0)a=y;b=y;}out=(b-a+1)/H;}
  c.width=c.height=1;}catch(_){out=null;}m.set(key,out);stats.bodyScans++;return out;}
const HERO_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/walk-|r93\/idle\/idle-|r119\/heroes\/|r121\/heroes\//; // R121: R119 뒷모습·R121 정리본도 영웅 그림으로 본다
// 같은 영웅인데 공격 첫 장면 등 한두 프레임만 예전 그림 묶음(normalized/directions, gunner/player_idle)이 끼어들어
// 옷·체형이 다른 인물이 깜박였다. 같은 영웅·같은 방향으로 마지막에 그린 지금 묶음(hero_direction334/337/338) 그림으로 바꾼다.
// 이동 중에 쓰던 actions-v3126 '달리기' 그림도 다른 화풍(창을 내지르는 돌진 자세 등)이라 네온·라우렌이 걸을 때 딴사람처럼 보였다.
// 이동 그림도 지금 묶음의 같은 방향 그림으로 바꾸고, 걸음은 아래 walkHero가 몸을 흔들어 표현한다.
const OLD_ART=/heroes\/normalized\/directions\/|heroes\/normalized\/gunner\/(?:player_idle|run_)|r121\/heroes\/gunner\/(?:player_idle|run_)|heroes\/normalized\/actions-v3126\/[a-z]+-move-/,NEW_ART=/hero_direction33[478]\/|r119\/heroes\/[a-z]+-n\.|r91\/walk\/walk-|r93\/idle\/idle-|hero-authored-/,STATIC_ART=/hero_direction33[478]\/|r119\/heroes\/[a-z]+-n\./;
const DIR_FILE={left:'w',right:'e',front:'s',back:'n'};
function setPath(hero,dir){const f=DIR_FILE[dir];if(!f)return null;if(f==='e'||f==='w')return'assets/hero_direction334/'+hero+'/'+f+'.webp';return(hero==='lauren'?'assets/hero_direction338/':'assets/hero_direction337/')+hero+'/'+f+'.webp';}
// R91 걷기·R93 서 있기 그림이 이 영웅에게 실제로 그려진 뒤에만 바꾼다. 그 묶음이 없으면(색인을 못 받은 환경 등)
// 모든 장면이 예전 그림이라 한 장만 바꾸는 쪽이 오히려 섞여 보이고, R83 몸 그림 일치 약속도 그대로 지킨다.
const OVERLAY_ART=/r91\/walk\/walk-|r93\/idle\/idle-/,overlayHeroes=new Set();
const heroSize=new Map();
const heroLast=new Map();
function unifyHero(rec,start){let best=null,bh=0;for(let i=start;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
 if(!best)return;const key=player.hero+'|'+player.direction+'|'+(player.moving?'m':'s'),path=String(best.sourcePath||'');
 if(OVERLAY_ART.test(path))overlayHeroes.add(player.hero);
 if(NEW_ART.test(path)){const P=best.points;if(/r91\/walk\//.test(path))return;/* R121: 걷기 묶음 한 칸(여백 포함 칸 전체)을 기억해 멈춘 뒤에 크게 다시 쓰던 것을 막는다 */heroSize.set(player.hero,{w:P[1][0]-P[0][0],h:P[3][1]-P[0][1]});heroLast.set(key,{image:best.image,sourcePath:best.sourcePath,immutableTint:best.immutableTint,sourceRect:best.sourceRect.slice(),imageSize:best.imageSize.slice(),w:P[1][0]-P[0][0],h:P[3][1]-P[0][1]});return;}
 if(!OLD_ART.test(path)||!overlayHeroes.has(player.hero))return;let L=heroLast.get(key);
 if(!L)L=heroLast.get(player.hero+'|'+player.direction+'|'+(player.moving?'s':'m'));
 if(!L){const sp=setPath(player.hero,player.direction),row=sp&&typeof readyImage==='function'?readyImage(sp):null,sz=heroSize.get(player.hero)||{w:bh,h:bh};if(!row){if(sp&&typeof addImage==='function')try{addImage(sp);}catch(_){}return;}
  const iw=row.image.naturalWidth||512,ih=row.image.naturalHeight||512;L={image:row.image,sourcePath:sp,immutableTint:null,sourceRect:[0,0,iw,ih],imageSize:[iw,ih],w:Math.abs(sz.h)*iw/ih,h:Math.abs(sz.h)};heroLast.set(key,L);}const P=best.points,fx=(P[2][0]+P[3][0])/2,fy=Math.max(P[2][1],P[3][1]);
 Object.assign(best,{image:L.image,sourcePath:L.sourcePath,immutableTint:L.immutableTint,sourceRect:L.sourceRect.slice(),imageSize:L.imageSize.slice(),points:[[fx-L.w/2,fy-L.h],[fx+L.w/2,fy-L.h],[fx+L.w/2,fy],[fx-L.w/2,fy]],r114Swap:true});if(best.owner&&best.owner.bodyPath)best.owner.bodyPath=L.sourcePath;stats.heroSwaps++;}
// 지금 묶음 정지 그림과 기억사수 전용 그림(normalized/gunner)은 여백이 커서 좁은 보정으로는 다른 영웅보다 작거나 컸다.
const WIDE_FIT=/hero_direction33[478]\/|heroes\/normalized\/gunner\/|r119\/heroes\/|r121\/heroes\//;
const fitByArt={};
function fitHero(rec,start){try{unifyHero(rec,start);}catch(e){fail(e);}if(!Array.isArray(rec?.commands)||typeof actorHeight!=='function')return;let best=null,bh=0;
 for(let i=start;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!HERO_ART.test(String(c.sourcePath||'')))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
 if(!best||bh<8)return;const f=bodyFrac(best.image,best.sourceRect);if(!f)return;const z=typeof zoom==='number'?zoom:1,want=actorHeight()*BODY/(rec.dpr?1:1),now_=bh*f;let k=want/now_;
 if(!Number.isFinite(k))return;fitByArt[String(best.sourcePath).replace(/^.*assets\//,'').replace(/\/[^/]*$/,'')]=Math.round(k*1000)/1000;k=best.r114Swap||WIDE_FIT.test(String(best.sourcePath||""))?clamp(k,.6,1.7):clamp(k,.85,1.15);if(Math.abs(k-1)<.035)return;
 const P=best.points,fx=(P[2][0]+P[3][0])/2,fy=(P[2][1]+P[3][1])/2;
 for(let i=start;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!HERO_ART.test(String(c.sourcePath||'')))continue;c.points=c.points.map(([x,y])=>[fx+(x-fx)*k,fy+(y-fy)*k]);}
 stats.heroFits++;stats.heroFitK=Math.round(k*1000)/1000;}
// 걷기 아틀라스가 없는 영웅(서하·네온·미카엘라·라우렌·사냥꾼·기억사수)은 8방향 정지 그림이 미끄러지기만 했다.
// 이동 중에는 걸음에 맞춰 몸이 살짝 오르내리고(키의 3.5%), 걸음마다 좌우로 기울고(±1.7°), 디딜 때 조금 눌린다(2%).
const walk={phase:0,x:null,y:null,amp:0};
function walkHero(rec,start,dt){const moving=!!player.moving&&!(finite(player.attackAnim)>0)&&!(finite(player.skillAnim)>0);
 if(walk.x!=null){const d=Math.hypot(player.x-walk.x,player.y-walk.y);if(d<1.2)walk.phase+=d*Math.PI*1.45;}walk.x=player.x;walk.y=player.y;
 walk.amp+=((moving?1:0)-walk.amp)*Math.min(1,dt*10);if(walk.amp<.02)return;
 let best=null,bh=0;for(let i=start;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!STATIC_ART.test(String(c.sourcePath||'')))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}
 if(!best)return;const P=best.points,fx=(P[2][0]+P[3][0])/2,fy=(P[2][1]+P[3][1])/2,a=walk.amp,ph=walk.phase,lift=Math.abs(Math.sin(ph))*bh*.035*a,tilt=Math.sin(ph)*.03*a,sq=1-.02*a*Math.max(0,Math.cos(2*ph)),cs=Math.cos(tilt),sn=Math.sin(tilt);
 best.points=P.map(([x,y])=>{const dx=(x-fx)*(2-sq),dy=(y-fy)*sq;return[fx+dx*cs-dy*sn,fy-lift+dx*sn+dy*cs];});stats.walkFrames++;}

// ---- 설치 -----------------------------------------------------------------------------------------
function install(){
 installColourOf();applyPalettes();installTint();installSamong();installCamera();
 const tickBase=tick;tick=function(dt,...a){const ok=live()&&solo()&&prefs.echo&&Number.isFinite(dt)&&dt>0;if(ok)try{gateSteps();}catch(e){fail(e);}
  const r=tickBase.call(this,dt,...a);if(ok)try{adopt();stepEcho(dt);adoptShots();}catch(e){fail(e);}if(live())try{samongTick();}catch(e){fail(e);}return r;};
 if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
  // 보스급 조형물·무기 던지기 준비 동작은 R114가 원래 크기로 그린다(R61의 작은 준비 그림은 그 동안 숨긴다).
  const act=e?.r61Action,own=act&&act.kind==='prop'&&act.r114&&throwInfo.has(act.token)&&now()<act.releaseAt&&!act.cancelled;if(own)act.kind='r114-prop';let r;
  try{r=base.call(this,e,...a);}finally{if(own)act.kind='prop';}
  if(own)try{drawWindup(e,act);}catch(err){fail(err);}
  if(prefs.echo&&tracked.size)try{drawCharge(e);}catch(err){fail(err);}return r;};}
 if(typeof drawProjectile==='function'){const base=drawProjectile;drawProjectile=function(b,...a){if(b?.r114Throw)try{if(drawThrown(b))return;}catch(err){fail(err);}if(prefs.palette&&b?.r61Shot)try{drawEchoTrail(b);}catch(err){fail(err);}return base.call(this,b,...a);};}
 if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){if(!prefs.heroSize||typeof ctx==='undefined'||!Array.isArray(ctx.commands))return base.apply(this,a);const st=ctx.commands.length;try{return base.apply(this,a);}finally{try{fitHero(ctx,st);}catch(e){fail(e);}try{const t=now(),dt=clamp(t-(walk.t??t),0,.1);walk.t=t;walkHero(ctx,st,dt);}catch(e){fail(e);}}};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(...a){tracked.clear();try{restoreProps();}catch(e){fail(e);}const r=base.apply(this,a);try{applyPalettes();}catch(e){fail(e);}return r;};}
}
try{install();}catch(e){fail(e);}
window.__STORYWORLD_COMBAT_R114__=Object.freeze({revision:REV,set,prefs:()=>({...prefs}),palette,glow,bucket,
 echo:e=>{const g=echo.get(e);return g?{...g}:null;},stats:()=>({...stats,tracked:tracked.size,hidden:hidden.length,tintCache:tints.size,fitByArt:{...fitByArt},failures,lastError}),weapons:()=>Object.keys(WEAP),restoreProps,samong:()=>({level:samongLevel(),extraPerWave:extraPerWave(),extra:extraRays.length})});
})();
