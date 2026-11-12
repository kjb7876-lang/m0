// R952 헌터 확률 발동 특수 패시브 '사냥 분대' — CPU 검사(정적 + 가짜 엔진 행동).
//  node r96/qa/r952/r952-cpu-check.cjs
//  사용자 2026-11-12 13:30Z: "헌터영웅 확률발동 특수패시브 1. 슬레이어영웅소환 2. 슬레이어영웅소환+ 확률적으로 슬레이어분신소환
//   3. 1-2둘다발동+ 헌터분신소환해서 분대를 이루어 진법갖추고 적을 섬멸함 /(특수하게 1,2,3 중하나가 발동하는것임)확률은 1이높고 3이 낮고 지속은 7초"
//  소환된 영웅은 원래 영웅의 공격·스킬·그림을 그대로 쓴다(엔진 basicAttack·special·W·E·R·drawHero 를 그 몸으로 부름). 스킬 키는 늘리지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='hunter-squad-r952.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;

// ---- 정적 ----
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2,'index.html 스크립트 태그 한 번');
/* 처음에는 'R425 뒤'까지 요구했으나 틀린 전제였다: R425 는 긴 줄(story-reader-r122 로 시작) 안에 있고 맨 끝 자리는 r713·r176 검사가 고정한다. R720(has 를 이어 붙일 대상)·R911 뒤, 긴 줄 앞(다른 확률 패시브와 같은 자리)이 맞다. */
ok(html.indexOf('"./'+F+'"')>html.indexOf('"./hero-defense-r720.js"')&&html.indexOf('"./'+F+'"')>html.indexOf('"./projectile-size-r911.js"')&&/<script src="\.\/hunter-squad-r952\.js"><\/script>\n(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>\n)*<script src="\.\/story-reader-r122\.js">/.test(html),'태그 순서: R720·R911 뒤, 긴 줄 앞(따로 한 줄)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r952\/r952-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/createRadialGradient/.test(code),'3D 기록기 멈춤 함정(중심 다른 원 그라데이션) 없음');
ok(!/addEventListener\(\s*['"]key/.test(code)&&!/\bkeys\b/.test(code),'스킬 키를 늘리지 않음(키 입력을 듣지 않음)');
ok(/r720Ally/.test(code)&&/r952Summon/.test(code),'소환 몸은 r720Ally(영웅별 그리기 상태) + r952Summon 표식');
ok(!/'rune'|'runecross'|'cross'/.test(code),'상징 규칙: 룬·십자 문양을 새로 그리지 않음');
{const s425=strip(fs.readFileSync(path.join(R,'client-source','slayer-blood-r425.js'),'utf8'));
 ok(/r952Summon/.test(s425),'R425: 소환된 슬레이어 몸이 건 Q·R 을 그 몸 기준으로 이어 감(r952Summon 몸일 때만)');
 ok(fs.readFileSync(path.join(R,'client-source','slayer-blood-r425.js'),'utf8')===fs.readFileSync(path.join(R,'runtime-text','slayer-blood-r425.js'),'utf8'),'R425 runtime-text 사본 일치');}

// ---- 가짜 엔진 ----  벽: 14<x<15.5, 맵 1..N-1
function engine({coop=null,enemies=[],hero='hunter',px=20,py=20,rand=null,noR720=false}={}){
 const hits=[],heroDraws=[],propDraws=[],sounds=[],wer=[],delayedRuns=[];let clock=10;const N=40,delayed=[];
 const mkRoom=id=>({id,engaged:false,props:[{id:'chair',x:5,y:5}],enemies:[]});
 const room=mkRoom('room1');room.enemies=enemies.map(e=>({radius:.3,hp:1e6,maxHp:1e6,spawnState:'active',...e}));
 const W={};if(!noR720)W.__STORYWORLD_HERO_DEFENSE_R720__=Object.freeze({revision:'fake-r720',has:id=>id==='gunner',bodies:()=>[]});
 const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math:Object.create(Math),JSON,Set,Map,WeakMap,WeakSet,Array,Object,String,Number,Error,Promise,structuredClone,
  get time(){return clock;},TILE:32,zoom:1,N,room,zone:'z1',settings:{lowFx:false},effects:[],started:true,modal:false,loading:false,storyScene:null,
  target:null,command:null,route:[],
  HEROES:{hunter:{name:'헌터',type:'burst',power:23,interval:.39,range:8.3,color:'#d8c291'},slayer:{name:'슬레이어',type:'heavy',power:48,interval:.69,range:3.3,color:'#d27d88'},gunner:{name:'기억사수',type:'gun',power:20,interval:.3,range:7,color:'#9cf'}},
  heroArt:{hunter:{idle:{front:'h.png'}},slayer:{idle:{front:'s.png'}},gunner:{idle:{front:'g.png'}}},heroPaths:id=>[id+'.png'],
  player:{x:px,y:py,hp:100,maxHp:100,hero,direction:'right',attackCD:0,specialCD:0,combo:0,moving:false,attackAnim:0,skillAnim:0,level:3,ego:0,samong:0,upgrades:{power:1},progressionR62:{ranks:{}},storyWER:{ready:{},buffs:{}}},
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,facing:(x,y)=>{const sx=x-y,sy=(x+y)*.5;return Math.abs(sx)>Math.abs(sy)*1.35?(sx>0?'right':'left'):sy>0?'front':'back';},
  liveEnemies:()=>g.room.enemies.filter(e=>e.hp>0&&(!e.boss||g.room.engaged)),damageable3:e=>e.spawnState==='active',
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>N-1||y+r>N-1||(x+r>14&&x-r<15.5),
  attackPower:()=>100,
  hitEnemy:(e,v,s)=>{hits.push({id:e.id,v,s,who:g.player,hero:g.player.hero});e.hp-=v;return true;},floatText:()=>{},toast:()=>{},
  nearestEnemy:(r=Infinity)=>{let b=null,bd=r;for(const e of g.liveEnemies()){const d=Math.hypot(e.x-g.player.x,e.y-g.player.y);if(d<bd){bd=d;b=e;}}return b;},
  storyAim22:()=>0,fx:()=>{},drawEffect:()=>{},enterRegion:async()=>true,
  sound:(name)=>{sounds.push({name,who:g.player});},
  delay:(sec,fn)=>{delayed.push({at:clock+sec,fn});},
  makeShot:()=>({}),
  tick(){for(let i=delayed.length-1;i>=0;i--)if(delayed[i].at<=clock){const d=delayed.splice(i,1)[0];d.fn();}},
  basicAttack(force=false){const p=g.player;if(!g.started||g.modal||g.loading||p.hp<=0||p.attackCD>0)return;if(g.__throwAttack&&p.r952Summon)throw new Error('boom');
   const h=g.HEROES[p.hero],e=g.nearestEnemy(h.range);if(!e&&!force)return;if(e)p.direction=g.facing(e.x-p.x,e.y-p.y);p.combo++;p.attackCD=h.interval;p.attackAnim=.24;g.sound('attack');
   if(e)g.hitEnemy(e,g.attackPower(),{kind:'basic',friendly:true});},
  special(){const p=g.player;if(p.hp<=0||p.specialCD>0)return;p.specialCD=10;p.skillAnim=.6;const who=p,e=g.nearestEnemy(12);if(e)g.hitEnemy(e,g.attackPower()*2.4,{kind:'special',friendly:true});
   g.delay(.2,()=>{delayedRuns.push({cast:who,ran:g.player});});},
  drawProp(p){propDraws.push(p);},
  drawHero(){heroDraws.push({body:g.player,hero:g.player.hero,x:g.player.x,y:g.player.y,dir:g.player.direction,anim:g.player.attackAnim,alpha:g.ctx.globalAlpha});},
  readyImage:(p)=>({image:{src:p,width:256,height:256,naturalWidth:256,naturalHeight:256}}),ensureImages:()=>Promise.resolve(),
  ctx:{_st:[],filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,strokeStyle:'',fillStyle:'',
   save(){this._st.push([this.filter,this.globalAlpha]);},restore(){const s=this._st.pop();if(s)[this.filter,this.globalAlpha]=s;},
   translate(){},scale(){},rotate(){},setTransform(){},setLineDash(){},drawImage(){},
   beginPath(){},moveTo(){},lineTo(){},fill(){},stroke(){},arc(){},ellipse(){},closePath(){},fillRect(){},scope(o,f){return f();}}};
 if(rand)g.Math.random=rand;
 g.clearLine=(a,b)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(1,Math.ceil(d/.24));for(let i=1;i<=k;i++)if(g.blocked(a.x+(b.x-a.x)*i/k,a.y+(b.y-a.y)*i/k,.29))return false;return true;};
 W.__STORYWORLD_HANDO_FINAL_R49__={autoSpecial:()=>g.special(),autoTarget:()=>g.nearestEnemy(6),rangeFor:()=>4,eligible:(e,r)=>e.hp>0&&Math.hypot(e.x-g.player.x,e.y-g.player.y)<=r};
 W.__STORYWORLD_WER__={cast:(slot)=>{const p=g.player,rd=p.storyWER.ready;if(rd[slot]>clock)return false;rd[slot]=clock+9;wer.push({slot,who:p});const e=g.nearestEnemy(6);if(e)g.hitEnemy(e,g.attackPower()*1.5,{kind:'wer',storyWER:true,sourceSlot:slot,friendly:true});return true;}};
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});
 const api=W.__STORYWORLD_HUNTER_SQUAD_R952__,real=g.player;
 const adv=(dt)=>{clock+=dt;const p=real;p.attackCD=Math.max(0,p.attackCD-dt);p.specialCD=Math.max(0,p.specialCD-dt);p.attackAnim=Math.max(0,(p.attackAnim||0)-dt);ctx.tick(dt);};
 const run=(sec,dt=.033)=>{const k=Math.round(sec/dt);for(let i=0;i<k;i++)adv(dt);};
 // 엔진 그리기 순서 흉내: 조형물(깊이 순) → 영웅
 const frame=()=>{heroDraws.length=0;propDraws.length=0;const ps=g.room.props.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y));for(const p of ps)ctx.drawProp(p);ctx.drawHero();};
 return {g,ctx,W,api,real,hits,heroDraws,propDraws,sounds,wer,delayedRuns,adv,run,frame,mkRoom,clock:()=>clock};}
