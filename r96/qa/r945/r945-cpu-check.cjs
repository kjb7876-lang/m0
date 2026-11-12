// R945 환도 확률 발동 수묵 패시브 — CPU 검사(정적 + 가짜 엔진 행동).
//  node r96/qa/r945/r945-cpu-check.cjs
//  사용자 2026-11-12 12:01Z: 환도 확률 발동 특수 패시브, 동양화·수묵화풍.
//   ① 흑백 검기·참격이 기본 공격 방향으로 적을 관통하며 날아감  ② 수묵 분신 7체가 7초간 적 주변에서 환도의 모든 모션을 따라 함
//   ③ 세 의협(도술·매화 의적·축지 두령) 모티브를 엮은 수묵 합동 기술. 스킬 키는 늘리지 않음. 생존 배치 영웅(R720)도 영웅(몸)마다 따로.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='hwando-ink-r945.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적 ----
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2&&/<script src="\.\/hwando-ink-r945\.js"><\/script>\n(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>\n)*<script src="\.\/story-reader-r122\.js">/.test(html),'index.html 스크립트 태그 한 번(긴 줄 앞, 따로 한 줄)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r945\/r945-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/홍길동|일지매|전우치|월아|천충|무월|getsuga|ichigo|bleach/i.test(code),'다른 작품·인물 이름을 화면 글·코드에 쓰지 않음(모티브만)');
ok(!/'rune'|'runecross'|'cross'/.test(code),'상징 규칙: 룬·십자 문양 없음');
ok(/r720Ally/.test(code),'생존 배치 영웅 몸(r720Ally)을 따로 다룸');

// ---- 가짜 엔진 ----  벽: 14<x<15.5, 맵 1..N-1
function engine({coop=null,enemies=[],hero='hwando',lowFx=false,px=20,py=20,rand=null}={}){
 const hits=[],heroDraws=[],sheets=[];let clock=10;const N=40;
 const room={id:'room1',props:[],enemies:enemies.map(e=>({radius:.3,hp:1e5,maxHp:1e5,spawnState:'active',...e}))};
 const W={};const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math:Object.create(Math),JSON,Set,Map,WeakMap,WeakSet,Array,Object,String,Number,Error,Promise,
  get time(){return clock;},TILE:32,zoom:1,N,room,zone:'z1',settings:{lowFx},effects:[],started:true,modal:false,loading:false,
  player:{x:px,y:py,hp:100,hero,direction:'right',attackCD:0,specialCD:0,combo:0,moving:false,attackAnim:0},
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>g.room.enemies.filter(e=>e.hp>0),damageable3:()=>true,
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>N-1||y+r>N-1||(x+r>14&&x-r<15.5),
  attackPower:()=>100,
  hitEnemy:(e,v,s)=>{hits.push({id:e.id,v,s,who:g.player});e.hp-=v;return true;},floatText:()=>{},
  nearestEnemy:(r)=>{let b=null,bd=1e9;for(const e of g.room.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-g.player.x,e.y-g.player.y);if(d<=r&&d<bd){bd=d;b=e;}}return b;},
  storyAim22:()=>0,fx:()=>{},drawEffect:()=>{},tick:()=>{},enterRegion:async()=>true,sound:()=>{},
  basicAttack(){const p=g.player;if(p.hp<=0||p.attackCD>0)return;const e=g.nearestEnemy(3.15);if(!e)return;p.combo++;p.attackCD=.48;p.attackAnim=.24;g.hitEnemy(e,g.attackPower(),{kind:'basic',friendly:true});},
  special(){const p=g.player;if(p.hp<=0||p.specialCD>0)return;p.specialCD=10;},
  drawHero(){heroDraws.push({x:g.player.x,y:g.player.y,dir:g.player.direction,anim:g.player.attackAnim,tx:g.ctx.__tx,ty:g.ctx.__ty,filter:g.ctx.filter,body:g.player});},
  readyImage:(p)=>({image:{src:p,width:1536,height:1024,naturalWidth:1536,naturalHeight:1024}}),ensureImages:()=>Promise.resolve(),
  ctx:{__tx:0,__ty:0,_st:[],filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',
   save(){this._st.push([this.__tx,this.__ty,this.filter,this.globalAlpha]);},restore(){const s=this._st.pop();if(s)[this.__tx,this.__ty,this.filter,this.globalAlpha]=s;},
   translate(x,y){this.__tx+=x;this.__ty+=y;},scale(){},rotate(){},setTransform(){},
   drawImage(im){sheets.push({src:im&&(im.src||im.__storyworldStaticSource?.path),filter:this.filter});},
   beginPath(){},moveTo(){},lineTo(){},fill(){},stroke(){},arc(){},ellipse(){},closePath(){},fillRect(){},scope(o,f){return f();}}};
 if(rand)g.Math.random=rand;
 g.clearLine=(a,b)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(1,Math.ceil(d/.24));for(let i=1;i<=k;i++)if(g.blocked(a.x+(b.x-a.x)*i/k,a.y+(b.y-a.y)*i/k,.29))return false;return true;};
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});
 const api=W.__STORYWORLD_HWANDO_INK_R945__;
 const adv=(dt)=>{clock+=dt;for(const p of [g.player,...(g.__allies||[])]){p.attackCD=Math.max(0,p.attackCD-dt);p.specialCD=Math.max(0,p.specialCD-dt);p.attackAnim=Math.max(0,(p.attackAnim||0)-dt);}ctx.tick(dt);};
 const run=(sec,dt=.033)=>{for(let t=0;t<sec;t+=dt)adv(dt);};
 const frame=()=>{const s=g.effects.find(e=>e&&e.r945Sentinel);if(s)ctx.drawEffect(s);};
 return {g,ctx,api,hits,heroDraws,sheets,adv,run,frame,setClock:v=>{clock=v;}};}
