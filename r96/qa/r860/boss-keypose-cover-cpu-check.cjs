// R860 CPU 검사: 고화질 R104 열쇠 자세가 있는데 화면에 한 번도 안 나오던 본보스(타락천사 기사·EGO 강탈 악몽왕·발록)와
// R248/R410 몹 시트가 이름이 같아 가로채던 교만의 사이보그 교주가 R104 그림으로 그려지는지 본다.
// 헤드리스 실측(2026-11-12, 64지역): l301·h103·dist06 은 옛 actors-normalized, c104-boss 는 assets/r410/mobs/m062(걷는 사람 시트)만 그려짐.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),SRC=path.join(R,'client-source');
const checks=[];const check=(name,ok,detail='')=>{checks.push({name,passed:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail?' — '+detail:''));};
const ctx={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Object,String,Number,Array,Set,Map,WeakMap,WeakSet,Promise,Date,Error};ctx.window=ctx;vm.createContext(ctx);
const run=f=>vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
run('bosses-r104-data.js');const DATA=ctx.__STORYWORLD_BOSS_KEYPOSES_R104_DATA__;
const loaded=new Set(Object.values(DATA).flatMap(d=>d.frames.map(f=>f.path)));
const OLD={
 'l301-boss':{idle:'assets/generated-v31224/actors-normalized/363f780dbb5a_Monster_FallenAngelKnight_Base.webp',move:'assets/generated-v31224/actors-normalized/353a813314bc_Monster_FallenAngelKnight_MoveSide.webp',attack:'assets/generated-v31224/actors-normalized/aca8f8c4bd76_Monster_FallenAngelKnight_Attack.webp',hit:'assets/generated-v31224/actors-normalized/9756e6d5958a_Monster_FallenAngelKnight_Guard.webp'},
 'h103-boss':{idle:'assets/generated-v31224/actors-normalized/fae708429341_hando_idle.webp',attack:'assets/generated-v31224/actors-normalized/c2965b85cb2e_hando_attack.webp',transition:'assets/generated-v31224/actors-normalized/9f29878c4e6b_hando_transition.webp'},
 'dist06-boss':{idle:'assets/generated-v31224/actors-normalized/80f5ab6bab50_balrog-idle.webp',attack:'assets/generated-v31224/actors-normalized/aa5052f514b2_balrog-attack.webp'},
};
const regs={};for(const [id,o] of Object.entries(OLD)){const fr={};for(const [k,v] of Object.entries(o))fr[k]={path:v};regs[id]={bosses:[{id,frames:fr,path:o.idle}]};}
Object.assign(ctx,{portable:{majorNativePresentation150:{}},regionById:regs,readyImage:p=>({image:{src:p},path:p}),addImage(){},drawEnemy(e){ctx.__got=e.__ask.map(p=>ctx.readyImage(p).path);}});
vm.runInContext('var portable=globalThis.portable,regionById=globalThis.regionById,readyImage=globalThis.readyImage,addImage=globalThis.addImage,drawEnemy=globalThis.drawEnemy;',ctx);
run('bosses-r104.js');
vm.runInContext('globalThis.__draw=e=>{drawEnemy(e);return globalThis.__got;}',ctx);
const B=ctx.__STORYWORLD_BOSS_KEYPOSES_R104__;
const P=(id,i)=>DATA[id].frames[i].path;
// 1) 타락천사 기사: 모든 단계에서 대기·이동·막기 → p4(회복), 공격 → p2(내려베기)
for(const ph of [0,1,2]){const e={nativeId:'l301-boss',boss:true,phase:ph,__ask:[OLD['l301-boss'].idle,OLD['l301-boss'].move,OLD['l301-boss'].hit,OLD['l301-boss'].attack]};const g=ctx.__draw(e);
 check(`타락천사 기사 phase ${ph}: 옛 그림 대신 R104`,g[0]===P('l301-boss',3)&&g[1]===P('l301-boss',3)&&g[2]===P('l301-boss',3)&&g[3]===P('l301-boss',1),g.map(x=>x.split('/').pop()).join(','));}