const by=(E,f)=>E.hits.filter(f);
const myProps=E=>E.g.room.props.filter(p=>p&&p.r952Prop);
const units=E=>E.api.inspect().units;

// ---- 기본 규칙 ----
{const E=engine();const A=E.api;ok(A&&typeof A.inspect==='function'&&A.on(),'전역 __STORYWORLD_HUNTER_SQUAD_R952__ 켜짐');
 const C=A.config;ok(C.life===7,'지속 7초');
 ok(C.tiers.call>C.tiers.shade&&C.tiers.shade>C.tiers.squad&&C.tiers.squad>0,'확률: ① 슬레이어 소환 > ② +슬레이어 분신 > ③ 분대 진법(뒤로 갈수록 낮음)');
 ok(near(C.tiers.call+C.tiers.shade+C.tiers.squad,1),'세 단계 가운데 정확히 하나(합 1)');
 ok(C.chance>0&&C.chance<=.15&&C.icd>=C.life+7,'발동 확률 15% 이하 · 다시 발동까지 지속 시간보다 7초 이상 김');
 ok(C.slayer.mul>0&&C.slayer.mul<=.6&&C.shade.mul>0&&C.shade.mul<=.5&&C.squad.mul>0&&C.squad.mul*C.squad.count<=1.2,'밸런스: 소환 슬레이어 ≤0.6배 · 분신 베기 ≤0.5배 · 헌터 분신 합 ≤1.2배');
 ok(C.squad.count===4,'헌터 분신 4체(헌터까지 다섯이 한 분대)');
 const pk=A.pure.pickTier;ok(pk(0)==='call'&&pk(C.tiers.call-1e-9)==='call'&&pk(C.tiers.call)==='shade'&&pk(C.tiers.call+C.tiers.shade-1e-9)==='shade'&&pk(C.tiers.call+C.tiers.shade)==='squad'&&pk(.999999)==='squad','단계 고르기 경계값');}

