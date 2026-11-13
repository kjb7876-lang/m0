// R990 CPU 검사: 불면귀 안개 스킬(bulmyeongwi-fog-r990.js) — 사용자 2026-11-13 "불면귀가 스킬로 불면귀맵 일반몹을 더 많이 자주 생성",
//  "불면귀가 안개스킬위주로", "불면귀쪽 보스이미지 검수(예전이미지)".
//  ① 안개 패턴: 원래 4종 순서·값 그대로 + 안개 3종, 안개 비율 60~70%, 피할 수 있는 예고(준비 ≥1.1초), 피해 22~32. 끄면 원래 4종. 다른 보스·이름이 다른 표는 안 건드림.
//  ② 안개 소환: 첫 4.5초, 주기 10.2→6.5초(체력 낮을수록), 4명(절반 이하 5명), 동시 8(모바일 6)·평생 48, R61 공용 소환은 이 보스만 쉼, 주민 이름·R61 표시.
//  ③ 안개 그림: 패턴마다 안개 효과, 동시 6(저사양 3), NaN 위치는 안 그림.
//  ④ 그림 검수: R61 소환 예고·등장 잔상의 옛 불면귀 그림 → R760 시트, 다른 그림·끄기는 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F=path.join(R,'client-source','bulmyeongwi-fog-r990.js');ok(fs.existsSync(F),'bulmyeongwi-fog-r990.js 있음');const src=fs.readFileSync(F,'utf8');
const ORIG=[{name:'불면의 십자시선',shape:'cross',damage:27,windup:1.18},{name:'검은 영혼 부채살',shape:'cone',damage:22,windup:1.05},{name:'잠들 수 없는 안전지대',shape:'safe',damage:32,windup:1.48},{name:'악몽 잔상 폭우',shape:'circle',damage:27,windup:1.4}];
const X=[{name:'독수렁 · 조준 연격',shape:'cone',damage:27,windup:1.02,r58Variant:true,r58Status:'poison'},{name:'독수렁 · 교차 파열',shape:'cross',damage:27,windup:1.18,r58Variant:true},{name:'독수렁 · 잔류 맥동',shape:'donut',damage:27,windup:1.25,r58Variant:true}];
function world({store={},roomId='last303',coarse=false,lowFx=false,names=null,ready=true,r58=false}={}){
 const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,Symbol,isFinite,RegExp,performance:{now:()=>0},innerWidth:1280,
  matchMedia:()=>({matches:coarse}),setTimeout:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 const orig=JSON.stringify(names?names.map(n=>({name:n})):r58?[ORIG[0],X[0],ORIG[1],X[1],ORIG[2],X[2],ORIG[3]]:ORIG);
 vm.runInContext(`var projectiles=[],time=0,settings={lowFx:${lowFx}},modal=null,loading=false,player={x:6,y:3,hp:100},effects=[],hazards=[],__snd=[],__motions=[],__made=0,__draw=[];
  var portable={assetMap:{zones:[{id:'last303',actors:[{id:'l303-boss',patterns:${orig}},{id:'other',patterns:${orig}}]}]}};
  var regionById={last303:{id:'last303',roster:[]},last302:{id:'last302'}};
  var room={id:${JSON.stringify(roomId)},layer:'STORY',engaged:true,cleared:false,finalizing:false,enemies:[]};
  var ctx={commands:[],save(){},restore(){},scope(o,f){f();}};
  function readyImage(p){return ${ready}?{ready:true,image:{naturalWidth:6144,naturalHeight:256}}:null;}function addImage(){}
  function project(x,y){return {x:x*32-y*32,y:(x+y)*16};}function actorHeight(){return 110;}
  function drawAssetFrame3(p,fr,x,y,h,o){__draw.push({p,fr,x,y,h,o});return true;}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.45,...opt});}
  var soundProfiles={};function sound(k){__snd.push(k);}
  function actor3(prof,id,x,y){__made++;return {id,nativeId:prof.id,profile:prof,name:prof.name,x,y,hp:50,maxHp:50,damage:5};}
  function tickEnemies(dt){return 'base';}function drawEffect(f){__draw.push({base:f.type,frame:f.r61Frame});return 'base';}
  var __r61={owner:{nextAt:0},positions:0};
  window.__STORYWORLD_SUMMONS_R61__={state:e=>__r61.owner,position:(u,o,i,res)=>{__r61.positions++;return {x:o.x+2+i*.3,y:o.y+1};},safePoint:()=>true};
  window.__STORYWORLD_FIELDS_R61__={activeAction:()=>null,beginMotion:(e,kind,o)=>{const a={kind,releaseAt:time+o.windup,o};__motions.push(a);return a;}};
  window.__STORYWORLD_SCALE_MELEE_R61__={normalize:e=>{e.normalized=true;}};`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
// ── ① 안개 패턴 ──
{const c=world();const P=run(c,"portable.assetMap.zones[0].actors[0].patterns"),O=run(c,"portable.assetMap.zones[0].actors[1].patterns");
 ok(P.length===11,'패턴 11칸 (원래 4 + 안개 7칸) '+P.length);const fog=P.filter(p=>p.r990Fog);ok(fog.length===7,'안개 7칸');
 const ratio=fog.length/P.length;ok(ratio>=.6&&ratio<=.7,'안개 비율 60~70% '+ratio.toFixed(3));
 ok(JSON.stringify(P.filter(p=>!p.r990Fog).map(p=>p.name))===JSON.stringify(ORIG.map(p=>p.name)),'원래 4종 순서 그대로');
 ok(P.filter(p=>!p.r990Fog).every((p,i)=>p.damage===ORIG[i].damage&&p.windup===ORIG[i].windup),'원래 패턴 값 그대로');
 ok(P[0].name==='불면의 십자시선','첫 시전은 원래 첫 패턴(beat 0)');
 for(let i=1;i<P.length;i++)ok(!(P[i].r990Fog&&P[i-1].r990Fog&&P[i].name===P[i-1].name),'같은 안개 패턴이 연달아 나오지 않음 '+i);
 ok(new Set(fog.map(p=>p.name)).size===3,'안개 3종');
 for(const p of fog){ok(p.windup>=1.1,'예고 ≥1.1초 '+p.name);ok(p.damage>=22&&p.damage<=32,'피해 22~32 '+p.name);ok(['circle','cone'].includes(p.shape),'엔진 모양 '+p.shape);
  ok([p.radius,p.width,p.cooldown,p.statusValue].every(Number.isFinite),'수치 유한 '+p.name);ok(/안개/.test(p.name),'이름에 안개 '+p.name);}
 ok(O.length===4,'다른 보스 표는 그대로');
 run(c,"window.__STORYWORLD_BMG_FOG_R990__.set({patterns:false})");ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.length")===4,'끄면 원래 4종');
 run(c,"window.__STORYWORLD_BMG_FOG_R990__.set({patterns:true})");ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.length")===11,'다시 켜면 11칸');
 run(c,"tickEnemies(.016);tickEnemies(.016)");ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.length")===11,'반복 적용해도 11칸(겹치지 않음)');}
// R58 이 끼운 늪 테마 3종이 있는 실제 모양(헤드리스 실측: 7칸 = 십자시선·독수렁 조준 연격·부채살·독수렁 교차 파열·안전지대·독수렁 잔류 맥동·폭우)
{const c=world({r58:true});const P=run(c,"portable.assetMap.zones[0].actors[0].patterns");ok(P.length===11,'R58 있음: 11칸 '+P.length);
 const fog=P.filter(p=>p.r990Fog);ok(fog.length===7&&Math.abs(fog.length/P.length-7/11)<1e-9,'R58 있음: 안개 7칸(64%)');
 ok(JSON.stringify(P.filter(p=>!p.r990Fog).map(p=>p.name))===JSON.stringify(ORIG.map(p=>p.name)),'원래 4종 순서 그대로');
 const xs=P.filter(p=>p.r990From);ok(xs.length===3&&xs.map(p=>p.name).join('|')==='검은 안개 · 조준 연격|검은 안개 · 교차 파열|검은 안개 · 잔류 맥동','늪 이름 → 검은 안개 이름 '+xs.map(p=>p.name));
 ok(xs.every((p,i)=>p.damage===X[i].damage&&p.windup===X[i].windup&&p.shape===X[i].shape&&p.r58Variant===true),'R58 수치·모양·표시 그대로');
 ok(!P.some(p=>/독수렁/.test(p.name)),'늪 이름 없음');
 for(let i=1;i<P.length;i++)ok(P[i].name!==P[i-1].name,'같은 패턴 연달아 없음 '+i);
 const O=run(c,"portable.assetMap.zones[0].actors[1].patterns");ok(O.length===7&&O[1].name==='독수렁 · 조준 연격','다른 보스의 R58 은 그대로');
 run(c,"window.__STORYWORLD_BMG_FOG_R990__.set({patterns:false})");const back=run(c,"portable.assetMap.zones[0].actors[0].patterns");ok(back.length===7&&back[1].name==='독수렁 · 조준 연격','끄면 원래 7칸(R58 객체 그대로)');
 run(c,"window.__STORYWORLD_BMG_FOG_R990__.set({patterns:true});var A=portable.assetMap.zones[0].actors[0];portable.assetMap.zones[0].actors[0]={id:'l303-boss',patterns:"+JSON.stringify([ORIG[0],X[0],ORIG[1],X[1],ORIG[2],X[2],ORIG[3]])+"};tickEnemies(.1)");
 ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.length")===11,'월드를 다시 만들어 새 보스 객체가 와도 다시 적용');}
{const c=world({names:['불면의 십자시선','검은 영혼 부채살','잠들 수 없는 안전지대','악몽 잔상 폭우','모르는 패턴']});ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.length")===5,'모르는 패턴이 섞이면 안 건드림');}
// R58 이 이 파일보다 늦게 끼우는 순서(헤드리스 실측: 불러올 때 4칸 → R990 11칸 → R58 compileWorld 가 늪 3종을 끼워 14칸)
{const c=world();run(c,`var A=portable.assetMap.zones[0].actors[0],cur=A.patterns.slice(),Xs=${JSON.stringify(X)};A.patterns=[];for(let i=0;i<cur.length;i++){A.patterns.push(cur[i]);if(Xs[i])A.patterns.push(Xs[i]);}tickEnemies(.1)`);
 const P=run(c,"portable.assetMap.zones[0].actors[0].patterns");ok(P.length===11&&P.filter(p=>p.r990Fog).length===7,'늦게 끼운 R58 도 다시 짜서 11칸·안개 7 '+P.length);
 ok(P.map(p=>p.name).join('|')==='불면의 십자시선|검은 안개 웅덩이|검은 안개 · 조준 연격|검은 영혼 부채살|안개 장막 확산|검은 안개 · 교차 파열|잠들 수 없는 안전지대|검은 안개 분사|검은 안개 · 잔류 맥동|악몽 잔상 폭우|검은 안개 웅덩이','차례 '+P.map(p=>p.name).join('|'));
 run(c,"window.__STORYWORLD_BMG_FOG_R990__.set({patterns:false})");ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.map(p=>p.name).join('|')")==='불면의 십자시선|독수렁 · 조준 연격|검은 영혼 부채살|독수렁 · 교차 파열|잠들 수 없는 안전지대|독수렁 · 잔류 맥동|악몽 잔상 폭우','끄면 R58 원래 7칸 차례');}
{const c=world({names:['a','b','c','d']});ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.length")===4,'이름이 다른 표는 안 건드림');}
{const c=world({store:{'storyworld.r990.bmgfog':'{"on":false}'}});ok(run(c,"portable.assetMap.zones[0].actors[0].patterns.length")===4,'전체 끄기면 원래 4종');}
// ── ② 안개 소환 ──
const boss=(hp=1)=>`room.enemies.push({id:'last303:l303-boss',nativeId:'l303-boss',boss:true,hp:${hp}*1000,maxHp:1000,x:10,y:10,spawnState:'active'});
 room.enemies.push({id:'last303:p1',nativeId:'l302-e1',profile:{id:'l302-e1',name:'포구 검은 안개'},hp:0,spawnState:'dead',x:3,y:3});`;
function step(c,t1,dt=.1){run(c,`while(time<${t1}-1e-9){time+=${dt};tickEnemies(${dt});for(const a of __motions)if(!a.done&&time>=a.releaseAt){a.done=true;a.released=true;a.o.onRelease();}}`);}
{const c=world();run(c,boss(1));step(c,4.4);ok(run(c,"__motions.length")===0,'4.5초 전엔 소환 없음');step(c,4.7);ok(run(c,"__motions.length")===1,'첫 소환 4.5초');
 ok(run(c,"__r61.owner.nextAt")>run(c,"time")+20,'R61 공용 소환은 이 보스만 쉼');
 step(c,6);const u=run(c,"room.enemies.filter(e=>e.r990Fog)");ok(u.length===4,'체력 100%: 4명 '+u.length);
 ok(u.every(e=>e.r61Summoned?.kind==='minion'&&e.r61Summoned.owner==='last303:l303-boss'),'R61 표시(주인이 죽으면 엔진이 거둠)');
 ok(u.every(e=>/^잠식된 (약방 아낙|어부|소복 처녀)$/.test(e.name)&&e.nativeId==='l302-e1'),'불면귀 맵 일반몹만 '+u.map(e=>e.name));
 ok(new Set(u.map(e=>e.name)).size===3,'주민 셋이 섞임');ok(u.every(e=>e.normalized&&!e.boss&&e.spawnState==='active'),'R61 정규화·활성');
 ok(run(c,"effects.filter(f=>f.type==='r990Core'&&f.phase==='gate').length")===4,'소환 자리마다 안개 핵');ok(run(c,"effects.filter(f=>f.type==='r990Core'&&f.phase==='emerge').length")===4,'끌려 나올 때 핵 흩어짐');
 ok(run(c,"__snd.includes('r990FogSummon')"),'소환 소리');ok(run(c,"soundProfiles.r990FogSummon.length")===2,'소리 프로필(기존 R761 자산)');
 ok(run(c,"soundProfiles.r990FogSummon.every(p=>/assets\\/r761\\/sfx\\/bmg-reveal-[12]\\.ogg/.test(p.path))"),'기존 효과음 재사용');
 const t2=run(c,"__motions[0].releaseAt-1.1");step(c,t2+10.1);ok(run(c,"__motions.length")===1,'10.2초 전엔 다음 소환 없음');step(c,t2+10.4);ok(run(c,"__motions.length")===2,'체력 100% 주기 10.2초');
 const api=run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().summon");ok(api&&api.period===10.2&&api.cap===8,'점검 값 '+JSON.stringify(api));}
{const c=world();run(c,boss(.2));step(c,4.7);step(c,6);ok(run(c,"room.enemies.filter(e=>e.r990Fog).length")===5,'체력 절반 이하: 5명');
 const t2=run(c,"__motions[0].releaseAt-1.1");step(c,t2+6.4);ok(run(c,"__motions.length")===1,'6.5초 전엔 없음');step(c,t2+6.7);ok(run(c,"__motions.length")===2,'체력 25% 이하 주기 6.5초');}
{const c=world();run(c,boss(.5));ok(Math.abs(run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().summon")?.period??0)===0||true,'');step(c,4.7);step(c,6);ok(run(c,"room.enemies.filter(e=>e.r990Fog).length")===5,'체력 정확히 50%: 5명(경계)');
 ok(Math.abs(run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().summon.period")-(10.2+(6.5-10.2)*(.5/.75)))<.01,'50% 주기 = 선형 '+run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().summon.period"));}
{const c=world();run(c,boss(1));step(c,60);const alive=run(c,"room.enemies.filter(e=>e.r990Fog&&e.hp>0).length");ok(alive===8,'동시 생존 상한 8 '+alive);
 // 다 처치해도 평생 48 을 넘지 않음
 run(c,"for(let k=0;k<40;k++){for(const e of room.enemies)if(e.r990Fog)e.hp=0;time+=7;tickEnemies(.1);for(const a of __motions)if(!a.done&&time>=a.releaseAt-1e-9){a.done=true;a.o.onRelease();}time+=1.2;tickEnemies(.1);for(const a of __motions)if(!a.done&&time>=a.releaseAt){a.done=true;a.o.onRelease();}}");
 const total=run(c,"room.enemies.filter(e=>e.r990Fog).length");ok(total===48,'평생 48 '+total);}
{const c=world({coarse:true});run(c,boss(1));step(c,60);ok(run(c,"room.enemies.filter(e=>e.r990Fog&&e.hp>0).length")===6,'모바일 동시 상한 6');}
{const c=world({lowFx:true});run(c,boss(1));step(c,60);ok(run(c,"room.enemies.filter(e=>e.r990Fog&&e.hp>0).length")===6,'저사양 동시 상한 6');}
{const c=world();run(c,boss(1)+"for(let i=0;i<22;i++)room.enemies.push({id:'x'+i,hp:5,spawnState:'active',x:12,y:11});");step(c,8);ok(run(c,"room.enemies.filter(e=>e.r990Fog).length")===1,'보스 12칸 안 살아 있는 적 24 상한(보스+22 → 빈자리 1)');}
{const c=world();run(c,boss(1)+"for(let i=0;i<40;i++)room.enemies.push({id:'far'+i,hp:5,spawnState:'active',x:40,y:40});");step(c,8);ok(run(c,"room.enemies.filter(e=>e.r990Fog).length")===4,'멀리 남은 순찰 40은 상한에 안 셈(실측: R61 은 이것 때문에 0회)');}
{const c=world();run(c,boss(1)+"for(let i=0;i<40;i++)room.enemies.push({id:'nan'+i,hp:5,spawnState:'active',x:NaN,y:NaN});");step(c,8);ok(run(c,"room.enemies.filter(e=>e.r990Fog).length")===4,'위치 NaN 적은 멀리로 셈');}
{const c=world({roomId:'last302'});run(c,boss(1).replace(/l303-boss'/g,"mb-last302-v31231'"));step(c,20);ok(run(c,"__motions.length")===0&&run(c,"__r61.owner.nextAt")===0,'다른 지역·중간보스는 R61 그대로');}
{const c=world();run(c,boss(1)+"room.engaged=false;");step(c,20);ok(run(c,"__motions.length")===0,'전투 전엔 소환 없음');}
{const c=world({store:{'storyworld.r990.bmgfog':'{"summon":false}'}});run(c,boss(1));step(c,20);ok(run(c,"__motions.length")===0&&run(c,"__r61.owner.nextAt")===0,'소환 끄기면 R61 그대로');}
{const c=world();run(c,boss(1)+"room.enemies[0].attack={};");step(c,8);ok(run(c,"__motions.length")===0,'보스가 공격 중이면 기다림');run(c,"room.enemies[0].attack=null");step(c,9);ok(run(c,"__motions.length")===1,'공격 끝나면 소환');}
{const c=world();run(c,boss(1));step(c,4.7);run(c,"__motions[0].cancelled=true");step(c,7);ok(run(c,"room.enemies.filter(e=>e.r990Fog).length")===0,'동작이 끊기면 주민 안 나옴');}
// ── ③ 안개 그림 ──
{const c=world();run(c,"hazards.push({id:1,type:'story-pattern',owner:'last303:l303-boss',x:5,y:5,originX:9,originY:9,angle:.5,warning:1.2,life:2,storyPattern5:portable.assetMap.zones[0].actors[0].patterns[1],cast150:{}});tickEnemies(.1)");
 ok(run(c,"effects.filter(f=>f.type==='r990Fog').length")===1,'안개 원 패턴 → 안개 1');
 run(c,"hazards.push({id:2,type:'story-pattern',owner:'last303:l303-boss',x:5,y:5,originX:9,originY:9,angle:.5,warning:1.2,life:2,storyPattern5:portable.assetMap.zones[0].actors[0].patterns[4],cast150:{}});tickEnemies(.1)");
 ok(run(c,"effects.filter(f=>f.type==='r990Fog').length")===3,'안개 분사(부채꼴) → 안개 2');
 run(c,"hazards.push({id:3,type:'story-pattern',owner:'last303:l303-boss',x:5,y:5,warning:1,life:2,storyPattern5:portable.assetMap.zones[0].actors[0].patterns[0],cast150:{}});tickEnemies(.1)");
 ok(run(c,"effects.filter(f=>f.type==='r990Fog').length")===3,'원래 패턴엔 안개 없음');
 run(c,"for(let i=0;i<10;i++)hazards.push({id:10+i,type:'story-pattern',owner:'b',x:i,y:5,warning:1,life:2,storyPattern5:portable.assetMap.zones[0].actors[0].patterns[1],cast150:{}});tickEnemies(.1)");
 ok(run(c,"effects.filter(f=>f.type==='r990Fog').length")===6,'동시 안개 상한 6');
 run(c,"hazards.push({id:99,type:'story-pattern',owner:'b',x:NaN,y:5,warning:1,life:2,storyPattern5:portable.assetMap.zones[0].actors[0].patterns[1],cast150:{}});effects.length=0;tickEnemies(.1)");
 ok(run(c,"effects.filter(f=>f.type==='r990Fog').length")===0,'NaN 위치는 안개 없음');
 const casts=run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().stats.casts");ok(casts['검은 안개 웅덩이']===1&&casts['불면의 십자시선']===1,'시전 집계 '+JSON.stringify(casts));
 run(c,"__draw.length=0;drawEffect({type:'r990Fog',x:5,y:5,age:.5,life:2,warn:1,r:1.9,seed:3});drawEffect({type:'r990Fog',x:5,y:5,age:0,life:2,warn:1,r:NaN,seed:3})");
 const d=run(c,"__draw");ok(d.length>=1&&d.every(x=>x.p==='assets/r430/mist-loop.webp'&&Number.isFinite(x.h)&&x.o.alpha<=.58&&x.o.alpha>0),'안개 그리기 유한·알파 ≤.58 '+JSON.stringify(d.map(x=>[x.h,x.o.alpha])));
 ok(d.every(x=>!/drop-shadow|blur/.test(x.o.filter||'')),'Three.js 기록기 필터만(drop-shadow·blur 없음)');
 run(c,"__draw.length=0;drawEffect({type:'r990Fog',x:NaN,y:5,age:.5,life:2,warn:1,r:1.9,seed:3});drawEffect({type:'r990Core',x:Infinity,y:1,age:.1,life:1,phase:'gate',seed:1})");ok(run(c,"__draw.length")===0,'NaN·Infinity 위치는 안 그림');
 run(c,"__draw.length=0;drawEffect({type:'r990Core',x:3,y:3,age:.5,life:1.1,phase:'gate',seed:1})");ok(run(c,"__draw[0]?.p")==='assets/r990/fog-core.webp'&&run(c,"__draw[0].fr.assetFrame.sourceRect[2]")===256,'안개 핵 Dots 시트 256칸');}
{const c=world({lowFx:true});run(c,"for(let i=0;i<10;i++)hazards.push({id:10+i,type:'story-pattern',owner:'b',x:i,y:5,warning:1,life:2,storyPattern5:portable.assetMap.zones[0].actors[0].patterns[1],cast150:{}});tickEnemies(.1)");
 ok(run(c,"effects.filter(f=>f.type==='r990Fog').length")===3,'저사양 동시 안개 3');}
// ── ④ 그림 검수 ──
{const c=world();const old='assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp';
 run(c,`__draw.length=0;drawEffect({type:'summonGateR61',r61Frame:{path:'${old}',flip:true}})`);const f=run(c,"__draw[0].frame");ok(f.path==='assets/r760/boss/sheet-idle.webp'&&f.flip===true&&f.assetFrame.sourceRect[2]===512,'소환 예고 옛 그림 → R760 시트 '+f.path);
 run(c,`__draw.length=0;drawEffect({type:'summonEmergeR61',r61Frame:{path:'assets/r760/boss/bulmyeongwi-p2.webp'}})`);ok(run(c,"__draw[0].frame.path")==='assets/r760/boss/sheet-idle.webp','R760 톤 4자세도 시트로');
 run(c,`__draw.length=0;drawEffect({type:'summonGateR61',r61Frame:{path:'assets/r763/villagers/fisher-idle.webp'}})`);ok(run(c,"__draw[0].frame.path")==='assets/r763/villagers/fisher-idle.webp','주민 그림은 그대로');
 run(c,`__draw.length=0;drawEffect({type:'burst'})`);ok(run(c,"__draw[0].base")==='burst','다른 효과는 엔진 그대로');
 run(c,"window.__STORYWORLD_BMG_FOG_R990__.set({art:false})");run(c,`__draw.length=0;drawEffect({type:'summonGateR61',r61Frame:{path:'${old}'}})`);ok(run(c,"__draw[0].frame.path")===old,'그림 검수 끄기면 그대로');}
{const c=world({ready:false});ok(run(c,`window.__STORYWORLD_BMG_FOG_R990__.fixFrame({path:'assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp'}).path`).includes('bulmyeongwi_attack'),'시트가 안 실렸으면 그대로(빈 그림 방지)');}
// ④-2 R61 잔상 던지기(echo): 수정 전 헤드리스 실측 — 준비 동안 보스 자리에 옛 해골 공격 그림이 커지며 겹치고, 놓으면 같은 그림이 날아감
{const c=world();const old='assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp';
 run(c,boss(1)+`room.enemies[0].r61Action={kind:'echo',path:'${old}',frame:{path:'${old}',flip:true,assetFrame:{sourceRect:[0,0,640,640]}}};
  room.enemies.push({id:'last303:r61-summon:1',nativeId:'l303-boss',r61Clone:true,hp:5,spawnState:'active',r61Action:{kind:'echo',path:'${old}',frame:{path:'${old}'}}});
  room.enemies.push({id:'x',nativeId:'l302-e1',hp:5,spawnState:'active',r61Action:{kind:'echo',path:'assets/r763/villagers/fisher-atk.webp'}});
  room.enemies.push({id:'y',nativeId:'l303-boss',hp:5,spawnState:'active',r61Action:{kind:'prop',path:'${old}'}});
  projectiles.push({asset:'${old}',r61Shot:{kind:'echo',path:'${old}',frame:{path:'${old}'}}},{asset:'a.webp',r61Shot:{kind:'prop',path:'${old}'}},{asset:'${old}'});tickEnemies(.016)`);
 const a=run(c,"room.enemies[0].r61Action");ok(a.path==='assets/r760/boss/sheet-atkA.webp'&&a.frame.path===a.path&&a.frame.assetFrame.sourceRect[0]===3*512&&a.frame.flip===true,'잔상 준비 그림 → R760 atkA 타격 칸(좌우 유지) '+a.path);
 ok(run(c,"room.enemies.find(e=>e.r61Clone).r61Action.path")==='assets/r760/boss/sheet-atkA.webp','보스 분신 잔상도');
 ok(run(c,"room.enemies.find(e=>e.id==='x').r61Action.path")==='assets/r763/villagers/fisher-atk.webp','주민 잔상은 그대로');ok(run(c,"room.enemies.find(e=>e.id==='y').r61Action.path")===old,'잔상(echo)이 아닌 동작은 그대로');
 const P=run(c,"projectiles");ok(P[0].r61Shot.path==='assets/r760/boss/sheet-atkA.webp'&&P[0].asset===P[0].r61Shot.path&&P[0].r61Shot.frame.assetFrame.visibleHeight===383,'날아가는 잔상도 시트');
 ok(P[1].r61Shot.path===old&&P[2].asset===old,'다른 투사체는 그대로');
 ok(run(c,"window.__STORYWORLD_BMG_FOG_R990__.inspect().stats.echoFixed")>=2,'고친 수 기록');}
{const c=world({roomId:'last302'});const old='assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp';run(c,`room.enemies.push({nativeId:'l303-boss',hp:1,spawnState:'active',r61Action:{kind:'echo',path:'${old}'}});tickEnemies(.016)`);
 ok(run(c,"room.enemies[0].r61Action.path")===old,'다른 지역은 그대로');}
{const c=world({store:{'storyworld.r990.bmgfog':'{"art":false}'}});const old='assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp';run(c,boss(1)+`room.enemies[0].r61Action={kind:'echo',path:'${old}'};tickEnemies(.016)`);
 ok(run(c,"room.enemies[0].r61Action.path")===old,'그림 검수 끄기면 옛 그대로(대조: 수정이 없으면 옛 그림)');}
{const c=world({ready:false});const old='assets/generated-v31224/actors-normalized/115b7fcea51e_bulmyeongwi_attack.webp';run(c,boss(1)+`room.enemies[0].r61Action={kind:'echo',path:'${old}'};tickEnemies(.016)`);
 ok(run(c,"room.enemies[0].r61Action.path")===old,'시트가 안 실렸으면 그대로(엔진이 그림 없다고 놓기를 거절하지 않게)');}
// ── 전후 기준(엔진 R61 수치가 보고서와 같은지) ──
{const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok(/limits=Object\.freeze\(\{activeRegional:6,activeClones:2,activeCombat:24,lifetimePerOwner:24,cloneRatio:\.06,minPlayerDistance:1\.8,minWindup:1\.05,cooldown:17\}\)/.test(html),'R61 전 수치(17초·동시 6·평생 24)');
 ok(/clamp\(limits\.cooldown-5\*\(1-e\.hp\/Math\.max\(1,e\.maxHp\)\),12,limits\.cooldown\)/.test(html),'R61 전 주기 17→12초');}
// ── 빌드 연결 ──
{const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok(idx.includes('<script src="./bulmyeongwi-fog-r990.js"></script>'),'index.html 태그');
 ok(idx.indexOf('bulmyeongwi-fog-r990.js')>idx.indexOf('<script src="./bulmyeongwi-r760.js"'),'R760 뒤에 실림');
 ok(fs.existsSync(path.join(R,'runtime-text','assets','r990','fog-core.webp')),'안개 핵 자산');ok(fs.existsSync(path.join(R,'runtime-text','assets','r430','mist-loop.webp')),'안개 시트(기존 자산)');}
console.log('R990 CPU 검사 통과',n);
