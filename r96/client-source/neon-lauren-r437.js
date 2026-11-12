/* R437 세 가지: ① 네온 Q 민트 체인 라이트닝 ② 네온·라우렌 새 좌·우 기본 공격(아래 ATTACK) ③ 네온 새 초상화(뒤 창 지움, 아래 PORTRAIT)
 * ① 네온 Q — 민트 체인 라이트닝 (사용자 2026-11-09 "네온 q스킬사용시 삼각형같은걸로 이어지는 이펙트 왜 아직도 나옴? 민트색 체인라이트닝으로 바꾸라니까")
 * 원인: 네온 Q 한 번에 다섯 겹이 그려졌다.
 *   ① R411 'hit-chain-lightning' 시트(파란 보라 점 세 개를 ^ 모양으로 잇는 그림)가 맞은 적마다 하나씩 → "삼각형" 이 여러 개
 *   ② 엔진 'link'(영웅 → 각 적 직선 부채꼴, neon-q.webp 조각을 줄줄이) ③ R106/R108 파란 연쇄 번개
 *   ④ R292 손그림 시전 띠 ⑤ R178 전격 충격.  민트로 "바꾼" 적이 없고 위에 덧붙이기만 해서 옛 그림이 그대로 보였다.
 * 고침: 네온 Q 는 이 파일이 맡는다.
 *   · ①(네온의 모든 적중) ②(네온 Q 동안) ③(네온 Q) 을 그리지 않는다. ④ 시전 띠·⑤ 충격은 둔다(시전자 쪽 손그림, 삼각형 아님).
 *   · Q 가 실제로 맞힌 적들을 영웅에서 가까운 적부터 차례로 잇는다(영웅 → 적1 → 적2 → …, 매번 남은 적 중 가장 가까운 적).
 *   · 그림은 R108 손그림 번개 시트(assets/r108/eden/lightning.webp, 4×4 칸: 0~7 번개 줄기 · 8~15 충격 고리)를 민트 단계색
 *     (#18A89A → #B8FFF0, 어두운 민트에 무게)으로 다시 칠한 사본. 코드로 그린 선·원은 쓰지 않는다. 마디마다 0.06초씩 늦게 튄다.
 * 판정·피해·쿨다운·대상 수는 그대로(그림만). 십자 모양 없음. ctx.filter 안 씀(Three.js 기록기).
 * 끄기: localStorage['storyworld.r437.neonChain']='0' 뒤 새로고침(옛 그림이 돌아온다). */