// ---- ① 슬레이어 영웅 소환 ----
{const E=engine({enemies:[{id:'a',x:24,y:20},{id:'b',x:25,y:21}],rand:()=>.99});
 ok(E.api.force('call'),'강제 예약');E.ctx.basicAttack();
 ok(by(E,h=>h.id==='a'&&h.who===E.real&&h.v===100).length===1,'헌터 기본 공격은 그대로 한 번(피해 그대로)');
 let I=E.api.inspect();ok(I.active&&I.tier==='call','① 발동');ok(I.units.length===1&&I.units[0].kind==='slayer','슬레이어 한 명만(헌터 분신 없음)');
 E.run(.1);const B=E.api.bodies();ok(B.length===1&&B[0].hero==='slayer'&&B[0]!==E.real&&B[0].r720Ally===true&&B[0].r952Summon===true,'슬레이어 몸: 조종 영웅과 다른 사본 · r720Ally · r952Summon');
 ok(B[0].upgrades===E.real.upgrades&&B[0].level===E.real.level,'헌터 능력치 비례: 강화·레벨은 헌터 것을 함께 씀');
 ok(E.g.player===E.real,'틱 뒤 player 는 조종 영웅으로 되돌아옴');
 ok(myProps(E).length===1&&!E.g.blocked(I.units[0].x,I.units[0].y,.23),'방 조형물 줄에 몸 하나(깊이 정렬) · 벽 속이 아님');
 E.run(2.5);
 const sh=by(E,h=>h.hero==='slayer'&&h.s&&h.s.kind==='basic');ok(sh.length>=2,'슬레이어가 다가가 엔진 기본 공격으로 침('+sh.length+'회)');
 ok(sh.every(h=>near(h.v,100*E.api.config.slayer.mul)),'슬레이어 피해 = 공격력 × '+E.api.config.slayer.mul+'(엔진 attackPower 를 그 몸으로)');
 ok(by(E,h=>h.who===E.real).every(h=>h.v===100||h.s.kind!=='basic'),'그동안에도 헌터 자신의 피해는 그대로');
 ok(by(E,h=>h.hero==='slayer'&&h.s&&h.s.kind==='special').length>=1,'슬레이어 고유기(Q)도 엔진 special 로');
 ok(E.wer.some(w=>w.who===B[0]),'슬레이어 본편 W·E·R 도 엔진 시전으로');
 ok(by(E,h=>h.s&&h.s.r952==='shade').length===0&&E.api.inspect().shades===0,'① 에는 슬레이어 분신 없음');
 ok(E.delayedRuns.length>=1&&E.delayedRuns.every(d=>d.cast===d.ran),'지연 작업은 건 몸으로 다시 끼워 돈다');
 ok(E.g.target===null&&E.g.command===null&&Array.isArray(E.g.route)&&E.g.route.length===0,'조종 영웅의 겨눔·이동 명령을 건드리지 않음');
 const u=units(E)[0],e0=E.g.room.enemies[0];ok(Math.hypot(u.x-e0.x,u.y-e0.y)<3.4||Math.hypot(u.x-E.g.room.enemies[1].x,u.y-E.g.room.enemies[1].y)<3.4,'슬레이어가 적 곁까지 걸어감');
 // 그리기: 조형물 순서 안에서 엔진 drawHero 를 그 몸으로
 E.frame();const d=E.heroDraws.filter(x=>x.body===B[0]);ok(d.length===1&&near(d[0].x,u.x)&&near(d[0].y,u.y)&&d[0].alpha>.95,'그리기: 엔진 drawHero 를 슬레이어 몸으로 한 번(불투명)');
 ok(E.heroDraws.filter(x=>x.body===E.real).length===1&&E.heroDraws[E.heroDraws.length-1].body===E.real,'조종 영웅은 그대로 한 번');
 ok(E.propDraws.length===1&&E.propDraws[0].id==='chair','원래 조형물은 엔진 그리기 그대로');
 ok(E.W.__STORYWORLD_HERO_DEFENSE_R720__.has('slayer')===true&&E.W.__STORYWORLD_HERO_DEFENSE_R720__.has('hunter')===true&&E.W.__STORYWORLD_HERO_DEFENSE_R720__.has('gunner')===true&&E.W.__STORYWORLD_HERO_DEFENSE_R720__.revision==='fake-r720','R720 has(): 소환된 영웅도 "판에 있음"으로(원래 답·다른 항목은 그대로)');
 // 지속 7초(경계)
 const t0=E.clock()-2.6;E.run(7-2.6-.2);ok(E.api.inspect().active,'6.8초: 아직 있음');E.run(.3);
 I=E.api.inspect();ok(!I.active&&myProps(E).length===0&&E.api.bodies().length===0,'7초 뒤 사라짐(조형물 줄·몸 정리)');
 ok(E.W.__STORYWORLD_HERO_DEFENSE_R720__.has('slayer')===false,'끝나면 has(slayer) 원래대로');
 const cnt=E.hits.length;E.run(1);ok(by(E,h=>h.hero==='slayer').length===by(E,h=>h.hero==='slayer').length&&E.hits.slice(cnt).every(h=>h.who===E.real),'끝난 뒤 슬레이어 피해 없음');
 ok(E.g.room.enemies.length===2&&E.g.room.props.length===1,'적 명단·조형물 원래대로(서사·보스·승리 조건 불변)');
 ok(E.api.inspect().errors===0,'오류 0');}

