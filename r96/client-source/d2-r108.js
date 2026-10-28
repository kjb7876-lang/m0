/* R108 D2 — Diablo 2의 정신으로 만든 전투 표시 계층 (표시 전용).
 * 1) 적 체력바를 머리 위로: 어두운 틀 + 붉은 채움 + 짧은 잔상. 이름 색은 등급별(일반 흰회·정예 푸른·유니크 금·보스 적금).
 * 2) 정예(챔피언)·유니크 바닥 고리와 옅은 오라(피해 범위로 오해되지 않게 작고 얇게).
 * 3) 디아2식 피해 숫자: 일반 흰색, 강타 금색, 치명 주황, 받은 피해 붉은색, 회복 녹색. 위로 뜨며 사라지고 떼싸움은 합산·상한(24).
 * 피해량·쿨다운·판정·AI·충돌·저장은 건드리지 않는다. 디아블로의 그림·음원·코드는 쓰지 않았고 모든 모양을 코드로 그린다.
 * 체력바·이름·오라·숫자는 자체 2D 캔버스(#d2OverlayR108)에, 바닥 고리는 기존 ground-aligned 기록 경로로 그린다. */
(()=>{'use strict';
if(window.__STORYWORLD_D2_R108__)return;
if(typeof draw!=='function'||typeof drawEnemy!=='function'||typeof hitEnemy!=='function'||typeof floatText!=='function'||typeof project!=='function'||typeof actorHeight!=='function')return;
const REV='R108-d2-1',TAU=Math.PI*2;
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r108.d2';
const DEFAULTS=Object.freeze({bars:true,numbers:true,elite:true});
const LABELS={bars:'적 체력바·이름 (머리 위, 등급색)',numbers:'피해·회복 숫자',elite:'정예 표시 (바닥 고리·오라)'};
let prefs={...DEFAULTS};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={frames:0,paints:0,barsDrawn:0,namesDrawn:0,numbersAdded:0,numbersMerged:0,numbersDrawn:0,taken:0,heals:0,rings:0,auras:0,nativeBarsHidden:0,nativeNamesHidden:0,hudTargetHidden:0,errors:0,msPrepare:0,msPaint:0,msRing:0,msHide:0};
const nowMs=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();   // 이 계층 자체 CPU 시간 측정(프레임당 4번 호출)
let lastError=null,broken=false;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);if(stats.errors>=16){broken=true;try{wipe();}catch(_){}}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=Number.isFinite;
const clock=()=>typeof time==='number'?time:0;
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room&&!(typeof loading!=='undefined'&&loading);
const lowFx=()=>typeof settings!=='undefined'&&!!settings.lowFx;
const reduced=()=>typeof settings!=='undefined'&&!!settings.reducedMotion;
const active=()=>!broken&&live()&&solo();
const zoomNow=()=>typeof zoom==='number'?zoom:1;
const uiScale=()=>clamp(zoomNow()*1.2,.9,1.35);
function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.numbers)nums.length=0;return{...prefs};}

// ---- 등급 -----------------------------------------------------------------------------------
// 1 일반(흰회) · 2 챔피언(푸른: 야전 정예 wardChampionR81·병원 정예 mazeEliteR2) · 3 유니크(금: 중간보스·짙은 형상) · 4 보스·페르소나(적금)
const tierOf=e=>e.persona||e.boss?4:(e.midboss||e.samongElite||e.elite)?3:(e.mazeEliteR2===true||e.wardChampionR81===true||e.champion===true)?2:1;
const TIER=[null,
 {name:'#dcd7cb',glow:null,frame:'#6a5948'},
 {name:'#82b2ff',glow:[84,136,255],frame:'#4f6fae'},
 {name:'#ffd75e',glow:[255,198,70],frame:'#b4922f'},
 {name:'#ff9a4c',glow:[255,92,52],frame:'#b64d2f'}];
// 몸 높이 = actorHeight() × 이 값 (R40 공격 예고 · R90 대상 표시 · phase1 entity()와 같은 식)
const bodyK=e=>(Number(e?.combatProfile?.spriteRect?.height)||1)*(Number(e?.defScale)||1);
const eligible=e=>!!e&&e.visible!==false&&e.disabled!==true&&!['hidden','inactive','disabled','despawned','dead'].includes(e.spawnState)&&!(e.boss&&room&&!room.engaged)&&finite(e.x+e.y)&&(Number(e.maxHp)||0)>0;