(()=>{'use strict';
if(window.__STORYWORLD_NEON_LAUREN_R437__)return;
if(typeof special!=='function'||typeof fx!=='function'||typeof drawEffect!=='function'||typeof tick!=='function'||typeof project!=='function')return;
const REV='R437-neon-lauren-5',KEY='storyworld.r437.neonChain',SHEET='assets/r108/eden/lightning.webp',CELL=256;
const MINT_DARK=[0x18,0xA8,0x9A],MINT_LIGHT=[0xB8,0xFF,0xF0];
let enabled=true;try{if(localStorage.getItem(KEY)==='0')enabled=false;}catch(_){}
const stats={casts:0,hops:0,linksHidden:0,dimmed:0,dimDraws:0,draws:0,errors:0,noSheet:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const P=(x,y,z=0)=>{const q=project(x,y);return{x:q.x,y:q.y-z};};
const D=()=>window.__STORYWORLD_EDEN_DATA_R108__;
const ownsHero=h=>enabled&&h==='neon';

// ---- 민트 사본: 원본 평균 밝기를 민트 단계색으로 바꾼다. 알파는 그대로. --------------------------------------------
let mint=null,mintTried=0;
function lut(){const L=new Uint8ClampedArray(768),st=[[0,MINT_DARK.map(v=>v*.25)],[.45,MINT_DARK.map(v=>v*.8)],[.75,MINT_DARK],[.92,MINT_DARK.map((v,k)=>lerp(v,MINT_LIGHT[k],.55))],[1,MINT_LIGHT]]/* 겹쳐 더해도(lighter) 흰색으로 날아가지 않게 어두운 민트 쪽에 무게 */;
 for(let i=0;i<256;i++){const l=i/255;let j=1;while(j<st.length-1&&l>st[j][0])j++;const[a0,c0]=st[j-1],[a1,c1]=st[j],t=clamp((l-a0)/Math.max(1e-6,a1-a0),0,1);for(let k=0;k<3;k++)L[i*3+k]=lerp(c0[k],c1[k],t);}return L;}
function sheet(){if(mint)return mint;
 try{const row=typeof imageCache!=='undefined'?imageCache.get(SHEET):null;
  if(!row){const t=performance.now();if(t-mintTried>4000&&typeof addImage==='function'){mintTried=t;addImage(SHEET,'R437 neon mint chain');}return null;}
  if(!row.ready||!row.image)return null;const im=row.image,w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!(w>0&&h>0))return null;
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const d=g.getImageData(0,0,w,h),px=d.data,L=lut();
  for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const m=Math.round((px[i]+px[i+1]+px[i+2])/3),j=m*3;/* 평균 밝기(원본이 파랑이라 최대 채널은 거의 255 → 전부 흰색이 됨) */px[i]=L[j];px[i+1]=L[j+1];px[i+2]=L[j+2];}
  g.putImageData(d,0,0);cv.naturalWidth=w;cv.naturalHeight=h;
  try{Object.defineProperty(cv,'__storyworldStaticSource',{value:Object.freeze({path:'r437mint:'+SHEET,immutable:true,r437:true})});}catch(_){}
  mint=cv;return mint;}catch(e){fail(e);return null;}}

// 번개 줄기 칸(0~7)을 a→b 로 늘여 그린다(R108 bolt 와 같은 방식: 칸의 +y 축이 선분을 따라간다).
function bolt(src,fr,ax,ay,bx,by,thick,alpha){const c=D()?.clips?.['lightning.bolt'];const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy);if(!c||!(L>2)||!(alpha>.004))return;
 fr=((fr|0)%8+8)%8;const body=c.len*CELL,sy=L/body,sx=clamp(sy*.5,.1,thick/(CELL*.5));/* 짧은 마디에서 납작한 별 모양이 되지 않게 폭을 길이에 묶는다 */
 ctx.save();try{ctx.translate(ax,ay);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);ctx.scale(sx,sy);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(alpha,0,1);
  ctx.drawImage(src,(fr&3)*CELL,(fr>>2)*CELL,CELL,CELL,-c.p[0]*CELL,-c.p[1]*CELL,CELL,CELL);stats.draws++;}finally{ctx.restore();}}
// 충격 고리 칸(8~15)
function ring(src,t,x,y,size,alpha){const c=D()?.clips?.['lightning.ring'];if(!c||!(alpha>.004))return;const n=c.b-c.a+1,fr=c.a+Math.min(n-1,Math.floor(Math.max(0,t)*c.fps));
 ctx.save();try{ctx.translate(x,y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(alpha,0,1);ctx.drawImage(src,(fr&3)*CELL,(fr>>2)*CELL,CELL,CELL,-c.p[0]*size,-c.p[1]*size,size,size);stats.draws++;}finally{ctx.restore();}}

// ---- 연쇄 효과 목록(세계 좌표) -------------------------------------------------------------------------------------------
const list=[],MAX=6,STEP=.06,SEG=.34;let serial=0;
const SENTINEL={type:'r437-neon-chain',x:0,y:0,age:0,life:Infinity,r437Sentinel:true};
function order(origin,targets){const left=targets.filter(e=>e&&Number.isFinite(e.x)&&Number.isFinite(e.y)),out=[];let from=origin;
 while(left.length){let bi=0,bd=Infinity;for(let i=0;i<left.length;i++){const d=Math.hypot(left[i].x-from.x,left[i].y-from.y);if(d<bd){bd=d;bi=i;}}const e=left.splice(bi,1)[0];out.push({e,x:e.x,y:e.y});from=e;}
 return out;}
function launch(origin,targets){const hops=order(origin,targets);if(!hops.length)return;if(list.length>=MAX)list.shift();
 list.push({id:++serial,x:origin.x,y:origin.y,hops,t:0,life:hops.length*STEP+SEG+.5,seed:Math.random()*100});stats.casts++;stats.hops+=hops.length;
 if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}}
