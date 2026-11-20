// R1258 CPU 검사 — 나태 보스전(ep1b02) 두 가지.
//  ① 서사 투척(sloth-throw-r1258.js): 정본 "날아오는 휴지 뭉치 … 녹슨 냉장고가 내 쪽으로 … 뒤로 물러선 자리 앞에 소파와 썩은 침대가 연달아 떨어졌다".
//     정상: 교전 중 보스가 휴지 뭉치 → 냉장고 → 소파·침대 차례로 방 소품 그림을 던짐, 맞으면 피해, 착지마다 R438 먼지 프레임 시트.
//     경계: 피하면(착지 자리 밖) 피해 없음, 좌표 NaN 이면 안 던짐, 도형(fill/stroke/arc) 그리기 0, 바닥 예고 0.
//     회귀: 다른 방·분신·교전 전·창 열림·끄기 → 아무 것도 안 함. R471(엔진 R61 던지기 그림 차례)은 그대로.
//  ② 소환 몹 본보기(summon-follow-r1224.js): 방의 일반 몹이 모두 사라진 뒤 보스가 부른 몹도 방이 처음 세운 몹(지금 그림)을 따름
//     (실측: 나태 보스가 필드 정리 뒤 옛 픽셀 '미뤄 둔 시간의 형상' r248/m022 을 소환). 회귀: R1224 원래 규칙(방에 살아 있는 몹 우선)은 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const TF='client-source/sloth-throw-r1258.js';ok(fs.existsSync(path.join(R,TF)),'sloth-throw-r1258.js exists');
const SRC=rd(TF);ok(rd('runtime-text/sloth-throw-r1258.js')===SRC,'runtime-text copy identical');
function world(o={}){const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,RegExp,console,isFinite,Date,
  localStorage:{getItem:k=>o.ls&&o.ls[k]||null,setItem(){}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var time=0,modal=false,loading=false,started=true,zoom=1,TILE=34,settings={lowFx:${!!o.low}},effects=[],hurts=[],plays=[],draws=[],shapes=0,shook=0;
 var player={x:10,y:10,hp:500,maxHp:500,invincible:0};
 var boss={id:'ep1b02:b02-boss',nativeId:'b02-boss',name:'나태에 잠식된 남자',boss:true,x:14,y:10,hp:1000,maxHp:1000,damage:12,spawnState:'active'};
 var room={id:'${o.zone||'ep1b02'}',engaged:true,enemies:[boss]};
 function readyImage(p){return {image:{naturalWidth:200,naturalHeight:200},crop:{x:0,y:0,w:200,h:200}};}
 function project(x,y){return {x:(x-y)*17,y:(x+y)*8.5};}
 function actorHeight(){return 60;}
 function clearLine(){return true;}
 function shakeCamera(k){shook++;}
 const rec=k=>function(){shapes++;};
 var ctx={save(){},restore(){},translate(){},rotate(){},scale(){},globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',
  drawImage(im,...a){draws.push({src:im.__p||'',a});},fill:rec(),stroke:rec(),arc:rec(),fillRect:rec(),strokeRect:rec(),ellipse:rec(),beginPath(){},moveTo(){},lineTo(){},closePath(){}};
 function drawImage(p,x,y,w,h,opt){draws.push({src:p,x,y,w,h,opt});return Number.isFinite(x)&&Number.isFinite(y);}
 function hurt(d,src){hurts.push({d,src,x:player.x,y:player.y});return 'hit';}
 function drawEffect(e){}
 function tick(dt){time+=dt;for(const e of effects)e.age+=dt;}
 function enterRegion(){return Promise.resolve(true);}
 window.__STORYWORLD_FX_MORE_R438__={play:(name,x,y,o)=>{plays.push({name,x,y,o});return {};}};
 window.__STORYWORLD_CANON_THROW_R471__={pick(){return null;}};`,c);
 vm.runInContext(SRC,c);return c;}
const run=(c,sec,step=.05)=>vm.runInContext(`for(let i=0;i<${Math.round(sec/step)};i++){tick(${step});for(const e of effects.slice())drawEffect(e);}`,c);
const A=(c,s)=>vm.runInContext(s,c);
// 정상: 순서·피해·먼지
let w=world();ok(A(w,'!!window.__STORYWORLD_SLOTH_THROW_R1258__'),'api exposed');
run(w,40);
const thrown=A(w,'__STORYWORLD_SLOTH_THROW_R1258__.inspect().thrown');
ok(Array.isArray(thrown)&&thrown.length>=4,'throws happen often during the fight (>=4 items in 40s): '+JSON.stringify(thrown));
const keys=thrown.map(t=>t.key);const first=[...new Set(keys)];
ok(first.slice(0,4).join(',')==='heap,fridge,sofa,bed','canon order heap→fridge→sofa→bed: '+keys.join(','));
ok(A(w,`draws.some(d=>/r80-025/.test(d.src))&&draws.some(d=>/r523\\/sloth-fridge/.test(d.src))&&draws.some(d=>/r523\\/sloth-sofa/.test(d.src))&&draws.some(d=>/r523\\/sloth-bed/.test(d.src))`),'draws the room prop art (heap, R523 fridge·sofa·bed)');
ok(A(w,'hurts.length')>0&&A(w,'hurts.every(h=>Number.isFinite(h.d)&&h.d>0&&h.src&&h.src.r1258)'),'standing still gets hit with finite damage: '+A(w,'hurts.length'));
ok(A(w,`plays.filter(p=>p.name==='enemy-shockwave').length`)>=4,'each landing plays the R438 dust frame sheet');
ok(A(w,'shapes')===0,'no shape drawing (fill/stroke/arc) at all');
ok(A(w,'draws.every(d=>!d.opt||(Number.isFinite(d.x)&&Number.isFinite(d.y)&&Number.isFinite(d.w)&&Number.isFinite(d.h)))'),'all draw coords finite');
// 첫 던지기는 교전 직후 몇 초 안
let w1=world();run(w1,4);ok(A(w1,'__STORYWORLD_SLOTH_THROW_R1258__.inspect().thrown.length')>=1,'first throw within 4s of engagement');
// 경계: 피하기
let w2=world();A(w2,`(()=>{const T=__STORYWORLD_SLOTH_THROW_R1258__;let h=0;const base=tick;tick=function(dt){base(dt);for(const f of T.inspect().flying)if(f.u>.5&&!f.moved){player.x+=6;player.y+=6;f.moved=1;}};})()`);
A(w2,`var dodgeLoop=0`);
// 날아가는 동안 영웅을 멀리 옮김: 매 틱 영웅을 착지 자리에서 4칸 밖으로
A(w2,`(()=>{const base=tick;tick=function(dt){base(dt);const F=__STORYWORLD_SLOTH_THROW_R1258__.inspect().flying;if(F.length){player.x=F[0].tx+4;player.y=F[0].ty+4;}};})()`);
run(w2,20);ok(A(w2,'hurts.length')===0,'dodging the landing spot takes no damage: '+A(w2,'hurts.length'));
// 경계: NaN 좌표
let w3=world();A(w3,'player.x=NaN');run(w3,10);ok(A(w3,'__STORYWORLD_SLOTH_THROW_R1258__.inspect().thrown.length')===0&&A(w3,'draws.length')===0,'NaN hero position → no throw, no draw');
// 회귀: 다른 방, 분신, 교전 전, 창 열림, 끄기
for(const [lab,o,pre] of [['other room (jealousy)',{zone:'ep1b03'},''],['boss clone',{},'boss.r61Clone=true'],['not engaged',{},'room.engaged=false'],['modal open',{},'modal=true'],['dead boss',{},'boss.hp=0'],['off switch',{ls:{'storyworld.r1258.slothThrow':'{"on":false}'}},'']]){
 const v=world(o);if(pre)A(v,pre);run(v,12);ok(A(v,'__STORYWORLD_SLOTH_THROW_R1258__.inspect().thrown.length')===0&&A(v,'hurts.length')===0,lab+' → nothing thrown');}
// 회귀: 낮은 효과 모드에서도 서사 투척은 나옴(휴지 뭉치 조각 수만 줄임)
let w4=world({low:true});run(w4,20);ok(A(w4,'__STORYWORLD_SLOTH_THROW_R1258__.inspect().thrown.map(t=>t.key)').includes('fridge'),'low-fx mode still throws the fridge');
// 회귀: 지역 이동 때 날던 것 비움
let w5=world();run(w5,3.2);A(w5,'enterRegion("x")');ok(A(w5,'__STORYWORLD_SLOTH_THROW_R1258__.inspect().flying.length')===0,'enterRegion clears flying items');
// ② 소환 몹 본보기 대체
const SF=rd('client-source/summon-follow-r1224.js');
function sw(){const timers=[];const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,RegExp,console,setTimeout:f=>{timers.push(f);return 1;},localStorage:{getItem:()=>null,setItem(){}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var loading=false;const P={trash:{id:'b02-o1',name:'미뤄 둔 시간의 형상',path:'old/seal_residual.webp'},mold:{id:'b02-m1',name:'곰팡이와 오물 봉투',path:'m.png'}};
 var regionById={ep1b02:{id:'ep1b02',roster:[P.trash,P.mold]}};
 function actor3(d,id,x,y,boss,l,def){return {id,name:d.name,path:d.path,profile:d,boss:!!boss,x,y,hp:10,maxHp:10};}
 var room=null;
 function makeRoom(id){const r={id,enemies:[]};const def=regionById[id];for(const d of def.roster){const e=actor3(d,id+':'+d.id,0,0,false,'STORY',def);r.enemies.push(e);}
  for(const e of r.enemies)if(e.profile.id==='b02-o1'){e.name='살아 움직이는 쓰레기들 우두머리';e.path='new/seal_residual.webp';e.r380Mob='living-trash-v1';}
  r.enemies.push(actor3({id:'b02-boss',name:'보스',path:'b.png'},'boss',0,0,true,'STORY',def));return r;}`,c);
 vm.runInContext(SF,c);while(timers.length)timers.shift()();vm.runInContext(`room=makeRoom('ep1b02');`,c);return c;}