// ---- ② 슬레이어 + 확률로 슬레이어 분신 ----
{const E=engine({enemies:[{id:'a',x:22,y:20},{id:'b',x:23,y:21.5},{id:'c',x:22,y:18.5}],rand:()=>0});
 E.api.force('shade');E.ctx.basicAttack();E.run(3);const I=E.api.inspect();
 ok(I.tier==='shade'&&I.units.length===1&&I.units[0].kind==='slayer','② 발동: 슬레이어 한 명(헌터 분신 없음)');
 const sh=by(E,h=>h.s&&h.s.r952==='shade');ok(sh.length>=2,'슬레이어가 칠 때 분신이 나와 벰('+sh.length+'회)');
 ok(sh.every(h=>near(h.v,100*E.api.config.shade.mul)&&h.s.friendly===true&&h.s.sourceHero==='slayer'),'분신 베기 피해 = 공격력 × '+E.api.config.shade.mul+' · 엔진 hitEnemy 로');
 ok(new Set(sh.map(h=>h.id)).size>=2,'분신은 슬레이어가 치는 적 말고 곁의 다른 적에게도 감');
 ok(I.stats.shades>=sh.length&&I.shades<=E.api.config.shade.max,'동시에 떠 있는 분신 수 상한');
 E.frame();const B=E.api.bodies()[0];ok(E.heroDraws.filter(x=>x.body===B).length>=1,'분신·본체 모두 슬레이어 몸 그림');}
{const E=engine({enemies:[{id:'a',x:22,y:20},{id:'b',x:23,y:21.5}],rand:()=>.99});
 E.api.force('shade');E.ctx.basicAttack();E.run(3);ok(by(E,h=>h.s&&h.s.r952==='shade').length===0&&by(E,h=>h.hero==='slayer').length>=1,'② 분신은 확률: 주사위가 안 나오면 슬레이어만 싸움');}
{const E=engine({enemies:[{id:'a',x:22,y:20}],rand:()=>0});E.api.force('shade');E.ctx.basicAttack();E.run(3);
 ok(by(E,h=>h.s&&h.s.r952==='shade'&&h.id==='a').length>=1,'적이 하나뿐이면 분신도 그 적을 벰');}

