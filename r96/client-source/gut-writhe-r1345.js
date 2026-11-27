// R1345 — 탐식 보스(베엘제붑, b04-boss) '위장의 꿈틀거림': 보스방 전역이 위장처럼 꿈틀거린다(프레임 애니메이션 시트만).
//  사용자 2026-11-26 13:47Z "탐식주방 보스가 보스방전역에서 마치 위장이 꿈틀거리는듯한 프레임애니메이션스킬을 사용하도록"
//  · 보스가 멈춰 서서 숨을 들이켜면(0.9초) 보스방 가장자리를 따라 위벽 조각들이 연동하듯 꿈틀거리기 시작한다(gut-wall12 고리).
//  · 이어 보스 자리에서 바깥으로 4파에 걸쳐 바닥 곳곳의 위 점막 주름이 솟아(gut-fold12 0~4칸) 쥐어짜듯 수축하고(5~8칸, 6칸에 명중) 가라앉는다.
//    주름은 보스방 틀(worldWardR81.bossBounds) 전체에 육각 격자로 흩어져 사이마다 피할 틈이 있다. 예고는 솟는 그림 자체(바닥 장판 없음).
//  · 피해: 주름 하나 .3 × 보스 근접 피해, 한 시전 합 ≤ 1.0대. 엔진 hurt() 가 거절(무적·패링·무시)하면 맞지 않은 것.
//  · R1345b(사용자 2026-11-27 00:45Z): "조리대를 붙잡으려다 그것마저 거대한 위장처럼 꿈틀거리는 것을 보고 물러났다" 대사(R450 체력 50% 박자)가
//    나오는 순간(.5초 뒤)부터 쓴다. 그 전에는 안 쓰고, 한 번 시작되면 체력이 회복돼도 16초마다 이어 쓴다.
//  · R1263 탐식 스킬(식칼·독가스)과 겹치지 않게, 그쪽이 시전 중이거나 6초 안에 시전할 차례면 기다린다.
//  · 그림: assets/r1345/gut-fold12.webp·gut-wall12.webp — 임시(scripts/r1345-gut-sheets.py 오프라인 래스터 렌더, final:false). Dots 시트가 오면 같은 이름으로 교체.
//  끄기: localStorage['storyworld.r1345.gutWrithe']='{"on":false}'. 점검: window.__STORYWORLD_GUT_WRITHE_R1345__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_GUT_WRITHE_R1345__)return;
const REV='R1345c-gut-writhe-3',KEY='storyworld.r1345.gutWrithe';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={casts:0,hits:0,dealt:0,errors:0,drawn:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const G=n=>{try{return Function('return typeof '+n+"!=='undefined'?"+n+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'?t:0;};
const TUNE=Object.freeze({beatDelay:.5,lineWait:7,cd:16,cap:1.0,engage:13,clear:6,half:.5});
const BEAT='거대한 위장처럼 꿈틀';
const GW=Object.freeze({chant:.9,waves:4,waveGap:.55,fps:10,rippleFps:20,rippleAlpha:.85,frames:12,hitFrame:6,foldR:1.0,dmg:.3,maxFolds:36,minSpacing:2.6,bossGap:1.4,maxWalls:24,wallStep:2.4,fade:.4,fallback:7});
/* R1345c: ripple = Dots 정식 SW-R1352-D01 gastric_floor_ripple(24칸 12×2, 피벗 가운데, 정점 10칸) — 주름 자리 바닥이 먹빛으로 꿈틀거린다(주름과 같은 순간 시작, 판정은 주름) */
const SH=Object.freeze({fold:'assets/r1345/gut-fold12.webp',wall:'assets/r1345/gut-wall12.webp',ripple:'assets/r1345/gastric-ripple24.webp'});
const PIV={fold:236/256,wall:184/192,ripple:.5},NF={fold:12,wall:12,ripple:24},COLS={ripple:12};
function which(e){if(!e||e.r61Clone)return null;const id=String(e.nativeId||'');if(id==='b04-boss')return 'gluttony';if(id&&/^(b0|mb-)/.test(id))return null;return /베엘제붑|탐식의 귀/.test(String(e.name||''))?'gluttony':null;}
const P=()=>G('player');
function paused(){return !G('started')||G('loading')||G('modal')||G('storyScene')||!P()||!(P().hp>0)||!G('room');}
function free(x,y,r=.27){try{const b=G('blocked');return typeof b!=='function'||!b(x,y,r);}catch(_){return false;}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let cast=null,next=0,lastT=-1,warmed=-9,beatFirst=false;const trig=new WeakMap(),pend=new WeakMap();
function boss(){for(const e of G('room')?.enemies||[]){if(which(e)&&e.hp>0&&e.spawnState==='active'&&!e.disabled)return e;}return null;}
function bounds(room,e){const bb=room?.exploration?.worldWardR81?.bossBounds;
 if(Array.isArray(bb)&&bb.length===4&&bb.every(Number.isFinite)&&bb[2]-bb[0]>2&&bb[3]-bb[1]>2)return bb.slice();const f=GW.fallback;return [e.x-f,e.y-f,e.x+f,e.y+f];}
/* R1345b: 정본 '조리대를 붙잡으려다 그것마저 거대한 위장처럼 꿈틀거리는 것을 보고 물러났다' 대사(R450 half 박자 = 체력 50% 이하)가
   나오는 순간부터 쓴다. 화면 줄(#r450Beat)에 그 대사가 떠 있거나 체력이 50% 이하가 되면 그 보스는 켜진 채로 남는다. */
function beatLine(){try{const d=typeof document!=='undefined'?document:null,el=d?.getElementById?.('r450Beat');return !!(el&&String(el.textContent||'').includes(BEAT)&&Number(el.style?.opacity??1)>.05);}catch(_){return false;}}
function halfHp(e){return (Number(e.hp)||0)/Math.max(1,Number(e.maxHp)||1)<=TUNE.half;}
const r450On=()=>{try{const i=window.__STORYWORLD_BATTLE_BEATS_R450__?.inspect?.();return !!(i&&i.on!==false);}catch(_){return false;}};
/* 대사가 화면에 떴으면 그 순간. R450 이 켜져 있으면 50% 순간에는 대사가 앞 대사 뒤에 줄 서 있을 수 있어 뜰 때까지(최대 7초) 기다리고, 꺼져 있으면 50% 순간 */
function beatAt(e,now){if(beatLine())return now;const st=pend.get(e);if(!halfHp(e)&&st===undefined)return null;if(st===undefined)pend.set(e,now);
 const t0=pend.get(e);return !r450On()||now-t0>=TUNE.lineWait?now:null;}
/* R1263 탐식 스킬이 시전 중이거나 곧(clear 초 안) 시전할 차례면 기다린다. 3초 넘게 밀린 예약은 무시(굶지 않게) */
function r1263Busy(now,castingOnly){try{const i=window.__STORYWORLD_SIN_SKILLS_R1263__?.inspect?.();if(!i||i.prefs?.on===false)return false;if(i.casting)return true;if(castingOnly)return false;const n=Number(i.next);return Number.isFinite(n)&&n-now<TUNE.clear&&n-now>-3;}catch(_){return false;}}
function layout(e,room,now){const bb=bounds(room,e),W=bb[2]-bb[0],H=bb[3]-bb[1];
 const sp=Math.max(GW.minSpacing,Math.sqrt(W*H/(.866*GW.maxFolds))),rowH=sp*.866,rot=(stats.casts*1.37)%1;
 let pts=[];for(let r=0,y=bb[1]+rowH*(.35+rot*.3);y<bb[3]-.3;r++,y+=rowH)for(let x=bb[0]+sp*(.3+(r%2)*.5+rot*.2);x<bb[2]-.3;x+=sp){
  const j=((r*7+Math.round(x*3))%5)/5-.4,q={x:x+j*.5,y:y-j*.4};if(dist(q,e)<GW.bossGap||!free(q.x,q.y,.2))continue;pts.push(q);}
 if(pts.length>GW.maxFolds){pts.sort((a,b)=>dist(a,e)-dist(b,e));const k=pts.length/GW.maxFolds;pts=Array.from({length:GW.maxFolds},(_,i)=>pts[Math.floor(i*k)]);}
 /* 영웅이 선 자리에도 하나(가만히 서 있으면 쥐어짜인다) — 가까운 격자 주름은 빼고 바꿔 넣는다 */
 const p=P();if(p&&p.x>=bb[0]&&p.x<=bb[2]&&p.y>=bb[1]&&p.y<=bb[3]&&free(p.x,p.y,.2)){pts=pts.filter(q=>dist(q,p)>=sp*.6);if(pts.length>=GW.maxFolds)pts.pop();pts.push({x:p.x,y:p.y});}
 const far=Math.max(1e-6,...pts.map(q=>dist(q,e)));
 const folds=pts.map((q,i)=>{const w=Math.min(GW.waves-1,Math.floor(dist(q,e)/far*GW.waves-1e-9));return {x:q.x,y:q.y,wave:w,t0:now+GW.chant+w*GW.waveGap+((i*37)%7)/7*.12,hit:false};});
 /* 위벽: 보스방 가장자리를 따라(안쪽 .6, 막히면 1.2) */
 const walls=[],per=2*(W+H),n=Math.min(GW.maxWalls,Math.max(8,Math.floor(per/GW.wallStep))),stepL=per/n;
 for(let i=0;i<n;i++){let s=(i+.5)*stepL,q;const edge=(ins)=>{let t=s;if(t<W)return {x:bb[0]+t,y:bb[1]+ins};t-=W;if(t<H)return {x:bb[2]-ins,y:bb[1]+t};t-=H;if(t<W)return {x:bb[2]-t,y:bb[3]-ins};t-=W;return {x:bb[0]+ins,y:bb[3]-t};};
  for(const ins of [.6,1.2,1.6]){const c=edge(ins);if(free(c.x,c.y,.2)){q=c;break;}}if(q)walls.push({x:q.x,y:q.y,ph:i*3%12});}
 return {bb,folds,walls};}
function hit(e,x,y){if(!cast)return false;const base=Number(e.damage)||0,dmg=base*GW.dmg;if(!(dmg>0)||cast.dealt+dmg>base*TUNE.cap+1e-9)return false;
 let r;try{const h=G('hurt');if(typeof h==='function')r=h(dmg,{x,y,owner:e.id,kind:'r1345-gut',r1345:'gut'});}catch(err){fail(err);}
 if(REJECT.has(r))return false;cast.dealt+=dmg;stats.hits++;stats.dealt+=dmg;return true;}
const REJECT=new Set(['ignored','invulnerable','parried']);
const LIFE=GW.frames/GW.fps,HIT=GW.hitFrame/GW.fps;
function start(e,now){const room=G('room'),L=layout(e,room,now);stats.casts++;cast={t0:now,room,boss:e,bx:e.x,by:e.y,dealt:0,...L,end:null};}
function step(){if(!prefs.on){cast=null;return;}if(paused())return;const now=T();
 if(now<lastT){const left=cast?TUNE.cd:Math.max(0,Math.min(TUNE.cd,next-lastT));cast=null;next=now+left;lastT=now;return;}
 if(!(now>lastT)){lastT=now;return;}lastT=now;
 const room=G('room'),p=P();
 if(cast&&(cast.room!==room||!(cast.boss.hp>0)||cast.boss.spawnState!=='active')){cast=null;next=now+TUNE.cd;}
 const e=cast?cast.boss:boss();if(!e)return;
 if(!cast){if(!trig.has(e)){const at=beatAt(e,now);if(at===null)return;trig.set(e,at);next=at+(beatLine()||!r450On()?TUNE.beatDelay:0);/* 대사 뒤 .5초(읽을 틈), 7초 기다림 끝이면 바로 */beatFirst=true;}
  if(dist(p,e)>TUNE.engage)return;
  /* 대사 순간의 첫 시전은 R1263 이 '시전 중'일 때만 기다린다(곧 시전할 차례는 무시) */
  if(now<next||e.attack||r1263Busy(now,beatFirst))return;beatFirst=false;start(e,now);}
 const c=cast;try{if(now-c.t0<GW.chant){e.moving=false;e.nav=[];e.r230At=now;e.x=c.bx;e.y=c.by;}
  for(const f of c.folds){if(!f.hit&&now>=f.t0+HIT){f.hit=true;if(dist(f,p)<=GW.foldR)hit(e,f.x,f.y);}}
  if(c.end===null&&c.folds.every(f=>now>=f.t0+Math.max(LIFE,NF.ripple/GW.rippleFps)))c.end=now;}catch(err){fail(err);c.end=now;}
 if(c.end!==null&&now>=c.end+GW.fade||now-c.t0>8){cast=null;next=now+TUNE.cd;}}
// ---- 그리기(시트만, 세워 그림) ----
function want(path){try{if(G('loading')||!G('started'))return;const ad=G('addImage');if(typeof ad==='function')ad(path);}catch(_){}}
function img(path){try{const r=G('readyImage')?.(path),im=r?.image;if(!r)want(path);return im&&(im.naturalWidth||im.width)>0?im:null;}catch(_){return null;}}
const unit=()=>(Number(G('TILE'))||32)*(Number(G('zoom'))||1);
function sc(c,id,x,y,fn){if(typeof c.scope==='function')c.scope({id:'r1345:'+id,kind:'effect',enemy:true,ownerType:'enemy',x,y,groundAligned:false,lightShadowApproved:true},fn);else fn();}
function at(key,f,x,y,w,h,alpha){const im=img(SH[key]);if(!im||!(alpha>0))return;const c=G('ctx'),pr=G('project'),n=NF[key],cols=COLS[key]||n,rows=Math.ceil(n/cols),cw=(im.naturalWidth||im.width)/cols,ch=(im.naturalHeight||im.height)/rows,i=Math.max(0,Math.min(n-1,f|0));
 sc(c,key+(x*97+y|0),x,y,()=>{const q=pr(x,y);c.save();c.globalAlpha=Math.min(1,alpha);c.drawImage(im,(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch,q.x-w/2,q.y-h*PIV[key],w,h);c.restore();stats.drawn++;});}
function draw(){const c=G('ctx'),pr=G('project');if(!c||typeof pr!=='function'||!cast)return;const now=T(),U=unit(),a=now-cast.t0;
 const wa=Math.min(1,a/GW.fade)*(cast.end===null?1:Math.max(0,1-(now-cast.end)/GW.fade));const items=[];
 if(wa>0)for(const w of cast.walls)items.push({d:w.x+w.y,fn:()=>at('wall',(Math.floor(now*GW.fps)+w.ph)%GW.frames,w.x,w.y,U*3.4,U*2.55,wa*.95)});
 for(const f of cast.folds){const fa=now-f.t0;if(fa<0)continue;
  if(fa<NF.ripple/GW.rippleFps)items.push({d:f.x+f.y-.01,fn:()=>at('ripple',fa*GW.rippleFps,f.x,f.y,U*4.2,U*4.2,GW.rippleAlpha)});
  if(fa<LIFE)items.push({d:f.x+f.y,fn:()=>at('fold',fa*GW.fps,f.x,f.y,U*2.6,U*2.6,1)});}
 items.sort((p,q)=>p.d-q.d);for(const it of items)it.fn();}
const SENT={type:'r1345-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
function warm(){const now=T();if(now-warmed<3&&now>=warmed)return;warmed=now;for(const k of ['fold','wall','ripple'])if(!G('readyImage')?.(SH[k]))want(SH[k]);}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1345-fx'){try{if(prefs.on)draw();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();if(prefs.on&&boss())warm();if(cast)arm();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)cast=null;return {...prefs};}
window.__STORYWORLD_GUT_WRITHE_R1345__=Object.freeze({revision:REV,set,which,tune:TUNE,gw:GW,sheets:SH,
 cast:(force)=>{const e=boss();if(!e)return false;if(force||!cast)start(e,T());return true;},
 inspect:()=>({revision:REV,prefs:{...prefs},...JSON.parse(JSON.stringify(stats)),casting:!!cast,foldR:GW.foldR,beat:(()=>{const e=cast?.boss||boss();return !!(e&&trig.has(e));})(),
  folds:cast?cast.folds.map(f=>({x:f.x,y:f.y,wave:f.wave,t0:f.t0})):[],walls:cast?cast.walls.map(w=>({x:w.x,y:w.y})):[],bounds:cast?cast.bb:null,next,lastError})});
})();
