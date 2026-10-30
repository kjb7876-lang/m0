/* R115 전투·길잡이·화면 다듬기 (사용자 요청 2026-10-28 08:57)
 * ① 타격 위치: 적을 그릴 때 실제로 그려진 몸통 그림(불투명 픽셀)의 화면 사각형을 재서, 영웅 스킬 적중 이펙트가
 *    발밑이 아니라 그 적 그림의 가운데에 맞도록 한다(polish-r101 적중·fx-d2s-r106 스킬·vfx-r98 불꽃·기본 적중 그림).
 * ② 보스 조준: 보스가 바닥에 깔아 두는 공격(예고 뒤 터지는 자리)은 한 묶음마다 하나 이상이 영웅이 갈 자리를 겨눈다.
 * ③ 반자동·길잡이: 영웅이 직접 움직이지 않을 때 보스·몹 공격 예고 안에 서 있으면 빈 바닥으로 비켜 서고,
 *    원거리 영웅은 너무 붙은 적에게서 물러나며, 근거리 영웅은 적이 휘두르기 시작하면 옆으로 반걸음 비킨다.
 *    W·E·R 기술도 자동으로 쓴다(설정의 자동 기술이 꺼져 있어도 반자동·길잡이일 때).
 * ④ 몹 간격: 같은 무리의 몹끼리 몸 크기에 맞춘 틈을 두어 한 덩어리로 뭉치지 않게 한다(보스·중간보스는 그대로).
 * ⑤ 조형물: play-r113 접지 단계에서 그림 밑동을 4~6% 땅에 묻는다(벽에 거는 것·문·상자·단서 표식 제외).
 * ⑥ 그림자: 빛은 화면 밖에서 보는 사람 쪽(카메라)에서 들어온다 — 그림자는 물체 뒤(화면 위쪽)로 짧게 눕는다.
 * ⑦ 사몽선: 새로 그어지는 선의 일부를 몹이 뭉친 곳을 지나가게 옮긴다(가장 빽빽한 무리 몇 곳 가운데 무작위, 일부는 그대로 무작위).
 * ⑧ 스킬 강화 모음: 패시브 강화 창 위에 한눈에 보는 모음(묶음별 단계·한 줄 효과·+1 단추·기술 연출 단계 막대)을 붙인다.
 * ⑨ 벽 높이: 사몽 밖 지역도 벽마다 높이를 조금씩 다르게 하고, 문·출구 곁 벽은 문보다 높게 둔다.
 * 피해량·체력·쿨타임·저장 형식은 바꾸지 않는다. 설정 키 r115.play로 항목별로 끌 수 있다. */
(()=>{'use strict';
if(window.__STORYWORLD_PLAY_R115__||typeof tick!=='function'||typeof drawEnemy!=='function')return;
const REV='R115-play-1';
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r115.play';
const prefs={centre:true,aim:true,assist:true,spacing:true,sink:true,frontLight:true,samongCluster:true,skillBook:true,walls:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(prefs))if(typeof s?.[k]==='boolean')prefs[k]=s[k];}catch(_){}
function set(patch={}){for(const k of Object.keys(prefs))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
const stats={measured:0,scans:0,centred:0,aimed:0,dodges:0,kites:0,sidesteps:0,autoSkills:0,spaced:0,sunk:0,clustered:0,books:0,wallRooms:0};
let lastError=null,failures=0;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
const finite=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const now=()=>typeof time==='number'?time:0;
const live=()=>typeof started!=='undefined'&&started&&typeof player!=='undefined'&&!!player&&typeof room!=='undefined'&&!!room;
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const liveFoe=e=>!!e&&e.hp>0&&e.spawnState==='active'&&!e.deadRecorded&&e.visible!==false;
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.samongBoss));
const blockedAt=(x,y,r)=>{try{return typeof blocked==='function'?!!blocked(x,y,r):false;}catch(_){return false;}};
const busy=()=>(typeof modal!=='undefined'&&modal)||(typeof loading!=='undefined'&&loading)||(typeof storyScene!=='undefined'&&!!storyScene);
const H=()=>typeof actorHeight==='function'?actorHeight():66;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---- ① 적 그림의 실제 중심 ------------------------------------------------------------------------
const VC=new WeakMap(),BOX=new WeakMap();let scanBudget=6,scanCanvas=null;
function opaqueBox(img,sx,sy,sw,sh){let m=BOX.get(img);if(!m){m=new Map();BOX.set(img,m);}const k=Math.round(sx)+','+Math.round(sy)+','+Math.round(sw)+','+Math.round(sh);if(m.has(k))return m.get(k);
 if(scanBudget<=0)return null;scanBudget--;let b={x0:0,y0:0,x1:1,y1:1};
 try{const N=40;scanCanvas??=document.createElement('canvas');scanCanvas.width=N;scanCanvas.height=N;const g=scanCanvas.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,N,N);g.drawImage(img,sx,sy,sw,sh,0,0,N,N);
  const d=g.getImageData(0,0,N,N).data;let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1>=0)b={x0:x0/N,y0:y0/N,x1:(x1+1)/N,y1:(y1+1)/N};stats.scans++;}catch(e){}
 if(m.size>2000)m.clear();m.set(k,b);return b;}// R147: 48칸이면 적 동작 칸이 많아 계속 지우고 다시 쟀다(그림 픽셀 읽기)