// ---- ③ 분대 진법 ----
{const E=engine({enemies:[{id:'a',x:25,y:20},{id:'b',x:26,y:21},{id:'c',x:26,y:19}],rand:()=>0});
 E.api.force('squad');E.ctx.basicAttack();E.run(1.2);const I=E.api.inspect(),C=E.api.config.squad;
 ok(I.tier==='squad'&&I.units.filter(u=>u.kind==='slayer').length===1&&I.units.filter(u=>u.kind==='hunter').length===4,'③ 발동: 슬레이어 1 + 헌터 분신 4');
 const hu=I.units.filter(u=>u.kind==='hunter');
 ok(I.slots.length===4&&hu.every(u=>Math.hypot(u.x-I.slots[u.i].x,u.y-I.slots[u.i].y)<.12),'헌터 분신이 진법 자리에 섬');
 // 진법: 헌터가 꼭짓점, 좌우 대칭 두 날개(적 쪽이 앞)
 const p=E.real,fx=1,fy=0;const rel=I.slots.map(s=>({f:(s.x-p.x)*fx+(s.y-p.y)*fy,l:-(s.x-p.x)*fy+(s.y-p.y)*fx}));
 ok(rel.every(r=>r.f<0),'분신은 헌터 뒤쪽 날개(헌터가 진의 꼭짓점)');
 ok(near(rel[0].l,-rel[1].l,1e-6)&&near(rel[2].l,-rel[3].l,1e-6)&&near(rel[0].f,rel[1].f,1e-6)&&near(rel[2].f,rel[3].f,1e-6),'좌우 대칭');
 ok(Math.abs(rel[2].l)>Math.abs(rel[0].l)&&rel[2].f<rel[0].f,'바깥 줄일수록 더 벌어지고 더 뒤(기러기 대형)');
 let minGap=9;const all=[{x:p.x,y:p.y},...I.slots];for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)minGap=Math.min(minGap,Math.hypot(all[i].x-all[j].x,all[i].y-all[j].y));ok(minGap>=.8,'자리끼리 겹치지 않음(최소 간격 '+minGap.toFixed(2)+'칸)');
 const S=E.api.pure.slotsFor(10,10,Math.PI/2,4,C.gap,C.back);ok(S.length===4&&S.every(s=>s.y<10)&&near(S[0].x-10,-(S[1].x-10)),'순수 함수 slotsFor: 겨눈 방향이 바뀌면 진도 돈다');
 E.run(2);
 const ch=by(E,h=>h.hero==='hunter'&&h.who!==E.real&&h.s.kind==='basic');ok(ch.length>=8,'헌터 분신들이 엔진 기본 공격으로 쏨('+ch.length+'회)');
 ok(ch.every(h=>near(h.v,100*C.mul)),'헌터 분신 피해 = 공격력 × '+C.mul);
 ok(new Set(ch.map(h=>h.who)).size===4,'분신 넷 모두 공격');
 ok(by(E,h=>h.hero==='hunter'&&h.who!==E.real&&h.s.kind==='special').length===4,'분신마다 고유기 일제 사격 한 번');
 ok(E.wer.every(w=>w.who.hero!=='hunter'),'헌터 분신은 돌진(E) 등 자리 벗어나는 스킬을 쓰지 않음');
 ok(by(E,h=>h.hero==='slayer').length>=1&&by(E,h=>h.s&&h.s.r952==='shade').length>=1,'①·② 도 함께(슬레이어 + 분신)');
 ok(E.sounds.filter(s=>s.who!==E.real&&s.who.hero==='hunter').every(s=>s.who===E.api.bodies().find(b=>b.hero==='hunter')),'분신 넷의 발사 소리는 하나만(소리 겹침 방지)');
 ok(E.api.inspect().stats.rolls===0&&E.api.inspect().stats.procs.squad===1,'분신의 공격은 패시브를 다시 굴리지 않음');
 E.frame();const hb=E.api.bodies().filter(b=>b.hero==='hunter');
 ok(hb.every(b=>E.heroDraws.filter(x=>x.body===b).length===1)&&E.heroDraws.filter(x=>x.body!==E.real&&x.hero==='hunter').every(x=>x.alpha<.95&&x.alpha>.5),'헌터 분신: 엔진 drawHero 를 분신 몸으로 한 번씩(반투명)');
 ok(E.g.player===E.real&&E.heroDraws.filter(x=>x.body===E.real).length===1,'그린 뒤 조종 영웅으로 되돌아옴');
 // 헌터가 움직이면 진이 따라온다
 E.real.x=22;E.real.y=24;E.run(1.2);const I2=E.api.inspect();ok(I2.units.filter(u=>u.kind==='hunter').every(u=>Math.hypot(u.x-I2.slots[u.i].x,u.y-I2.slots[u.i].y)<.2&&Math.hypot(u.x-22,u.y-24)<4),'헌터가 움직이면 진이 따라옴');
 E.run(7);ok(!E.api.inspect().active&&myProps(E).length===0&&E.api.bodies().length===0,'7초 뒤 분대 해산');ok(E.api.inspect().errors===0,'오류 0');}
