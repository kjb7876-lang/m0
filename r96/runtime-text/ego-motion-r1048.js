// R1048 EGO 동작 재생기(사용자 2026-11-15 07:24~07:25Z "에고각성 히든영웅만 … 초일류급 게임 캐릭터처럼 동작이 아주 자연스럽게" · "3디로").
//  3D 모델을 Blender 로 8방향 미리 렌더한 시트(r96/tools/r1048/render_sheets.py → sheets.json + <동작>-<방향>.png)를 게임에서 고르는 '두뇌'.
//  그림을 고르기만 한다 — 판정·피해·시간·쿨다운·키는 바꾸지 않는다. 상태는 R895 동작 법칙(sample)을 그대로 읽어 다른 영웅과 같은 우선순위를 쓴다.
//   1) 상태: 사망 > 대시(run) > 피격(hit) > 관측 폐기(discard) > 스킬·궁극기·기본 공격(attack) > 이동(walk/run, 속도로) > 대기(idle).
//   2) 섞어 넘기기: 상태가 바뀌면 FADE 초 동안 옛 칸을 겹쳐 흐리게 남긴다(뚝 끊기는 전환 없음). 피격·사망은 더 짧게.
//   3) 발 미끄럼 방지: 걷기·달리기는 실제 이동 속도 ÷ 시트 걸음 속도로 재생 빠르기를 맞춘다(발이 바닥에 붙어 보이게).
//   4) 공격: attackAnim 진행도를 예비(windup)→타격(strike)→여운(follow) 칸 구간에 대응. 타격 첫 칸에서 HITSTOP 초 동안 그림만 멈춘다.
//   5) 잔상: 타격·대시 동안 지난 칸 몇 개를 흐리게 남긴다.
//  시트가 아직 없으면(Dots CX-0105E3 모델 대기) 아무것도 그리지 않는다 — 판단 함수만 열어 둔다. 숫자는 모두 유한값으로 묶는다.
(()=>{'use strict';
if(window.__STORYWORLD_EGO_MOTION_R1048__)return;
const REV='R1048-ego-motion-2';
const RULES=Object.freeze({fade:.1,fadeFast:.05,hitstop:.06,ghosts:3,ghostGap:.035,runSpeed:4.2,minRate:.55,maxRate:1.8,
 priority:Object.freeze(['dead','dash','hurt','discard','attack','move','idle'])});
const DIR8=Object.freeze(['s','se','e','ne','n','nw','w','sw']);
const fin=v=>Number.isFinite(v);
const clamp=(v,a,b)=>fin(v)?Math.min(b,Math.max(a,v)):a;
// 세계 방향(dx,dy) → 화면 방향 8개(R895 와 같은 투영: sx=dx-dy, sy=(dx+dy)/2). 시트 방향 이름 순서는 render_sheets.py 와 같다.
function dir8(dx,dy,prev){dx=+dx;dy=+dy;if(!fin(dx)||!fin(dy)||Math.hypot(dx,dy)<1e-6)return prev||'s';
 const sx=dx-dy,sy=(dx+dy)*.5,a=Math.atan2(sx,sy);/* 0=화면 아래(s), +π/2=오른쪽(e) */
 const k=((Math.round(a/(Math.PI/4))%8)+8)%8;return DIR8[k];}
// 상태 고르기: s = R895 sample() 모양(at,sk,ul,da,hu,mv) + 덧붙인 값(dead, discardT, speed)
function pickState(s){s=s||{};if(s.dead)return'dead';if(+s.da>0)return'dash';if(+s.hu>0)return'hurt';
 if(+s.discard>0)return'discard';if(+s.at>0||+s.sk>0||+s.ul>0)return'attack';if(s.mv)return'move';return'idle';}
const CLIP={dead:'hit',dash:'run',hurt:'hit',discard:'discard',attack:'attack',idle:'idle'};
function clipOf(state,speed){if(state==='move')return clamp(+speed,0,99)>=RULES.runSpeed?'run':'walk';return CLIP[state]||'idle';}
// 공격 진행도 p(0→1) → 칸. 구간(phases)이 있으면 예비 35%·타격 20%·여운 45% 시간에 맞춘다.
function attackFrame(p,meta){const n=Math.max(1,meta?.frames|0||1);p=clamp(p,0,1);const ph=meta?.phases;
 if(!ph?.windup||!ph?.strike||!ph?.follow)return Math.min(n-1,Math.floor(p*n));
 const seg=[[0,.35,ph.windup],[.35,.55,ph.strike],[.55,1,ph.follow]];
 for(const[a,b,[f0,f1]]of seg)if(p<=b||b===1){const k=(p-a)/Math.max(1e-6,b-a);return clamp(Math.round(f0+(f1-f0)*clamp(k,0,1)),0,n-1)|0;}
 return n-1;}
// 걸음 재생 빠르기: 실제 속도 ÷ 시트 기준 속도(sheets.json 의 stride 값이 있으면 그것, 없으면 걷기 2.4·달리기 5.2 칸/초)
function strideRate(clip,speed,meta){const ref=fin(+meta?.strideSpeed)&&+meta.strideSpeed>0?+meta.strideSpeed:(clip==='run'?5.2:2.4);
 return clamp(clamp(+speed,0,99)/ref,RULES.minRate,RULES.maxRate);}
// 재생기 하나 = 영웅 하나. step(dt, input) 이 이번 화면의 {clip,dir,frame,fade:{clip,dir,frame,alpha}|null,ghosts:[…],hold} 를 돌려준다.
function createPlayer(sheets){const A=sheets?.actions||{};
 const st={state:'idle',clip:'idle',dir:'s',phase:0,frame:0,since:0,prev:null,fadeLeft:0,fadeDur:RULES.fade,hold:0,struck:false,trail:[],trailT:0,t:0};
 function meta(c){return A[c]||{frames:1,fps:8,loop:true};}
 function step(dt,inp){dt=clamp(+dt,0,.25);inp=inp||{};st.t+=dt;
  const state=pickState(inp),clip=clipOf(state,inp.speed),dir=dir8(inp.fx,inp.fy,st.dir),m=meta(clip),n=Math.max(1,m.frames|0);
  if(clip!==st.clip||state!==st.state){
   st.prev={clip:st.clip,dir:st.dir,frame:st.frame};st.fadeDur=(state==='hurt'||state==='dead'||state==='dash')?RULES.fadeFast:RULES.fade;st.fadeLeft=st.fadeDur;
   const keepPhase=(clip==='walk'||clip==='run')&&(st.clip==='walk'||st.clip==='run');/* 걷기↔달리기는 발 위상을 이어 간다 */
   if(!keepPhase)st.phase=0;st.clip=clip;st.state=state;st.since=0;st.struck=false;st.hold=0;}
  st.since+=dt;st.dir=dir;
  if(st.hold>0){st.hold=Math.max(0,st.hold-dt);}
  else if(clip==='attack'&&fin(+inp.attackP)){st.frame=attackFrame(+inp.attackP,m);
   const s0=m.phases?.strike?.[0];if(!st.struck&&fin(s0)&&st.frame>=s0){st.struck=true;st.hold=RULES.hitstop;}}
  else{const rate=(clip==='walk'||clip==='run')?strideRate(clip,inp.speed,m):1;st.phase+=dt*clamp(+m.fps,1,60)*rate;
   st.frame=m.loop?Math.floor(st.phase)%n:Math.min(n-1,Math.floor(st.phase));}
  st.frame=clamp(st.frame|0,0,n-1)|0;
  st.fadeLeft=Math.max(0,st.fadeLeft-dt);
  const fade=st.prev&&st.fadeLeft>0?{...st.prev,alpha:clamp(st.fadeLeft/st.fadeDur,0,1)}:null;
  // 잔상: 타격 구간·대시 동안만 쌓는다
  const ghostOn=state==='dash'||(clip==='attack'&&st.struck&&st.since<.5);st.trailT+=dt;
  if(ghostOn&&st.trailT>=RULES.ghostGap){st.trailT=0;st.trail.unshift({clip,dir,frame:st.frame,x:+inp.x||0,y:+inp.y||0});st.trail.length=Math.min(st.trail.length,RULES.ghosts);}
  if(!ghostOn&&st.trail.length&&st.trailT>=RULES.ghostGap){st.trailT=0;st.trail.pop();}
  const ghosts=st.trail.map((g,i)=>({...g,alpha:clamp(.38*(1-i/RULES.ghosts),0,1)}));
  return{state,clip,dir,frame:st.frame,fade,ghosts,hold:st.hold>0};}
 return{step,get state(){return{...st,trail:st.trail.slice()};}};}
// ---- 게임에 그리기 ----
// 시트 목록은 데이터 파일(ego-motion-r1048-sheets.js → window.__STORYWORLD_EGO_MOTION_R1048_SHEETS__)이 있을 때만 켠다.
//  모양: {base:'assets/r1048/ego/', ext:'webp', cell:192, bodyPx:146, foot:[96,169], dirs:[…], actions:{idle:{frames,fps,loop,phases?,strideSpeed?},…}}
//  없으면(지금 — EGO 3D 모델 대기) 아무것도 바꾸지 않는다. 네트워크 요청도 하지 않는다.
const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|r143\/attack\/|r242\/hwando\/|r283\/hwando\/|r271\/|awakening|r1048\/|^blob:/;
const stats={frames:0,ghosts:0,fades:0,skipped:0,errors:0,slash:0};let lastError=null,lastInp=null,lastSrc=null,movedAt=-9,on=true,player1=null,lastT=null,lastPos=null,atkMax=0,prevAt=0,speedS=0,face={x:1,y:1};
try{const v=JSON.parse(localStorage.getItem('storyworld.r1048.motion')||'{}');if(v&&v.on===false)on=false;}catch(_){}
const sheets=()=>{const s=window.__STORYWORLD_EGO_MOTION_R1048_SHEETS__;return s&&s.actions&&fin(+s.cell)&&+s.cell>0?s:null;};
const egoOn=()=>{try{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;return !!E&&(E.formActive?.()||E.inspect?.().rc151===true);}catch(_){return false;}};
const now=()=>typeof time==='number'&&fin(time)?time:performance.now()/1000;
function img(p){try{if(typeof readyImage==='function'){const row=readyImage(p),im=row?.image||null;/* readyImage 는 캐시 줄({image,ready,crop})을 준다 */if(im&&(im.naturalWidth||im.width)>0)return im;}if(typeof addImage==='function')addImage(p);}catch(_){}return null;}
function nearEnemy(p){try{let b=null,bd=16;for(const e of (typeof room==='object'&&room?.enemies)||[]){if(!(e?.hp>0))continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<bd){bd=d;b=e;}}return b;}catch(_){return null;}}
function input(p,t,S){const dt=lastT==null?0:clamp(t-lastT,0,.25);lastT=t;
 const pos={x:+p.x||0,y:+p.y||0};let vx=0,vy=0;if(lastPos&&dt>0){vx=(pos.x-lastPos.x)/dt;vy=(pos.y-lastPos.y)/dt;}lastPos=pos;
 const sp=Math.hypot(vx,vy);speedS+=(clamp(sp,0,30)-speedS)*clamp(dt*12,0,1);/* 속도는 살짝 다듬어 걸음 빠르기가 떨지 않게 */
 if(sp>.3){face={x:vx,y:vy};movedAt=t;}else{const e=nearEnemy(p);if(e)face={x:e.x-p.x,y:e.y-p.y};}
 const at=+S.at||0;if(at>prevAt+1e-6)atkMax=Math.max(at,.05);prevAt=at;
 const sk=+S.sk||0,ul=+S.ul||0,cast=Math.max(sk,ul);
 let discard=0;try{const I=window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.inspect?.(),t0=+I?.cdUntil-16,len=(sheets()?.actions?.discard?.frames||16)/(sheets()?.actions?.discard?.fps||16);if(fin(t0)&&t-t0>=0&&t-t0<len)discard=1;}catch(_){}
 const attackP=at>0&&atkMax>0?1-at/atkMax:cast>0?.5:NaN;
 return{dt,inp:{dead:!(p.hp>0),da:S.da,hu:S.hu,at:at>0||cast>0?1:0,discard,mv:!!(S.mv||t-movedAt<.15),speed:speedS,fx:face.x,fy:face.y,attackP,basic:at>0,x:pos.x,y:pos.y}};}
function pickBody(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}return best;}
// 검 궤적 이펙트(Dots CX-0110EG ego_slash r1 → Claude 개선: 512칸 6장, 끝 칸 완전 투명, 백색 번짐 240 상한; 게임용 256칸 webp).
//  기본 공격(at>0)일 때만. 몸 공격 칸(16칸: 예비 0~4·타격 5~10·여운 11~15) → 궤적 칸. 타격 첫 칸(히트스톱)에 가장 큰 3번 칸.
//  그림은 오른쪽 위→왼쪽 아래 초승달 → 화면 오른쪽을 볼 때 좌우를 뒤집는다. 가산 합성('lighter')으로 몸 위에 겹친다.
const FX=Object.freeze({slash:Object.freeze({path:'assets/r1048/fx/ego_slash.webp',cell:256,frames:6,size:2.1,lift:.55,ahead:.28,alpha:.95,
 map:Object.freeze({3:0,4:1,5:2,6:2,7:3,8:3,9:4,10:4})})});
