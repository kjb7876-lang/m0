// R266 피로 물든 병원(ep1a08) 렉 — 사용자 2026-11-03 "피로물든병원 특히 렉이많이걸림".
//  측정(헤드리스, 같은 빌드): ep1a08 세계 그리기 패스의 GPU 그리기 호출이 437번(늪지대 dist02 는 105번).
//  원인: 병원 벽 묶음(hospital-r5-static-wall-batch, 재질 3개)과 별관 바닥 조각들이 벽 조각마다 그리기 그룹을 따로 가져(메시 17개에 그룹 402개)
//  그룹 하나가 그리기 호출 하나가 된다. 재질은 3개뿐이라 같은 재질 그룹을 하나로 모으면 호출이 재질 수만큼으로 준다.
//  · 꼭짓점(위치·법선·UV)은 건드리지 않는다 — 그리는 순서표(index)만 재질별로 다시 묶는다. 다른 오버레이(R89 벽 밑 띠·R90·R91)는 꼭짓점을 읽으므로 그대로.
//  · 반투명 재질이 섞인 메시는 그리는 순서가 의미가 있어 건드리지 않는다. 엔진이 장면을 다시 만들면 새 메시를 다시 묶는다.
//  끄기: localStorage['storyworld.r266.groups']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PERF_GROUPS_R266__)return;
const REV='R266-groups-1',KEY='storyworld.r266.groups',MIN=6;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={meshes:0,groupsBefore:0,groupsAfter:0,skippedTransparent:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const done=new WeakSet();
function compact(o){const g=o.geometry,mats=o.material;if(!g||!Array.isArray(mats)||!Array.isArray(g.groups)||g.groups.length<Math.max(MIN,mats.length*2))return false;
 if(mats.some(m=>m&&(m.transparent||m.alphaTest>0&&m.depthWrite===false))){stats.skippedTransparent++;return false;}
 const idx=g.index?g.index.array:null,total=idx?idx.length:(g.attributes.position?.count||0),byMat=new Map();
 for(const gr of g.groups){const m=gr.materialIndex|0;if(!byMat.has(m))byMat.set(m,[]);byMat.get(m).push(gr);}
 let n=0;for(const list of byMat.values())for(const gr of list)n+=Math.max(0,Math.min(gr.count,total-gr.start));
 const verts=g.attributes.position?.count||0,out=verts>65535?new Uint32Array(n):new Uint16Array(n),groups=[];let k=0;
 for(const [m,list] of [...byMat.entries()].sort((a,b)=>a[0]-b[0])){const start=k;for(const gr of list){const end=Math.min(gr.start+gr.count,total);for(let i=gr.start;i<end;i++)out[k++]=idx?idx[i]:i;}groups.push({start,count:k-start,materialIndex:m});}
 const T=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.T;const BA=T?.BufferAttribute;if(!BA)return false;
 stats.groupsBefore+=g.groups.length;g.setIndex(new BA(out,1));g.clearGroups();for(const gr of groups)g.addGroup(gr.start,gr.count,gr.materialIndex);stats.groupsAfter+=groups.length;stats.meshes++;return true;}
function scan(){if(!on)return;const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const root=r?.spatialRoot;if(!root)return;
 root.traverse(o=>{if(!o.isMesh||done.has(o.geometry||o))return;try{if(Array.isArray(o.material)&&o.geometry?.groups?.length>=MIN){compact(o);}}catch(e){fail(e);}done.add(o.geometry||o);});}
if(typeof setInterval==='function')setInterval(()=>{try{scan();}catch(e){fail(e);}},700);
// ---- 몹·영웅이 조형물보다 먼저 보이게 — 사용자 "보스등 광폭화시 조형물에가려안보이는문제 항상 몹과영웅이먼저보여야함" ----
//  엔진은 조형물·몹·영웅을 x+y 깊이순으로 섞어 그린다 → 앞에 놓인 큰 조형물이 뒤의 몹(광폭화로 두 배 커진 보스 포함)을 덮는다.
//  배우 그리기 직전(drawObjective 바로 뒤)에 그 프레임의 조형물을 깊이순으로 먼저 다 그리고, 원래 자리의 조형물 그리기는 건너뛴다 → 몹·영웅이 늘 위.
let actorsOnTop=true;try{const s=JSON.parse(localStorage.getItem('storyworld.r266.actorsOnTop')||'null');if(s&&s.on===false)actorsOnTop=false;}catch(_){}
let pre=new WeakSet(),preFrame=false;
if(typeof drawObjective==='function'&&typeof drawProp==='function'){const baseObj=drawObjective;
 drawObjective=function(...a){const r=baseObj.apply(this,a);pre=new WeakSet();preFrame=false;
  try{if(actorsOnTop&&typeof room==='object'&&room&&Array.isArray(room.props)){const list=room.props.filter(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)).sort((p,q)=>(p.x+p.y)-(q.x+q.y));
    preFrame=true;for(const q of list){pre.add(q);drawPropNow(q);}stats.propsFirst=(stats.propsFirst||0)+list.length;}}catch(e){fail(e);}return r;};}
let passing=false;/* 먼저 그릴 때는 지금의 drawProp 전체(뒤에 실린 오버레이 감싸기 포함)를 그대로 탄다 */
const drawPropNow=q=>{passing=true;try{drawProp(q);}catch(e){fail(e);}finally{passing=false;}};
if(typeof drawProp==='function'){const baseProp=drawProp;
 drawProp=function(q,...a){if(!passing&&preFrame&&q&&pre.has(q)){pre.delete(q);return;}return baseProp.apply(this,[q,...a]);};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_PERF_GROUPS_R266__=Object.freeze({revision:REV,set,scan,actorsOnTop:v=>{actorsOnTop=v!==false;try{localStorage.setItem('storyworld.r266.actorsOnTop',JSON.stringify({on:actorsOnTop}));}catch(_){}return actorsOnTop;},inspect:()=>({revision:REV,on,stats:{...stats},lastError})});
})();