// 벽 곁: 진법 자리가 벽 속으로 들어가지 않음
{const E=engine({enemies:[{id:'a',x:25,y:20}],px:16.2,py:20,rand:()=>.99});E.api.force('squad');E.ctx.basicAttack();E.run(1.5);const I=E.api.inspect();
 ok(I.slots.every(s=>!E.g.blocked(s.x,s.y,.23))&&I.units.every(u=>!E.g.blocked(u.x,u.y,.23)),'벽 곁에서도 자리·몸이 벽 속에 없음');}

// ---- 발동 규칙 ----
{const E=engine({enemies:[{id:'a',x:24,y:20}],rand:()=>0});E.ctx.basicAttack();
 let I=E.api.inspect();ok(I.active&&I.stats.rolls===1,'주사위가 나오면 성공한 기본 공격에서 발동');
 const tier=I.tier;E.run(.5);E.ctx.basicAttack();E.run(.5);E.ctx.basicAttack();I=E.api.inspect();
 ok(I.stats.procs.call+I.stats.procs.shade+I.stats.procs.squad===1&&I.tier===tier,'지속 중에는 다시 발동하지 않음(하나만)');
 E.run(7);ok(!E.api.inspect().active,'끝남');E.ctx.basicAttack();E.run(.1);ok(!E.api.inspect().active,'재사용 대기 안에는 발동 없음');
 E.run(E.api.config.icd-7.6);E.real.attackCD=0;E.ctx.basicAttack();ok(E.api.inspect().active,'재사용 대기 뒤 다시 발동');}
{const E=engine({enemies:[{id:'a',x:24,y:20}]});E.real.attackCD=.3;E.api.force('call');E.ctx.basicAttack();E.run(.05);ok(!E.api.inspect().active,'실패한 기본 공격은 발동하지 않음');
 E.run(.4);E.ctx.basicAttack();ok(E.api.inspect().active,'강제 예약은 다음 성공한 공격에서 씀');}
{const E=engine({enemies:[{id:'a',x:22,y:20}],hero:'slayer',rand:()=>0});E.ctx.basicAttack();E.run(1);ok(!E.api.inspect().active&&E.api.inspect().stats.swings===0,'다른 영웅은 발동 없음');}
{const E=engine({enemies:[{id:'a',x:24,y:20}],coop:'duo',rand:()=>0});E.ctx.basicAttack();E.run(1);ok(!E.api.inspect().active&&myProps(E).length===0,'협동 모드는 발동 없음');}
{const E=engine({enemies:[{id:'a',x:24,y:20}],rand:()=>0});E.api.set(false);E.ctx.basicAttack();E.run(1);ok(!E.api.inspect().active,'끄면 발동 없음');E.api.set(true);
 E.real.attackCD=0;E.ctx.basicAttack();ok(E.api.inspect().active,'다시 켜면 발동');E.api.set(false);ok(!E.api.inspect().active&&myProps(E).length===0,'도중에 끄면 바로 해산');}