// ---- 떠오르는 숫자 ---------------------------------------------------------------------------
const nums=[];let seq=0;const MERGE=.3;
const maxNums=()=>lowFx()?8:24;
const NSTYLE=[{fill:'#f5f0e4',px:14,life:.95,rise:26},{fill:'#ffd650',px:17,life:1.1,rise:34},{fill:'#ff8f2d',px:21,life:1.25,rise:42}];
const TSTYLE=[{fill:'#ff5a4b',px:15,life:1.0,rise:26},{fill:'#ff3a2e',px:19,life:1.15,rise:32},{fill:'#ff2a22',px:23,life:1.3,rise:38}];
const HSTYLE={fill:'#7bf291',px:15,life:1.05,rise:28};
// 강타·치명은 '요청된 한 방'이 영웅 공격력의 몇 배인가로만 정한다(적 체력 비율은 쓰지 않는다: 떼싸움 잡몹은 한두 방에 죽어 비율이 늘 높다).
function strengthOf(req){let ap=1;try{ap=Math.max(1,Number(attackPower())||1);}catch(_){}const rel=req/ap;return rel>=3.5?2:rel>=1.9?1:0;}
function pushNum(n){nums.push(n);const cap=maxNums();while(nums.length>cap)nums.shift();stats.numbersAdded++;return n;}
function stackOf(e,now){let k=0;for(const n of nums)if(n.e===e&&now-n.born<.7)k++;return Math.min(k,3);}
function addHit(e,dmg,now,req){
 if(!(dmg>0)||!finite(e.x+e.y))return;const rq=finite(req)&&req>0?req:dmg;
 for(let i=nums.length-1;i>=0;i--){const n=nums[i];
  if(n.kind==='d'&&n.e===e&&now>=n.born&&now-n.born<MERGE){n.val+=dmg;n.req=Math.max(n.req,rq);n.str=strengthOf(n.req);n.born=now-.05;stats.numbersMerged++;return;}}
 // 한 번에 무리를 쓸어 맞힌 경우(휘두르기·폭발): 바로 곁(0.9칸)의 같은 순간 숫자에 합쳐 '합계 ×횟수'로 보인다.
 for(let i=nums.length-1;i>=0;i--){const n=nums[i];
  if(n.kind==='d'&&n.e!==e&&now>=n.born&&now-n.born<.14&&(n.x-e.x)*(n.x-e.x)+(n.y-e.y)*(n.y-e.y)<.81){n.val+=dmg;n.cnt++;n.req=Math.max(n.req,rq);n.str=strengthOf(n.req);stats.numbersMerged++;return;}}
 const s=++seq;pushNum({kind:'d',e,x:e.x,y:e.y,k:bodyK(e),val:dmg,cnt:1,req:rq,str:strengthOf(rq),born:now,jx:((s*53)%23)-11,vx:(((s*29)%17)-8)*3.2,stack:stackOf(e,now)});
}
function addTaken(v,now){
 if(!(v>0)||!player)return;stats.taken++;const mx=Math.max(1,typeof maxHP==='function'?Number(maxHP())||1:Number(player.maxHp)||1),str=v/mx>=.2?2:v/mx>=.1?1:0;
 for(let i=nums.length-1;i>=0;i--){const n=nums[i];if(n.kind==='t'&&now>=n.born&&now-n.born<MERGE+.1){n.val+=v;n.req=Math.max(n.req,v);n.str=Math.max(n.str,str,n.val/mx>=.2?2:n.val/mx>=.1?1:0);n.born=now-.05;stats.numbersMerged++;return;}}
 const s=++seq;pushNum({kind:'t',e:null,x:player.x,y:player.y,k:1.22,val:v,req:v,str,born:now,jx:-14-(s%3)*5,vx:-12-(s%5)*3,stack:0});
}
function addHeal(v,now){
 if(!(v>=.5)||!player)return;stats.heals++;
 for(let i=nums.length-1;i>=0;i--){const n=nums[i];if(n.kind==='h'&&now>=n.born&&now-n.born<.6){n.val+=v;n.born=now-.05;stats.numbersMerged++;return;}}
 const s=++seq;pushNum({kind:'h',e:null,x:player.x,y:player.y,k:1.22,val:v,req:v,str:0,born:now,jx:14+(s%3)*5,vx:12+(s%4)*3,stack:0});
}
const fmt=v=>{v=Math.round(v);return v>=100000?Math.round(v/1000)+'k':v>=10000?(v/1000).toFixed(1)+'k':v>=1000?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,','):String(v);};

// ---- 체력바 상태(잔상) ---------------------------------------------------------------------
const bars=new WeakMap();const HOLD1=2.6,HOLD2=4.2;   // 맞은 뒤 바가 남는 시간(일반 / 정예 이상)
function barState(e,ratio){let s=bars.get(e);if(!s){s={hitAt:-1e9,trail:ratio,lift:0};bars.set(e,s);}return s;}
const ratioOf=e=>clamp((Number(e.hp)||0)/Math.max(1,Number(e.maxHp)||1),0,1);

