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
 // R978(사용자 11-13 01:51Z 동작 변경): 적 곁에 흩어지던 분신이 이제 영웅 둘레 7방향 경호 자리에 선다
 const P0=E.g.player,ds=I.clones.map(c=>Math.hypot(c.x-P0.x,c.y-P0.y)),as=I.clones.map(c=>Math.atan2(c.y-P0.y,c.x-P0.x)).sort((a,b)=>a-b);
 /* R1034(사용자 11-14 동작 변경): 경호 원 2→4칸, 분신마다 제자리 중심 4칸 행동 원 안 적에게 달려가 싸움 */const hs=I.clones.map(c=>Math.hypot(c.home.x-P0.x,c.home.y-P0.y)),ha=I.clones.map(c=>Math.atan2(c.home.y-P0.y,c.home.x-P0.x)).sort((a,b)=>a-b);
 ok(hs.every(d=>d>=.8&&d<=4.05)&&I.clones.every(c=>Math.hypot(c.x-c.home.x,c.y-c.home.y)<=4+1.2),'분신 제자리는 영웅 둘레 4칸(R1034), 분신은 제자리 행동 원(4칸) 안');ok(ha.every((a,i)=>i===0||a-ha[i-1]>.5),'분신 7체 제자리가 7방향으로 고르게 둘러섬(한쪽에 안 뭉침)');
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
{const E=engine({enemies:[{id:'a',x:30,y:20}]});const near0=E.g.nearestEnemy;E.g.nearestEnemy=()=>({id:'ghost',x:21,y:20,hp:1});E.api.force('clones');E.ctx.basicAttack();E.run(.1);const I=E.api.inspect();ok(I.clones.length===0&&I.cd.clones===0&&I.stats.noTarget===1,'둘레에 적이 없어 칠묵영이 안 나가면 대기 시간을 쓰지 않음');
 E.api.force('trio');E.run(.5);E.ctx.basicAttack();E.run(.1);const J=E.api.inspect();ok(J.stats.trios===0&&J.cd.trio===0&&J.stats.noTarget===2,'삼협묵희도 대상이 없으면 대기 시간을 쓰지 않음');
 E.g.nearestEnemy=near0;E.g.room.enemies[0].x=21;E.run(.5);E.api.force('clones');E.ctx.basicAttack();E.run(.2);const K=E.api.inspect();ok(K.clones.length===7&&K.cd.clones>6,'적이 다가오면 칠묵영 정상 발동·대기 시간 7초');}
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

// ---- ③ 그림: Dots 난초 흑백검 베기(HI-05) + 먹 붓 획(HI-07), 부적·매화·낙관 코드 그림 없음(사용자 11-12 14:13Z) ----
{const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..','runtime-text');
 ok(fs.existsSync(path.join(R,'assets/r945/hwando-orchid-slash.webp'))&&fs.existsSync(path.join(R,'assets/r945/hwando-ink-sweep.webp')),'Dots 난초 베기·붓 획 시트 파일 있음');
 ok(!/charmTex|plumTex|sealTex/.test(code),'부적·매화·낙관 코드 그림 없앰');
 const foes=[];for(let i=0;i<7;i++)foes.push({id:'m'+i,x:20+Math.cos(i)*2,y:20+Math.sin(i)*2});
 const E=engine({enemies:foes});const Q=E.api.config.trio;E.api.force('trio');E.ctx.basicAttack();E.run(.7);
 E.sheets.length=0;E.frame();ok(E.sheets.filter(s=>/hwando-orchid-slash/.test(s.src||'')).length===7,'표식 적 일곱 발밑에 난초 하나씩');
 const cut=()=>E.hits.filter(h=>h.s?.r945==='trio').length;
 E.run(Q.strikeAt-.7-.45);E.sheets.length=0;E.frame();ok(E.sheets.some(s=>/hwando-ink-sweep/.test(s.src||'')),'세 그림자의 흑백 검 획(붓 획 시트)');
 ok(E.sheets.filter(s=>/hwando-ink-sweep/.test(s.src||'')).every(s=>!s.filter||s.filter==='none'),'붓 획은 한지빛 테두리를 구워 둔 흑백 시트 한 장(필터 없음)');
 ok(cut()===0,'베기 전엔 피해 없음');
 E.run(.6);ok(cut()===7,'난초가 베어지는 순간 표식 적 피해');
 E.sheets.length=0;E.frame();ok(E.sheets.some(s=>/hwando-orchid-slash/.test(s.src||'')),'베어진 꽃잎 흩어짐 칸 이어서 그림');
 ok(E.api.inspect().errors===0,'그리기 오류 0');}

