// R1241 — 솔로몬의 봉인식 보스 '교만의 잔향 · 제72문'(mb-ep1b01) 스킬 '72 그림자 소환'.
//  사용자 2026-11-19 12:16Z "검은그림자같은 형체 작은것들 72개 소환하는 느낌으로(밑에서 솟아올랐다 가라앉았다 6번해서 12개 해서72번)
//   보스방가득찬 장판형 프레임이펙트로 스킬구현해서 적용"
//  · 시전: 보스가 0.9초 제자리에서 부르는 동안 방 바닥 전체에 큰 먹 인장이 감겨 닫힌다(장판).
//  · 6파 × 12 = 72. 파마다 바닥에 먹 인장(8칸)이 감겨 닫히는 예고 → 검은 그림자가 땅 밑에서 솟아오름(6칸)·먹 흩어짐 → 잠깐 서 있다 → 무너져 가라앉음(6칸).
//    파마다 2개는 영웅 자리를 노리고(움직이게), 10개는 방 넓게 흩어진다. 모든 자리는 막히지 않은 바닥, 서로 0.9칸 이상.
//  · 피해: 솟아오른 순간 판정 원(0.7칸) 안이면 보스 근접 피해 × 0.35, 한 파에 한 번, 한 시전 합 ≤ 보스 근접 1.4대(예고를 보고 비키면 0).
//    스토리 R1225(적이 받는 피해 반감)와는 방향이 달라(영웅이 받는 피해) 겹치지 않는다.
//  · 그림(임시, 최종 아님 — Dots 전용 시트 오면 교체): 그림자 = r1166 유령 환자 죽음 5자세를 먹 그림자로 다시 칠하고 땅 경계로 잘라 만든 12칸,
//    인장 = Dots r1213 bomb-warning8 을 먹·검보라로 다시 칠한 8칸, 솟을 때 먹 흩어짐 = Dots r1213 ink-dispersal12 를 먹·검보라로 다시 칠한 12칸(밝은 갈래가 조명 아래 노랗게 떠서)(scripts/r1241-shadow72-sheets.py).
//  · 성능: 한 화면 그림 호출 ≤ 약 50(겹치는 파 2개까지), 저사양(settings.lowFx)은 먹 흩어짐 생략.
//  끄기: localStorage['storyworld.r1241.shadows']='{"on":false}'. 점검: window.__STORYWORLD_BOSS72_SHADOWS_R1241__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BOSS72_SHADOWS_R1241__)return;
const REV='R1241-shadow72-1',KEY='storyworld.r1241.shadows';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={casts:0,spawned:0,wavesDone:0,hits:0,dealt:0,errors:0,drawn:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'?t:0;};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const TUNE=Object.freeze({first:4,cd:14,chant:.9,gap:1.15,jitter:.16,tele:.85,rise:.36,hold:.4,sink:.5,dmg:.35,cap:1.4,engage:13,spread:8.5,minGap:.9});
const WAVES=6,PER=12,HIT_R=.7;
const SH=Object.freeze({rise:'assets/r1241/shadow-rise12.webp',seal:'assets/r1241/shadow-seal8.webp',burst:'assets/r1241/shadow-burst12.webp'});
const isBoss=e=>!!(e&&(e.nativeId==='mb-ep1b01'||/제72문/.test(String(e.name||''))));
const P=()=>G('player');
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
function free(x,y){try{const b=G('blocked');return typeof b!=='function'||!b(x,y,.3);}catch(_){return false;}}
// ---- 배치(순수): 영웅 자리 2개 + 방 넓게 10개, 막히지 않은 바닥, 서로 minGap 이상 ----
function planWave(bp,hp,w,seed){const r=rng(hash(seed+':'+w)),pts=[],far=p=>pts.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=TUNE.minGap);
 const put=p=>{if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&free(p.x,p.y)&&far(p)){pts.push({x:p.x,y:p.y});return true;}return false;};
 const cx=bp.x*.4+hp.x*.6,cy=bp.y*.4+hp.y*.6;
 // 1) 영웅 발밑(살짝 어긋나게) 2) 영웅 옆 1.1~1.4칸
 for(let k=0;k<8&&pts.length<1;k++){const a=r()*6.283,d=r()*.3;put({x:hp.x+Math.cos(a)*d,y:hp.y+Math.sin(a)*d});}
 for(let k=0;k<12&&pts.length<2;k++){const a=r()*6.283,d=1.1+r()*.3;put({x:hp.x+Math.cos(a)*d,y:hp.y+Math.sin(a)*d});}
 // 3) 나머지: 10 부채꼴 × 반지름 층(파마다 돌려서 72개가 방을 고르게 덮게)
 const rot=w*.618*6.283;for(let s=0;pts.length<PER&&s<10;s++){for(let k=0;k<10;k++){const a=rot+(s+r())*6.283/10,d=2.2+Math.sqrt(r())*(TUNE.spread-2.2);if(put({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d}))break;}}
 for(let k=0;pts.length<PER&&k<200;k++){const a=r()*6.283,d=1+r()*TUNE.spread;put({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d});}
 for(let d=.5;pts.length<PER&&d<=12;d+=.5)for(let i=0;pts.length<PER&&i<Math.ceil(d*8);i++){const a=i/Math.ceil(d*8)*6.283;put({x:hp.x+Math.cos(a)*d,y:hp.y+Math.sin(a)*d});}
 return pts;}