// ---- 한 프레임의 표시 대상 ------------------------------------------------------------------
const focus=[],auras=[],shown=new Set(),ringSet=new Set();let frameOn=false,latestHit=null,ox=0,oy=0,mini=null,miniAt=-1,lastT=-1;
const v90Target=()=>{try{const v=window.__STORYWORLD_VISUAL_R90__;return v&&v.prefs&&v.prefs().target?v.target():null;}catch(_){return null;}};
function miniRect(now){if(miniAt>=0&&Math.abs(now-miniAt)<.5)return mini;miniAt=now;mini=null;
 try{const m=document.getElementById('minipanel'),st=document.getElementById('stage');if(m&&st&&m.offsetParent!==null){const a=m.getBoundingClientRect(),b=st.getBoundingClientRect();if(a.width>0)mini={l:a.left-b.left-6,t:a.top-b.top-6,r:a.right-b.left+6,b:a.bottom-b.top+6};}}catch(_){}
 return mini;}
const inMini=(r,x,y)=>!!r&&x>r.l&&x<r.r&&y>r.t&&y<r.b;
// 화면 위쪽 보스 체력 패널(#bossbar)이 켜져 있으면 보스·페르소나는 그쪽이 체력과 이름을 보여 주므로 머리 위 바는 만들지 않는다.
let bbAt=-1,bbOn=false;
function bossbarOn(now){if(bbAt>=0&&Math.abs(now-bbAt)<.25)return bbOn;bbAt=now;try{const el=document.getElementById('bossbar');bbOn=!!el&&!el.classList.contains('hidden')&&el.offsetParent!==null;}catch(_){bbOn=false;}return bbOn;}
function prepare(){
 shown.clear();ringSet.clear();focus.length=0;auras.length=0;latestHit=null;frameOn=false;
 if(!active())return;
 const list=room.enemies;if(!list||!list.length)return;
 const now=clock(),hero=player,sight=window.__STORYWORLD_SIGHT24__,sightOn=!!(sight&&sight.enabled),r90=prefs.bars?v90Target():null,show2=(lowFx()?7:10)**2;
 const tg=typeof target!=='undefined'?target:null;let bestHit=-1e9;
 for(let i=0;i<list.length;i++){const e=list[i];if(!eligible(e)||!(e.hp>0))continue;
  const t=tierOf(e),st=bars.get(e),dx=e.x-hero.x,dy=e.y-hero.y,d2=dx*dx+dy*dy,hold=t>=2?HOLD2:HOLD1;let pr=0,hit=-1e9;
  if(prefs.bars&&!(t===4&&bossbarOn(now))){
   if((tg!==null&&e.id===tg)||e===r90)pr=3;
   else if(t===4)pr=2.5;
   else if(t>=2&&d2<=show2)pr=2.3+t*.02;
   else if(st&&st.hitAt<=now&&now-st.hitAt<hold){pr=2.2-(now-st.hitAt)/hold*.6;hit=st.hitAt;}
  }
  const wantRing=prefs.elite&&t>=2;if(pr<=0&&!wantRing)continue;
  const q=project(e.x,e.y);if(q.x<-70||q.x>W+70||q.y<-30||q.y>H+130)continue;
  if(sightOn&&sight.visibleEnemy(e)===false)continue;
  if(typeof renderable3==='function'&&!renderable3(e))continue;
  if(wantRing){if(t<4)ringSet.add(e);auras.push(e);}
  if(pr>0){focus.push({e,pr,d2,t,hit,hold});if(st&&st.hitAt>bestHit&&st.hitAt<=now){bestHit=st.hitAt;latestHit=e;}}
 }
 if(focus.length>1)focus.sort((a,b)=>b.pr-a.pr||a.d2-b.d2);
 const cap=lowFx()?4:7;if(focus.length>cap)focus.length=cap;
 for(const f of focus)shown.add(f.e);
 if(auras.length>12)auras.length=12;
 frameOn=true;stats.frames++;
}

// ---- 그리기 도구 ----------------------------------------------------------------------------
let cv=null,cx=null,drewLast=false;
function surface(){
 if(cv&&cv.parentNode)return cv;
 const stage=document.getElementById('stage');if(!stage)return null;
 cv=document.createElement('canvas');cv.id='d2OverlayR108';cv.setAttribute('aria-hidden','true');
 Object.assign(cv.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'3',display:'none'});
 stage.appendChild(cv);cx=cv.getContext('2d');return cx?cv:null;
}
function wipe(){if(!drewLast||!cv||!cx)return;try{cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cv.style.display='none';}catch(_){}drewLast=false;}
const glows=new Map();
function glow(rgb){const k=rgb.join(',');let g=glows.get(k);if(g!==undefined)return g;g=null;
 try{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');if(x){const r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba('+k+',1)');r.addColorStop(.4,'rgba('+k+',.42)');r.addColorStop(1,'rgba('+k+',0)');x.fillStyle=r;x.fillRect(0,0,64,64);g=c;}}catch(_){g=null;}
 glows.set(k,g);return g;}
