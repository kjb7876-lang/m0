// R160 CPU check: 구슬 칸 하늘색 원, Z/X/C 아래 칸, 미카엘라 슬롯별 연출, 기본공격 연타, 사몽 레이저 선, 사몽 아이콘.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['combat-r160.js','combat-r137.js','fx-d2s-r106.js','visual-r93-ui.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('combat-r160.js loads after samong-ult-r139 and fx-d2s-r106',html.indexOf('combat-r160.js')>html.indexOf('samong-ult-r139.js')&&html.indexOf('combat-r160.js')>html.indexOf('fx-d2s-r106.js')&&html.indexOf('combat-r160.js')<html.indexOf('audio-r98.js'));
const g=C('combat-r137.js');
ok('guard ring attaches only to the HP orb (no heroCard-sized circle)',!/getElementById\('heroCard'\)/.test(g.match(/function orb\(\)[^\n]*\n[^\n]*/)[0])&&/orbBox\.parentElement===host/.test(g));
ok('guard ring hidden at zero shield',/c\.style\.display=sh>0\?'':'none'/.test(g));
const v=C('visual-r93-ui.js');
ok('Z/X/C docks into the bottom hotbar on wide screens',/'story-wer-controls',\(\)=>wideBar\(\)\?document\.querySelector\('footer \.hotbar'\)/.test(v)&&/r160-bar \.skill\{width:70px!important;height:77px!important/.test(v));
const d=C('fx-d2s-r106.js');
ok('michaela Z/X/C use three different archetypes, Q stays fist',/michaela:Object\.freeze\(\{w:'aegis',e:'wingdash',r:'seraph'\}\)/.test(d)&&/const kind=SLOT_KIND\[hero\]\?\.\[slot\]\|\|ARCH\[hero\]/.test(d));
ok('new archetypes have draw functions',['aegis','wingdash','seraph'].every(k=>new RegExp('\\n '+k+'\\(e,u,h\\)\\{').test(d)));
// combat-r160 in a sandbox
const effects=[],hits=[],drawn=[];let t=0;
const sb={window:{__STORYWORLD_HERO_FX_R102__:{PALETTE:{michaela:{a:[255,122,178],b:[255,230,240]}}}},localStorage:{getItem(){return null;},setItem(){}},document:{getElementById(){return null;},createElement(){return{style:{setProperty(){}},setAttribute(){},querySelector(){return{setAttribute(){},getAttribute(){return''},textContent:''};}};},head:{appendChild(){}},body:{appendChild(){}}},
 setInterval(){},Math,JSON,String,Object,Number,Array,started:true,room:{enemies:[]},player:{hero:'michaela',x:0,y:0,hp:10,samong:0},effects,settings:{lowFx:false},
 project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,ctx:{save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){}},
 basicAttack(){sb.hitEnemy({x:1,y:0,hp:5});sb.makeShot(0,0,0,1,1,{friendly:true,owner:'hero'});},makeShot:(x,y,a,s,dm,opt)=>({...opt}),hitEnemy:(e,v,s)=>{hits.push(s);return true;},drawEffect:e=>{drawn.push(e.type);},tick:()=>{},enterRegion:async()=>true};
Object.defineProperty(sb,'time',{get:()=>t});
vm.createContext(sb);vm.runInContext(C('combat-r160.js'),sb);const api=sb.window.__STORYWORLD_COMBAT_R160__;
ok('module installs',!!api&&api.inspect().lastError===null,api&&api.inspect());
let shot=null;const mk=sb.makeShot;sb.makeShot=function(...a){shot=mk.apply(this,a);return shot;};
// a basic swing: the melee hit counts, the projectile made inside it is tagged
const base=sb.basicAttack;sb.basicAttack=base;
for(let i=0;i<5;i++){t+=.3;vm.runInContext('basicAttack()',sb);}
const st=api.inspect();
ok('basic hits inside basicAttack count and chain',st.stats.basicHits===5&&st.chain===5,st);
ok('5th chained hit is a combo burst',st.stats.bursts===1,st.stats);
ok('sentinel effect queued for drawing',effects.some(e=>e.type==='r160-combat'));
ok('skill hits (with kind/ability) are not basic',!api.isBasic({kind:'hero-samong-ultimate-r139',ability:'samong'})&&api.isBasic({attackKind9:'basic'})&&api.isBasic({r160Basic:true}));
t+=2;sb.hitEnemy({x:1,y:0,hp:5},1,{r160Basic:true});ok('chain resets after a 1.4 s gap',api.inspect().chain===1,api.inspect().chain);
// samong storm draws as a laser instead of being hidden
sb.drawEffect({type:'samongStormR75',r75Storm:{id:'x',start:t-.2,runs:[{a:{x:0,y:0},b:{x:5,y:0}}]}});
ok('samong storm line is drawn by R160 (laser), not passed on to be hidden',!drawn.includes('samongStormR75')&&api.inspect().stats.laserFallback===1,api.inspect().stats);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