// 3D 기록기는 그리기마다 주인(scope)의 세계 자리로 깊이를 정한다. 주인 없이 그리면 (0,0) 깊이로 몸들 뒤에 묻힌다(R106 파란 연쇄가 잘 안 보이던 까닭).
// 마디마다 카메라 쪽(x+y 가 큰) 끝점을 주인 자리로 삼아 적·영웅 앞에 보이게 한다.
function scoped(id,x,y,run){const meta={id,kind:'effect',x,y,r437:true};if(typeof ctx.scope==='function')ctx.scope(meta,run);else run();}
function drawAll(){const src=sheet();if(!src){if(list.length)stats.noSheet++;return;}const h=H(),fr=Math.floor((typeof time==='number'?time:performance.now()/1000)*24),lo=lowFx();
 for(const c of list){let from=P(c.x,c.y,h*.55),fw={x:c.x,y:c.y};
  if(c.t<.3)scoped('r437:'+c.id+':cast',c.x+.2,c.y+.2,()=>ring(src,c.t,from.x,from.y+h*.5,h*1.6,.7*(1-c.t/.3)));
  c.hops.forEach((hp,i)=>{const ok=hp.e&&hp.e.hp>0,hx=ok?hp.e.x:hp.x,hy=ok?hp.e.y:hp.y,to=P(hx,hy,h*.45),v=c.t-i*STEP,a0=from,front=(hx+hy>fw.x+fw.y)?{x:hx,y:hy}:fw;
   if(v>0&&v<SEG){const a=v<.16?1:1-(v-.16)/(SEG-.16);scoped('r437:'+c.id+':'+i,front.x+.3,front.y+.3,()=>{bolt(src,fr+i*3,a0.x,a0.y,to.x,to.y,h*1.5,a);if(!lo)bolt(src,fr+i*3+5,a0.x,a0.y,to.x,to.y,h*.9,.55*a);});}
   const rv=v-.02;if(rv>0&&rv<.5){const g=P(hx,hy);scoped('r437:'+c.id+':ring'+i,hx+.3,hy+.3,()=>ring(src,rv,g.x,g.y+h*.02,h*1.5,1-rv/.5));}
   from=to;fw={x:hx,y:hy};});}}

// ---- 훅 ------------------------------------------------------------------------------------------------------------------
let inQ=null;// 네온 Q 가 도는 동안 {origin, hit:Set}
// 네온 Q 가 만든 적중 흰 섬광(burst·e568HeroImpact·충돌 그림)은 체인을 덮지 않게 옅게 그린다(7분야 심사 고칠 점, 사용자 2026-11-09 "모두개선적용").
const DIM_TYPES=new Set(['burst','e568HeroImpact','pxfSprite','spark','flash']),DIM=.38;
// e.alpha 를 읽지 않는 그리기(엔진 충격 그림·PXF 는 globalAlpha 를 바로 넣음)도 옅어지게, 이 효과를 그리는 동안만 ctx.globalAlpha 에 DIM 을 곱한다.
const findAlpha=o=>{for(let q=o;q;q=Object.getPrototypeOf(q)){const d=Object.getOwnPropertyDescriptor(q,'globalAlpha');if(d)return {d,own:q===o};}return null;};
const dimmedDraw=(c,run)=>{
 // Three.js 기록기(DrawCommands)는 push 때 style() 로 globalAlpha 를 읽어 명령에 담는다 → 이 그리기가 남긴 명령의 style.globalAlpha 에 바로 곱한다.
 if(Array.isArray(c.commands)&&typeof c.style==='function'){const st=c.commands.length;try{return run();}finally{for(let i=st;i<c.commands.length;i++){const m=c.commands[i];if(m&&m.style&&Number.isFinite(m.style.globalAlpha)){m.style={...m.style,globalAlpha:m.style.globalAlpha*DIM};stats.dimDraws++;}}}}
 const f=findAlpha(c);if(!f)return run();const {d,own}=f;let back=d.get?d.get.call(c):d.value;
 const put=v=>{if(d.set)d.set.call(c,v);else back=v;};const raw=()=>d.get?d.get.call(c):back;
 const start=raw();try{Object.defineProperty(c,'globalAlpha',{configurable:true,enumerable:true,get(){return raw()/DIM;},set(v){put(Math.max(0,Math.min(1,Number(v)))*DIM);}});}catch(_){return run();}
 stats.dimDraws++;try{c.globalAlpha=start;return run();}
 finally{if(own)Object.defineProperty(c,'globalAlpha',d);else delete c.globalAlpha;c.globalAlpha=start;}};