const G={x:0,y:0,top:0,B:0};
function place(e){const q=project(e.x,e.y),B=actorHeight()*bodyK(e),lift=clamp(Number(e.visualLiftPx)||0,0,B*.65);G.x=q.x+ox;G.y=q.y+oy;G.B=B;G.top=q.y+oy-B-lift;return G;}
function gem(c,x,y,r,col){c.fillStyle='#130d0b';c.beginPath();c.moveTo(x,y-r-1);c.lineTo(x+r+1,y);c.lineTo(x,y+r+1);c.lineTo(x-r-1,y);c.closePath();c.fill();
 c.fillStyle=col;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r,y);c.lineTo(x,y+r);c.lineTo(x-r,y);c.closePath();c.fill();}
function drawBar(c,x,y,w,h,ratio,trail,t,a,flash,pulse){
 c.globalAlpha=a;
 c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x-2,y-1,w+4,h+4);
 c.fillStyle='#130d0b';c.fillRect(x-1.5,y-1.5,w+3,h+3);
 c.fillStyle=TIER[t].frame;c.fillRect(x-1.5,y-1.5,w+3,1);c.fillRect(x-1.5,y+h+.5,w+3,1);c.fillRect(x-1.5,y-.5,1,h+1);c.fillRect(x+w+.5,y-.5,1,h+1);
 c.fillStyle='#2a1210';c.fillRect(x,y,w,h);
 if(trail>ratio+.003){c.fillStyle='rgba(238,178,128,.92)';c.fillRect(x+w*ratio,y,w*(trail-ratio),h);}
 const fw=w*ratio,band=Math.max(1,Math.round(h*.32));
 if(fw>.4){c.fillStyle=ratio<.26?'#d3321f':'#b81c17';c.fillRect(x,y,fw,h);
  c.fillStyle='rgba(255,128,104,.5)';c.fillRect(x,y,fw,band);
  c.fillStyle='rgba(50,0,0,.42)';c.fillRect(x,y+h-band,fw,band);
  if(flash>0){c.fillStyle='rgba(255,238,216,'+(.5*flash).toFixed(3)+')';c.fillRect(x,y,fw,h);}
  if(pulse>0){c.fillStyle='rgba(255,90,70,'+(.22*pulse).toFixed(3)+')';c.fillRect(x,y,fw,h);}}
 c.fillStyle='rgba(8,3,3,.5)';c.fillRect(x+w*.25-.5,y,1,h);c.fillRect(x+w*.5-.5,y,1,h);c.fillRect(x+w*.75-.5,y,1,h);
 if(t>=3){gem(c,x-4.5,y+h/2,3.5,TIER[t].name);gem(c,x+w+4.5,y+h/2,3.5,TIER[t].name);}
}
function drawName(c,text,x,y,t,a,S){
 const px=Math.round(11*S);c.globalAlpha=a;c.font=(t>=2?'bold ':'')+px+'px "Malgun Gothic",sans-serif';c.textAlign='center';c.textBaseline='alphabetic';c.lineJoin='round';
 let s=String(text||'');if(s.length>22)s=s.slice(0,21)+'…';
 c.lineWidth=3;c.strokeStyle='rgba(8,4,4,.92)';c.strokeText(s,x,y);
 if(t===4){const g=c.createLinearGradient(0,y-px,0,y+2);g.addColorStop(0,'#ffe58f');g.addColorStop(.55,'#ffa04a');g.addColorStop(1,'#e2402b');c.fillStyle=g;}else c.fillStyle=TIER[t].name;
 c.fillText(s,x,y);
 if(t>=2&&t<4){let wd=0;try{wd=c.measureText(s).width;}catch(_){}if(wd>0)gem(c,x-wd/2-7,y-px*.36,2.6,TIER[t].name);}
 stats.namesDrawn++;
}
function drawAura(c,e,now){
 const t=tierOf(e),T=TIER[t];if(!T||!T.glow)return;const g=glow(T.glow);if(!g)return;
 place(e);const rm=reduced(),pulse=rm?.55:.5+.5*Math.sin(now*1.9+e.x*2.3+e.y*1.3),h=G.B,mx=G.x,my=G.top+h*.5,r=h*(t===4?.78:.62);
 c.globalCompositeOperation='lighter';c.globalAlpha=(t===4?.1:.15)+.05*pulse;c.drawImage(g,mx-r*.9,my-r*1.05,r*1.8,r*2.1);
 if(!rm){const col='rgb('+T.glow.join(',')+')';c.fillStyle=col;
  for(let i=0;i<4;i++){const ph=(now*.42+i*.25+e.x*.37)%1,px=mx+Math.sin(i*2.1+now*.8+e.y)*r*.5,py=G.y-h*.08-ph*h*.9;c.globalAlpha=(1-ph)*Math.min(1,ph*6)*.7;c.fillRect(px-1,py-1,2,2);}}
 c.globalCompositeOperation='source-over';stats.auras++;
}
function heroRgb(){try{const p=window.__STORYWORLD_HERO_FX_R102__?.palette?.(player.hero);if(p&&p.a)return p.a;}catch(_){}return[255,198,72];}
function drawNumber(c,n,now,S){
 const age=now-n.born;if(age<0)return true;
 const sty=n.kind==='d'?NSTYLE[n.str]:n.kind==='t'?TSTYLE[n.str]:HSTYLE,lf=lowFx(),rm=reduced(),life=lf?Math.min(.7,sty.life):sty.life,t=age/life;if(t>=1)return false;
 const rise=(rm?10:sty.rise*(lf?.6:1))*S*(1-Math.pow(1-t,3)),pop=rm||lf?0:Math.max(0,1-age/.14),px=Math.round(sty.px*S*(1+.5*pop)*(1+Math.min(.25,.05*((n.cnt||1)-1))));
 // 적에게 준 피해는 몸 위쪽(키의 72%)에서 떠올라 머리 위 이름·바와 겹치지 않고, 화면 위쪽 보스 체력 패널에도 덜 가린다. 영웅 숫자는 머리 위.
 const q=project(n.x,n.y),ax=q.x+ox+n.jx*S+(rm?0:n.vx*age),ay=q.y+oy-actorHeight()*n.k*(n.kind==='d'?.72:.96)-n.stack*(sty.px+1)*S-rise;
 const a=clamp(age/.06,0,1)*(t<.58?1:1-(t-.58)/.42);
 if(n.kind==='d'&&n.str>=1||n.kind==='t'&&n.str>=2){const g=glow(n.kind==='t'?[255,40,30]:n.str>=2?[255,140,45]:heroRgb());
  if(g){const r=px*1.7;c.globalCompositeOperation='lighter';c.globalAlpha=a*(.22+.14*n.str);c.drawImage(g,ax-r,ay-r,r*2,r*2);c.globalCompositeOperation='source-over';}}
 c.globalAlpha=a;c.font='bold '+px+'px "Palatino Linotype","Book Antiqua",Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 const txt=(n.kind==='h'?'+':n.kind==='t'?'-':'')+fmt(n.val)+(n.cnt>1?' ×'+n.cnt:'');
 c.lineWidth=Math.max(2.5,px*.2);c.strokeStyle='rgba(8,4,4,.92)';c.strokeText(txt,ax,ay);c.fillStyle=sty.fill;c.fillText(txt,ax,ay);
 stats.numbersDrawn++;return true;
}