// ---- 합동기 컷인(HI-09 세 사람) ----
{const fakeDoc=()=>{const made=[];const node=tag=>{const n={tag,children:[],attrs:{},cls:new Set(),offsetWidth:1,appendChild(c){this.children.push(c);return c;},setAttribute(k,v){this.attrs[k]=v;},classList:null};n.classList={add:c=>n.cls.add(c),remove:c=>n.cls.delete(c),contains:c=>n.cls.has(c)};made.push(n);return n;};
  return {made,createElement:node,head:node('head'),body:node('body')};};
 for(const k of ['dosa','plum','gat'])ok(fs.existsSync(path.join(R,'runtime-text/assets/r945/hwando-cutin-'+k+'.webp')),'컷인 그림 '+k);
 {const E=engine({enemies:[{id:'a',x:22,y:20}]});const D=fakeDoc();E.g.document=D;E.g.setTimeout=()=>0;E.g.clearTimeout=()=>{};E.api.force('trio');E.ctx.basicAttack();E.run(.1);
  const I=E.api.inspect(),el=D.body.children.find(n=>n.attrs.id==='r945Cutin'||n.id==='r945Cutin');
  ok(I.cutin.shown===1&&el&&el.cls.has('on'),'삼협묵희가 나가면 컷인 한 번');
  ok(el&&el.children.length===3&&el.children.map(c=>c.src).join()==='assets/r945/hwando-cutin-dosa.webp,assets/r945/hwando-cutin-plum.webp,assets/r945/hwando-cutin-gat.webp','컷인 세 사람(도사·매화 의적·삿갓 두령) 차례');
  ok(el&&el.attrs['aria-hidden']==='true','컷인은 화면 읽기에서 숨김');
  E.run(25);E.g.modal=true;E.api.force('trio');E.ctx.basicAttack();E.run(.1);ok(E.api.inspect().cutin.shown===1&&E.api.inspect().cutin.skipped===1,'대화창 중엔 컷인 안 띄움');}
 {const E=engine({enemies:[{id:'a',x:22,y:20}]});const D=fakeDoc();E.g.document=D;E.g.setTimeout=()=>0;E.g.clearTimeout=()=>{};const main=E.g.player;
  const ally={x:20,y:20.5,hp:100,hero:'hwando',direction:'right',attackCD:0,specialCD:0,attackAnim:0,r720Ally:true};E.g.__allies=[ally];
  E.g.player=ally;E.api.force('trio',ally);E.ctx.basicAttack();E.g.player=main;E.run(.1);const I=E.api.inspect(ally);ok(I.stats.trios===1&&I.cutin.shown===0,'생존 배치 영웅 몸이 쓸 땐 컷인 없음(화면 덮지 않게)');}
 {const E=engine({enemies:[{id:'a',x:22,y:20}]});E.api.force('trio');E.ctx.basicAttack();E.run(.1);const I=E.api.inspect();ok(I.stats.trios===1&&I.errors===0,'문서가 없어도 합동기는 그대로');}}

