// R170 CPU check: 근접 공격 준비 이름표·화살표 숨김, 피의 탑(고정형 원거리: 피 육망성 → 촉수 + 잡몹 소환), 본편 몹 맵 곳곳 분포,
//  B·D 구역 중간보스 100마다(+10%)·준보스 6·보스격 1, 체력 고정(R61 정규화 제외), 몹 이펙트 색 = 그 몹의 고유색·보조색, 나무 그림자 끔·뿌리 묻기 9%.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['combat-r170.js','samong-r103.js','samong-r161.js','play-r169.js','play-r115.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
ok('combat-r170 loads after play-r169',/play-r169\.js"><\/script><script src="\.\/combat-r170\.js"><\/script>/.test(fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8')));
// ---- sandbox ----
let t=0;const calls=[];const mk=()=>({fillStyle:'',strokeStyle:'',fillRect(){calls.push(['fillRect',this.fillStyle]);},rect(){calls.push(['rect']);},fillText(s){calls.push(['fillText',s]);},stroke(){calls.push(['stroke',this.strokeStyle]);},strokeRect(){calls.push(['strokeRect',this.strokeStyle]);},setLineDash(){},save(){},restore(){},translate(){},scale(){},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){}});
const ctx=mk();const floor=[];for(let x=0;x<60;x++)for(let y=0;y<60;y++)floor.push([x,y]);
const mob=(id,x,y,o={})=>({id,x,y,hp:10,maxHp:10,damage:5,spawnState:'active',name:'잡몹',...o});
const room={id:'ep1a09',props:[],enemies:[],exploration:{floorCells:floor,entry:{x:1.5,y:1.5}},objective:{x:50,y:50}};
for(let i=0;i<24;i++)room.enemies.push(mob('m'+i,3+(i%4)*.6,3+Math.floor(i/4)*.6));
const hazards=[],effects=[];let shadowCalls=0;
const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},ctx,room,player:{x:2,y:2,hp:100,samong:0,ego:0},started:true,hazards,effects,uid:0,VFX:{mark:'m'},
 regionById:{ep1a09:{regionObjects6:[{path:'assets/props/v290/hotel_luggage_cart.webp'},{path:'assets/props/v290/blank_memorial.webp',height:92}]}},
 safeRegion:()=>false,blocked:()=>false,project:(x,y)=>({x:x*10,y:y*5}),actorHeight:()=>60,attackPower:()=>100,readyImage:()=>({image:{}}),ensureImages(){},
 drawEnemy(e){if(e.attack&&!e.attack.committed){ctx.fillStyle='rgba(14,13,15,.92)';ctx.fillRect(0,0,1,1);ctx.rect(0,0,1,1);ctx.fillText('근접 공격 준비');ctx.strokeStyle='#e2c18b';ctx.stroke();}ctx.strokeStyle='#123456';ctx.stroke();},
 drawHazard(){},drawEffect(){},drawProp(p){vm.runInContext('shadow()',sb);},shadow(){shadowCalls++;},tick(){},async enterRegion(){return true;},Math,JSON,String,Object,Number,Set,Map,Array,Promise};