// ---- 한 프레임 그리기 -------------------------------------------------------------------------
function paint(){
 frameOn=false;
 if(!active()){wipe();return;}
 const now=clock(),nn=prefs.numbers?nums.length:0,nf=prefs.bars?focus.length:0,na=prefs.elite&&!lowFx()?auras.length:0;
 if(!nn&&!nf&&!na){wipe();return;}
 const cvs=surface();if(!cvs||!cx)return;
 const dp=typeof dpr==='number'?dpr:1,pw=Math.max(1,Math.round(W*dp)),ph=Math.max(1,Math.round(H*dp));
 if(cvs.width!==pw)cvs.width=pw;if(cvs.height!==ph)cvs.height=ph;if(cvs.style.display!=='block')cvs.style.display='block';
 const c=cx,S=uiScale(),dt=lastT>=0&&now>=lastT?Math.min(now-lastT,.1):0;lastT=now;
 c.setTransform(dp,0,0,dp,0,0);c.clearRect(0,0,W,H);c.globalCompositeOperation='source-over';c.globalAlpha=1;
 ox=0;oy=0;if(typeof shake==='number'&&shake>0&&!reduced()){ox=Math.sin(now*91)*shake;oy=Math.cos(now*83)*shake*.5;}
 const mr=miniRect(now);
 c.save();
 try{
  if(na){for(let i=0;i<auras.length;i++){const e=auras[i];place(e);if(!inMini(mr,G.x,G.top))drawAura(c,e,now);}}
  if(nf){
   for(let i=focus.length-1;i>=0;i--){const f=focus[i],e=f.e,ratio=ratioOf(e),st=barState(e,ratio),t=f.t;
    if(ratio>=st.trail||lowFx())st.trail=ratio;else if(now-st.hitAt>.32)st.trail=Math.max(ratio,st.trail-dt*Math.max(.28,(st.trail-ratio)*2.6));
    const warn=e.rangedWindup>0||(e.attack&&!e.attack.committed)?19*S:0;st.lift+=(warn-st.lift)*Math.min(1,dt*14);
    place(e);if(inMini(mr,G.x,G.top))continue;
    const w=Math.round([0,40,54,62,92][t]*S),h=Math.max(4,Math.round([0,5,6,6,8][t]*S)),a=f.hit>-1e8?clamp((f.hold-(now-f.hit))/.6,0,1):1;
    if(a<=0)continue;
    const bx=clamp(G.x-w/2,6,Math.max(6,W-6-w)),by=Math.max(16*S,G.top-9*S-st.lift);
    if(by>H+10)continue;
    const flash=clamp(1-(now-st.hitAt)/.1,0,1),pulse=ratio<.26&&!reduced()?.5+.5*Math.sin(now*9):0;
    drawBar(c,bx,by,w,h,ratio,st.trail,t,a,flash,pulse);stats.barsDrawn++;
    if(f.pr>=3||t>=2||e===latestHit)drawName(c,e.name,clamp(G.x,40,W-40),by-5*S,t,a,S);
   }
  }
  if(nn){for(let i=0;i<nums.length;i++){const n=nums[i];if(!drawNumber(c,n,now,S)){nums.splice(i,1);i--;}}}
 }finally{c.restore();}
 drewLast=true;stats.paints++;
}

