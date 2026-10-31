/* R171: 스토리 전투 지도 — 지역마다 서사에 맞춘 작은 배치(사몽 구역의 배치 틀을 참고).
 * 사용자 요청(2026-10-31): "스토리모드도 사몽처럼 맵 다양하게 … 맵자체가 헤비해서 그런거면 … 사몽쪽참고해서 / 서사에 맞게".
 * R81 부터 모든 스토리 전투 지역이 병원 병동 미로 하나(87×113, 바닥 약 8,000칸)를 같이 썼다. 그래서 지도가 다 같아 보이고
 * 사몽 구역(약 2,000칸)보다 네 배 넓어 그리기가 무거웠다. 이 모듈은 지역의 원래 지형 자료
 * (StoryWorldProfilesR74 의 sourceTopology·mode·purposes — 원본 지역 자료에서 온 값)로 배치 틀을 고르고,
 * 같은 진행 골격(입구 → 두 갈래 길 → 중앙 전투실(집결) → 보스 구역 문 → 보스 전투실 → 다음 구역 문)을
 * 약 1,800~3,500칸 크기로 새로 깐다. 진행·저장·문·보스 처리 코드는 그대로 쓰고, 그 코드가 읽는 좌표만 이 지도에서 준다.
 *
 * 배치 틀(사몽 samong-zones-r115.js 의 TPL 을 참고): ward(복도+방) · street(거리+골목+작은 마당) · grove(빈터를 잇는 오솔길)
 *  · bridge(섬과 좁은 다리) · switchback(층층이 꺾이는 계단참) · nave(기둥 늘어선 긴 회랑) · lanes(나란한 길)
 *  · radial(가운데 둥근 홀과 바퀴살 방) · grid / grid-wide(미로 / 넓은 구획 거리).
 * 보스 전투실 모양: disc(원형 결투장·고리·동심원) · pillars(성당·예배실·금고·성·옥좌처럼 기둥 홀) · square(방·집).
 * 보스 전투실은 늘 원래 30칸 틀(6..26) 안에 둔다 — 보스 탄막이 3..27 로 잠기고, 예전 기본 위치(15,13·15,19)도 이 안에 있다.
 *
 * 지역 → 배치 표 (sourceTopology 는 지역 자료 값, 이름은 regionById 제목):
 *  dist00 악마화 나무의 정원 ruined-palace-garden → grove/disc · dist01 거미동굴 webbed-bridges → bridge/disc
 *  dist02 늪지대의 뿔악마 sinking-islets → bridge/disc · dist03 무너진 성 broken-boulevard → street/pillars
 *  dist04 시체들이 되살아난 밤 grave-switchbacks → switchback/square · dist05 일곱 기둥 converging-lanes → lanes/pillars
 *  dist06 추락 circular-duel → radial/disc · ep1a09 주사실 radial-treatment-bays → radial/square
 *  ep1a09b 결전의 날 palace-rescue-courtyard → grove/pillars · ep1a10 환자와 중독의 도시 ruin-grid → grid-wide/square
 *  ep1a11 천사의 가면과 의목사 후보생 halo-arena → radial/disc · ep1b01 솔로몬의 봉인식 seventy-two-node-ring → radial/pillars
 *  ep1b02 나태의 집 compressed-rooms → ward/square · ep1b03 금이 간 안경 mirror-corridors → grid/square
 *  ep1b04 탐식의 주방 counter-maze → grid/square · ep1b05 붉은 하이힐 spotlight-runways → lanes/square
 *  ep1b06 맘몬의 금고 vault-spokes → radial/pillars · ep1b06b 눈보라 속의 소년 frozen-switchbacks → switchback/disc
 *  ep1b07 불을 지른 남자 burning-stairwell → switchback/square · ep1b08 하늘에 서려는 자 vertical-cross-lanes → nave/pillars
 *  ep1b09 생체 부트로더 neural-concentric → radial/disc · u201 방어의 군단 marching-grid → grid-wide/square
 *  u202 잔인한 구원 rising-walls → grid/square · u204 시스템의 거부권 segmented-gates → ward/square
 *  u205 관리자 권한 authority-chambers → ward/square · u206 중앙 코어 이주실 core-concentric → radial/disc
 *  u203 기억의 문 memory-nexus → radial/disc · last304 중립 지역의 재각성 open-meadow-ruins → grove/disc
 *  last305 고블린 두목과 장미 인장 forest-clearings → grove/disc · last302 잠들지 못하는 마을 tile-roof-lanes → street/square
 *  last303 한약과 불면귀 sealed-duel-circle → grove/disc · kair01 최초명령의 세계 core-defense-ring → radial/disc
 *  kair04 예순여섯 수문장 broken-plaza → street/square · kair05 빼앗긴 시간 branching-timepaths → grove/disc
 *  kair06 닫힌 층의 명령 canal-lanes → bridge/square · kair07 검은 공방 forge-switchbacks → switchback/square
 *  kair08 뉴런 게이트 synapse-bridges → bridge/disc · kair09 망각의 묘지 clock-graves → lanes/square
 *  kair10 붕괴 의식장 fractured-dial → radial/disc · murder01 윤하람 traffic-lanes → street/square
 *  murder02 장민재와 새빛호텔 narrow-stairwell → switchback/square · murder04 고서진과 청록빌라 apartment-stairs → ward/square
 *  murder03 옥상의 순환 rooftop-loop → radial/square · cult01 하나로 묶인 악몽 implant-aisles → nave/pillars
 *  cult02 교주가 기다리는 전쟁 choir-halves → nave/pillars · cult05 돌아오는 현실의 기억 organic-vat-maze → grid/square
 *  cult06 처음 세웠던 목표 judgment-grid → grid/square · cult03 사몽의 문턱 three-ring-vault → radial/pillars
 * 그대로 두는 곳: 안전 지역, ep1a08(병원 본편), 협동 모드, DREAM·EGO 방문, 원래 진행 담당이 따로 있는 지역
 *  (hando01·hando02·hando03·kair02·kair03·last301·cult04 — world-combat-r78 의 SPECIAL), 각성 기록이 걸린 지역(firstPost+awakenPre).
 * 방 이름은 지역 자료의 purposes 와 사몽이 이미 쓰는 일반 이름('복도'·'앞방'·'작은 마당'·'다리 위'·'계단참'·'입구')만 쓴다.
 * 끄기: localStorage storyworld.r171.maps = {"on":false} → 예전 병동 미로 하나로 돌아간다.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_STORY_MAPS_R171__)return;
 const REV='R171-story-maps-1',PREF='storyworld.r171.maps';
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,400);};
 const prefs=(()=>{try{const v=JSON.parse(localStorage.getItem(PREF)||'{}');return{on:v?.on!==false};}catch(e){return{on:true};}})();
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const K=(x,y)=>x+':'+y,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
 const SAFE=new Set(['hub','village','dreamRest','restEp1b','restU2','restLast3','restKairo','restHando']);
 const NATIVE=new Set(['hando01','hando02','hando03','kair02','kair03','last301','cult04']);
 const TOPO={
  'ruined-palace-garden':['grove','disc'],'webbed-bridges':['bridge','disc'],'sinking-islets':['bridge','disc'],'broken-boulevard':['street','pillars'],
  'grave-switchbacks':['switchback','square'],'converging-lanes':['lanes','pillars'],'circular-duel':['radial','disc'],'radial-treatment-bays':['radial','square'],
  'palace-rescue-courtyard':['grove','pillars'],'ruin-grid':['grid-wide','square'],'halo-arena':['radial','disc'],'seventy-two-node-ring':['radial','pillars'],
  'compressed-rooms':['ward','square'],'mirror-corridors':['grid','square'],'counter-maze':['grid','square'],'spotlight-runways':['lanes','square'],
  'vault-spokes':['radial','pillars'],'frozen-switchbacks':['switchback','disc'],'burning-stairwell':['switchback','square'],'vertical-cross-lanes':['nave','pillars'],
  'neural-concentric':['radial','disc'],'marching-grid':['grid-wide','square'],'rising-walls':['grid','square'],'segmented-gates':['ward','square'],
  'authority-chambers':['ward','square'],'core-concentric':['radial','disc'],'memory-nexus':['radial','disc'],'open-meadow-ruins':['grove','disc'],
  'forest-clearings':['grove','disc'],'tile-roof-lanes':['street','square'],'sealed-duel-circle':['grove','disc'],'core-defense-ring':['radial','disc'],
  'broken-plaza':['street','square'],'branching-timepaths':['grove','disc'],'canal-lanes':['bridge','square'],'forge-switchbacks':['switchback','square'],
  'synapse-bridges':['bridge','disc'],'clock-graves':['lanes','square'],'fractured-dial':['radial','disc'],'traffic-lanes':['street','square'],
  'narrow-stairwell':['switchback','square'],'apartment-stairs':['ward','square'],'rooftop-loop':['radial','square'],'implant-aisles':['nave','pillars'],
  'choir-halves':['nave','pillars'],'organic-vat-maze':['grid','square'],'judgment-grid':['grid','square'],'three-ring-vault':['radial','pillars']
 };
 // 배치 틀마다 곁방에 붙이는 일반 이름(사몽이 이미 쓰는 이름).
 const SIDE={ward:'앞방',street:'작은 마당',grove:'작은 마당',bridge:'다리 위',switchback:'계단참',nave:'앞방',lanes:'복도',radial:'앞방',grid:'복도','grid-wide':'골목'};
 function choice(profile){const row=TOPO[profile?.sourceTopology];if(row)return{template:row[0],core:row[1],source:'sourceTopology'};
  return{template:profile?.mode==='indoor'?'ward':'grove',core:'square',source:'mode'};}

 // ---- 고정 골격 -------------------------------------------------------------------------------
 // 0 보스 전투실(6..26), 1 다음 구역 앞(위), 2 중앙 전투실(집결, 아래), 3 입구(오른쪽 아래). 두 갈래 길: S(아래 띠), E(오른쪽 띠).
 // R179: 보스 구역 문·다음 구역 문을 병동 미로와 같은 자리(보스 구역 문 20,20 폭 6 · 다음 구역 문 5,6 폭 8)에 둔다. 진행 코드·저장·안내·
 //  이어받은 검사들이 그 문 앞(20,22 · 5,8)과 보스 전투실 안(20,12)을 기준으로 쓴다. 보스 전투실은 6..26 × 6..20, 문에서 중앙 전투실까지는 폭 6 통로,
 //  다음 구역 문 앞에는 작은 앞뜰(1..9 × 6..11)을 둔다.
 const W=68,H=70,CORE={x:6,y:6,w:20,h:14},ALCOVE={x:1,y:1,w:8,h:5},GATHER={x:8,y:30,w:16,h:8},ENTRY={x:50,y:48,w:14,h:12};
 const VEST={x:1,y:6,w:8,h:5},BOSSLINK={x:17,y:20,w:6,h:10};
 const BAND={S:{x0:2,y0:42,x1:49,y1:68,path:[[47,57],[12,57],[12,47]]},E:{x0:30,y0:2,x1:66,y1:40,path:[[57,38],[57,8],[36,8],[36,32]]}};
 const DOOR0={x:20,y:20,width:6,depth:.24,axis:'y'},DOOR2={x:5,y:6,width:8,depth:.24,axis:'y'};
 // R179: 원래 병동 지도는 문이 셋(door-0 보스 구역 문 · door-1 여닫는 일반 문 · door-2 다음 구역 문)이었고, 문 그리기·저장·진행 코드가
 //  그 세 번호를 기대한다(문 목록의 세 번째가 door-2). 입구 아래에 작은 앞방(막다른 곁방)을 하나 두고 그 통로에 door-1 을 단다 —
 //  닫혀 있어도 다른 길을 끊지 않고, 적이 이 방에 놓이지 않게 spawnExclude 로 알린다.
 const CLOSET={x:50,y:62,w:8,h:5},CLOSET_LINK={x:51,y:60,w:5,h:2},DOOR1={x:53.5,y:61,width:5,depth:.24,axis:'y'};
 const inClosetZone=(x,y)=>x>=CLOSET.x-1&&x<CLOSET.x+CLOSET.w+1&&y>=CLOSET_LINK.y&&y<CLOSET.y+CLOSET.h+1;

 // ---- 바닥 깎기 (사몽 carve 와 같은 방식: 방 사각/원 + 방 중심끼리 ㄱ자 통로) ----------------------------
 function carve(rooms,links,cuts){const cells=new Set(),add=(x,y)=>{if(x>=1&&y>=1&&x<W-1&&y<H-1)cells.add(K(x,y));};
  for(const R of rooms){const cx=R.x+R.w/2,cy=R.y+R.h/2;for(let y=R.y;y<R.y+R.h;y++)for(let x=R.x;x<R.x+R.w;x++){if(R.shape==='disc'&&Math.hypot((x+.5-cx)/(R.w/2),(y+.5-cy)/(R.h/2))>1)continue;add(x,y);}}
  const centre=R=>[Math.floor(R.x+R.w/2),Math.floor(R.y+R.h/2)];
  for(const[a,b,w=3,via='hv']of links){const[ax,ay]=centre(rooms[a]),[bx,by]=centre(rooms[b]),pts=[],sx=Math.sign(bx-ax),sy=Math.sign(by-ay);
   if(via==='hv'){for(let x=ax;x!==bx;x+=sx)pts.push([x,ay]);for(let y=ay;;y+=sy){pts.push([bx,y]);if(y===by)break;}}
   else{for(let y=ay;y!==by;y+=sy)pts.push([ax,y]);for(let x=ax;;x+=sx){pts.push([x,by]);if(x===bx)break;}}
   const lo=Math.floor((w-1)/2),hi=w-1-lo;for(const[x,y]of pts)for(let dy=-lo;dy<=hi;dy++)for(let dx=-lo;dx<=hi;dx++)add(x+dx,y+dy);}
  for(const c of cuts||[])for(let y=c.y;y<c.y+c.h;y++)for(let x=c.x;x<c.x+c.w;x++)cells.delete(K(x,y));
  return cells;}

 // ---- 길 위의 정거장: 띠의 길(꺾은선)을 따라 간격 d 로 점을 찍고, 진폭 amp 로 좌우로 흔든다 ------------------------
 function stations(band,d,amp,r){const P=band.path,segs=[];let total=0;for(let i=1;i<P.length;i++){const[ax,ay]=P[i-1],[bx,by]=P[i],l=Math.hypot(bx-ax,by-ay);segs.push({ax,ay,bx,by,l,at:total});total+=l;}
  const n=Math.max(3,Math.round(total/d)+1),out=[];
  for(let i=0;i<n;i++){const s=total*i/(n-1);let g=segs[segs.length-1];for(const q of segs)if(s<=q.at+q.l+1e-9){g=q;break;}const t=g.l?(s-g.at)/g.l:0,dx=(g.bx-g.ax)/(g.l||1),dy=(g.by-g.ay)/(g.l||1);
   const side=amp&&i>0&&i<n-1?(i%2?1:-1)*amp*(.7+.3*r()):0;out.push({x:clamp(g.ax+(g.bx-g.ax)*t-dy*side,band.x0+4,band.x1-4),y:clamp(g.ay+(g.by-g.ay)*t+dx*side,band.y0+4,band.y1-4),dx,dy});}
  return out;}
 const box=(cx,cy,w,h,extra)=>({x:Math.round(cx-w/2),y:Math.round(cy-h/2),w,h,...extra});
 const overlaps=(a,b,m=1)=>a.x<b.x+b.w+m&&b.x<a.x+a.w+m&&a.y<b.y+b.h+m&&b.y<a.y+a.h+m;
 const inside=(R,band)=>R.x>=band.x0&&R.y>=band.y0&&R.x+R.w<=band.x1&&R.y+R.h<=band.y1;

 // 한 띠를 채운다. 돌려주는 값: rooms(전역 번호는 호출자가 붙인다), links(띠 안 번호), first/last(입구·집결 쪽 방), main(본길 방들).
 const T={
  ward(b,r,P){return chain(b,r,P,{d:8,amp:0,station:()=>[5,5,'corridor'],link:3,side:()=>[ri(r,8,10),ri(r,6,8),'room'],sideLink:3,sideGap:2});},
  street(b,r,P){return chain(b,r,P,{d:9,amp:1,station:()=>[7,7,'street'],link:6,side:k=>k%2?[ri(r,7,8),ri(r,6,7),'yard']:null,sideLink:3,sideGap:4});},
  grove(b,r,P){return chain(b,r,P,{d:10,amp:4,station:()=>{const s=2*ri(r,4,5)+1;return[s,s,'yard','disc'];},link:4,side:k=>k%2?null:(()=>{const s=2*ri(r,3,4)+1;return[s,s,'yard','disc'];})(),sideLink:3,sideGap:2});},
  bridge(b,r,P){return chain(b,r,P,{d:10,amp:6,station:k=>[7,7,'yard',k%2?'disc':null],link:3,side:k=>k%3===1?[6,6,'yard','disc']:null,sideLink:3,sideGap:3});},
  switchback(b,r,P){return chain(b,r,P,{d:8,amp:7,station:(k,s)=>Math.abs(s.dx)>Math.abs(s.dy)?[6,12,'room']:[12,6,'room'],link:3,side:()=>null});},
  nave(b,r,P){return chain(b,r,P,{d:9,amp:0,station:()=>[9,9,'hall'],link:7,pillars:true,side:k=>k%2?[6,6,'room']:null,sideLink:3,sideGap:2});},
  lanes(b,r,P){return lanes(b,r,P);},
  radial(b,r,P){return radial(b,r,P);},
  grid(b,r,P){return grid(b,r,P,{pitch:6,cw:3});},
  'grid-wide'(b,r,P){return grid(b,r,P,{pitch:8,cw:5});}
 };
 function name(P,k){const list=P.purposes?.length?P.purposes:['전투 구역'];return list[k%list.length];}
 function chain(b,r,P,o){const st=stations(b,o.d,o.amp,r),rooms=[],links=[],cuts=[],main=[];
  st.forEach((s,k)=>{const[w,h,kind,shape]=o.station(k,s);let R=box(s.x,s.y,w,h,{kind,shape,name:name(P,k)});R.x=clamp(R.x,b.x0,b.x1-R.w);R.y=clamp(R.y,b.y0,b.y1-R.h);rooms.push(R);main.push(rooms.length-1);
   if(k)links.push([rooms.length-2,rooms.length-1,o.link,k%2?'hv':'vh']);});
  // 곁방: 본길 방 옆(진행 방향의 수직)에 붙인다. 띠 밖이거나 다른 방과 겹치면 놓지 않는다.
  st.forEach((s,k)=>{const spec=o.side?.(k);if(!spec)return;const[w,h,kind,shape]=spec,M=rooms[main[k]];
   for(const sgn of k%4<2?[1,-1]:[-1,1]){const off=(Math.abs(s.dx)>Math.abs(s.dy)?(M.h+h)/2:(M.w+w)/2)+(o.sideGap||2),cx=M.x+M.w/2-s.dy*off*sgn,cy=M.y+M.h/2+s.dx*off*sgn,R=box(cx,cy,w,h,{kind,shape,name:SIDE[P.template]||'앞방',side:true});
    if(!inside(R,b)||rooms.some(Q=>overlaps(Q,R)))continue;rooms.push(R);links.push([main[k],rooms.length-1,o.sideLink||3,Math.abs(s.dx)>Math.abs(s.dy)?'vh':'hv']);break;}});
  if(o.pillars)for(let k=1;k<main.length;k++){const A=rooms[main[k-1]],B=rooms[main[k]],ax=A.x+A.w/2,ay=A.y+A.h/2,bx=B.x+B.w/2,by=B.y+B.h/2;
   // 긴 회랑의 두 줄 기둥(통로 가운데는 비운다). 진행 방향에 따라 좌우로.
   if(Math.abs(bx-ax)>Math.abs(by-ay)){const x=Math.round((ax+bx)/2)-1;for(const dy of[-3,2])cuts.push({x,y:Math.floor(ay)+dy,w:2,h:1});}
   else{const y=Math.round((ay+by)/2)-1;for(const dx of[-3,2])cuts.push({x:Math.floor(ax)+dx,y,w:1,h:2});}}
  return{rooms,links,cuts,first:main[0],last:main[main.length-1],main};}
 function lanes(b,r,P){// 나란한 두 길: 본길(5) 하나와 곁길(3) 하나를 띠의 길을 따라 놓고 시작·가운데·끝에서 잇는다.
  const st=stations(b,9,0,r),rooms=[],links=[],main=[],alt=[];
  st.forEach((s,k)=>{const R=box(s.x,s.y,5,5,{kind:'corridor',name:name(P,k)});R.x=clamp(R.x,b.x0,b.x1-5);R.y=clamp(R.y,b.y0,b.y1-5);rooms.push(R);main.push(rooms.length-1);if(k)links.push([main[k-1],main[k],5,k%2?'hv':'vh']);});
  st.forEach((s,k)=>{const off=8+(k%2),R=box(s.x-s.dy*off,s.y+s.dx*off,4,4,{kind:'corridor',name:'복도',side:true});R.x=clamp(R.x,b.x0,b.x1-4);R.y=clamp(R.y,b.y0,b.y1-4);
   if(rooms.some((Q,i)=>!alt.includes(i)&&overlaps(Q,R,0))){alt.push(-1);return;}rooms.push(R);alt.push(rooms.length-1);});
  let prev=-1;alt.forEach((a,k)=>{if(a<0){prev=-1;return;}if(prev>=0)links.push([prev,a,3,k%2?'vh':'hv']);else links.push([main[k],a,3,'hv']);prev=a;});
  const mid=Math.floor(alt.length/2);for(const k of[mid,alt.length-1])if(alt[k]>=0)links.push([main[k],alt[k],3,'vh']);
  // 끝에 작은 방 하나(무대 뒤·묘지 끝 같은 자리 — 일반 이름만).
  return{rooms,links,cuts:[],first:main[0],last:main[main.length-1],main};}
 function radial(b,r,P){// 띠 가운데 둥근 홀 + 바퀴살 방. 들어오는 길·나가는 길은 바퀴살 방을 지난다.
  const cx=Math.round((b.x0+b.x1)/2),cy=Math.round((b.y0+b.y1)/2),R0=Math.min(8,Math.floor((Math.min(b.x1-b.x0,b.y1-b.y0)-14)/2)),hub=box(cx,cy,2*R0+1,2*R0+1,{kind:'hall',shape:'disc',name:name(P,0)}),rooms=[hub],links=[],main=[0];
  const P0=b.path[0],P1=b.path[b.path.length-1],ang0=Math.atan2(P0[1]-cy,P0[0]-cx),n=ri(r,4,6);let first=-1,last=-1,bestF=1e9,bestL=1e9;
  for(let i=0;i<n;i++){const a=ang0+i*2*Math.PI/n,d=R0+7,w=ri(r,6,8),h=ri(r,6,7),R=box(cx+Math.cos(a)*d,cy+Math.sin(a)*d,w,h,{kind:'room',name:name(P,i+1)});R.x=clamp(R.x,b.x0,b.x1-w);R.y=clamp(R.y,b.y0,b.y1-h);
   if(rooms.some(Q=>Q!==hub&&overlaps(Q,R,1)))continue;rooms.push(R);const k=rooms.length-1;links.push([0,k,3,Math.abs(Math.cos(a))>Math.abs(Math.sin(a))?'hv':'vh']);main.push(k);
   const c=[R.x+R.w/2,R.y+R.h/2],f=Math.hypot(c[0]-P0[0],c[1]-P0[1]),l=Math.hypot(c[0]-P1[0],c[1]-P1[1]);if(f<bestF){bestF=f;first=k;}if(l<bestL&&k!==first){bestL=l;last=k;}}
  if(last<0||last===first)last=0;
  // 바깥 고리: 바퀴살 방끼리 하나 걸러 이어 원형 순환(고리·동심원) 느낌을 낸다.
  const spokes=main.slice(1);for(let i=0;i<spokes.length;i+=2){const a=spokes[i],c=spokes[(i+1)%spokes.length];if(a!==c)links.push([a,c,3,'hv']);}
  return{rooms,links,cuts:[],first:first<0?0:first,last,main};}
 function grid(b,r,P,o){// 미로/구획 거리: 띠를 격자로 나눠 DFS 로 잇고 조금 되돌이 길을 둔다(사몽 grid 틀과 같은 방식).
  const S=o.pitch,cw=o.cw,C=Math.floor((b.x1-b.x0-cw)/S)+1,Rn=Math.floor((b.y1-b.y0-cw)/S)+1,rooms=[],links=[],id=(i,j)=>j*C+i,adj=new Map();
  for(let j=0;j<Rn;j++)for(let i=0;i<C;i++)rooms.push({x:b.x0+i*S,y:b.y0+j*S,w:cw,h:cw,kind:'corridor',name:(i+j)%5?'복도':name(P,i+j)});
  const link=(a,c)=>{links.push([a,c,cw,'hv']);(adj.get(a)||adj.set(a,[]).get(a)).push(c);(adj.get(c)||adj.set(c,[]).get(c)).push(a);};
  const near=([x,y])=>{let best=0,d=1e9;rooms.forEach((R,k)=>{const q=Math.hypot(R.x+cw/2-x,R.y+cw/2-y);if(q<d){d=q;best=k;}});return best;};
  const first=near(b.path[0]),last=near(b.path[b.path.length-1]),seen=new Set([first]),stack=[first];
  while(stack.length){const at=stack[stack.length-1],i=at%C,j=Math.floor(at/C),nb=[[i+1,j],[i-1,j],[i,j+1],[i,j-1]].filter(([a,c])=>a>=0&&c>=0&&a<C&&c<Rn&&!seen.has(id(a,c)));
   if(!nb.length){stack.pop();continue;}const[a,c]=nb[Math.floor(r()*nb.length)];seen.add(id(a,c));link(at,id(a,c));stack.push(id(a,c));}
  for(let j=0;j<Rn;j++)for(let i=0;i<C;i++){const a=id(i,j);for(const c of[i+1<C?id(i+1,j):-1,j+1<Rn?id(i,j+1):-1])if(c>=0&&!(adj.get(a)||[]).includes(c)&&r()<(cw>3?.35:.15))link(a,c);}
  // 넓은 구획(도시·행군 격자)은 몇 칸을 광장으로 넓힌다.
  if(cw>3)for(let k=0;k<rooms.length;k+=ri(r,5,7)){const R=rooms[k];if(k===first||k===last)continue;rooms[k]={...R,x:R.x-1,y:R.y-1,w:R.w+2,h:R.h+2,kind:'yard',name:'작은 마당'};}
  return{rooms,links,cuts:[],first,last,main:[first,last]};}

 // ---- 지역 하나의 배치 ---------------------------------------------------------------------------
 function plan(id,profile){const P0=choice(profile),r=rng(hash('r171:'+id)),P={...P0,purposes:profile?.purposes||[]};
  const rooms=[{...CORE,kind:'hall',shape:null,name:'보스 전투실'},{...ALCOVE,kind:'room',name:'다음 구역 문'},{...GATHER,kind:'hall',name:'중앙 전투실'},{...ENTRY,kind:'yard',name:'입구'}];
  const links=[],cuts=[];
  /* 보스 전투실 모양. pillars: 기둥 홀(2×2 기둥 넷). disc: 앞뜰(북서)·문(남쪽 가운데 오른편)을 빼고 모서리를 둥글게 깎고 가운데를 도는 기둥 고리(1칸 기둥 여섯). */
  if(P.core==='pillars')for(const x of[10,20])for(const y of[9,15])cuts.push({x,y,w:2,h:2});
  if(P.core==='disc'){const R=5,corner=(cx,cy,sx,sy)=>{for(let dy=0;dy<R;dy++)for(let dx=0;dx<R;dx++)if(Math.hypot(R-dx-.5,R-dy-.5)>R)cuts.push({x:cx+sx*dx,y:cy+sy*dy,w:1,h:1});};
   corner(CORE.x+CORE.w-1,CORE.y,-1,1);corner(CORE.x,CORE.y+CORE.h-1,1,-1);
   for(let k=0;k<6;k++){const a=k*Math.PI/3;cuts.push({x:Math.floor(16+5*Math.cos(a)),y:Math.floor(13+5*Math.sin(a)),w:1,h:1});}}
  const branch={};
  for(const key of['S','E']){const band=BAND[key],part=T[P.template](band,r,P),base=rooms.length;
   part.rooms.forEach(R=>rooms.push({...R,band:key}));for(const[a,b,w,via]of part.links)links.push([a+base,b+base,w,via]);cuts.push(...part.cuts);
   links.push([3,part.first+base,key==='S'?5:5,key==='S'?'hv':'vh']);links.push([part.last+base,2,key==='S'?5:5,key==='S'?'vh':'vh']);
   branch[key]={first:part.first+base,last:part.last+base,main:part.main.map(k=>k+base),rooms:part.rooms.map((_,k)=>k+base)};}
  /* 번호가 붙는 방(노드)은 앞방까지. aux 는 바닥만 깎는 통로·앞뜰(노드 번호 뒤쪽이라 앞 번호를 흔들지 않는다). */
  rooms.push({...CLOSET,kind:'room',name:'앞방',closet:true},{...CLOSET_LINK,kind:'corridor',aux:true},{...VEST,kind:'room',aux:true},{...BOSSLINK,kind:'corridor',aux:true});
  const cells=carve(rooms,links,cuts);
  return{id,template:P.template,core:P.core,source:P0.source,topology:profile?.sourceTopology||null,rooms,links,cuts,cells,branch};}

 // 바닥 칸 → 바닥 사각형·경계 벽(사몽 build 와 같은 방식).
 function geometry(cells,height=2.7){const has=(x,y)=>cells.has(K(x,y)),floorCells=[...cells].map(k=>k.split(':').map(Number)).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  const floorRects=[];{let active=new Map();for(let y=0;y<H;y++){const row=new Map();let x=0;while(x<W){if(!has(x,y)){x++;continue;}const s=x;while(has(x,y))x++;const k=s+':'+x,old=active.get(k);if(old&&old.y+old.depth===y){old.depth++;row.set(k,old);}else{const R={x:s,y,width:x-s,depth:1};floorRects.push(R);row.set(k,R);}}active=row;}}
  const seg=new Map(),edge=(axis,fixed,at)=>{const k=axis+':'+fixed;if(!seg.has(k))seg.set(k,[]);seg.get(k).push(at);};
  for(const[x,y]of floorCells){if(!has(x,y-1))edge('h',y,x);if(!has(x,y+1))edge('h',y+1,x);if(!has(x-1,y))edge('v',x,y);if(!has(x+1,y))edge('v',x+1,y);}
  const walls=[];for(const[k,list]of seg){const[axis,n]=k.split(':'),fixed=Number(n),a=[...new Set(list)].sort((p,q)=>p-q);for(let i=0;i<a.length;){const s=a[i++];let e=s+1;while(a[i]===e){e++;i++;}const h=axis==='h',endpoints=h?[[s,fixed],[e,fixed]]:[[fixed,s],[fixed,e]];
   walls.push({id:'story-r171-wall:'+walls.length,x:h?(s+e)/2:fixed,y:h?fixed:(s+e)/2,width:h?e-s:.24,depth:h?.24:e-s,height,angle:0,endpoints,annex:true,worldWardR81:true,storyMapR171:true,analyticBounds12:h?[s,fixed-.12,e,fixed+.12]:[fixed-.12,s,fixed+.12,e]});}}
  return{floorCells,floorRects,walls};}
 // 4방향 BFS(바닥 칸). 문은 칸을 막지 않는다 — 문은 진행 단계가 연다.
 function bfs(cells,from){const start=K(Math.floor(from.x),Math.floor(from.y)),dist=new Map([[start,0]]),q=[start];if(!cells.has(start))return dist;for(let i=0;i<q.length;i++){const k=q[i],[x,y]=k.split(':').map(Number);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=K(x+dx,y+dy);if(cells.has(n)&&!dist.has(n)){dist.set(n,dist.get(k)+1);q.push(n);}}}return dist;}
 const centre=R=>({x:R.x+R.w/2,y:R.y+R.h/2});
 function floorNear(cells,p,radius=4){const x0=Math.floor(p.x),y0=Math.floor(p.y);if(cells.has(K(x0,y0)))return{x:x0+.5,y:y0+.5};for(let r=1;r<=radius;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(cells.has(K(x0+dx,y0+dy)))return{x:x0+dx+.5,y:y0+dy+.5};return null;}
 const solid3=(cells,x,y)=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!cells.has(K(x+dx,y+dy)))return false;return true;};

 // ---- 병동 미로 자리에 놓을 배치 ----------------------------------------------------------------
 function build(id,base,profile){const p=plan(id,profile),{floorCells,floorRects,walls}=geometry(p.cells),art=base?.surface?.art;
  const nodes=p.rooms.map((R,i)=>{const c=centre(R),f=p.cells.has(K(Math.floor(c.x),Math.floor(c.y)))?c:floorNear(p.cells,c,6)||c;
   return{id:i,name:R.name,x:f.x,y:f.y,width:R.w,depth:R.h,radius:Math.min(R.w,R.h)/2,shape:R.shape==='disc'?'round':'square',storyMapR171:R.kind,
    ...(i===0?{bossCoreR78:true}:{}),...(R.closet?{closetR179:true}:{}),...(i>=2&&i!==3?{box:[R.x,R.y,R.x+R.w,R.y+R.h]}:{})};}).filter((n,i)=>!p.rooms[i].aux);
  const closetId=p.rooms.findIndex(R=>R.closet);
  // 순찰 자리(사이 점): 방 사이 길에도 적이 설 자리를 둔다(9칸 간격 순찰지가 모자라지 않게).
  const keyed=floorCells.filter(([x,y])=>(x>=28||y>=40)&&!inClosetZone(x,y)).map(([x,y])=>({x,y,k:hash(id+':wp:'+x+':'+y)})).sort((a,b)=>a.k-b.k);
  for(const c of keyed){if(nodes.length>=48)break;const q={x:c.x+.5,y:c.y+.5};if(!solid3(p.cells,c.x,c.y))continue;if(nodes.some(n=>Math.hypot(n.x-q.x,n.y-q.y)<7))continue;
   nodes.push({id:nodes.length,name:'길목',x:q.x,y:q.y,width:3,depth:3,radius:1.5,shape:'square',storyMapR171:'waypoint',box:[q.x-3,q.y-3,q.x+3,q.y+3]});}
  const entryPoint={x:ENTRY.x+ENTRY.w/2+.5,y:ENTRY.y+ENTRY.h-2.5},entry={id:'r171-entry',x:entryPoint.x,y:entryPoint.y,node:3,dx:-1,dy:-1};
  const gather=centre(GATHER),boss={x:16,y:13},portalNext={x:5,y:3.5};
  const along=key=>{const ids=p.branch[key].main.length>=3?p.branch[key].main:p.branch[key].rooms;return ids.map(i=>nodes[i]).filter(Boolean);};
  // 두 갈래 길의 적 자리: 입구 쪽에서 집결 쪽까지 고르게(최대 8곳).
  const spread=(list,n)=>{const out=[];for(let i=0;i<n&&list.length;i++){const q=list[Math.min(list.length-1,Math.round(i*(list.length-1)/Math.max(1,n-1)))];if(!out.includes(q))out.push(q);}return out.map(q=>({x:q.x,y:q.y}));};
  const sideNodes=key=>{const own=new Set(p.branch[key].rooms);return nodes.filter(n=>own.has(n.id)||(n.storyMapR171==='waypoint'&&(key==='S'?n.y>=40:n.y<40)));};
  const routeSpawns={'1':spread(sideNodes('S').filter(n=>Math.hypot(n.x-entry.x,n.y-entry.y)>8),8),'2':spread(sideNodes('E').filter(n=>Math.hypot(n.x-entry.x,n.y-entry.y)>8),8)};
  const rallySpots=[];for(let y=GATHER.y+1.5;y<GATHER.y+GATHER.h-1;y+=2.2)for(let x=GATHER.x+1.5;x<GATHER.x+GATHER.w-1;x+=2.4)rallySpots.push({x:+x.toFixed(2),y:+y.toFixed(2)});
  const fieldAnchors=[...spread(along('S'),3),...spread(along('E'),3)];
  /* R179: 적 자리(두 갈래 길·집결·중간보스·보스)는 사방 한 칸이 모두 바닥인 칸으로 옮겨 둔다 — 몸이 큰 적(반지름 1 안쪽)도 벽에 걸치지 않게.
     실제로 놓을 때는 world-combat-r78 의 choose()가 blocked(몸 반지름+.12)로 한 번 더 비는 자리를 찾는다. */
  const clear=q=>{const x0=Math.floor(q.x),y0=Math.floor(q.y);if(solid3(p.cells,x0,y0))return q;for(let r=1;r<=4;r++){let best=null,bd=1e9;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=x0+dx,y=y0+dy;if(inClosetZone(x,y)||!solid3(p.cells,x,y))continue;const d=Math.hypot(x+.5-q.x,y+.5-q.y);if(d<bd){bd=d;best={x:x+.5,y:y+.5};}}if(best)return best;}return q;};
  for(const k of['1','2'])routeSpawns[k]=routeSpawns[k].map(clear);
  for(let i=0;i<rallySpots.length;i++)rallySpots[i]=clear(rallySpots[i]);
  for(let i=0;i<fieldAnchors.length;i++)fieldAnchors[i]=clear(fieldAnchors[i]);
  const bossPoints=[{x:16,y:12},{x:21,y:15},{x:16,y:9},{x:11.5,y:16.5},{x:20,y:17}].map(clear);
  const doors=[{id:'door-0',...DOOR0,reach:3,closed:true,edge:[0,2],name:'보스 구역 문',r81WardDoor:true,r78BossDoor:true},{id:'door-1',...DOOR1,reach:3,closed:true,edge:[3,closetId],name:'앞방 문',r81WardDoor:true},{id:'door-2',...DOOR2,reach:3,closed:true,edge:[0,1],name:'다음 구역 문',r81WardDoor:true}];
  const edges=[[0,1,8],[0,2,6],...p.links.map(([a,b,w])=>[a,b,w]),[3,closetId,5]];
  const purposes=profile?.purposes?.length?profile.purposes:['전투 구역','연결 회랑','외곽 전투 구역'];
  const rooms=nodes.map(n=>({id:n.id,x:n.x,y:n.y,width:n.width,depth:n.depth,name:n.name,purpose:n.id===0?'보스 전투실':n.name||purposes[n.id%purposes.length],storyZone:id,...(n.id===0?{bossRoom:true}:{})}));
  const combat=nodes.filter(n=>n.id!==0&&n.id!==1&&n.id!==3&&n.id!==closetId).map(n=>n.id),routeS=[3,...p.branch.S.main,2],routeE=[3,...p.branch.E.main,2];
  const mode=profile?.mode==='indoor'?'indoor':profile?.mode==='cavern'?'cavern':'outdoor';
  const L={...(base||{}),floorCells,floorRects,walls:art?.path?walls.map(w=>({...w,path:art.path})):walls,nodes,edges,bounds:[0,0,W,H],entry,entrance:{x:entry.x,y:entry.y},starts:[{...entry}],
   type:'r171-story-narrative-map',coreFloorRects:[],connectorFloorRects:[],backdropRects:[],fogRects:[],chunkMinX:0,chunkMinY:0,chunkSize:10,chunkColumns:Math.ceil(W/10),chunkRows:Math.ceil(H/10),
   renderEnvelope:{u0:-H-4,u1:W+4,v0:-4,v1:W+H+4},originalEncounterBounds:[7,7,25,25],bossRoomNodeId:0,bossDoorId:'door-0',midbossRoomNodeId:2,combatRoomNodeIds:combat,visitRoute:routeS,
   worldR74:{...(base?.worldR74||{}),doors,rooms,corridors:edges.map(([from,to,width])=>({from,to,width,kind:from===0||to===0?'boss-approach':'r171-'+p.template})),wallCount:walls.length,floorCount:floorCells.length,nativeCorePreserved:false},
   worldR78:{...(base?.worldR78||{}),version:2,zoneId:id,maze:'r171-'+p.template,bossRoomNodeId:0,bossDoorId:'door-0',midbossRoomNodeId:2,combatRoomNodeIds:combat,canonicalRoomPurposes:[...purposes],routeNodeIds:routeS.slice(0,-1),routeBranches:[routeS.slice(0,-1),routeE.slice(0,-1)]},
   worldWardR81:{...(base?.worldWardR81||{}),revision:'story-r171',source:'r171-'+p.template,bossBounds:[CORE.x,CORE.y,CORE.x+CORE.w,CORE.y+CORE.h],bossAnchor:boss,gatherAnchor:gather,arrivalAnchor:gather,portalNext,portalPrevious:{x:entry.x,y:entry.y},
    fieldAnchors,physicalDoorIds:doors.map(d=>d.id),routeSpawns,rallySpots,bossPoints,routeSplit:{x:ENTRY.x,y:ENTRY.y}},
   spawnExclude:[[CLOSET.x-1,CLOSET_LINK.y,CLOSET.x+CLOSET.w+1,CLOSET.y+CLOSET.h+1]],
   storyMapR171:{revision:REV,template:p.template,core:p.core,source:p.source,topology:p.topology,mode,cells:floorCells.length,walls:walls.length,rooms:p.rooms.filter(R=>!R.aux).length,closet:closetId,waypoints:nodes.length-p.rooms.filter(R=>!R.aux).length}};
  for(const key of['hospitalCoreB2','hospitalDoorsB3','hospitalAnalytic12','hospitalBoundary12','hospitalVisualWalls12','hospitalPreviousWalls12','hospitalWalkPolygons12','hospitalWalkArea12','hospitalLayoutRevision','hospitalPrototypeB1','doorUV','gate','walkableCellCount'])delete L[key];
  return L;}

 // ---- 게임에 잇기 ----------------------------------------------------------------------------------
 const coop=()=>window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';
 const profiles=()=>(typeof StoryWorldProfilesR74!=='undefined'?StoryWorldProfilesR74:window.StoryWorldProfilesR74)?.profiles||{};
 const region=id=>typeof regionById!=='undefined'?regionById[id]:null;
 const awakening=id=>(region(id)?.records||[]).some(v=>v.firstPost&&v.awakenPre);
 function eligible(id,l){if(!prefs.on||l!=='STORY'||window.__STORYWORLD_R81_EGO_BUILD__||coop()!=='off')return false;if(!id||SAFE.has(id)||NATIVE.has(id)||id==='ep1a08')return false;
  const d=region(id);return!!d&&!d.safe&&!!d.theme&&!!profiles()[id]&&!awakening(id);}
 const cache=new Map(),stats={built:0,used:0,fallback:0,rooms:0};let EX0=null;
 function layoutFor(id){if(cache.has(id))return cache.get(id);const base=EX0?.layout?.(id,'STORY');
  // 병동 미로(R81)가 아닌 경로(예전 R74 배치 등)로 만들어진 지역은 건드리지 않는다.
  if(!base||base.type!=='r81-story-ward-maze'||!base.worldWardR81){stats.fallback++;return null;}
  let L=null;try{L=build(id,base,profiles()[id]);window.__STORYWORLD_ENVIRONMENT_R81__?.surface?.(L,id);stats.built++;}catch(e){fail(e);L=null;}
  cache.set(id,L);while(cache.size>12)cache.delete(cache.keys().next().value);return L;}
 function installExploration(){const EX=window.__STORYWORLD_EXPLORATION__;if(!EX||EX.storyMapR171||typeof EX.layout!=='function')return!!EX?.storyMapR171;EX0=EX;
  const own={};for(const k of Object.keys(EX))own[k]=EX[k];
  own.layout=function(id,l=(typeof layer!=='undefined'?layer:'STORY'),...a){if(eligible(id,l)){const L=layoutFor(id);if(L){stats.used++;return L;}}return EX.layout.call(EX,id,l,...a);};own.storyMapR171=true;
  try{window.__STORYWORLD_EXPLORATION__=Object.freeze(own);}catch(e){fail(e);return false;}return true;}
 // makeRoom 을 병동 미로 붙이기(phase1-original-adapter) 보다 먼저 감싼다: 방이 처음부터 이 지도를 가지면 그 붙이기는 건너뛴다.
 if(typeof makeRoom==='function'){const base=makeRoom;makeRoom=function(id,l,...a){const r=base.call(this,id,l,...a);try{if(r&&!r.exploration&&eligible(r.id,r.layer||l)){installExploration();const L=layoutFor(r.id);if(L){r.exploration=L;stats.rooms++;}}}catch(e){fail(e);}return r;};}
 // 예전(병동 미로) 저장의 위치가 이 지도에서 벽 속이면 원래 복원 코드는 (15,19)로 옮긴다 — 그 자리는 여기서 보스 전투실 안이라
 // 보스 구역 문이 열리기 전이면 갇힌다. 그 경우에만 입구로 옮긴다(보스 단계 이후·정리된 지역은 그대로).
 function rescue(){try{const L=typeof room!=='undefined'?room?.exploration:null;if(!L?.storyMapR171||typeof player==='undefined'||!player)return false;
  const s=window.__STORYWORLD_WORLD_COMBAT_R78__?.state?.(room),open=room.cleared||['boss','exit','exitStory','done'].includes(s?.phase);
  const inCore=player.x>CORE.x&&player.x<CORE.x+CORE.w&&player.y>CORE.y-6&&player.y<CORE.y+CORE.h+2,stuck=typeof blocked==='function'&&blocked(player.x,player.y,.29,room);
  if(!(stuck||inCore&&!open))return false;const p=L.entry;player.x=p.x;player.y=p.y;try{cam={x:p.x,y:p.y};route=[];command=null;target=null;}catch(e){}stats.rescued=(stats.rescued||0)+1;return true;}catch(e){fail(e);return false;}}
 function wrapLate(){if(typeof restoreSave==='function'&&!restoreSave.storyMapR171){const b=restoreSave;restoreSave=async function(...a){const out=await b.apply(this,a);if(out!==false)rescue();return out;};restoreSave.storyMapR171=true;}
  if(typeof enterRegion==='function'&&!enterRegion.storyMapR171){const b=enterRegion;enterRegion=async function(...a){const out=await b.apply(this,a);if(out!==false)rescue();return out;};enterRegion.storyMapR171=true;}}
 if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('DOMContentLoaded',()=>{try{installExploration();if(prefs.on)wrapLate();}catch(e){fail(e);}});
 function setPref(v){try{localStorage.setItem(PREF,JSON.stringify({on:v?.on!==false}));}catch(e){}return{on:v?.on!==false,reload:true};}
 function inspect(){const L=typeof room!=='undefined'?room?.exploration:null;return{revision:REV,prefs:{...prefs},failures,lastError,stats:{...stats},cached:[...cache.keys()],current:L?.storyMapR171||null,browser:false,GPU:false};}
 window.__STORYWORLD_STORY_MAPS_R171__=Object.freeze({revision:REV,TOPO,choice,plan,build,geometry,bfs,eligible,layoutFor,inspect,setPref,prefs:()=>({...prefs}),W,H});
})();
