// R585 슬레이어 스킬 이펙트를 Dots 협업 프레임 시트로(CX-0055 SL01~SL10 초안 → Claude 보정, 사용자 2026-11-10 03:24 인계).
//  보정(scripts/r585/refine-cx0055.py): E 흰 바탕 제거 · R 십자가 8칸 완전 성장→9~13 팽창→13 타격→14~23 붕괴 · Q 시전 고리 앞뒤 끝점 맞춤 ·
//   Q 토네이도 앞뒤가 겹치지 않고 서로 채우게 · 작은 피 폭발 최고점 3 · W 십자가를 바닥에 눕힌 정십자로 · 저알파 잔여 제거 · 셀 경계 깃털 ·
//   루프 이음매(오라·고리·토네이도 4장 겹쳐 잇기, EGO 지속은 왕복 재생) · 앞층·막은 영웅 몸 자리를 비움. 셀 192px webp 15장(약 2.9MB).
//  그림만 바꾼다 — 판정·피해·재사용 대기·시간·키는 R425·엔진 그대로.
//   R  적혈 십자가(SL01): R425 'r425:crosses' 그리기 자리를 시트로. 큰 십자가는 몸 뒤, 작은 넷은 몸 앞. 0.55초 피 폭발 순간이 타격 프레임 13.
//      피 폭발(SL02): R425 가 부르는 R190 피 터짐(blood-death·blood-burst)을 큰·작은 폭발 시트로. 오라 연쇄 폭발도 작은 판.
//      적혈 오라(SL03): 'r425:aura-back·front' 를 뒤·앞 시트로(진입 부풀기는 R425 와 같은 식).
//   Q  시전 고리(SL04) 'r425:spin-back·front' · 날아가는 토네이도(SL05) 'r425:tornado' · 출혈(SL06) R190 blood-splash → 출혈 시트.
//   W  피의 희생(SL07) · E 피의 대시(SL08): 원천 스킬 신호(storySourceSkill warning·release·flight·end)를 받아 시트를 띄우고,
//      코드 문양(R209 layer·d2s 노바/피셔·R102)으로는 넘기지 않는다(R425 의 R 과 같은 방식). 맞은 자리 불꽃(stage hit)은 그대로.
//   D  공명방어(SL09): R269 둘레 문양 대신 막 시트.   F EGO(SL10): 진입 시트 + 지속 중 몸 뒤 루프.
//  십자가는 회전·상하 반전 없이 늘 정방향(위 짧고 아래 긴). 시트가 아직 안 받아졌으면 예전 그림 그대로. 슬레이어일 때만 시트를 받는다.
//  렉: 동시에 떠 있는 시트 이펙트 20개(저사양 8개)까지, 넘치면 새 출혈·연쇄 폭발부터 건너뛴다.
//  끄기: localStorage['storyworld.r585.slayer-sheets']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_SHEETS_R585__)return;
const REV='R585-slayer-sheets-1',KEY='storyworld.r585.slayer-sheets',HERO='slayer',DIR='assets/r585/';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
// 시트 표(assets/r585/index.json 과 같음 — CPU 검사가 대조한다). pivot 은 원본 256 칸 기준.
const META=Object.freeze({
 'slayer-r-cross':{frames:24,fps:24.5,pivot:[128,224],hit:13},
 'slayer-burst-big':{frames:24,fps:18,pivot:[128,224],hit:5},
 'slayer-burst-small':{frames:24,fps:18,pivot:[128,224],hit:3},
 'slayer-r-aura-back':{frames:20,fps:12.5,pivot:[128,224],loop:true,gloss:.3},
 'slayer-r-aura-front':{frames:20,fps:12.5,pivot:[128,224],loop:true},
 'slayer-q-spin-back':{frames:20,fps:40,pivot:[128,224],loop:true,gloss:.5},
 'slayer-q-spin-front':{frames:20,fps:40,pivot:[128,224],loop:true,gloss:.5},
 'slayer-q-tornado-back':{frames:20,fps:24,pivot:[128,232],loop:true,gloss:.45},
 'slayer-q-tornado-front':{frames:20,fps:24,pivot:[128,232],loop:true,gloss:.45},
 'slayer-bleed':{frames:24,fps:16,pivot:[128,224]},
 'slayer-w-sacrifice':{frames:24,fps:14,pivot:[128,192],hit:8,gloss:.5},
 'slayer-e-dash':{frames:24,fps:16,pivot:[128,208],hit:12},
 'slayer-d-guard':{frames:24,fps:12.5,pivot:[128,224],loop:true},
 'slayer-ego-enter':{frames:24,fps:14,pivot:[128,224],hit:8},
 'slayer-ego-loop':{frames:24,fps:10,pivot:[128,224],loop:true,pingpong:true}});