// ---- 바닥 고리(기록 경로, ground-aligned) ------------------------------------------------------
function ringFor(e,t){
 const T=TIER[t];if(!T||!T.glow||typeof ctx==='undefined'||!ctx)return;
 const q=project(e.x,e.y),z=zoomNow(),rad=Math.max(.45,Number(e.radius)||.5)*(typeof TILE==='number'?TILE:34)*z,rx=Math.max(15*z,rad*1.28),now=clock();
 const pulse=reduced()?.6:.55+.45*Math.sin(now*2.1+e.x*3.1+e.y*1.7),rgb=T.glow.join(',');
 const paint=()=>{ctx.save();try{ctx.translate(q.x,q.y+1);ctx.scale(1,.5);ctx.globalAlpha=1;
   ctx.fillStyle='rgba('+rgb+','+(.09+.05*pulse).toFixed(3)+')';ctx.beginPath();ctx.arc(0,0,rx*1.2,0,TAU);ctx.fill();
   ctx.fillStyle='rgba('+rgb+','+(.12+.07*pulse).toFixed(3)+')';ctx.beginPath();ctx.arc(0,0,rx*.8,0,TAU);ctx.fill();
   ctx.lineWidth=Math.max(3.4,5*z);ctx.strokeStyle='rgba('+rgb+','+(.14+.08*pulse).toFixed(3)+')';ctx.beginPath();ctx.arc(0,0,rx,0,TAU);ctx.stroke();
   ctx.lineWidth=Math.max(1.8,2.3*z);ctx.strokeStyle='rgba('+rgb+','+(.72+.22*pulse).toFixed(3)+')';ctx.beginPath();ctx.arc(0,0,rx,0,TAU);ctx.stroke();
   ctx.lineWidth=Math.max(.9,1.1*z);ctx.strokeStyle='rgba(255,255,255,'+(.2+.14*pulse).toFixed(3)+')';ctx.beginPath();ctx.arc(0,0,rx*.9,0,TAU);ctx.stroke();
  }finally{ctx.restore();}};
 const owner={id:'d2:ring:'+e.id,kind:'effect',x:e.x,y:e.y,groundAligned:true,alive:false,presentationOnly:true,d2R108:true};
 const t0=nowMs();if(typeof ctx.scope==='function')ctx.scope(owner,paint);else paint();stats.rings++;stats.msRing+=nowMs()-t0;
}

