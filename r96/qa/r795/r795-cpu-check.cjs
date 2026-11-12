// R795 CPU check — 영웅 전수 점검(사용자 2026-11-11 "영웅관련 버그 절대 없도록 전수점검디버깅")에서 브라우저 행렬 검사(qa/r795/hero-matrix.mjs)가 찾은 버그의 회귀 검사.
//  ② R390 싸움 표시(e.r390Engaged = 방 객체)는 셀 수 없는(non-enumerable) 속성이어야 한다 — 몹을 JSON 으로 본뜨는 곳(R170 조형물·R193 사몽 인형 몹·R446 기둥 몹)과
//     펼쳐 복사({...e})에 방 객체가 딸려 가지 않게. 예전엔 싸움 중인 몹을 본뜨면 순환 참조 오류로 그 몹들이 조용히 안 생겼다.
//  ① R170 피의 육망성 조형물: 본뜰 잡몹이 이미 싸움에 들어가 있으면(R390 이 e.r390Engaged = 방 객체로 표시) JSON.stringify 가 순환 참조로 터져
//     조형물이 서지 않고, 그 방은 '이미 세움'으로 적혀 다시 시도하지도 않았다(슬레이어 난타 상황에서 내부 오류 집계로 발견).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d));}else console.log('ok  ',m);};
ok('pages.yml runs this check',/r96\/qa\/r795\/r795-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
for(const f of ['combat-r170.js','aggro-chase-r390.js'])ok(f+' runtime copy matches client source',RT(f)===C(f));

// ---- ① R170 조형물 세우기 -----------------------------------------------------------------------------
function r170(mark){let t=0;const mk=()=>({fillStyle:'',strokeStyle:'',fillRect(){},rect(){},fillText(){},stroke(){},strokeRect(){},setLineDash(){},save(){},restore(){},translate(){},scale(){},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){}});
 const floor=[];for(let x=0;x<60;x++)for(let y=0;y<60;y++)floor.push([x,y]);
 const mob=(id,x,y,o={})=>({id,x,y,hp:10,maxHp:10,damage:5,spawnState:'active',name:'잡몹',...o});
 const room={id:'ep1a09',props:[],enemies:[],exploration:{floorCells:floor,entry:{x:1.5,y:1.5}},objective:{x:50,y:50}};
 for(let i=0;i<24;i++)room.enemies.push(mob('m'+i,3+(i%4)*.6,3+Math.floor(i/4)*.6));
 const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},ctx:mk(),room,player:{x:2,y:2,hp:100,samong:0,ego:0},started:true,hazards:[],effects:[],uid:0,VFX:{mark:'m'},
  regionById:{ep1a09:{regionObjects6:[{path:'assets/props/v290/hotel_luggage_cart.webp'},{path:'assets/props/v290/blank_memorial.webp',height:92}]}},
  safeRegion:()=>false,blocked:()=>false,project:(x,y)=>({x:x*10,y:y*5}),actorHeight:()=>60,attackPower:()=>100,readyImage:()=>({image:{}}),ensureImages(){},
  drawEnemy(){},drawHazard(){},drawEffect(){},drawProp(){},shadow(){},tick(){},async enterRegion(){return true;},Math,JSON,String,Object,Number,Set,Map,Array,Promise};
 Object.defineProperty(sb,'time',{get:()=>t});vm.createContext(sb);vm.runInContext(C('combat-r170.js'),sb);const X=sb.window.__STORYWORLD_COMBAT_R170__;
 return new Promise(res=>{sb.enterRegion().then(()=>{});setImmediate(()=>{t=1;vm.runInContext('tick()',sb);
  mark(room);t=8;const sp=X.nextSpot();sb.player.x=sp.x+3;sb.player.y=sp.y;vm.runInContext('tick()',sb);
  const tw=room.enemies.filter(e=>e.r170Tower);res({tw,room,ins:X.inspect(),sb,X,step:(dt)=>{t+=dt;vm.runInContext('tick()',sb);}});});});}
