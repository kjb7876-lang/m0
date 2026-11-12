// R586 CPU check: 슬레이어 광전사 연계 — 피의 낙인(최대 5, 5개면 +12%) · W 뒤 처형 일격(마무리면 W 대기 1초) · E 뒤 피사슬 끌기.
//  새 키 없음, 다른 영웅 그대로, 사몽 발현 중 거리·대기는 R571 공용 API. 가짜 전역으로 돌린다 — GPU·실기기·자연 플레이 아님.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),FILE='slayer-berserk-r586.js';
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:p?undefined:d});
// ---- 연결 ----
const src=fs.existsSync(path.join(R,'client-source',FILE))?C(FILE):'';
ok('overlay exists and runtime copy matches client-source',!!src&&fs.existsSync(path.join(RT,FILE))&&fs.readFileSync(path.join(RT,FILE),'utf8')===src);
{const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
 ok('runtime-manifest hash matches',fs.existsSync(path.join(RT,FILE))&&M.get(FILE)===crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,FILE))).digest('hex'));
 ok('listed in runtime-inputs textPaths',JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')).textPaths.includes(FILE));}
{const html=fs.readFileSync(path.join(RT,'index.html'),'utf8'),at=n=>html.indexOf('"./'+n+'"'),me=at(FILE);
 const INNER=['slayer-blood-r425.js','skills-r209.js','fx-blood-r190.js','combat-flow-r425.js','combat-r160.js','samong-surge-r571.js','slayer-sheets-r585.js'];
 ok('script tag once, right after slayer-sheets-r585 and before combat-r118 (R601 enemy attack tempo may sit between; outer hitEnemy/fx/tick/drawEnemy wrapper)',html.split('"./'+FILE+'"').length===2&&INNER.every(n=>at(n)>0&&at(n)<me)&&/<script src="\.\/slayer-sheets-r585\.js"><\/script><script src="\.\/slayer-berserk-r586\.js"><\/script>(?:<script src="\.\/enemy-attack-tempo-r601\.js"><\/script>)?(?:<script src="\.\/hit-feel-r750\.js"><\/script>)?(?:<script src="\.\/hero-motion-r895\.js"><\/script>)?\s*<script src="\.\/combat-r118\.js">/.test(html),INNER.map(n=>[n,at(n)<me]));}
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+FILE+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r586/r586-cpu-check.cjs'));
ok('no new keys: no keydown listeners or key bindings',!/addEventListener\(\s*['"]key|keydown|bindings/.test(src));
ok('no blur/drop-shadow filters (Three.js recorder legacy fallback)',!/drop-shadow|blur\(/.test(src));
ok('no cross shape in the temporary drawings (execution blade only, never inverted cross)',!/cross/i.test(src.replace(/\/\/.*$/gm,'')));
ok('localStorage writes only its own key',!/localStorage\.setItem\((?!KEY)/.test(src));
// ---- 가짜 실행 환경 ----
class Rec{constructor(){this.commands=[];this.owner={id:'scene'};this.globalAlpha=1;this.st=[];}
 save(){this.st.push(this.globalAlpha);}restore(){this.globalAlpha=this.st.pop()??1;}scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}}
 beginPath(){this.path=[];}moveTo(x,y){this.path.push(['M',x,y]);}lineTo(x,y){this.path.push(['L',x,y]);}closePath(){}quadraticCurveTo(a,b,x,y){this.path.push(['Q',x,y]);}
 arc(x,y,r){this.path.push(['A',x,y,r]);}ellipse(x,y,rx,ry){this.path.push(['E',x,y,rx,ry]);}
 fill(){this.commands.push({kind:'fill',owner:{...this.owner},path:this.path,style:this.fillStyle});}stroke(){this.commands.push({kind:'stroke',owner:{...this.owner},path:this.path,style:this.strokeStyle});}}
function makeEnv(o={}){
 const mk=(id,x,y,hp,extra={})=>({id,x,y,hp,maxHp:hp,spawnState:'active',radius:.3,cd:0,...extra});
 const env={console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,Error,isFinite,
  localStorage:{_s:{...(o.ls||{})},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},
  time:10,ctx:new Rec(),effects:[],settings:{lowFx:!!o.lowFx},player:{x:0,y:0,hero:o.hero||'slayer',hp:100,samong:0,storyWER:{ready:{'slayer:w':9,'slayer:e':9},buffs:{}}},
  room:{enemies:[]}};
 env.window=env;env.TILE=34;env.zoom=1;env.actorHeight=()=>66;env.project=(x,y)=>({x:400+x*32,y:300+y*16});
 env.attackPower=()=>100;env.liveEnemies=()=>env.room.enemies.filter(e=>e.hp>0);
 env.hits=[];env.hitEnemy=(e,v,s)=>{if(!e||e.hp<=0||!(v>0))return false;env.hits.push([e.id,+v.toFixed(3),s?.kind||null]);e.hp-=Math.min(e.hp,v);return true;};
 env.moved=[];env.moveActor=(a,dx,dy)=>{env.moved.push([a.id,+dx.toFixed(3),+dy.toFixed(3)]);a.x+=dx;a.y+=dy;};
 env.fxLog=[];env.fx=(t,x,y,op)=>{env.fxLog.push([t,op?.sourceSlot,op?.stage]);};
 env.tick=dt=>{env.time+=dt;for(const f of env.effects)f.age=(f.age||0)+dt;env.effects=env.effects.filter(f=>f.age<f.life);};
 env.drawn=[];env.drawEffect=f=>{env.drawn.push(f?.type);};env.drawEnemy=e=>{env.ctx.commands.push({kind:'enemy',id:e.id});};
 env.sheetLog=[];if(o.sheets)env.__STORYWORLD_SLAYER_SHEETS_R585__={has:n=>o.sheets===true||o.sheets.includes(n),draw:(n,age,x,y,w,h,op)=>{env.sheetLog.push({n,age:+(+age).toFixed(3),x,y,w,h,op:op||{}});return true;}};
 if(o.surge)env.__STORYWORLD_SAMONG_SURGE_R571__={active:()=>true,range:r=>r*1.77,cd:s=>s*.23,chance:p=>p};
 env.mk=mk;vm.createContext(env);vm.runInContext(src,env,{filename:FILE});env.S=env.__STORYWORLD_SLAYER_BERSERK_R586__;
 env.step=(s,dt=1/60)=>{for(let t=0;t<s-1e-9;t+=dt)env.tick(dt);};
 // 엔진 시전 흉내: 마감을 늘리고 skillAnim 을 켠다(E 는 대시로 영웅이 움직인 뒤). 틱 사이(키 입력)에 일어난다.
 env.cast=(slot,move)=>{if(move){env.player.x+=move[0];env.player.y+=move[1];}env.player.storyWER.ready[env.player.hero+':'+slot]=env.time+(slot==='w'?6:4.2);env.player.skillAnim=.6;};
 return env;}
const near=(a,b,e=1e-3)=>Math.abs(a-b)<=e;
// ---- 1) 낙인 ----
{const env=makeEnv(),S=env.S,a=env.mk('a',1,0,1000);env.room.enemies.push(a);
 ok('loads, revision R586, exposes inspect/set/marks',S&&/^R586-/.test(S.revision)&&typeof S.inspect==='function'&&typeof S.marks==='function');
 env.hitEnemy(a,10);env.hitEnemy(a,10);ok('marks: one stack per hit, but only one per 0.2 s on the same enemy',S.marks(a)===1,S.marks(a));
 for(let i=0;i<8;i++){env.step(.21);env.hitEnemy(a,10);}ok('marks: capped at 5',S.marks(a)===5,S.marks(a));
 env.hits.length=0;env.step(.21);env.hitEnemy(a,10);ok('5 marks: slayer hits deal ×1.12 to that enemy',near(env.hits[0][1],11.2),env.hits);
 env.step(6.2);ok('marks fade after 6 s without hits',S.marks(a)===0,S.marks(a));
 const b=env.mk('b',2,0,1000);env.room.enemies.push(b);env.hits.length=0;env.hitEnemy(b,10,{sourceHero:'hunter'});env.hitEnemy(b,10,{coopIdR62:'p2'});
 ok('hits from other heroes / co-op allies add no marks and get no bonus',S.marks(b)===0&&env.hits.every(h=>h[1]===10),{m:S.marks(b),h:env.hits});}
{const env=makeEnv({hero:'hwando'}),a=env.mk('a',1,0,1000);env.room.enemies.push(a);for(let i=0;i<6;i++){env.step(.21);env.hitEnemy(a,10);}env.cast('w');env.step(.5);
 ok('other heroes unchanged: no marks, no execution, no pull',env.S.marks(a)===0&&env.hits.every(h=>h[1]===10)&&!env.hits.some(h=>h[2]==='r586-execute')&&env.moved.length===0);}
// ---- 2) 처형 일격 ----
{const env=makeEnv(),S=env.S,a=env.mk('a',2,0,5000),far=env.mk('far',5,0,10);env.room.enemies.push(a,far);
 for(let i=0;i<5;i++){env.step(.21);env.hitEnemy(a,1);}env.hits.length=0;
 env.step(1/60);env.cast('w');const wSet=env.player.storyWER.ready['slayer:w'];env.step(.2);
 ok('W execution waits 0.25 s after the W cue',env.hits.length===0,env.hits);
 env.step(.1);const ex=env.hits.filter(h=>h[2]==='r586-execute');
 ok('W → execution on the 5-mark enemy in 3.4 tiles: attack × (2 + 0.3 × 5) = 350, once per cast, marks consumed',ex.length===1&&ex[0][0]==='a'&&near(ex[0][1],350)&&S.marks(a)===0,env.hits);
 ok('far enemy (5 tiles, under 30%) is out of the 3.4-tile reach',!env.hits.some(h=>h[0]==='far'));
 ok('W cooldown untouched when the execution does not kill',env.player.storyWER.ready['slayer:w']===wSet);
 ok('execution drawing spawned at the target',env.effects.some(f=>f.type==='r586-exec'&&f.x===2));}
{const env=makeEnv(),low=env.mk('low',1,1,1000);low.hp=120;env.room.enemies.push(low);env.step(1/60);env.cast('w');env.step(.3);
 ok('W → low-health (12%) non-boss enemy is finished outright',low.hp===0&&env.hits.some(h=>h[0]==='low'&&h[2]==='r586-execute'),env.hits);
 ok('kill resets W cooldown to 1 s from now',near(env.player.storyWER.ready['slayer:w'],env.time-(.3-.25)+1,.05),env.player.storyWER.ready);}
{const env=makeEnv(),boss=env.mk('boss',1,0,10000,{boss:true});boss.hp=1000;env.room.enemies.push(boss);env.step(1/60);env.cast('w');env.step(.3);
 ok('bosses are never finished outright (10% boss takes the normal 200)',boss.hp===800&&env.player.storyWER.ready['slayer:w']>env.time+5,{hp:boss.hp});}
{const env=makeEnv(),a=env.mk('a',2,0,1000);env.room.enemies.push(a);env.step(1/60);env.cast('w');env.step(.3);
 ok('no execution without a marked or low-health target',env.hits.length===0&&!env.effects.some(f=>f.type==='r586-exec'));}
{const env=makeEnv(),a=env.mk('a',2,0,1000);a.hp=100;env.room.enemies.push(a);env.step(1/60);env.player.storyWER.ready['slayer:w']=env.time+5;env.step(.3);
 ok('no phantom execution when the W deadline jumps without a cast (save load / sync: skillAnim off)',env.hits.length===0,env.hits);}
{const env=makeEnv(),m=env.mk('m',1.5,0,9000),low=env.mk('low',2.5,0,1000);low.hp=100;env.room.enemies.push(m,low);for(let i=0;i<5;i++){env.step(.21);env.hitEnemy(m,1);}env.hits.length=0;env.step(1/60);env.cast('w');env.step(.3);
 ok('execution prefers the enemy it can finish (kill → W reset) over a 5-mark enemy',env.hits.some(h=>h[0]==='low'&&h[2]==='r586-execute')&&low.hp===0,env.hits);}
{const env=makeEnv();delete env.player.storyWER.ready['slayer:w'];const low=env.mk('low',1,0,1000);low.hp=50;env.room.enemies.push(low);env.step(1/60);env.cast('w');env.step(.3);
 ok('first W of the session (no earlier deadline stored) still chains the execution',low.hp===0,env.hits);}
for(const surge of [false,true]){const env=makeEnv({surge}),a=env.mk('a',4.5,0,1000);a.hp=200;env.room.enemies.push(a);env.step(1/60);env.cast('w');env.step(.3);
 ok('Samong surge (R571 range ×1.77): a 4.5-tile target is reached only during surge — '+(surge?'surge':'normal'),env.hits.some(h=>h[2]==='r586-execute')===surge,env.hits);}
{const env=makeEnv({surge:true}),low=env.mk('low',1,0,1000);low.hp=50;env.room.enemies.push(low);env.step(1/60);env.cast('w');env.step(.3);
 ok('Samong surge: kill reset uses R571 cd() (1 s × 0.23)',near(env.player.storyWER.ready['slayer:w'],env.time-.05+.23,.05),env.player.storyWER.ready);}
// ---- 3) 피사슬 끌기 ----
{const env=makeEnv(),front=env.mk('front',2,0,1000),side=env.mk('side',.2,2,1000),back=env.mk('back',-2,0,1000),boss=env.mk('boss',1.5,.3,9e4,{boss:true}),close=env.mk('close',.5,0,1000);
 env.room.enemies.push(front,side,back,boss,close);
 env.player.x=-3.8;env.tick(1/60);env.cast('e',[3.8,0]);env.step(.3);
  ok('E → enemy in the 120° front cone is pulled to 0.7 tiles in front (max 1.3)',near(front.x,.7)&&env.moved.some(m=>m[0]==='front'),{x:front.x,m:env.moved});
 ok('E pull: enemies behind / beside / bosses / already close stay put',back.x===-2&&side.y===2&&boss.x===1.5&&close.x===.5,{back:back.x,side:side.y,boss:boss.x,close:close.x});
 ok('E pull binds pulled enemies 0.35 s and draws the temporary chain',front.cd>=.35&&env.effects.some(f=>f.type==='r586-chain'));}
{const env=makeEnv(),f=env.mk('f',2,0,1000);env.room.enemies.push(f);env.player.x=-3;env.tick(1/60);env.cast('e');for(let i=0;i<10;i++){env.player.x+=.3;env.tick(1/60);}env.step(.3);
 ok('E dash that glides over several ticks (other layers) still pulls along the real travel direction',f.x<2&&env.moved.some(m=>m[0]==='f'&&m[1]<0),{x:f.x,m:env.moved});}
{const env=makeEnv(),f=env.mk('f',2,0,1000);env.room.enemies.push(f);env.tick(1/60);env.cast('e');env.step(.1);
 ok('E blocked (hero did not move) → no pull',f.x===2&&env.moved.length===0);}
{const env=makeEnv(),es=[0,1,2,3,4,5].map(i=>env.mk('m'+i,2+i*.05,(i-2.5)*.2,1000));env.room.enemies.push(...es);
 env.player.x=-3;env.tick(1/60);env.cast('e',[3,0]);env.step(.3);env.step(.5);
 ok('E pull: at most 4 enemies, once per cast',new Set(env.moved.map(m=>m[0])).size===4&&env.moved.length===4,env.moved);}
// ---- 4) 그리기 ----
{const env=makeEnv(),a=env.mk('a',1,0,1000);env.room.enemies.push(a);for(let i=0;i<3;i++){env.step(.21);env.hitEnemy(a,1);}
 env.ctx.commands.length=0;env.drawEnemy(a);const dots=env.ctx.commands.filter(c=>c.owner?.id==='r586:mark'&&c.kind==='fill');
 const q=env.project(1,0);ok('mark: 3 marks → 3 blood drops above the enemy head only (upper half, not over the body)',dots.length===6&&dots.every(c=>c.path[0][2]<q.y-66),dots.length);
 env.effects.push({type:'r586-exec',x:1,y:0,age:.3,life:.9});env.ctx.commands.length=0;env.drawEffect(env.effects[0]);
 const blade=env.ctx.commands.filter(c=>c.owner?.id==='r586:exec'&&c.kind==='fill')[0];
 ok('execution blade: vertical (top centred above the target, tip at the feet), narrow top / wide bottom',blade&&near(blade.path[0][1]+2,q.x,.01)&&blade.path[0][2]<q.y-100&&near(blade.path[3][2],q.y+6,.5),blade&&blade.path);
 ok('custom effects do not reach the engine drawEffect',!env.drawn.includes('r586-exec'));
 env.drawEffect({type:'burst'});ok('other effects still drawn by the engine',env.drawn.includes('burst'));}
// ---- 4b) R587: Dots 시트(SL12·SL13·SL14)가 있으면 코드 그림 대신 시트 ----
{const env=makeEnv({sheets:true}),a=env.mk('a',1,0,1000);env.room.enemies.push(a);const q=env.project(1,0);
 for(let i=0;i<3;i++){env.step(.21);env.hitEnemy(a,1);}env.ctx.commands.length=0;env.drawEnemy(a);
 ok('R587 mark: 1~4 marks stay as countable drops (no sheet)',env.sheetLog.length===0&&env.ctx.commands.filter(c=>c.owner?.id==='r586:mark'&&c.kind==='fill').length===6);
 for(let i=0;i<2;i++){env.step(.21);env.hitEnemy(a,1);}env.ctx.commands.length=0;env.drawEnemy(a);
 ok('R587 hold: 5 marks keep the code drops even with the SL14 sheet loaded (headless 11-10: sheet drops 4 px and veiled near the hero, read worse)',!env.sheetLog.some(x=>x.n==='slayer-mark')&&env.ctx.commands.filter(c=>c.owner?.id==='r586:mark'&&c.kind==='fill').length>=10);
 env.sheetLog.length=0;const f={type:'r586-exec',x:1,y:0,age:.3,life:.9};env.ctx.commands.length=0;env.drawEffect(f);
 ok('R587 hold: execution keeps the code blade even with the SL12 sheet loaded (headless 11-10: thin spike veiled near the hero)',!env.sheetLog.some(x=>x.n==='slayer-exec')&&env.ctx.commands.some(c=>c.owner?.id==='r586:exec'));}
{const env=makeEnv({sheets:true}),front=env.mk('front',2,0,1000);env.room.enemies.push(front);env.player.x=-2;env.tick(1/60);env.cast('e',[2,0]);env.step(.3);
 const ch=env.effects.find(f=>f.type==='r586-chain');env.sheetLog.length=0;env.ctx.commands.length=0;env.drawEffect(ch);const c=env.sheetLog.filter(x=>x.n==='slayer-chain'),p=env.project(ch.x,ch.y),e0=env.project(ch.ends[0].x,ch.ends[0].y);
 ok('R587 chain: one SL13 chain sheet per pulled enemy, left end at the hero, stretched to the original distance (cell = dist × 256/200 ±10%), no code strokes',c.length===1&&c[0].x===p.x&&near(c[0].w,Math.hypot(e0.x-p.x,e0.y-p.y)*256/200,Math.hypot(e0.x-p.x,e0.y-p.y)*.13)&&env.ctx.commands.filter(x=>x.owner?.id==='r586:chain').length===0,{c,ends:ch.ends});
 ok('R587 chain: starts on the bite frame (6 at 30 fps) and lives until the sheet ends',c[0]&&near(c[0].age,(ch.age||0)+6/30,.005)&&near(ch.life,18/30,.01));}
{const env=makeEnv({sheets:[]}),front=env.mk('front',2,0,1000);env.room.enemies.push(front);env.player.x=-2;env.tick(1/60);env.cast('e',[2,0]);env.step(.3);
 const ch=env.effects.find(f=>f.type==='r586-chain');env.ctx.commands.length=0;env.drawEffect(ch);
 ok('R587 fallback: chain sheet not loaded yet → temporary code chain',env.sheetLog.length===0&&env.ctx.commands.some(c=>c.owner?.id==='r586:chain'));}
{const env=makeEnv({lowFx:true});for(let i=0;i<20;i++)env.effects.push({type:'r586-exec',age:0,life:9});const a=env.mk('a',1,0,100);a.hp=5;env.room.enemies.push(a);env.step(1/60);env.cast('w');env.step(.3);
 ok('effect cap: no new drawings past the low-spec cap (gameplay still runs)',env.effects.filter(f=>f.type==='r586-exec').length===20&&a.hp===0);}
// ---- 5) 끄기 ----
{const env=makeEnv({ls:{'storyworld.r586.slayer-berserk':'{"on":false}'}}),a=env.mk('a',1,0,1000);a.hp=100;env.room.enemies.push(a);for(let i=0;i<6;i++){env.step(.21);env.hitEnemy(a,1);}
 env.step(1/60);env.cast('w');env.step(.3);ok('off switch: no marks, no execution',env.S.marks(a)===0&&!env.hits.some(h=>h[2]==='r586-execute'));}
{const env=makeEnv();env.S.set(false);ok('set(false) stores only its own key',env.localStorage._s['storyworld.r586.slayer-berserk']==='{"on":false}'&&Object.keys(env.localStorage._s).length===1);}
const fails=checks.filter(c=>!c.pass);for(const f of fails)console.log('FAIL',f.name,JSON.stringify(f.detail??'').slice(0,400));
console.log(JSON.stringify({ok:!fails.length,checks:checks.length,pass:checks.length-fails.length,method:'CPU fake globals; headless screenshots separately; no GPU or device'}));
process.exitCode=fails.length?1:0;