function slashFrame(clip,frame,basic){if(clip!=='attack'||!basic)return -1;const k=FX.slash.map[frame|0];return Number.isInteger(k)?k:-1;}
function placeFx(spec,frame,cx,cy,flip){const im=img(spec.path);if(!im)return null;const c=spec.cell,h=(typeof actorHeight==='function'?actorHeight():66)*spec.size;
 if(!fin(cx)||!fin(cy)||!fin(h)||h<=0)return null;const L=cx-h/2,R=cx+h/2,T=cy-h/2,B=cy+h/2;
 const pts=flip?[[R,T],[L,T],[L,B],[R,B]]:[[L,T],[R,T],[R,B],[L,B]];
 return{image:im,sourcePath:spec.path,immutableTint:null,mutable:false,sourceRect:[clamp(frame,0,spec.frames-1)*c,0,c,c],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],points:pts,r1048:'fx'};}
function place(sh,clip,dir,frame,fx,fy){const p=(sh.base||'assets/r1048/ego/')+clip+'-'+dir+'.'+(sh.ext||'webp'),im=img(p);if(!im)return null;
 const cell=+sh.cell,want=(typeof actorHeight==='function'?actorHeight():66)*.98,k=clamp(want/Math.max(1,+sh.bodyPx||cell*.76),.05,4),[ax,ay]=Array.isArray(sh.foot)?sh.foot:[cell/2,cell*.88];
 const X=v=>fx+(v-ax)*k,Y=v=>fy+(v-ay)*k,pts=[[X(0),Y(0)],[X(cell),Y(0)],[X(cell),Y(cell)],[X(0),Y(cell)]];
 if(!pts.every(q=>fin(q[0])&&fin(q[1])))return null;
 return{image:im,sourcePath:p,immutableTint:null,mutable:false,sourceRect:[frame*cell,0,cell,cell],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],points:pts,r1048:clip};}