// 2) 발록: 대기 → p4, 공격 → p2 (dist06·ep1a09b 모두 같은 id)
{const e={nativeId:'dist06-boss',boss:true,phase:0,__ask:[OLD['dist06-boss'].idle,OLD['dist06-boss'].attack]};const g=ctx.__draw(e);check('발록: R104',g[0]===P('dist06-boss',3)&&g[1]===P('dist06-boss',1),g.join(','));}
// 3) EGO 강탈 악몽왕: 사람형 0·1단계는 R104, 2단계(날개 고치 변신 transition)는 원래 그림을 지킨다(경계)
{const e={nativeId:'h103-boss',boss:true,phase:0,__ask:[OLD['h103-boss'].idle,OLD['h103-boss'].attack]};const g=ctx.__draw(e);check('EGO 강탈 악몽왕 phase 0: R104',g[0]===P('h103-boss',3)&&g[1]===P('h103-boss',1),g.join(','));}
{const e={nativeId:'h103-boss',boss:true,phase:1,__ask:[OLD['h103-boss'].attack]};const g=ctx.__draw(e);check('EGO 강탈 악몽왕 phase 1: R104',g[0]===P('h103-boss',1),g.join(','));}
{const e={nativeId:'h103-boss',boss:true,phase:2,__ask:[OLD['h103-boss'].transition]};const g=ctx.__draw(e);check('EGO 강탈 악몽왕 phase 2 변신 그림은 그대로(회귀)',g[0]===OLD['h103-boss'].transition,g.join(','));}
// 4) 회귀: 다른 몹·보스 밖에서는 바꾸지 않는다
{const e={nativeId:'some-mob',phase:0,__ask:[OLD['l301-boss'].idle]};const g=ctx.__draw(e);check('다른 몹이 같은 경로를 물으면 그대로(회귀)',g[0]===OLD['l301-boss'].idle,g.join(','));}
check('보스 그리기 밖 readyImage 는 그대로(회귀)',ctx.readyImage(OLD['l301-boss'].idle).path===OLD['l301-boss'].idle);
check('기존 7대죄·루시퍼 단계 유지, 교주 인물 자세는 인간 형상에서만',JSON.stringify(B.phases['b02-boss'])==='[0,1]'&&JSON.stringify(B.phases['c104-boss'])==='[0]'&&JSON.stringify(B.phases['a11-boss'])==='[0,1,2]');
// 4b) 엔진·보스 전용 모듈(예: 발록 balrogAction bodyRect)이 옛 그림 기준 잘라 그리기 칸을 주면 새 그림이 잘린다
//     (헤드리스 2026-11-12: 발록 p2 가 왼쪽이 칼로 자른 듯 잘려 그려짐, 칸 178.5,63,316.75,292.25).
//     R104 로 바꾼 그림은 칸 전체를 그리되 옛 칸이 차지하던 화면 상자에 키를 맞추고 발(아래 끝)·가운데를 지킨다.
{const c3={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Object,String,Number,Array,Set,Map,WeakMap,WeakSet,Promise,Date,Error};c3.window=c3;vm.createContext(c3);
 vm.runInContext(fs.readFileSync(path.join(SRC,'bosses-r104-data.js'),'utf8'),c3);
 const dims={};for(const d of Object.values(DATA))for(const f of d.frames)dims[f.path]=[f.w,f.h];
 const calls=[];Object.assign(c3,{__dims:dims,__calls:calls,portable:{majorNativePresentation150:{}},regionById:regs});
 vm.runInContext(`var portable=globalThis.portable,regionById=globalThis.regionById,addImage=function(){};
  var readyImage=function(p){const d=globalThis.__dims[p]||[672,384];return {image:{src:p,width:d[0],height:d[1]},path:p};};
  var ctx={drawImage(...a){globalThis.__calls.push([a[0].src,...a.slice(1)]);}};
  var drawEnemy=function(e){const r=readyImage(e.__p);if(e.__rect)ctx.drawImage(r.image,...e.__rect,...e.__dest);else ctx.drawImage(r.image,...e.__dest);};`,c3);
 vm.runInContext(fs.readFileSync(path.join(SRC,'bosses-r104.js'),'utf8'),c3);
 const D3=(e)=>{calls.length=0;vm.runInContext('drawEnemy',c3)(e);return calls[0];};
 const near=(a,b)=>Math.abs(a-b)<0.6;
 {const g=D3({nativeId:'dist06-boss',boss:true,phase:0,__p:OLD['dist06-boss'].attack,__rect:[178.5,63,316.75,292.25],__dest:[100,50,160,148]});const [w,h]=dims[P('dist06-boss',1)];const k=148/h;
  check('발록 공격(잘라 그리기 칸) → p2 칸 전체, 키=옛 화면 상자 키, 발·가운데 유지',g&&g[0]===P('dist06-boss',1)&&g[1]===0&&g[2]===0&&g[3]===w&&g[4]===h&&near(g[8],148)&&near(g[6]+g[8],198)&&near(g[5]+g[7]/2,180)&&near(g[7],w*k),JSON.stringify(g));}
 {const g=D3({nativeId:'dist06-boss',boss:true,phase:0,__p:OLD['dist06-boss'].attack,__rect:[178.5,63,316.75,292.25],__dest:[260,50,-160,148]});
  check('좌우 뒤집힌 상자(dw<0)도 부호 유지',g&&g[7]<0&&near(g[5]+g[7]/2,180),JSON.stringify(g));}
 {const g=D3({nativeId:'l301-boss',boss:true,phase:0,__p:OLD['l301-boss'].idle,__dest:[10,20,90,100]});check('칸 없이 그리면 손대지 않음(회귀)',g&&g.length===5&&g[0]===P('l301-boss',3),JSON.stringify(g));}
 {const g=D3({nativeId:'b06-boss',boss:true,phase:0,__p:'assets/generated-v31224/actors-normalized/x_greed-idle.webp',__rect:[30,57,188,377],__dest:[0,0,50,100]});check('맘몬(b06, Codex 담당)은 잘라 그리기 칸을 바꾸지 않음(회귀)',g&&g[1]===30&&g[3]===188,JSON.stringify(g));}
 {const g=D3({nativeId:'some-mob',__p:OLD['dist06-boss'].attack,__rect:[178.5,63,316.75,292.25],__dest:[100,50,160,148]});check('다른 몹의 잘라 그리기는 그대로(회귀)',g&&g[0]===OLD['dist06-boss'].attack&&g[1]===178.5,JSON.stringify(g));}
}
// 4c) 교주 본보스 몸은 cult-v3123 그림으로 그려진다 → 이 경로도 R104 로
{const e={nativeId:'c104-boss',boss:true,phase:0,__ask:['assets/cult-v3123/pride_cyborg_cult_leader.webp']};const g=ctx.__draw(e);check('교만의 사이보그 교주 몸(cult-v3123) → R104',g[0]===P('c104-boss',3),g.join(','));}
// HP 형상별 한 장인 엔진 본체를 실제 공격 시간에 읽고, 발을 고정한다.
{
 const forms=[
  'assets/cult-v3123/pride_cyborg_cult_leader.webp',
  'assets/generated-v31224/actors-normalized/c6827b44795a_superego_cyborg_cult_leader.webp',
  'assets/generated-v31224/actors-normalized/a000c91070d3_final_pride_cyborg_lord.webp',
  'assets/generated-v31224/actors-normalized/57967d1070df_black_ritual_cyborg_boss.webp',
 ].map(path=>({path}));
 const calls=[],misses=new Set(),requests=[],qa={portable:{majorNativePresentation150:{},rc142GameplayArt:{cultLeader:{phases:forms,phaseThresholds:[.76,.5,.25]}}},regionById:regs,time:4};
 const images=new Map();
 function image(path){if(misses.has(path))return null;if(!images.has(path))images.set(path,{path,image:{src:path}});return images.get(path);}
 let wall=4000,transform=null;
 const c={save(){},restore(){transform=null;},transform(...next){transform=next;},drawImage(img){calls.push({path:img.src,transform});}};
 Object.assign(qa,{ctx:c,Date:{now:()=>wall},localStorage:{getItem:()=>null},readyImage:image,addImage:path=>{requests.push(path);}});
 qa.window=qa;vm.createContext(qa);
 vm.runInContext('var drawEnemy=function(e){const row=readyImage(e.path);if(row)ctx.drawImage(row.image,0,0,418,418,-54,-150,108,150);};',qa);
 for(const asset of ['bosses-r104-data.js','bosses-r104.js'])vm.runInContext(fs.readFileSync(path.join(SRC,asset),'utf8'),qa);
 function draw(e){calls.length=0;qa.drawEnemy(e);return calls[0];}
 function cultAttack(index,elapsed){return {nativeId:'c104-boss',boss:true,spawnState:'active',maxHp:100,hp:[90,65,40,20][index],path:forms[index].path,attack:{elapsed,angle:0,castWindup150:.5,shape154:{active:.2}}};}
 const attackTimes=[.16,.54,.76,.95],human=attackTimes.map(t=>draw(cultAttack(0,t)).path);
 check('교주 인간형 준비·타격·이어짐·회수 네 그림',human.every((path,index)=>path===P('c104-boss',index)),human.join(','));
 for(const i of [1,2,3]){
  const shots=attackTimes.map(t=>draw(cultAttack(i,t)));
  check(`교주 HP 변신 ${i}: 자기 몸·발 유지와 공격 세 구간 움직임`,shots.every(s=>s.path===forms[i].path)&&new Set(shots.slice(0,3).map(s=>String(s.transform))).size===3&&shots.slice(0,3).every(s=>s.transform?.[4]===0&&s.transform?.[5]===0)&&shots[3].transform===null);
 }
 // 발록 열쇠 자세가 처음 없거나 다시 밀려날 때, 먼저 가능한 원본을 그린다.
 const raised='assets/actors/v31511/balrog-raised-body.png',p1=P('dist06-boss',0);
 const balrog={nativeId:'dist06-boss',boss:true,phase:0,path:raised};
 misses.add(p1);
 const cold=draw(balrog),coldAgain=draw(balrog);
 check('발록 첫 준비: 옛 들어올린 몸을 그리면서 p1 요청은 한 번',cold.path===raised&&coldAgain.path===raised&&requests.filter(p=>p===p1).length===1);
 wall+=1600;draw(balrog);
 check('발록 없는 p1 요청을 1.5초 뒤 재시도',requests.filter(p=>p===p1).length===2);
 misses.delete(p1);
 check('발록 p1 준비가 되면 늦게라도 원래 칼 준비 자세 선택',draw(balrog).path===p1);
 misses.add(p1);
 check('발록 p1이 로드 후 캐시에서 밀리면 원본으로 그리고 다시 요청',draw(balrog).path===raised&&requests.filter(p=>p===p1).length===3);
}
// 5) R248 이름 시트가 R104 열쇠 자세가 있는 본보스를 가로채지 않는다(교만의 사이보그 교주 ← m062 걷는 사람)
const c2={localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Object,String,Number,Array,Set,Map,WeakMap,WeakSet,Promise,Date,Error};c2.window=c2;vm.createContext(c2);
for(const f of ['mob-unique-r248-data.js','bosses-r104-data.js','mob-art-r410.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),c2);
c2.__STORYWORLD_BOSS_KEYPOSES_R104__={framesFor:id=>c2.__STORYWORLD_BOSS_KEYPOSES_R104_DATA__[id]?.frames||null};
vm.runInContext(fs.readFileSync(path.join(SRC,'mob-unique-r248.js'),'utf8'),c2);
const M=c2.__STORYWORLD_MOB_UNIQUE_R248__;
check('교만의 사이보그 교주(본보스 c104-boss): R248/R410 몹 시트 안 씀',M.sheetFor({name:'교만의 사이보그 교주',nativeId:'c104-boss',boss:true})===null,JSON.stringify(M.sheetFor({name:'교만의 사이보그 교주',nativeId:'c104-boss',boss:true})?.path||null));
check('같은 이름 일반 몹은 여전히 m062 시트(회귀)',/m062/.test(M.sheetFor({name:'교만의 사이보그 교주',nativeId:'x-mob'})?.path||''));
check('R104 없는 본보스(아르벨리아를 묶은 변조 명령)는 R410 m048 그대로(회귀)',/m048/.test(M.sheetFor({name:'아르벨리아를 묶은 변조 명령',nativeId:'kair-great-03',boss:true})?.path||''));
const failed=checks.filter(c=>!c.passed);console.log(`${checks.length-failed.length}/${checks.length} passed`);
if(process.env.STORYWORLD_R860_RESULTS)fs.writeFileSync(process.env.STORYWORLD_R860_RESULTS,JSON.stringify({checks},null,1));
process.exit(failed.length?1:0);