const s1=sw();A(s1,`room.enemies.filter(e=>!e.boss).forEach(e=>{e.r380Lazy='late-flag';})`);
A(s1,`room.enemies=room.enemies.filter(e=>e.boss)`);// 필드 정리 뒤: 일반 몹이 하나도 없음
const got=A(s1,`(()=>{const e=actor3(regionById.ep1b02.roster[0],'ep1b02:r61-summon:1',1,1,false,'STORY',regionById.ep1b02);return {name:e.name,path:e.path,mob:e.r380Mob||null,lazy:e.r380Lazy||null,f:!!e.r1224Follow};})()`);
ok(got.name==='살아 움직이는 쓰레기들'&&got.path==='new/seal_residual.webp'&&got.mob==='living-trash-v1'&&got.f,'after the field is cleared a summon still follows the room\'s current mob: '+JSON.stringify(got));
ok(got.lazy==='late-flag','flags set on the room mob after building (e.g. at draw) are followed too');
const got2=A(s1,`(()=>{const e=actor3(regionById.ep1b02.roster[1],'ep1b02:r61-summon:2',1,1,false,'STORY',regionById.ep1b02);return {name:e.name,path:e.path,f:!!e.r1224Follow};})()`);
ok(got2.name==='곰팡이와 오물 봉투'&&got2.path==='m.png','unchanged kind stays as is after the field is cleared: '+JSON.stringify(got2));
// 회귀: 다른 방이 새로 서면 그 방 기준
A(s1,`regionById.zz={id:'zz',roster:[{id:'zz-1',name:'다른 몹',path:'z.png'}]};room=makeRoom('zz');room.enemies=room.enemies.filter(e=>e.boss)`);
ok(A(s1,`actor3(regionById.zz.roster[0],'zz:r61-summon:1',1,1,false,'STORY',regionById.zz).name`)==='다른 몹','another room uses its own models, not the sloth room');
// ③ 연결
const html=rd('runtime-text/index.html');const i0=html.indexOf('<script src="./canon-throw-r471.js"></script>'),i1=html.indexOf('<script src="./sloth-throw-r1258.js"></script>'),i2=html.indexOf('<script src="./fx-more-r438.js"></script>');
ok(i1>0&&i1>i0&&i2>0,'script tag after R471 (R438 dust is read at run time)');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'sloth-throw-r1258.js'"),'public verify list');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1258/r1258-cpu-check.cjs'),'CI line');
ok(rd('runtime-inputs.json').includes('sloth-throw-r1258.js'),'runtime inputs');
console.log('R1258 CPU check passed:',n,'assertions');
