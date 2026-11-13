/* R975 환도 E 「유영 일섬」 보스 우선 · 좌우 7연 다단히트 — 사용자 2026-11-13 01:32Z
 *  "환도영웅 일섬스킬 보스몹있으면 보스몹부터 우선 공격및 7번좌우로 일섬들어가면서 7다단히트".
 *  E 돌진(백은 유영보, 엔진·WER) 자체는 바꾸지 않는다. R590 이 돌진 0.32초 뒤 지나온 길을 한 번 베던 「유영 일섬」 피해(공격력×0.6)를
 *  여기서 넘겨받아 7타로 나눈다(1~6타 각 1/8, 7타 마무리 2/8 → 총합은 그대로 ×0.6).
 *   - 대상: 돌진 끝에서 3.5칸 안(벽 너머 제외)에 보스·중간보스가 있으면 가장 가까운 보스를 첫 대상으로 잡고, 타마다 보스를 먼저 때린다.
 *           지나온 길 위 적(R590 과 같은 반경)도 그대로 함께 7타.
 *           보스·중간보스가 범위 안에 없으면(일반몹뿐) 넘겨받지 않는다 → R590 원래 한 방 일섬(사용자 02:17Z "일반몹한테는 그전처럼").
 *   - 연출: 0.07초 간격 7번, 첫 대상 몸통을 가로지르는 일섬이 왼쪽→오른쪽, 오른쪽→왼쪽 번갈아(Dots CX-0062HW 일섬 시트 hwando-e-delayed-flash).
 *           7타는 조금 크게 + 황금 섬광. 대상이 죽으면 다음 대상 자리로 옮겨 남은 타를 잇는다.
 *   - 소리: 타마다 짧은 칼날 적중음 1개(assets/r975/sfx/ilseom-1~7, R785 환도 적중음 재가공, 음높이 차츰 올림·좌우 번갈아 팬, 7타는 묵직하게).
 *           종류를 7개로 나눠 엔진의 같은 종류 간격 제한(.38초)에 막히지 않게 한다.
 *  협동(R62 mode≠off)·사몽 EGO 중에는 R590 규칙 그대로(넘겨받지 않음). 판정은 엔진 hitEnemy·damageable3·clearLine.
 *  hitEnemy 표지: r975Multi:true, multiHit:{i,n:7} — 다른 다단·도트 분할(R972)은 이 표지가 있으면 다시 쪼개지 않는다.
 *  끄기: localStorage['storyworld.r975.hwandoIlseom']='{"on":false}' → R590 원래 한 방 일섬.
 *  Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_ILSEOM_R975__)return;
const REV='R975-hwando-ilseom-3',KEY='storyworld.r975.hwandoIlseom';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const W8=Object.freeze([1,1,1,1,1,1,2]);
const CFG=Object.freeze({hits:7,gap:.07,weights:W8,bossRange:3.5,tilt:.3,cutLife:.26,finalLife:.4,maxVis:10,maxDraws:24});
const SFX=Object.freeze([1,2,3,4,5,6,7].map(i=>Object.freeze({kind:'r975Ilseom'+i,path:'assets/r975/sfx/ilseom-'+i+'.ogg'})));
const SHEET=Object.freeze({path:'assets/r590/hwando-e-delayed-flash.webp',cell:256,cols:6,frames:24,pivot:[17,132],len:223,th:90,hit:7,lift:1.7,crop:[0,80,256,184]});
const PAL=Object.freeze({a:Object.freeze([214,222,234]),b:Object.freeze([244,248,255])}),GOLD=Object.freeze({a:Object.freeze([255,198,72]),b:Object.freeze([255,232,170])});
const stats={normalPassed:0,casts:0,bossFirst:0,hits:0,damage:0,sounds:0,cuts:0,hushed:0,cancelled:0,draws:0,coopSkipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const fin=v=>typeof v==='number'&&Number.isFinite(v),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const T=()=>typeof time==='number'&&fin(time)?time:0;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const isHw=()=>typeof player!=='undefined'&&!!player&&player.hero==='hwando'&&player.hp>0;
const line=(a,b)=>typeof clearLine!=='function'||clearLine(a,b,room);
const foes=()=>{try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}};
const okFoe=e=>!!e&&e.hp>0&&fin(e.x)&&fin(e.y);
const isBoss=e=>!!(e&&(e.boss||e.midboss||e.miniBoss||e.samongBoss||e.sinBoss||e.majorBoss||e.bossR104));
const SP=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s?.on?.()?s:null;};
const H=()=>{const h=typeof actorHeight==='function'?actorHeight():60;return fin(h)&&h>0?h:60;};
const rng=v=>{try{const g=window.__STORYWORLD_SAMONG_SURGE_R571__;const r=g?.range?Number(g.range(v)):v;return fin(r)&&r>0?Math.min(r,v*2):v;}catch(_){return v;}};
const asHero=(id,fn)=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__;return D&&typeof D.asHero==='function'?D.asHero(id,fn):fn();};
// 선분 a→b 에서 점 e 에 가장 가까운 점
function near(a,b,e){const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy,t=L2>1e-9?clamp(((e.x-a.x)*dx+(e.y-a.y)*dy)/L2,0,1):0;return {x:a.x+dx*t,y:a.y+dy*t};}
// ---- 대상 고르기 ---------------------------------------------------------------------------------------------
function pickTargets(a,b,radius){const all=foes().filter(okFoe);let boss=null,bd=Infinity;const path=[];const br=rng(CFG.bossRange);
 for(const e of all){const c=near(a,b,e),d=Math.hypot(e.x-c.x,e.y-c.y);
  if(d<radius+(e.radius||0)&&line(c,e))path.push(e);
  if(isBoss(e)){const db=Math.hypot(e.x-b.x,e.y-b.y);if((db<=br+(e.radius||0)||d<=br)&&db<bd&&(line(b,e)||line(c,e))){bd=db;boss=e;}}}
 const list=boss?[boss,...path.filter(e=>e!==boss)]:[];
 return {list,boss};}
// ---- 7연 일섬 ------------------------------------------------------------------------------------------------
const seqs=[],vis=[];let lastCuts=[],lastT=null;
const SENT={type:'r975-hwando-ilseom',x:0,y:0,age:0,life:Infinity,r975Sentinel:true};
// 늘 effects 맨 끝(가장 나중에 = 위에) — 적중 섬광보다 베기 선이 위에 보이게
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i===effects.length-1&&i>=0)return;if(i>=0)effects.splice(i,1);SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function clearAll(){if(seqs.length)stats.cancelled+=seqs.length;seqs.length=0;vis.length=0;disarm();}
const snap=()=>({room:typeof room!=='undefined'?room:null,player:typeof player!=='undefined'?player:null,zone:typeof zone!=='undefined'?zone:null});
const valid=j=>on&&isHw()&&(typeof room==='undefined'||j.room===room)&&j.player===player&&(typeof zone==='undefined'||zone===j.zone);
function strike(e,dmg,q,i){if(typeof hitEnemy!=='function'||!(dmg>0)||!fin(dmg))return false;if(typeof damageable3==='function'&&!damageable3(e))return false;
 const old=e.hp,ok=hitEnemy(e,dmg,{kind:'story-hwando-ilseom-r975',attackKind9:'skill',friendly:true,owner:'hero',sourceHero:'hwando',sourceSlot:'e',attackId9:'r975:'+q.id+':'+i,r975:'ilseom',r975Multi:true,multiHit:{i,n:CFG.hits}});
 if(ok&&old>e.hp){stats.hits++;stats.damage+=old-e.hp;try{if(typeof floatText==='function')floatText(Math.round(old-e.hp),e.x,e.y);}catch(_){}}return ok;}
function playHit(i){try{if(typeof sound==='function'){const r=sound(SFX[i-1].kind);if(r&&typeof r.catch==='function')r.catch(()=>{});stats.sounds++;}}catch(e){fail(e);}}
// 엔진·덧씌우기가 적중마다 남기는 섬광(burst·e568HeroImpact·pxfSprite)이 0.07초 간격으로 7번 겹치면 흰 덩어리가 되어 좌우 베기가 안 보인다(헤드리스 실측)
// → 첫 타와 마무리 7타만 남기고 2~6타의 그 섬광은 걷어 낸다(피·피격 깜빡임·숫자·소리는 그대로).
const QUIET=new Set(['burst','e568HeroImpact','pxfSprite']);
function hush(n0){try{if(typeof effects==='undefined'||!Array.isArray(effects))return;for(let i=effects.length-1;i>=n0;i--){const f=effects[i];if(f&&QUIET.has(f.type)){effects.splice(i,1);stats.hushed++;}}}catch(e){fail(e);}}
function step(q){const i=++q.n,wsum=W8.reduce((s,v)=>s+v,0),dmg=q.pw*q.mult*W8[i-1]/wsum;let focus=null;const n0=typeof effects!=='undefined'&&Array.isArray(effects)?effects.length:0;
 for(const e of q.list){if(!okFoe(e))continue;const c=near(q.a,q.b,e);if(!line(c,e)&&!line(q.b,e))continue;if(strike(e,dmg,q,i)&&!focus)focus=e;}
 if(i>1&&i<CFG.hits)hush(n0);
 if(!focus){q.done=true;return;}
 const cut={n:i,dir:i%2?1:-1,target:focus.id!=null?focus.id:null,x:focus.x,y:focus.y,size:isBoss(focus)?1.35:1,big:i===CFG.hits,t0:T()};
 q.cuts.push(cut);lastCuts=q.cuts;stats.cuts++;vis.push({...cut,life:cut.big?CFG.finalLife:CFG.cutLife});while(vis.length>CFG.maxVis)vis.shift();
 playHit(i);arm();if(i>=CFG.hits)q.done=true;}
// R590 이 늦은 일섬 순간에 부른다. true 를 돌려주면 R590 은 한 방 피해를 넣지 않는다.
function take(o){try{if(!on||!isHw()||!solo())return false;if(!o||!o.a||!o.b||![o.a.x,o.a.y,o.b.x,o.b.y,o.pw,o.mult].every(fin)||!(o.pw>0))return false;
  // 사용자 02:17Z: 7번 베기는 보스·중간보스한테만. 범위 안에 보스가 없으면 넘겨받지 않는다 → R590 원래 한 방 일섬.
  const radius=fin(o.radius)&&o.radius>0?o.radius:.6,{list,boss}=pickTargets(o.a,o.b,radius);if(!boss){stats.normalPassed++;return false;}stats.casts++;stats.bossFirst++;
  const q={id:String(o.id||stats.casts),a:{x:o.a.x,y:o.a.y},b:{x:o.b.x,y:o.b.y},pw:o.pw,mult:o.mult,list,n:0,done:false,t0:T(),j:snap(),cuts:[]};lastCuts=q.cuts;
  asHero('hwando',()=>step(q));if(!q.done){seqs.push(q);while(seqs.length>4)seqs.shift();}arm();return true;}catch(e){fail(e);return false;}}
function tickSeqs(){const t=T();for(let k=seqs.length-1;k>=0;k--){const q=seqs[k];if(!valid(q.j)){seqs.splice(k,1);stats.cancelled++;continue;}
  let guard=0;while(!q.done&&t>=q.t0+q.n*CFG.gap-1e-9&&guard++<CFG.hits)asHero('hwando',()=>step(q));if(q.done)seqs.splice(k,1);}}
// ---- 그리기 --------------------------------------------------------------------------------------------------
function sheet(){try{const got=typeof readyImage==='function'?readyImage(SHEET.path):null;return got?.image||null;}catch(e){fail(e);return null;}}
let budget=0;
function strip(im,fr,x,y,ang,sx,sy,a,dark){const C=SHEET.cell,K=SHEET.crop;fr=clamp(Math.floor(fr),0,SHEET.frames-1);const u0=(fr%SHEET.cols)*C,v0=Math.floor(fr/SHEET.cols)*C,cw=K[2]-K[0],ch=K[3]-K[1];
 if(![x,y,ang,sx,sy].every(fin)||budget<=0)return;budget--;ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(fin(a)?a:0,0,1);ctx.filter=dark?'brightness(0.18)':'brightness('+SHEET.lift+')';
  ctx.translate(dark?x+2:x,dark?y+3:y);ctx.rotate(ang);ctx.scale(sx,Math.cos(ang)<0?-sy:sy);ctx.drawImage(im,u0+K[0],v0+K[1],cw,ch,K[0]-SHEET.pivot[0],K[1]-SHEET.pivot[1],cw,ch);stats.draws++;}catch(e){fail(e);}finally{ctx.restore();}}
function drawAll(){if(typeof project!=='function')return;const t=T(),h=H(),lo=low(),im=sheet(),S=SP();budget=lo?Math.round(CFG.maxDraws*.5):CFG.maxDraws;
 for(const v of vis){const age=t-v.t0,k=age/v.life;if(!(k>=0&&k<1))continue;const q=project(v.x,v.y);if(!q||!fin(q.x)||!fin(q.y))continue;
  const sz=v.size*(v.big?1.3:1),L=h*2.4*sz,ang=v.dir>0?CFG.tilt:Math.PI-CFG.tilt,cx=q.x,cy=q.y-h*.45*v.size,sx0=cx-Math.cos(ang)*L/2,sy0=cy-Math.sin(ang)*L/2,
   fade=k<.4?1:1-smooth((k-.4)/.6);
  if(im){const fr=SHEET.hit+k*12,sx=L/SHEET.len,sy=h*(v.big?1.3:1.05)*sz/SHEET.th;if(!lo)strip(im,fr,sx0,sy0,ang,sx,sy,.55*fade,true);strip(im,fr,sx0,sy0,ang,sx,sy,fade,false);
   // 칼날 심(은빛, 7타는 황금): 시트 몸통이 회색이라 어두운 보스 몸 위에서 묻히지 않게 0.05초에 그어지는 얇은 밝은 줄
   if(S&&budget>0&&k<.7){budget--;const g=smooth(age/.05),ex=sx0+Math.cos(ang)*L*g,ey=sy0+Math.sin(ang)*L*g;if([ex,ey].every(fin))S.along('slashline',v.big?GOLD:PAL,sx0,sy0,ex,ey,h*(v.big?.16:.11)*sz,{alpha:fade,blend:'screen',overHero:true});}}
  else if(S&&budget>0){budget--;const ex=sx0+Math.cos(ang)*L*smooth(age/.05),ey=sy0+Math.sin(ang)*L*smooth(age/.05);if([sx0,sy0,ex,ey].every(fin))S.along('iai-cut',PAL,sx0,sy0,ex,ey,h*.3*sz*(1-.4*k),{alpha:.9*fade,blend:'screen'});}
  if(S&&!lo&&budget>0&&age<.12){budget--;const r=h*(v.big?.95:.45)*sz;S.draw('flare',v.big?GOLD:PAL,cx,cy,r,r,{alpha:(v.big?.7:.45)*(1-age/.12),blend:'screen'});}}}
// ---- 소리 등록 -----------------------------------------------------------------------------------------------
function applySfx(){try{if(typeof soundProfiles==='undefined'||!soundProfiles)return;for(const s of SFX)soundProfiles[s.kind]=[{key:'r975-'+s.kind,path:s.path,gain:s.kind==='r975Ilseom7'?.95:.8,r541:true}];}catch(e){fail(e);}}
let warmed=false;function warm(){try{if(warmed||!on||typeof audioBuffer!=='function'||typeof audioUnlocked==='undefined'||!audioUnlocked||!isHw())return;warmed=true;for(const s of SFX)try{Promise.resolve(audioBuffer(s.path)).catch(()=>{});}catch(_){}}catch(_){}}
// ---- 설치 ----------------------------------------------------------------------------------------------------
try{
 applySfx();
 if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);applySfx();return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on)drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const t=T();lastT=t;if(seqs.length)tickSeqs();
   for(let i=vis.length-1;i>=0;i--)if(t-vis[i].t0>=vis[i].life||t<vis[i].t0-1)vis.splice(i,1);
   if(seqs.length||vis.length)arm();else disarm();if(!warmed)warm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){clearAll();return base.apply(this,a);};}
 try{SP()?.warm?.(PAL,['iai-cut','slashline','flare']);SP()?.warm?.(GOLD,['slashline','flare']);}catch(_){}
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)clearAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HWANDO_ILSEOM_R975__=Object.freeze({revision:REV,config:CFG,sfx:SFX,on:()=>on,set,take,isBoss,
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,active:seqs.length,vis:vis.length,lastCuts:lastCuts.map(c=>({n:c.n,dir:c.dir,target:c.target,big:c.big})),directListeningVerified:false})});
})();