function record(e,best,T0){const{img,sx,sy,sw,sh,dx,dy,dw,dh,T}=best;const b=opaqueBox(img,sx,sy,sw,sh);if(!b)return;
 const DM=m=>m instanceof DOMMatrix?m:new DOMMatrix([finite(m.a,1),finite(m.b),finite(m.c),finite(m.d,1),finite(m.e),finite(m.f)]),M=DM(T0).inverse().multiply(DM(T)),pts=[[b.x0,b.y0],[b.x1,b.y0],[b.x0,b.y1],[b.x1,b.y1]].map(([u,v])=>M.transformPoint(new DOMPoint(dx+dw*u,dy+dh*v)));
 let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of pts){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);}
 if(!(y1-y0>4))return;VC.set(e,{cx:(x0+x1)/2,cy:(y0+y1)/2,top:y0,bottom:y1,h:y1-y0,w:x1-x0,t:now()});stats.measured++;}
function centreOf(e){if(!prefs.centre||!e)return null;const v=VC.get(e);if(!v||now()-v.t>.6)return null;stats.centred++;return v;}
// 적 발밑(x,y)에서 z 높이(px)를 겨눈 점 → 그 적 그림의 밑에서 같은 비율 높이. 영웅 키 기준 z를 적 그림 키로 바꾼다.
function place(x,y,z){if(!prefs.centre||!live())return null;for(const e of room.enemies||[]){if(Math.abs(e.x-x)>.12||Math.abs(e.y-y)>.12)continue;const v=centreOf(e);if(!v)return null;return{x:v.cx,y:v.bottom-v.h*clamp(z/H(),0,1.1)};}return null;}
function installCentre(){const base=drawEnemy;drawEnemy=function(e,...a){if(!prefs.centre||!e||typeof ctx==='undefined'||typeof ctx?.getTransform!=='function'||typeof ctx?.drawImage!=='function')return base.call(this,e,...a);
  const c=ctx;let T0;try{T0=c.getTransform();}catch(_){return base.call(this,e,...a);}const own=Object.prototype.hasOwnProperty.call(c,'drawImage'),prev=c.drawImage;let best=null,bh=0;
  c.drawImage=function(img,...q){try{if(q.length===8){const T=c.getTransform(),h=Math.abs(q[7]*T.d)+Math.abs(q[7]*T.c);if(h>bh){bh=h;best={img,sx:q[0],sy:q[1],sw:q[2],sh:q[3],dx:q[4],dy:q[5],dw:q[6],dh:q[7],T};}}
   else if(q.length===4&&img){const T=c.getTransform(),h=Math.abs(q[3]*T.d);const W=img.naturalWidth||img.width,Hh=img.naturalHeight||img.height;if(h>bh&&W&&Hh){bh=h;best={img,sx:0,sy:0,sw:W,sh:Hh,dx:q[0],dy:q[1],dw:q[2],dh:q[3],T};}}}catch(_){}return prev.call(this,img,...q);};
  try{return base.call(this,e,...a);}finally{if(own)c.drawImage=prev;else delete c.drawImage;if(best)try{record(e,best,T0);}catch(err){fail(err);}}};
 // 기본 적중 그림(e568HeroImpact): 닿은 자리 대신 그 적 그림의 가운데에 그린다.
 if(typeof drawEffect==='function'){const de=drawEffect;drawEffect=function(f,...a){if(prefs.centre&&f?.type==='e568HeroImpact'&&f.targetIdE568&&live()&&typeof ctx?.translate==='function'){const e=(room.enemies||[]).find(q=>String(q.id)===f.targetIdE568),v=e&&centreOf(e);
   if(v){const p=project(f.x,f.y);ctx.save();try{ctx.translate(v.cx-p.x,v.cy-(p.y-H()*.3));return de.call(this,f,...a);}finally{ctx.restore();}}}return de.call(this,f,...a);};}}