// ---- 상태 ----
let cast=null,shadows=[],seenAt=null,next=0,lastT=-1;
const life=TUNE.tele+TUNE.rise+TUNE.hold+TUNE.sink;
function boss(){for(const e of G('room')?.enemies||[])if(isBoss(e)&&e.hp>0&&e.spawnState==='active'&&!e.disabled)return e;return null;}
function clear(){cast=null;shadows=[];}
function start(e,now){const p=P();stats.casts++;cast={t0:now,room:G('room'),boss:e,bx:e.x,by:e.y,seed:hash((e.id||e.name)+':'+stats.casts),wave:0,cx:e.x*.4+p.x*.6,cy:e.y*.4+p.y*.6,hitWave:new Set(),dealt:0,done:new Set()};}
function step(){if(!prefs.on){if(cast)clear();return;}if(paused())return;const now=T();if(!(now>lastT)){lastT=now;return;}lastT=now;
 const room=G('room'),p=P();
 if(cast&&(cast.room!==room||!(cast.boss.hp>0))){clear();next=now+TUNE.cd;}
 const e=boss();if(!e){seenAt=null;return;}
 const near=Math.hypot(p.x-e.x,p.y-e.y)<=TUNE.engage;
 if(!cast){if(!near)return;if(seenAt===null||seenAt>now){seenAt=now;next=Math.max(next,now+TUNE.first);}if(now>=next&&!e.attack)start(e,now);else return;}
 const age=now-cast.t0;
 if(age<TUNE.chant){e.x=cast.bx;e.y=cast.by;e.moving=false;e.nav=[];e.r230At=now;}
 // 파 시작: 그때 영웅 자리로 배치
 while(cast.wave<WAVES&&age>=TUNE.chant+cast.wave*TUNE.gap){const w=cast.wave++,pts=planWave({x:e.x,y:e.y},p,w,cast.seed),r=rng(hash(cast.seed+':j'+w)),t0=cast.t0+TUNE.chant+w*TUNE.gap;
  pts.forEach((q,i)=>shadows.push({id:stats.casts*100+w*PER+i,x:q.x,y:q.y,t0:t0+r()*TUNE.jitter,wave:w,hit:false}));stats.spawned+=pts.length;}
 // 솟아오른 순간 판정
 for(const s of shadows){if(s.hit)continue;const a=now-s.t0;if(a<TUNE.tele+TUNE.rise)continue;s.hit=true;
  if(cast.hitWave.has(s.wave)||Math.hypot(p.x-s.x,p.y-s.y)>HIT_R)continue;const dmg=(Number(e.damage)||0)*TUNE.dmg,cap=(Number(e.damage)||0)*TUNE.cap;
  if(!(dmg>0)||cast.dealt+dmg>cap+1e-9)continue;cast.hitWave.add(s.wave);cast.dealt+=dmg;stats.hits++;stats.dealt+=dmg;
  try{const h=G('hurt');if(typeof h==='function')h(dmg,{x:s.x,y:s.y,owner:e.id,kind:'r1241-shadow',r1241:'shadow'});}catch(err){fail(err);}}
 shadows=shadows.filter(s=>{if(now-s.t0<life)return true;return false;});
 for(let w=0;w<cast.wave;w++)if(!cast.done.has(w)&&!shadows.some(s=>s.wave===w)){cast.done.add(w);stats.wavesDone++;}
 if(cast.wave>=WAVES&&!shadows.length){clear();next=now+TUNE.cd;}}
