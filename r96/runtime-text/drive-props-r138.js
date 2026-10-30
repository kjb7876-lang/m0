// R138 — 2026-10-30 드라이브 정적 소품 원화(assets/r138/props, scripts/r138-drive-props.py)를 본편 지역에 덧붙인다.
//  · dist01 거미동굴: 천장에 매달린 뼈(에피소드1A L37) 2개 — 바닥에서 띄워 그린다.
//  · dist00: 뒷벽에 붙인 창과 얼굴 없는 성상(에피소드1A L28) 1개 — 문·포탈로 쓰지 않는다(상호작용 없음).
//  · dist00: 돌바닥을 지나는 낮은 뿌리 연결부(L28, 드라이브 10-30 R141) 2개 — 바닥에 누운 비충돌 장식.
// 모두 비충돌·그리기 전용이다. 원래 소품·적·문·세이브는 건드리지 않고, 자리는 R81 의 안전 검사(문·입구·목표·적과 거리)를 그대로 쓴다.
// 바위 코너(구조물)와 몹 애니메이션 키 후보는 전달 README 가 보류로 표시해 넣지 않았다(assets/r138/props/index.json 의 held).
(()=>{'use strict';
if(window.__STORYWORLD_DRIVE_PROPS_R138__)return;
const E=window.__STORYWORLD_ENVIRONMENT_R81__;
const ART={root:{path:'assets/r138/props/root.webp',height:56},bones:{path:'assets/r138/props/bones.webp',height:150,lift:104},window:{path:'assets/r138/props/window.webp',height:140}};
const PLAN={dist01:[['bones',2]],dist00:[['window',1],['root',2]]};
// R81 과 같은 방 사각형. 뼈는 방 안쪽 천장 아래에 둔다.
const bounds=[[30,4,46,20],[48,4,66,20],[68,4,84,20],[68,30,84,42],[10,30,34,42],[38,30,64,42],[10,52,32,68],[34,52,48,68],[50,52,68,68],[70,52,80,68],[10,74,36,82],[50,74,78,82],[10,90,24,104],[26,92,42,104],[44,90,62,104],[64,90,78,104]];
const stats={rooms:0,placed:0,failures:0,draws:0};let lastError=null;
const fail=e=>{stats.failures++;lastError=String(e?.message||e).slice(0,160);};
const mode=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
const done=new WeakMap();
const blocked=(L,x,y,s)=>{const a=window.StoryPhase1;return typeof a?.explorationBlocked==='function'?a.explorationBlocked(L,x,y,s):true;};
// 창: 바로 뒤(화면 안쪽, -x 또는 -y)에 벽이 있고 앞은 트인 칸만. 벽 쪽으로 붙여 세워 문처럼 홀로 서 보이지 않게 한다.
function wallSpots(r,n){const b=bounds[n.id],L=r.exploration;if(!b)return[];const[a,b0,c,d]=b,out=[];
 for(let y=b0+.5;y<d;y+=1)for(let x=a+.5;x<c;x+=1){if(blocked(L,x,y,.55))continue;
  for(const[dx,dy]of[[-1,0],[0,-1]])if(blocked(L,x+dx*1.45,y+dy*1.45,.05)&&!blocked(L,x-dx*1.2,y-dy*1.2,.3)&&!blocked(L,x+dy*1.2,y+dx*1.2,.3)&&!blocked(L,x-dy*1.2,y-dx*1.2,.3))out.push([x,y,dx,dy]);}
 return out;}
function spots(r,n,kind){const b=bounds[n.id];if(!b)return[];const[a,b0,c,d]=b;
 if(kind==='window')return wallSpots(r,n);
 return[[(a+c)/2,(b0+d)/2],[(a*2+c)/3,(b0+d)/2],[(a+c)/2,(b0*2+d)/3],[(a+c*2)/3,(b0+d*2)/3],[a+3,b0+3]];}
function place(r){try{
 if(!E||!r||mode()!=='off'||r.layer!=='STORY'||!r.exploration?.worldWardR81)return r;const plan=PLAN[r.id];if(!plan)return r;
 if(done.get(r)===r.exploration)return r;done.set(r,r.exploration);
 r.props=r.props.filter(p=>!p.r138Drive);
 const used=r.props.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.visible!==false).map(p=>({x:p.x,y:p.y}));
 const nodes=r.exploration.nodes.filter(n=>bounds[n.id]);let k=0;
 for(const[kind,count]of plan)for(let i=0;i<count;i++){const a=ART[kind];let spot=null;
  for(let j=0;j<nodes.length&&!spot;j++){const n=nodes[(k*7+j+3)%nodes.length];for(const[x,y,dx=0,dy=0]of spots(r,n,kind)){const p={x,y};if(E.safe(r,p,used,.6)){spot={x:x+dx*.5,y:y+dy*.5};break;}}}
  k++;if(!spot){stats.failures++;continue;}used.push(spot);
  const q={id:'r138:'+r.id+':'+kind+':'+i,x:spot.x,y:spot.y,path:a.path,height:a.height,solid:false,visible:true,enabled:true,interactive:false,autoTargetEligible6:false,r80PresentationOnly:true,r138Drive:kind};
  if(a.lift)q.r138Lift=a.lift;r.props.push(q);stats.placed++;
  try{if(typeof addImage==='function')addImage(a.path);}catch(e){fail(e);}}
 stats.rooms++;}catch(e){fail(e);}return r;}
if(typeof makeRoom==='function'){const b=makeRoom;makeRoom=function(...a){return place(b.apply(this,a));};}
if(typeof enterRegion==='function'){const b=enterRegion;enterRegion=async function(...a){const out=await b.apply(this,a);if(out!==false)place(room);return out;};}
if(typeof restoreSave==='function'){const b=restoreSave;restoreSave=async function(...a){const out=await b.apply(this,a);if(out!==false)for(const r of new Set([...Object.values(world||{}),room]))place(r);return out;};}
// 매달린 뼈는 바닥 그림자 없이 띄워 그린다(중간 소품 그리기 겹이 visualLiftPx 를 무시하는 경로가 있어 직접 그린다). 영웅이 뒤에 서면 옅게.
function hang(p){const row=readyImage(p.path);if(!row)return;const z=typeof zoom==='number'?zoom:1,q=project(p.x,p.y),h=p.height*z,lift=p.r138Lift*z,b=row.crop||{w:row.image.naturalWidth,h:row.image.naturalHeight},w=h*b.w/b.h,hero=project(player.x,player.y),behind=q.y>hero.y-3&&q.y-lift-h<hero.y-15&&Math.abs(q.x-hero.x)<w*.4;
 const paint=()=>sprite(p.path,q.x,q.y-lift,h,{alpha:behind?.36:1,filter:'none'});if(typeof ctx?.scope==='function')ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:p.path,alive:true},paint);else paint();}
if(typeof drawProp==='function'){const b=drawProp;drawProp=function(p,...a){if(p?.r138Drive){stats.draws++;try{if(typeof readyImage==='function'&&!readyImage(p.path)){if(typeof addImage==='function')addImage(p.path);return;}if(p.r138Lift){hang(p);return;}}catch(e){fail(e);return;}}return b.call(this,p,...a);};}
try{for(const r of new Set([...Object.values(world||{}),room]))place(r);}catch(e){fail(e);}
window.__STORYWORLD_DRIVE_PROPS_R138__=Object.freeze({ART,PLAN,place,inspect:()=>({revision:'R138',...stats,lastError,browser:false,GPU:false})});
})();