// ---- 기본 체력바·보스 이름 가리기 -----------------------------------------------------------------
// 머리 위 바가 그려지는 적만, 기본 바 사각형(R90이 2px로 줄인 것 포함)과 보스 이름 글자만 좌표로 알아보고 건너뛴다.
// 나머지 그리기(몸·그림자·예고선·공격 예고 표지)는 그대로 지나가고, finally에서 반드시 원래대로 되돌린다.
function hideNative(e,run){
 const t0=nowMs(),c=ctx,q=project(e.x,e.y),z=zoomNow(),boss=!!e.boss,w=(boss?82:44)*z,y=q.y+8*z,body=actorHeight()*bodyK(e),
  yLo=q.y+6-body*.65-1,yHi=q.y+7,nativeW=(boss?68:35)*z,name=boss?String(e.name):null;
 // 두 번째 기본 바(병원·의료 보스 그림 경로)는 visualLiftPx를 안쪽 래퍼가 잠깐 세팅한 뒤 그리므로, 높이는 범위로 알아본다(가로 위치·너비는 정확히 일치해야 한다).
 const oR=c.fillRect,wR=Object.prototype.hasOwnProperty.call(c,'fillRect'),oT=c.fillText,wT=Object.prototype.hasOwnProperty.call(c,'fillText'),near=(a,b)=>Math.abs(a-b)<.02;
 c.fillRect=function(x0,y0,w0,h0){
  if((near(x0,q.x-w/2-1.5*z)&&near(w0,w+3*z))||(near(x0,q.x-w/2)&&near(y0,y)&&w0<=w+.02)||(near(x0,q.x-nativeW/2)&&y0>=yLo&&y0<=yHi&&w0<=nativeW+.02&&(near(h0,4)||near(h0,2)))){stats.nativeBarsHidden++;return;}
  return oR.call(this,x0,y0,w0,h0);};
 if(name)c.fillText=function(t,...a){if(String(t)===name){stats.nativeNamesHidden++;return;}return oT.call(this,t,...a);};
 stats.msHide+=nowMs()-t0;
 try{return run();}finally{
  if(wR)c.fillRect=oR;else delete c.fillRect;
  if(name){if(wT)c.fillText=oT;else delete c.fillText;}}
}
const enemyBase=drawEnemy;
drawEnemy=function(e,...args){
 if(!frameOn||broken||!e||typeof ctx==='undefined'||!ctx)return enemyBase.apply(this,[e,...args]);
 let hide=false,tint=false;
 try{if(e.hp>0){if(ringSet.has(e))ringFor(e,tierOf(e));hide=prefs.bars&&shown.has(e);tint=!hide&&prefs.bars&&!!e.boss&&eligible(e);}}catch(err){fail(err);}
 if(hide)return hideNative(e,()=>enemyBase.apply(this,[e,...args]));
 if(tint)return tintBossName(e,()=>enemyBase.apply(this,[e,...args]));
 return enemyBase.apply(this,[e,...args]);
};
// 위쪽 보스 패널이 체력을 보여 줄 때는 기본 머리 위 보스 이름 글자를 적금색으로만 바꾼다(위치·글꼴·그림자는 그대로).
function tintBossName(e,run){
 const c=ctx,name=String(e.name),oT=c.fillText,wT=Object.prototype.hasOwnProperty.call(c,'fillText');
 c.fillText=function(t,...a){if(String(t)===name){const f=this.fillStyle;this.fillStyle=TIER[4].name;try{return oT.call(this,t,...a);}finally{this.fillStyle=f;}}return oT.call(this,t,...a);};
 try{return run();}finally{if(wT)c.fillText=oT;else delete c.fillText;}
}

// ---- R90 '공격 대상 강조'의 이름·2px 바만 가리기 (링은 그대로) --------------------------------------
// R90은 같은 대상의 이름과 가는 바를 HUD 캔버스에 그린다. 머리 위 바와 겹치므로 그 글자·사각형만(색 서명으로) 건너뛴다.
let hudSig=null;
function hudSignature(c){
 if(hudSig)return hudSig;
 c.save();try{c.font='11px "Malgun Gothic",sans-serif';const f=c.font;c.fillStyle='#d6c8b8';const nf=c.fillStyle;c.fillStyle='rgba(12,10,10,.9)';const f1=c.fillStyle;c.fillStyle='#332826';const f2=c.fillStyle;c.fillStyle='#865b50';const f3=c.fillStyle;hudSig={font:f,nameFill:nf,bar:[f1,f2,f3]};}finally{c.restore();}
 return hudSig;}
function hudPatch(){
 if(!prefs.bars||!shown.size)return null;
 const v=window.__STORYWORLD_VISUAL_R90__;if(!v||!v.prefs||!v.prefs().target)return null;
 const s=document.querySelector('canvas#combat-hud-r51');if(!s||typeof s.getContext!=='function')return null;const c=s.getContext('2d');if(!c)return null;
 const sig=hudSignature(c),oT=c.fillText,oR=c.fillRect,wT=Object.prototype.hasOwnProperty.call(c,'fillText'),wR=Object.prototype.hasOwnProperty.call(c,'fillRect');
 c.fillText=function(t,...a){if(this.fillStyle===sig.nameFill&&this.font===sig.font){stats.hudTargetHidden++;return;}return oT.call(this,t,...a);};
 c.fillRect=function(x,y,w,h){const f=this.fillStyle;if((h===2||h===4)&&(f===sig.bar[0]||f===sig.bar[1]||f===sig.bar[2]))return;return oR.call(this,x,y,w,h);};
 return{c,oT,oR,wT,wR};
}
function hudRestore(p){if(!p)return;const c=p.c;try{if(p.wT)c.fillText=p.oT;else delete c.fillText;if(p.wR)c.fillRect=p.oR;else delete c.fillRect;}catch(_){}}

