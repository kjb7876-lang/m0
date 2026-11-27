// R1343 금이 간 안경(ep1b03) 보스 '호텔 부매니저 · 레비아탄' — 유리 조각 폭풍(사용자 2026-11-26 13:39Z
//  "금이간안경보스가 사방에서 깨진유리조각이 흩날리는 프레임애니메이션스킬을 사용하도록 보스방벽곳곳에 유리조각이 날려서 박히게").
//  · 시전: 보스가 멈춰 0.8초 동안 금 간 안경에 빛을 모으고(burst 시트 앞 칸, 공중), 이어 3파 × 14조각을 사방(360°)으로 터뜨린다.
//    파마다 각도를 반 칸씩 돌려 빈틈이 바뀐다(피할 틈은 조각 사이). 바닥 예고 원·장판 없음, 도형 투사체 없음 — 그림은 시트 3종만.
//  · 조각은 공중이라 가구·소품 위를 지나간다. 방 벽에 닿으면 그 자리 벽면(높이 0.35~2.1칸)에 박혀 남는다(embed 시트 1~8칸 뒤 마지막 칸 유지 + 가끔 반사광).
//    박힌 조각은 장식이라 피해 없음. 이 방(room 객체)에 있는 동안 계속 남고(보스가 죽어도), 다른 지역으로 가면 비운다. 상한 260개(넘으면 오래된 것부터).
//  · 피해: 조각 하나 보스 근접 × .14, 한 시전 합 ≤ 1.4대(R1263 과 같은 몫). 엔진 hurt() 가 거절하면 맞지 않은 것.
//  · 주기: 보스와 13칸 안에서 처음 3초 뒤, 그 뒤 11초마다. 보스가 자기 공격 중이면 미룬다.
//  · 그림: Dots SW-3D-R1343 02a shard_fly8(기준점 62,64)·02b burst12(모바일 4096 한도로 6열×2행 격자)·02c embed8(기준점 80,132, 마지막 칸 = 박힌 채 남음).
//    scripts/r1343-glass-sheets.py 가 납품본을 게임 경로로 옮긴다(그림 그대로).
//  · 보스 3D(mob-3d-r1343)가 시전 동안 cast 클립을 쓰게 e.r1343Cast 를 세운다.
//  · R1355(Dots SW-R1352-D04, 사용자 11-27 'D 이펙트 시트는 게임에 적용'): 벽에 박히는 순간을 Dots 꽂힘 12칸(빠른 접근 → 0부터 2칸째 접촉 → 진동·파편 소산, 11 빈 칸)으로,
//    7초마다 반사광을 반짝 8칸 덧그림(7 빈 칸)으로 바꾼다. 두 시트 모두 칸 256, 피벗 (128,128) = 벽 접촉점, 시트 안 +Y 로 꽂힘(embed 와 같은 방향 → 같은 회전).
//    크기는 박힌 채 남는 R1343 embed 마지막 칸의 유리 몸 길이에 맞춤(꽂힘 칸 몸 117px/256 = embed 몸 61px/160 → 칸 폭 = embed 폭 × .834).
//    박힌 채 남는 몸은 그대로 R1343 embed 마지막 칸(Dots 지시대로), 꽂힘이 끝나 가는 0.2~0.45초에 서서히 나타난다. 시트를 못 받았으면 예전 embed 1~8칸·반사광 그대로.
//    끄기(예전으로): localStorage['storyworld.r1343.envyGlass']='{"dots":false}'.
//  · 끄기: localStorage['storyworld.r1343.envyGlass']='{"on":false}'. 점검: window.__STORYWORLD_ENVY_GLASS_R1343__.inspect()
//  · 미검증: GPU 실기기·모바일 프레임(조각 260개 그리기), 실제 플레이 손맛.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_ENVY_GLASS_R1343__)return;
const REV='R1343-envy-glass-1+R1355',KEY='storyworld.r1343.envyGlass';
let prefs={on:true,dots:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'&&Number.isFinite(t)?t:0;};
const TUNE=Object.freeze({first:3,cd:11,cap:1.4,engage:13,chant:.8,waves:3,per:14,gap:.28,speed:9,range:24,r:.45,dmg:.14,maxStuck:260,hMin:.35,hMax:2.1});
const SH=Object.freeze({fly:'assets/r1343/shard-fly8.webp',burst:'assets/r1343/burst12.webp',embed:'assets/r1343/embed8.webp',strike:'assets/r1343/dots-d04-strike12.webp',glint:'assets/r1343/dots-d04-glint8.webp'});
const N={fly:8,burst:12,embed:8,strike:12,glint:8},COLS={burst:6},D04_W=.834;
const stats={casts:0,fired:0,hits:0,dealt:0,octants:0,drawn:{fly:0,burst:0,embed:0,strike:0,glint:0},otherDraw:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const P=()=>G('player');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
/* 벽만 본다: 조각은 공중으로 날아 가구·소품 위를 지나가고, 방 벽(탐사 레이아웃 바닥 밖·벽 상자)이나 맵 끝에서 멈춰 박힌다.
   탐사 레이아웃이 없으면 엔진 blocked() 로. */
function free(x,y,r=.08){try{const room=G('room'),L=room?.exploration,E=window.StoryPhase1?.explorationBlocked;
  if(L&&typeof E==='function')return !E(L,x,y,r);/* 탐사 지도는 엔진 N(30) 보다 넓다 — N 경계로 막지 않는다 */
  const b=G('blocked');return typeof b!=='function'||!b(x,y,r);}catch(_){return false;}}
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
function isBoss(e){if(!e||e.r61Clone)return false;const id=String(e.nativeId||'');if(id==='b03-boss')return true;return !!e.boss&&/레비아탄/.test(String(e.name||''));}
function boss(){for(const e of G('room')?.enemies||[])if(isBoss(e)&&e.hp>0&&e.spawnState==='active'&&!e.disabled)return e;return null;}
let cast=null,seenAt=null,next=0,lastT=-1,stuck=[],stuckRoom=null,warmed=-9,seed=1343;
function drop(){if(cast?.boss)cast.boss.r1343Cast=false;cast=null;}
const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
const REJECT=new Set(['ignored','invulnerable','parried']);
function hit(e,x,y){if(!cast)return false;const base=Number(e.damage)||0,dmg=base*TUNE.dmg;if(!(dmg>0)||cast.dealt+dmg>base*TUNE.cap+1e-9)return false;
 let r;try{const h=G('hurt');if(typeof h==='function')r=h(dmg,{x,y,owner:e.id,kind:'r1343-glass',r1343:'shard'});}catch(err){fail(err);}
 if(REJECT.has(r))return false;cast.dealt+=dmg;stats.hits++;stats.dealt=cast.dealt;return true;}
function start(e,now){drop();stats.casts++;cast={t0:now,room:G('room'),boss:e,bx:e.x,by:e.y,dealt:0,shots:[],wave:0,oct:new Set(),done:false};stats.dealt=0;stats.fired=0;stats.octants=0;}
function hold(e,now){e.r1343Cast=true;e.moving=false;e.nav=[];e.r230At=now;if(cast){e.x=cast.bx;e.y=cast.by;}}
function fire(e,now){const c=cast,rot=rnd()*Math.PI*2/TUNE.per;
 for(let i=0;i<TUNE.per;i++){const a=rot+(i+(c.wave%2)*.5)/TUNE.per*Math.PI*2+(rnd()-.5)*.12;
  c.shots.push({x:e.x,y:e.y,a,vx:Math.cos(a),vy:Math.sin(a),trav:0,t0:now,live:true,spin:rnd()*8});
  c.oct.add(((Math.round(a/(Math.PI/4))%8)+8)%8);stats.fired++;}
 stats.octants=c.oct.size;c.wave++;}
function embed(s,now){/* 벽 바로 앞 마지막 빈 자리까지 다가간다(반으로 나눠 찾기) */
 let lo=0,hi=TUNE.speed*.1;for(let k=0;k<8;k++){const m=(lo+hi)/2;if(free(s.x+s.vx*m,s.y+s.vy*m))lo=m;else hi=m;}
 const x=s.x+s.vx*lo,y=s.y+s.vy*lo;
 /* 진행 방향 .5 안에 벽이 없으면(모서리 스침 등) 박지 않는다 */
 let wall=false;for(let d=.05;d<=.5;d+=.05)if(!free(x+s.vx*d,y+s.vy*d)){wall=true;break;}
 if(!wall)return;
 stuck.push({x,y,a:s.a,h:TUNE.hMin+rnd()*(TUNE.hMax-TUNE.hMin),t0:now,ph:rnd()*6,sz:.85+rnd()*.4});
 if(stuck.length>TUNE.maxStuck)stuck.splice(0,stuck.length-TUNE.maxStuck);}
function stepCast(e,now,dt){const c=cast,age=now-c.t0,p=P();
 const last=TUNE.chant+(TUNE.waves-1)*TUNE.gap;if(age<last+.15)hold(e,now);else e.r1343Cast=false;
 while(c.wave<TUNE.waves&&age>=TUNE.chant+c.wave*TUNE.gap)fire(e,now);
 for(const s of c.shots){if(!s.live)continue;let st=TUNE.speed*dt;
  /* 한 틱에 긴 거리를 가면 벽을 건너뛰지 않게 잘게 나눈다 */
  const n=Math.max(1,Math.ceil(st/.2));for(let k=0;k<n&&s.live;k++){const d=st/n,nx=s.x+s.vx*d,ny=s.y+s.vy*d;
   if(!free(nx,ny)){s.live=false;embed(s,now);break;}
   s.x=nx;s.y=ny;s.trav+=d;if(s.trav>=TUNE.range){s.live=false;break;}
   if(dist(s,p)<=TUNE.r&&hit(e,s.x,s.y)){s.live=false;break;}}}
 if(c.wave>=TUNE.waves&&!c.shots.some(s=>s.live)&&age>=TUNE.chant+.62)c.done=true;}
function clearRoom(){stuck=[];stuckRoom=null;}
function step(){if(!prefs.on){drop();return;}
 const room=G('room');if(room&&stuckRoom&&room!==stuckRoom)clearRoom();
 if(paused())return;const now=T();
 if(now<lastT){drop();seenAt=null;next=now+TUNE.first;lastT=now;return;}
 if(!(now>lastT)){lastT=now;return;}const dt=Math.min(.1,now-lastT);lastT=now;
 if(cast&&(cast.room!==room||!(cast.boss.hp>0)||cast.boss.spawnState!=='active')){drop();next=now+TUNE.cd;}
 const e=cast?cast.boss:boss();if(!e){seenAt=null;return;}
 if(!cast){if(dist(P(),e)>TUNE.engage)return;if(seenAt===null||seenAt>now){seenAt=now;next=Math.max(next,now+TUNE.first);}
  if(now>=next&&!e.attack){start(e,now);stuckRoom=room;}else return;}
 try{stepCast(e,now,dt);}catch(err){fail(err);cast.done=true;}
 if(cast&&(cast.done||now-cast.t0>8)){drop();next=now+TUNE.cd;}}
// ---- 그리기(시트만) ----
function want(path){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(path);}catch(_){}}
function img(path){try{const r=G('readyImage')?.(path),im=r?.image;if(!r)want(path);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
const AH=()=>{try{return G('actorHeight')?.()||60;}catch(_){return 60;}};
function sc(c,id,x,y,fn){if(typeof c.scope==='function')c.scope({id:'r1343:'+id,kind:'effect',enemy:true,ownerType:'enemy',x,y,groundAligned:false,lightShadowApproved:true},fn);else fn();}
/* key 시트의 f 칸을 (ox,oy) 기준점에 그린다. 기준점은 칸 안 (px,py)(0~1). ang 만큼 돌린다. */
function frame(key,f,ox,oy,w,h,px,py,ang,alpha){const im=img(SH[key]);if(!im||!(alpha>0))return;const c=G('ctx'),n=N[key],cols=COLS[key]||n,rows=Math.ceil(n/cols),cw=(im.naturalWidth||im.width)/cols,ch=(im.naturalHeight||im.height)/rows,i=Math.max(0,Math.min(n-1,f|0));
 c.save();c.globalAlpha=Math.min(1,alpha);c.translate?.(ox,oy);if(ang)c.rotate?.(ang);c.drawImage(im,(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch,-w*px,-h*py,w,h);c.restore();stats.drawn[key]++;}
function scrAng(x,y,a){const pr=G('project'),q0=pr(x,y),q1=pr(x+Math.cos(a)*.5,y+Math.sin(a)*.5);return Math.atan2(q1.y-q0.y,q1.x-q0.x);}
const SHAPES=['arc','lineTo','fillRect','strokeRect','stroke','fill','ellipse','rect'];
function draw(){const c=G('ctx'),pr=G('project');if(!c||typeof pr!=='function')return;const now=T(),U=unit(),ah=AH();
 /* 도형 그리기 감시: 이 오버레이가 그리는 동안 선·원 호출을 센다(0 이어야 함) */
 const saved={};for(const m of SHAPES)if(typeof c[m]==='function'){saved[m]=c[m];c[m]=function(...a){stats.otherDraw++;return saved[m].apply(this,a);};}
 try{
  for(const q of stuck){const a=now-q.t0,s=pr(q.x,q.y),ang=scrAng(q.x,q.y,q.a)-Math.PI/2,W=U*1.7*q.sz;
   /* 박힘 1~8칸(0.45초) 뒤 마지막 칸, 7초마다 한 번 반사광(5~7칸) */
   const g=((now+q.ph)%7),ox=s.x,oy=s.y-q.h*U;
   if(prefs.dots&&img(SH.strike)&&img(SH.glint)){const Wd=W*D04_W;/* R1355: Dots 꽂힘 → 박힌 몸(embed 마지막 칸) + 반짝 */
    sc(c,'s'+(q.x*131+q.y*7|0),q.x,q.y,()=>{const ea=a<.2?0:Math.min(1,(a-.2)/.25);if(ea>0)frame('embed',7,ox,oy,W,W,.5,132/160,ang,ea);
     if(a<.45)frame('strike',a/.45*10.99,ox,oy,Wd,Wd,.5,.5,ang,1);else if(g<.36)frame('glint',g/.36*6.99,ox,oy,Wd,Wd,.5,.5,ang,1);});continue;}
   let f=a<.45?a/.45*7.99:7;if(a>=.45&&g<.36)f=4+g/.36*2.99;
   sc(c,'s'+(q.x*131+q.y*7|0),q.x,q.y,()=>frame('embed',f,ox,oy,W,W,.5,132/160,ang,1));}
  if(cast){const e=cast.boss,age=now-cast.t0,s=pr(e.x,e.y),B=U*5.6;
   /* 모음: burst 0~3 칸을 천천히(공중, 몸 가슴 높이), 터짐: 4~11 칸 */
   if(age<TUNE.chant)sc(c,'b0',e.x,e.y,()=>frame('burst',Math.min(3.99,age/TUNE.chant*4),s.x,s.y-ah*.55,B*.8,B*.8,.5,.5,0,.95));
   else{const r=age-TUNE.chant,L=.62;if(r<L)sc(c,'b1',e.x,e.y,()=>frame('burst',4+r/L*7.99,s.x,s.y-ah*.55,B,B,.5,.5,0,1));}
   for(const q of cast.shots)if(q.live){const sp=pr(q.x,q.y),ang=scrAng(q.x,q.y,q.a),W=U*1.8;
    sc(c,'f'+(q.x*97+q.y|0),q.x,q.y,()=>frame('fly',Math.floor((now-q.t0)*14+q.spin)%8,sp.x,sp.y-ah*.5,W,W,62/128,.5,ang,1));}}
 }finally{for(const m in saved)c[m]=saved[m];}}
const SENT={type:'r1343-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
function warm(){const now=T();if(now-warmed<3&&now>=warmed)return;warmed=now;for(const k in SH)if(!G('readyImage')?.(SH[k]))want(SH[k]);}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1343-fx'){try{if(prefs.on)draw();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();if(prefs.on&&(boss()||stuck.length))warm();if(cast||stuck.length)arm();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on){drop();clearRoom();}return {...prefs};}
window.__STORYWORLD_ENVY_GLASS_R1343__=Object.freeze({revision:REV,set,tune:TUNE,sheets:SH,isBoss,
 cast:(force)=>{const e=boss();if(!e)return false;if(force||!cast){start(e,T());stuckRoom=G('room');}return true;},
 reset:(clearStuck)=>{drop();seenAt=null;stats.casts=0;next=0;if(clearStuck)clearRoom();return true;},
 stuckList:()=>stuck.map(q=>({x:q.x,y:q.y,a:q.a,h:q.h})),
 inspect:()=>({revision:REV,prefs:{...prefs},casts:stats.casts,fired:stats.fired,octants:stats.octants,hits:stats.hits,dealt:stats.dealt,drawn:{...stats.drawn},otherDraw:stats.otherDraw,
  casting:!!cast,live:cast?cast.shots.filter(s=>s.live).length:0,stuck:stuck.length,next,errors:stats.errors,lastError})});
})();