const effectBase=drawEffect;drawEffect=function(e){if(e&&e.type==='r437-neon-chain'){try{drawAll();}catch(err){fail(err);}return;}
 if(e&&e.r437Dim&&enabled&&typeof ctx!=='undefined'&&ctx){const self=this,args=arguments;return dimmedDraw(ctx,()=>effectBase.apply(self,args));}
 return effectBase.apply(this,arguments);};
// 엔진 fx() 는 상한(80/160)에서 맨 앞을 빼고 넣으므로 길이가 아니라 '전에 없던 효과'로 찾는다.
const dimNew=old=>{if(typeof effects==='undefined'||!Array.isArray(effects))return;for(let i=0;i<effects.length;i++){const e=effects[i];if(old.has(e))continue;if(e&&!e.r437Dim&&(DIM_TYPES.has(e.type)||/burst-impact|impact/.test(String(e.asset||e.src||'')))){e.r437Dim=true;stats.dimmed++;}}};
const tickBase=tick;tick=function(dt){const r=tickBase.call(this,dt);try{if(!mint&&enabled&&live()&&player.hero==='neon')sheet();/* 네온이면 미리 민트 사본을 만든다(첫 Q 에 빈 화면 방지) */const d=Number.isFinite(dt)?clamp(dt,0,.1):0;for(const c of list)c.t+=d;for(let i=list.length-1;i>=0;i--)if(list[i].t>list[i].life)list.splice(i,1);
 if(list.length&&typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENTINEL)){SENTINEL.age=0;effects.push(SENTINEL);}}catch(e){fail(e);}return r;};
if(typeof enterRegion==='function'){const eb=enterRegion;enterRegion=async function(...a){const r=await eb.apply(this,a);if(r!==false)list.length=0;return r;};}
// ② 네온 Q 동안 엔진 'link' 줄을 만들지 않는다
const fxBase=fx;fx=function(type,x,y,opt){if(inQ&&type==='link'){stats.linksHidden++;return null;}return fxBase.apply(this,arguments);};
// Q 가 맞힌 적 모으기
if(typeof hitEnemy==='function'){const hb=hitEnemy;hitEnemy=function(e,...a){const alive=!!(e&&e.hp>0),r=hb.call(this,e,...a);try{if(inQ&&alive&&e)inQ.hit.add(e);}catch(err){fail(err);}return r;};}
const specialBase=special;special=function(...a){if(!live()||!ownsHero(player.hero)||player.specialCD>0||(window.__STORYWORLD_EGO151__?.inspect?.().state?.active))return specialBase.apply(this,a);
 const prev=inQ,before=player.specialCD,cur={origin:{x:player.x,y:player.y},hit:new Set()},n0=new Set(typeof effects!=='undefined'&&Array.isArray(effects)?effects:[]);inQ=cur;let r;
 try{r=specialBase.apply(this,a);}finally{inQ=prev;}
 try{if(enabled)dimNew(n0);}catch(err){fail(err);}
 try{if(player.specialCD>before&&cur.hit.size)launch(cur.origin,[...cur.hit]);}catch(err){fail(err);}return r;};


// ---- 네온·라우렌 새 좌·우 기본 공격 시트(사용자 2026-11-09 "네온 라우렌 신규공격모션 개선해서 적용해주고") ----------------
// 원천은 왼쪽을 보는 6칸(드라이브 비공개) → scripts/r437-attack-sheets.py 가 뒷발 고정·몸 180·잔티 0·밝기 맞춤 후 좌우 반전해
// assets/r437/attack/<영웅>/attack-e.webp 로 만든다. R143 은 'e' 를 그대로, 'w' 는 반전해 그린다(원래 왼쪽 그림).
// 찌르는 창이 192 칸을 넘어 칸이 넓고 발 x 가 다르다 → R143 place() 가 attackSheet() 의 cell·foot·body 를 쓴다.
// tips = 칸마다 창끝(오른쪽 시트 좌표). R425 창끝 기운이 칸의 가장 위 점(창을 가로로 찌르면 머리)을 쓰지 않게 tipFor() 로 준다.
// 대각(se·ne)·위·아래 공격은 예전 R143 시트 그대로. 끄기: localStorage['storyworld.r437.attack']='0'.
/* R895 모션 법칙 '한 영웅 한 몸 크기': 라우렌 걷기·서 있기 시트는 머리 위로 솟은 창까지 몸 키로 재서(R140 약 205px) 몸이 0.87배로 그려지는데,
   새 공격 시트는 창을 뺀 몸 180 으로 맞춰 공격할 때마다 몸이 약 14% 커졌다 → 공격도 같은 기준(205)으로. 네온은 걷기 181·공격 180 으로 이미 같다. */