// ---- ② 보스 조준 ---------------------------------------------------------------------------------
const seenHz=new WeakSet();
function aimTick(){if(!prefs.aim||typeof hazards==='undefined'||!Array.isArray(hazards))return;const fresh=[];
 for(const h of hazards){if(seenHz.has(h))continue;seenHz.add(h);if(h.type!=='field'||!(finite(h.warning)>0)||finite(h.age)>.05)continue;const o=(room.enemies||[]).find(e=>e.id===h.owner);if(o&&major(o))fresh.push(h);}
 if(fresh.length<2)return;const vx=finite(player.moveVX150),vy=finite(player.moveVY150),lead=clamp(finite(fresh[0].warning,.8)*.55,0,.9),tx=player.x+vx*lead,ty=player.y+vy*lead;
 if(fresh.some(h=>Math.hypot(h.x-tx,h.y-ty)<finite(h.radius,1)*.8))return;
 let best=null,bd=1e9;for(const h of fresh){const d=Math.hypot(h.x-tx,h.y-ty);if(d<bd){bd=d;best=h;}}
 const px=blockedAt(tx,ty,.1)?player.x:tx,py=blockedAt(tx,ty,.1)?player.y:ty;if(best){best.x=px;best.y=py;best.r115Aimed=true;stats.aimed++;}}

// ---- ③ 반자동·길잡이 보조 -----------------------------------------------------------------------
const RANGED=new Set(['seoha','michaela','hunter','gunner']);
const assist={next:0,until:0,skillAt:0,swing:new WeakSet()};
function steering(){const k=typeof keys!=='undefined'?keys:null,j=typeof joystickVector!=='undefined'?joystickVector:null;
 const sx=(k?.has?.('ArrowRight')?1:0)-(k?.has?.('ArrowLeft')?1:0)+finite(j?.x),sy=(k?.has?.('ArrowDown')?1:0)-(k?.has?.('ArrowUp')?1:0)+finite(j?.y);return Math.hypot(sx,sy)>.01;}
const assisting=()=>prefs.assist&&live()&&solo()&&!busy()&&player.hp>0&&((typeof auto!=='undefined'&&auto)||(typeof guide!=='undefined'&&guide))&&!steering();
function threats(){const out=[];if(typeof hazards==='undefined')return out;for(const h of hazards){if(h.type!=='field'||!(finite(h.age)<finite(h.warning)+.05))continue;const hostile=h.owner==null?h.samongPattern==='r115-hold':(room.enemies||[]).some(e=>e.id===h.owner);if(hostile)out.push(h);}return out;}
const inThreat=(x,y,list,pad=.35)=>list.some(h=>Math.hypot(h.x-x,h.y-y)<finite(h.radius,1)+pad);
function foes(r=12){const out=[];for(const e of room.enemies||[])if(liveFoe(e)&&Math.hypot(e.x-player.x,e.y-player.y)<r)out.push(e);return out;}
function stepTo(p,hold){if(typeof route==='undefined')return false;route=[{x:p.x,y:p.y}];command=null;assist.until=now()+hold;try{if(typeof guideTimer!=='undefined')guideTimer=Math.max(guideTimer,hold);}catch(_){}return true;}
function escapePoint(list,near,minD,maxD,awayFrom){let best=null,bs=-1e9;for(let i=0;i<16;i++){const a=i/16*TAU+(now()%1)*.3;for(const d of[minD,(minD+maxD)/2,maxD]){const x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;
  if(blockedAt(x,y,.3)||blockedAt((x+player.x)/2,(y+player.y)/2,.25)||inThreat(x,y,list,.3))continue;let s=-d*.4;for(const e of near){const k=Math.hypot(e.x-x,e.y-y);s+=awayFrom?Math.min(k,6)*.5:-Math.abs(k-1.3)*.3;}if(s>bs){bs=s;best={x,y};}}}return best;}
