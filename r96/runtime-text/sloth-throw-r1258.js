/* R1258 나태 보스 서사 투척 (사용자 2026-11-20 "서사와 다르게 냉장고 소파 휴지 등을 투척하지 않는 오류").
 *  정본(r122 206행): "날아오는 휴지 뭉치를 피하며 고개를 들자, 이번에는 녹슨 냉장고가 내 쪽으로 날아들고 있었다.
 *                    뒤로 물러선 자리 앞에 소파와 썩은 침대가 연달아 떨어졌다."
 *  원인(헤드리스 실측): 엔진 R61 던지기는 보스 기술 돌림(장판·잔영·던지기) 가운데 1/3 차례라 60초 보스전에 1번꼴, 침대는 그림이 없어 빠졌다(R471).
 *  R1258: 나태의 집(ep1b02) 본보스(b02-boss, 분신 제외)가 교전 중에 따로 '살림살이 투척'을 한다. 엔진·R61·R471 차례는 건드리지 않는다.
 *   - 차례(정본 순서): 휴지 뭉치(쓰레기 더미 조각 3개, 낮은 효과 모드 1개) → 녹슨 냉장고(영웅 자리로) → 소파·썩은 침대(영웅이 물러선 자리 앞에 연달아 낙하).
 *   - 그림: 그 방에 놓인 소품 그림 그대로(R523 sloth-fridge·sofa·bed, R80 쓰레기 더미 r80-025). 날아가는 동안 굴러가는 회전, 착지 뒤 잠깐 놓였다 흐려짐.
 *   - 착지: R438 먼지 충격파 프레임 시트(enemy-shockwave 24칸)와 짧은 흔들림. 도형(원·선·장판)·바닥 예고는 그리지 않는다.
 *   - 판정: 착지 순간 착지 자리 반경 안에 영웅이 있으면 hurt(보스 피해×비율). 피하면 피해 없음. 좌표가 유한하지 않으면 던지지 않는다.
 *   - 간격: 교전 2.5초 뒤 첫 투척, 그 뒤 6.5초(체력 절반 아래 5초)마다 한 묶음.
 *  끄기: localStorage['storyworld.r1258.slothThrow']='{"on":false}'  점검: window.__STORYWORLD_SLOTH_THROW_R1258__.inspect()
 */
