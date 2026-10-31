// R173 CPU check: 사몽 B·D 같은 전투 방식 늘리기 — F(세뇌당한 기억의 조각 6개 깨기), H(여섯 물결 6×11), G(정화의 코어 호위 777).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['samong-zones-r115.js','samong-r103.js','combat-r170.js','samong-mood-r123.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const atlas={path:'a.webp',width:8,height:8,sha256:'0',styles:{garden:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},domestic:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},clinical:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]},forge:{floorRect:[0,0,1,1],wallRect:[0,0,1,1]}}};
function load(modes){const sb={console,Math,JSON,Date,Set,Map,Object,Array,Number,String,Boolean,Symbol,Error,performance:{now:()=>0},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,
  StoryArtR74:{atlases:{materials:atlas}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{}}),head:{appendChild(){}}},localStorage:{getItem:k=>k==='storyworld.r173.modes'?JSON.stringify({on:modes}):null,setItem(){}}};
 sb.window=sb;vm.createContext(sb);for(const f of ['samong-text-r103.js','samong-zones-r115-data.js','samong-zones-r115.js'])vm.runInContext(C(f),sb,{filename:f});return sb.__STORYWORLD_SAMONG_ZONES_R115__;}
const Z=load(true),Z0=load(false),ch=Object.entries(Z.chapters),all=ch.flatMap(([,l])=>l);
ok('every episode gets one G (정화의 코어 · 호위) right before the last confront, after D',ch.every(([k,l])=>l.filter(z=>z.mode==='G').length===1));
ok('plain 66-kill combat zones rotate: plain → F → H (some of each across the samong)',all.filter(z=>z.mode==='F').length>=10&&all.filter(z=>z.mode==='H').length>=10&&all.filter(z=>z.kind==='combat'&&!z.mode).length>=10,{F:all.filter(z=>z.mode==='F').length,H:all.filter(z=>z.mode==='H').length});
ok('F/H keep the zone\'s own title, clues and 66 kills; G uses the lane-up template (exit at the top)',all.filter(z=>z.mode==='F'||z.mode==='H').every(z=>z.goal.kills===66&&!/조각|물결/.test(z.id))&&all.filter(z=>z.mode==='G').every(z=>z.tpl==='laneUp'&&z.goal.escort===true));
ok('storyworld.r173.modes {on:false} restores R162 zones (no F/G/H)',!Object.values(Z0.chapters).flat().some(z=>['F','G','H'].includes(z.mode)));
// done() rules
const F=all.find(z=>z.mode==='F'),H0=all.find(z=>z.mode==='H'),H={...H0,goal:{kills:66},clues:[]},G=all.find(z=>z.mode==='G');
const room=x=>({samongR103:x,enemies:[]});
ok('F is done only after 6 fragments are broken (and 66 kills, via kills check)',Z.done(room({r173Towers:6,r173Broken:5}),{...F,goal:{}})===false&&Z.done(room({r173Towers:6,r173Broken:6}),{...F,goal:{}})===true);
ok('H is done after the 6th wave is cleared, not by kill count',Z.done(room({r173Wave:5}),H)===false&&Z.done(room({r173Wave:6}),H)===true&&Z.done({samongR103:{r173Wave:6},enemies:[{hp:5,samongSurvival:true}]},H)===false);
ok('G is done when the core arrives',Z.done(room({}),G)===false&&Z.done(room({r173Arrived:true}),G)===true);
ok('HUD names each mode',/세뇌당한 기억의 조각/.test(Z.hudText(room({r173Broken:2}),F).text)&&/물결/.test(Z.hudText(room({r173Wave:3}),H).text)&&/호위/.test(Z.hudText(room({r173Light:{hp:700,max:777,prog:.4}}),G).text));
const r103=C('samong-r103.js');
ok('H: 11 per wave, 6 waves, last wave has one 준보스',/x\.r173Wave>=6/.test(r103)&&/for\(let n=0;n<11;n\+\+\)/.test(r103)&&/x\.r173Wave===6&&n===0/.test(r103));
ok('G: core 777 moves only with no enemy within 3.5, leaks 6 / 66, resets on fall',/hp:777,max:777/.test(r103)&&/dc<3\.5\)near=true/.test(r103)&&/c\.hp-=e\.samongElite\?66:6/.test(r103)&&/c\.x=start\.x;c\.y=start\.y/.test(r103));
ok('F: 6 fragment towers (once per zone), counted as broken when they fall',/m==='F'\?6/.test(C('combat-r170.js'))&&/if\(placedKey===key\)return;/.test(C('combat-r170.js'))&&/r173Broken=Math\.max/.test(r103));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