function assistTick(){if(!assisting()){return;}const t=now();
 // W·E·R 기술: 설정의 자동 기술이 꺼져 있어도 반자동·길잡이에서는 쓴다(원래 자동 기술 규칙을 그대로 빌린다).
 const nativeSkills=typeof settings!=='undefined'&&settings.autoSkill===true&&typeof auto!=='undefined'&&auto;
 if(!nativeSkills&&t>=assist.skillAt){assist.skillAt=t+.35;const adm=window.__STORYWORLD_HANDO_FINAL_R49__,wer=window.__STORYWORLD_WER__;
  if(adm&&wer?.cast)for(const slot of['r','w','e']){const e=adm.autoTarget?.(slot);if(!e)continue;if(slot==='e'&&typeof HEROES!=='undefined'&&Math.hypot(e.x-player.x,e.y-player.y)<finite(HEROES[player.hero]?.range,2)*.7)continue;try{if(wer.cast(slot,true)){stats.autoSkills++;break;}}catch(err){fail(err);}}}
 if(t<assist.next||t<assist.until)return;assist.next=t+.12;
 const list=threats(),near=foes(12),ranged=RANGED.has(player.hero);
 if(list.length&&inThreat(player.x,player.y,list,.25)){const p=escapePoint(list,near,1.4,3.2,ranged);if(p&&stepTo(p,.55)){stats.dodges++;return;}}
 if(!near.length)return;let n=null,nd=1e9;for(const e of near){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<nd){nd=d;n=e;}}
 if(ranged){if(nd<2.1){const p=escapePoint(list,near,2.2,3.6,true);if(p&&stepTo(p,.5)){stats.kites++;return;}}}
 else if(n&&n.attack&&nd<2.2&&!assist.swing.has(n.attack)){assist.swing.add(n.attack);const ax=player.x-n.x,ay=player.y-n.y,l=Math.hypot(ax,ay)||1,side=(hash(n.id)&1)?1:-1,p={x:player.x-ay/l*side*.9+ax/l*.3,y:player.y+ax/l*side*.9+ay/l*.3};
  if(!blockedAt(p.x,p.y,.3)&&!inThreat(p.x,p.y,list)&&stepTo(p,.35)){stats.sidesteps++;try{if(typeof command!=='undefined')setTimeout(()=>{try{if(liveFoe(n)&&!steering())command=n.id;}catch(_){}},380);}catch(_){}}}}

// ---- ④ 몹 간격 -----------------------------------------------------------------------------------
const rad=e=>clamp(finite(e.combatProfile?.hurtbox?.r,finite(e.radius,.32)),.2,.9);
function spacingTick(dt){if(!prefs.spacing)return;const list=[];for(const e of room.enemies||[]){if(liveFoe(e)&&!major(e)&&!e.samongPatrolR115&&Math.abs(e.x-player.x)<15&&Math.abs(e.y-player.y)<15)list.push(e);if(list.length>=70)break;}
 const n=list.length,k=clamp(dt,0,.05)*2.2;for(let i=0;i<n;i++){const a=list[i];if(a.attack)continue;for(let j=i+1;j<n;j++){const b=list[j],dx=b.x-a.x,dy=b.y-a.y,want=rad(a)+rad(b)+.42;if(Math.abs(dx)>want||Math.abs(dy)>want)continue;const d=Math.hypot(dx,dy);if(d>=want)continue;
  const ux=d>1e-4?dx/d:Math.cos(i*7+j),uy=d>1e-4?dy/d:Math.sin(i*7+j),m=Math.min(.03,(want-d)*k);
  if(!blockedAt(a.x-ux*m,a.y-uy*m,rad(a)*.8)){a.x-=ux*m;a.y-=uy*m;}if(!b.attack&&!blockedAt(b.x+ux*m,b.y+uy*m,rad(b)*.8)){b.x+=ux*m;b.y+=uy*m;}stats.spaced++;}}}