// 확률 분포(고정 시드)
{let s=20261112;const lcg=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
 const E=engine({enemies:[{id:'a',x:24,y:20,hp:1e15,maxHp:1e15}],rand:lcg});const C=E.api.config;let tries=0;
 for(let i=0;i<4000;i++){E.real.attackCD=0;E.ctx.basicAttack();tries++;E.run(C.icd+.5,1.5);}
 const st=E.api.inspect().stats,pc=st.procs,tot=pc.call+pc.shade+pc.squad,rate=tot/tries;
 ok(st.rolls===tries,'공격마다 주사위 한 번');ok(Math.abs(rate-C.chance)<.02,'평균 발동률 '+rate.toFixed(3)+' ≈ '+C.chance);
 ok(pc.call>pc.shade&&pc.shade>pc.squad&&pc.squad>0,'발동 횟수 ① '+pc.call+' > ② '+pc.shade+' > ③ '+pc.squad);
 ok(Math.abs(pc.call/tot-C.tiers.call)<.08&&Math.abs(pc.squad/tot-C.tiers.squad)<.06,'단계 비율이 설정 근처');}

// ---- 안전: 해산 조건·오류·보스 ----
{const E=engine({enemies:[{id:'a',x:24,y:20}]});E.api.force('squad');E.ctx.basicAttack();E.run(.5);const old=E.g.room;
 const nr=E.mkRoom('room2');E.g.room=nr;E.run(.1);ok(!E.api.inspect().active&&old.props.every(p=>!p.r952Prop)&&nr.props.every(p=>!p.r952Prop),'방이 바뀌면 해산(옛 방·새 방에 흔적 없음)');}
{const E=engine({enemies:[{id:'a',x:24,y:20}]});E.api.force('call');E.ctx.basicAttack();E.run(.5);E.real.hp=0;E.run(.1);ok(!E.api.inspect().active&&myProps(E).length===0,'헌터가 쓰러지면 해산');}
{const E=engine({enemies:[{id:'a',x:24,y:20}]});E.api.force('call');E.ctx.basicAttack();E.run(.5);E.real.hero='gunner';E.run(.1);ok(!E.api.inspect().active&&myProps(E).length===0,'영웅을 바꾸면 해산');}
{const E=engine({enemies:[{id:'a',x:22,y:20}]});E.api.force('call');E.ctx.basicAttack();E.g.__throwAttack=true;E.run(1);
 ok(E.g.player===E.real&&E.g.target===null,'엔진 함수가 오류를 내도 player·겨눔을 되돌림');ok(E.api.inspect().errors>0,'오류는 세어 둠(게임은 계속)');E.g.__throwAttack=false;E.run(.5);ok(by(E,h=>h.hero==='slayer').length>=1,'오류 뒤에도 계속 동작');}
{const E=engine({enemies:[{id:'boss',x:22,y:20,boss:true},{id:'a',x:25,y:20}]});E.api.force('call');E.ctx.basicAttack();E.run(3);
 ok(by(E,h=>h.id==='boss').length===0&&by(E,h=>h.id==='a'&&h.hero==='slayer').length>=1,'아직 교전하지 않은 보스는 치지 않음(보스 시작 조건 불변)');
 E.g.room.engaged=true;E.run(2);ok(by(E,h=>h.id==='boss'&&h.hero==='slayer').length>=1,'교전이 시작된 보스는 침');}
{const E=engine({enemies:[{id:'a',x:22,y:20},{id:'sleep',x:21.5,y:21,spawnState:'awake'}]});E.api.force('shade');E.g.Math.random=()=>0;E.ctx.basicAttack();E.run(3);
 ok(by(E,h=>h.id==='sleep'&&h.s&&h.s.r952==='shade').length===0,'피해를 받을 수 없는 적(등장 중)은 분신이 치지 않음');}
{const E=engine({enemies:[{id:'a',x:22,y:20}]});E.api.force('call');E.ctx.basicAttack();E.run(.3);const c=E.hits.length,u0=units(E)[0];E.g.modal=true;E.run(1);
 const u1=units(E)[0];ok(E.hits.length===c&&near(u0.x,u1.x)&&near(u0.y,u1.y),'창이 열린 동안은 소환 영웅도 멈춤');E.g.modal=false;}
{const E=engine({enemies:[{id:'far',x:35,y:35}]});E.api.force('call');E.ctx.basicAttack(true);ok(E.api.inspect().active,'빈 공격(강제)으로도 예약 발동');E.run(2);
 const u=units(E)[0];ok(Math.hypot(u.x-E.real.x,u.y-E.real.y)<2.2&&by(E,h=>h.hero==='slayer').length===0,'적이 멀면 슬레이어는 헌터 곁을 지킴');
 E.real.x=30;E.real.y=8;E.run(.2);const v=units(E)[0];ok(Math.hypot(v.x-30,v.y-8)<E.api.config.slayer.leash+.01,'헌터가 멀리 가면 곁으로 따라붙음');}