const CELL=192,COLS=6,NAMES=Object.keys(META),PATH=n=>DIR+n+'.webp';
const NEED={r:['slayer-r-cross','slayer-burst-big','slayer-burst-small','slayer-r-aura-back','slayer-r-aura-front'],q:['slayer-q-spin-back','slayer-q-spin-front','slayer-q-tornado-back','slayer-q-tornado-front','slayer-bleed'],
 w:['slayer-w-sacrifice'],e:['slayer-e-dash'],d:['slayer-d-guard'],f:['slayer-ego-enter','slayer-ego-loop']};
const stats={draws:0,spawn:{},skippedCap:0,swallowed:0,passed:0,fallbacks:0,requested:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const AH=()=>typeof actorHeight==='function'?actorHeight():54;
const TP=()=>(typeof TILE==='number'?TILE:34)*(typeof zoom==='number'?zoom:1);
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const isHero=()=>typeof player==='object'&&!!player&&player.hero===HERO&&player.hp>0;
const S425=()=>window.__STORYWORLD_SLAYER_BLOOD_R425__;
const egoActive=()=>{try{return !!window.__STORYWORLD_EGO151__?.inspect?.()?.state?.active;}catch(_){return false;}};
const img=n=>{try{const r=typeof readyImage==='function'?readyImage(PATH(n)):null;return r?.image||null;}catch(_){return null;}};
// W 시트는 보류: 2026-11-10 헤드리스 비교에서 옛 W 보다 약하고 십자가가 작은 사람처럼 읽힘 → Dots SL-07b(바닥 문양) 올 때까지 옛 W 유지.
// 비교용으로만 localStorage storyworld.r585.w-sheet = 'on' 이면 켠다.
const HOLD=new Set((()=>{try{return localStorage.getItem('storyworld.r585.w-sheet')==='on'?[]:['w'];}catch(_){return ['w'];}})());
const ready=slot=>on&&!HOLD.has(slot)&&(NEED[slot]||[]).every(n=>!!img(n));
// 엔진 그림 저장소는 새 게임·지역 이동 때 비워질 수 있다 → 아직 안 읽힌 시트만 게임 시간 2초마다 다시 부탁한다(매 틱 아님).
let lastAsk=-1e9;function request(){if(!isHero())return;const t=Number(typeof time!=='undefined'?time:0)||0;if(t-lastAsk<2&&t>=lastAsk)return;const miss=NAMES.filter(n=>!img(n));if(!miss.length)return;lastAsk=t;try{if(typeof ensureImages==='function'){const r=ensureImages(miss.map(PATH));if(r&&typeof r.catch==='function')r.catch(()=>{});stats.requested++;}}catch(e){fail(e);}}
function frameAt(n,age){const m=META[n];let f=Math.floor(age*m.fps+1e-6);if(f<0)f=0;if(m.pingpong){const p=2*(m.frames-1);f%=p;if(f>=m.frames)f=p-f;}else if(m.loop)f%=m.frames;else if(f>=m.frames)return -1;return f;}
// 시트 한 칸 그리기: 피벗을 (x,y) 에. w·h 는 화면에 그릴 셀 크기. angle/flipX 는 E 궤적만 쓴다(십자가에는 쓰지 않는다).
function sheet(n,f,x,y,w,h,o={}){const im=img(n);if(!im||f<0||typeof ctx==='undefined'||!ctx)return false;const m=META[n],sx=(f%COLS)*CELL,sy=Math.floor(f/COLS)*CELL,px=m.pivot[0]/256,py=m.pivot[1]/256,ax=o.ax??px;
 const draw=()=>{ctx.save();try{ctx.globalAlpha*=Math.max(0,Math.min(1,o.alpha??1));if(o.blend)ctx.globalCompositeOperation=o.blend;ctx.translate(x,y);if(o.flipX)ctx.scale(-1,1);if(o.angle)ctx.rotate(o.angle);ctx.drawImage(im,sx,sy,CELL,CELL,-ax*w,-py*h,w,h);stats.draws++;if(m.gloss&&!lowFx()){ctx.globalAlpha*=m.gloss;ctx.globalCompositeOperation='lighter';ctx.drawImage(im,sx,sy,CELL,CELL,-ax*w,-py*h,w,h);}}finally{ctx.restore();}};
 const own={id:'r585:'+n,kind:'effect',r585:true,sheet:n,frame:f,x:o.wx,y:o.wy,groundAligned:false};
 if(scopeBase&&ctx===hooked)scopeBase.call(ctx,own,draw);else if(typeof ctx.scope==='function')ctx.scope(own,draw);else draw();return true;}
// ---- 시트 이펙트 목록(엔진 effects 에 넣어 나이·수명은 엔진이 돌린다) ----
const live=()=>{try{return Array.isArray(effects)?effects.filter(f=>f&&f.type==='r585-sheet'):[];}catch(_){return [];}};
function spawn(n,x,y,o={}){const cap=lowFx()?8:20,L=live();if(L.length>=cap){stats.skippedCap++;return null;}const m=META[n],start=o.start||0;
 const f={type:'r585-sheet',sheet:n,x,y,age:0,start,life:Math.max(.05,m.frames/m.fps-start),...o};try{effects.push(f);}catch(_){return null;}stats.spawn[n]=(stats.spawn[n]||0)+1;return f;}
function drawSpawned(f){const n=f.sheet,age=(f.age||0)+(f.start||0),fr=frameAt(n,age),q=project(f.x,f.y),H=AH(),U=TP();if(fr<0)return;
 const tail=Math.min(1,Math.max(0,(f.life-(f.age||0))*6));
 if(n==='slayer-burst-big'||n==='slayer-burst-small'){const d=2*(f.r||1.6)*U*Math.SQRT2/.92;sheet(n,fr,q.x,q.y,d,d,{alpha:tail,wx:f.x,wy:f.y});return;}
 if(n==='slayer-bleed'){const d=H*1.35;sheet(n,fr,q.x,q.y,d,d,{alpha:tail,wx:f.x,wy:f.y});return;}
 if(n==='slayer-w-sacrifice'){const d=2*2.6*U*Math.SQRT2/.92;sheet(n,fr,q.x,q.y,d,d,{alpha:tail,wx:f.x,wy:f.y});return;}
 if(n==='slayer-ego-enter'){const lift=Math.min(Math.max(+player?.visualLiftPx||0,0),H*.65),d=H*256/150*1.25;sheet(n,fr,q.x,q.y-lift,d,d,{alpha:tail,wx:f.x,wy:f.y});return;}
 if(n==='slayer-e-dash'){const b=project(f.tx,f.ty),dx=b.x-q.x,dy=b.y-q.y,L=Math.max(H*.6,Math.hypot(dx,dy)),flip=dx<0,ang=Math.atan2(dy,flip?-dx:dx),w=L/.9,h=H*1.7;
  sheet(n,fr,q.x,q.y,w,h,{alpha:tail,angle:ang,flipX:flip,ax:.05,wx:f.x,wy:f.y});}}
// ---- R: 십자가·오라 / Q: 고리·토네이도 — R425 그리기 자리(scope id)를 가로챈다 ----
function crossesOf(x,y){const scr=(sx,sy)=>({x:x+sx*.5*2.3+sy*.5*1.1,y:y-sx*.5*2.3+sy*.5*1.1});/* R425 startR 와 같은 자리 */
 return [{...scr(0,0),k:2.6,big:true},{...scr(-2,-1),k:1.3},{...scr(-2,1),k:1.3},{...scr(2,-1),k:1.3},{...scr(2,1),k:1.3}];}
let crossAt=null;// {x,y} — 큰 십자가는 몸 뒤에 그리려고 R 시전 자리를 기억
function drawCross(c,age){const q=project(c.x,c.y),fr=frameAt('slayer-r-cross',age),d=AH()*c.k/.75;if(fr<0)return false;return sheet('slayer-r-cross',fr,q.x,q.y,d,d,{wx:c.x,wy:c.y});}
function rState(){try{return S425()?.state?.()?.R||null;}catch(_){return null;}}
function qState(){try{return S425()?.state?.()?.Q||null;}catch(_){return null;}}
function heroFoot(){const q=project(player.x,player.y),H=AH();return {x:q.x,y:q.y-Math.min(Math.max(+player.visualLiftPx||0,0),H*.65),H};}
const REPLACE={
 'r425:crosses'(o){if(!ready('r'))return false;const R=rState();if(!R)return true;crossAt={x:o.x,y:o.y};if(R.age>META['slayer-r-cross'].frames/META['slayer-r-cross'].fps)return true;
  for(const c of crossesOf(o.x,o.y))if(!c.big)drawCross(c,R.age);return true;},
 'r425:aura-back'(){if(!ready('r'))return false;aura('slayer-r-aura-back');return true;},
 'r425:aura-front'(){if(!ready('r'))return false;aura('slayer-r-aura-front');return true;},
 'r425:spin-back'(){if(!ready('q'))return false;spin('slayer-q-spin-back');return true;},
 'r425:spin-front'(){if(!ready('q'))return false;spin('slayer-q-spin-front');return true;},
 'r425:tornado'(o){if(!ready('q'))return false;tornado(o);return true;}};
function aura(n){const R=rState(),{x,y,H}=heroFoot(),since=R?Math.max(0,7-(+R.auraLeft||0)):0,swell=1+.35*Math.max(0,1-since/.6),d=H*256/150*1.12*swell;sheet(n,frameAt(n,since),x,y,d,d,{alpha:n.endsWith('front')?.9:1,wx:player.x,wy:player.y});}
function spin(n){const Q=qState();if(!Q)return;const {x,y,H}=heroFoot(),age=+Q.age||0,k=Math.min(1,age/.12),post=Q.launched?Math.max(0,age-.32):0,fade=Q.launched?Math.max(0,1-post/.16):1,d=H*256/150*1.2*(.75+.25*k);
 sheet(n,frameAt(n,age),x,y,d,d,{alpha:fade,wx:player.x,wy:player.y});}
function tornado(o){let f=null;try{f=effects.find(e=>e&&e.type==='r425-tornado');}catch(_){}const age=f?.age||0,life=f?.life||1.05,q=project(o.x,o.y),H=AH(),grow=Math.min(1,.5+age*4),al=Math.max(0,Math.min(1,(life-age)*4)),d=H*2.05*256/211*grow;
 sheet('slayer-q-tornado-back',frameAt('slayer-q-tornado-back',age),q.x,q.y,d,d,{alpha:al,wx:o.x,wy:o.y});
 sheet('slayer-q-tornado-front',frameAt('slayer-q-tornado-front',age),q.x,q.y,d,d,{alpha:al,wx:o.x,wy:o.y});}
// 기록기 scope 를 한 번 감싼다(R425 파일은 그대로 둔다)
let hooked=null,scopeBase=null;
function hook(){try{if(typeof ctx==='undefined'||!ctx||typeof ctx.scope!=='function'||ctx===hooked||ctx.scope.__r585)return;const base=ctx.scope,c=ctx;
 const w=function(owner,fn){const id=owner&&owner.id;if(on&&typeof id==='string'&&REPLACE[id]&&isHero()){try{if(REPLACE[id](owner))return;}catch(e){fail(e);}stats.fallbacks++;}return base.call(this,owner,fn);};
 w.__r585=true;c.scope=w;hooked=c;scopeBase=base;}catch(e){fail(e);}}
// ---- R190 피 터짐: R425 만 window 로 부른다 → 슬레이어 시트로 ----
const B0=window.__STORYWORLD_BLOOD_R190__;
if(B0&&typeof B0.play==='function'){window.__STORYWORLD_BLOOD_R190__=Object.freeze({...B0,play(name,x,y,o){
 try{if(isHero()&&(name==='blood-death'||name==='blood-burst')&&ready('r')){const big=name==='blood-death',n=big?'slayer-burst-big':'slayer-burst-small',m=META[n],k=+o?.k||1;
   if(spawn(n,x,y,{r:big?3.2:k>1.45?1.7:1.5,start:Math.max(0,(m.hit-1)/m.fps)}))return {r585:n};return null;}
  if(isHero()&&name==='blood-splash'&&ready('q')){if(spawn('slayer-bleed',x,y,{start:0}))return {r585:'slayer-bleed'};return null;}}catch(e){fail(e);}
 return B0.play.apply(B0,arguments);}});}
// ---- W·E: 원천 스킬 신호를 시트로 ----
const decided=new Map();
function claim(o){const id=String(o.castId??'');if(decided.has(id))return decided.get(id);const v=ready(o.sourceSlot);decided.set(id,v);if(decided.size>64)decided.delete(decided.keys().next().value);return v;}
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){
 try{const o=opt||{};if(on&&type==='storySourceSkill'&&o.storyWER&&o.sourceHero===HERO&&(o.sourceSlot==='w'||o.sourceSlot==='e')&&o.stage!=='hit'&&isHero()&&claim(o)){
   if(o.sourceSlot==='w'&&o.stage==='release')spawn('slayer-w-sacrifice',x,y,{castId:o.castId});
   if(o.sourceSlot==='e'&&o.stage==='flight'&&Number.isFinite(o.tx)&&Number.isFinite(o.ty))spawn('slayer-e-dash',x,y,{tx:o.tx,ty:o.ty,castId:o.castId});
   stats.swallowed++;return null;}}catch(e){fail(e);}
 stats.passed++;return base.apply(this,arguments);};}
