// R112 CPU check (user 2026-10-28 02:52): 제7부 murder01·02·03 mix the three existing 제7부 mob arts by text cues.
// Count, ids, hp, damage, waves and spawn state stay as the native rooms built them; bosses, midbosses, ward champions
// and R74 world monsters are untouched. Also checks the R112 canon swap (제3부~제8부 + 제9부 서문·문턱·S-01).
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const read=f=>fs.readFileSync(path.join(SRC,f),'utf8');
const donorRow=(id,path)=>({id:'murder04:'+id,nativeId:id,name:id,path,profile:{path,frames:{move:{path:path+'#m'}}},combatProfile:{id},weapon:id,ai:id,type:'melee',radius:.4,speed:1,hp:80,maxHp:80,damage:9});
const registered=[];
const sb={console,Math,JSON,Set,Map,Object,Array,Number,String,Boolean,Error,RegExp,
 localStorage:{getItem:()=>null,setItem(){}},
 regionById:{murder01:{paths:[]},murder02:{paths:[]},murder03:{paths:[]},murder04:{paths:[]}},
 actor3(){},ordinaryActor3:e=>!e.boss&&!e.midboss,register:(p)=>registered.push(p),compileWorld(){},enterRegion:id=>id};
sb.makeRoom=function(id){
 if(id==='murder04')return{enemies:[donorRow('murder04-e1','assets/murder/silent_alarm.png'),donorRow('murder04-e2','assets/murder/rooftop_echo.png'),donorRow('murder04-e3','assets/episode1b/generated-v394/blue_executor.webp')]};
 const en=[{id:id+':mb',nativeId:'mb-'+id,midboss:true,name:'mid',hp:500}];
 for(let i=0;i<12;i++)en.push({id:id+':story-patrol:'+i,nativeId:'murder04-e2',name:'잔향 '+(i+1),path:'assets/murder/rooftop_echo.png',profile:{},hp:40+i,maxHp:40+i,damage:5,x:i,y:i,fieldWave:1+(i%2),spawnState:i%2?'hidden':'active'});
 en.push({id:id+':r74-patrol:0',nativeId:'murder04-e2',name:'유리 망령',path:'assets/murder/rooftop_echo.png'});
 en.push({id:id+':ward-champion-r81:murder04-e2',nativeId:'murder04-e2',name:'중간보스 · x',path:'assets/murder/rooftop_echo.png'});
 return{enemies:en};};
sb.window=sb;
vm.createContext(sb);vm.runInContext(read('mobs-r112.js'),sb);
const M=sb.__STORYWORLD_MOBS_R112__;
check('R112 mob module loaded',!!M&&M.revision==='R112-mobs-1');
for(const z of ['murder01','murder02','murder03']){
 const base=sb.makeRoom.call(null,'murder04');void base;
 const r=sb.makeRoom(z,'STORY'),kinds=new Set(r.enemies.filter(e=>/story-patrol/.test(e.id)).map(e=>e.nativeId));
 check(z+' story patrol mixes more than one 제7부 mob',kinds.size>=2,[...kinds]);
 check(z+' only existing 제7부 arts are used',r.enemies.every(e=>/^assets\/murder\/|blue_executor/.test(e.path||'assets/murder/')),r.enemies.map(e=>e.path));
 const pat=r.enemies.filter(e=>/story-patrol/.test(e.id));
 check(z+' count, ids, hp, damage, waves and spawn state unchanged',pat.length===12&&pat.every((e,i)=>e.id===z+':story-patrol:'+i&&e.hp===40+i&&e.damage===5&&e.fieldWave===1+(i%2)&&e.spawnState===(i%2?'hidden':'active')&&e.x===i));
 check(z+' midboss, ward champion and R74 monster untouched',r.enemies[0].nativeId==='mb-'+z&&r.enemies.find(e=>/r74-patrol/.test(e.id)).name==='유리 망령'&&r.enemies.find(e=>/ward-champion/.test(e.id)).nativeId==='murder04-e2');
 check(z+' donor art registered for preload',sb.regionById[z].paths.includes('assets/murder/silent_alarm.png'));
}
M.set({mix:false});
check('preference off keeps the native single-mob room',new Set(sb.makeRoom('murder03','STORY').enemies.filter(e=>/story-patrol/.test(e.id)).map(e=>e.nativeId)).size===1);
check('no runtime failures',M.stats().failures===0,M.stats().lastError);
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
check('mobs-r112 loads last, after play-r111',html.indexOf('mobs-r112.js')>html.indexOf('play-r111.js')&&html.indexOf('play-r111.js')>0);
check('runtime copy matches client source',fs.readFileSync(path.join(RT,'mobs-r112.js'),'utf8')===read('mobs-r112.js'));
const canon=fs.readFileSync(path.join(ROOT,'..','story-source','hapil-canon-r112-merged.txt'),'utf8');
check('canon carries the 제3부~제8부 교정본 opening',canon.includes('의목사 A가 돌아오지 않자 나는 일곱 대죄 사건의 배후를 조사하라는 임무를 받았다.'));
check('canon carries the 제9부 서문·S-01 교정본',canon.includes('교주가 사라진 자리에서 희미한 소리가 들렸다.')&&!canon.includes('교주가 사라진 자리에서 자장가가 들렸다.'));
check('canon hash',crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'..','story-source','hapil-canon-r112-merged.txt'))).digest('hex')==='a74263b6de4a3c6ba8bda7e4cb0eb4bd315f586e8a3496ebde03c6a941bfe08a');
console.log(`\n${n-failed}/${n} passed`);process.exit(failed?1:0);
