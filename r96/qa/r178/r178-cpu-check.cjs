// R178 CPU check: 무료 CC0 PVFX Foundry 프레임 시트 중 화풍에 맞는 것만 — EGO 진입(영웅 색)·탑 깨짐(핏빛)·탑 소환 균열 문(핏빛)·기억 조각 줍기 나방(핏빛). 판정은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r163','pixelfx','index.json'),'utf8')).effects;
const names=['pvfx-resonant-break','pvfx-rift-portal','pvfx-void-implosion','pvfx-choir-moths'];
ok('four CC0 PVFX Foundry sheets are in the pixelfx index with source, license and source sha256',names.every(n=>idx[n]&&/CC0 1\.0/.test(idx[n].source)&&/^[0-9a-f]{64}$/.test(idx[n].sourceSha256)),names.filter(n=>!idx[n]));
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');
ok('sheets and effects-r178.js are published (runtime inputs), runtime copy matches',names.every(n=>inputs.includes('assets/r163/pixelfx/'+n+'.webp'))&&inputs.includes('effects-r178.js')&&fs.readFileSync(path.join(R,'runtime-text','effects-r178.js'),'utf8')===C('effects-r178.js'));
ok('blink fold and guard parry sheets are not used (they clashed with the art style)',!idx['pvfx-foldstep']&&!idx['pvfx-arcane-parry']&&!/blink|guardStart/.test(C('effects-r178.js')));
const plays=[];const player={x:3,y:4,hero:'seoha',ego:0};
const sb={window:{__STORYWORLD_PIXELFX_R163__:{has:()=>true,play:(n,x,y,o)=>plays.push({n,x,y,o})},__STORYWORLD_HERO_FX_R102__:{PALETTE:{seoha:{a:[1,2,3],b:[4,5,6]}}}},localStorage:{getItem(){return null;},setItem(){}},player,actorHeight:()=>60,
 ego(){player.ego=8;},killEnemy(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;},JSON,Math,String,Object};
vm.createContext(sb);vm.runInContext(C('effects-r178.js'),sb);
vm.runInContext('ego()',sb);ok('EGO entry plays the resonant break tinted with the hero palette',plays.length===1&&plays[0].n==='pvfx-resonant-break'&&plays[0].o.tint.a[0]===1,plays);
plays.length=0;vm.runInContext("killEnemy({x:5,y:6,hp:3,r170Tower:{}});killEnemy({x:1,y:1,hp:3})",sb);ok('a breaking tower collapses inward in blood red; ordinary kills play nothing',plays.length===1&&plays[0].n==='pvfx-void-implosion'&&plays[0].x===5);
plays.length=0;vm.runInContext('ego()',sb);ok('nothing plays when EGO did not actually start',plays.length===0);
ok('picking up a memory-shard collectible scatters blood moths (once, not looping)',/PX\.play\('pvfx-choir-moths',p\.x,p\.y,\{k:\.7,loop:false/.test(C('story-collect-r177.js')));
{const sb2={window:{__STORYWORLD_PIXELFX_R163__:{has:()=>true,play:(n,x,y,o)=>plays.push({n,x,y,o})},__STORYWORLD_HERO_FX_R102__:{PALETTE:{neon:{a:[100,200,200],b:[200,255,255]},slayer:{a:[200,80,90],b:[255,200,200]}}}},localStorage:{getItem(){return null;},setItem(){}},
  player:{x:0,y:0,hero:'neon',specialCD:0,skillAngle:0},room:{enemies:[{x:2,y:0,hp:5},{x:3,y:0,hp:5},{x:4,y:0,hp:5},{x:5,y:0,hp:5}]},actorHeight:()=>60,special(){sb2.player.specialCD=10;},Math,JSON,String,Object};
 vm.createContext(sb2);vm.runInContext(C('effects-r178.js'),sb2);plays.length=0;vm.runInContext('special()',sb2);
 ok('R179: Neon special plays an electric burst on the three nearest foes, tinted with a darkened hero colour',plays.length===3&&plays.every(p=>p.n==='pvfx-electric-impact')&&plays[0].o.tint.a[0]===55,plays.map(p=>p.n));
 plays.length=0;sb2.player.hero='slayer';sb2.player.specialCD=0;vm.runInContext('special()',sb2);ok('R179: Slayer special cracks the ground three times along the aim',plays.length===3&&plays.every(p=>p.n==='pvfx-earth-rupture')&&plays[2].x>plays[0].x);
 plays.length=0;vm.runInContext('special()',sb2);ok('R179: nothing plays when the special did not fire (cooldown unchanged)',plays.length===0);
 for(const n of ['pvfx-electric-impact','pvfx-warm-explosion','pvfx-mass-release','pvfx-earth-rupture','pvfx-frost-nova'])if(!idx[n])ok('sheet '+n+' present',false);}
ok('tower summons open a blood rift where the mob appears',/X\.play\('pvfx-rift-portal',m\.x,m\.y/.test(C('combat-r170.js')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