// 벽 너머로 걸어가지 않음
{const E=engine({enemies:[{id:'w',x:12,y:20}],px:17,py:20});E.api.force('call');E.ctx.basicAttack(true);let bad=0;for(let i=0;i<90;i++){E.adv(.033);const u=units(E)[0];if(u&&E.g.blocked(u.x,u.y,.23))bad++;}ok(bad===0,'슬레이어가 벽 속으로 들어가지 않음');}
// 생존 배치 영웅(R720 몸)은 몸마다 따로
{const E=engine({enemies:[{id:'a',x:24,y:20}]});const body={...E.real,x:22,y:22};Object.defineProperty(body,'r720Ally',{value:true});
 E.api.force('call',body);const keep=E.g.player;E.g.player=body;E.ctx.basicAttack();E.g.player=keep;
 ok(E.api.inspect(body).active&&!E.api.inspect().active,'R720 배치 헌터: 그 몸의 상태로 따로 발동(조종 영웅 상태와 섞이지 않음)');
 E.run(7.2);ok(!E.api.inspect(body).active&&myProps(E).length===0,'배치 헌터의 분대도 7초 뒤 해산');}
{const E=engine({enemies:[{id:'a',x:24,y:20}],noR720:true});E.api.force('call');E.ctx.basicAttack();E.run(1);ok(E.api.inspect().active&&E.api.inspect().errors===0,'R720 이 없어도 동작');}

console.log('\nR952 CPU 검사 '+n+'개 통과');
