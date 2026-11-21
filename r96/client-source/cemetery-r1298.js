/* R1298 망각의 묘지(kair09) — 묘지 조형물 더 놓기·보스방 큰 묘비·문틀. 사용자 2026-11-21 "벽이 뚫려있는 버그 그리고 묘지조형물 더 많이 배치"
 *  · "망각의묘지 보스입장에 있는 문도 문틀이 부자연스러운듯" · "망각의묘지 보스방에 큰묘지 조형물도 하나 넣어주고" · "망각의묘지 나가는 문 문틀도 이상하네".
 *  (벽 구멍 자체는 outcrops-r839.js 의 벽 이름 겹침 고침 — 같은 라운드.)
 * 1) 조형물: 이미 게임에 있는 묘지 그림(R930 데이터 묘비 a·b, R80 기운 비석·부서진 관, R299 쓰러진 석상)을 길 가장자리 뒷벽(-x·-y 쪽)에 붙여 더 놓는다.
 *    카메라 쪽(+x,+y,+xy) 세 칸이 바닥인 자리만(앞 벽 덩어리에 가려지지 않게), 문·입구·보스·목표·다른 조형물에서 떨어지게, 작은 것끼리 4칸 넘게.
 *    모두 solid:false — 길·판정·길찾기·몹 자리는 그대로. 장식일 뿐 포인트를 주지 않는다(포인트 조형물 R1237 규칙은 그대로).
 * 2) 큰 묘비: 보스 전투실(6..26×6..20) 뒷벽(위쪽 벽)에 데이터 묘비를 크게 하나. solid:false 라 보스전 동선을 막지 않는다.
 * 3) 문틀: R83 문틀 띠(문설주·상인방·사이 기둥)가 옛 병동 밝은 회색 벽 그림을 써서 이 지역 벽(R930 kc-deck)과 따로 놀았다 → 같은 kc-deck 그림·같은 색으로.
 *    통로 끝에 난 보스 문은 통로 벽이 문설주 자리를 지나가 문설주가 벽 바깥으로 흰 줄처럼 삐져나왔다 → 그 문설주는 그리지 않는다(벽이 문설주 노릇).
 * 끄기: localStorage 'storyworld.r1298.cemetery' = '{"on":false}'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_CEMETERY_R1298__)return;
 const REV='R1298-cemetery-1',KEY='storyworld.r1298.cemetery',ZONE='kair09';
 const ART=Object.freeze(['assets/r930/props/kc-data-gravestone-a.webp','assets/r930/props/kc-data-gravestone-b.webp','assets/world-r80/r80-016.webp','assets/world-r80/r80-017.webp','assets/r299/statue.webp']);
 const HEIGHT=Object.freeze({'assets/r930/props/kc-data-gravestone-a.webp':96,'assets/r930/props/kc-data-gravestone-b.webp':96,'assets/world-r80/r80-016.webp':82,'assets/world-r80/r80-017.webp':60,'assets/r299/statue.webp':92});
 const BIG=Object.freeze({path:'assets/r930/props/kc-data-gravestone-a.webp',height:250}),CORE=Object.freeze({x0:6,y0:6,x1:26,y1:20}),ALCOVE=Object.freeze({x1:10,y1:6});
 const FRAME=Object.freeze({path:'assets/r930/tiles/kc-deck.webp',rect:Object.freeze([1024,0,1024,1024]),tint:0xf0eeec});
 const MAX=26,SPACE=4,KEEP=3.5,JAMB=.24;
 const stats={placed:0,frames:0,skipped:0};let lastError=null;const fail=e=>{lastError=String(e?.stack||e).slice(0,300);};
 let prefs={on:true};try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.on===false)prefs.on=false;}catch(_){}
 const K=(x,y)=>x+':'+y;
 function hashOf(s){s=String(s);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 const isZone=r=>!!r&&r.id===ZONE&&(r.layer==null||r.layer==='STORY');
 // ---- 순수: 조형물 자리 ----
 function plan(id,L,opt={}){try{if(id!==ZONE||!L||!Array.isArray(L.floorCells)||L.floorCells.length<9)return[];
  const S=new Set();for(const c of L.floorCells)if(Array.isArray(c)&&Number.isInteger(c[0])&&Number.isInteger(c[1]))S.add(K(c[0],c[1]));const has=(x,y)=>S.has(K(x,y));
  const keep=[...(L.worldR74?.doors||[]),L.entry,L.entrance,...(opt.avoid||[])].filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  const props=(opt.props||[]).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  const inCore=(x,y)=>x>=CORE.x0&&x<CORE.x1&&y>=CORE.y0&&y<CORE.y1;
  const inAlcove=(x,y)=>x<ALCOVE.x1&&y<ALCOVE.y1;/* 다음 구역 문 뒤 막힌 앞뜰(1..9×1..5)은 비운다 */
  const spot=(x,y)=>has(x,y)&&has(x+1,y)&&has(x,y+1)&&has(x+1,y+1)&&(!has(x-1,y)||!has(x,y-1));
  const far=(cx,cy,list,d)=>list.every(p=>Math.hypot(cx-p.x,cy-p.y)>d);
  const out=[];
  // 큰 묘비: 보스 전투실 위쪽 벽(y=CORE.y0) 앞 칸 가운데 오른쪽 — 피할 자리에서 가장 먼 칸
  {let best=null;for(let x=CORE.x0+2;x<CORE.x1-2;x++){const y=CORE.y0;if(!spot(x,y)||has(x,y-1))continue;const cx=x+.5,cy=y+.6;if(!far(cx,cy,keep,KEEP+1.5)||!far(cx,cy,props,2.5))continue;
    const d=Math.min(...keep.map(p=>Math.hypot(cx-p.x,cy-p.y)),99)-Math.abs(cx-21)*.15;if(!best||d>best.d)best={x:cx,y:cy,d};}
   if(best)out.push({id:'r1298:big',x:best.x,y:best.y,path:BIG.path,height:BIG.height,solid:false,big:true});}
  // 작은 조형물: 뒷벽에 붙은 칸을 지역 이름으로 섞은 순서로
  const cand=[];for(const k of S){const[x,y]=k.split(':').map(Number);if(inCore(x,y)||inAlcove(x,y)||!spot(x,y))continue;cand.push([hashOf(id+':'+x+':'+y),x,y]);}
  cand.sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
  let i=0;for(const[,x,y]of cand){if(out.length>=MAX+1)break;const backY=!has(x,y-1),cx=x+.5,cy=y+(backY?.45:.5),px=backY?cx:x+.45;
   if(!far(px,cy,keep,KEEP)||!far(px,cy,props,2.5)||!far(px,cy,out.filter(p=>!p.big),SPACE))continue;
   const path=ART[(hashOf(id+':art:'+i)+i)%ART.length];out.push({id:'r1298:'+x+'_'+y,x:+px.toFixed(2),y:+cy.toFixed(2),path,height:HEIGHT[path],solid:false});i++;}
  return out;}catch(e){fail(e);return[];}}
 // ---- 순수: 문설주 생략(문설주 자리를 통로 벽이 지나감) ----
 function skipPart(d,partId,walls){try{if(!d||!/^(left|right)-jamb$/.test(String(partId))||!Array.isArray(walls))return false;
  const ax=d.axis==='x',width=ax?d.depth:d.width,face=(ax?d.width:d.depth)/2+.015,sgn=/^left/.test(partId)?-1:1,u=sgn*(width/2+JAMB/2);
  // 문설주 가운데(문 면 위)와 그 면에 수직인 벽
  const jx=ax?d.x+face:d.x+u,jy=ax?d.y+u:d.y+face;
  return walls.some(w=>{if(!w||!Number.isFinite(w.x+w.y+w.width+w.depth)||w.angle)return false;const perp=ax?w.width>w.depth:w.depth>w.width;if(!perp)return false;
   const across=ax?Math.abs(w.y-jy):Math.abs(w.x-jx),half=(ax?w.width:w.depth)/2,c=ax?w.x:w.y,f=ax?jx:jy;
   return across<=.3&&f>=c-half-.05&&f<=c+half+.05;});}catch(e){fail(e);return false;}}
 // ---- 문틀 그림 ----
 let frameImg=null,frameReady=false;
 function loadFrame(){if(frameImg||typeof Image==='undefined')return;try{frameImg=new Image();frameImg.decoding='async';frameImg.onload=()=>{frameReady=true;};frameImg.onerror=()=>fail(Error('R1298 frame art failed'));frameImg.src=FRAME.path;}catch(e){fail(e);}}
 function frameArt(r){if(!prefs.on||!r||r.id!==ZONE||(r.layer!=null&&r.layer!=='STORY'))return null;return{path:FRAME.path,rect:[...FRAME.rect],tint:FRAME.tint};}
 window.__STORYWORLD_DOOR_FRAME_R1298__=Object.freeze({
  art(r){try{const a=frameArt(r);if(!a)return null;if(!frameReady){loadFrame();return null;}stats.frames++;return{...a,image:frameImg};}catch(e){fail(e);return null;}},
  skip(r,d,partId){try{if(!frameArt(r))return false;const s=skipPart(d,partId,r?.exploration?.walls);if(s)stats.skipped++;return s;}catch(e){fail(e);return false;}}});
 // ---- 게임에 놓기 ----
 function avoidOf(r){const a=[r.objective,r.altar,r.exploration?.worldR78?.boss,{x:15,y:13},{x:20,y:12}];return a.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));}
 function place(r){try{if(!prefs.on||!isZone(r)||!r.exploration||!Array.isArray(r.props))return 0;if(r.r1298Placed===r.exploration)return 0;
   /* 엔진 지역 장식(regional-detail)은 첫 그리기에서 r.props 를 피해 자리를 정한다 → 그 뒤에 놓아 원래 장식 자리를 바꾸지 않는다 */if(r.r1298Seen!==r.exploration||(r.r1298Frames=(r.r1298Frames||0)+1)<4){if(r.r1298Seen!==r.exploration){r.r1298Seen=r.exploration;r.r1298Frames=0;}return 0;}
   if(window.__STORYWORLD_SURVIVAL_R600__?.active?.()||r.survivalR600)return 0;
   r.r1298Placed=r.exploration;const L=r.exploration,others=r.props.filter(p=>p&&!String(p.id||'').startsWith('r1298:'));
   let n=0;for(const q of plan(ZONE,L,{avoid:avoidOf(r),props:others})){if(r.props.some(p=>p?.id===q.id))continue;
    try{if(typeof explorationBlocked==='function'&&explorationBlocked(L,q.x,q.y,.25))continue;}catch(_){}
    r.props.push({...q,visible:true,enabled:true,autoTargetEligible6:false,r1298Cemetery:true,label:q.big?'큰 묘비':'묘지 조형물'});n++;
    try{if(typeof readyImage==='function'&&!readyImage(q.path)&&typeof addImage==='function')addImage(q.path,'R1298 묘지 조형물');}catch(_){}}
   stats.placed+=n;return n;}catch(e){fail(e);return 0;}}
 if(typeof tick==='function'){const base=tick;let last=null;tick=function(...a){const out=base.apply(this,a);try{if(typeof room!=='undefined'&&room&&(room!==last||room.r1298Placed!==room.exploration)&&!loading){last=room;place(room);}}catch(e){fail(e);}return out;};}
 // 그릴 때: 엔진 지역 장식(목록이 밖에 드러나지 않음)과 2.4칸 안에 겹친 조형물은 그리지 않는다(장식끼리 겹쳐 보이지 않게)
 const decor=new Map();
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){try{if(p&&isZone(typeof room!=='undefined'?room:null)){if(p.regionalDecoration&&Number.isFinite(p.x+p.y))decor.set(String(p.id),{x:p.x,y:p.y,ex:room.exploration});
   else if(p.r1298Cemetery&&!p.big&&p.visible!==false){for(const d of decor.values())if(d.ex===room.exploration&&Math.hypot(d.x-p.x,d.y-p.y)<2.4){p.visible=false;stats.hidden=(stats.hidden||0)+1;return;}}}}catch(e){fail(e);}return base.apply(this,[p,...a]);};}
 function set(v){prefs.on=!(v&&v.on===false);try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_CEMETERY_R1298__=Object.freeze({revision:REV,ZONE,ART,HEIGHT,BIG,CORE,FRAME,plan,skipPart,frameArt,place,set,
  inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,frameReady,props:(typeof room!=='undefined'&&room?.props||[]).filter(p=>p?.r1298Cemetery).map(p=>({id:p.id,x:p.x,y:p.y,path:p.path,height:p.height}))})});
})();
