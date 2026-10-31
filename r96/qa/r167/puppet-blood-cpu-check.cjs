// R167 CPU check: 꼭두각시 자아 찌르기(뒤로 물러났다 앞으로), 찔림 피 폭발, 중간보스 피 스킬(육망성·피가시 비석·피 운석).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['samong-r161.js','samong-play-r162.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
let t=0;const hazards=[];const room={samongR103:{key:'k',ep:1},enemies:[],props:[],exploration:{floorCells:[],entry:{x:0,y:0}}};
const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},room,hazards,uid:0,VFX:{mark:'m'},player:{x:5,y:5,invincible:0},readyImage:()=>null,drawEnemy(){},drawProp(){},tick(){},drawEffect(){},effects:[],blocked:()=>false,project:(x,y)=>({x,y}),Math,JSON,String,Object,Number,Date,Promise};
Object.defineProperty(sb,'time',{get:()=>t});vm.createContext(sb);vm.runInContext(C('samong-r161.js'),sb);const S=sb.window.__STORYWORLD_SAMONG_R161__;
const e={samongR103:'k',hp:10,x:4,y:5,attack:{elapsed:0,angle:0,committed:false,id:1,shape154:{windup:.5,active:.2,recovery:.4,range:1.2}}};
const d0=S.lunge(e).d;e.attack.elapsed=.5;const d1=S.lunge(e).d;e.attack.elapsed=.7;const d2=S.lunge(e).d;e.attack.elapsed=1.1;const d3=S.lunge(e).d;
ok('lunge: pulls back during windup, thrusts forward on strike, returns in recovery',d0===0&&d1<-.3&&d2>.7&&Math.abs(d3)<.01,[d0,d1,d2,d3]);
ok('B midboss puppets are drawn as puppets; R177: bosses/midbosses without samong art (none in this sandbox) are puppets too, never story art',S.puppetOf({samongR103:'k',midboss:true,samongMidR162:true})&&S.puppetOf({samongR103:'k',midboss:true})&&S.puppetOf({samongR103:'k',boss:true}));
room.enemies.push(e);e.r161={};e.attack.committed=true;vm.runInContext('tick()',sb);
ok('a landed thrust bursts blood at the hero',S.inspect().stats.bursts===1,S.inspect().stats);
const mb={samongR103:'k',hp:100,x:2,y:2,midboss:true,samongMidR162:true,damage:10,name:'중간보스 · x'};room.enemies.push(mb);
vm.runInContext('tick()',sb);/* 처음 2.5초는 쉬었다 시작 */const kinds=[];for(let i=0;i<3;i++){t+=6;hazards.length=0;vm.runInContext('tick()',sb);kinds.push([...new Set(hazards.map(h=>h.samongPattern))].join());}
ok('midboss cycles 피의 육망성 → 피가시 비석 → 피 운석, each as warned ground fields',kinds.join('|')==='puppet-hex|puppet-spike|puppet-meteor',kinds);
ok('spikes run in a line of 7, meteors fall in threes',(()=>{t+=6;hazards.length=0;vm.runInContext('tick()',sb);const a=hazards.length;t+=6;hazards.length=0;vm.runInContext('tick()',sb);const b=hazards.length;t+=6;hazards.length=0;vm.runInContext('tick()',sb);return a===1&&b===7&&hazards.length===3;})()); // 육망성 1 → 비석 7 → 운석 3
ok('the samong hazard painter draws puppet fields as dark blood circles (not the gold sigil)',/\/\^puppet-\/\.test\(h\.samongPattern/.test(C('samong-play-r162.js')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
