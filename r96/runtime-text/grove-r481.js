/* R481 실외 숲 덩어리 — 사용자 2026-11-09 "이터널시티 느낌나게 맵개선"(참고: 길 둘레를 덤불·나무 무리가 빽빽하게 감싸는 실외 화면, 분위기·밀도만 참고, 그림 복제 없음).
 *  R204 는 대지(바닥 밖 둔덕) 위에 나무를 2.2칸 넘게 띄워 한 그루씩 흩어 둔다 → 화면이 휑하고 길이 '숲속'으로 읽히지 않는다.
 *  이 오버레이는 같은 나무 그림(R204 가 이미 읽은 지역 나무 12장)으로
 *   ① 나무마다 둘레 0.8~2.1칸에 덤불 2~3덩이를 모으고(나무 그림 윗부분 수관만 땅에 앉힘, 아래쪽은 어둡게 — 땅 그늘),
 *   ② 나무가 없는 뒤쪽 대지 가장자리(바닥에서 0.9~2.4칸)에 작은 숲(큰 나무 1 + 덤불 2)을 더한다.
 *  뒤쪽 높은 대지(R204 topHeight ≥ 1.05)에만 놓는다 — 카메라 쪽 낮은 대지에는 두지 않아 영웅·몹을 가리지 않는다. 문 둘레(4.5칸, 문 앞 카메라 쪽 띠)는 비운다.
 *  보기만 바꾼다: 충돌·문·몹·저장·카메라 그대로. 그림(재질)마다 메시 1개로 묶어 그리기 호출은 지역당 최대 12번(나무 그림 수)이다.
 *  저사양(settings.lowFx)은 같은 배치에서 절반만. 끄기: localStorage storyworld.r481.grove = {"on":false}. 맘몬(ep1b06)·실내는 다루지 않는다.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_GROVE_R481__)return;
const REV='R481-grove-3',CROWN_V0=.45,KEY='storyworld.r481.grove';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(e){}
// R204 가 나무를 심는 실외 지역(cave-r204 ZONES 의 trees). 맘몬 ep1b06 은 Codex 몫이라 늘 뺀다(ep1b06b 눈보라 숲은 다른 지역).
const ZONES=new Set(['dist00','dist02','dist04','last304','last305','kair05','last303','ep1b06b']),NEVER=new Set(['ep1b06']);
const zoneOk=z=>typeof z==='string'&&ZONES.has(z)&&!NEVER.has(z);
const lowFx=()=>{try{return !!(typeof settings!=='undefined'&&settings&&settings.lowFx);}catch(e){return false;}};
const stats={builds:0,spots:0,meshes:0,ms:0,errors:0,zone:null};let lastError=null;
function rng(seed){let h=(seed>>>0)||1;return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
// 순수 배치: 장(W·H), 신호 거리 fv(바닥 안 +), 대지 높이 top, 문 [x,y,r], 기존 나무 {x,y}, 시드, 그림 수 → 심을 자리 [{x,y,h,s,shade,mat}]
function plan({W,H,fv,top,doors=[],trees=[],seed=1,mats=1}){
 const rnd=rng((seed^0x481a77)>>>0),cap=Math.min(320,Math.round(trees.length*3.2)+60),out=[],M=Math.max(1,mats|0);
 // 문 둘레: R204 nearDoorR443 와 같은 규칙(4.5칸 + 문 앞 카메라 쪽 13칸 띠는 키 큰 것 금지) — 문이 숲에 묻히지 않게
 const doorOk=(x,y)=>doors.every(d=>{const dx=x-d[0],dy=y-d[1],r=Math.max(3.5,+d[2]||0);if(Math.hypot(dx,dy)<Math.max(4.5,r))return false;const fwd=dx+dy,side=Math.abs(dx-dy);return !(fwd>0&&fwd<13&&side<r+2);});
 const free=(x,y,minNew)=>out.every(p=>Math.hypot(p.x-x,p.y-y)>=minNew)&&trees.every(t=>Math.hypot(t.x-x,t.y-y)>=.6);
 const okAt=(x,y,lo=-6,hi=-.9)=>{if(x<.5||y<.5||x>W-.5||y>H-.5)return false;const v=fv(x,y);return v<=hi&&v>=lo&&top(x,y)>=1.05&&doorOk(x,y);};
 const put=(x,y,s,shade)=>{out.push({x:+x.toFixed(3),y:+y.toFixed(3),h:top(x,y),s:+s.toFixed(3),shade:+shade.toFixed(3),mat:Math.floor(rnd()*M)});};
 // ① 기존 나무 둘레 덤불·어린 나무
 // 빛이 닿는 바닥 가장자리 쪽(대지 안쪽 3.5칸 이내) 나무를 먼저 — 화면에 보이는 테두리부터 채운다
 const RIMRES=Math.round(cap*.35);const near=trees.filter(t=>fv(t.x,t.y)>=-3.5),far=trees.filter(t=>fv(t.x,t.y)<-3.5);
 for(const t of near.concat(far)){if(out.length>=cap-(far.includes(t)?RIMRES:0))break;const want=fv(t.x,t.y)>=-3.5?3:1+Math.floor(rnd()*2);let n=0;
  for(let k=0;k<want*8&&n<want&&out.length<cap;k++){const a=rnd()*Math.PI*2,d=.8+rnd()*1.3,x=t.x+Math.cos(a)*d,y=t.y+Math.sin(a)*d;
   if(!okAt(x,y)||!free(x,y,.7))continue;put(x,y,.32+rnd()*.38,.78+rnd()*.17);n++;}}
 // ② 나무 없는 뒤쪽 대지 가장자리에 작은 숲
 const rim=[];for(let y=1;y<H-1;y+=1.2)for(let x=1;x<W-1;x+=1.2){const jx=x+(rnd()-.5)*.6,jy=y+(rnd()-.5)*.6;if(okAt(jx,jy,-2.2,-.9))rim.push([jx,jy]);}
 for(let i=rim.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[rim[i],rim[j]]=[rim[j],rim[i]];}
 for(const [x,y] of rim){if(out.length>=cap)break;if(trees.some(t=>Math.hypot(t.x-x,t.y-y)<3.6)||out.some(p=>p.s>=.75&&Math.hypot(p.x-x,p.y-y)<2.8))continue;if(rnd()>.8)continue;
  if(!free(x,y,.7))continue;put(x,y,.75+rnd()*.25,.82+rnd()*.18);
  for(let k=0,n=0;k<16&&n<2&&out.length<cap;k++){const a=rnd()*Math.PI*2,d=.8+rnd()*1.1,cx=x+Math.cos(a)*d,cy=y+Math.sin(a)*d;if(!okAt(cx,cy)||!free(cx,cy,.7))continue;put(cx,cy,.32+rnd()*.33,.78+rnd()*.17);n++;}}
 // 저사양: 같은 배치에서 한 그루 걸러 한 그루(자리는 그대로, 수만 절반)
 return lowFx()?out.filter((_,i)=>i%2===0):out;}
// 그리기: 카메라를 보는 사각형(엔진 카메라는 회전하지 않는 고정 등각) — 그림마다 메시 하나
function build(T,r,ctx,sprites){
 const maps=[],mi=new Map();for(const s of sprites){const m=s.material?.map;if(m&&!mi.has(m)){mi.set(m,maps.length);maps.push(s.material);}}
 if(!maps.length)return null;
 const trees=sprites.map(s=>({x:s.position.x,y:s.position.z,h:s.position.y}));
 const P=plan({W:ctx.W,H:ctx.H,fv:ctx.fv,top:ctx.top,doors:ctx.doors,trees,seed:ctx.seed,mats:maps.length});if(!P.length)return null;
 const baseH=sprites.reduce((a,s)=>a+(+s.scale?.y||4),0)/sprites.length||4,aspect=sprites.reduce((a,s)=>a+((+s.scale?.x||3.8)/(+s.scale?.y||4)),0)/sprites.length||.95;
 r.camera?.updateMatrixWorld?.();const e=r.camera.matrixWorld.elements,R=[e[0],e[1],e[2]],U=[e[4],e[5],e[6]];
 const g=new T.Group();g.name='r481-groves';g.userData.r481=true;g.userData.camSig=R.concat(U).map(v=>v.toFixed(3)).join(',');
 for(let k=0;k<maps.length;k++){const mine=P.filter(p=>p.mat===k);if(!mine.length)continue;const pos=[],col=[],uv=[],idx=[];let q=0;
  for(const p of mine){const jit=.92+((p.x*7.31+p.y*3.17)%1+1)%1*.16,flip=((p.x*13.7+p.y*5.3)|0)%2===0,bush=p.s<.75;
   // 덤불(아랫단): 나무 그림의 윗부분(수관·가지 끝, 그림 높이 45%~100%)만 땅에 앉힌다 → 줄기 없는 덤불 덩어리로 읽힌다. 큰 나무는 그림 전체.
   const v0=bush?CROWN_V0:0,full=baseH*(bush?p.s+.25:p.s)*jit,hgt=full*(1-v0),w=full*aspect;
   const bx=p.x,by=p.h-(bush?.12:.05),bz=p.y,cx=.5,cy=bush?.06:.04;
   const V=(u,v)=>{const du=(u-cx)*w,dv=(v-cy)*hgt;return[bx+R[0]*du+U[0]*dv,by+R[1]*du+U[1]*dv,bz+R[2]*du+U[2]*dv];};
   // 아래 꼭짓점은 더 어둡게(땅에 닿는 그늘), 위는 그대로
   for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){pos.push(...V(u,v));const sh=v?p.shade:p.shade*.62;col.push(sh,sh,sh);uv.push(flip?1-u:u,v0+v*(1-v0));}
   const b=q*4;idx.push(b,b+1,b+2,b,b+2,b+3);q++;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(col,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeBoundingSphere();
  const src=maps[k],c=src.color||{r:1,g:1,b:1};
  const mat=new T.MeshBasicMaterial({map:src.map,alphaTest:Math.max(.45,+src.alphaTest||0),transparent:false,depthWrite:true,toneMapped:false,vertexColors:true,side:T.DoubleSide,color:new T.Color(c.r,c.g,c.b)});
  r.spatialResources?.add(geo);r.spatialResources?.add(mat);
  const mesh=new T.Mesh(geo,mat);mesh.name='r481-grove-'+k;mesh.layers.set(2);mesh.renderOrder=-27;mesh.userData.presentationOnly=true;mesh.userData.r481=true;mesh.frustumCulled=true;g.add(mesh);}
 g.userData.spots=P.length;return g;}
let seen=null;
function tick(){if(!prefs.on)return;try{
 const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three,st=r?.__r204,CAVE=window.__STORYWORLD_CAVE_R204__,T=r?.T;
 if(!r||!st||st.pending||!st.group||!st.F||!CAVE||!T||r.disposed)return;
 const tg=st.group.getObjectByName?.('r204-trees');const old=st.group.getObjectByName?.('r481-groves');
 if(old){if(old.userData.camSig){r.camera?.updateMatrixWorld?.();const e=r.camera?.matrixWorld?.elements;const sig=e?[e[0],e[1],e[2],e[4],e[5],e[6]].map(v=>v.toFixed(3)).join(','):old.userData.camSig;if(sig!==old.userData.camSig){st.group.remove(old);}else return;}else return;}
 const key=st.gen+'|'+st.zone;if(seen===key&&!old)return;seen=key;
 if(!zoneOk(st.zone)||!tg||!tg.children?.length)return;
 const t0=performance.now(),F=st.F,z=st.zone;
 const ctx={W:F.W,H:F.H,fv:(x,y)=>CAVE.at(F,F.f,x,y),top:(x,y)=>CAVE.topHeight(F,z,x,y),doors:(F.doors||[]).map(d=>[d[0],d[1],Math.max(3.5,(+d[2]||3.5)-.5)]),seed:[...z].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261)};
 const g=build(T,r,ctx,tg.children.filter(s=>s.isSprite!==false&&s.material?.map));if(!g)return;st.group.add(g);
 stats.builds++;stats.spots=g.userData.spots;stats.meshes=g.children.length;stats.zone=z;stats.ms=Math.round(performance.now()-t0);
}catch(e){stats.errors++;lastError=String(e?.stack||e).slice(0,300);}}
setInterval(tick,400);
window.__STORYWORLD_GROVE_R481__=Object.freeze({revision:REV,plan,build,zoneOk,enabled:()=>prefs.on,
 set(o){if(typeof o?.on==='boolean'){prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){}const st=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.__r204,g=st?.group?.getObjectByName?.('r481-groves');if(g)g.visible=prefs.on;seen=null;}return{...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