// ---- R978 칠묵영 경호 대형(영웅 둘레 7방향·따라 움직임·파고든 적 끊기) ----
{const E=engine({enemies:[{id:'a',x:22.5,y:20}]});E.api.force('clones');E.ctx.basicAttack();E.run(.3);
 E.g.player.x=24;E.g.player.y=24;E.run(.8);let I=E.api.inspect();const P0=E.g.player;
 ok(I.clones.length===7&&I.clones.every(c=>Math.hypot(c.home.x-P0.x,c.home.y-P0.y)<=4.05&&Math.hypot(c.x-c.home.x,c.y-c.home.y)<=4+1.2),'영웅이 옮겨 가면 분신도 둘레 대형(R1034 4칸) 그대로 따라감');
 ok(I.clones.every(c=>!E.g.blocked(c.x,c.y,.2)),'따라가도 벽 안에 서지 않음');
 const g0=I.stats.guardHits||0,h0=E.hits.filter(h=>h.s?.r945==='clone').length;E.g.room.enemies[0].x=25.2;E.g.room.enemies[0].y=24;E.run(1.5);I=E.api.inspect();
 ok(I.stats.guardHits>g0&&E.hits.filter(h=>h.s?.r945==='clone').length>h0,'영웅이 안 쳐도 경호 자리로 파고든 적은 분신이 스스로 끊음');
 const gh=E.hits.filter(h=>h.s?.r945==='clone').slice(h0);ok(gh.every(h=>Math.abs(h.v-100*E.api.config.clones.mult)<1e-9),'경호 베기도 공격력 × '+E.api.config.clones.mult);
 const g1=I.stats.guardHits;E.run(.5);ok(E.api.inspect().stats.guardHits-g1<=3,'경호 베기는 분신마다 1.2초에 한 번(몰아치지 않음)');
 E.g.room.enemies[0].x=40;E.g.room.enemies[0].y=40;const g2=E.api.inspect().stats.guardHits;E.run(2);ok(E.api.inspect().stats.guardHits===g2,'멀리 있는 적은 경호 베기 안 함');
 E.g.player.x=NaN;E.run(.2);I=E.api.inspect();ok(I.clones.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.y))&&I.errors===0,'영웅 좌표가 NaN 이어도 분신 좌표는 망가지지 않음');}
{const E=engine({enemies:[{id:'a',x:16.8,y:20}],px:16.4,py:20});E.api.force('clones');E.ctx.basicAttack();E.run(.6);const I=E.api.inspect();
 ok(I.clones.length===7&&I.clones.every(c=>!E.g.blocked(c.x,c.y,.2)),'벽 곁에서도 분신은 벽 밖(안쪽으로 당겨 섬)');}
{const E=engine({enemies:[{id:'a',x:21,y:20}],coop:'online'});E.api.force('clones');E.ctx.basicAttack();E.run(1.5);ok((E.api.inspect().stats.guardHits||0)===0,'협동 모드에선 경호 베기 없음');}