function paint(rec,st){const sh=sheets(),p=typeof player==='object'?player:null;if(!sh||!p){stats.skipped++;return;}
 const best=pickBody(rec,st);if(!best){stats.skipped++;return;}
 if(!player1)player1=createPlayer(sh);const M=window.__STORYWORLD_HERO_MOTION_R895__,S=M?.sample?.()||{};const t=now(),{dt,inp}=input(p,t,S),r=player1.step(dt,inp);lastInp={dt,...inp};
 const q=project(p.x,p.y),lift=clamp(+p.visualLiftPx||0,0,60),fx=q.x,fy=q.y-lift;
 const main=place(sh,r.clip,r.dir,r.frame,fx,fy);if(!main){stats.skipped++;return;}lastSrc=main.sourcePath+'#'+r.frame;
 const before=best.image,alpha=+best.style?.globalAlpha||1;Object.assign(best,main);
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before)rec.commands.splice(i,1);}
 const extra=[];
 if(r.fade){const f=place(sh,r.fade.clip,r.fade.dir,r.fade.frame,fx,fy);if(f){extra.push({...best,...f,key:best.key+':r1048f',style:{...best.style,globalAlpha:alpha*r.fade.alpha}});stats.fades++;}}
 r.ghosts.forEach((g,i)=>{const gq=project(g.x,g.y),f=place(sh,g.clip,g.dir,g.frame,gq.x,gq.y-lift);if(f){extra.push({...best,...f,key:best.key+':r1048g'+i,style:{...best.style,globalAlpha:alpha*g.alpha,globalCompositeOperation:'lighter'}});stats.ghosts++;}});
 /* 잔상·섞는 옛 칸은 몸 뒤에 */if(extra.length){const at=Math.max(st,rec.commands.indexOf(best));rec.commands.splice(at,0,...extra);}
 const sf=slashFrame(r.clip,r.frame,lastInp?.basic);if(sf>=0){const ah=(typeof actorHeight==='function'?actorHeight():66),sx=(+face.x||0)-(+face.y||0),sgn=sx>0?1:-1,f=placeFx(FX.slash,sf,fx+sgn*ah*FX.slash.ahead,fy-ah*FX.slash.lift,sx>0);
  if(f){const at=rec.commands.indexOf(best);rec.commands.splice(at+1,0,{...best,...f,key:best.key+':r1048s',style:{...best.style,globalAlpha:alpha*FX.slash.alpha,globalCompositeOperation:'lighter'}});stats.slash++;}}
 stats.frames++;}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{if(on&&st>=0&&egoOn()&&sheets())paint(rec,st);}catch(e){stats.errors++;lastError=String(e?.message||e);}return r;};}
window.__STORYWORLD_EGO_MOTION_R1048__=Object.freeze({revision:REV,RULES,FX,slashFrame,DIR8,dir8,pickState,clipOf,attackFrame,strideRate,createPlayer,
 ready:()=>!!sheets(),set:v=>{on=v!==false;try{localStorage.setItem('storyworld.r1048.motion',JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,ready:!!sheets(),ego:egoOn(),stats:{...stats},lastError,lastSrc,input:lastInp,state:player1?.state||null})});
})();
