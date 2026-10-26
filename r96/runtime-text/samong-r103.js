/* R103: 사몽 에피소드 순환 — 생존전(누적 666 처치) → 손전등 미로 → 상승형 보스맵.
 * DREAM(사몽) 세계에서만 열립니다. 기존 STORY·DREAM 구역, 진행, 저장은 그대로 두고
 * 별도 저장 필드(samongR103)와 별도 지역 id(sm103-*)를 씁니다. 서사는
 * samong-text-r103.js 의 원문 문단만 보여 줍니다. */
(()=>{'use strict';
 if(window.__STORYWORLD_SAMONG_R103__)return;
 const REV='R103-samong-1',PREFIX='sm103-',VERSION=1,GOAL=666;
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
   mobName:'뿌리에서 쏟아진 잔영',mobs:[['dist00','a11-c1'],['last302','l302-e1']],maze:'빛이 닿는 만큼 생기는 복도',
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
 let stageRoom=null,entering=0;
 const here=()=>live()&&!!stageRoom&&room===stageRoom&&zone===stageRoom.id&&layer==='DREAM';

 // ---- state --------------------------------------------------------------------------------
 const fresh=()=>({version:VERSION,active:false,ep:0,stage:'ascent',kills:0,serial:0,counted:[],seed:0,checkpoint:null,cleared:[],read:[],chests:[],started:false,done:false,returnTo:null,flashSaved:null,deaths:0});
 let S=fresh();
 function clean(v){if(!v||v.version!==VERSION)return fresh();const s=fresh();s.ep=Math.max(0,Math.min(EP.length-1,Math.floor(Number(v.ep)||0)));s.stage=STAGES.includes(v.stage)?v.stage:'ascent';if(s.ep===0)s.stage='ascent';s.kills=Math.max(0,Math.min(GOAL,Math.floor(Number(v.kills)||0)));s.serial=Math.max(0,Math.floor(Number(v.serial)||0));s.counted=Array.isArray(v.counted)?v.counted.filter(x=>typeof x==='string').slice(-160):[];s.seed=(Number(v.seed)>>>0)||0;s.checkpoint=v.checkpoint&&Number.isFinite(v.checkpoint.x)&&Number.isFinite(v.checkpoint.y)?{x:+v.checkpoint.x,y:+v.checkpoint.y}:null;s.cleared=Array.isArray(v.cleared)?v.cleared.filter(Number.isInteger).slice(0,64):[];s.read=Array.isArray(v.read)?v.read.filter(x=>typeof x==='string').slice(0,256):[];s.chests=Array.isArray(v.chests)?v.chests.filter(x=>typeof x==='string').slice(-512):[];s.started=v.started===true;s.active=v.active===true;s.done=v.done===true;s.returnTo=v.returnTo&&typeof v.returnTo.zone==='string'?{zone:v.returnTo.zone,layer:v.returnTo.layer==='STORY'?'STORY':'DREAM'}:null;s.flashSaved=typeof v.flashSaved==='boolean'?v.flashSaved:null;s.deaths=Math.max(0,Math.floor(Number(v.deaths)||0));return s;}

 // ---- seeded random -------------------------------------------------------------------------
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};

 // ---- layouts --------------------------------------------------------------------------------
 // Same contract as the native R82 refuge: floor cells + boundary walls + nodes.
 let versionTag=null;
 function surfaceArt(ep){const atlas=StoryArtR74.atlases.materials,style=atlas.styles[ep.style]||atlas.styles.garden;return{path:atlas.path,width:atlas.width,height:atlas.height,sha256:atlas.sha256,floorRect:[...style.floorRect],wallRect:[...style.wallRect],tileWorld:4.5,r55PhysicalUV:true,r74Generated:true,theme:ep.style,r81Environment:ep.style,r81Palette:{floor:ep.tint[1],wall:ep.tint[0],cap:ep.tint[1],edge:0x111114}};}
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
 function layoutFor(i,stage){const id=sid(i,stage),seed=stage==='maze'?(S.ep===i&&S.seed?S.seed:hash(id)):0,k=id+':'+seed;if(!layouts.has(k)){const ep=EP[i];layouts.set(k,stage==='survival'?survivalLayout(i,ep):stage==='maze'?mazeLayout(i,ep,seed):ascentLayout(i,ep));while(layouts.size>12)layouts.delete(layouts.keys().next().value);}return layouts.get(k);}

 // ---- regions ------------------------------------------------------------------------------
 const donorProfiles=new Map(),donorFail=new Set();let makeNative=null;
 function donor([region,nativeId]){const k=region+'|'+nativeId;if(donorProfiles.has(k))return donorProfiles.get(k);let d=null;try{const r=makeNative(region,'DREAM'),e=r.enemies.find(e=>e.nativeId===nativeId)||r.enemies.find(e=>String(e.id).includes(nativeId));d=e?.profile||null;}catch(e){fail(e);}if(!d)donorFail.add(k);donorProfiles.set(k,d);return d;}
 function profilePaths(d){const out=new Set();if(!d)return out;if(d.path)out.add(d.path);for(const f of Object.values(d.frames||{}))if(f?.path)out.add(f.path);for(const f of Object.values(d.actions||{}))if(f?.path)out.add(f.path);return out;}
 // Donor images join the host's preload only while a stage is being entered.
 function stagePaths(i,stage){const ep=EP[i],paths=new Set();const rows=stage==='ascent'?[ep.boss.donor,...(ep.guard||[])]:(ep.mobs||[]);for(const row of rows)for(const path of profilePaths(donor(row))){try{register(path,'image','R103 사몽 · '+ep.title);}catch(e){}paths.add(path);}return[...paths];}

 // ---- rooms -------------------------------------------------------------------------------
 function buildRoom(i,stage){const ep=EP[i],id=ep.host,l='DREAM',p={ep:i,stage},template=makeNative(id,l),layout=layoutFor(i,stage);
  const r={...template,id,layer:l,props:[],enemies:[],kills:0,engaged:false,cleared:false,finalizing:false,encounterStage:'samongR103',activeEncounter:null,fieldWaves6:[],fieldWaveIndex6:0,fieldWaveTotal6:0,fieldWaveCleared6:true,storyRosterIds6:[],defeatedActorIds:new Set(),exploration:layout,explorationGroups:[],worldR74:1,r75Decorated:true,worldCombatR78:true,worldEnvironmentR81:true,r99Trees:true,r40RosterApplied:true,persona:{...(template.persona||{}),phase:'none'},samongR103:{ep:p.ep,stage:p.stage,portal:null,spawnAt:0,alive:0,bossUp:false,born:0}};
  const x=layout.samongR103;r.objective={x:(x.exit||x.centre||x.dais||layout.entry).x,y:(x.exit||x.centre||x.dais||layout.entry).y,path:regionById[ep.host]?.objectiveArt||template.objective?.path};
  const key=sid(i,stage);r.samongR103.key=key;
  if(p.stage==='maze'){if(x.save)r.props.push(prop('save',x.save,{label:'기억의 등불 · 저장'}));x.chests.forEach((c,n)=>r.props.push(chest(key+':chest:'+n,c)));}
  if(p.stage==='ascent'){// Braziers line the climb so the way up reads at a glance.
   x.landings.forEach((q,n)=>{for(const s of[-1,1])r.props.push(prop('lamp',{x:q.x+s*2.4,y:q.y-s*2.4},{label:''}));});x.landings.forEach((q,n)=>{if(n===1)r.props.push(chest(key+':chest:0',{x:q.x+1.6,y:q.y-1.6}));});}
  return r;}
 function chest(id,at){const G=window.__STORYWORLD_GROWTH_R103__;return G?.chestProp?G.chestProp(id,at,{samongR103:'chest',chest:id}):prop('chest',at,{chest:id});}
 function prop(kind,at,extra={}){return{id:'r103:'+kind+':'+Math.round(at.x*10)+':'+Math.round(at.y*10),x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:kind,r74Prop:kind==='chest'?'crate':kind==='save'||kind==='lamp'?'brazier':'obelisk',...extra};}

 // ---- spawning ------------------------------------------------------------------------------
 function spawn(row,at,{boss=false,name,hpScale=1,tag='m',aggro=0}={}){const d=donor(row);if(!d)return null;const id='sm103:'+room.samongR103.key+':'+tag+':'+(++S.serial);let e;try{e=actor3(d,id,at.x,at.y,boss,'DREAM',regionById[room.id]);}catch(err){fail(err);return null;}if(!e)return null;
  if(name)e.name=name;e.samongR103=room.samongR103.key;e.spawnState='active';e.homeX=at.x;e.homeY=at.y;e.explorationLeash=null;e.graceUntil=time+.6;e.cd=Math.max(.6,e.cd||1);
  if(aggro&&e.combatProfile)e.combatProfile={...e.combatProfile,aggro};
  if(hpScale!==1&&Number.isFinite(e.maxHp)){e.maxHp=Math.max(1,Math.round(e.maxHp*hpScale));e.hp=e.maxHp;}
  room.enemies.push(e);return e;}
 const living=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead';
 function floorAt(x,y,rad=.45){return!blocked(x,y,rad,room);}
 function ringPoint(c,min,max,tries=24){for(let t=0;t<tries;t++){const a=Math.random()*Math.PI*2,d=min+Math.random()*(max-min),q={x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d};if(floorAt(q.x,q.y))return q;}return null;}
 function caps(){const low=!!settings.lowFx,mobile=matchMedia('(pointer:coarse)').matches;return{survival:low||mobile?36:56,maze:low||mobile?12:18};}
 function tickSurvival(dt){const r=room,x=r.samongR103,ep=EP[x.ep];if(x.portal)return;
  if(S.kills>=GOAL){// Goal reached: no new spawns; the rest scatter and the portal opens.
   if(!x.endAt){x.endAt=time+5;toast('누적 '+GOAL+' 처치 · 새 적이 더 나오지 않습니다. 남은 형상이 흩어지면 문이 열립니다.',4);}
   for(const e of r.enemies)if(living(e)&&e.samongR103){e.fadeR103=(e.fadeR103||0)+dt;if(e.fadeR103>1.2){e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.deadAt=time;e.samongR103Silent=true;}}
   r.enemies=r.enemies.filter(e=>living(e)||time-(e.deadAt||0)<1.5);
   if(time>=x.endAt||!r.enemies.some(living))openPortal(r,r.exploration.samongR103.centre,'미로로 내려가는 문');return;}
  const alive=r.enemies.filter(living).length,cap=caps().survival,need=GOAL-S.kills;if(time<x.spawnAt||alive>=Math.min(cap,need))return;
  x.spawnAt=time+.45;const batch=Math.min(4,cap-alive,need-alive);for(let n=0;n<batch;n++){const q=ringPoint(player,9,15);if(!q)break;const e=spawn(ep.mobs[(S.serial+n)%ep.mobs.length],q,{name:ep.mobName,hpScale:.42,tag:'s',aggro:60});if(e){e.damage=(e.damage||8)*.7;e.samongSurvival=true;}}}
 function tickMaze(dt){const r=room,x=r.samongR103,ep=EP[x.ep],L=r.exploration.samongR103;
  if(!x.portal)openPortal(r,L.exit,'미로의 출구');
  // Bounded periodic spawns at junctions far from the player, never near the exit or the lamp.
  const alive=r.enemies.filter(living);for(const e of alive){for(const safe of [L.exit,L.save]){if(safe&&Math.hypot(e.x-safe.x,e.y-safe.y)<3.2){const a=Math.atan2(e.y-safe.y,e.x-safe.x),q={x:safe.x+Math.cos(a)*3.3,y:safe.y+Math.sin(a)*3.3};if(floorAt(q.x,q.y,.3)){e.x=q.x;e.y=q.y;}else{e.hp=0;e.deadRecorded=true;e.spawnState='dead';e.samongR103Silent=true;}}}}
  r.enemies=r.enemies.filter(e=>living(e)||time-(e.deadAt||0)<1.5);
  if(time<x.spawnAt||alive.length>=caps().maze)return;x.spawnAt=time+4;
  const sites=r.exploration.nodes.filter(n=>{const d=Math.hypot(n.x-player.x,n.y-player.y);return d>8&&d<22&&Math.hypot(n.x-L.exit.x,n.y-L.exit.y)>4&&(!L.save||Math.hypot(n.x-L.save.x,n.y-L.save.y)>4);});
  for(let n=0;n<2&&sites.length;n++){const s=sites.splice(Math.floor(Math.random()*sites.length),1)[0];const e=spawn(ep.mobs[(S.serial+n)%ep.mobs.length],s,{name:ep.mobName,hpScale:.6,tag:'z',aggro:9.5});if(e)e.damage=(e.damage||8)*.8;}}
 function tickAscent(dt){const r=room,x=r.samongR103,ep=EP[x.ep],L=r.exploration.samongR103;
  if(!x.born){x.born=1;for(const q of L.landings)for(let n=0;n<2;n++){const g=ep.guard?.[n%ep.guard.length];if(g)spawn(g,{x:q.x+(n?1.2:-1.2),y:q.y+(n?-.6:.6)},{tag:'g',hpScale:.8,aggro:8});}
   const b=spawn(ep.boss.donor,L.dais,{boss:true,name:ep.boss.name,tag:'b'});if(b){b.spawnState='hidden';b.samongBoss=true;b.patternsR103=ep.boss.patterns;x.boss=b.id;}}
  const b=r.enemies.find(e=>e.id===x.boss);
  if(!x.bossUp&&b&&Math.hypot(player.x-L.dais.x,player.y-L.dais.y)<10.5){x.bossUp=true;r.engaged=true;b.spawnState='active';b.cd=1.2;b.rest=.8;b.phaseAge=0;b.phaseStage='active';player.invincible=Math.max(player.invincible,.8);player.invReason='전투 진입';try{sound('boss');}catch(e){}const sc=scenes(ep,'boss');if(sc.length)playScenes(sc,()=>banner103(ep.boss.name,'보스'));else banner103(ep.boss.name,'보스');}
  if(x.bossUp&&b&&b.hp>0)bossPatterns(b,dt);
  if(x.bossUp&&(!b||b.hp<=0||b.deadRecorded)&&!x.portal){r.engaged=false;stageCleared(r);}}
 // Four readable pattern families (예고 표시 → 판정). Damage scales from the actor's own value.
 function bossPatterns(b,dt){const x=room.samongR103;x.patAt=x.patAt||time+3;if(time<x.patAt||!b.patternsR103?.length)return;const list=b.patternsR103,kind=list[(x.patN=(x.patN||0)+1)%list.length],dmg=(b.damage||20)*.55;x.patAt=time+(kind==='rain'?5.5:4.2);
  const field=(px,py,radius,warning,life,asset)=>{if(blocked(px,py,.1,room))return;hazards.push({id:++uid,type:'field',owner:b.id,x:px,y:py,radius,age:0,warning,life:warning+life,asset,damage:dmg,lastHit:-99,samongPattern:kind});};
  if(kind==='sky'){for(let n=0;n<6;n++){const a=n*1.0472+time,d=1.5+n*.55;field(player.x+Math.cos(a)*d,player.y+Math.sin(a)*d,1.25,1.1+n*.12,.45,VFX.cross);}fxPattern('sky',player.x,player.y);}
  else if(kind==='ground'){for(let n=0;n<10;n++){const t=(n+1)/10,px=b.x+(player.x-b.x)*t*1.25,py=b.y+(player.y-b.y)*t*1.25;field(px,py,.95,.75+n*.09,.5,VFX.burst);}fxPattern('ground',b.x,b.y);}
  else if(kind==='sides'){const n=12;for(let k=0;k<n;k++){const a=k*Math.PI*2/n,sx=player.x+Math.cos(a)*7,sy=player.y+Math.sin(a)*7;const s=makeShot(sx,sy,a+Math.PI,4.2,dmg,{owner:b.id,asset:VFX.bolt,radius:.2,life:3.2,samongPattern:'sides'});if(s)s.delay=.7;}fxPattern('sides',player.x,player.y);}
  else if(kind==='rain'){for(let n=0;n<16;n++){const px=player.x+(Math.random()*2-1)*6,py=player.y+(Math.random()*2-1)*6;field(px,py,.7,.9+Math.random()*1.4,.35,VFX.mark);}fxPattern('rain',player.x,player.y);}}
 function fxPattern(kind,x,y){try{window.__STORYWORLD_HERO_FX_R103__?.pattern?.(kind,x,y,{hostile:true});}catch(e){fail(e);}}

 // ---- portals, stage flow -------------------------------------------------------------------
 function openPortal(r,at,label){const x=r.samongR103;if(x.portal)return;x.portal={x:at.x,y:at.y,label,at:time};r.objective={...r.objective,x:at.x,y:at.y};r.props.push(prop('portal',at,{label}));try{fx('sigil',at.x,at.y,{asset:VFX.cross,size:3,life:1.2});sound('clear');}catch(e){}toast(josa(label,'이','가')+' 열렸습니다. 가까이에서 E를 누르세요.',4);saveGame(false);}
 function stageCleared(r){const x=r.samongR103,ep=EP[x.ep];if(!S.cleared.includes(x.ep))S.cleared.push(x.ep);
  const after=()=>{if(ep.boss.final){ending();return;}openPortal(r,r.exploration.samongR103.dais,'다음 기억으로 향하는 문');};
  const sc=scenes(ep,'after');if(sc.length)playScenes(sc,after);else after();}
 function next(){const x=room.samongR103;let ep=x.ep,stage=x.stage;
  if(stage==='ascent'){ep=ep+1;stage='survival';}else if(stage==='survival')stage='maze';else stage='ascent';
  if(ep>=EP.length){ending();return;}go(ep,stage);}
 async function go(ep,stage,{restore=false,position=null}={}){if(entering)return false;if(stage==='maze'&&!(S.ep===ep&&S.stage==='maze'&&S.seed))S.seed=hash(sid(ep,'maze')+':'+Date.now()+':'+Math.random());
  if(stage!=='maze')S.checkpoint=null;if(stage==='survival'&&!(S.ep===ep&&S.stage==='survival'))S.kills=0;
  if(!S.active&&!stageRoom&&zone&&regionById[zone])S.returnTo={zone:regionById[zone].safe?zone:'hub',layer};
  S.ep=ep;S.stage=stage;S.started=true;const def=regionById[EP[ep].host];if(!def)return false;
  const extra=stagePaths(ep,stage),oldPaths=def.paths;def.paths=[...new Set([...oldPaths,...extra])];
  const prev=stageRoom;stageRoom=buildRoom(ep,stage);S.active=true;entering++;let ok=false;
  const L=stageRoom.exploration,start=position||(stage==='maze'&&S.checkpoint)||L.entry;
  try{ok=await enterRegion(def.id,null,{layer:'DREAM',position:{x:start.x,y:start.y},noStory:true,restore:true});}finally{entering--;def.paths=oldPaths;}
  if(!ok||room!==stageRoom){stageRoom=prev&&room===prev?prev:null;S.active=!!stageRoom;return false;}
  forceFlash(stage==='maze');intro(EP[ep],stage);saveGame(false);return true;}
 // After a load the native restore may still be entering the host map; wait for it, then
 // re-enter the stage at its start (the maze at the last lamp).
 let resumeNote=null;
 async function resumeStage(){const want={ep:S.ep,stage:S.stage};resumeNote={at:'wait',want};for(let i=0;i<150&&(loading||entering);i++)await new Promise(r=>setTimeout(r,100));if(S.active||S.ep!==want.ep||S.stage!==want.stage||layer!=='DREAM'){resumeNote={at:'skip',active:S.active,ep:S.ep,stage:S.stage,layer};return false;}resumeNote={at:'go',want};
  for(let t=0;t<3;t++){if(await go(want.ep,want.stage,{restore:true})){resumeNote={at:'done',want,try:t};return true;}resumeNote={at:'retry',t,entering,loading};await new Promise(r=>setTimeout(r,400));}return false;}
 function intro(ep,stage){const sc=scenes(ep,stage);if(sc.length&&!modal)playScenes(sc,()=>banner103(ep.title,stageLabel(stage)));else banner103(ep.title,stageLabel(stage));}
 const stageLabel=s=>s==='survival'?'생존 · 누적 '+GOAL+' 처치':s==='maze'?'손전등 미로 · 출구 찾기':'상승 · 위쪽의 보스';
 function banner103(title,sub){try{const el=document.getElementById('cutin')||null;toast(title+(sub?'\n'+sub:''),3.4);}catch(e){fail(e);}}

 // ---- narrative ----------------------------------------------------------------------------
 // Short at combat boundaries; the full sections are readable at the lamp and in the 기록장.
 function paras(key){const s=TEXT()[key];return s?s.blocks.flatMap(b=>b.paras.map(t=>({t,n:b.narrator}))):[];}
 function scene(ep,key,text,narrator,part){const k='DREAM:sm103:'+ep.key+':'+part+':'+key;return{id:ep.host,record:{title:ep.title,narrator,chapter:ep.chapter},part:'body',text,title:TEXT()[key]?.title||ep.title,narrator:narrator?'〈'+narrator+'〉':'',chapter:ep.chapter,key:k};}
 // [구간 키, 그 문단이 시작하는 원문 문자열(없으면 첫 문단, 'last'는 끝), 문단 수]
 const CUES={
  P:{a:['prelude',null,4],b:['threshold','코어 아래로 검은 뿌리가',1],z:['threshold','교주가 마지막으로 가둔 곳은',1]},
  'S-01':{s:['threshold','뿌리를 쓰러뜨리자',1],m:['threshold','나는 이곳에서 모든 적을',1],a:['S-01',null,2],b:['S-01','그때 식탁의 안주인이',2],z:['S-01','실들이 한꺼번에',1]},
  'S-02':{s:['S-02',null,2],m:['S-02','복도 끝에서 열쇠가',1],a:['S-02','방송실이 위층에',2],b:['S-02','나는 귀가 확인서를',1],z:['S-02','교문은 열렸지만',1]},
  'S-03':{s:['S-03',null,1],m:['S-03','나는 손전등을 낮추었다',1],a:['S-03','빗소리가 잦아들자',1],b:['S-03','시험장 뒤편에서는 도복들이',2],z:['S-03','관람석의 의자들이',1]},
  'S-04':{s:['S-04',null,2],m:['S-04','나는 도망치는 대신',1],a:['S-04','엘리베이터는 4층으로',1],b:['S-04','13층에서 강재헌을',3],z:['S-04','비 속에서 눈을 떴을 때',1]},
  'S-05':{s:['S-05',null,2],m:['S-05','처음에는 추위를 피해',1],a:['S-05','신문은 재가 되지 않았다',2],b:['S-05','관사 안에서 다시 불빛이',1],z:['S-05','나는 그 약속에 찍힌',1]},
  'S-06':{s:['NS-01',null,2],m:['NS-05','문을 열자 작은 방이',1],a:['NS-08',null,1],b:['NS-08','한쪽 날개에는',1],z:['NS-10','나는 그 줄을 잘랐다',2]},
  'S-07':{s:['S-07',null,2],m:['S-07','탁자 위에 여섯 물건이',2],a:['S-07','나는 그것들이 전부',1],b:['S-07','나는 페르소나를 베었다',2],z:['S-07','그때 EGO가 각성했다',2]},
  RA:{s:['R-00',null,2],m:['R-02','손전등으로 창문을 비추자',1],a:['R-01',null,2],b:['R-02','나는 순찰자의 길을 막았다',1],z:['R-02','last',2]},
  RB:{s:['R-03',null,2],m:['R-03','초침은 철로에',1],a:['R-04',null,2],b:['R-04','지현을 비추던 은빛 면에',1],z:['R-04','last',2]},
  RC:{s:['R-05',null,2],m:['R-05','재판관의 손이 망치를',1],a:['R-06',null,2],b:['R-05','그 순서를 거절하자',2],z:['R-06','last',2]},
  RD:{s:['R-07',null,2],m:['R-07','처음 걸음을 옮겼을 때에는',1],a:['R-08',null,2],b:['R-09','하늘에서 나팔 소리가',2],z:['R-09','last',2]},
  RE:{s:['R-10',null,2],m:['R-10','빠른 사람과 느린 사람이',1],a:['R-10','거기에 관람석이',1],b:['R-10','백색 사수는 다시 총을',1],z:['R-10','last',2]},
  RF:{s:['R-11',null,2],m:['R-11','그때 다섯 번째 나팔이',1],a:['R-12',null,2],b:['R-11','스토리텔러는 그렇게',1],z:['R-12','last',2]},
  RG:{s:['R-13',null,2],m:['R-13','도겸이 들어 올린 여백이',1],a:['R-14',null,2],b:['R-13','나팔의 몸통은 빈 소매였고',1],z:['R-17','last',2]},
  M:{s:['R-17','last',2],m:['M1','그녀를 향해 다가갈수록',1],a:['M1',null,1],b:['M1','그녀는 모든 문을 혼자',2]}
 };
 function cue(row){if(!row)return[];const[k,sub,n]=row,p=paras(k);if(!p.length)return[];let at=0;if(sub==='last')at=Math.max(0,p.length-n);else if(sub){at=p.findIndex(v=>v.t.startsWith(sub));if(at<0)at=p.findIndex(v=>v.t.includes(sub));if(at<0)return[];}return p.slice(at,at+n).map(v=>({...v,key:k}));}
 // stage → cue: survival 's', maze 'm', ascent 'a' (도착), boss 'b' (등장), after 'z' (처치 뒤).
 function scenes(ep,stage){const c=CUES[ep.key]||{},part={survival:'s',maze:'m',ascent:'a',boss:'b',after:'z'}[stage],rows=cue(c[part]);const flag=ep.key+':'+part;if(!rows.length||S.read.includes(flag))return[];S.read.push(flag);
  return[scene(ep,rows[0].key,rows.map(v=>v.t).join('\n\n'),rows[0].n,part)];}
 function line(ep,kind){}
 function showRecords(focus=null){const open=EP.filter((e,i)=>i<=S.ep||S.cleared.includes(i));let html='<button id="r103RecClose" class="close">닫기</button><div class="eyebrow">DREAM / 사몽 기록장</div><h2>열린 기억</h2><p class="small">원문 그대로입니다. 전투 중에는 짧게만 보이고, 여기서 전체를 다시 읽을 수 있습니다.</p><div class="actions">';open.forEach((e,i)=>{html+='<button data-r103rec="'+i+'">'+escapeHTML(e.title)+'</button>';});html+='</div><div id="r103RecBody" class="storyText" style="max-height:52vh;overflow:auto"></div>';openPanel(html);button('r103RecClose',()=>closePanel());
  const show=i=>{const e=EP[i],body=document.getElementById('r103RecBody');if(!body)return;body.innerHTML=e.text.map(k=>{const s=TEXT()[k];if(!s)return'';return'<h3>'+escapeHTML(s.title)+'</h3>'+s.blocks.map(b=>(b.narrator?'<p class="small muted">〈'+escapeHTML(b.narrator)+'〉</p>':'')+b.paras.map(t=>'<p>'+escapeHTML(t)+'</p>').join('')).join('');}).join('');body.scrollTop=0;};
  document.querySelectorAll('[data-r103rec]').forEach(b=>b.onclick=()=>show(+b.dataset.r103rec));show(focus??Math.min(S.ep,EP.length-1));}
 function ending(){S.done=true;saveGame(false);const keys=['M2','M3','epilogue'],list=[];for(const k of keys){const s=TEXT()[k];if(!s)continue;for(const b of s.blocks){const t=b.paras.join('\n\n');if(t)list.push({id:room.id,record:{title:s.title,narrator:b.narrator,chapter:'제12부 — 마지막에 남은 사람'},part:'body',text:t,title:s.title,narrator:b.narrator?'〈'+b.narrator+'〉':'',chapter:'제12부 — 마지막에 남은 사람',key:'DREAM:sm103:ending:'+k+':'+list.length});}}
  playScenes(list,record);}
 function record(){const s=TEXT().record,b=s?.blocks?.[0];// 기록 뒤에 해설이나 정답 장면을 붙이지 않습니다.
  openPanel('<div class="eyebrow">'+escapeHTML(b?.narrator||'윤서하의 진료기록')+'</div><h2>〈'+escapeHTML(b?.narrator||'윤서하의 진료기록')+'〉</h2><div class="storyText r103-record">'+(b?.paras||[]).map(t=>'<p>'+escapeHTML(t)+'</p>').join('')+'</div><div class="actions"><button id="r103End" class="primary">닫기</button></div>');button('r103End',()=>{closePanel(true);leave();});}
 async function leave(){const to=S.returnTo&&regionById[S.returnTo.zone]?S.returnTo:{zone:'hub',layer:'DREAM'};deactivate();await enterRegion(to.zone,null,{layer:to.layer,restore:true});saveGame(false);}
 function deactivate(){S.active=false;stageRoom=null;restoreFlash();const c=overlay;if(c){c.style.display='none';}}

 // ---- flashlight (maze only) ----------------------------------------------------------------
 // R24 polygon sight is forced on inside the maze; a DOM cone overlay follows the movement
 // direction, so mobile needs no held button and no second hand.
 let overlay=null,lastDir={x:1,y:1},hudAt=0;
 // The maze beam is its own overlay; the player's R24 sight setting is left as it is.
 function forceFlash(on){if(!on)restoreFlash();}
 function restoreFlash(){if(S.flashSaved===null)return;const v=S.flashSaved;S.flashSaved=null;if(settings.flashlight58!==v){settings.flashlight58=v;window.__STORYWORLD_SIGHT24__?.refresh?.();}document.getElementById('stage')?.classList.toggle('flashlight-black-r58',v!==false);}
 function ensureOverlay(){if(overlay?.isConnected)return overlay;const stage=document.getElementById('stage');if(!stage)return null;overlay=document.createElement('canvas');overlay.id='r103Flashlight';overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3';stage.appendChild(overlay);return overlay;}
 function rayLen(ox,oy,a,max){const dx=Math.cos(a),dy=Math.sin(a);for(let t=.2;t<max;t+=.18)if(blocked(ox+dx*t,oy+dy*t,.02,room))return t;return max;}
 function drawFlash(){const want=here()&&room.samongR103.stage==='maze'&&!modal;const c=want?ensureOverlay():overlay;if(!c)return;if(!want){if(c.width){c.width=0;c.height=0;}c.style.display='none';return;}c.style.display='block';
  const b=c.parentElement.getBoundingClientRect(),dp=Math.min(2,devicePixelRatio||1);if(c.width!==Math.round(b.width*dp)||c.height!==Math.round(b.height*dp)){c.width=Math.round(b.width*dp);c.height=Math.round(b.height*dp);}
  const g=c.getContext('2d');g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,b.width,b.height);
  const mv={x:(player.moveVX150||0),y:(player.moveVY150||0)};if(Math.hypot(mv.x,mv.y)>.05)lastDir=norm(mv.x,mv.y);else if(player.direction){const w={front:[1,1],back:[-1,-1],left:[-1,1],right:[1,-1]}[player.direction];if(w&&Math.hypot(player.moveVX150||0,player.moveVY150||0)<=.05&&!lastDir)lastDir=norm(w[0],w[1]);}
  // Standing still with the beam on a wall (or on arrival): turn it toward the longest open line.
  if(Math.hypot(mv.x,mv.y)<=.05&&rayLen(player.x,player.y,Math.atan2(lastDir.y,lastDir.x),3)<2.2){let best=0,ba=0;for(let k=0;k<16;k++){const a=k*Math.PI/8,t=rayLen(player.x,player.y,a,9);if(t>best){best=t;ba=a;}}lastDir={x:Math.cos(ba),y:Math.sin(ba)};}
  const a0=Math.atan2(lastDir.y,lastDir.x),half=.62,reach=9*(window.__STORYWORLD_GROWTH_R103__?.lightScale?.()||1),near=3,pts=[],o=project(player.x,player.y);
  for(let k=0;k<=28;k++){const a=a0-half+2*half*k/28,t=rayLen(player.x,player.y,a,reach);pts.push(project(player.x+Math.cos(a)*t,player.y+Math.sin(a)*t));}
  g.fillStyle='rgba(4,4,8,.62)';g.fillRect(0,0,b.width,b.height);g.globalCompositeOperation='destination-out';
  const grad=g.createRadialGradient(o.x,o.y,4,o.x,o.y,reach*TILE*zoom);grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(.75,'rgba(0,0,0,.9)');grad.addColorStop(1,'rgba(0,0,0,.25)');
  g.fillStyle=grad;g.beginPath();g.moveTo(o.x,o.y);pts.forEach(p=>g.lineTo(p.x,p.y));g.closePath();g.fill();
  const n=g.createRadialGradient(o.x,o.y-20*zoom,2,o.x,o.y-20*zoom,near*TILE*zoom);n.addColorStop(0,'rgba(0,0,0,.95)');n.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=n;g.beginPath();g.arc(o.x,o.y-20*zoom,near*TILE*zoom,0,Math.PI*2);g.fill();
  g.globalCompositeOperation='source-over';
  // Warm tint inside the beam; exits, the lamp and chests keep a faint glow through the dark.
  g.fillStyle='rgba(255,226,170,.06)';g.beginPath();g.moveTo(o.x,o.y);pts.forEach(p=>g.lineTo(p.x,p.y));g.closePath();g.fill();
  const L=room.exploration.samongR103;for(const [p,col] of [[L.exit,'rgba(170,220,255,.35)'],[L.save,'rgba(255,200,120,.3)'],...L.chests.filter((_,i)=>!(window.__STORYWORLD_GROWTH_R103__?.chestSeen?.(room.samongR103.key+':chest:'+i))).map(q=>[q,'rgba(255,215,120,.22)'])]){if(!p)continue;const q=project(p.x,p.y);const rr=g.createRadialGradient(q.x,q.y-10,1,q.x,q.y-10,26*zoom);rr.addColorStop(0,col);rr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rr;g.beginPath();g.arc(q.x,q.y-10,26*zoom,0,Math.PI*2);g.fill();}}

 // ---- interaction ---------------------------------------------------------------------------
 function nearMine(){if(!here())return null;let best=null,bd=1e9;for(const p of room.props){if(!p.samongR103)continue;const d=Math.hypot(p.x-player.x,p.y-player.y),reach=p.samongR103==='portal'?2.6:1.9;if(d<reach&&d<bd){best=p;bd=d;}}return best;}
 function use(p){const x=room.samongR103;
  if(p.samongR103==='portal'){if(!x.portal)return false;restoreFlash();next();return true;}
  if(p.samongR103==='save'){S.checkpoint={x:p.x+.6,y:p.y+.6};player.hp=Math.max(player.hp,maxHP()*.6);saveGame(false);toast('기억의 등불 · 이 자리에서 다시 시작합니다.',3);showRecords();return true;}
  if(p.samongR103==='chest'){window.__STORYWORLD_GROWTH_R103__?.openChest?.(p);return true;}
  if(p.samongR103==='michaela'){window.__STORYWORLD_GROWTH_R103__?.talkMichaela?.(p);return true;}
  return false;}

 // ---- hooks ---------------------------------------------------------------------------------
 function install(){
  makeNative=makeRoom;
  // The Three terrain chunks read the region layout by zone id; while a stage is active
  // its host id must resolve to the stage layout, not the host's native map.
  const EX=window.__STORYWORLD_EXPLORATION__;if(EX&&typeof EX.layout==='function'){const own={};for(const k of Object.keys(EX))own[k]=EX[k];own.layout=function(id,...a){if(stageRoom&&S.active&&id===stageRoom.id&&typeof layer!=='undefined'&&layer==='DREAM')return stageRoom.exploration;return EX.layout.call(EX,id,...a);};own.samongR103=true;try{window.__STORYWORLD_EXPLORATION__=Object.freeze(own);}catch(e){fail(e);}}
  const getBase=getRoom;getRoom=function(id=zone,l=layer){if(stageRoom&&S.active&&id===stageRoom.id&&l==='DREAM')return stageRoom;return getBase.apply(this,arguments);};
  const enterBase=enterRegion;enterRegion=async function(...a){if(!entering&&S.active)deactivate();return enterBase.apply(this,a);};
  const tickBase=tick;tick=function(dt){const r=tickBase.apply(this,arguments);try{if(here()&&!modal&&!loading&&player.hp>0){const st=room.samongR103.stage;if(st==='survival')tickSurvival(dt);else if(st==='maze')tickMaze(dt);else tickAscent(dt);if(time-(hudAt||0)>.5){hudAt=time;hud();}}}catch(e){fail(e);}return r;};
  const drawBase=draw;draw=function(...a){const r=drawBase.apply(this,a);try{drawFlash();}catch(e){fail(e);}return r;};
  const killBase=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded;const r=killBase.apply(this,[e,...a]);try{if(first&&e?.deadRecorded&&e.samongSurvival&&here()&&room.samongR103.stage==='survival'&&!e.samongR103Silent&&!S.counted.includes(e.id)&&S.kills<GOAL){S.kills++;S.counted.push(e.id);if(S.counted.length>160)S.counted.shift();if(S.kills%111===0||S.kills===GOAL)saveGame(false);}}catch(err){fail(err);}return r;};
  // The host region's native warps stay out of a stage: no markers, no travel, and 길잡이
  // walks toward the stage goal instead.
  if(typeof drawExits==='function'){const exitsBase=drawExits;drawExits=function(...a){if(here())return;return exitsBase.apply(this,a);};}
  if(typeof travel==='function'){const travelBase=travel;travel=function(...a){if(here())return false;return travelBase.apply(this,a);};}
  if(typeof guideStep==='function'){const guideBase=guideStep;let guideAt=0;guideStep=function(dt,...a){if(!here())return guideBase.call(this,dt,...a);try{if(typeof guide!=='undefined'&&guide&&!modal&&!loading&&player.hp>0&&time>=guideAt){guideAt=time+.6;const g=navGoal();if(g&&Math.hypot(g.x-player.x,g.y-player.y)>1.6){route=findPath(player,g);command=null;}}}catch(e){fail(e);}};}
  const finishBase=finishEncounter;finishEncounter=function(...a){if(here())return;return finishBase.apply(this,a);};
  const completeBase=completeRegion;completeRegion=function(id,...a){if(here())return;return completeBase.apply(this,[id,...a]);};
  const interactBase=interact;interact=function(...a){try{if(here()&&!modal&&!loading&&player.hp>0){const p=nearMine();if(p&&use(p))return;if(distance(player,room.objective)<2.7)return;}}catch(e){fail(e);}return interactBase.apply(this,a);};
  const hudBase=updateHUD;updateHUD=function(...a){const r=hudBase.apply(this,a);try{if(here())hud();}catch(e){fail(e);}return r;};
  const deathBase=showDeath;showDeath=function(...a){if(!here())return deathBase.apply(this,a);S.deaths++;clearControls();stopVoice();stopEffects();const x=room.samongR103;openPanel('<div class="eyebrow">DREAM / 사몽</div><h2>기억은 남아 있습니다</h2><p>'+(x.stage==='survival'?'누적 처치 '+S.kills+' / '+GOAL+'는 그대로 이어집니다.':x.stage==='maze'?'마지막으로 켠 등불 앞에서 다시 시작합니다.':'층계의 아래에서 다시 오릅니다.')+'</p><div class="actions"><button id="r103Retry" class="primary">이 단계 다시 시작</button><button id="r103Home">쉼터로 돌아가기</button></div>');button('r103Retry',()=>{player.hp=maxHP();closePanel(true);go(x.ep,x.stage);});button('r103Home',()=>{player.hp=maxHP();closePanel(true);leave();});};
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
 async function start(){if(!unlocked()){toast('STORY 마지막 기억을 마치면 사몽 에피소드가 열립니다.',4);return false;}if(!solo()){toast('사몽 에피소드는 혼자 진행합니다.',3);return false;}if(S.done){S=fresh();}return go(S.ep,S.ep===0?'ascent':S.stage);}
 function hud(){const x=room.samongR103,ep=EP[x.ep],q=id=>document.getElementById(id);const set=(id,t)=>{const el=q(id);if(el)el.textContent=t;};
  set('questTitle','사몽 · '+ep.title);set('regionName',ep.title);set('regionSub',ep.chapter+' · '+(x.stage==='survival'?'생존':x.stage==='maze'?'손전등 미로':'상승'));
  if(x.stage==='survival'){set('questText',x.portal?'문이 열렸습니다. 가운데의 문에서 E':'누적 처치 '+S.kills+' / '+GOAL+' · 동시 출현은 제한됩니다.');set('questDestination','생존전 · '+(ep.mobName||''));set('questUnlock',S.kills>=GOAL?'목표 달성 · 새 적이 나오지 않습니다':'666 누적 처치 후 미로의 문');}
  else if(x.stage==='maze'){set('questText','손전등이 비추는 쪽으로 출구를 찾으세요. 적은 계속 나타납니다.');set('questDestination','미로 · '+(ep.maze||''));set('questUnlock','출구에 닿으면 상승 구간으로 · 등불에서 저장');}
  else{set('questText',x.portal?'문에서 E로 다음 기억으로':x.bossUp?josa(ep.boss.name,'을','를')+' 쓰러뜨리세요':'층계를 따라 위쪽으로 오르세요.');set('questDestination','상승 · '+ep.boss.name);set('questUnlock','보스 처치 후 다음 에피소드 생존전');}
  set('hint',x.stage==='survival'?(x.portal?'가운데의 문 · E':'누적 '+S.kills+' / '+GOAL):x.stage==='maze'?'손전등은 움직이는 쪽을 비춥니다 · 등불에서 저장':(x.portal?'문 · E':'위쪽으로'));
  const badge=q('mobileMapR74'),bt='사몽 · '+ep.title+' · '+(x.stage==='survival'?'생존':x.stage==='maze'?'미로':'상승');if(badge&&badge.textContent!==bt){badge.textContent=bt;badge.title=bt;}
  set('questInlineSummary',(q('questText')?.textContent||'')+' · '+(q('questDestination')?.textContent||''));}
 function inspect(){const r=here()?room:null,x=r?.samongR103;return{revision:REV,resumeNote,state:JSON.parse(JSON.stringify(S)),zone,layer,here:!!r,stage:x?.stage,ep:x?.ep,alive:r?r.enemies.filter(living).length:0,portal:x?.portal||null,bossUp:!!x?.bossUp,boss:x?.boss||null,failures,lastError,donorFail:[...donorFail],layout:r?{bounds:r.exploration.bounds,walls:r.exploration.walls.length,floor:r.exploration.floorCells.length,extra:r.exploration.samongR103}:null};}
 // Test hooks: jump to a stage, add kills (counted through the same kill path), reach a point.
 const test={go:(ep,stage)=>go(ep,stage),kill:(n=1)=>{let k=0;for(const e of [...room.enemies])if(k<n&&living(e)&&e.samongSurvival){e.hp=1;hitEnemy(e,9e9);k++;}return k;},setKills:n=>{S.kills=Math.max(0,Math.min(GOAL,n));},teleport:(x,y)=>{player.x=x;player.y=y;cam={x,y};},near:kind=>room.props.find(p=>p.samongR103===kind)};
 // Compass and 길잡이 point at the stage goal instead of the host region's objective.
 function navGoal(){if(!here())return null;const x=room.samongR103,L=room.exploration.samongR103,pt=(p,label,kind)=>p&&Number.isFinite(p.x+p.y)?{x:p.x,y:p.y,label,kind}:null;
  if(x.portal)return pt(x.portal,x.portal.label||'문','exit');
  if(x.stage==='survival'){let best=null,d=1e9;for(const e of room.enemies)if(living(e)){const k=Math.hypot(e.x-player.x,e.y-player.y);if(k<d){d=k;best=e;}}return best?pt(best,'누적 처치 '+S.kills+'/'+GOAL,'enemy'):pt(L.centre,'생존전','objective');}
  if(x.stage==='maze')return pt(L.exit,'미로 출구','objective');
  const b=room.enemies.find(e=>e.id===x.boss);return x.bossUp&&b&&b.hp>0?pt(b,epOf(x).boss.name,'boss'):pt(L.dais,'위쪽의 보스','objective');}
 const epOf=x=>EP[x.ep];
 window.__STORYWORLD_NAV_GOAL_R103__=navGoal;
 try{install();}catch(e){fail(e);}
 window.__STORYWORLD_SAMONG_R103__=Object.freeze({revision:REV,GOAL,episodes:EP,stages:STAGES,here,start,go,next,showRecords,ending,inspect,test,layoutFor,mazeLayout,state:()=>S,get flashlightActive(){return here()&&room.samongR103.stage==='maze';}});
})();
