// R220 CPU check: 실내 일관성(야외 바깥 덮개 숨김·길거리 소품 정리·기둥 골격 기본 끔) + 몹 떨림(공격·준비·맞음·공격 뒤 자세 구간에도 같은 그림 묶음).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const cave=C('cave-r204.js'),mobs=C('mobs-r109.js');
ok('runtime copies match',RT('cave-r204.js')===cave&&RT('mobs-r109.js')===mobs);
ok('in the CI workflow',/qa\/r220\/r220-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 실내 바깥
ok('interiors hide the outdoor shell (r100-hedge-top moss/cliff caps, r98-annex-ground-open water/cliff plane) and remember the layer mask for restoreNative',
 /SHELL=\/\^\(r100-hedge-top\|r98-annex-ground-open\)\$\//.test(cave)&&/o\.userData\.r204Mask=o\.layers\.mask;o\.layers\.mask=0/.test(cave)&&/r\.__r204Hidden=true/.test(cave));
ok('the shell is re-checked on interior frames and on build; unify can be switched off',/dimRoofs\(r\);interiorShell\(r\);interiorProps\(roomOf\(frame\),cfg\);/.test(cave)&&/\{dimRoofs\(r\);interiorShell\(r\);\}/.test(cave)&&/unify:true/.test(cave)&&/prefs\.unify===false\)return 0/.test(cave));
ok('pillar skeleton (R218) is off by default (user: lowered quality) and floor lift / roof dim no longer depend on it',/skeleton:false/.test(cave)&&/prefs\.skeleton===true\)\{const sg=skeletonMesh/.test(cave)&&/prefs\.unify!==false&&cfg\.floorLift>1/.test(cave));
// 소품 거르기
const sb={console,Math,JSON,Set,Map,WeakMap,Promise,Float32Array,Uint8Array,Array,Object,Number,String,Error,performance:{now:()=>0},setInterval:()=>0,setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}},
 window:{StoryPhase1:{ThreeRenderer:Object.assign(function(){},{prototype:{render(){}}}),attachSight24(){}}}};
vm.createContext(sb);vm.runInContext('var room=null,player={x:0,y:0};function blocked(){return false;}function makeRoom(id){return {id,layer:"STORY",props:[],enemies:[]};}async function enterRegion(){return true;}',sb);vm.runInContext(cave,sb);
const API=sb.window.__STORYWORLD_CAVE_R204__;
const mk=()=>({props:[{path:'assets/props/v290/broken_street_lamp.webp',kind:'regional-scene-prop'},{path:'assets/props/v290/ruined_market.webp',kind:'regional-scene-prop'},
 {path:'assets/props/v290/ruined_market.webp',kind:'corrected-regional-scenery',name:'갈망 약병장'},{path:'assets/r103/chest-closed.svg',kind:'chest'},{path:'assets/world-r80/r80-058.webp'},{path:'assets/world-r80/r80-148.webp'},{path:'assets/props/v290/collapsed_pillar.webp'}]});
const a=mk();API.interiorProps(a,{kind:'clinic'});const keep=a.props.map(q=>q.path.split('/').pop()+(q.name?'*':''));
ok('clinic: street lamp and unnamed market removed; named narrative prop, chest, medical cabinet, roof vent (non-home) and ruin pillar kept',
 !keep.includes('broken_street_lamp.webp')&&!keep.includes('ruined_market.webp')&&keep.includes('ruined_market.webp*')&&keep.includes('chest-closed.svg')&&keep.includes('r80-148.webp')&&keep.includes('collapsed_pillar.webp'),keep);
const b=mk();API.interiorProps(b,{kind:'home'});ok('home/urban (murder houses): the roof vent r80-058 is removed too',!b.props.some(q=>/r80-058/.test(q.path)));
const c=mk();API.interiorProps(c,{kind:'urban'});ok('urban same as home for the roof vent',!c.props.some(q=>/r80-058/.test(q.path)));
const d=mk();API.interiorProps(d,{kind:'clinic'});const n=d.props.length;API.interiorProps(d,{kind:'clinic'});ok('filtering runs once per room',d.props.length===n&&d.r220Props===true);
// 몹 한 묶음
ok('mob jitter: attack/windup/hit and the post-ranged story pose window (storyAttackUntil5) count as attacking',/const inAtk=e=>!!\(e&&\(e\.attack\|\|e\.rangedWindup>0\|\|\(finite\(e\.storyAttackUntil5\)&&now\(\)<e\.storyAttackUntil5\)\)\)/.test(mobs));
ok('mob jitter: the drawEnemy wrapper overrides the profile attack/windup/hit cells with the same family (or the single own image) before the engine picks a cell',/const fam=familyFrames\(e,patch\);if\(fam\)patch=\{\.\.\.\(patch\|\|\{\}\),\.\.\.fam\};/.test(mobs)&&/return \{attack:own,attackA:own,attackB:own,windup:own,hit:own\}/.test(mobs));
ok('mob jitter: R54 frameFor (extended rooms) is wrapped so it no longer swaps in the shared rc137 pose; R208/R200 mobs and ep1a08 native poses are left alone',/__r220:true,frameFor\(e,f\)/.test(mobs)&&/!e\.r208Mob&&!e\.r200Shade/.test(mobs)&&/zone!=='ep1a08'/.test(mobs));
ok('mob jitter can be switched off (oneFamily pref)',/oneFamily:true/.test(mobs)&&/prefs\.oneFamily/.test(mobs));
let fail=0;for(const x of checks){console.log((x.pass?'PASS ':'FAIL ')+x.name+(x.pass?'':' '+JSON.stringify(x.detail)));if(!x.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
