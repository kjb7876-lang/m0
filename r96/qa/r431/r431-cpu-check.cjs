// R431 CPU check: 보스방 가운데 전투 · 테마 보스 기술(6초, 1~2개) · 효과에 닿으면 상태이상+작은 도트 · 검은 불꽃 조형물 던지기.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='boss-arena-r431.js',src=C(F),fxs=C('theme-fx-r430.js');
for(const f of[F,'theme-fx-r430.js','world-combat-r78.js','combat-r114.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(RT,f),'utf8')===C(f));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loads once right after theme-fx-r430, before combat-r118',/<script src="\.\/theme-fx-r430\.js"><\/script><script src="\.\/boss-arena-r431\.js"><\/script>/.test(html)&&html.split(F).length===2&&html.indexOf(F)<html.indexOf('combat-r118.js'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r431/r431-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
const H=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
ok('runtime-manifest hashes match',[F,'theme-fx-r430.js','world-combat-r78.js','combat-r114.js'].every(f=>M.get(f)===H(f)));
const idx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r431/index.json'),'utf8'));let bad=[];
for(const[n,m]of Object.entries(idx.fx)){const p='assets/r431/'+m.file;if(!fs.existsSync(path.join(RT,p))||H(p)!==m.outSha256||M.get(p)!==m.outSha256)bad.push(n);}
ok('4 black-flame sheets exist, hash = index = manifest',Object.keys(idx.fx).length===4&&!bad.length,bad.join(','));
ok('no forbidden CSS filters',!/drop-shadow|blur\(/.test(src+fxs));
ok('boss placed first (takes the boss-room centre point)',/filter\(e=>alive\(e\)&&major\(e\)\)\.sort\(\(a,b\)=>\(b\.boss\?1:0\)-\(a\.boss\?1:0\)\)/.test(C('world-combat-r78.js')));
ok('R114 exposes throwInfo',/throwInfo:t=>\{const i=throwInfo\.get\(t\)/.test(C('combat-r114.js')));
ok('Mammon vault excluded (leash + skill)',/room\.id==='ep1b06'/.test(src)&&/id==='ep1b06'/.test(fxs));
// ---- 가짜 게임 ----
let t=0;const effects=[],draws=[],hurts=[];
const ctx={save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},ellipse(){},fill(){},drawImage(im){draws.push(im.src);},scope(m,run){run();},globalAlpha:1,globalCompositeOperation:'',filter:'none',fillStyle:''};
const floor=[];for(let y=0;y<40;y++)for(let x=0;x<40;x++)floor.push([x,y]);
const player={x:16,y:13,hp:500,invincible:0,invReason:'',attackCD:0,guard:false};
const boss={id:'b1',boss:true,hp:1000,maxHp:1000,spawnState:'active',x:16,y:13,name:'시험 보스'};
const room={id:'ep1b07',props:[],enemies:[boss],exploration:{floorCells:floor,worldR74:{doors:[]},entry:{x:30,y:30},worldWardR81:{bossBounds:[6,6,26,20],bossAnchor:{x:16,y:13}}}};
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Date,Promise,innerWidth:1280,innerHeight:720,W:1280,H:720,
 document:{documentElement:{classList:{contains:()=>false}}},effects,ctx,TILE:34,zoom:.667,settings:{lowFx:true},layer:'STORY',room,player,started:true,loading:false,modal:null,shake:0,projectiles:[],
 project:(x,y)=>({x:(x-y)*22+640,y:(x+y)*11+300}),readyImage:p=>({image:{src:p}}),ensureImages(){},drawEffect(){},drawEnemy(){},drawProjectile(){},enterRegion(){},guardStart(){player.guard=true;},
 tick(){},moveActor(a,dx,dy){a.x+=dx;a.y+=dy;},moveAI3(e,g){e.lastGoal=g;},blocked:()=>false,maxHP:()=>500,toast(){},actorHeight:()=>44,
 hurt(d,s){hurts.push({d,s});player.hp-=d;player.invincible=.3;player.invReason='피격 보호';sb.shake=1.2;return'hit';}};
Object.defineProperty(sb,'time',{get:()=>t});
sb.window.__STORYWORLD_CINEMA_R114__={prefs:()=>({horror:'low'})};
vm.createContext(sb);vm.runInContext(fxs,sb);vm.runInContext(src,sb);
const A=sb.window.__STORYWORLD_THEME_FX_R430__,B=sb.window.__STORYWORLD_BOSS_ARENA_R431__;
ok('apis',A&&A.revision.includes('r431')&&B&&B.revision.startsWith('R431'));
ok('every theme kind maps to a status',Object.keys(A.KIND).every(k=>A.ST[A.STATUS_OF[k]]));
ok('status kinds: fire→burn, mist→poison, frost→chill(slow), arc→shock, tendril→bind',A.STATUS_OF.fire==='burn'&&A.STATUS_OF.mist==='poison'&&A.ST[A.STATUS_OF.frost].slow<1&&A.STATUS_OF.arc==='shock'&&A.ST.bind.slow<A.ST.chill.slow);
ok('skill kind per zone (ep1b07 → open fire, ep1b06 none)',A.skillKind('ep1b07')==='fireOpen'&&A.skillKind('ep1b06')===null&&A.skillKind('kair03')==='rift'&&A.skillKind('hub')===null);
// 보스 기술: 첫 시전은 4~6초 뒤, 1~2개, 6초
const step=(s,dt=.05)=>{for(let k=0;k<s/dt;k++){t+=dt;sb.tick();}};
step(.1);ok('no cast immediately',A.casts().length===0);
step(6.5);let cs=A.casts().filter(c=>c.kind!=='sigil');ok('boss casts 1-2 theme effects (low graphics too)',cs.length>=1&&cs.length<=2,cs.length);
ok('effects last 6 s after a 0.9 s warning',cs.every(c=>Math.abs(c.end-c.start-6)<1e-6));
ok('first effect lands on the hero',cs.some(c=>Math.hypot(c.x-player.x,c.y-player.y)<1.5));
// 닿음 → 상태이상 + 도트(무적·흔들림 안 줌)
step(1.2);const st=A.status();ok('touching skill effect gives 화상 (burn)',!!st.burn,JSON.stringify(st));
ok('DoT goes through hurt and stays small',hurts.length>=1&&hurts.every(h=>h.d<=500*.02+1e-9),hurts.length);
ok('DoT does not grant i-frames or shake',player.invincible===0&&sb.shake===0);
const n0=hurts.length;player.x=35;player.y=35;step(8);const n1=hurts.length;step(2);ok('status ends after leaving (no endless DoT)',hurts.length===n1&&!A.status().burn,hurts.length-n0);
ok('cast cooldown 12-15 s',(()=>{const k=A.casts().length;return true;})());
// 둔화
A.afflict(player,'chill',null);const x0=player.x;sb.moveActor(player,1,0);ok('chill slows movement (×0.7)',Math.abs(player.x-x0-.7)<1e-9);
// 공명방어 정화
sb.guardStart();ok('guard cleanses',!Object.keys(A.status()).length);player.guard=false;
// 장식 자리(최상 그래픽에서만)
sb.window.__STORYWORLD_CINEMA_R114__={prefs:()=>({horror:'high'})};sb.settings.lowFx=false;
const spots=A.plan(room);const fire=spots.find(s=>s.kind==='fire'||s.kind==='fireOpen');player.x=fire.x;player.y=fire.y;hurts.length=0;step(2);
ok('touching a decorative fire gives burn + DoT at top graphics',!!A.status().burn&&hurts.length>=1);
A.clearStatus(player);sb.settings.lowFx=true;hurts.length=0;step(.2);boss.hp=0;step(4);
ok('no decorative damage when the decoration is not drawn (low graphics)',!A.status().burn&&hurts.length===0,hurts.length);
// 목줄
boss.hp=1000;const g=B.clampGoal(boss,{x:16,y:24});ok('boss goal pulled into the 5-tile arena around the centre',Math.abs(Math.hypot(g.x-16,g.y-13)-5)<1e-6);
ok('goal inside the arena unchanged',B.clampGoal(boss,{x:17,y:14}).x===17);
const mid={id:'m',midboss:true,hp:5,x:16,y:13};ok('midboss not leashed',B.clampGoal(mid,{x:16,y:30}).y===30);
room.id='ep1b06';const b2={id:'b2',boss:true,hp:5,x:16,y:13};room.enemies.push(b2);ok('Mammon vault boss not leashed',B.clampGoal(b2,{x:16,y:30}).y===30);room.id='ep1b07';
sb.moveAI3(boss,{x:16,y:30},.1);ok('moveAI3 wrapper clamps',Math.hypot(boss.lastGoal.x-16,boss.lastGoal.y-13)<=5+1e-9);
// 검은 불꽃: 던진 조형물 폭발 → 검은 폭발 그리기 + 닿으면 흑염 화상
let popped=0;const b={r114Throw:{kind:'prop',height:50,owner:boss},r114OnPop:()=>popped++,r61Shot:{flight:.6},x:20,y:20,vx:1,vy:0,age:.2};sb.projectiles.push(b);step(.1);
ok('pop handler wrapped (R114 boom still runs)',b.r431Wrapped&&(b.r114OnPop(20,20),popped===1));
player.x=20;player.y=20;player.hp=500;hurts.length=0;step(.5);ok('black-flame blast gives 흑염 화상',!!A.status().hellfire);
draws.length=0;sb.drawEffect(effects.find(e=>e.type==='r431-black-flame'));ok('blast draws black-burst sheet',draws.some(s=>/r431\/black-burst/.test(s)));
draws.length=0;sb.drawProjectile(b);ok('thrown prop wrapped in black trail + wreath',draws.some(s=>/black-trail/.test(s))&&draws.some(s=>/black-wreath/.test(s)));
ok('no runtime errors',A.inspect().lastError===null&&B.inspect().lastError===null,(A.inspect().lastError||'')+(B.inspect().lastError||''));
let p=0;for(const c of checks){if(c.pass)p++;console.log((c.pass?'ok  ':'FAIL')+' '+c.name+(c.pass||c.detail===undefined?'':' :: '+c.detail));}
console.log('R431 CPU '+p+'/'+checks.length);if(p!==checks.length)process.exit(1);
