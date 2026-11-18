// R160 — 전투 연출 세 가지(사용자 2026-10-31):
//  ① "모든영웅들 일반공격에 연속이펙트 … 공격이 여러번 적중하면 적중이펙트나 콤보효과로 차별점, 기본공격도 여러개 이펙트, 색감은 통일"
//     · 기본공격이 적에게 맞으면 그 자리에 영웅 색(R102 팔레트) 한 벌로 세 겹 이펙트가 0.05초 간격으로 이어 나온다(베기 줄 → 불꽃 → 섬광).
//     · 1.4초 안에 이어 맞히면 연타 단계가 오른다: 3타부터 퍼지는 고리, 5타마다 '연타 폭발'(큰 섬광 + 두 겹 고리 + 사방 불꽃 + 연타 수 글씨).
//     · 기본공격 판정: basicAttack 안에서 일어난 적중, 그 안에서 쏜 투사체(r160Basic 표시), EGO 기본공격(attackKind9:'basic'). 피해·판정·저장은 그대로.
//  ② "사몽시 나오던 선들도 재등장 단, 단순도형선 느낌이 아니라 플레이어 색에 맞는 그래픽 얇은 레이저 빛 느낌"
//     · R139 가 숨긴 사몽 폭풍 선(R75·R114)을 다시 그린다 — 영웅 색 얇은 빛줄기(바깥 번짐 + 밝은 심 + 흐르는 불꽃 + 양 끝 섬광, 더하기 합성).
//       선 피해는 원래대로(R75 선 피해는 R139 가 계속 막고 궁극기 파동이 대신한다). 보이는 것만 바뀐다.
//  ③ "사몽 이펙트 그림 나오고 왼쪽 창 위에 그 이펙트 이미지 사몽 지속시간 동안 보이게"
//     · 사몽이 켜져 있는 동안 왼쪽 아래 영웅 창 바로 위에 그 영웅의 사몽(궁극기) 이펙트 그림과 남은 시간 고리·초를 띄운다.
//  설정 키 storyworld.r160.combat {combo,laser,samongIcon}. 협동 모드·서사 장면에서는 쉰다.
(()=>{'use strict';
if(window.__STORYWORLD_COMBAT_R160__)return;
const REV='R160-combat-1',KEY='storyworld.r160.combat',CHAIN_GAP=1.4,MAX=48,TAU=Math.PI*2;
let prefs={combo:true,laser:true,samongIcon:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={basicHits:0,chainMax:0,bursts:0,drawn:0,lasers:0,laserFallback:0,iconShows:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const rnd=(s,i)=>{const x=Math.sin(s*12.9898+i*78.233)*43758.5453;return x-Math.floor(x);};
const T=()=>typeof time==='number'?time:0;
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const live=()=>typeof started!=='undefined'&&started&&typeof player==='object'&&!!player&&typeof room!=='undefined'&&!!room;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const SILVER={a:[226,232,240],b:[255,255,255]};
const palOf=h=>window.__STORYWORLD_HERO_FX_R102__?.PALETTE?.[h]||SILVER;
const pb=F=>SPR()?.pal?.(F.b)||F;
const P=(x,y,z=0)=>{if(z>0){const v=window.__STORYWORLD_PLAY_R115__?.place?.(x,y,z);if(v)return v;}const q=project(x,y);return{x:q.x,y:q.y-z};};
const rgb=(c,a=1)=>'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
const scope=(o,f)=>{if(typeof ctx.scope==='function')ctx.scope(o,f);else f();};

// ---- ① 기본공격 연타 --------------------------------------------------------------------------
const list=[],SENT={type:'r160-combat',x:0,y:0,age:0,life:Infinity,r160Sentinel:true};
let inBasic=0,chain=0,lastHitT=-9,lastStepT=-9,serial=0,frameHits=0,frameT=-1;
const isBasic=s=>(inBasic>0&&(s==null||typeof s!=='object'||(!s.kind&&!s.ability&&!s.attackKind9)))||s?.attackKind9==='basic'||s?.r160Basic===true;
function onBasicHit(e){const t=T();if(t-lastHitT>CHAIN_GAP)chain=0;if(t-lastStepT>.12){chain++;lastStepT=t;}lastHitT=t;stats.basicHits++;if(chain>stats.chainMax)stats.chainMax=chain;
 if(frameT!==t){frameT=t;frameHits=0;}if(++frameHits>(lowFx()?2:4))return;// 한 번에 여러 적을 베어도 이펙트는 몇 개만
 if(list.length>=MAX)list.shift();const burst=chain>=5&&chain%5===0&&frameHits===1;if(burst){stats.bursts++;try{window.__STORYWORLD_PIXELFX_R163__?.play?.('crit-hit',e.x,e.y,{k:.7,z:H()*.45});}catch(_){}}
 list.push({id:'r160:'+(++serial),x:e.x,y:e.y,t:0,life:burst?.85:.5,n:chain,burst,F:palOf(player.hero),seed:Math.random()*100,side:chain%2?1:-1});
 if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}
function drawHit(e,h){const S=SPR(),F=e.F,u=e.t/e.life,lo=lowFx(),k=1+Math.min(4,e.n-1)*.12,c=P(e.x,e.y,h*.45),g=P(e.x,e.y);
 if(!S){const a=1-u;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgb(F.a,a);ctx.lineWidth=2;ctx.beginPath();ctx.arc(c.x,c.y,h*(.15+.35*u)*k,0,TAU);ctx.stroke();return;}
 // 세 겹: 베기 줄(0) → 불꽃(0.05) → 섬광(0.1). 연타가 오를수록 조금씩 커지고 각도가 번갈아 바뀐다.
 const v0=e.t/.22;if(v0<1)S.draw('slashline',F,c.x,c.y,h*1.15*k,h*.2,{angle:e.side*(.55+.12*(e.n%3)),alpha:1-v0});
 const v1=(e.t-.05)/.3;if(v1>0&&v1<1){const n=lo?3:5;for(let i=0;i<n;i++){const ang=rnd(e.seed,i)*TAU,d=h*(.1+.45*smooth(v1));S.draw('spark',i%2?pb(F):F,c.x+Math.cos(ang)*d,c.y+Math.sin(ang)*d*.6,h*.32,h*.08,{angle:ang,alpha:1-v1});}}
 const v2=(e.t-.1)/.3;if(v2>0&&v2<1)S.draw('flare',pb(F),c.x,c.y,h*(.5+.4*v2)*k,h*(.5+.4*v2)*k,{angle:e.seed+v2*2,alpha:(1-v2)*.9});
 if(e.n>=3){const v3=(e.t-.04)/.4;if(v3>0&&v3<1)S.draw('ring',F,g.x,g.y,h*(.5+1.6*v3)*k,h*(.25+.8*v3)*k,{alpha:(1-v3)*.85});}
 if(e.burst){const v=e.t/.8;S.draw('flare',F,c.x,c.y,h*2.6*(.5+v),h*2.6*(.5+v),{angle:v*3,alpha:1-v});S.draw('ring',pb(F),g.x,g.y,h*(1+3.2*v),h*(.5+1.6*v),{alpha:1-v});S.draw('ring',F,g.x,g.y,h*(.6+2.2*v),h*(.3+1.1*v),{alpha:(1-v)*.8});
  const n=lo?5:10;for(let i=0;i<n;i++){const ang=i*TAU/n+e.seed,d=h*(.2+1.4*smooth(v));S.draw('spark',F,c.x+Math.cos(ang)*d,c.y+Math.sin(ang)*d*.55,h*.5,h*.1,{angle:ang,alpha:1-v});}
  if(v<.8){ctx.globalAlpha=1-smooth((v-.4)/.4);ctx.font='700 '+Math.round(h*.32)+'px Georgia,serif';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillStyle=rgb(F.b);ctx.fillText(e.n+' 연타',c.x,c.y-h*(.7+.4*v));ctx.shadowBlur=0;}}}
function drawCombo(){if(!list.length||typeof ctx==='undefined'||!ctx)return;const h=H();
 for(const e of list){if(e.t>e.life)continue;ctx.save();try{scope({id:e.id,kind:'effect',x:e.x,y:e.y,r160:true},()=>drawHit(e,h));stats.drawn++;}catch(err){fail(err);}finally{ctx.restore();}}}

// ---- ② 사몽 선: 영웅 색 얇은 레이저 ------------------------------------------------------------
function laser(eff){const ray=eff.r75Storm;if(!ray||!Array.isArray(ray.runs)||!live())return false;const F=palOf(player.hero),S=SPR(),age=T()-ray.start,active=age>=.18&&age<=.34,
 a=age<.18?.3+age/.18*.5:Math.max(0,1-(age-.18)/.36),h=H(),lo=lowFx();if(a<=0)return true;let n=0;
 for(const run of ray.runs){if(n++>=(lo?12:32))break;const p=project(run.a.x,run.a.y),q=project(run.b.x,run.b.y),len=Math.hypot(q.x-p.x,q.y-p.y);if(!(len>1))continue;
  ctx.save();try{scope({id:'r160:laser:'+ray.id+':'+n,kind:'effect',x:run.b.x,y:run.b.y,groundAligned:true},()=>{
   if(S){S.along('line',F,p.x,p.y,q.x,q.y,h*(active?.26:.16),{alpha:a*.6});S.along('line',F,p.x,p.y,q.x,q.y,h*(active?.09:.06),{alpha:a});S.along('line',pb(F),p.x,p.y,q.x,q.y,h*(active?.035:.025),{alpha:a*.9});
    if(active&&!lo){const m=(age-.18)/.16,x=p.x+(q.x-p.x)*m,y=p.y+(q.y-p.y)*m;S.draw('flare',pb(F),x,y,h*.5,h*.5,{angle:age*20,alpha:a});S.along('spark',F,p.x+(q.x-p.x)*Math.max(0,m-.18),p.y+(q.y-p.y)*Math.max(0,m-.18),x,y,h*.1,{alpha:a*.9});}
    S.draw('glow',F,p.x,p.y,h*.45,h*.45,{alpha:a*.7});S.draw('glow',F,q.x,q.y,h*.45,h*.45,{alpha:a*.7});stats.lasers++;}
   else{ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.strokeStyle=rgb(F.a,a*.35);ctx.lineWidth=active?5:3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
    ctx.strokeStyle=rgb(F.b,a);ctx.lineWidth=active?1.6:1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();stats.laserFallback++;}});}finally{ctx.restore();}}
 return true;}

// ---- ③ 사몽 이펙트 그림: 왼쪽 영웅 창 위 ------------------------------------------------------
let icon=null,iconFor='',dur=0;
function ultPath(h){try{if(typeof E568_HERO_VFX!=='undefined'&&E568_HERO_VFX[h]?.ultimate)return E568_HERO_VFX[h].ultimate;}catch(_){}try{return window.StoryPhase1?.CURRENT_PUBLIC_HERO_DATA?.heroActions?.[h]?.r||'';}catch(_){return '';}}
function iconCss(){if(document.getElementById('r160Css'))return;const s=document.createElement('style');s.id='r160Css';
 s.textContent='#samongIconR160{position:absolute;left:18px;bottom:calc(var(--bottom) + 50px);z-index:7;width:78px;pointer-events:none;text-align:center;font:700 11px/1.2 sans-serif;color:#f4e6c4;text-shadow:0 1px 3px #000}'
 +'#samongIconR160[hidden]{display:none}#samongIconR160 .ring{position:relative;width:78px;height:78px;border-radius:50%;padding:4px;background:conic-gradient(var(--c,#e6d29a) calc(var(--p,1)*360deg),rgba(20,24,32,.75) 0)}'
 +'#samongIconR160 .in{width:100%;height:100%;border-radius:50%;background:radial-gradient(#2a2433,#0b0d14);overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 10px #000}'
 +'#samongIconR160 img{width:92%;height:92%;object-fit:contain;filter:drop-shadow(0 0 6px var(--c,#e6d29a))}#samongIconR160 b{display:block;margin-top:3px}'
 +'body.mobile-live-r63 #samongIconR160{left:max(10px,env(safe-area-inset-left));bottom:auto;top:96px;width:58px}body.mobile-live-r63 #samongIconR160 .ring{width:58px;height:58px}';document.head.appendChild(s);}
function iconTick(){try{const on=prefs.samongIcon&&live()&&solo()&&player.hp>0&&player.samong>0;
 if(!on){if(icon)icon.hidden=true;dur=0;iconFor='';return;}
 iconCss();if(!icon){icon=document.createElement('div');icon.id='samongIconR160';icon.setAttribute('aria-live','polite');icon.innerHTML='<div class="ring"><div class="in"><img alt=""></div></div><b></b>';document.body.appendChild(icon);}
 if(iconFor!==player.hero||player.samong>dur){iconFor=player.hero;dur=Math.max(dur,player.samong);const src=ultPath(player.hero);const im=icon.querySelector('img');if(src&&im.getAttribute('src')!==src)im.setAttribute('src',src);
  const F=palOf(player.hero);icon.style.setProperty('--c',rgb(F.a));if(icon.hidden)stats.iconShows++;}
 icon.hidden=false;icon.style.setProperty('--p',String(clamp(player.samong/(dur||1),0,1)));icon.querySelector('b').textContent='사몽 '+player.samong.toFixed(1)+'초';}catch(e){fail(e);}}
setInterval(iconTick,100);

// ---- 설치 ------------------------------------------------------------------------------------
try{
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...a){inBasic++;try{return base.apply(this,a);}finally{inBasic--;}};}
 if(typeof makeShot==='function'){const base=makeShot;makeShot=function(x,y,ang,sp,dmg,opt,...r){if(inBasic>0&&opt&&typeof opt==='object'&&opt.friendly&&opt.owner==='hero')opt={...opt,r160Basic:true};return base.call(this,x,y,ang,sp,dmg,opt,...r);};}
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,source,...r){const ok=base.call(this,e,value,source,...r);try{if(ok!==false&&prefs.combo&&e&&live()&&solo()&&isBasic(source))onBasicHit(e);}catch(err){fail(err);}return ok;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){
  if(e&&e.type==='r160-combat'){try{drawCombo();}catch(err){fail(err);}return;}
  if(e&&e.type==='samongStormR75'&&prefs.laser&&solo()&&typeof project==='function'){let ok=false;try{ok=laser(e);}catch(err){fail(err);}if(ok)return;}
  return base.call(this,e,...a);};}
 if(typeof tick==='function'){const base=tick;tick=function(dt,...a){const r=base.call(this,dt,...a);try{const d=Number.isFinite(dt)?clamp(dt,0,.1):0;for(const e of list)e.t+=d;for(let i=list.length-1;i>=0;i--)if(list[i].t>list[i].life)list.splice(i,1);
  if(!list.length&&typeof effects!=='undefined'){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}else if(list.length&&typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}
  if(T()-lastHitT>CHAIN_GAP)chain=0;}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);list.length=0;chain=0;return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_COMBAT_R160__=Object.freeze({revision:REV,set,isBasic,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},chain,effects:list.length,icon:icon?{shown:!icon.hidden,src:icon.querySelector('img')?.getAttribute('src')||'',text:icon.querySelector('b')?.textContent||''}:null,lastError})});
})();