// ---- 그리기 ----
function want(path){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(path);}catch(_){}}
function img(path){try{const r=G('readyImage')?.(path),im=r?.image;if(!r)want(path);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
function strip(path,n,f,x,y,w,h,alpha){const im=img(path);if(!im||!(alpha>0))return false;const c=G('ctx'),cw=(im.naturalWidth||im.width)/n,ch=im.naturalHeight||im.height,i=Math.max(0,Math.min(n-1,f|0));
 c.save();c.globalAlpha=Math.min(1,alpha);c.drawImage(im,i*cw,0,cw,ch,x,y,w,h);c.restore();stats.drawn++;return true;}
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
const AH=()=>{try{return G('actorHeight')?.()||60;}catch(_){return 60;}};
const low=()=>{try{return !!G('settings')?.lowFx;}catch(_){return false;}};
function ell(c,q,rx,ry,col,alpha){c.save();c.globalAlpha=alpha;c.fillStyle=col;c.beginPath();c.ellipse?.(q.x,q.y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);c.fill();c.restore();}
const INK='rgba(8,6,12,1)',VIOLET='rgba(70,24,60,1)',RIM='rgba(178,156,214,1)';
/* 예고 테: 어두운 바닥에서도 읽히게 차가운 옅은 보라 선(주황 금지 #712) */
function ring(c,q,rx,ry,alpha,w){c.save();c.globalAlpha=alpha;c.strokeStyle=RIM;c.lineWidth=w;c.beginPath();c.ellipse?.(q.x,q.y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);c.stroke();c.restore();}
/* 3D 기록기: 바닥 그림(인장·먹)은 groundAligned 로 바닥에 눕히고, 그림자 몸은 세워 그린다(눕히면 바닥에 납작하게 깔림) */
function sc(c,id,x,y,ground,fn){if(typeof c.scope==='function')c.scope({id:'r1241:'+id,kind:'effect',x,y,groundAligned:ground,lightShadowApproved:true},fn);else fn();}
function draw(){const c=G('ctx'),pr=G('project');if(!c||typeof pr!=='function'||!cast)return;const now=T(),U=unit(),ah=AH(),age=now-cast.t0;
 // 방 바닥 장판: 큰 먹 인장이 부르는 동안 감겨 닫히고, 시전 내내 옅게 깔린다
 const total=TUNE.chant+(WAVES-1)*TUNE.gap+TUNE.jitter+life,fade=Math.min(1,age/.3)*Math.min(1,Math.max(0,(total-age)/.6)),BR=(TUNE.spread+1)*U;
 sc(c,'floor',cast.cx,cast.cy,true,()=>{const q=pr(cast.cx,cast.cy);ell(c,q,BR,BR*.5,INK,.22*fade);ell(c,q,BR*.7,BR*.35,VIOLET,.08*fade);
  strip(SH.seal,8,Math.floor(Math.min(1,age/TUNE.chant)*7.99),q.x-BR/.68,q.y-BR*.5/.68,BR*2/.68,BR/.68,.45*fade);});
 const R=HIT_R*U*1.1,FH=ah*.85*256/230,FW=FH*192/256,lo=low();
 const list=shadows.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y));
 for(const s of list){const a=now-s.t0;if(a<0)continue;
  sc(c,'g'+s.id,s.x,s.y,true,()=>{const g=pr(s.x,s.y);
   if(a<TUNE.tele){const u=a/TUNE.tele;ell(c,g,R*.9,R*.45,INK,.25+.25*u);ring(c,g,R*(1.15-.25*u),R*(.575-.125*u),.25+.45*u,1.5);strip(SH.seal,8,Math.floor(u*7.99),g.x-R/.68,g.y-R*.5/.68,R*2/.68,R/.68,.75+.25*u);return;}
   const b=a-TUNE.tele;ell(c,g,R*.8,R*.4,INK,.5*Math.max(0,1-Math.max(0,b-TUNE.rise-TUNE.hold)/TUNE.sink));
   if(b<TUNE.rise+.2){const v=b/(TUNE.rise+.2);strip(SH.seal,8,7,g.x-R/.68,g.y-R*.5/.68,R*2/.68,R/.68,1-v);
    if(!lo)strip(SH.burst,12,Math.floor(v*6.99),g.x-R*1.3,g.y-R*.65,R*2.6,R*1.3,.9);}});
  if(a<TUNE.tele)continue;const b=a-TUNE.tele;
  let f;if(b<TUNE.rise)f=Math.floor(b/TUNE.rise*5.99);else if(b<TUNE.rise+TUNE.hold)f=5;else f=6+Math.floor(Math.min(.999,(b-TUNE.rise-TUNE.hold)/TUNE.sink)*6);
  sc(c,'f'+s.id,s.x,s.y,false,()=>{const g=pr(s.x,s.y);strip(SH.rise,12,f,g.x-FW/2,g.y-FH*246/256,FW,FH,1);});}}
const SENT={type:'r1241-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
let warmed=0;function warm(){const now=T();if(now-warmed<3&&now>=warmed)return;warmed=now;for(const q of Object.values(SH))if(!G('readyImage')?.(q))want(q);}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1241-fx'){try{if(prefs.on)draw();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();if(prefs.on&&boss())warm();if(cast)arm();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)clear();return {...prefs};}
window.__STORYWORLD_BOSS72_SHADOWS_R1241__=Object.freeze({revision:REV,set,isBoss,planWave,tune:TUNE,waves:WAVES,perWave:PER,hitRadius:HIT_R,sheets:SH,
 cast:(force)=>{const e=boss();if(!e)return false;if(force||!cast){clear();start(e,T());}return true;},
 inspect:()=>({revision:REV,prefs:{...prefs},...JSON.parse(JSON.stringify(stats)),casting:!!cast,live:shadows.length,
  liveTele:shadows.filter(s=>{const a=T()-s.t0;return a>=0&&a<TUNE.tele+TUNE.rise;}).map(s=>({x:s.x,y:s.y})),next,lastError})});
})();