const ATTACK=Object.freeze({"neon":{"path":"assets/r437/attack/neon/attack-e.webp","cell":[224,256],"foot":[69,226],"body":180.0,"tips":[[198.0,102.0],[190.0,101.0],[210.0,100.0],[219.0,97.0],[209.0,101.0],[198.0,102.0]]},"lauren":{"path":"assets/r437/attack/lauren/attack-e.webp","cell":[232,256],"foot":[84,226],"body":205.0,"tips":[[138.0,13.0],[200.0,67.0],[225.0,96.0],[226.0,92.0],[205.0,69.0],[137.0,11.0]]}});
let attackOn=true;try{if(localStorage.getItem('storyworld.r437.attack')==='0')attackOn=false;}catch(_){}
function attackSheet(h,sd){return attackOn&&sd==='e'?ATTACK[h]||null:null;}
function tipFor(path,sr){if(!attackOn||!path||!sr)return null;for(const r of Object.values(ATTACK))if(r.path===path){const i=Math.round(sr[0]/r.cell[0]),t=r.tips[i];return t?[(t[0])/r.cell[0],t[1]/r.cell[1]]:null;}return null;}

// ---- 네온 새 초상화(사용자 2026-11-09 "네온 신규초상화 뒤에 무기만 없애서 적용해줘") -------------------------------------
// scripts/r437-neon-portrait.py: 뒤에 세운 창만 지우고 384×512 로. 원래 R108 그림은 그대로 두고 경로만 덧씌운다
// (영웅 선택 카드 R263·HUD 초상화 R376 이 portraitPath() 로 읽는다). 끄기: localStorage['storyworld.r437.portrait']='0'.
const PORTRAIT={neon:'assets/r437/portrait/neon.webp'};
let portraitOn=true;try{if(localStorage.getItem('storyworld.r437.portrait')==='0')portraitOn=false;}catch(_){}
try{const r108=window.__STORYWORLD_HEROES_R108__;if(r108&&typeof r108.portraitPath==='function'&&!r108.r437){const base=r108.portraitPath;
 window.__STORYWORLD_HEROES_R108__=Object.freeze({...r108,r437:true,portraitPath:id=>portraitOn&&PORTRAIT[id]?PORTRAIT[id]:base(id)});}}catch(e){fail(e);}

window.__STORYWORLD_NEON_LAUREN_R437__=Object.freeze({revision:REV,
 attackSheet,tipFor,attack:ATTACK,portraits:PORTRAIT,setAttack:v=>{attackOn=!!v;try{localStorage.setItem('storyworld.r437.attack',attackOn?'1':'0');}catch(_){}return attackOn;},
 owns:(hero,slot)=>ownsHero(hero)&&slot==='q',// R106 이 네온 Q 에서 파란 연쇄를 띄우지 않게
 ownsHit:hero=>ownsHero(hero),// R411 이 네온 적중마다 삼각 시트를 띄우지 않게
 setEnabled:v=>{enabled=!!v;try{localStorage.setItem(KEY,enabled?'1':'0');}catch(_){}return enabled;},
 effects:()=>list.map(c=>({t:c.t,hops:c.hops.length})),
 test:Object.freeze({seek:t=>{for(const c of list)c.t=t;return list.length;}}),// 검사용: 특정 시점 장면
 palette:{dark:'#18A89A',light:'#B8FFF0'},
 inspect:()=>({revision:REV,enabled,attackOn,portraitOn,sheetReady:!!mint,effects:list.length,...stats,lastError,presentationOnly:true,gameplayChanged:false})});
})();