const sumOn=(E,id,tag)=>E.hits.filter(h=>h.id===id&&(!tag||h.s?.r945===tag));

{const E=engine();const A=E.api;ok(A&&typeof A.inspect==='function'&&A.on(),'전역 __STORYWORLD_HWANDO_INK_R945__ 켜짐');
 const C=A.config;ok(C.moon.chance>0&&C.moon.chance<=.25&&C.clones.chance<C.moon.chance&&C.trio.chance<C.clones.chance,'확률: 흑백 검기 > 분신 > 합동기(드문 것일수록 낮음)');
 ok(C.clones.count===7&&C.clones.life===7,'분신 7체 · 7초');}

// ---- ① 흑백 검기: 기본 공격 방향으로 관통 ----
{const E=engine({enemies:[{id:'near',x:21,y:20},{id:'mid',x:24,y:20},{id:'far',x:26.6,y:20},{id:'out',x:28.5,y:20},{id:'off',x:23,y:23}]});
 E.api.force('moon');E.ctx.basicAttack();ok(sumOn(E,'near').length===1,'기본 공격 자체는 그대로 한 번');
 E.run(1.2);const I=E.api.inspect();ok(I.stats.moons===1,'흑백 검기 한 번 발동');
 ok(sumOn(E,'near','moon').length===1&&sumOn(E,'mid','moon').length===1&&sumOn(E,'far','moon').length===1,'겨눈 줄 위 적 셋을 모두 관통(각 한 번)');
 ok(sumOn(E,'out','moon').length===0,'사거리(7칸) 밖은 안 맞음');ok(sumOn(E,'off','moon').length===0,'줄 밖 적은 안 맞음');
 ok(Math.abs(sumOn(E,'mid','moon')[0].v-100*E.api.config.moon.mult)<1e-9,'검기 피해 = 공격력 × '+E.api.config.moon.mult);
 ok(sumOn(E,'mid','moon')[0].s.sourceHero==='hwando'&&sumOn(E,'mid','moon')[0].s.friendly===true,'엔진 hitEnemy 로(영웅 피해 표식)');}
{const E=engine({enemies:[{id:'a',x:21,y:20},{id:'behind',x:16.5,y:20}],px:12,py:20});E.g.room.enemies[0].x=13;
 E.api.force('moon');E.ctx.basicAttack();E.run(1.2);ok(sumOn(E,'behind','moon').length===0&&E.api.inspect().stats.wallStops>=1,'벽에서 멈춤(벽 너머 적 안 맞음)');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.g.player.attackCD=.3;E.api.force('moon');E.ctx.basicAttack();E.run(.05);ok(E.api.inspect().stats.moons===0,'실패한 기본 공격은 발동하지 않음');
 E.run(.4);E.ctx.basicAttack();E.run(.6);ok(E.api.inspect().stats.moons===1,'강제 예약은 다음 성공한 공격에서 씀');}
{const E=engine({enemies:[{id:'a',x:21,y:20}],hero:'slayer'});E.api.force('moon');E.ctx.basicAttack();E.run(1);ok(E.api.inspect().stats.moons===0,'다른 영웅은 발동 없음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}],coop:'duo'});E.api.force('moon');E.ctx.basicAttack();E.run(1);ok(sumOn(E,'a','moon').length===0,'협동 모드는 패시브 피해 없음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.api.set(false);E.api.force('moon');E.ctx.basicAttack();E.run(1);ok(E.api.inspect().stats.moons===0,'끄면 발동 없음');E.api.set(true);}
// 내부 재사용 대기: 늘 성공하는 주사위에서도 검기는 대기 시간 안에 두 번 나가지 않음
{const E=engine({enemies:[{id:'a',x:21,y:20}],rand:()=>0});E.ctx.basicAttack();E.run(.5);E.ctx.basicAttack();E.run(.1);
 const m1=E.api.inspect().stats.moons;ok(m1===1,'대기 시간 안 두 번째 공격은 검기 없음(=1)');E.run(E.api.config.moon.icd);E.ctx.basicAttack();E.run(.1);ok(E.api.inspect().stats.moons===2,'대기 시간 뒤 다시 발동');}
// 확률: 고정 시드 주사위로 많이 쳐 보면 평균 발동률이 설정 근처(PRD)
{let s=12345;const lcg=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
 const E=engine({enemies:[{id:'a',x:21,y:20,hp:1e12,maxHp:1e12}],rand:lcg});let tries=0;/* 적이 중간에 죽으면 공격이 안 나가 분모가 틀어진다 → 죽지 않는 적 */
 for(let i=0;i<3000;i++){E.ctx.basicAttack();tries++;E.run(E.api.config.trio.icd+.1,.5);}
 const st=E.api.inspect().stats,rm=st.moons/tries,rc=st.cloneCasts/tries,rt=st.trios/tries;
 ok(Math.abs(rm-E.api.config.moon.chance)<.04,'검기 평균 발동률 '+rm.toFixed(3)+' ≈ '+E.api.config.moon.chance);
 ok(Math.abs(rc-E.api.config.clones.chance)<.025,'분신 평균 발동률 '+rc.toFixed(3)+' ≈ '+E.api.config.clones.chance);
 ok(Math.abs(rt-E.api.config.trio.chance)<.02,'합동기 평균 발동률 '+rt.toFixed(3)+' ≈ '+E.api.config.trio.chance);
 ok(st.multi===0,'한 번의 공격에 패시브는 하나만');}

// ---- ② 수묵 분신 7체 ----
{const E=engine({enemies:[{id:'a',x:22,y:20},{id:'b',x:20,y:23},{id:'c',x:17,y:18}]});
 E.api.force('clones');E.ctx.basicAttack();E.run(.6);let I=E.api.inspect();ok(I.clones.length===7,'분신 7체 소환');
 const near=I.clones.every(c=>E.g.room.enemies.some(e=>Math.hypot(e.x-c.x,e.y-c.y)<=1.6));ok(near,'분신은 모두 적 곁(1.6칸 안)');
 ok(I.clones.every(c=>!E.g.blocked(c.x,c.y,.2)),'분신은 벽 안에 서지 않음');
 // 따라 하기: 영웅 그리기 한 번에 분신 7번(영웅 자세 그대로, 자리만 옮겨 먹빛 필터)
 E.heroDraws.length=0;E.g.player.direction='left';E.g.player.attackAnim=.2;E.ctx.drawHero();
 ok(E.heroDraws.length===15,'영웅 1 + 분신 7(먹 그림자 겹 + 담묵 몸)');const cl=E.heroDraws.slice(1).filter((d,i)=>i%2===1);
 ok(cl.length===7&&cl.every(d=>d.dir==='left'&&d.anim===.2),'분신은 영웅과 같은 방향·공격 자세');
 ok(cl.every((d,i)=>Math.abs(d.x-I.clones[i].x)<.05&&Math.abs(d.y-I.clones[i].y)<.05),'분신은 각자 제자리(적 곁)에 그려짐');
 ok(cl.every(d=>/grayscale\(1\)/.test(d.filter)),'분신은 수묵(회색조) 필터');
 ok(E.g.ctx.filter==='none'&&E.g.player.x===20,'그린 뒤 필터·영웅 위치 원래대로');
 E.heroDraws.length=0;E.ctx.drawHero();ok(E.heroDraws.length===1,'같은 순간 다시 불린 영웅 그리기(다른 분신 기능 등)는 분신을 또 그리지 않음');
 // 공격 따라 하기: 영웅이 칠 때 분신도 곁의 적을 친다
 const before=E.hits.filter(h=>h.s?.r945==='clone').length;E.run(.5);E.ctx.basicAttack();const after=E.hits.filter(h=>h.s?.r945==='clone');
 ok(after.length-before>=3&&after.every(h=>Math.abs(h.v-100*E.api.config.clones.mult)<1e-9),'영웅 공격 때 분신들도 곁의 적을 침(공격력 × '+E.api.config.clones.mult+')');
 E.ctx.special();ok(E.hits.filter(h=>h.s?.r945==='clone').length>after.length,'Q 시전도 따라 함');
 E.run(7-1.1-.1);ok(E.api.inspect().clones.length===7,'7초 전까지 유지');E.run(.4);ok(E.api.inspect().clones.length===0,'7초 뒤 사라짐');
 E.heroDraws.length=0;E.adv(.01);E.ctx.drawHero();ok(E.heroDraws.length===1,'사라진 뒤엔 영웅만 그림');}
{const E=engine({enemies:[]});E.api.force('clones');E.ctx.basicAttack();E.run(.1);ok(E.api.inspect().clones.length===0,'적이 없어 공격 안 나가면 분신 없음');}
{const E=engine({enemies:[{id:'a',x:22,y:20}]});E.api.force('clones');E.ctx.basicAttack();E.run(.2);E.api.force('clones');E.run(.5);E.ctx.basicAttack();E.run(.2);ok(E.api.inspect().clones.length===7,'다시 발동해도 7체 넘지 않음');}
{const E=engine({enemies:[{id:'a',x:22,y:20}],lowFx:true});E.api.force('clones');E.ctx.basicAttack();E.run(.3);E.heroDraws.length=0;E.ctx.drawHero();ok(E.heroDraws.length===8,'저사양도 분신 7체(사용자 지정 수, 그림자 겹만 뺌)');}

// ---- ③ 세 의협 수묵 합동기 ----
{const foes=[];for(let i=0;i<9;i++)foes.push({id:'m'+i,x:20+Math.cos(i)*(1.5+i*.5),y:20+Math.sin(i)*(1.5+i*.5)});foes.push({id:'far',x:29,y:20});
 const E=engine({enemies:foes});E.api.force('trio');E.ctx.basicAttack();E.run(.1);let I=E.api.inspect();
 ok(I.stats.trios===1&&I.trio&&I.trio.marks.length===7,'합동기 발동 · 표식 7');
 ok(!I.trio.marks.includes('far'),'7칸 밖 적은 표식 없음');
 ok(I.trio.marks.every(id=>{const e=E.g.room.enemies.find(q=>q.id===id);return Math.hypot(e.x-20,e.y-20)<=7;}),'표식은 사거리 안 적');
 E.run(.3);ok(E.hits.filter(h=>h.s?.r945==='trio').length===0,'표식 직후엔 아직 피해 없음(부적·매화 연출 먼저)');
 E.run(2.4);const tr=E.hits.filter(h=>h.s?.r945==='trio');
 ok(new Set(tr.map(h=>h.id)).size===7&&tr.length===7,'표식된 적 7에 한 번씩 합동 일격');
 ok(tr.every(h=>Math.abs(h.v-100*E.api.config.trio.mult)<1e-9),'합동 일격 = 공격력 × '+E.api.config.trio.mult);
 ok(E.hits.filter(h=>h.s?.r945==='bloom').length>=1,'매화 낙관 터짐이 곁의 적에도');
 ok(E.api.inspect().trio===null||E.api.inspect().trio.done,'연출 끝');
 ok(E.g.player.x===20&&E.g.player.y===20,'영웅은 옮기지 않음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.api.force('trio');E.ctx.basicAttack();E.run(.1);E.g.room={id:'room2',enemies:[]};E.run(3);
 ok(E.hits.filter(h=>h.s?.r945==='trio').length===0,'방이 바뀌면 남은 합동기 피해 취소');}

// ---- 그리기: 그리기 표지 · 상한 ----
{const E=engine({enemies:[{id:'a',x:21,y:20},{id:'b',x:23,y:21}]});E.api.force('moon');E.ctx.basicAttack();E.run(.1);
 ok(E.g.effects.some(e=>e&&e.r945Sentinel),'할 일이 있으면 그리기 표지 등록');E.sheets.length=0;E.frame();
 ok(E.sheets.some(s=>/hwando-q-wind-blade/.test(s.src||'')),'검기는 Dots 검풍 시트(드라이브 출처)를 흑백으로 다시 씀');
 ok(E.sheets.some(s=>/brightness\(0\.[0-2]/.test(s.filter||''))&&E.sheets.some(s=>/grayscale\(1\)/.test(s.filter||'')),'먹(검정) 층 + 흰 층 두 겹');
 E.run(3);ok(!E.g.effects.some(e=>e&&e.r945Sentinel),'끝나면 표지 뺌');}

// ---- 생존 배치 영웅(R720): 몸마다 따로 ----
{const E=engine({enemies:[{id:'a',x:22,y:20},{id:'b',x:30,y:30}]});const main=E.g.player;
 const ally={x:30,y:29,hp:100,hero:'hwando',direction:'right',attackCD:0,specialCD:0,attackAnim:0,r720Ally:true};E.g.__allies=[ally];
 E.g.player=ally;E.api.force('clones');E.ctx.basicAttack();E.g.player=main;E.run(.4);
 ok(E.api.inspect(ally).clones.length===7&&E.api.inspect(main).clones.length===0,'배치 영웅이 부른 분신은 그 몸 것(조종 영웅과 섞이지 않음)');
 E.heroDraws.length=0;E.ctx.drawHero();ok(E.heroDraws.length===1,'조종 영웅 그리기에는 배치 영웅 분신 없음');
 E.g.player=ally;E.heroDraws.length=0;E.ctx.drawHero();ok(E.heroDraws.length===15&&E.heroDraws.every(d=>d.body===ally),'배치 영웅 그리기에 자기 분신 7');E.g.player=main;
 ok(E.api.inspect(ally).clones.every(c=>Math.hypot(c.x-30,c.y-30)<=1.6),'배치 영웅 분신은 그 영웅 곁 적 주변');
 // 조종 영웅의 검기 대기 시간은 배치 영웅과 따로
 E.api.force('moon');E.ctx.basicAttack();E.run(.1);ok(E.api.inspect(main).stats.moons===1&&E.api.inspect(ally).cd.moon===0,'대기 시간·통계 몸마다 따로');}
// 지역 바꾸면 모두 정리
{const E=engine({enemies:[{id:'a',x:22,y:20}]});E.api.force('clones');E.ctx.basicAttack();E.run(.2);E.ctx.enterRegion();ok(E.api.inspect().clones.length===0,'지역 들어갈 때 정리');}
console.log('\nR945 CPU 검사 '+n+'개 통과');