(()=>{'use strict';
if(window.__STORYWORLD_SLOTH_THROW_R1258__)return;
const REV='R1258-sloth-throw-1',KEY='storyworld.r1258.slothThrow',ZONE='ep1b02',OWNER='b02-boss';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
// 그림 높이는 영웅 키 배율, flight 초, arc 영웅 키 배율, dmg 보스 피해 배율, r 판정 반경(칸), spin 초당 회전, drop 위에서 떨어지는가
const ITEMS=Object.freeze({
 heap:Object.freeze({key:'heap',label:'휴지 뭉치',path:'assets/world-r80/r80-025.webp',h:.55,flight:.55,arc:.9,dmg:.35,r:.6,spin:9,drop:false,dust:.55}),
 fridge:Object.freeze({key:'fridge',label:'녹슨 냉장고',path:'assets/r523/sloth-fridge.webp',h:1.15,flight:.85,arc:1.5,dmg:1.1,r:.85,spin:3.2,drop:false,dust:1}),
 sofa:Object.freeze({key:'sofa',label:'소파',path:'assets/r523/sloth-sofa.webp',h:.95,flight:.9,arc:2.6,dmg:.85,r:.95,spin:1.4,drop:true,dust:1.15}),
 bed:Object.freeze({key:'bed',label:'썩은 침대',path:'assets/r523/sloth-bed.webp',h:.95,flight:.9,arc:2.6,dmg:.85,r:.95,spin:1.2,drop:true,dust:1.15})});
const VOLLEYS=Object.freeze(['heap','fridge','couch']);
const FIRST=2.5,GAP=6.5,GAP_LOW=5,REST=.7,FADE=.3;
const stats={volleys:0,items:0,hits:0,dodged:0,refused:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const fin=v=>typeof v==='number'&&Number.isFinite(v),T=()=>{try{return fin(time)?time:0;}catch(_){return 0;}};
const flying=[],thrown=[];let st=null;// st={boss,next,step}
const SENT={type:'r1258-sloth-throw',x:0,y:0,age:0,life:Infinity,r1258Sentinel:true};
function curRoom(){try{return typeof room==='object'&&room?room:null;}catch(_){return null;}}
function pl(){try{return typeof player==='object'&&player?player:null;}catch(_){return null;}}
function blocked(){try{if(typeof modal!=='undefined'&&modal)return true;if(typeof loading!=='undefined'&&loading)return true;if(typeof started!=='undefined'&&!started)return true;}catch(_){}return false;}
function lowFx(){try{return !!(typeof settings!=='undefined'&&settings?.lowFx);}catch(_){return false;}}
function bossOf(r){if(!r||r.id!==ZONE||!Array.isArray(r.enemies))return null;
 return r.enemies.find(e=>e&&String(e.nativeId||'')===OWNER&&e.boss&&!e.r61Clone&&!e.r61CloneSource&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='hidden'&&e.spawnState!=='dead')||null;}
function ready(p){try{return !!(typeof readyImage==='function'&&readyImage(p)?.image);}catch(_){return false;}}
function launch(B,P,item,tx,ty,delay=0,sx=null,sy=null){const ox=fin(sx)?sx:B.x,oy=fin(sy)?sy:B.y;
 if(![ox,oy,tx,ty].every(fin)){stats.refused++;return null;}if(!ready(item.path)){stats.refused++;return null;}
 const f={key:item.key,item,ox,oy,tx,ty,t0:T()+delay,landed:false,landAt:0,dir:tx>=ox?1:-1,owner:B.id,dmg:Math.max(1,fin(B.damage)?B.damage:10)*item.dmg};
 flying.push(f);thrown.push({key:item.key,at:+f.t0.toFixed(2)});if(thrown.length>40)thrown.shift();stats.items++;return f;}
function volley(B,P){const kind=VOLLEYS[st.step%VOLLEYS.length];st.step++;stats.volleys++;
 const dx=P.x-B.x,dy=P.y-B.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
 if(kind==='heap'){const n=lowFx()?1:3;for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.32,ca=Math.cos(a),sa=Math.sin(a),len=d+(i%2?.35:0);
   launch(B,P,ITEMS.heap,B.x+(ux*ca-uy*sa)*len,B.y+(uy*ca+ux*sa)*len,i*.12);}}
 else if(kind==='fridge')launch(B,P,ITEMS.fridge,P.x,P.y);
 else{// 영웅이 물러선 자리 '앞'(보스 쪽 1칸)에 소파, 이어서 옆으로 비켜 침대
  const fx=P.x-ux*1,fy=P.y-uy*1;launch(B,P,ITEMS.sofa,fx,fy,0,fx-ux*.2,fy-uy*.2);
  launch(B,P,ITEMS.bed,fx-uy*1.1,fy+ux*1.1,.4,fx-uy*1.1-ux*.2,fy+ux*1.1-uy*.2);}}
function land(f,P){f.landed=true;f.landAt=T();
 try{const R=window.__STORYWORLD_FX_MORE_R438__;R?.play?.('enemy-shockwave',f.tx,f.ty,{size:f.item.dust,gap:0,key:':r1258:'+stats.items+':'+f.key});}catch(e){fail(e);}
 try{if(typeof shakeCamera==='function')shakeCamera(.06*f.item.dust);}catch(_){}
 if(!P||!fin(P.x)||!fin(P.y)||!(P.hp>0))return;
 if(Math.hypot(P.x-f.tx,P.y-f.ty)<=f.item.r){stats.hits++;try{if(typeof hurt==='function')hurt(f.dmg,{r1258:true,kind:'r1258-sloth-throw',label:f.item.label,ownerId:f.owner,vx:0,vy:0});}catch(e){fail(e);}}
 else stats.dodged++;}
function step(){const r=curRoom(),P=pl(),t=T();
 for(let i=flying.length-1;i>=0;i--){const f=flying[i];if(!f.landed&&t>=f.t0+f.item.flight)land(f,P);if(f.landed&&t>f.landAt+REST+FADE)flying.splice(i,1);}
 if(!prefs.on||blocked()||!r||!r.engaged||!P||!(P.hp>0)){if(st&&(!r||r.id!==ZONE))st=null;return;}
 const B=bossOf(r);if(!B){st=null;return;}
 if(!st||st.boss!==B)st={boss:B,next:t+FIRST,step:0};
 if(t<st.next)return;
 if(![P.x,P.y,B.x,B.y].every(fin)){stats.refused++;st.next=t+1;return;}
 const d=Math.hypot(P.x-B.x,P.y-B.y);if(d>12||d<.6){st.next=t+.8;return;}
 try{if(typeof clearLine==='function'&&!clearLine(B,P)){st.next=t+.8;return;}}catch(_){}
 volley(B,P);st.next=t+(B.hp<B.maxHp*.5?GAP_LOW:GAP);}
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function unarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function drawOne(f){const t=T();if(t<f.t0)return;const it=f.item;let u=Math.min(1,(t-f.t0)/it.flight),alpha=1;
 if(f.landed){u=1;const k=t-f.landAt;if(k>REST)alpha=Math.max(0,1-(k-REST)/FADE);}
 const x=f.ox+(f.tx-f.ox)*u,y=f.oy+(f.ty-f.oy)*u;if(!fin(x)||!fin(y))return;
 const q=project(x,y);if(!q||!fin(q.x)||!fin(q.y))return;
 const H=(typeof actorHeight==='function'?actorHeight():60),h=H*it.h*(it.drop?1:(.85+.15*u)),
  lift=it.drop?(1-u*u)*H*it.arc:Math.sin(Math.PI*u)*H*it.arc*.5+(1-u)*H*.55,
  ang=f.landed?0:(it.drop?Math.sin((t-f.t0)*it.spin*2)*.18:(t-f.t0)*it.spin*f.dir);
 let row=null;try{row=readyImage(it.path);}catch(_){}if(!row?.image)return;const cr=row.crop||{w:row.image.naturalWidth,h:row.image.naturalHeight},w=h*cr.w/cr.h;
 if(![w,h,lift].every(fin)||w<=0||h<=0)return;
 const paint=()=>{drawImage(it.path,q.x,q.y-lift-h*.5,w,h,{angle:ang,alpha,flip:f.dir<0});};
 const meta={id:'r1258:throw:'+f.key+':'+f.t0.toFixed(3),kind:'effect',x,y,enemy:true,r1258:true};
 try{if(ctx&&typeof ctx.scope==='function')ctx.scope(meta,paint);else paint();stats.draws++;}catch(e){fail(e);}}
function drawAll(){if(typeof project!=='function'||typeof drawImage!=='function')return;for(const f of flying)drawOne(f);}
try{
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r1258-sloth-throw'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{step();if(flying.length)arm();else unarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=function(...a){flying.length=0;st=null;unarm();return base.apply(this,a);};}
}catch(e){fail(e);}
window.__STORYWORLD_SLOTH_THROW_R1258__=Object.freeze({revision:REV,items:ITEMS,volleys:VOLLEYS,
 set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;if(!prefs.on){flying.length=0;unarm();}try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,next:st?+st.next.toFixed(2):null,thrown:thrown.map(x=>({...x})),
  flying:flying.map(f=>({key:f.key,tx:f.tx,ty:f.ty,u:Math.max(0,Math.min(1,(T()-f.t0)/f.item.flight)),landed:f.landed}))})});
})();
