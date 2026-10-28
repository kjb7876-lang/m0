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
 const ALL=new Map();for(const list of Object.values(CH))for(const z of list)ALL.set(z.id,z);
 const chapter=key=>CH[key]||null;
 const zone=id=>ALL.get(id)||null;
 const stageOf=z=>({combat:'survival',maze:'maze',confront:'ascent',explore:'explore'})[z?.kind]||null;

 // ---- 배치: 방·복도 → 바닥 칸, 문, 벽 높이 ---------------------------------------------------------
 const WALL={hall:3.9,room:3.3,corridor:3,stair:3.6,yard:1.4},DOOR=2.7;
 function carve(z){const cells=new Set(),owner=new Map(),add=(x,y,ri)=>{const k=K(x,y);cells.add(k);if(ri!=null&&!owner.has(k))owner.set(k,ri);};
  z.rooms.forEach((R,ri)=>{for(let y=R.y;y<R.y+R.h;y++)for(let x=R.x;x<R.x+R.w;x++)add(x,y,ri);});
  const inRoom=(x,y)=>z.rooms.findIndex(R=>R.kind!=='corridor'&&x>=R.x&&x<R.x+R.w&&y>=R.y&&y<R.y+R.h);
  const doors=[],centre=R=>[Math.floor(R.x+R.w/2),Math.floor(R.y+R.h/2)];
  for(const[a,b,w=3,via='hv']of z.links||[]){const[ax,ay]=centre(z.rooms[a]),[bx,by]=centre(z.rooms[b]),pts=[],sx=Math.sign(bx-ax),sy=Math.sign(by-ay);
   if(via==='hv'){for(let x=ax;x!==bx;x+=sx)pts.push([x,ay]);for(let y=ay;y!==by+sy||!sy;y+=sy){pts.push([bx,y]);if(!sy)break;}}
   else{for(let y=ay;y!==by;y+=sy)pts.push([ax,y]);for(let x=ax;x!==bx+sx||!sx;x+=sx){pts.push([x,by]);if(!sx)break;}}
   const lo=Math.floor((w-1)/2),hi=w-1-lo;for(const[x,y]of pts)for(let dy=-lo;dy<=hi;dy++)for(let dx=-lo;dx<=hi;dx++)add(x+dx,y+dy,null);
   let prev=inRoom(...pts[0]);for(let i=1;i<pts.length;i++){const cur=inRoom(...pts[i]);if(cur!==prev){const[x0,y0]=pts[i-1],[x1,y1]=pts[i],h=x0!==x1;doors.push({x:h?Math.max(x0,x1):x0+.5,y:h?y0+.5:Math.max(y0,y1),axis:h?'v':'h',lo:-lo,hi:hi+1,room:prev>=0?prev:cur});}prev=cur;}}
  let W=0,H=0;for(const k of cells){const[x,y]=k.split(':').map(Number);W=Math.max(W,x+1);H=Math.max(H,y+1);}
  return{cells,owner,doors,bounds:[0,0,W+3,H+3]};}
 const roomH=(z,ri)=>{const R=z.rooms[ri];return R?(R.wall||WALL[R.kind]||3.2):WALL.corridor;};
 function heights(L,z,owner,doors){// 벽마다 맞닿은 방의 높이 + 작은 변화, 문 옆 기둥(문틀)은 문보다 높게.
  for(const w of L.walls||[]){const h=w.width>w.depth,side=h?[[w.x,w.y-.5],[w.x,w.y+.5]]:[[w.x-.5,w.y],[w.x+.5,w.y]];let ri=null;for(const[sx,sy]of side){const o=owner.get(K(Math.floor(sx),Math.floor(sy)));if(o!=null){ri=o;break;}}
   const base=roomH(z,ri),v=((hash(w.id)%7)-3)*.07;w.height=+(Math.max(base>2?DOOR+.3:base,base+v)).toFixed(2);w.r115={room:ri,base};}
  const jambs=[];for(const d of doors){const top=Math.max(roomH(z,d.room),DOOR+.4)+.12;for(const t of[d.lo,d.hi]){const p=d.axis==='v'?{x:d.x,y:d.y-.5+t}:{x:d.x-.5+t,y:d.y};jambs.push({id:L.id+'-jamb:'+jambs.length,x:p.x,y:p.y,width:.34,depth:.34,height:+top.toFixed(2),annex:true,samongR103:true,r115Jamb:true});}}
  L.walls.push(...jambs);if(L.worldR74)L.worldR74.wallCount=L.walls.length;return jambs.length;}
 function layout(z,ep,api){const{cells,owner,doors,bounds}=carve(z),epx={...ep,style:z.style||ep.style};
  const nodes=z.rooms.map((R,n)=>({id:n,x:R.x+R.w/2,y:R.y+R.h/2,radius:Math.min(R.w,R.h)/2,shape:'square',width:R.w,depth:R.h,name:R.name}));
  const edges=(z.links||[]).map(([a,b,w])=>[a,b,w||3]);
  const extra={kind:z.kind,r115:z.id,rooms:z.rooms.map(R=>({x:R.x,y:R.y,w:R.w,h:R.h,name:R.name,kind:R.kind})),doors:doors.map(d=>({x:d.x,y:d.y,axis:d.axis})),
   exit:z.exit?{...z.exit}:null,centre:z.exit?{...z.exit}:{x:nodes[0].x,y:nodes[0].y},save:z.save?{...z.save}:null,chests:(z.chests||[]).map(c=>({...c})),
   dais:z.dais?{...z.dais}:null,landings:(z.landings||[]).map(c=>({...c})),patrol:z.patrol?z.patrol.routes.map(r=>r.map(([x,y])=>({x,y}))):null,path:[]};
  const L=api.build(z.id,epx,cells,{nodes,edges,entry:{...z.entry,node:0},bounds,wallHeight:WALL.room,extra});
  L.samongR115={rev:REV,zone:z.id,title:z.title,kind:z.kind,jambs:heights(L,z,owner,doors),doors:doors.length};
  if(L.worldR74){L.worldR74.rooms=extra.rooms;L.worldR74.doors=extra.doors;}
  if(z.dark)L.samongR115.dark=true;return L;}

 // ---- 소품·단서 ---------------------------------------------------------------------------------
 const clueId=(z,n)=>z.id+':clue:'+n;
 function deco(id,kind,x,y){return{id:'r115:'+id,x,y,solid:false,autoTargetEligible6:false,visible:true,r74Prop:kind,r105Prop:kind,r115Prop:kind};}
 function dress(r,z,api){const L=r.exploration,x=L.samongR103;let n=0;
  z.rooms.forEach((R,ri)=>{if(R.grid){const g=R.grid;for(let j=0;j<g.rows;j++)for(let i=0;i<g.cols;i++)r.props.push({...deco(z.id+':g'+ri+':'+i+':'+j,g.kind,g.x+i*g.dx,g.y+j*g.dy),r115Hide:true});n+=g.rows*g.cols;}
   for(const[kind,side,step]of R.along||[]){const pts=[];if(side==='n'||side==='s'){const y=side==='n'?R.y+.7:R.y+R.h-.7;for(let px=R.x+1.5;px<R.x+R.w-1;px+=step)pts.push([px,y]);}else{const px=side==='w'?R.x+.7:R.x+R.w-.7;for(let y=R.y+1.5;y<R.y+R.h-1;y+=step)pts.push([px,y]);}
    for(const[px,py]of pts){if(Math.hypot(px-L.entry.x,py-L.entry.y)<2.5)continue;r.props.push(deco(z.id+':a'+ri+':'+side+':'+Math.round(px*10)+':'+Math.round(py*10),kind,px,py));n++;}}});
  (z.clues||[]).forEach((c,i)=>{const R=z.rooms[c.room],at={x:R.x+c.at[0],y:R.y+c.at[1]};r.props.push({id:'r115:'+clueId(z,i),x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:'record',r74Prop:c.prop||'crate',label:c.label,r115Clue:clueId(z,i),r105Record:{key:c.key,sub:c.sub,n:c.n||1,label:c.label}});});
  if(z.solve){const d=x.dais;z.solve.statements.forEach((s,i)=>{const a=-Math.PI/2+i*2.094,at={x:d.x+Math.cos(a)*5.6,y:d.y+Math.sin(a)*5.6};r.props.push({id:'r115:'+z.id+':stmt:'+i,x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:'record',r74Prop:'workbench',label:s.label,r115Stmt:i,r105Record:{key:s.key,sub:s.sub,n:s.n||1,label:s.label}});});}
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
  if(z.kind==='combat'){if(g.kills&&(S?.kills||0)<g.kills)return false;if(g.clues&&!cluesDone(z))return false;return true;}
  return false;}
 function use(p,api){const z=zone(room?.samongR103?.zone);if(!z)return false;
  if(p.r115Clue){const i=(z.clues||[]).findIndex((c,n)=>clueId(z,n)===p.r115Clue),c=z.clues[i];if(!c)return false;
   if(c.after!=null&&!read(clueId(z,c.after))){say('먼저 '+z.clues[c.after].label+' 쪽을 살펴보세요.',3);return true;}
   const first=!read(p.r115Clue);mark(p.r115Clue);const ok=api.record(p);if(first){if(c.spawn)api.burst(c.spawn,c.mobs,c.mobName,p);if(cluesDone(z))say('단서를 모두 확인했습니다 · 다음 문이 열립니다.',3);}try{saveGame(false);}catch(e){}return ok!==false;}
  if(p.r115Stmt!=null){const s=solveOf(z);if(p.r115Stmt>s.stmt){say('진술은 차례대로 적습니다 · '+z.solve.statements[s.stmt].label,3);return true;}
   api.record(p);if(p.r115Stmt===s.stmt){s.stmt++;if(s.stmt>=z.solve.statements.length)crack(z,api);try{saveGame(false);}catch(e){}}return true;}
  if(p.r115Book){const s=solveOf(z);const sc=scenesFor([s.book?z.solve.cut:z.solve.book],z,s.book?'cut':'book');
   if(!s.book){s.book=1;play(sc,()=>say('출석부 위의 검은 선 · 다시 E 로 그 선만 끊습니다. 이름은 건드리지 않습니다.',4));}
   else if(!s.cut){s.cut=1;play(sc,()=>{api.removeProp(p);api.clear();});}try{saveGame(false);}catch(e){}return true;}
  return false;}
 function crack(z,api){// 진술을 끝까지 적으면 순찰자의 얼굴이 갈라진다 — 처치가 아니라 해제.
  const b=api.boss();if(b){b.r115Released=true;b.hp=0;b.deadRecorded=true;b.spawnState='dead';b.deadAt=typeof time==='number'?time:0;b.samongR103Silent=true;}
  const d=room.exploration.samongR103.dais;api.addProp({id:'r115:'+z.id+':book',x:d.x,y:d.y,solid:false,autoTargetEligible6:false,visible:true,samongR103:'record',r74Prop:'workbench',label:z.solve.book.label,r115Book:true});
  say('순찰자의 얼굴이 갈라졌습니다 · 가운데의 젖은 출석부를 E 로 펼치세요.',4);}
 // 잠입: 순찰자는 쓰러지지 않는다. 손전등 빛이나 정면에 들키면 가까이 온다. 책상 사이에 숨으면 지나간다.
 function patrolTick(r,z,dt,api){const x=r.samongR115Patrol||(r.samongR115Patrol={units:[],alert:0,seen:0,hit:0}),L=r.exploration.samongR103;if(!L.patrol)return;
  if(!x.units.length)L.patrol.forEach((route,n)=>{const e=api.spawn(z.patrol.donor,route[0],{name:z.patrol.name,tag:'p'+n,boss:false,hpScale:3});if(!e)return;e.samongPatrolR115=true;e.samongSurvival=false;e.autoTargetEligible6=false;e.cd=99;e.damage=(e.damage||10)*.9;x.units.push({id:e.id,route,leg:1,chase:0});});
  const hidden=r.props.some(p=>p.r115Hide&&Math.hypot(p.x-player.x,p.y-player.y)<1.15)&&Math.hypot(player.moveVX150||0,player.moveVY150||0)<2.2,lit=settings?.flashlight58!==false;
  for(const u of x.units){const e=r.enemies.find(q=>q.id===u.id);if(!e)continue;e.hp=e.maxHp;e.cd=Math.max(e.cd||0,5);e.deadRecorded=false;
   const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy),face=u.face||{x:1,y:0},cos=(dx*face.x+dy*face.y)/(d||1),reach=lit?7.5:5;
   const sees=!hidden&&d<reach&&cos>.42&&api.sight(e,player)||d<1.6;
   if(sees){if(!u.chase&&!x.seen){x.seen=1;play(scenesFor([z.patrol.spotted],z,'spotted'));}u.chase=4.5;}
   let tx,ty,sp;if(u.chase>0){u.chase-=dt;tx=player.x;ty=player.y;sp=3.1;}else{const w=u.route[u.leg];tx=w.x;ty=w.y;sp=1.7;if(Math.hypot(tx-e.x,ty-e.y)<.4)u.leg=(u.leg+1)%u.route.length;}
   const mx=tx-e.x,my=ty-e.y,m=Math.hypot(mx,my);if(m>.05){const s=Math.min(m,sp*dt);const nx=e.x+mx/m*s,ny=e.y+my/m*s;if(!blocked(nx,ny,.3,r)){e.x=nx;e.y=ny;}else if(u.chase>0)u.chase=0;u.face={x:mx/m,y:my/m};e.moveVX150=mx/m*sp;e.moveVY150=my/m*sp;}
   if(u.chase>0&&d<1.1&&time-x.hit>1.6){x.hit=time;try{damagePlayer?.(Math.round(maxHP()*.16),e);}catch{player.hp=Math.max(1,player.hp-maxHP()*.16);}const back=st()?.checkpoint||r.exploration.entry;player.x=back.x;player.y=back.y;try{cam={x:player.x,y:player.y};}catch(err){}u.chase=0;say('열쇠 소리가 등 뒤까지 왔습니다 · 마지막 자리로 물러납니다.',3);}}}
 function tick(r,z,dt,api){try{if(z.stealth)patrolTick(r,z,dt,api);
   if(z.wander&&(z.wander.afterClue==null||read(clueId(z,z.wander.afterClue))))api.wander(z.wander);
   if(z.solve&&!solveOf(z).cut){const b=api.boss();if(b&&b.hp>0&&!b.r115Released&&solveOf(z).stmt<z.solve.statements.length){const f=b.maxHp*z.solve.floor;if(b.hp<f){b.hp=f;if(time-(r.r115FloorAt||-9)>6){r.r115FloorAt=time;say('순찰자는 쓰러지지 않습니다 · 둘레의 책상에서 확인서 대신 사실을 적으세요(E).',4);}}}}
  }catch(e){fail(e);}}
 function navGoal(r,z){const x=r.samongR103,pt=(p,label,kind)=>p?{x:p.x,y:p.y,label,kind}:null;if(x.portal)return null;
  if(z.solve&&x.bossUp){const s=solveOf(z),i=s.stmt;if(i<z.solve.statements.length){const p=r.props.find(q=>q.r115Stmt===i);return pt(p,z.solve.statements[i].label,'objective');}const b=r.props.find(q=>q.r115Book);if(b)return pt(b,b.label,'objective');}
  for(let i=0;i<(z.clues||[]).length;i++){const c=z.clues[i];if(read(clueId(z,i)))continue;if(c.after!=null&&!read(clueId(z,c.after)))continue;if(z.kind==='combat'&&z.goal?.kills&&(st()?.kills||0)<z.goal.kills&&i>0)break;const p=r.props.find(q=>q.r115Clue===clueId(z,i));if(p)return pt(p,c.label,'objective');}
  return null;}
 function hudText(r,z){const S=st(),g=z.goal||{},list=chapterOf(z),n=list.indexOf(z)+1,tag=n+'/'+list.length,x=r.samongR103;
  const clues=(z.clues||[]).length,got=(z.clues||[]).filter((c,i)=>read(clueId(z,i))).length;
  let text,dest,unlock;
  if(x.portal){text='문이 열렸습니다 · 문에서 E';unlock='다음 구역으로';}
  else if(z.kind==='explore'){text='원문 단서 '+got+' / '+clues+' · 빛나는 표식에서 E';unlock='단서를 모두 보면 다음 문';}
  else if(z.kind==='combat'){text=(g.kills?'처치 '+Math.min(S?.kills||0,g.kills)+' / '+g.kills:'')+(clues?' · 단서 '+got+'/'+clues:'')+(g.reach?' · 끝의 문까지':'');unlock=g.reach?'목표를 채우면 끝의 문이 열립니다':'목표를 채우면 문';}
  else if(z.kind==='maze'){text=z.stealth?'순찰자는 쓰러지지 않습니다 · 책상 사이에 숨어 지나가세요':'손전등이 비추는 쪽으로 출구를 찾으세요';unlock='출구에 닿으면 다음 구역 · 등불에서 저장';}
  else{const s=solveOf(z);text=z.solve?(x.bossUp?'진술 '+s.stmt+' / '+z.solve.statements.length+(s.stmt>=z.solve.statements.length?' · 출석부의 명령선':''):'계단을 따라 위쪽으로'):x.bossUp?'대면':'위쪽으로';unlock=z.solve?'쓰러뜨리는 것이 아니라 사실을 적어 끝냅니다':'대면 후 다음 구역';}
  dest=z.title+' · 구역 '+tag;return{text,dest,unlock,badge:z.title+' '+tag,sub:{explore:'탐색',maze:'손전등 미로',combat:'전투',confront:'대면'}[z.kind]+' · '+tag};}
 const chapterOf=z=>{for(const list of Object.values(CH))if(list.includes(z))return list;return[z];};

 // ---- 구버전 저장 → 구역 (지우지 않고 옮긴다) ------------------------------------------------------
 function migrate(key,stage){const list=chapter(key);if(!list)return null;if(stage==='maze')return(list.find(z=>z.kind==='maze')||list[0]).id;if(stage==='ascent')return list[list.length-1].id;return list[0].id;}

 // ---- 777: 구역 목록 ------------------------------------------------------------------------------
 function inject(){try{if(!document.getElementById('codeMap')||document.getElementById('r115Zones'))return;const panel=document.getElementById('panel');if(!panel)return;const eps=SM()?.episodes||[];const div=document.createElement('div');div.id='r115Zones';
   let h='<div class="eyebrow">777 / 사몽 구역 이동</div><label for="r115Zone">구역</label> <select id="r115Zone">';for(const[key,list]of Object.entries(CH)){const i=eps.findIndex(e=>e.key===key);for(const z of list)h+='<option value="'+esc(z.id)+'">'+esc(key)+' · '+esc(eps[i]?.title||'')+' — '+esc(z.title)+' ('+esc(z.id)+')</option>';}
   h+='</select> <button id="r115ZoneGo">구역으로 이동</button>';div.innerHTML=h;panel.appendChild(div);document.getElementById('r115ZoneGo').onclick=()=>{if(window.__STORYWORLD_CHEAT777__?.active?.()!==true){say('777 코드를 먼저 적용하세요.',3);return;}try{closePanel(true);}catch(e){}SM()?.goZone?.(document.getElementById('r115Zone').value);};}catch(e){fail(e);}}
 function install(){if(typeof openPanel==='function'){const b=openPanel;openPanel=function(html,...a){const r=b.call(this,html,...a);try{if(typeof html==='string'&&html.includes('id="codeMap"'))inject();}catch(e){fail(e);}return r;};}}
 try{install();}catch(e){fail(e);}
 function inspect(){return{revision:REV,failures,lastError,chapters:Object.fromEntries(Object.entries(CH).map(([k,v])=>[k,v.map(z=>z.id)])),zones:ALL.size,current:typeof room!=='undefined'?room?.samongR115||null:null};}
 window.__STORYWORLD_SAMONG_ZONES_R115__=Object.freeze({revision:REV,chapters:CH,chapter,zone,stageOf,layout,dress,tick,use,done,navGoal,hudText,scenesFor,play,migrate,clueId,cluesDone,solveOf,carve,inspect});
})();
