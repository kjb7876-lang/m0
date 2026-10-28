/* R115: 사몽 구역(서브맵) — 한 에피소드를 원문의 장소 이동 순서대로 여러 구역으로 나눈다.
 * 구역마다 고정 id(sz115-<장>-<번호>), 방·복도·층 배치, 목표(처치 수·도달·단서·잠입·진술)가 있다.
 * samong-r103.js 가 layoutFor / buildRoom / tick / use / navGoal 에서 이 모듈을 먼저 묻는다.
 * 전투(combat)는 R103 생존전, 미로(maze)는 손전등 미로, 대면(confront)은 상승 보스맵의 규칙을 빌리고,
 * 탐색(explore)은 원문 단서를 읽어야 다음 문이 열린다. 원문은 samong-text-r103.js 의 문단만 보여 준다.
 * 저장은 R103 의 samongR103 안(zone, zoneDone, zoneRead, zoneSolve)에 둔다. 구버전 저장은 지우지 않고
 * 같은 장의 구역으로 옮긴다. 파일럿: S-02 학교 8구역. Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SAMONG_ZONES_R115__)return;
 const REV='R115-samong-zones-1';
 const TEXT=()=>window.__STORYWORLD_SAMONG_TEXT_R103__?.sections||{};
 const SM=()=>window.__STORYWORLD_SAMONG_R103__;
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,400);};
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};
 const K=(x,y)=>x+':'+y;
 const say=(t,s)=>{try{if(typeof toast==='function')toast(t,s);}catch(e){}};
 const esc=s=>typeof escapeHTML==='function'?escapeHTML(String(s)):String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

 // ---- 구역 정의 (설계 문서 "사몽~미카엘라 엔딩 맵 확장 설계안" 표의 순서) ------------------------------
 // kind: explore 탐색 | maze 손전등 미로 | combat 전투 | confront 대면.
 // rooms: {x,y,w,h, kind room|hall|corridor|stair|yard, name, wall(높이), grid{kind,cols,rows,x,y,dx,dy}, along[[소품,변,간격]]}.
 // links: [방a, 방b, 폭, 'hv'|'vh'] 방 중심끼리 잇는 복도. clues: 원문 단서 {room, at:[dx,dy], key, sub, n, label, prop, after}.
 // cue: 들어설 때 한 번 보여 주는 원문. goal: {clues:true}|{kills:n}|{reach:true}. 좌표는 타일 단위.
 const STUDENT=[['ep1a08','a08-s1'],['u204','u204-e2']],WRITING=[['murder04','murder04-e2'],['ep1a08','a08-s1']],PATROL=['ep1a08','mb-ep1a08'];
 const CH={
  'S-02':[
   {id:'sz115-S02-1',title:'현관과 신발장',kind:'explore',style:'clinical',
    rooms:[{x:6,y:34,w:12,h:5,kind:'yard',name:'현관 앞'},
     {x:4,y:18,w:18,h:12,kind:'hall',name:'현관과 신발장',along:[['cabinet','w',2],['cabinet','e',3]],grid:{kind:'cabinet',cols:3,rows:2,x:8,y:21,dx:4,dy:4}},
     {x:26,y:21,w:14,h:4,kind:'corridor',name:'1층 복도'},{x:41,y:12,w:6,h:13,kind:'stair',name:'복도 모퉁이'}],
    links:[[0,1,4,'vh'],[1,2,3],[2,3,3]],entry:{x:12.5,y:37.5},exit:{x:44.5,y:13.5},
    clues:[{room:0,at:[6,.5],key:'S-02',sub:'현관 유리에 비친',n:1,label:'현관 유리 · 멈춘 분침',prop:'cabinet'},
     {room:1,at:[9,10],key:'S-02',sub:'등 뒤에서 교문이',n:1,label:'신발장 · 주머니 속 귀가 확인서',prop:'cabinet',after:0}],
    wander:{cap:2,every:12},goal:{clues:true}},
   {id:'sz115-S02-2',title:'순찰자가 도는 복도',kind:'maze',style:'clinical',stealth:true,
    rooms:[{x:4,y:40,w:44,h:3,kind:'corridor',name:'1층 복도'},{x:4,y:24,w:44,h:3,kind:'corridor',name:'2층 복도'},{x:4,y:8,w:44,h:3,kind:'corridor',name:'3층 복도'},
     {x:4,y:8,w:3,h:35,kind:'corridor',name:'서쪽 계단'},{x:45,y:8,w:3,h:35,kind:'corridor',name:'동쪽 계단'},{x:24,y:24,w:3,h:19,kind:'corridor',name:'가운데 통로'},
     {x:10,y:30,w:10,h:7,kind:'room',name:'1-1 교실',grid:{kind:'workbench',cols:3,rows:2,x:12,y:31.5,dx:3,dy:3}},
     {x:30,y:30,w:10,h:7,kind:'room',name:'1-2 교실',grid:{kind:'workbench',cols:3,rows:2,x:32,y:31.5,dx:3,dy:3}},
     {x:10,y:14,w:10,h:7,kind:'room',name:'2-1 교실',grid:{kind:'workbench',cols:3,rows:2,x:12,y:15.5,dx:3,dy:3}},
     {x:30,y:14,w:10,h:7,kind:'room',name:'2-2 교실',grid:{kind:'workbench',cols:3,rows:2,x:32,y:15.5,dx:3,dy:3}}],
    links:[[6,0,2,'vh'],[7,1,2,'vh'],[8,2,2,'vh'],[9,1,2,'vh']],entry:{x:5.5,y:41.5},exit:{x:46.5,y:9.5},save:{x:25.5,y:30.5},chests:[{x:14.5,y:35.5},{x:35.5,y:18.5}],
    cue:[{key:'S-02',sub:'열쇠가 부딪치는 소',n:1}],
    clues:[{room:5,at:[1,4],key:'S-02',sub:'순찰자가 창문 앞을',n:1,label:'창문 앞을 지나는 순찰자',prop:'cabinet'}],
    patrol:{donor:PATROL,name:'순찰자',routes:[[[5.5,25.5],[46.5,25.5],[46.5,9.5],[5.5,9.5]],[[25.5,41.5],[46.5,41.5],[46.5,25.5],[25.5,25.5]]],spotted:{key:'S-02',sub:'그가 고개를 돌리자',n:1}},
    after:[{key:'S-02',sub:'순찰자가 지나간 뒤에도',n:1}],mobCap:4,mobEvery:9,goal:{reach:true}},
   {id:'sz115-S02-3',title:'서른 개의 책상',kind:'explore',style:'clinical',
    rooms:[{x:4,y:32,w:28,h:3,kind:'corridor',name:'교실 앞 복도'},
     {x:8,y:10,w:22,h:17,kind:'room',name:'교실',wall:3.4,grid:{kind:'workbench',cols:6,rows:5,x:10.5,y:14,dx:3.2,dy:2.6}},
     {x:32,y:6,w:3,h:16,kind:'corridor',name:'뒷문 복도'}],
    links:[[0,1,3,'vh'],[1,2,2,'hv']],entry:{x:5.5,y:33.5},exit:{x:33.5,y:7.5},
    clues:[{room:1,at:[11,1],key:'S-02',sub:'교실에 놓인 책상은',n:1,label:'칠판의 서른 · 학급 사진',prop:'cabinet',spawn:5}],
    wander:{cap:5,every:10,afterClue:0},goal:{clues:true}},
   {id:'sz115-S02-4',title:'교무실',kind:'explore',style:'clinical',
    rooms:[{x:4,y:34,w:36,h:3,kind:'corridor',name:'교무실 앞 복도'},
     {x:6,y:12,w:24,h:16,kind:'hall',name:'교무실',along:[['cabinet','n',3]],grid:{kind:'workbench',cols:4,rows:3,x:9,y:16,dx:5,dy:3.6}},
     {x:32,y:14,w:8,h:8,kind:'room',name:'기록 보관 칸',along:[['cabinet','n',2],['cabinet','e',3]]}],
    links:[[0,1,3,'vh'],[1,2,2,'hv']],entry:{x:5.5,y:35.5},exit:{x:38.5,y:35.5},
    clues:[{room:2,at:[3,5],key:'S-02',sub:'교무실에서 낡은',n:1,label:'낡은 출석부',prop:'cabinet'},
     {room:1,at:[12,11],key:'S-02',sub:'두 기록이 서로',n:1,label:'출석부 곁의 귀가 확인서',prop:'workbench',after:0,spawn:4,mobs:WRITING,mobName:'칠판을 벗어난 글씨'}],
    wander:{cap:4,every:11,afterClue:1,mobs:WRITING,mobName:'칠판을 벗어난 글씨'},goal:{clues:true}},
   {id:'sz115-S02-5',title:'분필이 번지는 복도',kind:'combat',style:'clinical',
    rooms:[{x:4,y:36,w:40,h:5,kind:'corridor',name:'칠판이 늘어선 복도'},{x:39,y:8,w:5,h:33,kind:'corridor',name:'꺾인 복도'},{x:10,y:8,w:34,h:5,kind:'corridor',name:'음악실 쪽 복도'},
     {x:10,y:27,w:8,h:7,kind:'room',name:'빈 교실',grid:{kind:'workbench',cols:2,rows:2,x:12,y:29,dx:3,dy:2.6}},
     {x:26,y:27,w:8,h:7,kind:'room',name:'빈 교실',grid:{kind:'workbench',cols:2,rows:2,x:28,y:29,dx:3,dy:2.6}},
     {x:20,y:15,w:10,h:7,kind:'room',name:'빈 교실',grid:{kind:'workbench',cols:3,rows:2,x:22,y:16.5,dx:3,dy:2.6}}],
    links:[[3,0,2,'vh'],[4,0,2,'vh'],[5,2,2,'vh']],entry:{x:6.5,y:38.5},exit:{x:12.5,y:10.5},
    mobs:WRITING,mobName:'칠판을 벗어난 글씨',goal:{kills:40,reach:true}},
   {id:'sz115-S02-6',title:'음악실',kind:'explore',style:'domestic',
    rooms:[{x:8,y:10,w:20,h:16,kind:'room',name:'음악실',wall:3.6,grid:{kind:'crate',cols:5,rows:2,x:11,y:18,dx:3.4,dy:3}},
     {x:28,y:16,w:18,h:3,kind:'corridor',name:'자료실로 가는 복도'},{x:44,y:8,w:5,h:14,kind:'corridor',name:'복도 끝'}],
    links:[[0,1,3,'hv'],[1,2,3,'hv']],entry:{x:10.5,y:24.5},exit:{x:46.5,y:9.5},
    clues:[{room:0,at:[10,2],key:'S-02',sub:'나는 그곳에서 달아나',n:1,label:'피아노 · 건반 아래 쪽지',prop:'workbench'},
     {room:2,at:[2.5,5],key:'S-02',sub:'복도 끝의 자료실 문이',n:2,label:'흔들리는 자료실 문',prop:'cabinet',after:0}],
    wander:{cap:3,every:12},goal:{clues:true}},
   {id:'sz115-S02-7',title:'불 꺼진 교실과 보건실',kind:'combat',style:'clinical',dark:true,
    rooms:[{x:6,y:20,w:20,h:16,kind:'room',name:'불 꺼진 교실',grid:{kind:'workbench',cols:5,rows:4,x:8.5,y:23,dx:3.6,dy:3}},
     {x:26,y:26,w:26,h:4,kind:'corridor',name:'자료실 쪽 복도'},{x:34,y:10,w:12,h:10,kind:'room',name:'보건실',along:[['empty-bed','n',3]]},
     {x:48,y:26,w:4,h:16,kind:'corridor',name:'막힌 벽 앞'}],
    links:[[2,1,2,'vh']],entry:{x:9.5,y:33.5},exit:{x:50.5,y:40.5},
    cue:[{key:'S-02',sub:'형광등이 하나씩',n:1}],
    clues:[{room:2,at:[6,6],key:'S-02',sub:'달리는 도중 조금 열린',n:1,label:'보건실 · 작은 발자국',prop:'empty-bed'},
     {room:1,at:[24,2],key:'S-02',sub:'벽 가까이 가 보려던',n:1,label:'벽 앞에서 시작된 어른 발자국',prop:'statue',after:0}],
    mobs:STUDENT,mobName:'얼굴 없는 학생',goal:{kills:50,clues:true}},
   {id:'sz115-S02-8',title:'자료실과 방송실',kind:'confront',style:'clinical',
    rooms:[{x:6,y:6,w:19,h:19,kind:'hall',name:'방송실',wall:4},{x:24,y:20,w:6,h:4,kind:'stair',name:'계단참'},{x:28,y:20,w:4,h:20,kind:'stair',name:'방송실로 오르는 계단'},
     {x:28,y:36,w:14,h:5,kind:'corridor',name:'자료실 앞'},{x:40,y:30,w:10,h:13,kind:'room',name:'자료실',along:[['cabinet','n',2],['cabinet','e',3]]}],
    links:[],entry:{x:45.5,y:40.5},dais:{x:15.5,y:15.5},landings:[{x:35.5,y:38.5},{x:30.5,y:30.5},{x:27.5,y:22.5}],
    clues:[{room:4,at:[3,4],key:'S-02',sub:'자료실 문을 열었으나',n:1,label:'자료실 · 실내화와 고장 난 시계',prop:'workbench'}],
    boss:{name:'순찰자',donor:PATROL,patterns:['sides','ground']},bossCue:{key:'S-02',sub:'방송실은 위층에',n:1},
    // 원문 해법: 확인서를 내밀지 않고 사실을 적는다(진술 셋) → 얼굴이 갈라진다 → 출석부 위 명령선만 끊는다.
    solve:{statements:[{key:'S-02',sub:'나는 확인서를 내밀려다가',n:1,label:'진술 · 문을 열지 않은 일'},{key:'S-02',sub:'아직 입을 열지도',n:1,label:'진술 · 방송으로 퍼지는 말'},{key:'S-02',sub:'순찰자의 얼굴에 금이',n:2,label:'진술 · 갈라진 얼굴'}],
     floor:.45,book:{key:'S-02',sub:'기억에서 돌아오니',n:1,label:'젖은 출석부 · 교주의 명령'},cut:{key:'S-02',sub:'나는 이름을 짚던',n:1,label:'명령선만 끊기'}},
    after:[{key:'S-02',sub:'교문이 열렸지만',n:1},{key:'S-02',sub:'보건실에 돌아오니',n:1}]}
  ]
 };
 const chapter=key=>CH[key]||null;
 const zone=id=>ALL.get(id)||null;
 const stageOf=z=>({combat:'survival',maze:'maze',confront:'ascent',explore:'explore'})[z?.kind]||null;

 // ---- 배치 틀: 원문 장소에 맞춘 방·복도·거리·다리·승강장·미로·단상. 크기와 갈래는 구역 id 로 고정된다. ----------
 function rng(seed){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1));
 const TPL={
  hall(z,r,p){const w=p.w||ri(r,18,24),h=p.h||ri(r,14,18),H={x:4,y:4,w,h,kind:'hall',name:p.name||z.title},A={x:4+w+3,y:4+h-7,w:8,h:7,kind:'room',name:p.ante||'앞방'},rooms=[H,A],cuts=[];
   if(p.pillars)for(let i=1;i<=2;i++)for(let j=1;j<=2;j++)cuts.push({x:4+Math.round(w*i/3)-1,y:4+Math.round(h*j/3)-1,w:2,h:2,wall:+(roomWall(H)+.4).toFixed(2)});
   return{rooms,links:[[1,0,3,'hv']],cuts,entry:{x:A.x+A.w/2,y:A.y+A.h-1.5},exit:{x:H.x+2.5,y:H.y+2.5}};},
  rooms(z,r,p){const n=p.n||ri(r,3,5),rooms=[],links=[];let x=6;const L=Math.min(50,n*11+6),spine={x:4,y:22,w:L,h:3,kind:'corridor',name:p.spine||'복도'};rooms.push(spine);
   for(let i=0;i<n;i++){const w=ri(r,7,10),h=ri(r,6,8),up=i%2===0,R={x,y:up?22-h-3:28,w,h,kind:'room',name:(p.names||[])[i]||z.title};rooms.push(R);links.push([rooms.length-1,0,2,'vh']);x+=Math.max(w+2,10);}
   return{rooms,links,entry:{x:5.5,y:23.5},exit:{x:4+L-1.5,y:23.5}};},
  tower(z,r,p){const k=p.floors||3,rooms=[],links=[];for(let i=0;i<k;i++){rooms.push({x:4+i*15,y:36-i*12,w:ri(r,11,13),h:ri(r,8,9),kind:i%2?'hall':'room',name:(p.names||[])[i]||z.title});if(i)links.push([i-1,i,3,i%2?'vh':'hv']);}
   const a=rooms[0],b=rooms[k-1];return{rooms,links,entry:{x:a.x+1.5,y:a.y+a.h-1.5},exit:{x:b.x+b.w-1.5,y:b.y+1.5}};},
  street(z,r,p){const L=p.len||44,rooms=[{x:4,y:22,w:L,h:6,kind:'street',name:p.name||z.title}],links=[];let x=10;while(x<L-4){const up=r()<.5,len=ri(r,6,11),R={x,y:up?22-len:28,w:3,h:len,kind:'street',name:'골목'};rooms.push(R);const P={x:x-2,y:up?22-len-6:28+len,w:7,h:6,kind:'yard',name:'작은 마당'};if(P.y>2&&P.y+P.h<58)rooms.push(P);x+=ri(r,9,13);}
   return{rooms,links,entry:{x:5.5,y:25},exit:{x:4+L-1.5,y:25}};},
  bridge(z,r,p){const pts=[[6,40],[20,ri(r,28,32)],[34,ri(r,18,22)],[46,8]],rooms=pts.map(([x,y],i)=>({x,y,w:7,h:7,kind:'yard',name:i?'다리 위':'다리 머리'})),links=pts.slice(1).map((_,i)=>[i,i+1,3,i%2?'vh':'hv']);
   return{rooms,links,entry:{x:9.5,y:45.5},exit:{x:49.5,y:9.5}};},
  yard(z,r,p){const R0=p.r||ri(r,12,15),c=24,rooms=[{x:c-R0,y:c-R0,w:2*R0+1,h:2*R0+1,kind:'yard',shape:'disc',name:p.name||z.title},{x:c-2,y:c+R0-1,w:5,h:10,kind:'yard',name:'들어오는 길'},{x:c-2,y:c-R0-8,w:5,h:9,kind:'yard',name:'나가는 길'}];
   return{rooms,links:[],entry:{x:c+.5,y:c+R0+7.5},exit:{x:c+.5,y:c-R0-6.5}};},
  station(z,r,p){const w=p.w||ri(r,34,40),rooms=[{x:4,y:10,w,h:6,kind:'hall',name:p.platform||'승강장'},{x:10,y:24,w:ri(r,20,26),h:10,kind:'hall',name:p.hall||'대합실'},{x:4,y:3,w,h:3,kind:'corridor',name:'철로 곁'}],links=[[1,0,3,'vh'],[0,1,3,'hv'],[2,0,2,'vh']];
   return{rooms,links,entry:{x:14.5,y:32.5},exit:{x:4+w-1.5,y:12.5}};},
  arena(z,r,p){const R0=p.r||ri(r,13,16),c=22,rooms=[{x:c-R0,y:c-R0,w:2*R0+1,h:2*R0+1,kind:p.kind||'hall',shape:'disc',name:p.name||z.title},{x:c+R0-2,y:c+R0-2,w:8,h:8,kind:'room',name:p.ante||'입구'}];
   return{rooms,links:[[1,0,3,'hv']],entry:{x:c+R0+3.5,y:c+R0+3.5},exit:{x:c+.5,y:c-R0+1.5}};},
  grid(z,r,p){const C=p.c||ri(r,6,8),Rn=p.r||ri(r,6,8),S=6,rooms=[],links=[],id=(i,j)=>j*C+i,seen=new Set([id(0,Rn-1)]),stack=[[0,Rn-1]],adj=new Map();
   for(let j=0;j<Rn;j++)for(let i=0;i<C;i++)rooms.push({x:4+i*S,y:4+j*S,w:3,h:3,kind:'corridor',name:z.title});
   const link=(a,b)=>{links.push([a,b,3,'hv']);if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a);};
   while(stack.length){const[i,j]=stack[stack.length-1],nb=[[i+1,j],[i-1,j],[i,j+1],[i,j-1]].filter(([a,b])=>a>=0&&b>=0&&a<C&&b<Rn&&!seen.has(id(a,b)));if(!nb.length){stack.pop();continue;}const[a,b]=nb[Math.floor(r()*nb.length)];seen.add(id(a,b));link(id(i,j),id(a,b));stack.push([a,b]);}
   for(let j=0;j<Rn;j++)for(let i=0;i<C-1;i++)if(r()<(p.braid??.12)&&!(adj.get(id(i,j))||[]).includes(id(i+1,j)))link(id(i,j),id(i+1,j));
   const start=id(0,Rn-1),dist=new Map([[start,0]]),prev=new Map(),q=[start];while(q.length){const a=q.shift();for(const b of adj.get(a)||[])if(!dist.has(b)){dist.set(b,dist.get(a)+1);prev.set(b,a);q.push(b);}}
   let far=start;for(const[k,v]of dist)if(v>dist.get(far))far=k;const path=[];for(let c=far;c!=null;c=prev.get(c))path.unshift(c);
   const cen=k=>({x:rooms[k].x+1.5,y:rooms[k].y+1.5}),dead=[...adj.keys()].filter(k=>adj.get(k).length===1&&k!==start&&k!==far&&!path.includes(k));
   return{rooms,links,entry:cen(start),exit:cen(far),save:cen(path[Math.floor(path.length/2)]),chests:dead.slice(0,2).map(cen),clueRooms:dead.slice(2).concat(path.slice(2,-2))};},
  dais(z,r,p){const rooms=[{x:6,y:6,w:19,h:19,kind:'hall',shape:p.square?null:'disc',name:p.name||z.title,wall:p.wall},{x:24,y:22,w:6,h:5,kind:'stair',name:'계단참'},{x:30,y:28,w:6,h:6,kind:'stair',name:'계단'},{x:36,y:34,w:p.aw||10,h:p.ah||9,kind:'room',name:p.ante||'앞방'}];
   return{rooms,links:[[1,0,3,'hv'],[1,2,3,'hv'],[2,3,3,'hv']],entry:{x:41.5,y:41.5},dais:{x:15.5,y:15.5},landings:[{x:33,y:31},{x:27,y:24.5}]};}};
 function roomWall(R){return R.wall||WALL[R.kind]||3.2;}
 function expand(z){if(!z.tpl)return z;const r=rng(hash(z.id)),T=TPL[z.tpl](z,r,z.p||{}),out={...z,...T};
  // 단서는 입구가 아닌 방을 돌아가며 놓는다(방 가운데 근처, 바닥 위).
  const pool=(T.clueRooms||[]).length?T.clueRooms:out.rooms.map((_,i)=>i);
  if(z.p?.wall)for(const R of out.rooms)R.wall=z.p.wall;
  const place=(c,n)=>{const k=pool[(n+1)%pool.length],R=out.rooms[k];return{...c,room:k,at:[R.w/2+(R.w>5?(r()*2-1)*1.5:0),R.h/2+(R.h>5?(r()*2-1)*1.2:0)]};};
  out.clues=(z.clues||[]).map((c,n)=>c.room!=null?c:place(c,n));
  if(z.patrol?.sleep){const cand=(T.clueRooms||out.rooms.map((_,i)=>i)).slice(0,z.patrol.count||6);out.patrol={...z.patrol,routes:cand.map(k=>{const R=out.rooms[k],c=[R.x+R.w/2,R.y+R.h/2];return[c,[c[0]+.6,c[1]]];})};}
  return out;}
 // ---- 배치: 방·복도 → 바닥 칸, 문, 벽 높이 ---------------------------------------------------------
 const WALL={hall:3.9,room:3.3,corridor:3,stair:3.6,yard:1.4,street:4.4},DOOR=2.7;
 function carve(z){const cells=new Set(),owner=new Map(),add=(x,y,ri)=>{const k=K(x,y);cells.add(k);if(ri!=null&&!owner.has(k))owner.set(k,ri);};
  z.rooms.forEach((R,ri)=>{const cx=R.x+R.w/2,cy=R.y+R.h/2;for(let y=R.y;y<R.y+R.h;y++)for(let x=R.x;x<R.x+R.w;x++){if(R.shape==='disc'&&Math.hypot((x+.5-cx)/(R.w/2),(y+.5-cy)/(R.h/2))>1)continue;add(x,y,ri);}});
  const inRoom=(x,y)=>z.rooms.findIndex(R=>R.kind!=='corridor'&&x>=R.x&&x<R.x+R.w&&y>=R.y&&y<R.y+R.h);
  const doors=[],centre=R=>[Math.floor(R.x+R.w/2),Math.floor(R.y+R.h/2)];
  for(const[a,b,w=3,via='hv']of z.links||[]){const[ax,ay]=centre(z.rooms[a]),[bx,by]=centre(z.rooms[b]),pts=[],sx=Math.sign(bx-ax),sy=Math.sign(by-ay);
   if(via==='hv'){for(let x=ax;x!==bx;x+=sx)pts.push([x,ay]);for(let y=ay;y!==by+sy||!sy;y+=sy){pts.push([bx,y]);if(!sy)break;}}
   else{for(let y=ay;y!==by;y+=sy)pts.push([ax,y]);for(let x=ax;x!==bx+sx||!sx;x+=sx){pts.push([x,by]);if(!sx)break;}}
   const lo=Math.floor((w-1)/2),hi=w-1-lo;for(const[x,y]of pts)for(let dy=-lo;dy<=hi;dy++)for(let dx=-lo;dx<=hi;dx++)add(x+dx,y+dy,null);
   let prev=inRoom(...pts[0]);for(let i=1;i<pts.length;i++){const cur=inRoom(...pts[i]);if(cur!==prev){const[x0,y0]=pts[i-1],[x1,y1]=pts[i],h=x0!==x1;doors.push({x:h?Math.max(x0,x1):x0+.5,y:h?y0+.5:Math.max(y0,y1),axis:h?'v':'h',lo:-lo,hi:hi+1,room:prev>=0?prev:cur});}prev=cur;}}
  for(const c of z.cuts||[])for(let y=c.y;y<c.y+c.h;y++)for(let x=c.x;x<c.x+c.w;x++){cells.delete(K(x,y));owner.delete(K(x,y));}
  let W=0,H=0;for(const k of cells){const[x,y]=k.split(':').map(Number);W=Math.max(W,x+1);H=Math.max(H,y+1);}
  return{cells,owner,doors,bounds:[0,0,W+3,H+3]};}
 const roomH=(z,ri)=>{const R=z.rooms[ri];return R?(R.wall||WALL[R.kind]||3.2):WALL.corridor;};
 function heights(L,z,owner,doors){// 벽마다 맞닿은 방의 높이 + 작은 변화, 문 옆 기둥(문틀)은 문보다 높게.
  for(const w of L.walls||[]){const h=w.width>w.depth,side=h?[[w.x,w.y-.5],[w.x,w.y+.5]]:[[w.x-.5,w.y],[w.x+.5,w.y]];let ri=null;for(const[sx,sy]of side){const o=owner.get(K(Math.floor(sx),Math.floor(sy)));if(o!=null){ri=o;break;}}
   const cut=(z.cuts||[]).find(c=>side.some(([sx,sy])=>sx>c.x&&sx<c.x+c.w&&sy>c.y&&sy<c.y+c.h));
   const base=cut?.wall||(ri==null&&z.outdoor?WALL.yard:roomH(z,ri)),v=((hash(w.id)%7)-3)*.07;w.height=+(Math.max(base>2?DOOR+.3:base,base+v)).toFixed(2);w.r115={room:ri,base};}
  const jambs=[];if(!z.outdoor)for(const d of doors){const top=Math.max(roomH(z,d.room),DOOR+.4)+.12;for(const t of[d.lo,d.hi]){const p=d.axis==='v'?{x:d.x,y:d.y-.5+t}:{x:d.x-.5+t,y:d.y};jambs.push({id:L.id+'-jamb:'+jambs.length,x:p.x,y:p.y,width:.34,depth:.34,height:+top.toFixed(2),annex:true,samongR103:true,r115Jamb:true});}}
  L.walls.push(...jambs);if(L.worldR74)L.worldR74.wallCount=L.walls.length;return jambs.length;}
 // 나머지 장·역행·엔딩은 scripts/build-samong-zones.py 가 만든 samong-zones-r115-data.js(원문 문단 앵커 포함)를 배치 틀(tpl)로 펼친다.
 const DATA=window.__STORYWORLD_SAMONG_ZONES_R115_DATA__;if(DATA?.chapters)for(const[k,list]of Object.entries(DATA.chapters))if(!CH[k])CH[k]=list.map(z=>{try{return expand(z);}catch(e){fail(e);return null;}}).filter(Boolean);
 const ALL=new Map();for(const list of Object.values(CH))for(const z of list)ALL.set(z.id,z);
 function layout(z,ep,api){const{cells,owner,doors,bounds}=carve(z),epx={...ep,style:z.style||ep.style};
  const nodes=z.rooms.map((R,n)=>({id:n,x:R.x+R.w/2,y:R.y+R.h/2,radius:Math.min(R.w,R.h)/2,shape:'square',width:R.w,depth:R.h,name:R.name}));
  const edges=(z.links||[]).map(([a,b,w])=>[a,b,w||3]);
  const extra={kind:z.kind,r115:z.id,rooms:z.rooms.map(R=>({x:R.x,y:R.y,w:R.w,h:R.h,name:R.name,kind:R.kind})),doors:doors.map(d=>({x:d.x,y:d.y,axis:d.axis})),
   exit:z.exit?{...z.exit}:null,centre:z.exit?{...z.exit}:{x:nodes[0].x,y:nodes[0].y},save:z.save?{...z.save}:null,chests:(z.chests||[]).map(c=>({...c})),
   dais:z.dais?{...z.dais}:null,landings:(z.landings||[]).map(c=>({...c})),patrol:z.patrol?z.patrol.routes.map(r=>r.map(([x,y])=>({x,y}))):null,path:[]};
  const L=api.build(z.id,epx,cells,{nodes,edges,entry:{...z.entry,node:0},bounds,wallHeight:WALL.room,extra});
  L.samongR115={rev:REV,zone:z.id,title:z.title,kind:z.kind,jambs:heights(L,z,owner,doors),doors:doors.length};
  if(L.worldR74){L.worldR74.rooms=extra.rooms;L.worldR74.doors=extra.doors;}
  if(z.dark)L.samongR115.dark=true;
  if(z.outdoor){const o=z.outdoor;if(L.worldR74)L.worldR74.mode='outdoor';L.r98Scene={id:ep.host,mode:'outdoor',style:o.family,open:true,wall:null,family:o.family,applied:true,version:1,r105:{family:o.family,water:o.water||null,trees:o.trees||null}};
   L.voidCover={tint:o.water?'#06090d':'#0d100f',opacity:1,theme:o.family,r105:true};L.samongR105={rev:REV,ep:ep.key,stage:stageOf(z),title:z.title,outdoor:{...o},style:epx.style};}
  return L;}

 // ---- 소품·단서 ---------------------------------------------------------------------------------
 const clueId=(z,n)=>z.id+':clue:'+n;
 function deco(id,kind,x,y){return{id:'r115:'+id,x,y,solid:false,autoTargetEligible6:false,visible:true,r74Prop:kind,r105Prop:kind,r115Prop:kind};}
 function dress(r,z,api){const L=r.exploration,x=L.samongR103;let n=0;
  z.rooms.forEach((R,ri)=>{if(R.grid){const g=R.grid;for(let j=0;j<g.rows;j++)for(let i=0;i<g.cols;i++)r.props.push({...deco(z.id+':g'+ri+':'+i+':'+j,g.kind,g.x+i*g.dx,g.y+j*g.dy),r115Hide:true});n+=g.rows*g.cols;}
   for(const[kind,side,step]of R.along||[]){const pts=[];if(side==='n'||side==='s'){const y=side==='n'?R.y+.7:R.y+R.h-.7;for(let px=R.x+1.5;px<R.x+R.w-1;px+=step)pts.push([px,y]);}else{const px=side==='w'?R.x+.7:R.x+R.w-.7;for(let y=R.y+1.5;y<R.y+R.h-1;y+=step)pts.push([px,y]);}
    for(const[px,py]of pts){if(Math.hypot(px-L.entry.x,py-L.entry.y)<2.5)continue;r.props.push(deco(z.id+':a'+ri+':'+side+':'+Math.round(px*10)+':'+Math.round(py*10),kind,px,py));n++;}}});
  (z.clues||[]).forEach((c,i)=>{const R=z.rooms[c.room],at={x:R.x+c.at[0],y:R.y+c.at[1]};r.props.push({id:'r115:'+clueId(z,i),x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:'record',r74Prop:c.prop||'crate',label:c.label,r115Clue:clueId(z,i),r105Record:{key:c.key,sub:c.sub,n:c.n||1,label:c.label}});});
  if(z.solve){const d=x.dais;(z.solve.statements||[]).forEach((s,i)=>{const a=-Math.PI/2+i*2.094,at={x:d.x+Math.cos(a)*5.6,y:d.y+Math.sin(a)*5.6};r.props.push({id:'r115:'+z.id+':stmt:'+i,x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:'record',r74Prop:'workbench',label:s.label,r115Stmt:i,r105Record:{key:s.key,sub:s.sub,n:s.n||1,label:s.label}});});}
  // 흩어 놓는 소품: 벽·입구·출구·단서·단상에서 떨어진 바닥 안쪽 칸(벽과 겹치지 않게).
  if(z.props?.length){const cells=new Set(L.floorCells.map(([a,b])=>K(a,b))),inner=(a,b)=>[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([dx,dy])=>cells.has(K(a+dx,b+dy)));
   const keep=[L.entry,x.exit,x.dais&&{...x.dais,r:10},x.save,...(x.chests||[]),...(x.landings||[]),...r.props.filter(p=>p.r115Clue||p.r115Stmt!=null)].filter(Boolean);
   const rr=rng(hash(z.id+':props')),cand=L.floorCells.filter(([a,b])=>inner(a,b)).map(([a,b])=>({x:a+.5,y:b+.5,k:rr()})).sort((a,b)=>a.k-b.k),used=[];
   for(const[kind,count]of z.props){let c=0;for(const q of cand){if(c>=count)break;if(keep.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<(p.r||2.6))||used.some(p=>Math.hypot(p.x-q.x,p.y-q.y)<3))continue;used.push(q);r.props.push(deco(z.id+':s:'+kind+':'+c,kind,q.x,q.y));c++;n++;}}}
  if(z.outdoor)delete r.r99Trees;
  r.samongR115={zone:z.id,props:n,clues:(z.clues||[]).length};}

 // ---- 원문 보여 주기 (R105 기록 표식과 같은 문단 규칙) -----------------------------------------------
 function rows(R){const s=TEXT()[R.key];if(!s)return[];const all=s.blocks.flatMap(b=>b.paras.map(t=>({t,n:b.narrator})));let at=all.findIndex(v=>v.t.startsWith(R.sub));if(at<0)at=all.findIndex(v=>v.t.includes(R.sub));if(at<0)return[];return all.slice(at,at+Math.max(1,R.n||1));}
 function scenesFor(list,z,tag){const ep=SM()?.episodes?.[room?.samongR103?.ep??-1]||{};const out=[];
  for(const R of list||[]){const rs=rows(R);if(!rs.length)continue;const s=TEXT()[R.key];out.push({id:ep.host||room?.id,record:{title:ep.title||s.title,narrator:rs[0].n,chapter:ep.chapter||''},part:'body',text:rs.map(v=>v.t).join('\n\n'),title:s.title+' · '+z.title,narrator:rs[0].n?'〈'+rs[0].n+'〉':'',chapter:ep.chapter||'',key:'DREAM:sz115:'+z.id+':'+tag+':'+out.length});}
  return out;}
 function play(list,after){try{if(!list.length){after?.();return true;}if(typeof storyScene!=='undefined'&&storyScene&&Array.isArray(storyQueue)){storyQueue.push(...list);after?.();}else playScenes(list,after||null);return true;}catch(e){fail(e);after?.();return false;}}

 // ---- 진행: 단서·진술·잠입 --------------------------------------------------------------------------
 const st=()=>SM()?.state?.()||null;
 const read=id=>!!st()?.zoneRead?.includes(id);
 const mark=id=>{const S=st();if(S&&!S.zoneRead.includes(id)){S.zoneRead.push(id);if(S.zoneRead.length>512)S.zoneRead.shift();}};
 const solveOf=z=>{const S=st();if(!S)return{};S.zoneSolve=S.zoneSolve||{};return S.zoneSolve[z.id]||(S.zoneSolve[z.id]={stmt:0,book:0,cut:0});};
 function cluesDone(z){return(z.clues||[]).every((c,i)=>read(clueId(z,i)));}
 function done(r,z){const S=st();if(S?.zoneDone?.includes(z.id))return true;const g=z.goal||{};if(z.kind==='explore')return cluesDone(z);
  if(z.kind==='combat'){if(z.lead&&r?.samongR103&&(!r.samongR103.leadId||r.samongR103.leadAlive))return false;if(g.kills&&(S?.kills||0)<g.kills)return false;if(g.hold&&(r?.samongR103?.holdT||0)<g.hold)return false;if(g.clues&&!cluesDone(z))return false;return true;}
  return false;}
 function use(p,api){const z=zone(room?.samongR103?.zone);if(!z)return false;
  if(p.r115Clue){const i=(z.clues||[]).findIndex((c,n)=>clueId(z,n)===p.r115Clue),c=z.clues[i];if(!c)return false;
   if(c.after!=null&&!read(clueId(z,c.after))){say('먼저 '+z.clues[c.after].label+' 쪽을 살펴보세요.',3);return true;}
   const first=!read(p.r115Clue);mark(p.r115Clue);const ok=api.record(p);if(first){if(c.spawn)api.burst(c.spawn,c.mobs,c.mobName,p);if(cluesDone(z))say('단서를 모두 확인했습니다 · 다음 문이 열립니다.',3);}try{saveGame(false);}catch(e){}return ok!==false;}
  if(p.r115Stmt!=null){const s=solveOf(z);if(z.solve.hold&&!s.held){say('먼저 버티세요 · '+Math.ceil(z.solve.hold-(s.holdT||0))+'초',3);return true;}if(p.r115Stmt>s.stmt){say('진술은 차례대로 적습니다 · '+z.solve.statements[s.stmt].label,3);return true;}
   api.record(p);if(p.r115Stmt===s.stmt){s.stmt++;if(s.stmt>=(z.solve.statements||[]).length)crack(z,api);try{saveGame(false);}catch(e){}}return true;}
  if(p.r115Book){const s=solveOf(z);const sc=scenesFor([s.book?z.solve.cut:z.solve.book],z,s.book?'cut':'book');
   if(!s.book){s.book=1;play(sc,()=>say('출석부 위의 검은 선 · 다시 E 로 그 선만 끊습니다. 이름은 건드리지 않습니다.',4));}
   else if(!s.cut){s.cut=1;play(sc,()=>{api.removeProp(p);api.clear();});}try{saveGame(false);}catch(e){}return true;}
  return false;}
 function crack(z,api){// 진술을 끝까지 적으면 순찰자의 얼굴이 갈라진다 — 처치가 아니라 해제.
  const b=api.boss();if(b){b.r115Released=true;b.hp=0;b.deadRecorded=true;b.spawnState='dead';b.deadAt=typeof time==='number'?time:0;b.samongR103Silent=true;}
  if(!z.solve.book){if(z.solve.done)say(z.solve.done,4);api.clear();return;}
  const d=room.exploration.samongR103.dais;api.addProp({id:'r115:'+z.id+':book',x:d.x,y:d.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:'record',r74Prop:'workbench',label:z.solve.book.label,r115Book:true});
  say(z.solve.done||'순찰자의 얼굴이 갈라졌습니다 · 가운데의 젖은 출석부를 E 로 펼치세요.',4);}
 // 잠입: 순찰자는 쓰러지지 않는다. 손전등 빛이나 정면에 들키면 가까이 온다. 책상 사이에 숨으면 지나간다.
 function patrolTick(r,z,dt,api){const x=r.samongR115Patrol||(r.samongR115Patrol={units:[],alert:0,seen:0,hit:0}),L=r.exploration.samongR103;if(!L.patrol)return;
  if(!x.units.length)L.patrol.forEach((route,n)=>{const e=api.spawn(z.patrol.donor,route[0],{name:z.patrol.name,tag:'p'+n,boss:false,hpScale:3});if(!e)return;e.samongPatrolR115=true;e.samongSurvival=false;e.autoTargetEligible6=false;e.cd=99;e.damage=(e.damage||10)*.9;x.units.push({id:e.id,route,leg:1,chase:0});});
  const hidden=r.props.some(p=>p.r115Hide&&Math.hypot(p.x-player.x,p.y-player.y)<1.15)&&Math.hypot(player.moveVX150||0,player.moveVY150||0)<2.2,lit=settings?.flashlight58!==false;
  for(const u of x.units){const e=r.enemies.find(q=>q.id===u.id);if(!e)continue;e.hp=e.maxHp;e.cd=Math.max(e.cd||0,5);e.deadRecorded=false;
   const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy),face=u.face||{x:1,y:0},cos=(dx*face.x+dy*face.y)/(d||1),reach=lit?7.5:5;
   const run=Math.hypot(player.moveVX150||0,player.moveVY150||0)>2.2,sees=z.patrol.sleep?(!u.chase&&((run&&d<3.2)||(lit&&d<4&&cos>.3))&&api.sight(e,player))||(u.chase>0&&d<6):(!hidden&&d<reach&&cos>.42&&api.sight(e,player)||d<1.6);
   if(sees){if(!u.chase&&!x.seen){x.seen=1;if(z.patrol.spotted)play(scenesFor([z.patrol.spotted],z,'spotted'));}u.chase=4.5;}
   let tx,ty,sp;if(u.chase>0){u.chase-=dt;tx=player.x;ty=player.y;sp=z.patrol.sleep?2.4:3.1;}else{const w=u.route[u.leg];tx=w.x;ty=w.y;sp=1.7;if(Math.hypot(tx-e.x,ty-e.y)<.4)u.leg=(u.leg+1)%u.route.length;}
   const mx=tx-e.x,my=ty-e.y,m=Math.hypot(mx,my);if(m>.05){const s=Math.min(m,sp*dt);const nx=e.x+mx/m*s,ny=e.y+my/m*s;if(!blocked(nx,ny,.3,r)){e.x=nx;e.y=ny;}else if(u.chase>0)u.chase=0;u.face={x:mx/m,y:my/m};e.moveVX150=mx/m*sp;e.moveVY150=my/m*sp;}
   if(u.chase>0&&d<1.1&&time-x.hit>1.6){x.hit=time;try{damagePlayer?.(Math.round(maxHP()*.16),e);}catch{player.hp=Math.max(1,player.hp-maxHP()*.16);}const back=st()?.checkpoint||r.exploration.entry;player.x=back.x;player.y=back.y;try{cam={x:player.x,y:player.y};}catch(err){}u.chase=0;say('열쇠 소리가 등 뒤까지 왔습니다 · 마지막 자리로 물러납니다.',3);}}}
 // 상대를 적으로 세우지 않는 버티기(예: 재인과의 대련): 예고 표시 뒤 판정되는 자리만 생긴다.
 function hazardTick(r,z,dt){const x=r.samongR103;x.hzAt=x.hzAt||time+2;if(time<x.hzAt)return;x.hzAt=time+(z.hazards.every||2.4);const dmg=Math.max(1,Math.round(maxHP()*(z.hazards.dmg||.05)));
  for(let n=0;n<(z.hazards.n||3);n++){const a=Math.random()*Math.PI*2,d=.6+Math.random()*2.6,px=player.x+Math.cos(a)*d,py=player.y+Math.sin(a)*d;if(blocked(px,py,.1,r))continue;hazards.push({id:++uid,type:'field',owner:null,x:px,y:py,radius:1.05,age:0,warning:.95,life:1.4,asset:VFX.burst,damage:dmg,lastHit:-99,samongPattern:'r115-hold'});}}
 function leadTick(r,z,api){const x=r.samongR103;if(!x||x.portal)return;if(!x.leadId){if(st()?.zoneDone?.includes(z.id))return;const R=z.rooms[0],e=api.spawn(z.lead.donor,{x:R.x+R.w/2+.5,y:R.y+R.h/2},{boss:true,name:z.lead.name,tag:'b'});if(e){e.samongBoss=true;e.patternsR103=z.lead.patterns;x.leadId=e.id;x.leadAlive=1;}return;}
  const e=r.enemies.find(q=>q.id===x.leadId);x.leadAlive=e&&e.hp>0&&e.spawnState!=='dead'?1:0;}
 function tick(r,z,dt,api){try{if(z.stealth)patrolTick(r,z,dt,api);if(z.lead)leadTick(r,z,api);
   if(z.wander&&(z.wander.afterClue==null||read(clueId(z,z.wander.afterClue))))api.wander(z.wander);
   if(z.hazards&&r.samongR103&&!r.samongR103.portal)hazardTick(r,z,dt);
   if(z.solve?.hold&&r.samongR103?.bossUp){const s=solveOf(z);if(!s.held){s.holdT=(s.holdT||0)+dt;if(s.holdT>=z.solve.hold){s.held=1;if(!(z.solve.statements||[]).length)crack(z,api);else say('이제 둘레의 표식에서 E',3);}}}
   if(z.solve&&!solveOf(z).cut){const b=api.boss();if(b&&b.hp>0&&!b.r115Released&&(solveOf(z).stmt<(z.solve.statements||[]).length||z.solve.hold&&!solveOf(z).held)){const f=b.maxHp*z.solve.floor;if(b.hp<f){b.hp=f;if(time-(r.r115FloorAt||-9)>6){r.r115FloorAt=time;say(z.solve.hint||(z.solve.book?'순찰자는 쓰러지지 않습니다 · 둘레의 책상에서 확인서 대신 사실을 적으세요(E).':(b.name||'상대')+'는 쓰러뜨려 끝나지 않습니다 · 둘레의 표식에서 E'),4);}}}}
  }catch(e){fail(e);}}
 function navGoal(r,z){const x=r.samongR103,pt=(p,label,kind)=>p?{x:p.x,y:p.y,label,kind}:null;if(x.portal)return null;
  if(z.solve&&x.bossUp){const s=solveOf(z),i=s.stmt;if(i<(z.solve.statements||[]).length){const p=r.props.find(q=>q.r115Stmt===i);return pt(p,z.solve.statements[i].label,'objective');}const b=r.props.find(q=>q.r115Book);if(b)return pt(b,b.label,'objective');}
  for(let i=0;i<(z.clues||[]).length;i++){const c=z.clues[i];if(read(clueId(z,i)))continue;if(c.after!=null&&!read(clueId(z,c.after)))continue;if(z.kind==='combat'&&z.goal?.kills&&(st()?.kills||0)<z.goal.kills&&i>0)break;const p=r.props.find(q=>q.r115Clue===clueId(z,i));if(p)return pt(p,c.label,'objective');}
  return null;}
 function hudText(r,z){const S=st(),g=z.goal||{},list=chapterOf(z),n=list.indexOf(z)+1,tag=n+'/'+list.length,x=r.samongR103;
  const clues=(z.clues||[]).length,got=(z.clues||[]).filter((c,i)=>read(clueId(z,i))).length;
  let text,dest,unlock;
  if(x.portal){text='문이 열렸습니다 · 문에서 E';unlock='다음 구역으로';}
  else if(z.kind==='explore'){text='원문 단서 '+got+' / '+clues+' · 빛나는 표식에서 E';unlock='단서를 모두 보면 다음 문';}
  else if(z.kind==='combat'){text=(z.lead&&x.leadAlive?z.lead.name+' · 먼저 무너뜨리세요 · ':'')+(g.kills?'처치 '+Math.min(S?.kills||0,g.kills)+' / '+g.kills:'')+(g.hold?'버티기 '+Math.min(g.hold,Math.floor(x.holdT||0))+' / '+g.hold+'초':'')+(clues?' · 단서 '+got+'/'+clues:'')+(g.reach?' · 끝의 문까지':'');unlock=g.reach?'목표를 채우면 끝의 문이 열립니다':'목표를 채우면 문';}
  else if(z.kind==='maze'){text=z.stealth?'순찰자는 쓰러지지 않습니다 · 책상 사이에 숨어 지나가세요':'손전등이 비추는 쪽으로 출구를 찾으세요';unlock='출구에 닿으면 다음 구역 · 등불에서 저장';}
  else{const s=solveOf(z),N=(z.solve?.statements||[]).length;text=z.solve?(x.bossUp?(z.solve.hold&&!s.held?'버티기 '+Math.floor(s.holdT||0)+' / '+z.solve.hold+'초':N?(z.solve.word||'진술')+' '+s.stmt+' / '+N+(s.stmt>=N&&z.solve.book?' · '+z.solve.book.label:''):'끝까지'):'위쪽으로 올라가 마주하세요'):x.bossUp?'대면':'위쪽으로';unlock=z.solve?(z.solve.unlock||'쓰러뜨리는 것이 아니라 사실을 적어 끝냅니다'):'대면 후 다음 구역';}
  dest=z.title+' · 구역 '+tag;return{text,dest,unlock,badge:z.title+' '+tag,sub:{explore:'탐색',maze:'손전등 미로',combat:'전투',confront:'대면'}[z.kind]+' · '+tag};}
 const chapterOf=z=>{for(const list of Object.values(CH))if(list.includes(z))return list;return[z];};

 // ---- 구버전 저장 → 구역 (지우지 않고 옮긴다) ------------------------------------------------------
 function migrate(key,stage){const list=chapter(key);if(!list)return null;if(key==='P')return list[0].id;if(stage==='maze')return(list.find(z=>z.kind==='maze')||list[0]).id;if(stage==='ascent')return list[list.length-1].id;return list[0].id;}

 // ---- 777: 구역 목록 ------------------------------------------------------------------------------
 function inject(){try{if(!document.getElementById('codeMap')||document.getElementById('r115Zones'))return;const panel=document.getElementById('panel');if(!panel)return;const eps=SM()?.episodes||[];const div=document.createElement('div');div.id='r115Zones';
   let h='<div class="eyebrow">777 / 사몽 구역 이동</div><label for="r115Zone">구역</label> <select id="r115Zone">';for(const[key,list]of Object.entries(CH)){const i=eps.findIndex(e=>e.key===key);for(const z of list)h+='<option value="'+esc(z.id)+'">'+esc(key)+' · '+esc(eps[i]?.title||'')+' — '+esc(z.title)+' ('+esc(z.id)+')</option>';}
   h+='</select> <button id="r115ZoneGo">구역으로 이동</button>';div.innerHTML=h;panel.appendChild(div);document.getElementById('r115ZoneGo').onclick=()=>{if(window.__STORYWORLD_CHEAT777__?.active?.()!==true){say('777 코드를 먼저 적용하세요.',3);return;}try{closePanel(true);}catch(e){}SM()?.goZone?.(document.getElementById('r115Zone').value);};}catch(e){fail(e);}}
 function install(){if(typeof openPanel==='function'){const b=openPanel;openPanel=function(html,...a){const r=b.call(this,html,...a);try{if(typeof html==='string'&&html.includes('id="codeMap"'))inject();}catch(e){fail(e);}return r;};}}
 try{install();}catch(e){fail(e);}
 function inspect(){return{revision:REV,failures,lastError,chapters:Object.fromEntries(Object.entries(CH).map(([k,v])=>[k,v.map(z=>z.id)])),zones:ALL.size,current:typeof room!=='undefined'?room?.samongR115||null:null};}
 window.__STORYWORLD_SAMONG_ZONES_R115__=Object.freeze({revision:REV,chapters:CH,chapter,zone,stageOf,layout,dress,tick,use,done,navGoal,hudText,scenesFor,play,migrate,clueId,cluesDone,solveOf,carve,inspect});
})();