Object.defineProperty(sb,'time',{get:()=>t});vm.createContext(sb);vm.runInContext(C('combat-r170.js'),sb);const X=sb.window.__STORYWORLD_COMBAT_R170__;
// ① 이름표
calls.length=0;sb.drawEnemy({hp:5,attack:{committed:false}});
ok('melee windup: label box, text and arrow stroke are muted; other strokes still draw',!calls.some(c=>c[0]==='fillText'&&c[1]==='근접 공격 준비')&&!calls.some(c=>c[0]==='fillRect')&&!calls.some(c=>c[1]==='#e2c18b')&&calls.some(c=>c[1]==='#123456'),calls);
calls.length=0;sb.drawEnemy({hp:5,boss:true,attack:{committed:false}});ok('bosses keep their own tells',calls.some(c=>c[0]==='fillText'));
// ④ 분포(맵에 들어설 때)
sb.enterRegion().then(()=>{});
setImmediate(()=>{
 const xs=room.enemies.map(e=>e.x),ys=room.enemies.map(e=>e.y),span=Math.max(...xs)-Math.min(...xs)+Math.max(...ys)-Math.min(...ys);
 ok('story mobs bunched in one corner get spread over the map in packs (span > 30 tiles)',span>30,span);
 ok('spread mobs keep their home where they now stand',room.enemies.every(e=>e.homeX===e.x&&e.homeY===e.y));
 // ② 탑
 t=1;vm.runInContext('tick()',sb);ok('no story tower in the first seconds after entering (saves/tests keep the same enemy list)',!room.enemies.some(e=>e.r170Tower));t=8;const sp=X.nextSpot();sb.player.x=sp.x+3;sb.player.y=sp.y;vm.runInContext('tick()',sb);const tw=room.enemies.filter(e=>e.r170Tower);if(!tw.length)console.log(JSON.stringify(X.inspect()));
 ok('one blood tower appears in a story combat map, using the region statue/memorial art and preserved health',tw.length===1&&/blank_memorial/.test(tw[0].r170Tower.art)&&tw[0].speed===0&&tw[0].r75Tower&&tw[0].r61PreserveHealth===true,tw.map(e=>e.r170Tower&&e.r170Tower.art));
 const T0=tw[0];sb.player.x=T0.x+3;sb.player.y=T0.y;t=12;vm.runInContext('tick()',sb);
 ok('near the hero the tower casts a blood hexagram field under the hero',hazards.some(h=>h.samongPattern==='r170-hex'&&Math.abs(h.x-sb.player.x)<.01&&h.warning>1),hazards.map(h=>h.samongPattern));
 const before=room.enemies.length;t=18.5;vm.runInContext('tick()',sb);ok('every second cast summons two of the map\'s mobs from the hexagram',room.enemies.length===before+2&&room.enemies.slice(-2).every(e=>e.r170Summoned));
 ok('hexagram is drawn in the effect layer (R167 style), not as the gold hazard sigil',effects.some(e=>e.type==='r170-fx'));
 // ③ 나무 그림자
 shadowCalls=0;sb.drawProp({path:'assets/r99/outdoor/tree-living-03.webp',r99Tree:{}});sb.drawProp({path:'assets/props/v290/blood_altar.webp'});
 ok('trees skip their shadow ellipse, other props keep it',shadowCalls===1,shadowCalls);
 const r103=C('samong-r103.js');
 ok('B·D: midboss every 100 kills (was 111) and D gets them too',/S\.kills<\(x\.r162Mid\+1\)\*100/.test(r103)&&/gradesR170\(dt,r,x,z,ep,L,true\)/.test(r103));
 ok('B·D: 6 sub-bosses at every 90 kills, one boss-grade at 600 from the episode boss',/x\.r170Sub<6&&S\.kills>=\(x\.r170Sub\+1\)\*90/.test(r103)&&/S\.kills>=600/.test(r103)&&/'보스 · '\+bd\.name/.test(r103)&&/bd\.donor/.test(r103));
 ok('their health is kept (R61 normalisation skipped) and based on attack without samong/EGO buffs',(r103.match(/r61PreserveHealth=true/g)||[]).length>=3&&/function baseAtkR170/.test(r103));
 ok('puppet art is not forced on towers or the boss-grade',/!e\.r170Tower&&!e\.samongBossR170/.test(C('samong-r161.js')));
 ok('mob attack FX colour = the mob\'s own palette (unique → glow, secondary → glow)',/function palOf\(e,fam\)/.test(C('play-r169.js'))&&/main:\{a:pl\.p,b:pl\.gp/.test(C('play-r169.js')));
 ok('tree roots sink 9% into the ground',/r99Tree\|\|\/tree\/i\.test\(String\(p\?\.path\|\|''\)\)\)return \.09/.test(C('play-r115.js')));
 let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
 if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');});
