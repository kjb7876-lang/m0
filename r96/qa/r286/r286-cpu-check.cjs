// R286 CPU 검사: ① 모바일 기본 전능 +77%(PC 무변화·R274 와 합친 상한·끄기) ② 몹 그림 묶음 전수 분류 + 공격만/이동만 몹 연출(돌진·블링크·간접 사격·이동 칸 내딛기).
// 'node r96/qa/r286/r286-cpu-check.cjs --list' 로 몹 그림 묶음 전수표를 찍는다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),J=f=>JSON.parse(RT(f));
const bonusSrc=C('mobile-bonus-r286.js'),motionSrc=C('mob-motion-r286.js'),r274Src=C('manual-bonus-r274.js');
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};const near=(a,b,m)=>ok(Math.abs(a-b)<1e-6,m+' ('+a+' vs '+b+')');
// ---------------- ① 모바일 보너스 ----------------
function world(coarse,{r274=false,store={}}={}){const ctx={window:{},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},matchMedia:q=>({matches:coarse&&/coarse/.test(q)}),Math,String,Number,Array,Object,JSON};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(`var auto=true,guide=true,time=0,started=true,route=[],room={engaged:true,enemies:[{id:'m',x:2,y:0,hp:100}]};
 var player={x:0,y:0,hp:500,ego:0,resonance:0,attackCD:1,blinkCD:1,specialCD:1,invReason:'',guard:false,parry:0,invincible:0};var dealt=[],taken=[],moved=[],healNext=0;
 function maxHP(){return 777}
 function hitEnemy(e,v){dealt.push(v);return true}
 function hurt(d){if(player.invincible>0)return'invulnerable';taken.push(d);return'hit'}
 function gainResonance(v){player.resonance+=v}function moveActor(a,dx,dy){moved.push(dx)}
 function tick(dt){time+=dt;for(const k of ['attackCD','blinkCD','specialCD'])player[k]=Math.max(0,player[k]-dt);if(healNext){player.hp+=healNext;healNext=0}moveActor(player,1,0)}`,ctx);
 if(r274)vm.runInContext(r274Src,ctx);vm.runInContext(bonusSrc,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
{let c=world(false);const B=()=>c.__STORYWORLD_MOBILE_BONUS_R286__;
 ok(!B().enabled(),'PC (fine pointer): off');run(c,'dealt=[];hitEnemy(room.enemies[0],100);taken=[];hurt(100);moved=[];player.attackCD=1;tick(.1)');
 ok(run(c,'dealt[0]')===100&&run(c,'taken[0]')===100&&run(c,'moved[0]')===1&&Math.abs(run(c,'player.attackCD')-.9)<1e-9,'PC: damage, hurt, move, cooldown unchanged');
 c=world(true);ok(B().enabled(),'mobile (coarse pointer): on by default');
 run(c,'dealt=[];hitEnemy(room.enemies[0],100)');near(run(c,'dealt[0]'),177,'mobile damage x1.77');
 run(c,'taken=[];hurt(100)');near(run(c,'taken[0]'),100/1.77,'mobile incoming damage /1.77');
 run(c,'moved=[];player.attackCD=1;tick(.1)');near(run(c,'moved[0]'),1.35,'mobile move x1.77 capped at x1.35');near(run(c,'player.attackCD'),1-.1*1.77,'mobile cooldown recovery x1.77');
 run(c,'player.resonance=0;gainResonance(10)');near(run(c,'player.resonance'),17.7,'mobile resonance +77%');
 run(c,'player.hp=500;healNext=100;tick(.01)');near(run(c,'player.hp'),677,'mobile healing received +77%');
 run(c,'player.hp=700;healNext=60;tick(.01)');near(run(c,'player.hp'),777,'healing bonus clamps to max HP 777');
 run(c,'player.hp=0;tick(.01);player.hp=0;healNext=388;tick(.01)');near(run(c,'player.hp'),388,'revive (0 -> hp) not boosted');
 ok(!/R71_MAX_HP|\bmaxHP\s*=(?!=)|player\.maxHp\s*=(?!=)/.test(bonusSrc),'777 max HP rule untouched');
 B().set(false);ok(!B().enabled()&&run(c,"localStorage.getItem('storyworld.r286.mobile')")==='0','off switch persisted');run(c,'dealt=[];hitEnemy(room.enemies[0],100)');ok(run(c,'dealt[0]')===100,'off: no bonus');
 c=world(true,{store:{'storyworld.r286.mobile':'0'}});ok(!B().enabled(),'stored 0 keeps it off on mobile');
 c=world(false,{store:{'storyworld.r286.mobile':'force'}});ok(B().enabled(),'force turns it on for PC tests');
 // R274 와 함께: 피해는 곱, 쿨다운·이동·감소는 합친 상한
 c=world(true,{r274:true});run(c,'auto=false;guide=false;dealt=[];hitEnemy(room.enemies[0],100)');near(run(c,'dealt[0]'),254*1.77,'stacks multiplicatively with R274 damage');
 run(c,'for(let i=0;i<8;i++){player.ego=0;tick(.01);player.ego=3;tick(.01)}');ok(c.__STORYWORLD_MANUAL_R274__.state().ego===7,'R274 7 EGO stacks');
 run(c,'player.attackCD=1;moved=[];tick(.1)');near(run(c,'player.attackCD'),1-.1*2.5,'combined cooldown cap 2.5');near(run(c,'moved[0]'),1.35,'combined move cap 1.35');
 run(c,'player.invincible=0;taken=[];hurt(100)');near(run(c,'taken[0]'),50,'combined damage reduction floor 50%');
 const M=c.__STORYWORLD_MOBILE_BONUS_R286__;near(M.cdMult(1),1.77,'cdMult alone');near(M.cdMult(2),1.5,'cdMult with R274 x2 -> total 2.5');near(M.hurtMult(1.14),Math.max(.5/(1/1.14),1/1.77),'hurtMult with R274 dodge stacks');}
// ---------------- ② 몹 그림 묶음 전수 분류 ----------------
const MS=(()=>{const ctx={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(motionSrc,ctx);return ctx.__STORYWORLD_MOB_MOTION_R286__;})();
const r92=J('assets/r92/mobs/index.json'),r109=J('assets/r109/mobs/index.json'),r116=J('assets/r116/mobs/index.json'),r198=J('assets/r198/mobs/index.json');
// mobs-r109.js build() 와 같은 순서로 nativeId → {idle,move,attack,hit}
const table=new Map(),artRows=[];const row=id=>table.get(id)||{idle:null,move:null,attack:null,hit:null,src:[]};
for(const [gid,g] of Object.entries(r92.groups||{}))for(const id of g.ids||[])table.set(id,{...row(id),move:g.tracks.move?gid:null,attack:g.tracks.attack?gid:null,src:['R92']});
for(const t of r109.tracks||[]){const tr=t.track||'move';if(tr!=='move'&&tr!=='idle')continue;if(t.art){if(tr==='move')artRows.push(String(t.art).replace(/^\.\//,''));continue;}for(const id of t.ids||[]){const r=row(id);table.set(id,{...r,[tr]:t.group,src:[...new Set([...r.src,'R109'])]});}}
for(const t of r116.tracks||[]){if(t.track!=='hit'&&t.track!=='idle')continue;for(const id of t.ids||[]){const r=row(id);table.set(id,{...r,[t.track]:t.group,src:[...new Set([...r.src,'R116'])]});}}
for(const t of r198.tracks||[]){if(!['move','attack','idle'].includes(t.track))continue;for(const id of t.ids||[]){const r=row(id);if(r[t.track])continue;table.set(id,{...r,[t.track]:t.group,src:[...new Set([...r.src,'R198'])]});}}
ok(JSON.stringify([...MS.constants.ART_MOVE].sort())===JSON.stringify(artRows.sort()),'ART_MOVE matches R109 index art move rows');
const audit=[];for(const [id,r] of [...table].sort((a,b)=>a[0].localeCompare(b[0])))audit.push({profile:id,source:r.src.join('+'),idle:true,idleStrip:!!r.idle,move:!!r.move,attack:!!r.attack,hit:!!r.hit,death:false,kind:MS.classifyTrack(r)});
for(const p of artRows)audit.push({profile:'drive:'+p,source:'R110-art',idle:true,idleStrip:false,move:true,attack:false,hit:false,death:false,kind:'move-only'});
for(const f of ['assets/r208/mobs/index.json','assets/r223/mobs/index.json'])for(const m of J(f).mobs||[])audit.push({profile:'strip:'+m.id,source:f.split('/')[1].toUpperCase(),idle:true,idleStrip:false,move:!!m.move?.length,attack:!!m.attack?.length,hit:false,death:false,kind:MS.classifyTrack({move:m.move?.length,attack:m.attack?.length})});
{const s=C('mob-unique-r248-data.js'),D=JSON.parse(s.slice(s.indexOf('Object.freeze(')+14,s.lastIndexOf(')'))),meta=J('assets/r248/mobs/index.json');
 ok(meta.walk[1]>0&&meta.attack[1]>0,'R248 sheets have walk and attack frames');for(const id of Object.keys(D.sheets))audit.push({profile:'r248:'+id,source:'R248',idle:true,idleStrip:false,move:meta.walk[1]>0,attack:meta.attack[1]>0,hit:false,death:false,kind:'full'});}
const count={};for(const a of audit)count[a.kind]=(count[a.kind]||0)+1;
ok(audit.every(a=>a.kind===MS.classifyTrack({move:a.move,attack:a.attack,idle:a.idleStrip})),'audit kinds follow classifyTrack');
ok(count['attack-only']>0&&count['move-only']>0,'both attack-only and move-only profiles exist');
ok(audit.find(a=>a.profile==='dist02-g1').kind==='attack-only'&&audit.find(a=>a.profile==='b05-p1').kind==='move-only'&&audit.find(a=>a.profile==='dist01-s1').kind==='full'&&audit.find(a=>a.profile==='h102-t1').kind==='idle-only','spot checks (M004 attack-only, M027 move-only, M001 full, M119 idle-only)');
ok(audit.find(a=>a.profile==='c101-e2').kind==='full','R198 attack fills M129 move-only -> full');
ok(audit.every(a=>a.death===false),'no mob strip has death frames (R188 fades the last frame)');
if(process.argv.includes('--list')){for(const a of audit)console.log([a.profile,a.source,a.kind,'idle'+(a.idleStrip?'(strip)':''),a.move?'move':'-',a.attack?'attack':'-',a.hit?'hit':'-','-'].join('\t'));}
// ---------------- ② 연출(가짜 엔진) ----------------
function arena({kind='attack-only',ai='melee',wall=null}={}){const ctx={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},};ctx.window=ctx;vm.createContext(ctx);
 ctx.__KIND=kind;vm.runInContext(`var time=10,started=true,loading=false,modal=null,storyScene=null,zone='dist02',uid=1;var shots=[],drawn=[];
 var player={x:0,y:0,hp:777};var room={enemies:[{id:'e1',nativeId:'x-1',name:'잡몹',x:6,y:0,hp:50,damage:12,ai:'${ai}',spawnState:'active',moving:true,speed:2,combatProfile:{aggro:8,attackShape:{range:1.2,windup:.4,active:.15,recovery:.35}}}]};
 var WALL=${JSON.stringify(wall)};function blocked(x,y,r){return !!WALL&&x>WALL[0]&&x<WALL[1]&&Math.abs(y)<5}function clearLine(){return true}
 function facing(dx,dy){return dx<0?'left':'right'}function project(x,y){return{x:(x-y)*32,y:(x+y)*16}}function actorHeight(){return 60}
 function enemyShot(e,a,v,d,o){const s={owner:e.id,a,v,d,o};shots.push(s);return s}
 function drawEnemy(e){drawn.push({x:e.x,y:e.y,attack:e.attack,moving:e.moving})}
 function tick(dt){time+=dt;for(const e of room.enemies)if(!e.attack&&e.moving){const d=Math.hypot(player.x-e.x,player.y-e.y);if(d>1){e.x-=(e.x-player.x)/d*e.speed*dt;e.y-=(e.y-player.y)/d*e.speed*dt;}}}
 window.__STORYWORLD_MOBS_R109__={trackFor:e=>__KIND==='attack-only'?{attack:{path:'a'},move:null}:__KIND==='move-only'?{move:{path:'m'},attack:null}:__KIND==='static'?null:__KIND==='idle-only'?{idle:{path:'i'}}:{move:{},attack:{}},inspect:()=>({state:'ready'})};`,ctx);
 vm.runInContext(motionSrc,ctx);return ctx;}
{const c=arena();const M=c.__STORYWORLD_MOB_MOTION_R286__,E=()=>run(c,'room.enemies[0]');
 ok(M.kindOf(E())==='attack-only','fake R109 track -> attack-only');
 run(c,'room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:0,side:1}');run(c,'tick(.016)');ok(E().r286.mode==='charge','attack-only chasing mob starts charging');
 const hx=E().x;run(c,'for(let i=0;i<10;i++)tick(.016)');ok(Math.abs(E().x-hx)<1e-9&&E().r286.mode==='charge','held in place while gathering');
 run(c,'drawn=[];drawEnemy(room.enemies[0])');const d0=run(c,'drawn[0]');ok(d0.attack&&d0.attack.r286Fake&&d0.attack.elapsed<.4,'charge drawn with attack frames (windup part)');ok(E().attack==null,'fake attack removed after draw');
 run(c,'for(let i=0;i<20;i++)tick(.016)');ok(run(c,'shots.length')===1,'indirect shot fired once at end of charge');near(run(c,'shots[0].d'),12*.66,'indirect shot damage = e.damage x0.66');ok(E().r286.mode==='dash','then dashes');
 run(c,'drawn=[];drawEnemy(room.enemies[0])');ok(run(c,'drawn[0].attack.elapsed')>=.4,'dash drawn with attack frames (strike part)');
 run(c,'for(let i=0;i<30;i++)tick(.016)');ok(E().r286.mode===null,'dash ends');const dist=Math.hypot(E().x,E().y);ok(dist>=.9-1e-6&&dist<6-2.5,'dash closes in and stops before the hero ('+dist.toFixed(2)+')');
 ok(M.inspect().stats.dashes===1&&M.inspect().stats.charges===1,'counted');
 run(c,'room.enemies[0].attack={elapsed:0};room.enemies[0].r286.mode="charge";room.enemies[0].r286.t0=time;tick(.016)');ok(E().r286.mode===null,'engine attack cancels charge');}
{const c=arena({wall:[3.6,4.4]});const E=()=>run(c,'room.enemies[0]');run(c,'room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:99,side:1}');
 run(c,'for(let i=0;i<40;i++)tick(.016)');ok(c.__STORYWORLD_MOB_MOTION_R286__.inspect().stats.blinks===1&&E().x<3.6,'blocked dash path -> blink past the wall');ok(run(c,'shots.length')===0,'no shot while shot cooldown');}
{const c=arena({kind:'move-only'});const M=c.__STORYWORLD_MOB_MOTION_R286__,E=()=>run(c,'room.enemies[0]');
 run(c,'room.enemies[0].x=4.5;room.enemies[0].moving=false;room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:0,side:1}');run(c,'tick(.016)');ok(E().r286.mode==='aim','move-only mob in 3~6.5 tiles aims');
 run(c,'drawn=[];drawEnemy(room.enemies[0])');ok(run(c,'drawn[0].moving')===true&&!run(c,'drawn[0].attack'),'aim drawn with move frames');
 run(c,'for(let i=0;i<40;i++)tick(.016)');ok(run(c,'shots.length')===1&&E().r286.mode===null,'move-only indirect shot');
 // 근접: 이동 칸 내딛기(그릴 때만)
 const A={elapsed:.4+.15,angle:Math.PI,id:3,shape154:{range:1.2,windup:.4,active:.15,recovery:.35}};E().attack=A;E().x=1.2;E().y=0;
 run(c,'drawn=[];drawEnemy(room.enemies[0])');const dd=run(c,'drawn[0]');ok(dd.moving===true&&dd.attack==null,'lunge drawn with move frames (attack hidden only while drawing)');
 near(dd.x,1.2-.42,'forward lunge reaches .42 toward the hero');ok(E().attack===A&&E().x===1.2,'attack object and position restored after draw');
 A.elapsed=.2;run(c,'drawn=[];drawEnemy(room.enemies[0])');ok(Math.abs(run(c,'drawn[0].y'))>.25,'side-step during windup');
 const L=M.lungeOffset;let mx=0;for(let t=0;t<=.9;t+=.01){const o=L(t,{windup:.4,active:.15,recovery:.35},0,1);mx=Math.max(mx,Math.hypot(o[0],o[1]));}ok(mx<=.43,'lunge offset bounded');ok(Math.hypot(...L(.9,{windup:.4,active:.15,recovery:.35},0,1))<1e-9,'lunge returns to place');
 ok(M.inspect().stats.lunges>=1,'lunge counted');}
// R776(사용자 11-12 07:11Z '모션이 없는 몹은 일단 너가 코드로 구현'): 그림 한 장·대기만 몹 — 걷는 동안 발걸음 들썩임, 공격 동안 젖힘→내딛기(그릴 때만, 공격 그림은 그대로)
for(const kind of ['static','idle-only']){const c=arena({kind});const M=c.__STORYWORLD_MOB_MOTION_R286__,E=()=>run(c,'room.enemies[0]');ok(M.kindOf(E())===kind,'R776 fake track -> '+kind);
 run(c,'room.enemies[0].x=3;room.enemies[0].y=0;room.enemies[0].moving=true;room.enemies[0].r286={mode:null,t0:0,nextDash:99,nextShot:99,side:1}');
 const ys=[];for(let i=0;i<12;i++){run(c,'time+=.035;drawn=[];drawEnemy(room.enemies[0])');const d=run(c,'drawn[0]');ys.push(d.x+d.y);}
 const span=Math.max(...ys)-Math.min(...ys);ok(span>.03&&span<.2,'R776 '+kind+' walk: footstep bob on screen ('+span.toFixed(3)+')');ok(E().x===3&&E().y===0,'R776 position restored after walk draw');
 const A={elapsed:.4+.15,angle:Math.PI,id:4,shape154:{range:1.2,windup:.4,active:.15,recovery:.35}};E().attack=A;E().moving=false;E().x=1.2;E().y=0;
 run(c,'drawn=[];drawEnemy(room.enemies[0])');const dd=run(c,'drawn[0]');ok(dd.attack===A,'R776 '+kind+' attack keeps its own attack drawing');near(dd.x,1.2-.42,'R776 '+kind+' attack lunges .42 toward the hero');
 A.elapsed=.15;run(c,'drawn=[];drawEnemy(room.enemies[0])');ok(run(c,'drawn[0].x')>1.2,'R776 '+kind+' windup leans back');ok(E().attack===A&&E().x===1.2,'R776 restored after attack draw');
 ok(M.inspect().stats.staticMoves>=1&&M.inspect().stats.staticLunges>=1,'R776 counted');}
{const c=arena({kind:'full'});const E=()=>run(c,'room.enemies[0]');run(c,'room.enemies[0].moving=true;room.enemies[0].r286={mode:null,t0:0,nextDash:99,nextShot:99,side:1}');const x0=E().x;
 run(c,'time+=.05;drawn=[];drawEnemy(room.enemies[0])');ok(run(c,'drawn[0].x')===x0&&run(c,'drawn[0].y')===0,'R776 full-motion mob untouched');}
{const c=arena({kind:'move-only',ai:'ranged'});run(c,'room.enemies[0].x=4.5;room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:0,side:1};tick(.016)');ok(run(c,'room.enemies[0].r286.mode')===null,'native ranged move-only mob keeps its own shots');}
{const c=arena({kind:'full'});run(c,'room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:0,side:1};for(let i=0;i<40;i++)tick(.016)');ok(run(c,'room.enemies[0].r286.mode')===null&&run(c,'shots.length')===0,'full-art mob untouched');}
{const c=arena();run(c,"room.enemies[0].boss=true;room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:0,side:1};tick(.016)");ok(run(c,'room.enemies[0].r286.mode')===null,'boss untouched');}
{const c=arena();run(c,"zone='ep1a08';room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:0,side:1};tick(.016)");ok(run(c,'room.enemies[0].r286.mode')===null,'hospital authored motion zone untouched');}
{const c=arena();c.__STORYWORLD_MOB_MOTION_R286__.set({on:false});run(c,'room.enemies[0].r286={mode:null,t0:0,nextDash:0,nextShot:0,side:1};tick(.016)');ok(run(c,'room.enemies[0].r286.mode')===null,'off switch');}
// ---------------- 빌드 연결 ----------------
{const idx=RT('index.html'),at=s=>idx.indexOf(s);
 ok(RT('mobile-bonus-r286.js')===bonusSrc&&RT('mob-motion-r286.js')===motionSrc,'runtime copies match');
 ok(idx.split('"./mobile-bonus-r286.js"').length===2&&idx.split('"./mob-motion-r286.js"').length===2,'each loaded once');
 ok(at('"./manual-bonus-r274.js"')<at('"./mobile-bonus-r286.js"')&&at('"./stranded-r280.js"')<at('"./mobile-bonus-r286.js"')&&at('"./mobile-bonus-r286.js"')<at('"./mob-motion-r286.js"')&&at('"./mob-motion-r286.js"')<at('"./combat-r118.js"'),'after R274/R280, before combat-r118');
 ok(at('"./mob-motion-r286.js"')>at('"./mobs-r109.js"')&&at('"./mob-motion-r286.js"')>at('"./mob-unique-r248.js"')&&at('"./mob-motion-r286.js"')>at('"./mob-fix-r275.js"')&&at('"./mob-motion-r286.js"')>at('"./mob-gaze-r268.js"'),'mob motion wraps drawEnemy outside R109/R248/R275');
 const V=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok(V.includes("'mobile-bonus-r286.js'")&&V.includes("'mob-motion-r286.js'"),'in public verify list');
 ok(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r286/r286-cpu-check.cjs'),'in CI');
 const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));ok(man.textPaths.includes('mobile-bonus-r286.js')&&man.textPaths.includes('mob-motion-r286.js'),'in runtime-inputs textPaths');}
console.log(JSON.stringify({ok:true,checks:n,profiles:audit.length,kinds:count}));