// ---- ⑤ 조형물 묻기 (play-r113 접지 단계가 묻는다) --------------------------------------------------
const NOSINK=/wall|door|gate|banner|torch|relief|frame|window|painting|chest|lamp|portal|record|clue|sign|sconce/i;
function sinkOf(owner,p){if(!prefs.sink)return 0;const id=String(owner?.id||'');if(NOSINK.test(id)||p&&(p.samongR103||p.r115Clue||p.r115Stmt!=null||p.r115Book||p.chest||p.wallMounted))return 0;stats.sunk++;return p?.r99Tree?.04:(.04+(hash(id)%3)*.01);}

// ---- ⑥ 보는 사람 쪽 빛 ----------------------------------------------------------------------------
function installLight(){if(typeof shadow!=='function')return;const base=shadow;shadow=function(x,y,radius=18,opt={}){if(!prefs.frontLight||typeof ctx==='undefined'||!Number.isFinite(x+y))return base.apply(this,arguments);
 try{const o=opt||{},alpha=clamp(finite(o.alpha,1),0,1),lift=clamp(finite(o.lift),0,1),rx=Math.max(6,finite(radius,18)*.78*clamp(finite(o.scale,1),.45,2.4)),ry=Math.max(2,rx*.3*(1-lift*.25)),op=alpha*(1-lift*.55);if(op<=.01)return;
  // 화면 앞(보는 사람)에서 오는 빛: 그림자는 물체 바로 뒤로, 화면 위쪽으로 짧게 눕는다. 가운데가 조금 화면 오른쪽 위로 기운다.
  ctx.save();try{ctx.globalAlpha*=op;const len=rx*1.25*(1-lift*.5);
   ctx.fillStyle='rgba(4,4,8,.17)';ctx.beginPath();ctx.ellipse(x+len*.08,y-len*.42*.55,len*.62,ry*1.15,-.06,0,TAU);ctx.fill();
   ctx.fillStyle='rgba(2,2,6,.2)';ctx.beginPath();ctx.ellipse(x+len*.04,y-len*.2*.55,len*.44,ry*.9,-.04,0,TAU);ctx.fill();
   ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y,rx*.55,ry*.6,0,0,TAU);ctx.fill();}finally{ctx.restore();}
  stats.lit=(stats.lit||0)+1;}catch(e){fail(e);return base.apply(this,arguments);}};}

// ---- ⑦ 사몽선이 뭉친 적을 지나가게 -----------------------------------------------------------------
const doneRuns=new WeakSet();let clusterSerial=0;
function clusters(){const cell=2.4,m=new Map();for(const e of room.enemies||[]){if(!liveFoe(e)||major(e))continue;const k=Math.floor(e.x/cell)+':'+Math.floor(e.y/cell);const g=m.get(k)||{n:0,x:0,y:0};g.n++;g.x+=e.x;g.y+=e.y;m.set(k,g);}
 return[...m.values()].filter(g=>g.n>=2).map(g=>({n:g.n,x:g.x/g.n,y:g.y/g.n})).sort((a,b)=>b.n-a.n).slice(0,5);}
function relay(runs,c){const a0=((hash('c'+(++clusterSerial))%6283)/1000),dx=Math.cos(a0),dy=Math.sin(a0),B=room.exploration?.bounds||[1,1,29,29],R=Math.hypot(B[2]-B[0],B[3]-B[1])*.6,a={x:c.x-dx*R,y:c.y-dy*R},b={x:c.x+dx*R,y:c.y+dy*R};
 const count=Math.min(512,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.38)),out=[];let first=null,last=null;
 for(let i=0;i<=count;i++){const p={x:a.x+(b.x-a.x)*i/count,y:a.y+(b.y-a.y)*i/count},safe=!blockedAt(p.x,p.y,.12);if(safe){if(!first)first=p;last=p;}if((!safe||i===count)&&first){if(Math.hypot(first.x-last.x,first.y-last.y)>.35&&out.length<8)out.push({a:first,b:last});first=last=null;}}
 if(!out.length)return false;runs.length=0;runs.push(...out);return true;}