// ---- 후크 -------------------------------------------------------------------------------------
const drawBase=draw;
draw=function(...a){
 let hp=null;
 const t0=nowMs();try{prepare();hp=hudPatch();}catch(err){fail(err);}stats.msPrepare+=nowMs()-t0;
 try{return drawBase.apply(this,a);}
 finally{hudRestore(hp);const t1=nowMs();try{paint();}catch(err){fail(err);}stats.msPaint+=nowMs()-t1;}
};
const hitBase=hitEnemy;
hitEnemy=function(e,value,source,...rest){
 let hp0=NaN;
 try{if((prefs.numbers||prefs.bars)&&e&&active())hp0=Number(e.hp);}catch(_){}
 const r=hitBase.call(this,e,value,source,...rest);
 try{if(finite(hp0)){const dealt=hp0-Number(e.hp);
   if(dealt>1e-6){const now=clock(),mx=Math.max(1,Number(e.maxHp)||1),rb=clamp(hp0/mx,0,1);
    if(prefs.bars){const s=barState(e,rb);s.hitAt=now;if(!(s.trail>=rb))s.trail=rb;}
    if(prefs.numbers)addHit(e,dealt,now,Number(value));}}}catch(err){fail(err);}
 return r;
};
// 기본 떠오르는 글자 가운데 숫자만 이 계층이 대신 그린다: 적에게 준 피해(기본은 보스·3콤보마다만 뜸 → 모든 타격), 영웅이 받은 피해('-N'),
// 회복('+N': 구슬·흡혈). 영웅 자리가 아닌 곳의 '-N'은 적 피해 글자라 hitEnemy 후크가 이미 그렸으므로 중복을 막는다. 라벨('패링'·GRAZE·RED TIME…)은 기본 그대로.
const floatBase=floatText;
floatText=function(text,x,y,color,...rest){
 try{if(prefs.numbers&&active()){const s=String(text),mine=x===undefined||y===undefined||(Math.abs(x-player.x)<.02&&Math.abs(y-player.y)<.02);
   if(!mine&&/^\d+(?:\.\d+)?$/.test(s))return;
   let m=/^-(\d+(?:\.\d+)?)$/.exec(s);if(m){if(mine)addTaken(+m[1],clock());return;}
   m=/^\+(\d+(?:\.\d+)?)$/.exec(s);if(m&&mine){addHeal(+m[1],clock());return;}}}catch(err){fail(err);}
 return floatBase.call(this,text,x,y,color,...rest);
};
function reset(){nums.length=0;focus.length=0;auras.length=0;shown.clear();ringSet.clear();latestHit=null;lastT=-1;miniAt=-1;frameOn=false;wipe();}
if(typeof enterRegion==='function'){const b=enterRegion;enterRegion=async function(...a){try{reset();}catch(_){}const r=await b.apply(this,a);try{reset();}catch(_){}return r;};}
if(typeof restoreSave==='function'){const b=restoreSave;restoreSave=async function(...a){const r=await b.apply(this,a);try{reset();}catch(_){}return r;};}

// ---- 설정 (세부 조정 목록에 한 구역) ----------------------------------------------------------
const HOSTS=['retroSettingsR102Props','retroSettingsR102','retroSettingsR101','retroSettingsR100','retroSettingsR99Outdoor','retroSettingsR98World','retroSettingsR98Vfx','retroSettingsR98Combat','retroSettingsR93','retroSettingsR92Boss','retroSettingsR92Mobs','retroSettingsR92','retroSettingsR91','retroSettingsR90','retroSettingsR89'];
function settingsSection(){
 if(document.getElementById('retroSettingsR108D2'))return;
 let host=null;for(const id of HOSTS){host=document.getElementById(id);if(host)break;}
 const anchor=host||document.querySelector('.settings');if(!anchor||!anchor.parentNode)return;
 const s=document.createElement('section');s.id='retroSettingsR108D2';
 s.innerHTML='<h3>D2 전투 표시 (R108)</h3><p class="small muted">보이는 표시만 바뀌며 피해·판정·저장은 그대로입니다. 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r108d2-'+k+'"> '+LABELS[k]+'</label> ').join('');
 anchor.parentNode.insertBefore(s,anchor.nextSibling);
 for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r108d2-'+k);if(!el)continue;el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}
}
if(typeof showSettings==='function'){const b=showSettings;showSettings=function(...a){const r=b.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}

window.__STORYWORLD_D2_R108__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,storageKey:KEY,tierOf,
 numbers:()=>nums.map(n=>({kind:n.kind,val:n.val,req:n.req,str:n.str,born:n.born,id:n.e?.id||null})),
 focus:()=>focus.map(f=>({id:f.e.id,pr:f.pr,tier:f.t})),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},numbers:nums.length,focus:focus.length,rings:ringSet.size,auras:auras.length,lastError,broken,overlay:!!cv,
  presentationOnly:true,damageChanged:false,hitboxesChanged:false,aiChanged:false,savesTouched:false,storage:KEY}),
 test:{hit:(e,v,s)=>hitEnemy(e,v,s),taken:v=>floatText('-'+Math.ceil(v),player.x,player.y,'#f1a1a9'),heal:v=>floatText('+'+Math.ceil(v),player.x,player.y,'#ff8f8f'),paint:()=>{prepare();paint();},reset}});
})();
