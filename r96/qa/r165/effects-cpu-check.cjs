// R165 CPU check: 공용 그림 한 장이던 순간(레벨업·회복 문양·몹/보스 사망·사몽 열린 문)에 pixelfx 시트를 더한다. 사망 연기는 동시 6개까지.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('effects-r165.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','effects-r165.js'),'utf8')===C('effects-r165.js'));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');ok('loads right after pixelfx-r163',html.includes('<script src="./pixelfx-r163.js"></script><script src="./effects-r165.js"></script>'));
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r163','pixelfx','index.json'),'utf8'));
ok('level-up is the holy light pillar (no pixel person outline), sheets rendered without the stock pixel actor, softened to the painted style',idx.effects['level-up']?.fx==='holy/holy-pillar'&&!idx.effects['poof-ash']&&idx.soften?.blur>0&&/--no-actor/.test(fs.readFileSync(path.join(R,'..','scripts','r163-pixelfx-sheets.py'),'utf8')));
// sandbox
const plays=[];let t=0;const VFX={heal:'h.webp',burst:'b.webp'};
const sb={window:{__STORYWORLD_PIXELFX_R163__:{ready:()=>true,play:(n,x,y,o)=>{plays.push(n);return{};},warm(){}}},localStorage:{getItem(){return null;},setItem(){}},setTimeout(){},Math,JSON,String,Object,Number,VFX,
 player:{x:1,y:1,level:1},room:{samongR103:null},fx:()=>{},drawEffect:()=>{},effects:[],killEnemy:e=>{e.deadRecorded=true;},tick:()=>{},enterRegion:async()=>true};
Object.defineProperty(sb,'time',{get:()=>t});vm.createContext(sb);vm.runInContext(C('effects-r165.js'),sb);
vm.runInContext('fx("sigil",1,1,{asset:VFX.heal,size:2});fx("sigil",1,1,{asset:VFX.burst})',sb);ok('heal sigil adds the heal ring, other sigils do not',plays.filter(n=>n==='heal-aoe').length===1&&plays.length===1,plays);
plays.length=0;vm.runInContext('tick();player.level=2;tick();tick();',sb);ok('level up plays once',plays.filter(n=>n==='level-up').length===1,plays);
plays.length=0;vm.runInContext('for(let i=0;i<10;i++)killEnemy({x:1,y:1,hp:0})',sb);const st=sb.window.__STORYWORLD_EFFECTS_R165__.inspect().stats;ok('mob deaths: painted smoke/embers (R106 sprites, not pixelfx), capped at 6 per moment',st.deaths===6&&st.deathSkipped===4&&plays.length===0,st);
plays.length=0;vm.runInContext('killEnemy({x:1,y:1,boss:true})',sb);ok('boss death plays the blood dark explosion',plays[0]==='dark-explosion-blood');
plays.length=0;const d0=sb.window.__STORYWORLD_EFFECTS_R165__.inspect().stats.deaths;t+=5;vm.runInContext('killEnemy({x:1,y:1,samongR103Silent:true})',sb);ok('silent removals (faded leftovers, core leaks) play nothing',plays.length===0&&sb.window.__STORYWORLD_EFFECTS_R165__.inspect().stats.deaths===d0);
plays.length=0;sb.room.samongR103={portal:{x:3,y:3}};vm.runInContext('tick()',sb);ok('open samong portal shows the swirl',plays[0]==='portal-teal');
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