function samongTick(){if(!prefs.samongCluster||typeof effects==='undefined'||!(player.samong>0))return;let cl=null;
 for(const f of effects){const S=f?.type==='samongStormR75'?f.r75Storm:null;if(!S||!Array.isArray(S.runs)||doneRuns.has(S.runs))continue;doneRuns.add(S.runs);if(now()-finite(S.start)>.12)continue;
  cl??=clusters();if(!cl.length)return;// 넷 중 셋은 뭉친 곳(빽빽할수록 자주), 하나는 원래 무작위 그대로
  const r=(hash(S.id+':'+clusterSerial)%1000)/1000;if(r<.25)continue;const w=cl.map(c=>Math.pow(c.n,1.4)),sum=w.reduce((a,b)=>a+b,0);let pick=((hash('p'+S.id)%1000)/1000)*sum,c=cl[0];for(let i=0;i<cl.length;i++){pick-=w[i];if(pick<=0){c=cl[i];break;}}
  if(relay(S.runs,c))stats.clustered++;}}

// ---- ⑧ 스킬 강화 모음 ----------------------------------------------------------------------------
const VIEWKEY=KEY+'.book';let view='book';try{view=localStorage.getItem(VIEWKEY)||'book';}catch(_){}
const GROUPS=[['성장',/^endless(Power|Vital|Haste|Cooldown|Ward)/],['오라·공명',/Aura|Resonance/],['실검무',/^thread/],['사몽',/dream|samong/i]];
function bookRows(panel){return[...panel.querySelectorAll('.cards button.card.upgrade')].map(b=>{const id=b.dataset.r62Passive||b.dataset.up||'',name=(b.querySelector('strong')?.textContent||'').trim(),small=b.querySelector('small')?.innerText||'',m=name.match(/^(.*?)\s+(\d+)단계\s*\/\s*(∞|\d+)/)||name.match(/^(.*?)\s+(\d+)\s*\/\s*(∞|\d+)$/),title=m?m[1]:name,lv=m?+m[2]:0,max=m?m[3]:'',line=small.split(/\n/)[0].split(/(?<=[.。])\s/)[0].slice(0,90);
 return{b,id,title,lv,max,line,cost:(small.match(/강화 비용[^\n]*/)||[''])[0],disabled:b.disabled,img:b.querySelector('img')?.getAttribute('src')||''};});}
