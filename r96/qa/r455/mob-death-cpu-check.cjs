// R455 CPU 검사: 일반 몹 죽음 = 자기 그림으로 불타 소멸 / 피 터짐 → 시체(사체) 남김. 다른 몹 그림을 빌리지 않는지, 보스는 그대로인지, 시체 수 제한·지역 이동 시 비움.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='mob-death-r455.js',src=C(F);
ok('runtime copy matches source',src===RT(F));try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');ok('script tag once, right after cinema-run-r461, before combat-r118',html.split('"./'+F+'"').length===2&&html.includes('<script src="./cinema-run-r461.js"></script><script src="./mob-death-r455.js"></script>')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-r118.js"'));
ok('listed in verify-r96-public.py',/'mob-death-r455\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('no gameplay writes (hp/damage/kill/save/reward)',!/\.hp\s*=[^=]|damage\s*=|killEnemy\s*\(|saveGame|gainXP|room\.kills/.test(src));
ok('no monster shadow() drawing (R444 removed monster shadows)',!/shadow\(/.test(src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'')));
ok('Mammon zones untouched',!/ep1b06/.test(src));
for(const p of ['assets/r411/fx/boss-fire-wall.webp','assets/r411/fx/boss-corpse-explosion.webp','assets/r190/blood/blood-death.webp'])ok('sheet exists '+p,src.includes(p)&&fs.existsSync(path.join(R,'runtime-text',p)));
// 환경 흉내
function env(o={}){const calls=[];const g={window:{},localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setTimeout(){},Date,console,calls,Math,JSON};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,zoom=1,settings={lowFx:${!!o.low}},room={id:'dist01'},effects=[],VFX={burnFlame:'assets/vfx/burn.png'};
 var ctx={save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(im){calls.push('ctx.drawImage:'+im.src);},globalAlpha:1,filter:'none'};
 function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}function readyImage(p){return{image:{src:p,naturalWidth:1536,naturalHeight:1024}};}
 function sprite(p,x,y,h,opt){calls.push('sprite:'+p+':'+(opt&&opt.filter||''));return true;}
 function drawAssetFrame3(p,f,x,y,h,opt){calls.push('frame:'+p+':'+(opt&&opt.filter||''));return true;}
 function texture(){calls.push('texture');}
 function drawEnemy(e){sprite(e.drawn,0,0,60*(e.big||1),{flip:false});sprite('assets/vfx/status.png',0,0,12,{});}
 function drawBurnDeath3(fx){calls.push('base:'+(fx.bodyPath||'none'));}
 function drawObjective(){calls.push('objective');}
 function enterRegion(){return 1;}`,g);
 vm.runInContext(src,g);return g;}
const g=env(),M=g.__STORYWORLD_MOB_DEATH_R455__;ok('installed',M.inspect().installed);
// 분류
const K=n=>M.kindOf({name:n});
ok('flesh → blood (spider/hound/zombie/slime/goblin)',['망각의 거미','보랏빛 알집지기','분노의 사냥개','전극을 두른 좀비 수호기사','중립초원 슬라임','숲 고블린','피냄새 추적자'].every(n=>K(n)==='blood'));
ok('spirit/demon/undead/machine → fire',['재 나방','거미줄에 묶인 수호병','늪의 염소머리 악마','유리 망령','기계화 망각거미','이름 잃은 전우','오만의 흰 가면','불길 속의 늑대'].every(n=>K(n)==='fire'));
// 살아 있을 때 그림을 기억 → 죽음 효과(엔진 몸 그림은 다른 몹) → 자기 그림으로 그림
const e={id:'m1',name:'망각의 거미 1',nativeId:'dist01-s9',hp:10,drawn:'assets/r380/mobs/spider-own.webp'};
vm.runInContext('drawEnemy',g)(e);ok('alive look remembered',M.inspect().stats.looks===1);
const fx={type:'enemyBurnDeath',sourceId:'m1',x:3,y:4,age:.05,life:.72,bodyPath:'assets/other/goat-demon-dead.png'};
g.calls.length=0;vm.runInContext('drawBurnDeath3',g)(fx);
ok('blood kind, life extended',fx.r455?.kind==='blood'&&fx.life>=1.1);
ok('dying body uses own art only (never engine foreign death frame)',g.calls.some(c=>c.startsWith('sprite:assets/r380/mobs/spider-own.webp'))&&!g.calls.some(c=>c.includes('goat-demon-dead')));
ok('blood burst sheet drawn',g.calls.includes('ctx.drawImage:assets/r411/fx/boss-corpse-explosion.webp'));
// 불: 엔진 불꽃은 몸 빼고
const e2={id:'m2',name:'유리 망령',hp:5,drawn:'assets/r380/mobs/glass.webp'};vm.runInContext('drawEnemy',g)(e2);
const fx2={type:'enemyBurnDeath',sourceId:'m2',x:5,y:5,age:.5,life:.72,bodyPath:'assets/other/foreign.png'};g.calls.length=0;vm.runInContext('drawBurnDeath3',g)(fx2);
ok('fire: engine flame/embers kept without its body',g.calls.includes('base:none')&&g.calls.includes('ctx.drawImage:assets/r411/fx/boss-fire-wall.webp')&&g.calls.some(c=>c.startsWith('sprite:assets/r380/mobs/glass.webp')));
ok('fire body chars (brightness drops)',g.calls.some(c=>/sprite:assets\/r380\/mobs\/glass\.webp:brightness\(0\.[0-9]/.test(c)));
// 보스 그대로
const fx3={type:'enemyBurnDeath',sourceId:'m1',boss:true,x:1,y:1,age:.1,life:1.25,bodyPath:'assets/boss.png'};g.calls.length=0;vm.runInContext('drawBurnDeath3',g)(fx3);
ok('boss death untouched',g.calls.join()==='base:assets/boss.png'&&fx3.life===1.25);
// 기억 못 한 몹 → 엔진 그대로
const fx4={type:'enemyBurnDeath',sourceId:'zz',x:1,y:1,age:.1,life:.72,bodyPath:'p.png'};g.calls.length=0;vm.runInContext('drawBurnDeath3',g)(fx4);ok('unknown mob falls back to engine',g.calls.join()==='base:p.png');
// 시체
vm.runInContext('time=3',g);g.calls.length=0;vm.runInContext('drawObjective',g)();
ok('corpses drawn at ground after objective (2)',M.inspect().corpses===2&&g.calls[0]==='objective'&&g.calls.some(c=>c.startsWith('sprite:assets/r380/mobs/spider-own.webp:brightness(.68)'))&&g.calls.some(c=>c.startsWith('sprite:assets/r380/mobs/glass.webp:brightness(.42)')));
ok('blood pool sheet under blood corpse',g.calls.includes('ctx.drawImage:assets/r190/blood/blood-death.webp'));
for(let i=0;i<40;i++){const m={id:'k'+i,name:'숲 고블린',hp:3,drawn:'assets/x/gob.webp'};vm.runInContext('drawEnemy',g)(m);vm.runInContext('drawBurnDeath3',g)({type:'enemyBurnDeath',sourceId:'k'+i,x:i,y:1,age:.1,life:.72});}
ok('corpse cap 24 per room',M.inspect().corpses===24);
vm.runInContext('time=3+60',g);vm.runInContext('drawObjective',g)();ok('corpses fade out after 45s+4s',M.inspect().corpses===0);
vm.runInContext('drawEnemy',g)({id:'q1',name:'숲 고블린',hp:3,drawn:'a.webp'});vm.runInContext('drawBurnDeath3',g)({type:'enemyBurnDeath',sourceId:'q1',x:1,y:1,age:.1,life:.72});
vm.runInContext('room={id:"dist02"}',g);vm.runInContext('drawObjective',g)();ok('corpses cleared when room changes',M.inspect().corpses===0);
// 저사양
const gl=env({low:true}),Ml=gl.__STORYWORLD_MOB_DEATH_R455__;for(let i=0;i<20;i++){vm.runInContext('drawEnemy',gl)({id:'k'+i,name:'숲 고블린',hp:3,drawn:'g.webp'});vm.runInContext('drawBurnDeath3',gl)({type:'enemyBurnDeath',sourceId:'k'+i,x:i,y:1,age:.1,life:.72});}
ok('low-fx corpse cap 10',Ml.inspect().corpses===10);
// 끄기
const go=env({prefs:{on:false}});vm.runInContext('drawEnemy',go)({id:'m1',name:'망각의 거미',hp:3,drawn:'s.webp'});const fo={type:'enemyBurnDeath',sourceId:'m1',x:1,y:1,age:.1,life:.72,bodyPath:'p.png'};go.calls.length=0;vm.runInContext('drawBurnDeath3',go)(fo);
ok('off switch keeps engine death',go.calls.join()==='base:p.png'&&fo.life===.72);
const gc=env({prefs:{corpses:false}});vm.runInContext('drawEnemy',gc)({id:'m1',name:'망각의 거미',hp:3,drawn:'s.webp'});vm.runInContext('drawBurnDeath3',gc)({type:'enemyBurnDeath',sourceId:'m1',x:1,y:1,age:.1,life:.72});ok('corpses:false → no corpse',gc.__STORYWORLD_MOB_DEATH_R455__.inspect().corpses===0);
console.log(`R455 mob death: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
