// R1224 CPU 검사 — ① 보스 소환 몹이 방의 지금 몹을 따르는 일괄 규칙(summon-follow-r1224.js) ② 이동 그림 없던 보스·중간보스 8종 떠서 이동 표(move-float-r1224-data.js) ③ 연결.
//  정상: 개명된 종류는 방 이름으로. 경계: 통째로 바뀐 종류(다른 profile), 방에 같은 종류가 없을 때, 방 만들기 중·불러오는 중·다른 지역 def·보스·분신은 그대로. 회귀: 이미 같은 이름·그림이면 그대로(R531 재 나방), 끄기.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const SF=rd('client-source/summon-follow-r1224.js'),DF=rd('client-source/move-float-r1224-data.js'),D29=rd('client-source/move-float-r1029-data.js');
ok(rd('runtime-text/summon-follow-r1224.js')===SF&&rd('runtime-text/move-float-r1224-data.js')===DF,'runtime-text copies identical');
function world(ls){const timers=[];const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,RegExp,console,setTimeout:f=>{timers.push(f);return 1;},localStorage:{getItem:k=>ls&&ls[k]||null,setItem(){}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var loading=false;
 const P={spider:{id:'z-sp1',name:'진흙등 거미',path:'old/spider.png'},ghost:{id:'z-g1',name:'늪에서 되살아난 전우',path:'old/ghost.png'},knight:{id:'z-k1',name:'창기사',path:'k.png'},boss:{id:'z-boss',name:'보스',path:'b.png',boss:true}};
 var regionById={z:{id:'z',roster:[P.spider,P.ghost,P.knight]},y:{id:'y',roster:[P.knight]}};
 function actor3(d,id,x,y,boss,l,def){return {id,name:d.name,path:d.path,profile:d,boss:!!boss,x,y,hp:10,maxHp:10};}
 var room=null;
 function makeRoom(id){const r={id,enemies:[]};const def=regionById[id];for(const d of def.roster){const e=actor3(d,id+':'+d.id,0,0,false,'STORY',def);r.enemies.push(e);}
  // 방 만들 때 덧씌우기(개명·통째 교체) 흉내
  for(const e of r.enemies){if(e.name==='늪에서 되살아난 전우'){e.name='늪에서 되살아난 혼령체';e.path='new/ghost.webp';e.r248Key='혼령';}
   if(e.profile.id==='z-sp1'){const np={id:'z-sp1',name:'늪에서 되살아난 혼령체',path:'new/ghost.webp'};e.profile=np;e.name='늪에서 되살아난 혼령체 우두머리';e.path=np.path;e.r380Renamed=true;e.r75Pack=3;}}
  r.enemies.push(actor3(P.boss,'boss',0,0,true,'STORY',def));return r;}
 ` ,c);
 vm.runInContext(SF,c);while(timers.length)timers.shift()();vm.runInContext(`room=makeRoom('z');`,c);return c;}
const w=world(),A=(s)=>vm.runInContext(s,w);
ok(A('makeRoom.__r1224&&actor3.__r1224')===true,'wraps actor3 and makeRoom');
ok(A(`room.enemies.filter(e=>!e.boss).map(e=>e.name).join('|')`)==='늪에서 되살아난 혼령체 우두머리|늪에서 되살아난 혼령체|창기사','room building is untouched (rule skipped inside makeRoom)');
const sum=(pid,id,def='regionById.z')=>A(`(()=>{const e=actor3(regionById.z.roster.find(r=>r.id==='${pid}'),'z:r61-summon:${id}',1,1,false,'STORY',${def});return {name:e.name,path:e.path,pid:e.profile.id,key:e.r248Key||null,ren:e.r380Renamed||null,pack:e.r75Pack??null,f:e.r1224Follow||null};})()`);
let s=sum('z-g1','1');ok(s.name==='늪에서 되살아난 혼령체'&&s.path==='new/ghost.webp'&&s.key==='혼령'&&s.f&&s.f.from==='늪에서 되살아난 전우','renamed kind follows the room name, art path and art key: '+JSON.stringify(s));
s=sum('z-sp1','2');ok(s.name==='늪에서 되살아난 혼령체'&&s.path==='new/ghost.webp'&&s.ren===true&&s.pack===null,'replaced kind follows the model profile, keeps no squad suffix and no pack flag: '+JSON.stringify(s));
s=sum('z-k1','3');ok(s.name==='창기사'&&s.path==='k.png'&&!s.f,'unchanged kind stays as is');
s=sum('z-g1','4','regionById.y');ok(s.name==='늪에서 되살아난 전우','actor3 for another region def is untouched');
ok(A(`actor3(regionById.z.roster[1],'boss-clone',1,1,true,'STORY',regionById.z).name`)==='늪에서 되살아난 전우','boss flag call untouched');
ok(A(`actor3({id:'z-boss',name:'보스',path:'b.png'},'z:r61-summon:clone',1,1,false,'STORY',regionById.z).name`)==='보스','boss clone (profile not in roster) untouched');
A('loading=true');ok(sum('z-g1','5').name==='늪에서 되살아난 전우','untouched while loading');A('loading=false');
// 방에 같은 종류가 없을 때: 방의 일반 몹 하나를 본보기로
A(`room.enemies=room.enemies.filter(e=>e.profile.id!=='z-k1'||e.boss)`);s=sum('z-k1','6');ok(['늪에서 되살아난 혼령체'].includes(s.name)&&s.f,'kind missing from the room maps to a living room mob: '+JSON.stringify(s));
// 끄기
const w2=world({'storyworld.r1224.summonFollow':'{"on":false}'});ok(vm.runInContext(`actor3(regionById.z.roster[1],'z:r61-summon:9',1,1,false,'STORY',regionById.z).name`,w2)==='늪에서 되살아난 전우','off switch keeps old behaviour');
ok(A('__STORYWORLD_SUMMON_FOLLOW_R1224__.inspect().stats.followed')>=3,'inspect counts');
// ② 떠서 이동 표
const c2={};c2.window=c2;vm.createContext(c2);vm.runInContext(D29,c2);const before=Object.keys(c2.__STORYWORLD_MOVE_FLOAT_R1029_DATA__.arts).length;vm.runInContext(DF,c2);
const arts=c2.__STORYWORLD_MOVE_FLOAT_R1029_DATA__.arts,added=c2.__STORYWORLD_MOVE_FLOAT_R1224__;
ok(added.length===8&&Object.keys(arts).length===before+8,'8 boss/midboss arts joined to the R1029 table');
const WANT=['mb-kair01-v31231.png|0,0,726,724','b19d67bb1973_siren_idle.webp|0,0,672,384','blue_executor_idle.png|270,73,768,1134','c101-mid.png|0,0,661,724','c102-boss-poses.png|160,5,545,505','c103-mid-poses.png|255,0,270,520','c105-mid.png|0,0,728,724','c106-mid.png|0,0,685,724'];
for(const k of WANT){const key=added.find(a=>a.endsWith('/'+k));ok(key,'has '+k);const S=arts[key];ok(/^assets\/r1224\/float\/[a-z0-9-]+\.webp$/.test(S.path)&&S.n===8&&S.fps===8&&['mist','ghost','wing'].includes(S.kind),'entry shape '+k);
 const b=fs.readFileSync(path.join(R,'runtime-text',S.path));ok(b.slice(0,4).toString()==='RIFF'&&b.length<400000,'webp under 400KB '+S.path);}
ok(!added.some(k=>/mammon|ep1b06|mb-dist06|dist06-boss|balrog/i.test(k)),'Mammon, Balrog and the fixed pillar are not touched');
// 기존 열쇠를 덮지 않음
const c3={};c3.window=c3;vm.createContext(c3);vm.runInContext(D29,c3);const k0=Object.keys(c3.__STORYWORLD_MOVE_FLOAT_R1029_DATA__.arts)[0];c3.__STORYWORLD_MOVE_FLOAT_R1029_DATA__.arts[k0].mark=1;vm.runInContext(DF,c3);ok(c3.__STORYWORLD_MOVE_FLOAT_R1029_DATA__.arts[k0].mark===1,'existing R1029 entries untouched');
// ③ 연결
const html=rd('runtime-text/index.html');const i0=html.indexOf('move-float-r1029-data.js'),i1=html.indexOf('move-float-r1224-data.js'),i2=html.indexOf('summon-follow-r1224.js'),i3=html.indexOf('approved-mobs-r380.js');
ok(i0>0&&i1>i0&&i2>i1,'script tags after the R1029 table');ok(i3>0,'R380 present');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'summon-follow-r1224.js'"),'public verify list');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1224/r1224-cpu-check.cjs'),'CI line');
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');ok(inputs.includes('summon-follow-r1224.js')&&inputs.includes('move-float-r1224-data.js')&&inputs.includes('assets/r1224/float/c106-mid.webp'),'runtime inputs');
console.log('R1224 CPU check passed:',n,'assertions');