function skillLevels(){try{const g=window.__STORYWORLD_GROWTH_R103__?.state?.(),h=player?.hero;if(!g||!h)return null;return['w','e','r'].map(k=>({k:k.toUpperCase(),n:clamp(finite(g.procs?.[h+':'+k]),0,7)}));}catch(_){return null;}}
function tierInfo(){try{const R=window.__STORYWORLD_HERO_FX_R102__;const t=R?.tier?.(player);return Number.isFinite(t)?t:null;}catch(_){return null;}}
function buildBook(){const panel=document.getElementById('panel');if(!panel||!prefs.skillBook)return;const cards=panel.querySelector('.cards');if(!cards||!cards.querySelector('button.card.upgrade')||panel.querySelector('#r115Book'))return;
 const rows=bookRows(panel);if(!rows.length)return;stats.books++;
 const used=new Set(),groups=GROUPS.map(([g,re])=>{const list=rows.filter(r=>!used.has(r)&&re.test(r.id));list.forEach(r=>used.add(r));return[g,list];});groups.push(['영웅·기타',rows.filter(r=>!used.has(r))]);
 const pts=(panel.querySelector('p.small b')?.textContent||'').trim(),sk=skillLevels(),tier=tierInfo();
 const bar=(n,m)=>'<span class="r115bar"><i style="width:'+Math.round(clamp(n/m,0,1)*100)+'%"></i></span>';
 let h='<div id="r115Book"><div class="r115top"><b>스킬 강화 모음</b><span>'+esc(pts||'')+'</span><span class="r115tabs"><button data-r115view="book" class="'+(view==='book'?'on':'')+'">모음 보기</button><button data-r115view="cards" class="'+(view==='cards'?'on':'')+'">자세히</button></span></div>';
 h+='<div class="r115chips">'+(tier!=null?'<span>스킬 연출 '+tier+' / 7 '+bar(tier,7)+'</span>':'')+(sk?sk.map(s=>'<span>'+s.k+' 기술 '+s.n+' / 7 '+bar(s.n,7)+'</span>').join(''):'')+'</div>';
 h+='<div class="r115groups">';for(const[g,list]of groups){if(!list.length)continue;const got=list.filter(r=>r.lv>0).length;h+='<section><h4>'+esc(g)+' <small>'+got+' / '+list.length+' 배움</small></h4>';
  for(const r of list){const i=rows.indexOf(r);h+='<div class="r115row'+(r.lv>0?' got':'')+'">'+(r.img?'<img src="'+esc(r.img)+'" alt="">':'<i></i>')+'<span class="nm">'+esc(r.title)+'</span><span class="lv">'+(r.max==='1'?(r.lv?'보유':'미보유'):r.lv+'단계')+'</span><span class="ln">'+esc(r.line)+'</span><button data-r115up="'+i+'" '+(r.disabled?'disabled':'')+'>+1</button></div>';}
  h+='</section>';}
 h+='</div></div>';
 const box=document.createElement('div');box.innerHTML=h;const el=box.firstChild;cards.parentNode.insertBefore(el,cards);
 if(!document.getElementById('r115BookCss')){const st=document.createElement('style');st.id='r115BookCss';st.textContent='#r115Book{margin:8px 0 10px;border:1px solid #6b5a46;border-radius:8px;background:#120f0dcc;padding:8px}#r115Book .r115top{display:flex;gap:10px;align-items:center;flex-wrap:wrap}#r115Book .r115top b{font-size:15px;color:#f3dfc0}#r115Book .r115tabs{margin-left:auto;display:flex;gap:4px}#r115Book .r115tabs button{padding:3px 10px;font-size:12px}#r115Book .r115tabs button.on{background:#7a5a33;color:#fff}#r115Book .r115chips{display:flex;flex-wrap:wrap;gap:6px 14px;margin:6px 0;font-size:12px;color:#e8d6bb}#r115Book .r115bar{display:inline-block;vertical-align:middle;width:64px;height:6px;background:#2d2620;border-radius:3px;overflow:hidden;margin-left:4px}#r115Book .r115bar i{display:block;height:100%;background:linear-gradient(90deg,#c9a46a,#f1e3c1)}#r115Book .r115groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px}#r115Book section{background:#1b1612;border-radius:6px;padding:6px}#r115Book h4{margin:0 0 4px;font-size:13px;color:#f0d8ae}#r115Book h4 small{color:#b9a78c;font-weight:normal}#r115Book .r115row{display:grid;grid-template-columns:22px 1fr auto 34px;grid-template-areas:"i n l b" "i t t b";gap:0 6px;align-items:center;padding:3px 2px;border-top:1px solid #2a221b;font-size:12px;color:#cdbda4}#r115Book .r115row.got{color:#f6ead6}#r115Book .r115row img,#r115Book .r115row>i{grid-area:i;width:22px;height:22px;object-fit:contain}#r115Book .nm{grid-area:n;font-weight:bold}#r115Book .lv{grid-area:l;color:#e9c27d}#r115Book .ln{grid-area:t;color:#a99a84;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#r115Book .r115row button{grid-area:b;padding:2px 0;font-size:12px}#panel.r115bookOnly .cards{display:none}@media(max-width:560px){#r115Book .r115groups{grid-template-columns:1fr}}';document.head.appendChild(st);}
 panel.classList.toggle('r115bookOnly',view==='book');el.querySelector('.r115groups').style.display=view==='book'?'':'none';
 el.querySelectorAll('[data-r115view]').forEach(b=>b.onclick=()=>{view=b.dataset.r115view;try{localStorage.setItem(VIEWKEY,view);}catch(_){}panel.classList.toggle('r115bookOnly',view==='book');el.querySelector('.r115groups').style.display=view==='book'?'':'none';el.querySelectorAll('[data-r115view]').forEach(x=>x.classList.toggle('on',x.dataset.r115view===view));});
 el.querySelectorAll('[data-r115up]').forEach(b=>b.onclick=()=>{const r=rows[+b.dataset.r115up];if(r&&!r.b.disabled)r.b.click();});}