// ---- R982 난초 크게·또렷하게(사용자 11-13 02:58Z) ----
{const foes=[];for(let i=0;i<7;i++)foes.push({id:'m'+i,x:20+Math.cos(i)*2,y:20+Math.sin(i)*2});
 const E=engine({enemies:foes});const cx=E.g.ctx;let lastSc=0;const rec=[];const sc0=cx.scale,di0=cx.drawImage;
 cx.scale=function(a,b){lastSc=Math.abs(a);return sc0.call(this,a,b);};cx.drawImage=function(im,...r){rec.push({src:im&&(im.src||''),sc:lastSc,filter:this.filter});return di0.call(this,im,...r);};
 const Q=E.api.config.trio;E.api.force('trio');E.ctx.basicAttack();E.run(1);rec.length=0;E.frame();
 const orc=rec.filter(d=>/hwando-orchid-slash/.test(d.src));const h=60,plantH=228;
 ok(orc.length===7&&orc.every(d=>d.sc*plantH>=h*2.4&&d.sc*plantH<=h*2.8),'난초 높이 = 영웅 키 약 2.6배(이전 1.4배의 약 1.9배)');
 ok(orc.every(d=>/brightness\(1\.5/.test(d.filter||'')&&/contrast\(1\.4/.test(d.filter||'')),'난초 밝기·대비 올림');
 const st=E.api.inspect().stats;E.run(Q.strikeAt-1+.05);ok(E.hits.filter(x=>x.s?.r945==='trio').length===7,'피해 시각·대상은 그대로(1.6초, 표식 7)');
 E.g.ctx.commands=[];const n=[];E.g.ctx.drawImage=function(im,...r){if(/hwando-orchid-slash/.test(im&&im.src||''))this.commands.push({owner:{kind:'effect',id:'x'}});return di0.call(this,im,...r);};E.frame();
 ok(E.g.ctx.commands.length>0&&E.g.ctx.commands.every(c=>c.owner.r350===true),'난초 그림은 영웅 가림 옅게(R350)에서 뺌');
 ok(E.api.inspect().errors===0,'R982 그리기 오류 0');}

// ---- R984 Dots 후보 심사 통과분(HI-02 먹 튐, HI-03 먹 연기) — 그림만 바꿈 ----
ok(fs.existsSync(path.join(R,'runtime-text','assets','r945','hwando-ink-burst.webp'))&&fs.existsSync(path.join(R,'runtime-text','assets','r945','hwando-ink-vapor.webp')),'R984 시트 두 장 있음');
{const E=engine({enemies:[{id:'near',x:21,y:20},{id:'mid',x:24,y:20}]});E.api.force('moon');E.ctx.basicAttack();E.run(.3);E.sheets.length=0;E.frame();
 ok(E.sheets.some(s=>/hwando-ink-burst/.test(s.src||'')),'묵월 적중 먹 튐 = HI-02 시트');
 ok(sumOn(E,'mid','moon').length===1&&Math.abs(sumOn(E,'mid','moon')[0].v-100*E.api.config.moon.mult)<1e-9,'R984 뒤에도 검기 피해·관통 그대로');
 const E2=engine({enemies:[{id:'a',x:22,y:20},{id:'b',x:23,y:21}]});E2.api.force('clones');E2.ctx.basicAttack();E2.run(.2);E2.sheets.length=0;E2.frame();
 ok(E2.sheets.some(s=>/hwando-ink-vapor/.test(s.src||'')),'분신 등장 먹 연기 = HI-03 시트');
 E2.run(E2.api.config.clones.life+.2);E2.sheets.length=0;E2.frame();ok(E2.api.inspect().clones.length===0&&E2.sheets.some(s=>/hwando-ink-vapor/.test(s.src||'')),'분신 퇴장 먹 연기 = HI-03 시트');
 const I=E2.api.inspect();ok(I.sheetDraws.vapor>0&&I.errors===0&&E.api.inspect().sheetDraws.burst>0&&E.api.inspect().errors===0,'R984 그리기 오류 0');}

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
 ok(E.api.inspect(ally).clones.every(c=>Math.hypot(c.home.x-ally.x,c.home.y-ally.y)<=4.05),'배치 영웅 분신은 그 영웅 둘레(R978 경호 자리, R1034 4칸)');
 // 조종 영웅의 검기 대기 시간은 배치 영웅과 따로
 E.api.force('moon');E.ctx.basicAttack();E.run(.1);ok(E.api.inspect(main).stats.moons===1&&E.api.inspect(ally).cd.moon===0,'대기 시간·통계 몸마다 따로');}
// 지역 바꾸면 모두 정리
{const E=engine({enemies:[{id:'a',x:22,y:20}]});E.api.force('clones');E.ctx.basicAttack();E.run(.2);E.ctx.enterRegion();ok(E.api.inspect().clones.length===0,'지역 들어갈 때 정리');}
console.log('\nR945 CPU 검사 '+n+'개 통과');