(async()=>{
 // 정상 경로(회귀): 싸움 표시가 없으면 예전처럼 하나 선다
 const a=await r170(()=>{});ok('R170 baseline: one tower is placed when no mob is engaged',a.tw.length===1&&a.ins.stats.errors===0,{n:a.tw.length,ins:a.ins});
 // 버그 경로: 모든 잡몹이 싸움 중(r390Engaged = 방 객체, 순환 참조)
 const b=await r170(room=>{for(const e of room.enemies)e.r390Engaged=room;});
 ok('R170: tower is still placed when the donor mob is engaged (r390Engaged points at the room)',b.tw.length===1,{n:b.tw.length,lastError:b.ins.lastError});
 ok('R170: no swallowed error while placing with engaged mobs',b.ins.stats.errors===0,b.ins.lastError);
 ok('R170: the tower copy does not carry the engaged-room reference or the donor identity',b.tw.length===1&&b.tw[0].r390Engaged===undefined&&/^r170:tower:/.test(b.tw[0].id),b.tw[0]&&{id:b.tw[0].id,eng:typeof b.tw[0].r390Engaged});
 // 경계: 첫 잡몹만 싸움 중 / 다른 객체 참조가 섞인 잡몹(방을 가리키는 임의 필드)
 const c=await r170(room=>{room.enemies[0].r390Engaged=room;});ok('R170: placed when only the first mob is engaged',c.tw.length===1&&c.ins.stats.errors===0,{n:c.tw.length,e:c.ins.lastError});
 const d=await r170(room=>{for(const e of room.enemies){e.someRoomRef={room};e.self=e;}});ok('R170: placed when mobs carry other circular references (room inside an object, self reference)',d.tw.length===1&&d.ins.stats.errors===0,{n:d.tw.length,e:d.ins.lastError});
 // 조형물이 부르는 잡몹(소환)도 같은 사본에서 나오므로 오류 없이 나와야 한다
 let summonErr=null;try{for(let i=0;i<40;i++)b.step(.7);}catch(e){summonErr=String(e);}
 ok('R170: tower keeps casting/summoning from the copy without errors',!summonErr&&b.X.inspect().stats.errors===0,{summonErr,ins:b.X.inspect()});
 // ---- ② R390 표시는 셀 수 없는 속성 -----------------------------------------------------------------
 {const room={id:'z',enemies:[]},mob={id:'m1',x:3,y:3,hp:10,spawnState:'active',combatProfile:{aggro:6}};room.enemies.push(mob);let hit=0;
  const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},room,player:{x:3,y:4,hp:100},started:true,loading:false,setInterval(){},hitEnemy(e){hit++;return true;},hurt(){return 'hit';},Math,JSON,String,Object,Number,Array};
  vm.createContext(sb);vm.runInContext(C('aggro-chase-r390.js'),sb);const A=sb.window.__STORYWORLD_AGGRO_CHASE_R390__;
  ok('R390 baseline: a mob the hero hit becomes engaged (chases until it dies)',(vm.runInContext('hitEnemy(room.enemies[0],5)',sb),hit===1&&A.engaged(mob)&&mob.r390Engaged===room));
  let js=null,err=null;try{js=JSON.stringify(mob);}catch(e){err=String(e).slice(0,80);}
  ok('R390: an engaged mob can be copied with JSON (no circular reference to the room)',!!js&&!err&&!/r390Engaged/.test(js),err||js);
  ok('R390: the mark is not carried by spread copies or key listings',!Object.keys(mob).includes('r390Engaged')&&({...mob}).r390Engaged===undefined);
  const copy=JSON.parse(js);room.enemies.push(copy);ok('R390: a JSON copy of an engaged mob starts un-engaged',!A.engaged(copy));
  const room2={id:'z2',enemies:[mob]};sb.room=room2;ok('R390: the mark only counts in the room it was made in, and can be re-made in a new room',!A.engaged(mob)&&(vm.runInContext('hitEnemy(room.enemies[0],5)',sb),A.engaged(mob)&&mob.r390Engaged===room2));
  mob.hp=0;ok('R390: a dead mob is no longer engaged',!A.engaged(mob));
  // R193 사몽 인형 몹·R446 기둥 몹이 쓰는 복사 방식 그대로(JSON.parse(JSON.stringify(donor)))
  const donor={id:'d',x:1,y:1,hp:9,spawnState:'active',combatProfile:{aggro:5}};room2.enemies.push(donor);vm.runInContext('hitEnemy(room.enemies[1],1)',sb);let cl=null;try{cl=JSON.parse(JSON.stringify(donor));}catch(_){}
  ok('R193/R446 donor copy works on an engaged donor',!!cl&&cl.id==='d'&&A.engaged(donor));}
 console.log(`\nR795 CPU check: ${n-bad}/${n} passed`);process.exit(bad?1:0);
})();