// ---- F EGO 진입 ----
if(typeof ego==='function'){const base=ego;ego=function(...a){const e0=typeof player==='object'&&player?(player.ego||0):0;const r=base.apply(this,a);
 try{if(isHero()&&(player.ego||0)>e0&&ready('f')){spawn('slayer-ego-enter',player.x,player.y,{start:0});egoT0=T();}}catch(e){fail(e);}return r;};}
let egoT0=0;
// ---- 그리기 연결 ----
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){
 if(e&&e.type==='r585-sheet'){try{hook();drawSpawned(e);}catch(err){fail(err);}return;}
 try{if(on&&e&&e.type==='r269-guard'&&isHero()&&ready('d')&&player.guard){const {x,y,H}=heroFoot(),d=H*256/150*1.3;sheet('slayer-d-guard',frameAt('slayer-d-guard',T()),x,y,d,d,{alpha:.92,wx:player.x,wy:player.y});return;}}catch(err){fail(err);}
 hook();return base.apply(this,[e,...a]);};}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){hook();
 try{if(on&&isHero()){
   if(egoActive()&&ready('f')){const {x,y,H}=heroFoot(),d=H*256/150*1.3;sheet('slayer-ego-loop',frameAt('slayer-ego-loop',T()-egoT0),x,y,d,d,{alpha:.95,wx:player.x,wy:player.y});}
   const R=rState();if(R&&crossAt&&ready('r')&&R.age<=META['slayer-r-cross'].frames/META['slayer-r-cross'].fps)drawCross(crossesOf(crossAt.x,crossAt.y)[0],R.age);/* 큰 십자가는 몸 뒤 */
   if(!R)crossAt=null;}}catch(e){fail(e);}
 return base.apply(this,a);};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{request();if(on&&isHero()){const R=rState();if(R&&!crossAt&&R.age<.05)crossAt={x:player.x,y:player.y};}}catch(e){fail(e);}return r;};}
// R 시작 자리: R425 는 시전 순간 영웅 자리에 십자가를 세운다 → fx 신호(r warning)에서 기억해 두면 첫 장면부터 큰 십자가를 몸 뒤에 그릴 수 있다
if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){try{const o=opt||{};if(type==='storySourceSkill'&&o.sourceHero===HERO&&o.sourceSlot==='r'&&o.stage==='warning'&&isHero())crossAt={x:player.x,y:player.y};}catch(e){fail(e);}return base.apply(this,arguments);};}
window.__STORYWORLD_SLAYER_SHEETS_R585__=Object.freeze({revision:REV,meta:META,claims:slot=>ready(String(slot)),
 inspect:()=>({revision:REV,on,stats:{...stats,spawn:{...stats.spawn}},lastError,live:live().length,ready:Object.fromEntries(Object.keys(NEED).map(k=>[k,ready(k)])),GPU:false,browser:false}),
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}});
})();