function installBook(){if(typeof showUpgrades!=='function')return;const base=showUpgrades;showUpgrades=function(...a){const r=base.apply(this,a);try{buildBook();}catch(e){fail(e);}return r;};
 // 강화 단추를 누르면 원래 창이 다시 그려진다 — 그때도 모음을 다시 붙인다.
 try{const panel=document.getElementById('panel');if(panel&&typeof MutationObserver==='function')new MutationObserver(()=>{try{if(!panel.querySelector('#r115Book')&&panel.querySelector('.cards button.card.upgrade'))buildBook();}catch(e){fail(e);}}).observe(panel,{childList:true});}catch(e){fail(e);}}

// ---- ⑨ 사몽 밖 지역 벽 높이 -------------------------------------------------------------------------
const DOOR=2.7,dressed=new WeakSet();
function wallsTick(){if(!prefs.walls)return;const L=room?.exploration;if(!L||dressed.has(L)||!Array.isArray(L.walls)||L.samongR103||L.samongR115)return;dressed.add(L);
 const exits=[...(Array.isArray(L.doors)?L.doors:[]),...(L.worldR74?.doors||[]),...Object.values(L.exits||{}),L.entry,L.entrance].filter(p=>p&&Number.isFinite(p.x+p.y));const base=finite(L.walls.find(w=>Number.isFinite(w.height))?.height,DOOR);
 for(const w of L.walls){if(!Number.isFinite(w.height)||w.r115Wall)continue;const h0=w.height,near=exits.some(p=>Math.hypot(p.x-w.x,p.y-w.y)<2.6),v=((hash(w.id||w.x+':'+w.y)%9)-4)*.045;
  let h=h0*(1+v);if(near)h=Math.max(h,DOOR+.45+(hash(w.id)%3)*.08);else if(h0<=DOOR+.01)h=Math.max(h,DOOR+.15);w.height=+h.toFixed(2);w.r115Wall=h0;}
 stats.wallRooms++;}

// ---- ⑩ 길잡이 도착 ------------------------------------------------------------------------------
// 길잡이가 단서·진술·문 앞까지 데려다 놓고 멈추던 것: 도착하면 E를 대신 누른다(직접 조작 중이면 안 누름).
const reach={at:0,spot:''};stats.reached=0;
function reachTick(){if(!prefs.assist||typeof guide==='undefined'||!guide||!solo()||busy()||player.hp<=0||steering())return;if(!room?.samongR103)return;
 const g=window.__STORYWORLD_NAV_GOAL_R103__?.();if(!g||(g.kind!=='objective'&&g.kind!=='exit')||Math.hypot(g.x-player.x,g.y-player.y)>1.25)return;
 const t=now(),spot=g.kind+':'+g.x.toFixed(1)+':'+g.y.toFixed(1);if(t<reach.at)return;reach.at=t+(spot===reach.spot?2.5:.6);reach.spot=spot;
 if(typeof interact==='function'){try{interact();stats.reached++;}catch(e){fail(e);}}}

// ---- 설치 ----------------------------------------------------------------------------------------
function install(){installCentre();installLight();installBook();
 const tb=tick;tick=function(dt,...a){scanBudget=6;const r=tb.call(this,dt,...a);if(!live()||!Number.isFinite(dt)||dt<=0)return r;
  try{if(solo()&&!busy()){aimTick();spacingTick(dt);samongTick();}wallsTick();assistTick();reachTick();}catch(e){fail(e);}return r;};
 if(typeof guideStep==='function'){const gs=guideStep;guideStep=function(...a){if(prefs.assist&&now()<assist.until)return;return gs.apply(this,a);};}}
try{install();}catch(e){fail(e);}
window.__STORYWORLD_PLAY_R115__=Object.freeze({revision:REV,prefs:()=>({...prefs}),set,centreOf,place,sinkOf,clusters:()=>live()?clusters():[],buildBook,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},failures,lastError})});
})();
