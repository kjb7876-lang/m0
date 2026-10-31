// R161 CPU check: 사몽 구역 스토리 몹 → 꼭두각시 자아, 세뇌당한 기억의 조각 조형물, 피로 얼룩진 기억 타일(전용 바닥 없는 사몽 구역만).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['samong-r161.js','world-tiles-r118.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
for(const a of ['assets/r161/puppet/puppet-ego-walk-right-8.webp','assets/r161/sculpture/memory-fragment.webp','assets/r161/tiles/blood-memory.webp'])ok(a+' exists in runtime',fs.existsSync(path.join(R,'runtime-text',a)));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('samong-r161.js loads after art-drive-r105 and mobs-r109',html.indexOf('samong-r161.js')>html.indexOf('art-drive-r105.js')&&html.indexOf('samong-r161.js')>html.indexOf('mobs-r109.js'));
// tiles: dedicated rows stay, other samong zones get the blood tile, STORY regions untouched
const tsb={window:{StoryPhase1:{ThreeRenderer:{prototype:{createSpatial(){},clearScene(){}}}}},localStorage:{getItem(){return null;},setItem(){}},makeRoom:()=>({}),enterRegion:async()=>true,document:{getElementById(){return null;}},Image:function(){},Map,Set,Object,JSON,String};
vm.createContext(tsb);vm.runInContext(C('world-tiles-r118.js'),tsb);const T=tsb.window.__STORYWORLD_TILES_R118__;
ok('S-02 keeps its school floor',T.rowOf('sz115-S02-3').file==='school');
ok('S-01-1 keeps rosehouse',T.rowOf('sz115-S01-1').file==='rosehouse');
ok('other samong zones get the blood memory tile',['sz115-P-2','sz115-S04-3','sz115-RA-1','sz115-M-2'].every(k=>T.rowOf(k)?.file==='blood-memory'&&T.rowOf(k)?.dir==='assets/r161/tiles/'));
ok('STORY regions without a row stay untouched (no early-map use)',T.rowOf('dist01')?.file==='cave'&&T.rowOf('ep1a08')===null&&T.rowOf('dist02')===null);
// puppet selection
const room={samongR103:{key:'sz115-S04-3',ep:4},enemies:[],props:[],exploration:{floorCells:[],entry:{x:0,y:0}}};
const sb={window:{__STORYWORLD_DRIVE_ART_R105__:{artFor:e=>e.r105?'x':null}},localStorage:{getItem(){return null;},setItem(){}},room,time:0,readyImage:()=>null,drawEnemy(){},drawProp(){},tick(){},Math,JSON,String,Object,Number,Date,Promise};
vm.createContext(sb);vm.runInContext(C('samong-r161.js'),sb);const S=sb.window.__STORYWORLD_SAMONG_R161__;
ok('samong common mob is drawn as the puppet',S.puppetOf({samongR103:'k',hp:5}));
ok('R177: bosses / midbosses keep their samong art, and without samong art become the puppet (never the story-mode art)',!S.puppetOf({samongR103:'k',boss:true,r105:1})&&!S.puppetOf({samongR103:'k',name:'중간보스 x',r105:1})&&S.puppetOf({samongR103:'k',boss:true})&&S.puppetOf({samongR103:'k',name:'중간보스 x'}));
ok('mobs with R105 samong art keep it',!S.puppetOf({samongR103:'k',r105:true}));
ok('STORY mobs (no samongR103) are never replaced',!S.puppetOf({hp:5}));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
