// R511 CPU check — 사몽·사몽역행 구역의 '그냥 지나치는 방'(입구·출구·등불·상자·단서·단상·코어·탑이 없는 방)에
//  기억 조각 하나와 그 조각을 지키는 몹 무리를 둔다. 방에 들어서면 몹이 깨어나고, 다 쓰러뜨리면 조각이 풀려 주우면 패시브 포인트.
//  한 번 주운 방은 저장되어 다시 나오지 않는다(포인트 농사 금지). 경계값·회귀(대면·B/D/G·잠입·탑·코업·사몽 밖) 포함.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='samong-rooms-r511.js';let src='';try{src=C(F);}catch(_){}
ok('overlay exists',src.length>0);
let rt='';try{rt=fs.readFileSync(path.join(R,'runtime-text',F),'utf8');}catch(_){}
ok('runtime copy matches client source',rt===src&&src.length>0);
try{new vm.Script(src||'throw 0');ok('syntax',true);}catch(e){ok('syntax',false);}
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('script tag once, after samong/growth overlays and before combat-r118',html.split('"./'+F+'"').length===2&&['samong-r103.js','growth-r103.js','samong-zones-r115.js','samong-play-r162.js','combat-r170.js','samong-wide-r355.js'].every(f=>html.indexOf('"./'+f+'"')>0&&html.indexOf('"./'+f+'"')<html.indexOf('"./'+F+'"'))&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-r118.js"'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('CI runs this check',/node r96\/qa\/r511\/samong-rooms-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
ok('samong-r103 exports spawnMob (small export, same spawn rules)',/spawnMob:\(row,at,o\)=>here\(\)\?spawn\(row,at,o\):null/.test(C('samong-r103.js')));
const code=src.replace(/\/\/.*$/mg,'');
ok('no Mammon map, no fire/flame, no story text rewrite',!/ep1b06|맘몬|flame|fire|불꽃|화염/.test(code)&&!/samong-text|sections\s*=/.test(code));
ok('planning is deterministic (no Math.random)',!/Math\.random/.test(code));
ok('off switch key storyworld.r511.rooms',/storyworld\.r511\.rooms/.test(src));

// ---- 가짜 세계 -------------------------------------------------------------------------------
function boot(o={}){const S={points:0,toasts:[],saved:0,spawned:[],drawn:[],sounds:[]};
 const ZONES={};const ctx={localStorage:{getItem:k=>o.ls?.[k]??null,setItem:()=>{}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,setTimeout:()=>0,
  time:0,loading:false,modal:null,player:{x:0,y:0,hp:100,points:0},room:null,TILE:64,zoom:1,
  blocked:(x,y,r,rm)=>{const L=(rm||ctx.room).exploration;return !L.floorCells.some(([cx,cy])=>cx===Math.floor(x)&&cy===Math.floor(y));},
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  ctx:new Proxy({},{get:(t,k)=>k in t?t[k]:(typeof k==='string'?(()=>{S.drawn.push(k);}):undefined),set:(t,k,v)=>{t[k]=v;return true;}}),
  toast:(t)=>S.toasts.push(t),sound:k=>S.sounds.push(k),saveGame:()=>{S.saved++;},updateHUD:()=>{},
  drawProp:function(p){S.drawn.push('base:'+p.id);},tick:function(){},enterRegion:async function(){},
  serializeSave:function(){return{v:1};},restoreSave:async function(raw){return true;},newGame:async function(){},
  __STORYWORLD_PROGRESSION_R71__:{inspect:()=>({difficultyTier:o.tier||'normal'})},
  __STORYWORLD_COOP_SIM_R62__:{mode:()=>o.coop||'off'},
  __STORYWORLD_SAMONG_ZONES_R115__:{zone:id=>ZONES[id]||null},
  __STORYWORLD_SAMONG_R103__:{here:()=>!!ctx.room?.samongR103,episodes:[{mobs:[['a','m0']]},{mobs:[['b','m1'],['b','m2']],mobName:'형상'}],
   spawnMob:(row,at,opt)=>{if(o.noSpawn)return null;const e={id:'sm:'+S.spawned.length,x:at.x,y:at.y,hp:30,maxHp:30,damage:8,name:opt?.name||'형상',row,opt,spawnState:'active'};ctx.room.enemies.push(e);S.spawned.push(e);return e;}}};
 ctx.window=ctx;vm.createContext(ctx);try{vm.runInContext(src,ctx);}catch(e){console.log('load error',e.message);}
 return{ctx,S,ZONES,api:ctx.__STORYWORLD_SAMONG_ROOMS_R511__};}
// 구역: 입구 방(0) → 복도(1) → 빈 곁방(2) / 상자 방(3) / 출구 방(4) / 좁은 방 4×9(5) / 5×5 경계(6) / 큰 아레나 40×30(7)
function zoneWorld(extra={}){const rooms=[{x:2,y:2,w:8,h:8,kind:'room',name:'입구 방'},{x:10,y:5,w:20,h:3,kind:'corridor',name:'복도'},{x:12,y:10,w:10,h:8,kind:'room',name:'빈 교실'},
  {x:24,y:10,w:8,h:8,kind:'room',name:'상자 방'},{x:30,y:2,w:8,h:8,kind:'hall',name:'출구 방'},{x:12,y:20,w:4,h:9,kind:'room',name:'좁은 방'},{x:18,y:20,w:5,h:5,kind:'yard',name:'작은 마당'},{x:40,y:2,w:40,h:30,kind:'hall',name:'큰 아레나'}];
 const cells=[];for(const q of rooms)for(let x=q.x;x<q.x+q.w;x++)for(let y=q.y;y<q.y+q.h;y++)cells.push([x,y]);
 const L={floorCells:cells,entry:{x:5,y:5},samongR103:{rooms,exit:{x:34,y:5},save:null,chests:[{x:28,y:14}],dais:null,core:null,landings:[],mode:extra.mode||null}};
 const z={id:extra.id||'sz115-T-1',kind:extra.kind||'combat',mode:extra.mode,stealth:extra.stealth,mobs:[['c','m9']],mobName:'칠판의 글씨'};
 return{room:{id:'host',samongR103:{zone:z.id,ep:1},exploration:L,props:[],enemies:extra.enemies||[]},z};}
const B=boot();const api=B.api;
ok('api exported',!!api&&typeof api.pick==='function'&&typeof api.infoOf==='function'&&typeof api.inspect==='function');
if(!api){console.log(`\n${n-bad}/${n} passed`);process.exit(1);}
{const {room}=zoneWorld();const got=api.pick(api.infoOf(room)).map(q=>q.name);
 ok('picks the empty side room and the 5×5 boundary yard only',JSON.stringify(got.sort())===JSON.stringify(['빈 교실','작은 마당'].sort()));
 ok('skips entry/exit/chest rooms, corridors, rooms under 5 wide, and big arenas (>600 tiles)',!got.some(nm=>['입구 방','상자 방','출구 방','복도','좁은 방','큰 아레나'].includes(nm)));}
{const {room}=zoneWorld({enemies:[{id:'t',x:16,y:13,hp:50,r170Tower:{}}]});ok('a room holding an F-mode tower is not a nest',!api.pick(api.infoOf(room)).some(q=>q.name==='빈 교실'));}
{const {room}=zoneWorld();room.props.push({id:'clue',x:15,y:14,samongR103:'record',r115Clue:'x'});ok('a room holding a clue record is not a nest',!api.pick(api.infoOf(room)).some(q=>q.name==='빈 교실'));}
{const {room}=zoneWorld();room.props.push({id:'deco',x:15,y:14,r115Prop:'workbench'});ok('decoration props alone do not give a room a purpose',api.pick(api.infoOf(room)).some(q=>q.name==='빈 교실'));}
{const rooms=[];for(let i=0;i<9;i++)rooms.push({x:i*7,y:0,w:6,h:6,kind:'room',name:'방'+i});const cells=[];for(const q of rooms)for(let x=q.x;x<q.x+q.w;x++)for(let y=q.y;y<q.y+q.h;y++)cells.push([x,y]);
 const room={samongR103:{zone:'z'},exploration:{floorCells:cells,entry:{x:2,y:2},samongR103:{rooms,exit:{x:58,y:2}}},props:[],enemies:[]};const p=api.pick(api.infoOf(room));
 ok('at most CAP nests per zone, farthest-from-entry first, deterministic',p.length===api.CAP&&api.CAP<=4&&JSON.stringify(p.map(q=>q.name))===JSON.stringify(api.pick(api.infoOf(room)).map(q=>q.name))&&p[0].name==='방7');}
ok('zone filter: confront, B/D/G, stealth are skipped; explore/maze/combat/F/H kept',
 !api.zoneOk({kind:'confront'})&&!api.zoneOk({kind:'combat',mode:'B'})&&!api.zoneOk({kind:'combat',mode:'D'})&&!api.zoneOk({kind:'combat',mode:'G'})&&!api.zoneOk({kind:'maze',stealth:true})&&
 api.zoneOk({kind:'explore'})&&api.zoneOk({kind:'maze'})&&api.zoneOk({kind:'combat'})&&api.zoneOk({kind:'combat',mode:'F'})&&api.zoneOk({kind:'combat',mode:'H'})&&!api.zoneOk(null));
ok('shard points by difficulty: easy 1 · normal 2 · hard 3 (below one samong chest 2·5·7)',api.SHARD.easy===1&&api.SHARD.normal===2&&api.SHARD.hard===3);

// ---- 실행 흐름 --------------------------------------------------------------------------------
function play(o={}){const b=boot(o),{ctx,S,ZONES}=b;const w=zoneWorld(o.zw||{});ZONES[w.z.id]=w.z;ctx.room=w.room;ctx.player.x=5;ctx.player.y=5;
 const step=(dt=.25,k=1)=>{for(let i=0;i<k;i++){ctx.time+=dt;ctx.tick(dt);}};return{...b,w,step};}
{const P=play();P.step(.25,8);const sh=P.ctx.room.props.filter(p=>p.r511Shard);
 ok('after settling, one sealed shard per nest (2), placed on floor, not solid',sh.length===2&&sh.every(p=>p.solid===false&&!P.ctx.blocked(p.x,p.y,.1)&&p.r511State==='sealed'));
 ok('no mobs before the player enters',P.S.spawned.length===0);
 const nest=sh.find(p=>p.label==='기억 조각'&&p.x>12&&p.x<22&&p.y>10&&p.y<18);ok('shard sits inside 빈 교실',!!nest);
 P.ctx.player.x=13;P.ctx.player.y=11;P.step(.25,1);
 ok('entering the room wakes a guard pack (2–3) of the zone mobs',P.S.spawned.length>=2&&P.S.spawned.length<=3&&P.S.spawned.every(e=>e.row[1]==='m9'&&e.r511Nest)&&nest.r511State==='awake');
 ok('pack is not survival/boss (never blocks zone goals, never counts toward 666)',P.S.spawned.every(e=>!e.samongSurvival&&!e.boss&&!e.samongBoss));
 ok('pack spawns on floor at least 2 tiles from the hero',P.S.spawned.every(e=>!P.ctx.blocked(e.x,e.y,.1)&&Math.hypot(e.x-13,e.y-11)>=2));
 const n0=P.S.spawned.length;P.step(.25,4);ok('no second pack while awake',P.S.spawned.length===n0);
 P.ctx.player.x=nest.x;P.ctx.player.y=nest.y;P.step(.25,2);ok('cannot pick a shard while its guards live',P.ctx.player.points===0&&nest.r511State==='awake');
 P.S.spawned.forEach(e=>{e.hp=0;e.deadRecorded=true;e.spawnState='dead';});P.ctx.player.x=nest.x+3;P.ctx.player.y=nest.y;P.step(.25,1);
 ok('killing the pack frees the shard',nest.r511State==='free');
 P.ctx.player.x=nest.x+.5;P.ctx.player.y=nest.y;P.step(.25,1);
 ok('walking onto a free shard gives +2 (normal) and removes it',P.ctx.player.points===2&&!P.ctx.room.props.includes(nest)&&P.S.saved>0&&P.S.toasts.some(t=>/기억 조각/.test(t)&&/\+2/.test(t)));
 ok('picked nest recorded as done',P.api.state().done.length===1);
 const d=P.ctx.serializeSave();ok('save carries samongRoomsR511.done',Array.isArray(d.samongRoomsR511?.done)&&d.samongRoomsR511.done.length===1);
 // 재입장: 같은 구역 새 방 객체 → 주운 방은 다시 나오지 않는다
 const w2=zoneWorld();P.ctx.room=w2.room;P.step(.25,8);ok('re-entry: picked room gives no shard again, the other one still waits',P.ctx.room.props.filter(p=>p.r511Shard).length===1);
 // 불러오기
 const P2=play();P2.ctx.restoreSave({samongRoomsR511:{v:1,done:d.samongRoomsR511.done}});P2.step(.25,8);ok('restore: done list survives load',P2.ctx.room.props.filter(p=>p.r511Shard).length===1);
 P2.ctx.restoreSave({samongRoomsR511:{v:1,done:[1,{},'x'.repeat(300)]}});ok('restore: junk entries are dropped',P2.api.state().done.length===0);
 P2.ctx.newGame();ok('new game clears the done list',P2.api.state().done.length===0);}
for(const[t,v]of[['easy',1],['hard',3]]){const P=play({tier:t});P.step(.25,8);const nest=P.ctx.room.props.find(p=>p.r511Shard);P.ctx.player.x=nest.x+.4;P.ctx.player.y=nest.y+.4;P.step(.25,1);P.S.spawned.forEach(e=>{e.hp=0;e.deadRecorded=true;});P.step(.25,1);P.step(.25,1);
 ok(t+' tier shard gives +'+v,P.ctx.player.points===v);}
{const P=play({noSpawn:true});P.step(.25,8);const nest=P.ctx.room.props.find(p=>p.r511Shard);P.ctx.player.x=nest.x+.4;P.ctx.player.y=nest.y+.4;P.step(.25,2);ok('if no guard could spawn, the shard is simply free (never stuck)',P.ctx.player.points===2);}
{const P=play({coop:'host'});P.step(.25,8);ok('co-op: nothing placed',!P.ctx.room.props.some(p=>p.r511Shard));}
{const P=play({zw:{mode:'B'}});P.step(.25,8);ok('B/D/G zone: nothing placed',!P.ctx.room.props.some(p=>p.r511Shard));}
{const P=play({ls:{'storyworld.r511.rooms':'{"on":false}'}});P.step(.25,8);ok('off switch: nothing placed',!P.ctx.room.props.some(p=>p.r511Shard));}
{const P=play();P.ctx.room={id:'ep1a08',exploration:{floorCells:[[0,0]]},props:[],enemies:[]};P.step(.25,8);ok('outside samong: nothing placed',P.ctx.room.props.length===0);}
{const P=play();P.step(.25,8);const s=P.ctx.room.props.find(p=>p.r511Shard);P.S.drawn.length=0;P.ctx.drawProp(s);ok('shard is drawn by the overlay, not the engine prop sprite',P.S.drawn.length>0&&!P.S.drawn.some(k=>String(k).startsWith('base:')));
 P.S.drawn.length=0;P.ctx.drawProp({id:'other'});ok('other props still go to the engine',P.S.drawn.includes('base:other'));}
{const P=play();P.step(.25,8);P.ctx.player.x=13;P.ctx.player.y=11;P.step(.25,1);const e=P.S.spawned[0];ok('guards are weaker than full mobs (hp .8, damage .75)',e&&e.opt?.hpScale===.8&&Math.abs(e.damage-6)<1e-9);}

// ---- 실제 사몽 구역 정의로 경제 점검 -----------------------------------------------------------
{const ctx2={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Number,String,Object,Array,Set,Map,WeakMap,Promise,setTimeout:()=>0};ctx2.window=ctx2;vm.createContext(ctx2);
 for(const f of['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js','samong-wide-r355.js',F])try{vm.runInContext(C(f),ctx2,{filename:f});}catch(e){}
 const A=ctx2.__STORYWORLD_SAMONG_ROOMS_R511__,CH=ctx2.__STORYWORLD_SAMONG_ZONES_R115__?.chapters;
 const est=A&&CH?A.estimate(CH):null;console.log('     estimate',JSON.stringify(est));
 ok('estimate over real chapters: covers 사몽(S-*) and 사몽역행(R*) zones',!!est&&est.byChapter&&Object.keys(est.byChapter).some(k=>/^S-/.test(k))&&Object.keys(est.byChapter).some(k=>/^R[A-G]$/.test(k)));
 ok('economy: nests ≤ 140 and normal-tier shard points ≤ 280 across the whole route',!!est&&est.nests>=60&&est.nests<=140&&est.nests*2<=280);}
console.log(`\n${n-bad}/${n} passed`);process.exit(bad?1:0);
