/* R103: 사몽 에피소드 순환 — 생존전(누적 666 처치) → 손전등 미로 → 상승형 보스맵.
 * DREAM(사몽) 세계에서만 열립니다. 기존 STORY·DREAM 구역, 진행, 저장은 그대로 두고
 * 별도 저장 필드(samongR103)와 별도 지역 id(sm103-*)를 씁니다. 서사는
 * samong-text-r103.js 의 원문 문단만 보여 줍니다. */
(()=>{'use strict';
 if(window.__STORYWORLD_SAMONG_R103__)return;
 const REV='R103-samong-1+R105+R115',PREFIX='sm103-',VERSION=1,GOAL=666;
 const TEXT=()=>window.__STORYWORLD_SAMONG_TEXT_R103__?.sections||{};
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,400);};
 const live=()=>typeof started!=='undefined'&&started&&!!player&&!!room;
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';

 // ---- episodes (원문 근거: 설계 문서 2절) ------------------------------------------------
 // host: 그림·테마를 빌릴 기존 지역. boss/mobs: [지역, nativeId] 그림을 빌릴 기존 배우.
 // text: 생존전·미로·보스 앞뒤에 보여 줄 원문 구간 키.
 const EP=[
  {key:'P',title:'주인 없는 자장가',chapter:'제9부 — 사몽',text:['prelude','threshold'],host:'dist05',style:'forge',tint:[0x2b2630,0x4a3d4f],
   boss:{name:'코어 아래의 검은 뿌리',donor:['dist00','dist00-boss'],patterns:['ground','sides']},bossOnly:true},
  {key:'S-01',title:'꿰맨 장미의 집',chapter:'제9부 — 사몽',text:['threshold','S-01'],host:'ep1b05',style:'domestic',tint:[0x3a2c30,0x6b4b52],
   mobName:'뿌리에서 쏟아진 잔영',mobs:[['ep1a10','a10-s1'],['last302','l302-e1']],maze:'빛이 닿는 만큼 생기는 복도',
   boss:{name:'봉합부인',donor:['ep1a11','mb-ep1a11'],patterns:['sides','sky']},guard:[['ep1b05','b05-p1']]},
  {key:'S-02',title:'밤의 출석부',chapter:'제9부 — 사몽',text:['S-02'],host:'ep1a09',style:'clinical',tint:[0x283036,0x46535a],
   mobName:'얼굴 없는 학생',mobs:[['ep1a08','a08-s1'],['u204','u204-e2']],maze:'자정 1분 전의 학교 복도',
   boss:{name:'순찰자',donor:['ep1a08','mb-ep1a08'],patterns:['sides','ground']},guard:[['u204','u204-e2']]},
  {key:'S-03',title:'흑과 백 — 끝나지 않는 시험',chapter:'제9부 — 사몽',text:['S-03'],host:'dist04',style:'garden',tint:[0x2f2f2f,0x6a6a6a],
   mobName:'다시 일으켜 세워진 도전자',mobs:[['dist04','dist04-c1'],['dist04','dist04-s1']],maze:'시험장 천막 뒤편',
   boss:{name:'검은 고리',donor:['cult06','c106-mid'],patterns:['ground','sky']},guard:[['dist04','dist04-c1']]},
  {key:'S-04',title:'감정의 탑 — 아직 따뜻한 배달',chapter:'제9부 — 사몽',text:['S-04'],host:'ep1b08',style:'clinical',tint:[0x2a2f3a,0x515a6e],
   mobName:'규칙을 어기지 않는 마네킹',mobs:[['ep1a10','a10-o1'],['ep1b06','b06-f1']],maze:'열여섯 층의 복도',
   boss:{name:'강재헌',donor:['ep1b08','b08-boss'],patterns:['sky','rain']},guard:[['ep1a10','a10-o1']]},
  {key:'S-05',title:'경성의 밤',chapter:'제9부 — 사몽',text:['S-05'],host:'last302',style:'domestic',tint:[0x2c2a2a,0x5e5552],
   mobName:'찢긴 호외의 잔향',mobs:[['ep1b07','b07-f1'],['murder04','murder04-e2']],maze:'눈 내리는 골목',
   boss:{name:'교주의 인장',donor:['ep1b01','mb-ep1b01'],patterns:['ground','rain']},guard:[['ep1b07','b07-f1']]},
  {key:'S-06',title:'네오 서울 — 아직 오지 않은 종말',chapter:'제9부 — 사몽',text:['S-06','NS-01','NS-02','NS-03','NS-04','NS-05','NS-06','NS-07','NS-08','NS-09','NS-10'],host:'u201',style:'forge',tint:[0x262c33,0x4b5866],
   mobName:'기계군단',mobs:[['u201','u201-e1'],['u201','u201-e2']],maze:'도시의 밑면',
   boss:{name:'미명천사',donor:['ep1a11','a11-boss'],patterns:['rain','sky','sides']},guard:[['ep1b09','b09-h1']]},
  {key:'S-07',title:'페르소나 — 내 얼굴을 쓴 자',chapter:'제10부 — 페르소나와 EGO',text:['S-07'],host:'cult03',style:'domestic',tint:[0x2d2430,0x5c4a63],
   mobName:'여섯 물건의 그림자',mobs:[['hando03','h103-t1'],['hando02','h102-t1']],maze:'손님 자리 하나뿐인 식탁',
   boss:{name:'페르소나',donor:['hando03','h103-boss'],patterns:['sides','ground','sky']},guard:[['hando03','h103-t1']]},
  {key:'RA',title:'어제가 도착하는 미술관',chapter:'제11부 — 사몽역행',text:['R-00','R-01','R-02'],host:'ep1a10',style:'clinical',tint:[0x26302c,0x4d6158],
   mobName:'붉은 교정 표시',mobs:[['cult06','c106-e1'],['murder04','murder04-e1']],maze:'학교와 병원 사이의 이송로',
   boss:{name:'순찰자',donor:['murder02','mb-murder02'],patterns:['sides','rain']},guard:[['murder04','murder04-e1']]},
  {key:'RB',title:'두 개의 의자와 세 잔의 물',chapter:'제11부 — 사몽역행',text:['R-03','R-04'],host:'ep1b06',style:'domestic',tint:[0x30292a,0x6a5552],
   mobName:'정해진 시각에 도착하지 못한 발자국',mobs:[['kair01','kair-academy-wave-1'],['kair04','kair-guardian-01']],maze:'녹아내린 승강장',
   boss:{name:'총지배인',donor:['ep1b06','b06-boss'],patterns:['ground','sides']},guard:[['ep1b06','b06-f1']]},
  {key:'RC',title:'흑백의 청색재판',chapter:'제11부 — 사몽역행',text:['R-05','R-06'],host:'ep1b03',style:'garden',tint:[0x262a33,0x51586b],
   mobName:'관람석의 시선',mobs:[['ep1b03','b03-g1'],['ep1b05','b05-p1']],maze:'접히는 재판정',
   boss:{name:'재판관',donor:['ep1b03','mb-ep1b03'],patterns:['sky','ground']},guard:[['ep1b03','b03-g1']]},
  {key:'RD',title:'첫 번째 나팔 — 서로의 결말을 먹는 도시',chapter:'제11부 — 사몽역행',text:['R-07','R-08','R-09'],host:'cult02',style:'forge',tint:[0x2a2a35,0x55556e],
   mobName:'서로의 결말을 먹는 도시',mobs:[['cult02','c102-e1'],['cult05','c105-e2']],maze:'수련 아래의 불면병동',
   boss:{name:'첫 번째 나팔',donor:['cult02','c102-boss'],patterns:['rain','sides']},guard:[['cult02','c102-e1']]},
  {key:'RE',title:'네 번째 나팔 — 백색 사수의 승전식',chapter:'제11부 — 사몽역행',text:['R-10'],host:'u202',style:'forge',tint:[0x2e3236,0x6a737b],
   mobName:'다음 자리를 노리는 사격',mobs:[['u201','u201-e1'],['u202','u202-e2']],maze:'관람석이 붙은 탈출로',
   boss:{name:'백색 사수',donor:['u201','u201-mid'],patterns:['rain','sky']},guard:[['u202','u202-e2']]},
  {key:'RF',title:'다섯 번째 나팔 — 선생님의 빈 얼굴',chapter:'제11부 — 사몽역행',text:['R-11','R-12'],host:'cult05',style:'domestic',tint:[0x2d2a26,0x655d50],
   mobName:'종이 형상',mobs:[['murder04','murder04-e2'],['ep1b03','b03-g2']],maze:'책의 등 안쪽',
   boss:{name:'스토리텔러',donor:['cult03','c103-boss'],patterns:['sides','ground','rain']},guard:[['murder04','murder04-e2']]},
  {key:'RG',title:'일곱 번째 나팔 — 여백의 전쟁',chapter:'제11부 — 사몽역행',text:['R-13','R-14','R-15','R-16','R-17'],host:'cult06',style:'forge',tint:[0x2a2430,0x5a4a66],
   mobName:'막힌 이름들',mobs:[['cult04','c104-e1'],['cult03','c103-e1']],maze:'여백의 전쟁터',
   boss:{name:'일곱 번째 나팔',donor:['cult04','c104-mid'],patterns:['sky','rain','ground','sides']},guard:[['cult04','c104-e1']]},
  {key:'M',title:'마지막에 남은 사람',chapter:'제12부 — 마지막에 남은 사람',text:['M1','M2','M3'],host:'kair05',style:'domestic',tint:[0x2c2c30,0x67646e],
   mobName:'성벽과 시곗바늘의 잔해',mobs:[['kair04','kair-guardian-01'],['u201','u201-e3']],maze:'상담실로 밀려온 성벽',
   boss:{name:'미카엘라',donor:['kair02','kair-great-03'],patterns:['ground','sides','sky','rain'],final:true},guard:[['dist00','a11-c1']]}
 ];
 const STAGES=['survival','maze','ascent'];
 const josa=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1);return w+(c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?a:b);};
 // A stage borrows a neutral host region id (art, theme, scene backdrop) but owns a separate
 // room object that is never stored in world[] or in the native save.
 const sid=(i,s)=>PREFIX+i+'-'+s;
 // R115: 장마다 여러 구역(samong-zones-r115.js). 구역이 있는 장은 생존→미로→상승 대신 구역 순서를 따른다.
 const ZN=()=>window.__STORYWORLD_SAMONG_ZONES_R115__||null;
 const zonesOf=i=>ZN()?.chapter?.(EP[i]?.key)||null;
 const zoneOf=id=>id?ZN()?.zone?.(id)||null:null;
 const epOfZone=id=>EP.findIndex((e,i)=>zonesOf(i)?.some(z=>z.id===id));
 let stageRoom=null,entering=0;
 const here=()=>live()&&!!stageRoom&&room===stageRoom&&zone===stageRoom.id&&layer==='DREAM';

 // ---- state --------------------------------------------------------------------------------
 const fresh=()=>({version:VERSION,active:false,ep:0,stage:'ascent',kills:0,serial:0,counted:[],seed:0,checkpoint:null,cleared:[],read:[],chests:[],started:false,done:false,returnTo:null,flashSaved:null,deaths:0,zone:null,zoneDone:[],zoneRead:[],zoneSolve:{}});
 let S=fresh();
 function clean(v){if(!v||v.version!==VERSION)return fresh();const s=fresh();s.ep=Math.max(0,Math.min(EP.length-1,Math.floor(Number(v.ep)||0)));s.stage=STAGES.includes(v.stage)||v.stage==='explore'?v.stage:'ascent';if(s.ep===0)s.stage='ascent';s.kills=Math.max(0,Math.min(GOAL,Math.floor(Number(v.kills)||0)));s.serial=Math.max(0,Math.floor(Number(v.serial)||0));s.counted=Array.isArray(v.counted)?v.counted.filter(x=>typeof x==='string').slice(-160):[];s.seed=(Number(v.seed)>>>0)||0;s.checkpoint=v.checkpoint&&Number.isFinite(v.checkpoint.x)&&Number.isFinite(v.checkpoint.y)?{x:+v.checkpoint.x,y:+v.checkpoint.y}:null;s.cleared=Array.isArray(v.cleared)?v.cleared.filter(Number.isInteger).slice(0,64):[];s.read=Array.isArray(v.read)?v.read.filter(x=>typeof x==='string').slice(0,256):[];s.chests=Array.isArray(v.chests)?v.chests.filter(x=>typeof x==='string').slice(-512):[];s.started=v.started===true;s.active=v.active===true;s.done=v.done===true;s.returnTo=v.returnTo&&typeof v.returnTo.zone==='string'?{zone:v.returnTo.zone,layer:v.returnTo.layer==='STORY'?'STORY':'DREAM'}:null;s.flashSaved=typeof v.flashSaved==='boolean'?v.flashSaved:null;s.deaths=Math.max(0,Math.floor(Number(v.deaths)||0));
  // R115: 구역 진행. 구역이 생긴 장의 예전 저장(생존·미로·상승)은 지우지 않고 그 장의 구역으로 옮긴다.
  s.zone=typeof v.zone==='string'?v.zone:null;s.zoneDone=Array.isArray(v.zoneDone)?v.zoneDone.filter(x=>typeof x==='string').slice(-256):[];s.zoneRead=Array.isArray(v.zoneRead)?v.zoneRead.filter(x=>typeof x==='string').slice(-512):[];
  try{s.zoneSolve=v.zoneSolve&&typeof v.zoneSolve==='object'?JSON.parse(JSON.stringify(v.zoneSolve)):{};}catch{s.zoneSolve={};}
  const zl=zonesOf(s.ep);if(zl){if(!zl.some(z=>z.id===s.zone)){const m=ZN().migrate(EP[s.ep].key,s.stage);if(s.zone!==m){s.zone=m;s.kills=0;s.checkpoint=null;s.migratedR115=v.stage||true;}}s.stage=ZN().stageOf(zoneOf(s.zone));}else{const e=epOfZone(s.zone);if(e<0)s.zone=null;else{s.ep=e;s.stage=ZN().stageOf(zoneOf(s.zone));}}
  return s;}

 // ---- seeded random -------------------------------------------------------------------------
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};

 // ---- layouts --------------------------------------------------------------------------------
 // Same contract as the native R82 refuge: floor cells + boundary walls + nodes.
 let versionTag=null;
 function surfaceArt(ep){const atlas=StoryArtR74.atlases.materials,style=atlas.styles[ep.style]||atlas.styles.garden;return{path:atlas.path,width:atlas.width,height:atlas.height,sha256:atlas.sha256,floorRect:[...style.floorRect],wallRect:[...style.wallRect],tileWorld:4.5,r55PhysicalUV:true,r74Generated:true,theme:ep.style,r81Environment:ep.style,r81Palette:{floor:liftR107(ep.tint[1],.68),wall:liftR107(ep.tint[0],.5),cap:liftR107(ep.tint[1],.42),edge:0x111114}};}
 // R107: the episode tints were 15-40% grey; multiplied by the floor texture and the dream filter the stages read near black.
 // Lift toward light grey keeping each episode's hue (story floors sit near 75%).
 function liftR107(c,k){const r=c>>16&255,g=c>>8&255,b=c&255,f=v=>Math.round(v+(214-v)*k);return f(r)<<16|f(g)<<8|f(b);}
 function build(id,ep,cells,{nodes=[],edges=[],entry,bounds,wallHeight=2.7,extra={}}){
  const key=(x,y)=>x+':'+y,has=(x,y)=>cells.has(key(x,y));
  const floorCells=[...cells].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  const floorRects=[];{const W=bounds[2],H=bounds[3];let active=new Map();for(let y=0;y<H;y++){const row=new Map();let x=0;while(x<W){if(!has(x,y)){x++;continue;}const s=x;while(has(x,y))x++;const k=s+':'+x,old=active.get(k);if(old&&old.y+old.depth===y){old.depth++;row.set(k,old);}else{const r={x:s,y,width:x-s,depth:1};floorRects.push(r);row.set(k,r);}}active=row;}}
  const seg=new Map(),edge=(axis,fixed,at)=>{const k=axis+':'+fixed;if(!seg.has(k))seg.set(k,[]);seg.get(k).push(at);};
  for(const[x,y]of floorCells){if(!has(x,y-1))edge('h',y,x);if(!has(x,y+1))edge('h',y+1,x);if(!has(x-1,y))edge('v',x,y);if(!has(x+1,y))edge('v',x+1,y);}
  const walls=[];for(const[k,list]of seg){const[axis,n]=k.split(':'),fixed=Number(n),a=[...new Set(list)].sort((p,q)=>p-q);for(let i=0;i<a.length;){const s=a[i++];let e=s+1;while(a[i]===e){e++;i++;}const h=axis==='h';walls.push({id:id+'-wall:'+walls.length,x:h?(s+e)/2:fixed,y:h?fixed:(s+e)/2,width:h?e-s:.24,depth:h?.24:e-s,height:wallHeight,annex:true,samongR103:true});}}
  const [bx0,by0,bx1,by1]=bounds;
  return{version:versionTag||'storyworld-exploration-10-clear-connector-1p40',id,type:'r103-samong',rotation:0,mirrored:false,bounds:[...bounds],chunkSize:10,chunkColumns:Math.ceil((bx1-bx0)/10),chunkRows:Math.ceil((by1-by0)/10),walls,centralArena:null,branches:[],
   surface:{id:'original-ground',height:0,multilevelCombat:false,art:surfaceArt(ep)},expanded:true,floorCells,floorRects,nodes,edges,coreFloorRects:[],coreReshaped:true,connectorFloorRects:[],backdropRects:[],fogRects:[],chunkMinX:bx0,chunkMinY:by0,
   entry,entrance:{x:entry.x,y:entry.y},renderEnvelope:{u0:bx0-by1-4,u1:bx1-by0+4,v0:bx0+by0-4,v1:bx1+by1+4},regional55:null,regional59:null,scenery59:null,mazeR73:null,voidCover:{tint:'#0b0a0d',opacity:1},
   worldR74:{version:1,mode:ep.style==='garden'?'outdoor':'indoor',style:{forge:'forge-machine',clinical:'clinical-ward',domestic:'domestic-hall',garden:'stone-garden'}[ep.style]||'stone-garden',rooms:[],doors:[],corridorWidth:3,seed:0,nativeCorePreserved:true,wallCount:walls.length,floorCount:floorCells.length,samongR103:true},worldR75:null,worldR78:null,worldWardR81:null,refugeR82:null,samongR103:{...extra}};
 }
 function survivalLayout(i,ep){const id=sid(i,'survival'),cells=new Set(),r=rng(hash(id)),cx=22,cy=22;
  for(let y=1;y<44;y++)for(let x=1;x<44;x++){const dx=(x+.5-cx)/20,dy=(y+.5-cy)/20;if(dx*dx+dy*dy<=1)cells.add(x+':'+y);}
  // Pillars of the arena: cover without dead ends (each 2x2, kept off the centre and the entry).
  const pillars=[];for(let k=0;k<9;k++){const a=k*2.399963+r()*.4,d=8+r()*8,px=Math.round(cx+Math.cos(a)*d),py=Math.round(cy+Math.sin(a)*d);if(Math.hypot(px-cx,py-(cy+12))<5)continue;pillars.push([px,py]);for(let y=py;y<py+2;y++)for(let x=px;x<px+2;x++)cells.delete(x+':'+y);}
  const nodes=[{id:0,x:cx+.5,y:cy+12.5,radius:3,shape:'round'},{id:1,x:cx+.5,y:cy+.5,radius:6,shape:'round'}];
  return build(id,ep,cells,{nodes,edges:[[0,1,4]],entry:{x:cx+.5,y:cy+12.5,node:0},bounds:[0,0,45,45],extra:{kind:'survival',centre:{x:cx+.5,y:cy+.5},pillars}});}
 function mazeLayout(i,ep,seed){const id=sid(i,'maze'),C=Math.min(11,8+Math.floor(i/4)),R=C,SZ=5,r=rng(seed||hash(id)),open=new Set(),k=(a,b)=>a+','+b;
  const nb=(x,y)=>[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>a>=0&&b>=0&&a<C&&b<R);
  const seen=new Set([k(0,R-1)]),stack=[[0,R-1]],link=(a,b)=>open.add(a[0]<b[0]||a[1]<b[1]?k(...a)+'|'+k(...b):k(...b)+'|'+k(...a)),linked=(a,b)=>open.has(a[0]<b[0]||a[1]<b[1]?k(...a)+'|'+k(...b):k(...b)+'|'+k(...a));
  // Growing tree (half newest, half random cell): long corridors mixed with many side branches.
  while(stack.length){const at=r()<.5?stack.length-1:Math.floor(r()*stack.length),c=stack[at],n=nb(...c).filter(p=>!seen.has(k(...p)));if(!n.length){stack.splice(at,1);continue;}const p=n[Math.floor(r()*n.length)];link(c,p);seen.add(k(...p));stack.push(p);}
  // Braid about a sixth of the dead ends so the maze has loops and ways back.
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){const deg=nb(x,y).filter(p=>linked([x,y],p)).length;if(deg===1&&r()<.18){const c=nb(x,y).filter(p=>!linked([x,y],p));if(c.length)link([x,y],c[Math.floor(r()*c.length)]);}}
  const dist=new Map([[k(0,R-1),0]]),q=[[0,R-1]],prev=new Map();while(q.length){const c=q.shift();for(const p of nb(...c))if(linked(c,p)&&!dist.has(k(...p))){dist.set(k(...p),dist.get(k(...c))+1);prev.set(k(...p),c);q.push(p);}}
  let exit=[0,R-1],best=-1;for(const[key,d]of dist){const[a,b]=key.split(',').map(Number);if(d>best&&(a>C/2||b<R/2)){best=d;exit=[a,b];}}
  const path=[];for(let c=exit;c;c=prev.get(k(...c)))path.unshift(c);
  const cells=new Set(),cell=(x,y)=>{for(let b=0;b<3;b++)for(let a=0;a<3;a++)cells.add((x*SZ+1+a)+':'+(y*SZ+1+b));};
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){cell(x,y);if(x+1<C&&linked([x,y],[x+1,y]))for(let b=0;b<3;b++)for(let a=0;a<2;a++)cells.add((x*SZ+4+a)+':'+(y*SZ+1+b));if(y+1<R&&linked([x,y],[x,y+1]))for(let b=0;b<2;b++)for(let a=0;a<3;a++)cells.add((x*SZ+1+a)+':'+(y*SZ+4+b));}
  const centre=([x,y])=>({x:x*SZ+2.5,y:y*SZ+2.5}),nodes=[];for(let y=0;y<R;y++)for(let x=0;x<C;x++){const deg=nb(x,y).filter(p=>linked([x,y],p)).length;nodes.push({id:nodes.length,...centre([x,y]),radius:1.5,shape:'square',width:3,depth:3,cell:[x,y],degree:deg});}
  const deadEnds=nodes.filter(n=>n.degree===1&&k(...n.cell)!==k(0,R-1)&&k(...n.cell)!==k(...exit));
  const save=path[Math.floor(path.length/2)],onPath=new Set(path.map(c=>k(...c))),pool=deadEnds.length>=3?deadEnds:[...deadEnds,...nodes.filter(n=>!onPath.has(k(...n.cell))&&!deadEnds.includes(n))],chests=pool.sort((a,b)=>(hash(id+a.id)%997)-(hash(id+b.id)%997)).slice(0,3).map(n=>({x:n.x,y:n.y}));
  return build(id,ep,cells,{nodes,edges:[],entry:{...centre([0,R-1]),node:(R-1)*C},bounds:[0,0,C*SZ+1,R*SZ+1],extra:{kind:'maze',exit:centre(exit),save:centre(save),pathLength:path.length,cols:C,rows:R,chests,seed}});}
 function ascentLayout(i,ep){const id=sid(i,'ascent'),cells=new Set(),fill=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)cells.add(x+':'+y);};
  // The boss dais sits in the native 30-grid (boss volleys clamp to 3..27). The climb
  // starts at the bottom of the screen (large x+y) and zigzags upward toward it.
  const dais={x:15,y:15};for(let y=6;y<25;y++)for(let x=6;x<25;x++)if(Math.hypot(x+.5-15,y+.5-15)<9.4)cells.add(x+':'+y);
  const L=[[44,44],[36,44],[36,36],[28,36],[28,28],[28,22],[22,22]],landings=[];
  for(let n=0;n<L.length;n++){const[x,y]=L[n];if(n<L.length-1)fill(x-3,y-3,x+3,y+3);landings.push({x:x+.5,y:y+.5});if(n>0){const[a,b]=L[n-1];if(a!==x)fill(Math.min(a,x),y-1,Math.max(a,x)+1,y+2);else if(b!==y)fill(x-1,Math.min(b,y),x+2,Math.max(b,y)+1);}}
  fill(21,21,30,24);fill(21,21,24,30);
  const nodes=landings.map((p,n)=>({id:n,...p,radius:3,shape:'square',width:6,depth:6}));nodes.push({id:nodes.length,...dais,radius:9,shape:'round'});
  return build(id,ep,cells,{nodes,edges:nodes.slice(1).map((n,j)=>[j,j+1,3]),entry:{x:44.5,y:45.5,node:0},bounds:[0,0,49,49],wallHeight:3.4,extra:{kind:'ascent',dais,landings:landings.slice(1,-1)}});}
 const layouts=new Map();
 function layoutFor(i,stage,zid=null){const z=zoneOf(zid);if(z){if(!layouts.has(z.id)){layouts.set(z.id,ZN().layout(z,EP[i],{build,rng,hash}));while(layouts.size>6)layouts.delete(layouts.keys().next().value);}return layouts.get(z.id);}const id=sid(i,stage),seed=stage==='maze'?(S.ep===i&&S.seed?S.seed:hash(id)):0,k=id+':'+seed;if(!layouts.has(k)){const ep=EP[i];let L=null;
  // R105: 서사 청사진이 있으면 그 지형을 쓴다(없으면 R103 기본 지형).
  try{L=window.__STORYWORLD_SAMONG_MAPS_R105__?.layoutFor?.(i,stage,ep,seed,{build,sid,rng,hash,survivalLayout,mazeLayout,ascentLayout})||null;}catch(e){fail(e);L=null;}
  layouts.set(k,L||(stage==='survival'?survivalLayout(i,ep):stage==='maze'?mazeLayout(i,ep,seed):ascentLayout(i,ep)));while(layouts.size>12)layouts.delete(layouts.keys().next().value);}return layouts.get(k);}

 // ---- regions ------------------------------------------------------------------------------
 const donorProfiles=new Map(),donorFail=new Set();let makeNative=null;
 function donor([region,nativeId]){const k=region+'|'+nativeId;if(donorProfiles.has(k))return donorProfiles.get(k);let d=null;try{const r=makeNative(region,'DREAM'),e=r.enemies.find(e=>e.nativeId===nativeId)||r.enemies.find(e=>String(e.id).includes(nativeId));d=e?.profile||null;}catch(e){fail(e);}if(!d)donorFail.add(k);donorProfiles.set(k,d);return d;}
 function profilePaths(d){const out=new Set();if(!d)return out;if(d.path)out.add(d.path);for(const f of Object.values(d.frames||{}))if(f?.path)out.add(f.path);for(const f of Object.values(d.actions||{}))if(f?.path)out.add(f.path);return out;}
 // Donor images join the host's preload only while a stage is being entered.
 function stagePaths(i,stage,zid=null){const ep=EP[i],paths=new Set(),z=zoneOf(zid);const rows=z?[...(z.mobs||ep.mobs||[]),...(z.kind==='confront'?[(z.boss||ep.boss).donor]:[]),...(z.lead?[z.lead.donor]:[]),...(z.patrol?[z.patrol.donor]:[]),...(z.landings?.length?ep.guard||[]:[]),...[z.wander?.mobs,...(z.clues||[]).map(c=>c.mobs)].filter(Boolean).flat()]:stage==='ascent'?[ep.boss.donor,...(ep.guard||[])]:(ep.mobs||[]);for(const row of rows)for(const path of profilePaths(donor(row))){try{register(path,'image','R103 사몽 · '+ep.title);}catch(e){}paths.add(path);}return[...paths];}

 // ---- rooms -------------------------------------------------------------------------------
 function buildRoom(i,stage,zid=null){const ep=EP[i],id=ep.host,l='DREAM',p={ep:i,stage},template=makeNative(id,l),layout=layoutFor(i,stage,zid),z=zoneOf(zid);
  const r={...template,id,layer:l,props:[],enemies:[],kills:0,engaged:false,cleared:false,finalizing:false,encounterStage:'samongR103',activeEncounter:null,fieldWaves6:[],fieldWaveIndex6:0,fieldWaveTotal6:0,fieldWaveCleared6:true,storyRosterIds6:[],defeatedActorIds:new Set(),exploration:layout,explorationGroups:[],worldR74:1,r75Decorated:true,worldCombatR78:true,worldEnvironmentR81:true,r99Trees:true,r40RosterApplied:true,persona:{...(template.persona||{}),phase:'none'},samongR103:{ep:p.ep,stage:p.stage,zone:z?z.id:null,portal:null,spawnAt:0,alive:0,bossUp:false,born:0}};
  const x=layout.samongR103;r.objective={x:(x.exit||x.centre||x.dais||layout.entry).x,y:(x.exit||x.centre||x.dais||layout.entry).y,path:regionById[ep.host]?.objectiveArt||template.objective?.path};
  const key=z?z.id:sid(i,stage);r.samongR103.key=key;
  if(p.stage==='maze'){if(x.save)r.props.push(prop('save',x.save,{label:'기억의 등불 · 저장'}));x.chests.forEach((c,n)=>r.props.push(chest(key+':chest:'+n,c)));}
  if(p.stage==='ascent'){// Braziers line the climb so the way up reads at a glance.
   x.landings.forEach((q,n)=>{for(const s of[-1,1])r.props.push(prop('lamp',{x:q.x+s*2.4,y:q.y-s*2.4},{label:''}));});x.landings.forEach((q,n)=>{if(n===1)r.props.push(chest(key+':chest:0',{x:q.x+1.6,y:q.y-1.6}));});}
  if(z){try{ZN().dress(r,z,{prop,chest,key});}catch(e){fail(e);}const list=zonesOf(i),n=list.indexOf(z),e0=layout.entry;// 이전 구역으로 돌아가는 문(첫 구역에는 없다).
   if(n>0){const at=[[1.6,0],[0,1.6],[-1.6,0],[0,-1.6]].map(([dx,dy])=>({x:e0.x+dx,y:e0.y+dy})).find(q=>layout.floorCells.some(([cx,cy])=>cx===Math.floor(q.x)&&cy===Math.floor(q.y)))||e0;r.props.push(prop('back',at,{label:'이전 구역 · '+list[n-1].title,r74Prop:'obelisk'}));}}
  else try{window.__STORYWORLD_SAMONG_MAPS_R105__?.dress?.(r,i,stage,ep,{prop,chest,key});}catch(e){fail(e);}
  return r;}
 function chest(id,at){const G=window.__STORYWORLD_GROWTH_R103__;return G?.chestProp?G.chestProp(id,at,{samongR103:'chest',chest:id}):prop('chest',at,{chest:id});}
 function prop(kind,at,extra={}){return{id:'r103:'+kind+':'+Math.round(at.x*10)+':'+Math.round(at.y*10),x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:kind,r74Prop:kind==='chest'?'crate':kind==='save'||kind==='lamp'?'brazier':'obelisk',...extra};}

 // ---- spawning ------------------------------------------------------------------------------
 function spawn(row,at,{boss=false,name,hpScale=1,tag='m',aggro=0}={}){const d=donor(row);if(!d)return null;const id='sm103:'+room.samongR103.key+':'+tag+':'+(++S.serial);let e;try{e=actor3(d,id,at.x,at.y,boss,'DREAM',regionById[room.id]);}catch(err){fail(err);return null;}if(!e)return null;if(!e.nativeId)e.nativeId=row[1];
  if(name)e.name=name;e.samongR103=room.samongR103.key;e.spawnState='active';e.homeX=at.x;e.homeY=at.y;e.explorationLeash=null;e.graceUntil=time+.6;e.cd=Math.max(.6,e.cd||1);
  if(aggro&&e.combatProfile)e.combatProfile={...e.combatProfile,aggro};
  if(hpScale!==1&&Number.isFinite(e.maxHp)){e.maxHp=Math.max(1,Math.round(e.maxHp*hpScale));e.hp=e.maxHp;}
  room.enemies.push(e);return e;}
 const living=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
 function floorAt(x,y,rad=.45){return!blocked(x,y,rad,room);}
 function ringPoint(c,min,max,tries=24){for(let t=0;t<tries;t++){const a=Math.random()*Math.PI*2,d=min+Math.random()*(max-min),q={x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d};if(floorAt(q.x,q.y))return q;}return null;}
 function caps(){const low=!!settings.lowFx,mobile=matchMedia('(pointer:coarse)').matches;return{survival:low||mobile?36:56,maze:low||mobile?12:18};}
 let R106_DT=0;
 function tickSurvival(dt){R106_DT=dt;const r=room,x=r.samongR103,ep=EP[x.ep];if(x.portal)return;
  if(S.kills>=GOAL){// Goal reached: no new spawns; the rest scatter and the portal opens.
   if(!x.endAt){x.endAt=time+5;toast('누적 '+GOAL+' 처치 · 새 적이 더 나오지 않습니다. 남은 형상이 흩어지면 문이 열립니다.',4);}
   for(const e of r.enemies)if(living(e)&&e.samongR103){e.fadeR103=(e.fadeR103||0)+dt;if(e.fadeR103>1.2){e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.deadAt=time;e.samongR103Silent=true;}}
   r.enemies=r.enemies.filter(e=>living(e)||time-(e.deadAt||0)<1.5);
   if(time>=x.endAt||!r.enemies.some(living))openPortal(r,r.exploration.samongR103.centre,'미로로 내려가는 문');return;}
  attackTokens();
  const alive=r.enemies.filter(living).length,cap=caps().survival,need=GOAL-S.kills;if(time<x.spawnAt||alive>=Math.min(cap,need))return;
  x.spawnAt=time+.3;const batch=Math.min(6,cap-alive,need-alive);for(let n=0;n<batch;n++){const q=ringPoint(player,9,15);if(!q)break;const elite=(S.serial+n)%13===12,e=spawn(ep.mobs[S.serial%ep.mobs.length],q,{name:ep.mobName,tag:'s',aggro:60});if(e)swarm(e,elite);}}
 // R115: 구역 전투 — 구역마다 정한 처치 수·단서·끝의 문. 666 누적은 문턱에만 남는다.
 const nextTitle=z=>{const list=zonesOf(EP.findIndex((e,i)=>zonesOf(i)?.includes(z)))||[],n=list.indexOf(z);return n>=0&&n<list.length-1?'다음 구역 · '+list[n+1].title:'다음 기억으로 향하는 문';};
 const zoneMobs=(z,ep)=>z?.mobs||ep.mobs||EP[1].mobs;
 function tickZoneCombat(dt){R106_DT=dt;const r=room,x=r.samongR103,ep=EP[x.ep],z=zoneOf(x.zone),g=z.goal||{},L=r.exploration.samongR103;
  if(g.hold&&!x.portal&&player.hp>0)x.holdT=(x.holdT||0)+dt;
  const fin=ZN().done(r,z),again=S.zoneDone.includes(z.id);
  if(fin&&!x.portal){if(!x.endAt){x.endAt=time+(g.reach||again?0:3);if(!again)toast(g.reach?'목표 달성 · 끝의 문이 열립니다.':'목표 달성 · 남은 형상이 흩어지면 문이 열립니다.',3.5);}
   if(!g.reach)for(const e of r.enemies)if(living(e)&&e.samongSurvival){e.fadeR103=(e.fadeR103||0)+dt;if(e.fadeR103>1.2){e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.deadAt=time;e.samongR103Silent=true;}}
   if(time>=x.endAt||!r.enemies.some(living))openPortal(r,L.exit,nextTitle(z));}
  r.enemies=r.enemies.filter(e=>living(e)||time-(e.deadAt||0)<1.5);
  if(again||(fin&&!g.reach)||z.noMobs)return;attackTokens();
  if(z.mode==='D'){defenseR162(dt,r,x,z,ep,L);return;}
  const B=z.mode==='B';if(B)midbossR162(r,x,z,ep);
  const alive=r.enemies.filter(living).length,cap=B?caps().survival:Math.round(caps().survival*.6);if(time<x.spawnAt||alive>=cap)return;
  x.spawnAt=time+(B?.3:.45);const mobs=zoneMobs(z,ep);for(let n=0;n<Math.min(B?6:4,cap-alive);n++){const q=B?ringPoint(player,9,15):ringPoint(player,8,14);if(!q)break;const elite=(S.serial+n)%13===12,e=spawn(mobs[S.serial%mobs.length],q,{name:z.mobName||ep.mobName,tag:'s',aggro:60});if(e)swarm(e,elite);}}
 // R162 B(뱀서류 광장): 처치 111마다 중간보스 1마리(모두 6마리) — 그 구역 몹 하나를 키운다(체력 영웅 공격력 × 60, 몸 1.7배).
 function midbossR162(r,x,z,ep){x.r162Mid=x.r162Mid||0;if(x.r162Mid>=6||S.kills<(x.r162Mid+1)*111)return;const q=ringPoint(player,7,11);if(!q)return;const mobs=zoneMobs(z,ep),e=spawn(mobs[S.serial%mobs.length],q,{name:z.mobName||ep.mobName,tag:'mb',aggro:60});if(!e)return;swarm(e,true);
  let atk=40;try{atk=Math.max(1,Number(attackPower())||40);}catch{}e.midboss=true;e.samongMidR162=true;e.maxHp=e.hp=Math.round(atk*60);e.defScale=(e.defScale||1)*1.4;e.speed=(e.speed||1)*.55;e.damage=(e.damage||8)*1.8;e.name='중간보스 · '+(z.mobName||ep.mobName);x.r162Mid++;
  try{window.__STORYWORLD_PIXELFX_R163__?.play?.('hands-blood',q.x,q.y,{k:1.0});}catch(_){}
  try{toast('중간보스 '+x.r162Mid+' / 6 · '+e.name,3);sound('boss');}catch(_){}}
 // R162 D(정화의 코어): 세로 길 위쪽 끝에서 쏟아져 내려오는 666마리. 영웅 가까이(3.2칸)가 아니면 코어 쪽으로 곧장 내려오고,
 //  코어에 닿으면 사라지며 코어 체력을 깎는다(짙은 형상 66, 보통 6). 코어 777 이 모두 깎이면 그 구역을 처음부터(처치 0, 적 비움).
 const CORE_R162=777;// 사용자 2026-10-31 "우리편은 다 7 77 777, 코어체력도 777" — 적이 깎는 양은 적 쪽 숫자(보통 6, 짙은 형상 66)
 function defenseR162(dt,r,x,z,ep,L){const core=L.core||L.exit;if(!core)return;const c=x.r162Core||(x.r162Core={hp:CORE_R162,max:CORE_R162,leaks:0});
  const cells=x.r162Top||(x.r162Top=(()=>{const f=r.exploration.floorCells||[];let m=1e9;for(const[a,b]of f)m=Math.min(m,a+b);return f.filter(([a,b])=>a+b<=m+5).map(([a,b])=>({x:a+.5,y:b+.5}));})());
  const alive=r.enemies.filter(e=>living(e)&&e.samongSurvival).length,cap=caps().survival;
  if(time>=x.spawnAt&&alive<cap&&cells.length){x.spawnAt=time+.3;const mobs=zoneMobs(z,ep);for(let n=0;n<Math.min(6,cap-alive);n++){const q=cells[Math.floor(Math.random()*cells.length)];if(!floorAt(q.x,q.y))continue;const elite=(S.serial+n)%13===12,e=spawn(mobs[S.serial%mobs.length],q,{name:z.mobName||ep.mobName,tag:'d',aggro:4});if(e){swarm(e,elite);e.r162Lane=true;}}}
  for(const e of r.enemies){if(!living(e)||!e.r162Lane)continue;const dc=Math.hypot(core.x-e.x,core.y-e.y);
   if(dc<1.4){c.hp-=e.samongElite?66:6;c.leaks++;e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.deadAt=time;e.samongR103Silent=true;try{window.__STORYWORLD_SAMONG_PLAY_R162__?.coreHit?.(core,c);}catch(_){}continue;}
   if(Math.hypot(player.x-e.x,player.y-e.y)<3.2)continue;const sp=Math.max(2.6,(e.speed||1)*1.05)*dt,nx=e.x+(core.x-e.x)/dc*sp,ny=e.y+(core.y-e.y)/dc*sp;
   if(!blocked(nx,ny,.25,r)){e.x=nx;e.y=ny;}else if(!blocked(nx,e.y,.25,r))e.x=nx;else if(!blocked(e.x,ny,.25,r))e.y=ny;e.homeX=e.x;e.homeY=e.y;e.moving=true;e.moveVX150=(core.x-e.x)/dc;e.moveVY150=(core.y-e.y)/dc;}
  if(c.hp<=0){for(const e of r.enemies)if(living(e)&&e.samongSurvival){e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.deadAt=time;e.samongR103Silent=true;}
   S.kills=0;c.hp=c.max;c.fails=(c.fails||0)+1;x.spawnAt=time+3;const at=L.entry||core;player.x=at.x;player.y=at.y;try{cam={x:player.x,y:player.y};}catch(_){}
   try{toast('정화의 코어가 무너졌습니다 · 처음부터 다시 막아 내세요.',4);}catch(_){}}}
 function tickExplore(dt){const r=room,x=r.samongR103,z=zoneOf(x.zone),L=r.exploration.samongR103;if(!x.portal&&ZN().done(r,z))openPortal(r,L.exit,nextTitle(z));r.enemies=r.enemies.filter(e=>living(e)||time-(e.deadAt||0)<1.5);}
 const zapi={spawn:(row,at,o)=>spawn(row,at,o),sight:(a,b)=>clearPath3(a,b,.2,room),boss:()=>room.enemies.find(e=>e.id===room.samongR103.boss)||null,
  record:p=>{try{return window.__STORYWORLD_SAMONG_MAPS_R105__?.use?.(p)===true;}catch(e){fail(e);return false;}},
  burst:(n,mobs,name,at)=>{const ep=EP[room.samongR103.ep],list=mobs||ep.mobs;for(let k=0;k<n;k++){const q=ringPoint(at,3,6);if(!q)continue;const e=spawn(list[(S.serial+k)%list.length],q,{name:name||ep.mobName,hpScale:.6,tag:'c',aggro:12});if(e)e.damage=(e.damage||8)*.7;}},
  wander:cfg=>{const r=room,x=r.samongR103,ep=EP[x.ep];if(!x.wanderAt){x.wanderAt=time+cfg.every;return;}const alive=r.enemies.filter(e=>living(e)&&!e.samongPatrolR115).length;if(time<x.wanderAt||alive>=cfg.cap)return;x.wanderAt=time+cfg.every;const q=ringPoint(player,9,16);if(!q)return;const list=cfg.mobs||ep.mobs,e=spawn(list[S.serial%list.length],q,{name:cfg.mobName||ep.mobName,hpScale:.6,tag:'w',aggro:7});if(e)e.damage=(e.damage||8)*.7;},
  addProp:p=>room.props.push(p),removeProp:p=>{room.props=room.props.filter(q=>q!==p);},clear:()=>{if(here()&&!room.samongR103.portal)stageCleared(room);}};
 // Survival mobs are a melee swarm: they close in, die in one or two honest hits (scaled to the hero, not the zone) and only a few may wind up at once.
 function swarm(e,elite){let atk=40;try{atk=Math.max(1,Number(attackPower())||40);}catch{}e.ai='melee';e.type='melee';e.rangedWindup=0;e.samongSurvival=true;e.speed=(e.speed||1)*(elite?1.5:1.9);e.samongFastR106=true;e.damage=(e.damage||8)*(elite?.9:.6);e.maxHp=e.hp=Math.max(1,Math.round(atk*(elite?5.5:1.15)));if(elite){e.samongElite=true;e.defScale=(e.defScale||1)*1.22;e.name=e.name+' · 짙은 형상';}}
 function attackTokens(){let busy=0;const ready=[];for(const e of room.enemies){if(!living(e)||!e.samongSurvival)continue;if((e.attack&&!e.attack.committed)||e.rangedWindup>0)busy++;else if((e.cd||0)<=.2)ready.push(e);}ready.sort((a,b)=>distance(a,player)-distance(b,player));for(const e of ready.slice(Math.max(0,6-busy)))e.cd=Math.max(e.cd||0,.12+Math.random()*.2);
  // R106: 생존 잡몹 공격 속도 1.6배 — 다음 공격까지의 대기만 줄인다(공격 예고 동작은 그대로).
  const dt=typeof R106_DT==='number'?R106_DT:0;if(dt>0)for(const e of room.enemies)if(living(e)&&e.samongSurvival&&(e.cd||0)>0&&!(e.attack&&!e.attack.committed))e.cd=Math.max(0,e.cd-dt*.6);}
 function tickMaze(dt){const r=room,x=r.samongR103,ep=EP[x.ep],L=r.exploration.samongR103,zm=zoneOf(x.zone);
  if(!x.portal)openPortal(r,L.exit,zm?nextTitle(zm):'미로의 출구');
  // Bounded periodic spawns at junctions far from the player, never near the exit or the lamp.
  const alive=r.enemies.filter(living);for(const e of alive){if(e.samongPatrolR115)continue;for(const safe of [L.exit,L.save]){if(safe&&Math.hypot(e.x-safe.x,e.y-safe.y)<3.2){const a=Math.atan2(e.y-safe.y,e.x-safe.x),q={x:safe.x+Math.cos(a)*3.3,y:safe.y+Math.sin(a)*3.3};if(floorAt(q.x,q.y,.3)){e.x=q.x;e.y=q.y;}else{e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.samongR103Silent=true;}}}}
  r.enemies=r.enemies.filter(e=>living(e)||time-(e.deadAt||0)<1.5);
  if(time<x.spawnAt||alive.filter(e=>!e.samongPatrolR115).length>=(zm?.mobCap??caps().maze))return;x.spawnAt=time+(zm?.mobEvery??4);
  const sites=r.exploration.nodes.filter(n=>{const d=Math.hypot(n.x-player.x,n.y-player.y);return d>8&&d<22&&Math.hypot(n.x-L.exit.x,n.y-L.exit.y)>4&&(!L.save||Math.hypot(n.x-L.save.x,n.y-L.save.y)>4);});
  for(let n=0;n<2&&sites.length;n++){const s=sites.splice(Math.floor(Math.random()*sites.length),1)[0];const ml=zoneMobs(zm,ep),e=spawn(zm?ml[S.serial%ml.length]:ep.mobs[S.serial%ep.mobs.length],s,{name:zm?.mobName||ep.mobName,hpScale:.6,tag:'z',aggro:9.5});if(e){e.damage=(e.damage||8)*.8;e.speed=(e.speed||1)*1.25;}}}
 function tickAscent(dt){const r=room,x=r.samongR103,ep=EP[x.ep],L=r.exploration.samongR103,z=zoneOf(x.zone),bd=z?.boss||ep.boss;
  if(z&&S.zoneDone.includes(z.id)){if(!x.portal)openPortal(r,L.dais,nextTitle(z));return;}
  if(!x.born){x.born=1;for(const q of L.landings)for(let n=0;n<2;n++){const g=ep.guard?.[n%ep.guard.length];if(g)spawn(g,{x:q.x+(n?1.2:-1.2),y:q.y+(n?-.6:.6)},{tag:'g',hpScale:.8,aggro:8});}
   const b=spawn(bd.donor,L.dais,{boss:true,name:bd.name,tag:'b'});if(b){b.spawnState='hidden';b.samongBoss=true;b.patternsR103=R162P(bd.patterns);x.boss=b.id;}}
  const b=r.enemies.find(e=>e.id===x.boss);
  if(!x.bossUp&&b&&Math.hypot(player.x-L.dais.x,player.y-L.dais.y)<10.5){x.bossUp=true;r.engaged=true;b.spawnState='active';b.cd=1.2;b.rest=.8;b.phaseAge=0;b.phaseStage='active';player.invincible=Math.max(player.invincible,.8);player.invReason='전투 진입';try{sound('boss');}catch(e){}const sc=z?zoneScenes(z,[z.bossCue].filter(Boolean),'boss'):scenes(ep,'boss');if(sc.length)playScenes(sc,()=>banner103(bd.name,z?.solve?'대면':'보스'));else banner103(bd.name,z?.solve?'대면':'보스');}
  if(x.bossUp&&b&&b.hp>0)bossPatterns(b,dt);
  if(x.bossUp&&(!b||b.hp<=0||b.deadRecorded)&&!x.portal&&!z?.solve){r.engaged=false;stageCleared(r);}}
 // Four readable pattern families (예고 표시 → 판정). Damage scales from the actor's own value.
 function bossPatterns(b,dt){const x=room.samongR103;x.patAt=x.patAt||time+3;if(time<x.patAt||!b.patternsR103?.length)return;const list=b.patternsR103,kind=list[(x.patN=(x.patN||0)+1)%list.length],dmg=(b.damage||20)*.55;x.patAt=time+(kind==='rain'?5.5:4.2);
  const field=(px,py,radius,warning,life,asset)=>{if(blocked(px,py,.1,room))return;hazards.push({id:++uid,type:'field',owner:b.id,x:px,y:py,radius,age:0,warning,life:warning+life,asset,damage:dmg,lastHit:-99,samongPattern:kind});};
  if(kind==='clones'||kind==='meteor'||kind==='tentacles'){const next=patternR162(kind,b,dmg,field);if(next)x.patAt=time+next;return;}
  if(kind==='sky'){for(let n=0;n<6;n++){const a=n*1.0472+time,d=1.5+n*.55;field(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d,1.25,1.1+n*.12,.45,VFX.cross);}fxPattern('sky',player.x,player.y);}
  else if(kind==='ground'){for(let n=0;n<10;n++){const t=(n+1)/10,px=b.x+(player.x-b.x)*t*1.25,py=b.y+(player.y-b.y)*t*1.25;field(px,py,.95,.75+n*.09,.5,VFX.burst);}fxPattern('ground',b.x,b.y);}
  else if(kind==='sides'){const n=12;for(let k=0;k<n;k++){const a=k*Math.PI*2/n,sx=player.x+Math.cos(a)*7,sy=player.y+Math.sin(a)*7;const s=makeShot(sx,sy,a+Math.PI,4.2,dmg,{owner:b.id,asset:VFX.bolt,radius:.2,life:3.2,samongPattern:'sides'});if(s)s.delay=.7;}fxPattern('sides',player.x,player.y);}
  else if(kind==='rain'){for(let n=0;n<16;n++){const px=player.x+(Math.random()*2-1)*6,py=player.y+(Math.random()*2-1)*6;field(px,py,.7,.9+Math.random()*1.4,.35,VFX.mark);}fxPattern('rain',player.x,player.y);}}
 // R162: 보스마다 기존 패턴 사이에 분신 6·운석 소환·촉수(땅 밑에서 솟는 수많은 촉수)를 끼운다(이토 준지·디아블로·다크에덴풍; 그림은 samong-play-r162.js).
 function R162P(list){const base=Array.isArray(list)&&list.length?list:['ground','sides'];if(window.__STORYWORLD_SAMONG_ZONES_R115__?.r162===false)return base;const add=['clones','meteor','tentacles'],out=[];base.forEach((k,i)=>{out.push(k);out.push(add[i%3]);});for(const k of add)if(!out.includes(k))out.push(k);return out;}
 function patternR162(kind,b,dmg,field){const play=window.__STORYWORLD_SAMONG_PLAY_R162__;
  if(kind==='clones'){const pts=[];for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.random()*.3,sx=player.x+Math.cos(a)*5,sy=player.y+Math.sin(a)*5,ex=player.x-Math.cos(a)*5,ey=player.y-Math.sin(a)*5;pts.push({sx,sy,ex,ey,a});
    for(let n=0;n<9;n++){const t=(n+.5)/9;field(sx+(ex-sx)*t,sy+(ey-sy)*t,.62,1.05+n*.035,.3,VFX.burst);}}
   try{play?.pattern?.('clones',{boss:b,pts,warn:1.05});}catch(_){}return 6.2;}
  if(kind==='meteor'){const vx=player.moveVX150||0,vy=player.moveVY150||0,pts=[];for(let k=0;k<6;k++){const px=player.x+vx*.35+(Math.random()*2-1)*3.2,py=player.y+vy*.35+(Math.random()*2-1)*3.2,w=1.2+k*.28;pts.push({x:px,y:py,warn:w});
    if(blocked(px,py,.1,room))continue;hazards.push({id:++uid,type:'field',owner:b.id,x:px,y:py,radius:1.7,age:0,warning:w,life:w+.55,asset:VFX.burst,damage:dmg*1.4,lastHit:-99,samongPattern:'meteor'});}
   try{play?.pattern?.('meteor',{boss:b,pts});}catch(_){}return 6.6;}
  if(kind==='tentacles'){const pts=[];[[1.3,6],[2.7,12],[4.1,18]].forEach(([R,n],ring)=>{for(let k=0;k<n;k++){const a=k*Math.PI*2/n+ring*.3,px=player.x+Math.cos(a)*R,py=player.y+Math.sin(a)*R,w=.8+ring*.38;pts.push({x:px,y:py,warn:w,ring});field(px,py,.72,w,.95,VFX.mark);}});
   try{play?.pattern?.('tentacles',{boss:b,pts});}catch(_){}return 6.0;}
  return 0;}
 function fxPattern(kind,x,y){try{window.__STORYWORLD_HERO_FX_R103__?.pattern?.(kind,x,y,{hostile:true});}catch(e){fail(e);}}

 // ---- portals, stage flow -------------------------------------------------------------------
 function openPortal(r,at,label){const x=r.samongR103;if(x.portal)return;x.portal={x:at.x,y:at.y,label,at:time};r.objective={...r.objective,x:at.x,y:at.y};r.props.push(prop('portal',at,{label}));try{fx('sigil',at.x,at.y,{asset:VFX.cross,size:3,life:1.2});sound('clear');}catch(e){}toast(josa(label,'이','가')+' 열렸습니다. 가까이에서 E를 누르세요.',4);saveGame(false);}
 function stageCleared(r){const x=r.samongR103,ep=EP[x.ep],z=zoneOf(x.zone);r.engaged=false;
  if(z){if(!S.zoneDone.includes(z.id))S.zoneDone.push(z.id);const list=zonesOf(x.ep),last=list.indexOf(z)===list.length-1;if(last&&!S.cleared.includes(x.ep))S.cleared.push(x.ep);
   const after=()=>{if(last&&ep.boss.final){ending();return;}const L=r.exploration.samongR103;openPortal(r,L.dais||L.exit,nextTitle(z));};const sc=zoneScenes(z,z.after||[],'after');if(sc.length)playScenes(sc,after);else after();saveGame(false);return;}
  if(!S.cleared.includes(x.ep))S.cleared.push(x.ep);
  const after=()=>{if(ep.boss.final){ending();return;}openPortal(r,r.exploration.samongR103.dais,'다음 기억으로 향하는 문');};
  const sc=scenes(ep,'after');if(sc.length)playScenes(sc,after);else after();}
 function next(){const x=room.samongR103;let ep=x.ep,stage=x.stage;const z=zoneOf(x.zone);
  if(z){// 구역 안의 문은 같은 장의 다음 구역으로, 마지막 구역의 문만 다음 장으로 간다.
   const list=zonesOf(x.ep),n=list.indexOf(z);if(!S.zoneDone.includes(z.id))S.zoneDone.push(z.id);
   const step=()=>{if(n<list.length-1){go(x.ep,null,{zone:list[n+1].id});return;}if(!S.cleared.includes(x.ep))S.cleared.push(x.ep);if(x.ep+1>=EP.length){ending();return;}enterEp(x.ep+1);};
   const sc=z.kind!=='confront'?zoneScenes(z,z.after||[],'after'):[];if(sc.length)playScenes(sc,step);else step();return;}
  if(stage==='ascent'){ep=ep+1;stage='survival';}else if(stage==='survival')stage='maze';else stage='ascent';
  if(ep>=EP.length){ending();return;}if(stage==='survival'&&zonesOf(ep)){enterEp(ep);return;}go(ep,stage);}
 function enterEp(i){const zl=zonesOf(i);return zl?go(i,null,{zone:zl[0].id}):go(i,'survival');}
 function back(){const x=room.samongR103,z=zoneOf(x.zone);if(!z)return false;const list=zonesOf(x.ep),n=list.indexOf(z);if(n<1)return false;const prev=list[n-1],L=layoutFor(x.ep,null,prev.id),q=L.samongR103.exit||L.samongR103.dais||L.entry;go(x.ep,null,{zone:prev.id,position:{x:q.x,y:q.y}});return true;}
 // 구역 원문: 처음 한 번만 보여 준다(읽은 표시는 samongR103.zoneRead).
 function zoneScenes(z,list,tag){const flag=z.id+':'+tag;if(!list.length||S.zoneRead.includes(flag))return[];S.zoneRead.push(flag);return ZN().scenesFor(list,z,tag);}
 async function go(ep,stage,{restore=false,position=null,zone:zid=null}={}){if(entering)return false;
  let z=zoneOf(zid);if(z&&!zonesOf(ep)?.includes(z))z=null;if(!z&&zonesOf(ep))z=zoneOf(ZN().migrate(EP[ep].key,stage));// 구역이 있는 장은 언제나 구역으로 들어간다.
  if(z){stage=ZN().stageOf(z);if(S.zone!==z.id||S.ep!==ep){S.kills=0;S.checkpoint=null;}S.zone=z.id;}
  else{S.zone=null;if(stage==='maze'&&!(S.ep===ep&&S.stage==='maze'&&S.seed))S.seed=hash(sid(ep,'maze')+':'+Date.now()+':'+Math.random());
  if(stage!=='maze')S.checkpoint=null;if(stage==='survival'&&!(S.ep===ep&&S.stage==='survival'))S.kills=0;}
  if(!S.active&&!stageRoom&&zone&&regionById[zone])S.returnTo={zone:regionById[zone].safe?zone:'hub',layer};
  S.ep=ep;S.stage=stage;S.started=true;const def=regionById[EP[ep].host];if(!def)return false;
  const extra=stagePaths(ep,stage,z?.id),oldPaths=def.paths;def.paths=[...new Set([...oldPaths,...extra])];
  const prev=stageRoom;stageRoom=buildRoom(ep,stage,z?.id);S.active=true;entering++;let ok=false;
  const L=stageRoom.exploration,onFloor=q=>!!q&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&L.floorCells.some(([cx,cy])=>cx===Math.floor(q.x)&&cy===Math.floor(q.y)),pick=[position,stage==='maze'&&S.checkpoint].find(onFloor)||(z&&onFloor(S.checkpoint)?S.checkpoint:null),start=pick||L.entry;// R106: 맵 크기가 바뀐 예전 저장 위치는 바닥이 아니면 입구로.
  try{ok=await enterRegion(def.id,null,{layer:'DREAM',position:{x:start.x,y:start.y},noStory:true,restore:true});}finally{entering--;def.paths=oldPaths;}
  if(!ok||room!==stageRoom){stageRoom=prev&&room===prev?prev:null;S.active=!!stageRoom;return false;}
  forceFlash(stage==='maze'||!!z?.dark);if(z)zoneIntro(z);else intro(EP[ep],stage);saveGame(false);return true;}
 function zoneIntro(z){const list=zonesOf(S.ep),n=list.indexOf(z)+1,sub=({explore:'탐색',maze:'손전등 미로',combat:'전투',confront:'대면'})[z.kind]+' · 구역 '+n+'/'+list.length,sc=zoneScenes(z,z.cue||[],'cue');if(sc.length&&!modal)playScenes(sc,()=>banner103(z.title,sub));else banner103(z.title,sub);}
 // After a load the native restore may still be entering the host map; wait for it, then
 // re-enter the stage at its start (the maze at the last lamp).
 let resumeNote=null;
 async function resumeStage(){const want={ep:S.ep,stage:S.stage,zone:S.zone};resumeNote={at:'wait',want};for(let i=0;i<150&&(loading||entering);i++)await new Promise(r=>setTimeout(r,100));if(S.active||S.ep!==want.ep||S.stage!==want.stage||layer!=='DREAM'){resumeNote={at:'skip',active:S.active,ep:S.ep,stage:S.stage,layer};return false;}resumeNote={at:'go',want};
  for(let t=0;t<3;t++){if(await go(want.ep,want.stage,{restore:true,zone:want.zone})){resumeNote={at:'done',want,try:t};return true;}resumeNote={at:'retry',t,entering,loading};await new Promise(r=>setTimeout(r,400));}return false;}
 function intro(ep,stage){const sc=scenes(ep,stage);if(sc.length&&!modal)playScenes(sc,()=>banner103(ep.title,stageLabel(stage)));else banner103(ep.title,stageLabel(stage));}
 const stageLabel=s=>s==='survival'?'생존 · 누적 '+GOAL+' 처치':s==='maze'?'손전등 미로 · 출구 찾기':'상승 · 위쪽의 보스';
 function banner103(title,sub){try{const el=document.getElementById('cutin')||null;toast(title+(sub?'\n'+sub:''),3.4);}catch(e){fail(e);}}

 // ---- narrative ----------------------------------------------------------------------------
 // Short at combat boundaries; the full sections are readable at the lamp and in the 기록장.
 function paras(key){const s=TEXT()[key];return s?s.blocks.flatMap(b=>b.paras.map(t=>({t,n:b.narrator}))):[];}
 function scene(ep,key,text,narrator,part){const k='DREAM:sm103:'+ep.key+':'+part+':'+key;return{id:ep.host,record:{title:ep.title,narrator,chapter:ep.chapter},part:'body',text,title:TEXT()[key]?.title||ep.title,narrator:narrator?'〈'+narrator+'〉':'',chapter:ep.chapter,key:k};}
 // [구간 키, 그 문단이 시작하는 원문 문자열(없으면 첫 문단, 'last'는 끝), 문단 수]
 const CUES={
  P:{a:['prelude',null,4],b:['threshold','나는 코어 바닥 아',1],z:['threshold','굳게 닫힌 문만 열',1]},
  'S-01':{s:['threshold','내가 검을 박아 그',1],m:['threshold','나는 그때마다 짧게',1],a:['S-01',null,2],b:['S-01','식탁 너머 복도에서',2],z:['S-01','식탁과 벽면을 거미',1]},
  'S-02':{s:['S-02',null,2],m:['S-02','복도 끝에서 열쇠 ',1],a:['S-02','학교 전체에 목소리',2],b:['S-02','학교 전체에 목소리',1],z:['S-02','굳게 닫혔던 철제 ',1]},
  'S-03':{s:['S-03',null,1],m:['S-03','천이 검게 죽어 갈',1],a:['S-03','억수 같던 빗소리가',1],b:['S-03','관람석 뒤편에 내걸',2],z:['S-03','관람석을 채웠던 기',1]},
  'S-04':{s:['S-04',null,2],m:['S-04','나는 빈틈없이 막힌',1],a:['S-04','식당 주인인 지연은',1],b:['S-04','나 역시 그 기괴한',3],z:['S-04','그리고 내게는 아직',1]},
  'S-05':{s:['S-05',null,2],m:['S-05','몸이 얼어붙어 근처',1],a:['S-05','스스로를 태워 죽인',2],b:['S-05','무너져 내렸던 일본',1],z:['S-05','나는 그 기만적인 ',1]},
  'S-06':{s:['NS-01',null,2],m:['NS-05','해온의 심장 너머로',1],a:['NS-08',null,1],b:['NS-08','하늘을 뒤덮으며 펼',1],z:['NS-10','환승역 구석의 어둠',2]},
  'S-07':{s:['S-07',null,2],m:['S-07','괜찮으냐고 나직이 ',2],a:['S-07','나는 그것이 사랑하',1],b:['S-07','마지막으로 날짜 없',2],z:['S-07','실패한 나 자신을 ',2]},
  RA:{s:['R-00',null,2],m:['R-02','학교 건물의 얼어붙',1],a:['R-01',null,2],b:['R-02','어둠 속에서 날아오',1],z:['R-02','last',2]},
  RB:{s:['R-03',null,2],m:['R-03','학교의 녹아내린 벽',1],a:['R-04',null,2],b:['R-04','바로 그 옆에 나란',1],z:['R-04','last',2]},
  RC:{s:['R-05',null,2],m:['R-05','저 괴물은 내 내면',1],a:['R-06',null,2],b:['R-05','그때, 수직으로 솟',2],z:['R-06','last',2]},
  RD:{s:['R-07',null,2],m:['R-07','물 위로 솟아오른 ',1],a:['R-08',null,2],b:['R-09','하늘 어딘가에서 귀',2],z:['R-09','last',2]},
  RE:{s:['R-10',null,2],m:['R-10','불안감에 바닥의 탄',1],a:['R-10','가장 앞장서서 전속',1],b:['R-10','쇄골이 부서지는 격',1],z:['R-10','last',2]},
  RF:{s:['R-11',null,2],m:['R-11','내 설명을 들은 도',1],a:['R-12',null,2],b:['R-11','물론 그 위선적인 ',1],z:['R-12','last',2]},
  RG:{s:['R-13',null,2],m:['R-13','그때, 도겸이 젖은',1],a:['R-14',null,2],b:['R-13','까마득한 암흑의 상',1],z:['R-17','last',2]},
  M:{s:['R-17','last',2],m:['M1','내가 그녀를 구하겠',1],a:['M1',null,1],b:['M1','저 사방의 모든 문',2]}
 };
 function cue(row){if(!row)return[];const[k,sub,n]=row,p=paras(k);if(!p.length)return[];let at=0;if(sub==='last')at=Math.max(0,p.length-n);else if(sub){at=p.findIndex(v=>v.t.startsWith(sub));if(at<0)at=p.findIndex(v=>v.t.includes(sub));if(at<0)return[];}return p.slice(at,at+n).map(v=>({...v,key:k}));}
 // stage → cue: survival 's', maze 'm', ascent 'a' (도착), boss 'b' (등장), after 'z' (처치 뒤).
 function scenes(ep,stage){const c=CUES[ep.key]||{},part={survival:'s',maze:'m',ascent:'a',boss:'b',after:'z'}[stage],rows=cue(c[part]);const flag=ep.key+':'+part;if(!rows.length||S.read.includes(flag))return[];S.read.push(flag);
  return[scene(ep,rows[0].key,rows.map(v=>v.t).join('\n\n'),rows[0].n,part)];}
 function line(ep,kind){}
 function showRecords(focus=null){const open=EP.filter((e,i)=>i<=S.ep||S.cleared.includes(i));let html='<button id="r103RecClose" class="close">닫기</button><div class="eyebrow">DREAM / 사몽 기록장</div><h2>열린 기억</h2><p class="small">원문 그대로입니다. 전투 중에는 짧게만 보이고, 여기서 전체를 다시 읽을 수 있습니다.</p><div class="actions">';open.forEach((e,i)=>{html+='<button data-r103rec="'+i+'">'+escapeHTML(e.title)+'</button>';});html+='</div><div id="r103RecBody" class="storyText" style="max-height:52vh;overflow:auto"></div>';openPanel(html);button('r103RecClose',()=>closePanel());
  const show=i=>{const e=EP[i],body=document.getElementById('r103RecBody');if(!body)return;body.innerHTML=e.text.map(k=>{const s=TEXT()[k];if(!s)return'';return'<h3>'+escapeHTML(s.title)+'</h3>'+s.blocks.map(b=>(b.narrator?'<p class="small muted">〈'+escapeHTML(b.narrator)+'〉</p>':'')+b.paras.map(t=>'<p>'+escapeHTML(t)+'</p>').join('')).join('');}).join('');body.scrollTop=0;};
  document.querySelectorAll('[data-r103rec]').forEach(b=>b.onclick=()=>show(+b.dataset.r103rec));show(focus??Math.min(S.ep,EP.length-1));}
 function ending(){S.done=true;saveGame(false);const keys=zonesOf(EP.length-1)?[]:['M2','M3','epilogue'],list=[];for(const k of keys){const s=TEXT()[k];if(!s)continue;for(const b of s.blocks){const t=b.paras.join('\n\n');if(t)list.push({id:room.id,record:{title:s.title,narrator:b.narrator,chapter:'제12부 — 마지막에 남은 사람'},part:'body',text:t,title:s.title,narrator:b.narrator?'〈'+b.narrator+'〉':'',chapter:'제12부 — 마지막에 남은 사람',key:'DREAM:sm103:ending:'+k+':'+list.length});}}
  if(list.length)playScenes(list,record);else record();}
 function record(){const s=TEXT().record,b=s?.blocks?.[0];// 기록 뒤에 해설이나 정답 장면을 붙이지 않습니다.
  // R176: 원문에서 진료기록 다음 '에필로그 — 심연의 검사(檢査)와 닫히는 눈'(병원장이 서하와 말을 나누고 미카엘라 병실로 가는 장면)은
  //  문서가 아니라 장면이다 — 같은 덩어리로 읽혀 기록 창 맨 아래 문단으로 묻혀 있던 것을 떼어, 기록 창을 닫으면 서사 장면으로 보여 준다(문장은 원문 그대로).
  const all=b?.paras||[],cut=all.findIndex(t=>/^에필로그\s*—/.test(String(t))),paras=cut>=0?all.slice(0,cut):all,epi=cut>=0?all.slice(cut):[];
  openPanel('<div class="eyebrow">'+escapeHTML(b?.narrator||'윤서하의 진료기록')+'</div><h2>〈'+escapeHTML(b?.narrator||'윤서하의 진료기록')+'〉</h2><div class="storyText r103-record">'+paras.map(t=>'<p>'+escapeHTML(t)+'</p>').join('')+'</div><div class="actions"><button id="r103End" class="primary">'+(epi.length>1?'다음':'닫기')+'</button></div>');
  button('r103End',()=>{closePanel(true);if(epi.length>1){const title=String(epi[0]),text=epi.slice(1).join('\n\n');playScenes([{id:room.id,record:{title,narrator:'',chapter:'에필로그'},part:'body',text,title,narrator:'',chapter:'에필로그',key:'DREAM:sm103:ending:epilogue-abyss'}],leave);}else leave();});}
 async function leave(){const to=S.returnTo&&regionById[S.returnTo.zone]?S.returnTo:{zone:'hub',layer:'DREAM'};deactivate();await enterRegion(to.zone,null,{layer:to.layer,restore:true});saveGame(false);}
 function deactivate(){S.active=false;stageRoom=null;restoreFlash();const c=overlay;if(c){c.style.display='none';}}

 // ---- flashlight (maze only) ----------------------------------------------------------------
 // R24 polygon sight is forced on inside the maze; a DOM cone overlay follows the movement
 // direction, so mobile needs no held button and no second hand.
 let overlay=null,lastDir={x:1,y:1},hudAt=0;
 // The maze beam is its own overlay; the player's R24 sight setting is left as it is.
 function forceFlash(on){if(!on){restoreFlash();return;}
  // R107: the maze uses the story-mode flashlight (R24 polygon sight, walls block light) so the floor, walls and doors read like story mode with the flashlight on.
  if(S.flashSaved===null)S.flashSaved=settings.flashlight58!==false;if(settings.flashlight58!==true){settings.flashlight58=true;window.__STORYWORLD_SIGHT24__?.refresh?.();}document.getElementById('stage')?.classList.add('flashlight-black-r58');}
 function restoreFlash(){if(S.flashSaved===null)return;const v=S.flashSaved;S.flashSaved=null;if(settings.flashlight58!==v){settings.flashlight58=v;window.__STORYWORLD_SIGHT24__?.refresh?.();}document.getElementById('stage')?.classList.toggle('flashlight-black-r58',v!==false);}
 let beamC=null;function beamR107(c,b,dp){if(!beamC?.isConnected){beamC=document.createElement('canvas');beamC.id='r107Beam';beamC.setAttribute('aria-hidden','true');beamC.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;mix-blend-mode:screen';c.parentElement.appendChild(beamC);}
 beamC.style.display='block';if(beamC.width!==c.width||beamC.height!==c.height){beamC.width=c.width;beamC.height=c.height;}return beamC;}
function ensureOverlay(){if(overlay?.isConnected)return overlay;const stage=document.getElementById('stage');if(!stage)return null;overlay=document.createElement('canvas');overlay.id='r103Flashlight';overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';stage.appendChild(overlay);return overlay;}
 function rayLen(ox,oy,a,max){const dx=Math.cos(a),dy=Math.sin(a);for(let t=.2;t<max;t+=.18)if(blocked(ox+dx*t,oy+dy*t,.02,room))return t;return max;}
 function drawFlash(){const want=here()&&(room.samongR103.stage==='maze'||!!zoneOf(room.samongR103.zone)?.dark)&&!modal;const c=want?ensureOverlay():overlay;if(!c)return;if(!want){if(c.width){c.width=0;c.height=0;}c.style.display='none';if(beamC){beamC.style.display='none';if(beamC.width){beamC.width=0;beamC.height=0;}}return;}c.style.display='block';
  const b=c.parentElement.getBoundingClientRect(),dp=Math.min(2,devicePixelRatio||1);if(c.width!==Math.round(b.width*dp)||c.height!==Math.round(b.height*dp)){c.width=Math.round(b.width*dp);c.height=Math.round(b.height*dp);}
  const g=c.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,b.width,b.height);
  const mv={x:(player.moveVX150||0),y:(player.moveVY150||0)};if(Math.hypot(mv.x,mv.y)>.05)lastDir=norm(mv.x,mv.y);else if(player.direction){const w={front:[1,1],back:[-1,-1],left:[-1,1],right:[1,-1]}[player.direction];if(w&&Math.hypot(player.moveVX150||0,player.moveVY150||0)<=.05&&!lastDir)lastDir=norm(w[0],w[1]);}
  // Standing still with the beam on a wall (or on arrival): turn it toward the longest open line.
  if(Math.hypot(mv.x,mv.y)<=.05&&rayLen(player.x,player.y,Math.atan2(lastDir.y,lastDir.x),3)<2.2){let best=0,ba=0;for(let k=0;k<16;k++){const a=k*Math.PI/8,t=rayLen(player.x,player.y,a,9);if(t>best){best=t;ba=a;}}lastDir={x:Math.cos(ba),y:Math.sin(ba)};}
  const a0=Math.atan2(lastDir.y,lastDir.x),half=1.05,reach=12*(window.__STORYWORLD_GROWTH_R103__?.lightScale?.()||1),near=5.5,pts=[],o=project(player.x,player.y);
  for(let k=0;k<=28;k++){const a=a0-half+2*half*k/28,t=rayLen(player.x,player.y,a,reach);pts.push(project(player.x+Math.cos(a)*t,player.y+Math.sin(a)*t));}
  // R107: graded ambient instead of a flat 62% black: near walls stay readable, the far maze stays dim.
  const nat=window.__STORYWORLD_SIGHT24__?.enabled===true,amb=g.createRadialGradient(o.x,o.y,near*TILE*zoom*.5,o.x,o.y,reach*1.6*TILE*zoom);amb.addColorStop(0,nat?'rgba(4,4,8,.08)':'rgba(4,4,8,.22)');amb.addColorStop(1,nat?'rgba(4,4,8,.26)':'rgba(4,4,8,.40)');g.fillStyle=amb;g.fillRect(0,0,b.width,b.height);g.globalCompositeOperation='destination-out';
  const grad=g.createRadialGradient(o.x,o.y,4,o.x,o.y,reach*TILE*zoom);grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(.8,'rgba(0,0,0,.95)');grad.addColorStop(1,'rgba(0,0,0,.6)');
  g.fillStyle=grad;g.beginPath();g.moveTo(o.x,o.y);pts.forEach(p=>g.lineTo(p.x,p.y));g.closePath();g.fill();
  const n=g.createRadialGradient(o.x,o.y-20*zoom,2,o.x,o.y-20*zoom,near*TILE*zoom);n.addColorStop(0,'rgba(0,0,0,.95)');n.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=n;g.beginPath();g.arc(o.x,o.y-20*zoom,near*TILE*zoom,0,Math.PI*2);g.fill();
  g.globalCompositeOperation='source-over';
  // Warm tint inside the beam; exits, the lamp and chests keep a faint glow through the dark.
  g.fillStyle='rgba(255,226,170,.06)';g.beginPath();g.moveTo(o.x,o.y);pts.forEach(p=>g.lineTo(p.x,p.y));g.closePath();g.fill();
  // R107: the dark overlay can only darken. A second canvas in CSS 'screen' blend actually lights the floor inside the beam
  // and around the feet, like the story-mode flashlight with the floor texture still readable.
  const bc=beamR107(c,b,dp);if(bc){const k=bc.getContext('2d');k.setTransform(dp,0,0,dp,0,0);k.clearRect(0,0,b.width,b.height);
   const lg=k.createRadialGradient(o.x,o.y-10*zoom,2,o.x,o.y-10*zoom,reach*TILE*zoom);lg.addColorStop(0,'rgba(255,236,200,.34)');lg.addColorStop(.55,'rgba(255,226,180,.16)');lg.addColorStop(1,'rgba(255,220,170,0)');
   k.fillStyle=lg;k.beginPath();k.moveTo(o.x,o.y);pts.forEach(p=>k.lineTo(p.x,p.y));k.closePath();k.fill();
   const ng=k.createRadialGradient(o.x,o.y-16*zoom,2,o.x,o.y-16*zoom,near*TILE*zoom);ng.addColorStop(0,'rgba(255,240,210,.26)');ng.addColorStop(1,'rgba(255,240,210,0)');k.fillStyle=ng;k.beginPath();k.arc(o.x,o.y-16*zoom,near*TILE*zoom,0,Math.PI*2);k.fill();}
  const L=room.exploration.samongR103;for(const [p,col] of [[L.exit,'rgba(170,220,255,.35)'],[L.save,'rgba(255,200,120,.3)'],...L.chests.filter((_,i)=>!(window.__STORYWORLD_GROWTH_R103__?.chestSeen?.(room.samongR103.key+':chest:'+i))).map(q=>[q,'rgba(255,215,120,.22)'])]){if(!p)continue;const q=project(p.x,p.y);const rr=g.createRadialGradient(q.x,q.y-10,1,q.x,q.y-10,26*zoom);rr.addColorStop(0,col);rr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rr;g.beginPath();g.arc(q.x,q.y-10,26*zoom,0,Math.PI*2);g.fill();}}

 // ---- interaction ---------------------------------------------------------------------------
 function nearMine(){if(!here())return null;let best=null,bd=1e9;for(const p of room.props){if(!p.samongR103)continue;const d=Math.hypot(p.x-player.x,p.y-player.y),reach=p.samongR103==='portal'?2.6:1.9;if(d<reach&&d<bd){best=p;bd=d;}}return best;}
 function use(p){const x=room.samongR103;
  if(p.samongR103==='back'){restoreFlash();return back();}
  if(p.r115Clue||p.r115Stmt!=null||p.r115Book){try{return ZN()?.use?.(p,zapi)===true;}catch(e){fail(e);return false;}}
  if(p.samongR103==='portal'){if(!x.portal)return false;restoreFlash();next();return true;}
  if(p.samongR103==='save'){S.checkpoint={x:p.x+.6,y:p.y+.6};player.hp=Math.max(player.hp,maxHP()*.6);saveGame(false);toast('기억의 등불 · 이 자리에서 다시 시작합니다.',3);showRecords();return true;}
  if(p.samongR103==='chest'){window.__STORYWORLD_GROWTH_R103__?.openChest?.(p);return true;}
  if(p.samongR103==='michaela'){window.__STORYWORLD_GROWTH_R103__?.talkMichaela?.(p);return true;}
  if(p.samongR103==='record'){try{return window.__STORYWORLD_SAMONG_MAPS_R105__?.use?.(p)===true;}catch(e){fail(e);return false;}}
  return false;}

 // ---- hooks ---------------------------------------------------------------------------------
 function install(){
  makeNative=makeRoom;
  // The Three terrain chunks read the region layout by zone id; while a stage is active
  // its host id must resolve to the stage layout, not the host's native map.
  const EX=window.__STORYWORLD_EXPLORATION__;if(EX&&typeof EX.layout==='function'){const own={};for(const k of Object.keys(EX))own[k]=EX[k];own.layout=function(id,...a){if(stageRoom&&S.active&&id===stageRoom.id&&typeof layer!=='undefined'&&layer==='DREAM')return stageRoom.exploration;return EX.layout.call(EX,id,...a);};own.samongR103=true;try{window.__STORYWORLD_EXPLORATION__=Object.freeze(own);}catch(e){fail(e);}}
  const getBase=getRoom;getRoom=function(id=zone,l=layer){if(stageRoom&&S.active&&id===stageRoom.id&&l==='DREAM')return stageRoom;return getBase.apply(this,arguments);};
  const enterBase=enterRegion;enterRegion=async function(...a){if(!entering&&S.active)deactivate();return enterBase.apply(this,a);};
  const tickBase=tick;tick=function(dt){const r=tickBase.apply(this,arguments);try{if(here()&&!modal&&!loading&&player.hp>0){const st=room.samongR103.stage,zt=zoneOf(room.samongR103.zone);if(st==='survival')(zt?tickZoneCombat:tickSurvival)(dt);else if(st==='maze')tickMaze(dt);else if(st==='explore')tickExplore(dt);else tickAscent(dt);if(zt)ZN().tick(room,zt,dt,zapi);if(time-(hudAt||0)>.5){hudAt=time;hud();}}}catch(e){fail(e);}return r;};
  const drawBase=draw;draw=function(...a){const r=drawBase.apply(this,a);try{drawFlash();}catch(e){fail(e);}return r;};
  const killBase=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded;const r=killBase.apply(this,[e,...a]);try{if(first&&e?.deadRecorded&&e.samongSurvival&&here()&&room.samongR103.stage==='survival'&&!e.samongR103Silent&&!S.counted.includes(e.id)&&S.kills<(zoneOf(room.samongR103.zone)?(zoneOf(room.samongR103.zone).goal?.kills||0):GOAL)){S.kills++;S.counted.push(e.id);if(S.counted.length>160)S.counted.shift();if(S.kills%111===0||S.kills===GOAL)saveGame(false);}}catch(err){fail(err);}return r;};
  // The host region's native warps stay out of a stage: no markers, no travel, and 길잡이
  // walks toward the stage goal instead.
  if(typeof drawExits==='function'){const exitsBase=drawExits;drawExits=function(...a){if(here())return;return exitsBase.apply(this,a);};}
  if(typeof travel==='function'){const travelBase=travel;travel=function(...a){if(here())return false;return travelBase.apply(this,a);};}
  if(typeof guideStep==='function'){const guideBase=guideStep;let guideAt=0;guideStep=function(dt,...a){if(!here())return guideBase.call(this,dt,...a);try{if(typeof guide!=='undefined'&&guide&&!modal&&!loading&&player.hp>0&&time>=guideAt){guideAt=time+.6;const px=room?.samongR103?.portal;
   // R141: 문(포탈)이 열린 뒤에는 목표가 비어(navGoal=null) 길잡이가 아무것도 하지 않았다 — 보스를 잡은 자리가 문에서 E 거리 밖이면 그대로 멈춤
   //  (S05-6 '불탄 거리' 486초). 열린 문까지 걸어가 E 를 대신 누른다.
   if(px&&!(typeof storyScene!=='undefined'&&storyScene)&&!(room.enemies||[]).some(e=>e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&Math.hypot(e.x-player.x,e.y-player.y)<6)){const dp=Math.hypot(px.x-player.x,px.y-player.y);if(dp>.7){const w=routeTo(px);route=w.length?w:[{x:px.x,y:px.y}];command=null;}else if(typeof interact==='function'){route=[];interact();}return;}
   const g=navGoal();const d=g?Math.hypot(g.x-player.x,g.y-player.y):0;
   // R141: 단서·진술(목표)은 1.6칸 안에 들어오면 길을 더 잡지 않아, 입장 자리가 단서에서 1.56칸이면 E 거리(약 1.2칸) 밖에 선 채 멈췄다(S01-3 '긴 식탁의 방' 12초).
   //  목표는 0.8칸까지 다가가고, 닿으면 E(상호작용)를 대신 누른다.
   if(g&&(d>1.6||(g.kind==='objective'&&d>.8))){const w=routeTo(g);if(w.length){route=w;command=null;}else if(d<=1.6){route=[{x:g.x,y:g.y}];command=null;}}
   else if(g&&g.kind==='objective'&&d<=.8&&typeof interact==='function'&&!(typeof storyScene!=='undefined'&&storyScene)){route=[];interact();}}}catch(e){fail(e);}};}
  const finishBase=finishEncounter;finishEncounter=function(...a){if(here())return;return finishBase.apply(this,a);};
  const completeBase=completeRegion;completeRegion=function(id,...a){if(here())return;return completeBase.apply(this,[id,...a]);};
  const interactBase=interact;interact=function(...a){try{if(here()&&!modal&&!loading&&player.hp>0){const p=nearMine();if(p&&use(p))return;if(distance(player,room.objective)<2.7)return;}}catch(e){fail(e);}return interactBase.apply(this,a);};
  const hudBase=updateHUD;updateHUD=function(...a){const r=hudBase.apply(this,a);try{if(here())hud();}catch(e){fail(e);}return r;};
  const deathBase=showDeath;showDeath=function(...a){if(!here())return deathBase.apply(this,a);S.deaths++;clearControls();stopVoice();stopEffects();const x=room.samongR103;openPanel('<div class="eyebrow">DREAM / 사몽</div><h2>기억은 남아 있습니다</h2><p>'+(x.zone?'이 구역의 입구(미로는 마지막 등불)에서 다시 시작합니다. 읽은 단서와 처치 수는 그대로입니다.':x.stage==='survival'?'누적 처치 '+S.kills+' / '+GOAL+'는 그대로 이어집니다.':x.stage==='maze'?'마지막으로 켠 등불 앞에서 다시 시작합니다.':'층계의 아래에서 다시 오릅니다.')+'</p><div class="actions"><button id="r103Retry" class="primary">이 단계 다시 시작</button><button id="r103Home">쉼터로 돌아가기</button></div>');button('r103Retry',()=>{player.hp=maxHP();closePanel(true);go(x.ep,x.stage,{zone:x.zone});});button('r103Home',()=>{player.hp=maxHP();closePanel(true);leave();});};
  const saveBase=serializeSave;serializeSave=function(...a){const d=saveBase.apply(this,a);try{d.samongR103=JSON.parse(JSON.stringify(S));if(S.active&&stageRoom){// The native save sees the host room it would restore; the stage restarts from its own field.
    const k='DREAM:'+stageRoom.id;if(d.rooms&&world[k]===undefined)delete d.rooms[k];}if(S.flashSaved!==null&&d.settings)d.settings.flashlight58=S.flashSaved;}catch(e){fail(e);}return d;};
  const restoreBase=restoreSave;restoreSave=async function(raw,...a){const prior=S,priorRoom=stageRoom;S=clean(raw?.samongR103);const resume=S.active;S.active=false;stageRoom=null;layouts.clear();try{const r=await restoreBase.call(this,raw,...a);if(r===false){S=prior;stageRoom=priorRoom;return r;}resumeNote={at:'restored',resume,layer};if(resume&&layer==='DREAM')resumeStage();return r;}catch(e){S=prior;stageRoom=priorRoom;throw e;}};
  const newBase=newGame;newGame=async function(...a){const prior=S;S=fresh();stageRoom=null;try{return await newBase.apply(this,a);}catch(e){S=prior;throw e;}};
  const dreamBase=window.__STORYWORLD_PROGRESSION_R62__?.showDream;
  const opBase=openPanel;openPanel=function(html,...a){const r=opBase.call(this,html,...a);try{if(typeof html==='string'&&html.includes('id="r62DreamClose"'))dreamButtons();if(typeof html==='string'&&html.includes('id="r62DreamMenu"')===false&&document.getElementById('r62DreamMenu'))menuButton();}catch(e){fail(e);}return r;};
  const menuBase=showMenu;showMenu=function(...a){const r=menuBase.apply(this,a);try{menuButton();}catch(e){fail(e);}return r;};
 }
 function unlocked(){return window.__STORYWORLD_STORY_PROFILE_R54__?.dreamUnlocked?.()===true||!!window.__STORYWORLD_CHEAT777__?.active?.();}
 function dreamButtons(){const box=document.querySelector('#panel .actions');if(!box||document.getElementById('r103Enter'))return;const b=document.createElement('button');b.id='r103Enter';b.textContent=S.started&&!S.done?'사몽 에피소드 이어가기 · '+EP[S.ep].title:'사몽 에피소드 시작 · 주인 없는 자장가';b.disabled=!unlocked()||!solo();box.appendChild(b);b.onclick=()=>{closePanel(true);start();};const r=document.createElement('button');r.id='r103Records';r.textContent='사몽 기록장';r.disabled=!S.started;box.appendChild(r);r.onclick=()=>showRecords();}
 function menuButton(){const box=document.querySelector('#panel .actions');if(!box||!started||storyScene||document.getElementById('r103Menu'))return;if(!unlocked())return;const b=document.createElement('button');b.id='r103Menu';b.textContent='사몽 에피소드';box.appendChild(b);b.onclick=()=>{closePanel(true);start();};}
 async function start(){if(!unlocked()){toast('STORY 마지막 기억을 마치면 사몽 에피소드가 열립니다.',4);return false;}if(!solo()){toast('사몽 에피소드는 혼자 진행합니다.',3);return false;}if(S.done){S=fresh();}if(S.zone&&zoneOf(S.zone))return go(S.ep,null,{zone:S.zone});if(zonesOf(S.ep))return enterEp(S.ep);return go(S.ep,S.ep===0?'ascent':S.stage);}
 function hud(){const x=room.samongR103,ep=EP[x.ep],q=id=>document.getElementById(id);const set=(id,t)=>{const el=q(id);if(el)el.textContent=t;};
  const z=zoneOf(x.zone);if(z){const h=ZN().hudText(room,z);set('questTitle','사몽 · '+ep.title);set('regionName',z.title);set('regionSub',ep.chapter+' · '+h.sub);set('questText',h.text);set('questDestination',h.dest);set('questUnlock',h.unlock);set('hint',h.text);
   const badge=q('mobileMapR74'),bt='사몽 · '+h.badge;if(badge&&badge.textContent!==bt){badge.textContent=bt;badge.title=bt;}set('questInlineSummary',h.text+' · '+h.dest);return;}
  set('questTitle','사몽 · '+ep.title);set('regionName',ep.title);set('regionSub',ep.chapter+' · '+(x.stage==='survival'?'생존':x.stage==='maze'?'손전등 미로':'상승'));
  if(x.stage==='survival'){set('questText',x.portal?'문이 열렸습니다. 가운데의 문에서 E':'누적 처치 '+S.kills+' / '+GOAL+' · 동시 출현은 제한됩니다.');set('questDestination','생존전 · '+(ep.mobName||''));set('questUnlock',S.kills>=GOAL?'목표 달성 · 새 적이 나오지 않습니다':'666 누적 처치 후 미로의 문');}
  else if(x.stage==='maze'){set('questText','손전등이 비추는 쪽으로 출구를 찾으세요. 적은 계속 나타납니다.');set('questDestination','미로 · '+(ep.maze||''));set('questUnlock','출구에 닿으면 상승 구간으로 · 등불에서 저장');}
  else{set('questText',x.portal?'문에서 E로 다음 기억으로':x.bossUp?josa(ep.boss.name,'을','를')+' 쓰러뜨리세요':'층계를 따라 위쪽으로 오르세요.');set('questDestination','상승 · '+ep.boss.name);set('questUnlock','보스 처치 후 다음 에피소드 생존전');}
  set('hint',x.stage==='survival'?(x.portal?'가운데의 문 · E':'누적 '+S.kills+' / '+GOAL):x.stage==='maze'?'손전등은 움직이는 쪽을 비춥니다 · 등불에서 저장':(x.portal?'문 · E':'위쪽으로'));
  const badge=q('mobileMapR74'),bt='사몽 · '+ep.title+' · '+(x.stage==='survival'?'생존':x.stage==='maze'?'미로':'상승');if(badge&&badge.textContent!==bt){badge.textContent=bt;badge.title=bt;}
  set('questInlineSummary',(q('questText')?.textContent||'')+' · '+(q('questDestination')?.textContent||''));}
 function inspect(){const r=here()?room:null,x=r?.samongR103;return{revision:REV,resumeNote,state:JSON.parse(JSON.stringify(S)),zone,layer,here:!!r,stage:x?.stage,ep:x?.ep,samongZone:x?.zone||null,alive:r?r.enemies.filter(living).length:0,portal:x?.portal||null,bossUp:!!x?.bossUp,boss:x?.boss||null,failures,lastError,donorFail:[...donorFail],layout:r?{bounds:r.exploration.bounds,walls:r.exploration.walls.length,floor:r.exploration.floorCells.length,extra:r.exploration.samongR103}:null};}
 // Test hooks: jump to a stage, add kills (counted through the same kill path), reach a point.
 const test={go:(ep,stage)=>go(ep,stage),kill:(n=1)=>{let k=0;for(const e of [...room.enemies])if(k<n&&living(e)&&e.samongSurvival){e.hp=1;hitEnemy(e,9e9);k++;}return k;},setKills:n=>{S.kills=Math.max(0,Math.min(GOAL,n));},teleport:(x,y)=>{player.x=x;player.y=y;cam={x,y};},near:kind=>room.props.find(p=>p.samongR103===kind),route:()=>{const g=navGoal();return g?routeTo(g):[];}};
 // Compass and 길잡이 point at the stage goal instead of the host region's objective.
 // A path from the player to g. Hugging a wall can leave the player inside the path clearance, where findPath gives nothing, so start from the nearest open cell centre.
 function routeTo(g){let r=[];try{r=findPath(player,g)||[];}catch{}if(r.length)return r;const cx=Math.floor(player.x),cy=Math.floor(player.y);let best=null;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q={x:cx+dx+.5,y:cy+dy+.5};if(blocked(q.x,q.y,.29,room)||!clearPath3(player,q,.2,room))continue;const d=Math.hypot(q.x-player.x,q.y-player.y);if(!best||d<best.d)best={q,d};}if(!best)return[];let rest=[];try{rest=findPath(best.q,g)||[];}catch{}return rest.length||Math.hypot(best.q.x-g.x,best.q.y-g.y)<1.2?[best.q,...rest]:[];}
 function navGoal(){if(!here())return null;const x=room.samongR103,L=room.exploration.samongR103,pt=(p,label,kind)=>p&&Number.isFinite(p.x+p.y)?{x:p.x,y:p.y,label,kind}:null;
  if(x.portal)return pt(x.portal,x.portal.label||'문','exit');
  const z=zoneOf(x.zone);if(z){const g=ZN().navGoal(room,z);if(g)return g;if(x.stage==='explore')return pt(L.exit,z.title+' · 출구','objective');
   if(x.stage==='survival'){if(z.goal?.reach&&S.kills>=(z.goal.kills||0))return pt(L.exit,z.title+' · 끝의 문','objective');let best=null,d=1e9;for(const e of room.enemies)if(living(e)){const k=Math.hypot(e.x-player.x,e.y-player.y);if(k<d){d=k;best=e;}}return best?pt(best,'처치 '+S.kills+'/'+(z.goal?.kills||0),'enemy'):pt(L.exit,z.title,'objective');}}
  if(x.stage==='survival'){let best=null,d=1e9;for(const e of room.enemies)if(living(e)){const k=Math.hypot(e.x-player.x,e.y-player.y);if(k<d){d=k;best=e;}}return best?pt(best,'누적 처치 '+S.kills+'/'+GOAL,'enemy'):pt(L.centre,'생존전','objective');}
  if(x.stage==='maze')return pt(L.exit,'미로 출구','objective');
  const b=room.enemies.find(e=>e.id===x.boss),bn=(z?.boss||epOf(x).boss).name;return x.bossUp&&b&&b.hp>0?pt(b,bn,'boss'):pt(L.dais,z?.solve?'위쪽의 '+bn:'위쪽의 보스','objective');}
 const epOf=x=>EP[x.ep];
 window.__STORYWORLD_NAV_GOAL_R103__=navGoal;
 try{install();}catch(e){fail(e);}
 window.__STORYWORLD_SAMONG_R103__=Object.freeze({revision:REV,GOAL,episodes:EP,stages:STAGES,here,start,go,next,showRecords,ending,inspect,test,layoutFor,mazeLayout,state:()=>S,get flashlightActive(){return here()&&(room.samongR103.stage==='maze'||!!zoneOf(room.samongR103.zone)?.dark);},goZone:id=>{const i=epOfZone(id);return i<0?Promise.resolve(false):go(i,null,{zone:id});},zones:()=>({current:here()?room.samongR103.zone:null,state:{zone:S.zone,done:[...S.zoneDone],read:S.zoneRead.length}})});
})();
