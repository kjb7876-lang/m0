/* R482 밟아 다져진 길 — 사용자 2026-11-09 "이터널시티 느낌나게 맵개선"(참고: 숲 사이로 흙길이 또렷이 나 있는 실외 화면. 밀도·읽힘만 참고, 그림 복제 없음).
 *  실외 바닥은 지금 지역 질감 한 장이 고르게 깔려 있어 '어디로 다니는 곳인지'가 바닥에서 읽히지 않는다.
 *  이 오버레이는 입구 → 문·제단으로 가는 길을 바닥 칸 위에서 찾아(벽에서 먼 가운데를 좋아하는 A*), 부드럽게 굽힌 뒤
 *  가장자리가 흐린 띠(폭 약 2칸, 넓은 곳에서는 느리게 굽이침)로 다져진 진흙빛(바닥보다 어둡게, 지역 색)을 깐다. 여러 길이 만나는 곳은 자연히 더 진하다(많이 밟힌 곳).
 *  환경 서사(사람·괴물이 오간 자국)이자 길잡이 보조. 보기만 바꾼다: 충돌·문·몹·저장·길잡이 경로 그대로.
 *  메시 1개, 질감은 코드로 만든 128px 흙 얼룩 한 장. 시야(R24 횃불 마스크)를 그대로 받아 어둠 속에서는 같이 어둡다.
 *  끄기: localStorage storyworld.r482.trail = {"on":false}. 맘몬(ep1b06)·실내·동굴은 다루지 않는다.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_TRAIL_R482__)return;
const REV='R482-trail-4',KEY='storyworld.r482.trail';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(e){}
// R204 이 바닥을 그리는 실외 지역(정본 PLACE 'out'). 동굴 dist01·실내·기억 공간은 뺀다. 맘몬 ep1b06 은 Codex 몫.
const ZONES=new Set(['hub','dist00','dist02','dist03','dist04','dist05','dist06','last304','last305','kair05','last302','last303','ep1b06b','kair04','last301','hando01','hando02']),NEVER=new Set(['ep1b06']);
const zoneOk=z=>typeof z==='string'&&ZONES.has(z)&&!NEVER.has(z);
const HALF=1.05,MAXGOALS=6,WANDER=.85;
const stats={builds:0,paths:0,points:0,ms:0,errors:0,zone:null};let lastError=null;
// 바닥 칸 A*: 8방향(모서리 깎기 금지), 칸 비용 = 거리 × (1 + 2.2/(벽까지 거리+.4)) → 넓은 곳은 가운데로, 좁은 곳은 그대로 통과
function findTrail(cells,clear,from,to){
 const key=(x,y)=>x+','+y,has=(x,y)=>cells.has(key(x,y));const sx=Math.floor(from.x),sy=Math.floor(from.y),gx=Math.floor(to.x),gy=Math.floor(to.y);
 if(!has(sx,sy)||!has(gx,gy))return[];
 const g=new Map([[key(sx,sy),0]]),came=new Map(),open=[],done=new Set();let guard=0;
 // 이진 힙(작은 f 먼저) — 넓은 맵에서도 몇 ms
 const push=n=>{open.push(n);let i=open.length-1;while(i){const pa=(i-1)>>1;if(open[pa][0]<=open[i][0])break;[open[pa],open[i]]=[open[i],open[pa]];i=pa;}};
 const pop=()=>{const top=open[0],last=open.pop();if(open.length){open[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<open.length&&open[l][0]<open[m][0])m=l;if(r<open.length&&open[r][0]<open[m][0])m=r;if(m===i)break;[open[m],open[i]]=[open[i],open[m]];i=m;}}return top;};
 push([Math.hypot(gx-sx,gy-sy),sx,sy]);
 while(open.length&&guard++<60000){const [,x,y]=pop(),k=key(x,y);if(done.has(k))continue;done.add(k);
  if(x===gx&&y===gy){const out=[];let c=k;while(c){const [a,b]=c.split(',').map(Number);out.push({x:a+.5,y:b+.5});c=came.get(c);}out.reverse();out[0]={x:from.x,y:from.y};out[out.length-1]={x:to.x,y:to.y};return out;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy,nk=key(nx,ny);if(!has(nx,ny)||done.has(nk))continue;if(dx&&dy&&(!has(x+dx,y)||!has(x,y+dy)))continue;
   // 벽(장 안 거리 ≤ 0)은 지나지 않는다: 칸 가운데와 건너는 선의 가운데 둘 다 본다(Codex #358). 목표 칸(문 자리)만 예외.
   const c=clear(nx+.5,ny+.5),goal=nx===gx&&ny===gy;if(!goal&&(c<=0||clear(x+.5+dx/2,y+.5+dy/2)<=0))continue;const cost=Math.hypot(dx,dy)*(1+2.2/(Math.max(0,c)+.4)),ng=g.get(k)+cost;if(ng<(g.get(nk)??Infinity)){g.set(nk,ng);came.set(nk,k);push([ng+Math.hypot(gx-nx,gy-ny),nx,ny]);}}}
 return[];}
// 모서리 깎기 두 번 + .5칸 간격 다시 찍기 — 계단 모양 없이 부드럽게
function smooth(pts){let p=pts;for(let it=0;it<2;it++){if(p.length<3)break;const q=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];q.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75});}q.push(p[p.length-1]);p=q;}
 const out=[p[0]];let acc=0;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],d=Math.hypot(b.x-a.x,b.y-a.y);acc+=d;if(acc>=.5){out.push(b);acc=0;}}if(out[out.length-1]!==p[p.length-1])out.push(p[p.length-1]);return out;}
// 순수 계획: 바닥 칸(Set 'x,y'), 벽까지 거리 clear(x,y), 출발점, 목표들 → 부드러운 길들
function plan({cells,clear,start,goals}){if(!start||!goals?.length)return[];const out=[];
 const gs=goals.filter(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&Math.hypot(q.x-start.x,q.y-start.y)>3).slice(0,MAXGOALS);
 for(const q of gs){const p=findTrail(cells,clear,start,q);if(p.length>=2)out.push(wander(smooth(p),clear,q));}return out;}
// 넓은 곳의 곧은 길은 사람이 낸 길처럼 보이지 않는다 → 길 옆으로 느린 굽이(±.85칸, 파장 ~9칸). 벽까지 여유(띠 반폭+.2)가 있을 때만, 양 끝은 고정.
function wander(p,clear,q){if(p.length<6)return p;const ph=(q.x*12.9898+q.y*78.233)%6.283;let s=0;const out=p.map((a,i)=>{if(i)s+=Math.hypot(a.x-p[i-1].x,a.y-p[i-1].y);const b=p[Math.max(0,i-1)],c=p[Math.min(p.length-1,i+1)],tx=c.x-b.x,ty=c.y-b.y,L=Math.hypot(tx,ty)||1;
  const end=Math.min(1,i/6,(p.length-1-i)/6),off=WANDER*end*(Math.sin(s*.7+ph)*.7+Math.sin(s*.29+ph*2)*.3);for(let f=1;f>=0;f-=.25){const x=a.x-ty/L*off*f,y=a.y+tx/L*off*f;if(clear(x,y)>=HALF+.2||f===0)return{x,y};}return a;});return out;}
// 띠 메시: 길마다 가로 3점(가장자리 알파 0, 가운데 1), 세로로 흙 얼룩 질감 반복
function ribbon(paths,seed=1){const pos=[],uv=[],col=[],idx=[];let base=0,h=(seed>>>0)||1;const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};
 for(const p of paths){if(p.length<2)continue;let s=0;
  for(let i=0;i<p.length;i++){const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],tx=b.x-a.x,ty=b.y-a.y,L=Math.hypot(tx,ty)||1,nx=-ty/L,ny=tx/L;if(i)s+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
   const w=HALF*(.85+rnd()*.3),fade=Math.min(1,i/3,(p.length-1-i)/3),core=(.72+rnd()*.28)*fade;
   for(const [k,al] of [[-1,0],[0,core],[1,0]]){pos.push(p[i].x+nx*w*k,0,p[i].y+ny*w*k);uv.push((k+1)/2,s/3);col.push(al);}
   if(i){const v=base+(i-1)*3;for(const [c0,c1] of [[0,1],[1,2]])idx.push(v+c0,v+c1,v+3+c0,v+c1,v+3+c1,v+3+c0);}}
  base+=p.length*3;}
 return{pos,uv,alpha:col,idx};}
function dirtTex(T){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='rgb(118,112,104)';g.fillRect(0,0,128,128);
 let h=0x48211;const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};
 for(let i=0;i<900;i++){const x=rnd()*128,y=rnd()*128,r=.6+rnd()*2.2,l=70+rnd()*110;g.fillStyle=`rgba(${l},${l*.88|0},${l*.72|0},${.25+rnd()*.45})`;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;return t;}
function build(T,r,A,ctx){const P=plan(ctx);if(!P.length)return null;const R=ribbon(P,ctx.seed);if(!R.idx.length)return null;
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(R.pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(R.uv,2));
 geo.setAttribute('color',new T.Float32BufferAttribute(R.alpha.flatMap(a=>[a,a,a,a]),4));geo.setIndex(R.idx);geo.computeBoundingSphere();
 const tint=ctx.tint||[1,1,1],mat=new T.MeshBasicMaterial({map:dirtTex(T),transparent:true,opacity:.62,vertexColors:true,depthWrite:false,toneMapped:false,color:new T.Color(.36*tint[0],.34*tint[1],.31*tint[2]),polygonOffset:true,polygonOffsetFactor:-1.5});
 r.spatialResources?.add(geo);r.spatialResources?.add(mat);r.spatialResources?.add(mat.map);if(r.sightState24&&A?.attachSight24)A.attachSight24(mat,r.sightState24);
 const m=new T.Mesh(geo,mat);m.name='r482-trail';m.position.y=.006;m.layers.set(2);m.renderOrder=-19.5;m.userData.presentationOnly=true;m.userData.r482=true;m.userData.paths=P.length;m.userData.points=P.reduce((a,p)=>a+p.length,0);return m;}
let seen=null;
function tick(){if(!prefs.on)return;try{
 const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,st=r?.__r204,CAVE=window.__STORYWORLD_CAVE_R204__,T=r?.T,A=window.StoryPhase1;
 if(!r||!st||st.pending||!st.group||!st.F||st.decorOnly||!CAVE||!T||r.disposed)return;if(st.group.getObjectByName?.('r482-trail'))return;
 const key=st.gen+'|'+st.zone;if(seen===key)return;const rm=typeof room!=='undefined'?room:null;
 if(!rm||rm.id!==st.zone)return;seen=key;if(!zoneOk(st.zone))return;const L=rm.exploration;if(!L?.floorCells?.length)return;
 const t0=performance.now(),F=st.F,cells=new Set(L.floorCells.map(c=>(c.x??c[0])+','+(c.y??c[1])));
 const goals=[...(L.worldR74?.doors||[]).map(d=>({x:+d.x,y:+d.y})),rm.altar&&{x:+rm.altar.x,y:+rm.altar.y},L.gate&&{x:+L.gate.x,y:+L.gate.y},rm.objective&&{x:+rm.objective.x,y:+rm.objective.y},...(rm.exits||[]).map(e=>({x:+e.x,y:+e.y}))].filter(Boolean);
 const m=build(T,r,A,{cells,clear:(x,y)=>CAVE.at(F,F.f,x,y),start:L.entry&&{x:+L.entry.x,y:+L.entry.y},goals,seed:[...st.zone].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261)});
 if(!m)return;st.group.add(m);stats.builds++;stats.paths=m.userData.paths;stats.points=m.userData.points;stats.zone=st.zone;stats.ms=Math.round(performance.now()-t0);
}catch(e){stats.errors++;lastError=String(e?.stack||e).slice(0,300);}}
setInterval(tick,450);
window.__STORYWORLD_TRAIL_R482__=Object.freeze({revision:REV,plan,ribbon,findTrail,zoneOk,enabled:()=>prefs.on,
 set(o){if(typeof o?.on==='boolean'){prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){}const g=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.__r204?.group?.getObjectByName?.('r482-trail');if(g)g.visible=prefs.on;seen=null;}return{...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
