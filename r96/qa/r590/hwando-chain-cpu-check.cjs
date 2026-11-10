// R590 환도 검술 연계(키 추가 없음) — CPU 검사(정적 + 가짜 엔진 행동).
//  node r96/qa/r590/hwando-chain-cpu-check.cjs
//  A 납도 발검 · Q→은빛 검풍 · E→유영 일섬 · R 칠연 환수검→종섬. 벽·맵 밖·협동·끄기·상한·같은 시전 한 번.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='hwando-chain-r590.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적 ----
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2&&/<script src="\.\/hwando-chain-r590\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*\s*<script src="\.\/combat-r118\.js">/.test(html),'index.html 스크립트 태그 한 번(combat-r118 앞)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r590\/hwando-chain-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/벽력|霹靂|雷の呼吸|천본앵|히텐|飛天/.test(src),'다른 작품 기술 이름을 쓰지 않음');
ok(!/'rune'|'runecross'|'cross'/.test(code),'상징 규칙: 룬·십자 문양을 새로 그리지 않음(검 이펙트만)');
{const L=['hwando-wind-tornado','hwando-iai-ring','hwando-a-draw-cut','hwando-q-wind-blade','hwando-e-delayed-flash','hwando-r-finale-draw','hwando-sigil-back','hwando-sigil-front'];ok(!/new Image\(|\.png'/.test(code)&&(code.match(/\.webp'/g)||[]).length===8&&L.every(n=>code.includes("'assets/r590/"+n+".webp'")),'그림 자산은 assets/r590 시트 8장(R590b 2장 + Dots CX-0062HW 4장 + CX-0064T 문양 2장)만');}

// ---- 가짜 엔진 ----
// 벽: 14<x<15.5 (세로 벽), 맵: 1..N-1, N=40
function engine({coop=null,enemies=[],hero='hwando',lowFx=false,px=20,py=20,ready=false}={}){
 const hits=[],draws=[],floats=[];let clock=10;const N=40;
 const room={id:'room1',props:[],enemies:enemies.map(e=>({radius:.3,hp:1000,maxHp:1000,...e}))};
 const W={};const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Set,Map,WeakMap,WeakSet,Array,Object,String,Number,Error,
  get time(){return clock;},TILE:32,zoom:1,N,room,zone:'z1',settings:{lowFx},effects:[],started:true,modal:false,loading:false,
  player:{x:px,y:py,hp:100,hero,direction:'e',attackCD:0,specialCD:0,combo:0},target:null,
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>g.room.enemies.filter(e=>e.hp>0),damageable3:()=>true,
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>N-1||y+r>N-1||(x+r>14&&x-r<15.5),
  attackPower:()=>100,
  hitEnemy:(e,v,s)=>{hits.push({id:e.id,v,s});e.hp-=v;return true;},floatText:(t)=>floats.push(t),
  nearestEnemy:(r)=>{let b=null,bd=1e9;for(const e of g.room.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-g.player.x,e.y-g.player.y);if(d<=r&&d<bd){bd=d;b=e;}}return b;},
  storyAim22:()=>0,
  fx:()=>{},drawEffect:()=>{},tick:()=>{},enterRegion:async()=>true,sound:()=>{},
  // 기본 공격: CD 가 0 이면 공격력을 그 자리에서 읽어 한 번 때린다(엔진처럼 동기)
  basicAttack(force=false){const p=g.player;if(p.hp<=0||p.attackCD>0)return;const e=g.nearestEnemy(3.15);if(!e&&!force)return;p.combo++;p.attackCD=.48;const pw=g.attackPower();if(e)g.hitEnemy(e,pw,{kind:'basic',friendly:true});},
  special(){const p=g.player;if(p.hp<=0||p.specialCD>0)return;p.specialCD=10;const pw=g.attackPower()*2.4;const e=g.nearestEnemy(3.15);if(e)g.hitEnemy(e,pw,{kind:'special',friendly:true});},
  readyImage:(pth)=>g.__ready&&g.__ready.has(pth)?{ready:true,image:{src:pth,width:1152,height:768}}:null,ensureImages:(l)=>{(g.__asked||(g.__asked=[])).push(...l);return Promise.resolve();},
  ctx:{commands:[],save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(im,sx,sy){if(im&&im.src){const nm=im.src.split('/').pop();draws.push('sheet:'+nm);if(this.filter&&this.filter!=='none')(g.__flt||(g.__flt=[])).push(this.filter);(g.__fr||(g.__fr=[])).push([nm,Math.floor(sx/(nm.includes('ring')||nm.includes('tornado')?192:256))+6*Math.floor(sy/(nm.includes('ring')||nm.includes('tornado')?192:256))]);}},globalAlpha:1,globalCompositeOperation:'source-over',filter:'none'}};
 const OLD=['assets/r590/hwando-wind-tornado.webp','assets/r590/hwando-iai-ring.webp'],NEW=['hwando-a-draw-cut','hwando-q-wind-blade','hwando-e-delayed-flash','hwando-r-finale-draw','hwando-sigil-back','hwando-sigil-front'].map(n=>'assets/r590/'+n+'.webp');
 if(ready)g.__ready=new Set(ready==='b'?OLD:[...OLD,...NEW]);
 g.clearLine=(a,b,r)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(1,Math.ceil(d/.24));for(let i=1;i<=k;i++)if(g.blocked(a.x+(b.x-a.x)*i/k,a.y+(b.y-a.y)*i/k,.29))return false;return true;};
 W.__STORYWORLD_FX_SPRITES_R106__={on:()=>true,warm(){},draw:(nm)=>{draws.push(nm);return true;},along:(nm)=>{draws.push(nm);return true;}};
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});
 const api=W.__STORYWORLD_HWANDO_CHAIN_R590__;
 const adv=(dt)=>{clock+=dt;ctx.player.attackCD=Math.max(0,ctx.player.attackCD-dt);ctx.player.specialCD=Math.max(0,ctx.player.specialCD-dt);ctx.tick(dt);};
 const run=(sec,dt=.033)=>{for(let t=0;t<sec;t+=dt)adv(dt);};
 const frame=()=>{draws.length=0;const s=g.effects.find(e=>e&&e.r590Sentinel);if(s)ctx.drawEffect(s);return draws.length;};
 return {g,ctx,api,hits,draws,floats,adv,run,frame,setClock:v=>{clock=v;}};
}
const flight=(E,id,ox,oy,tx,ty)=>E.ctx.fx('storySourceSkill',ox,oy,{storyWER:true,sourceHero:'hwando',sourceSlot:'e',stage:'flight',castId:id,tx,ty,visualWorldAngle35:Math.atan2(ty-oy,tx-ox)});
const wave=(E,id,x=20,y=20,ang=0)=>E.ctx.fx('storySourceSkill',x,y,{storyWER:true,sourceHero:'hwando',sourceSlot:'r',stage:'release',castId:id,size:3.3,visualWorldAngle35:ang});

{const E=engine();const A=E.api;ok(A&&typeof A.inspect==='function'&&A.on(),'전역 __STORYWORLD_HWANDO_CHAIN_R590__ 켜짐');
 ok(A.config.sheathIdle>=1.5&&A.config.sheathIdle<=3&&A.config.drawMult>1&&A.config.drawMult<=1.6,'발도 설정: 쉬는 시간 1.5~3초, 배율 1~1.6');}

// ---- A 납도 발검 ----
{const E=engine({enemies:[{id:'a',x:21,y:20}]});
 E.ctx.basicAttack();ok(E.hits.length===1&&Math.abs(E.hits[0].v-100*E.api.config.drawMult)<1e-9,'처음(칼집 상태) 기본 공격 = 발도, 공격력 ×'+E.api.config.drawMult);
 E.run(.5);E.ctx.basicAttack();ok(E.hits.length===2&&E.hits[1].v===100,'바로 이어 친 두 번째는 보통 피해');
 E.run(.6);E.ctx.basicAttack();ok(E.hits[2].v===100,'쉬는 시간이 짧으면(1.1초) 발도 아님');
 E.run(E.api.config.sheathIdle+.1);E.ctx.basicAttack();ok(Math.abs(E.hits[3].v-100*E.api.config.drawMult)<1e-9,'다시 칼을 거둔 뒤(쉬는 시간 넘김) 발도 다시');
 ok(E.api.inspect().stats.draws===2,'발도 횟수 2');
 E.ctx.player.attackCD=0;E.adv(.001);ok(E.ctx.attackPower()===100,'호출 밖 공격력은 그대로(배율 새지 않음)');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.ctx.player.attackCD=.3;E.ctx.basicAttack();ok(E.hits.length===0,'쿨다운 중 누른 공격은 실패');
 E.run(.31);E.ctx.basicAttack();ok(Math.abs(E.hits[0].v-100*E.api.config.drawMult)<1e-9,'실패한 누름은 발도를 쓰지 않음(다음 성공에 발도)');}
{const E=engine({enemies:[{id:'a',x:21,y:20}],hero:'slayer'});E.ctx.basicAttack();ok(E.hits[0].v===100,'다른 영웅(슬레이어)은 발도 없음');}
{const E=engine({enemies:[{id:'a',x:21,y:20}]});E.g.window.__STORYWORLD_EGO151__={inspect:()=>({state:{active:true}})};E.ctx.basicAttack();ok(E.hits[0].v===100,'EGO 각성 중에는 발도 없음');}
{const E=engine({enemies:[]});E.ctx.basicAttack();ok(E.api.inspect().stats.draws===0,'적이 없어 공격이 안 나가면 발도 소모 없음');}

// ---- Q → 은빛 검풍 ----
{const E=engine({enemies:[{id:'q1',x:23,y:20},{id:'q2',x:25.5,y:20},{id:'off',x:23,y:24}]});
 E.ctx.special();const base=E.hits.length;ok(base===0||E.hits[0].s.kind==='special','Q 본 기술은 그대로');
 E.run(.3);ok(E.api.inspect().blades.length===0,'검풍은 연참 뒤(0.3초엔 아직 없음)');
 E.run(.4);ok(E.api.inspect().blades.length===E.api.config.windCount,'연참 뒤 검풍 '+E.api.config.windCount+'개 자동 발사');
 E.run(1.2);const w=E.hits.filter(h=>h.s.r590==='wind');const ids=[...new Set(w.map(h=>h.id))].sort();
 ok(ids.includes('q1')&&ids.includes('q2')&&!ids.includes('off'),'검풍은 꿰뚫어 일직선 적 둘을 베고 옆 적은 안 벰: '+ids);
 ok(w.filter(h=>h.id==='q1').length<=E.api.config.windCount,'한 검풍이 한 적을 한 번만');
 ok(w.every(h=>Math.abs(h.v-100*E.api.config.windMult)<1e-9&&h.s.friendly&&h.s.owner==='hero'&&h.s.sourceHero==='hwando'&&h.s.attackKind9==='skill'),'검풍 피해 = 공격력×'+E.api.config.windMult+', 영웅 기술 피해 경로');
 ok(E.api.inspect().blades.length===0,'사거리 끝에서 사라짐');}
{const E=engine({enemies:[{id:'near',x:13,y:20},{id:'behind',x:17,y:20}],px:12,py:20});
 E.ctx.player.x=12;E.ctx.special();E.run(1.6);const w=E.hits.filter(h=>h.s.r590==='wind').map(h=>h.id);
 ok(w.includes('near')&&!w.includes('behind'),'검풍은 벽(14~15.5)에서 멈춤 — 벽 너머 적은 안 벰: '+w);
 ok(E.api.inspect().blades.length===0&&E.api.inspect().stats.wallStops>=1,'벽에 닿은 검풍은 바로 사라짐(벽 정지 '+E.api.inspect().stats.wallStops+')');}
{const E=engine({enemies:[{id:'edge',x:38.2,y:20}],px:37,py:20});E.ctx.special();E.run(1.6);
 const st=E.api.inspect();ok(st.blades.length===0&&st.stats.errors===0,'맵 끝(N-1)에서 검풍이 맵 밖으로 나가지 않고 사라짐, 오류 0');}
{const E=engine({enemies:[{id:'q1',x:23,y:20}]});E.ctx.player.specialCD=3;E.ctx.special();E.run(1);ok(E.api.inspect().stats.winds===0,'쿨다운 중 Q 실패 → 검풍 없음');}
{const E=engine({enemies:[{id:'q1',x:23,y:20}]});for(let i=0;i<6;i++){E.ctx.player.specialCD=0;E.ctx.special();E.run(.6);}
 ok(E.api.inspect().blades.length<=E.api.config.maxBlades,'검풍 동시 상한 '+E.api.config.maxBlades+' (지금 '+E.api.inspect().blades.length+')');}

// ---- E → 유영 일섬 ----
{const E=engine({enemies:[{id:'on',x:22,y:20.3},{id:'off',x:22,y:22.5}]});
 flight(E,'wer:e1',20,20,23.8,20);E.run(.2);ok(E.hits.length===0,'일섬은 지나간 뒤 늦게(0.2초엔 아직)');
 E.run(.3);const h=E.hits.filter(h=>h.s.r590==='flash');ok(h.length===1&&h[0].id==='on','지나간 길 위 적만 늦게 갈라짐');
 ok(Math.abs(h[0].v-100*E.api.config.flashMult)<1e-9,'일섬 피해 = 공격력×'+E.api.config.flashMult);
 flight(E,'wer:e1',20,20,23.8,20);E.run(.6);ok(E.hits.filter(h=>h.s.r590==='flash').length===1,'같은 시전(castId)은 한 번만');}
{const E=engine({enemies:[{id:'x',x:20,y:20.2}]});flight(E,'wer:e0',20,20,20,20);E.run(.6);ok(E.hits.length===0,'움직이지 못한 대시(길이 0)는 일섬 없음');}
{const E=engine({enemies:[{id:'w',x:14.3,y:20}]});flight(E,'wer:ew',12,20,13.7,20);E.run(.6);
 ok(E.hits.length===0,'벽 속/너머 적은 일섬 피해 없음(clearLine)');}
{const E=engine({enemies:[{id:'on',x:22,y:20.3}]});flight(E,'wer:e2',20,20,23.8,20);E.g.room={id:'other',props:[],enemies:[]};E.ctx.room=E.g.room;E.run(.6);ok(E.hits.length===0,'방이 바뀌면 늦은 일섬 취소');}
{const E=engine({enemies:[{id:'on',x:22,y:20.3}]});E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'e',stage:'flight',castId:'wer:nan',tx:NaN,ty:20});E.run(.6);ok(E.hits.length===0&&E.api.inspect().stats.errors===0,'좌표가 이상하면 무시(오류 없이)');}

// ---- R 칠연 환수검 → 종섬 ----
{const E=engine({enemies:[{id:'r1',x:24,y:20},{id:'r2',x:20,y:24}]});
 for(let i=0;i<6;i++){wave(E,'wer:r1');E.run(.14);}ok(E.hits.filter(h=>h.s.r590==='finale').length===0,'6파까지는 종섬 없음');
 ok(E.api.inspect().stats.waves===6,'파 수 세기(6)');
 wave(E,'wer:r1');E.run(.15);ok(E.hits.filter(h=>h.s.r590==='finale').length===0,'7파 직후 잠깐 멈춤(납도) — 아직 종섬 없음');
 E.run(.4);const f=E.hits.filter(h=>h.s.r590==='finale');ok(f.length===1&&f[0].id==='r1','7파 뒤 가까운 적 쪽 일직선 종섬: '+f.map(h=>h.id));
 ok(Math.abs(f[0].v-100*E.api.config.finaleMult)<1e-9,'종섬 피해 = 공격력×'+E.api.config.finaleMult);
 wave(E,'wer:r1');E.run(.6);ok(E.hits.filter(h=>h.s.r590==='finale').length===1,'같은 시전은 종섬 한 번만(8번째 신호 무시)');}
{const E=engine({enemies:[{id:'near',x:13.3,y:20},{id:'beyond',x:17,y:20}],px:12,py:20});for(let i=0;i<7;i++)wave(E,'wer:rw',12,20);E.run(.7);
 const f=E.hits.filter(h=>h.s.r590==='finale').map(h=>h.id);ok(!f.includes('beyond'),'종섬 칼길은 벽에서 끊김 — 벽 너머 적 없음: '+f);
 const L=E.api.inspect().lastFinale;ok(L&&L.x1<14&&!E.g.blocked(L.x1,L.y1,.2),'종섬 끝점은 벽 앞 빈칸 ('+(L&&L.x1.toFixed(2))+')');}
{const E=engine({enemies:[],px:38,py:20});E.ctx.player.x=38;for(let i=0;i<7;i++)wave(E,'wer:redge',38,20,0);E.run(.7);
 const L=E.api.inspect().lastFinale;ok(L&&L.x1<=E.g.N-1&&!E.g.blocked(L.x1,L.y1,.2)&&E.api.inspect().stats.errors===0,'맵 끝에서 종섬 칼길이 맵 밖으로 안 나감');
 ok(E.ctx.player.x===38&&E.ctx.player.y===20,'종섬은 영웅을 옮기지 않음(벽 통과·맵 이탈 없음)');}
{const E=engine({enemies:[{id:'r1',x:24,y:20}]});for(let i=0;i<7;i++)wave(E,'wer:r9');E.ctx.player.hp=0;E.run(.7);ok(E.hits.length===0,'쓰러지면 종섬 취소');}

// ---- 협동·끄기·다른 영웅 ----
{const E=engine({coop:'host',enemies:[{id:'a',x:21,y:20.2},{id:'q1',x:23,y:20}]});E.ctx.special();E.run(1.2);flight(E,'wer:c',20,20,23.8,20);E.run(.6);for(let i=0;i<7;i++)wave(E,'wer:cr');E.run(.7);
 ok(E.hits.every(h=>!h.s.r590),'협동(R62 mode≠off): 연계 피해 없음');}
{const E=engine({enemies:[{id:'a',x:21,y:20.2},{id:'q1',x:23,y:20}]});E.api.set(false);E.ctx.basicAttack();E.ctx.special();E.run(1.2);flight(E,'wer:o',20,20,23.8,20);E.run(.6);for(let i=0;i<7;i++)wave(E,'wer:or');E.run(.7);
 ok(E.hits.every(h=>!h.s.r590)&&E.hits[0].v===100,'끄면 예전 그대로');}
{const E=engine({hero:'slayer',enemies:[{id:'q1',x:23,y:20}]});E.ctx.special();E.run(1.2);ok(E.api.inspect().stats.winds===0,'다른 영웅 Q 는 검풍 없음');}

// ---- 그리기·상한(렉) ----
{const E=engine({enemies:[{id:'q1',x:23,y:20},{id:'r1',x:24,y:20}]});
 E.ctx.basicAttack();E.ctx.special();E.run(.6);flight(E,'wer:d',20,20,23.8,20);for(let i=0;i<7;i++){wave(E,'wer:dr');E.run(.05);}
 let mx=0;for(let i=0;i<40;i++){E.adv(.033);mx=Math.max(mx,E.frame());}
 ok(mx>0&&mx<=E.api.config.maxDraws,'모든 연계가 한꺼번에 겹쳐도 한 프레임 그리기 ≤ '+E.api.config.maxDraws+' (최대 '+mx+')');
 ok(E.draws.length>=0&&E.api.inspect().stats.errors===0,'그리기 오류 0');}
{const E=engine({enemies:[{id:'q1',x:23,y:20},{id:'r1',x:24,y:20}]});// 몰아치기: Q 여러 번 + R 세 번 + E 세 번이 한 순간에
 for(let k=0;k<4;k++){E.ctx.player.specialCD=0;E.ctx.special();}E.run(.75);for(let k=0;k<3;k++){flight(E,'wer:s'+k,20,20,23.8,20);for(let i=0;i<7;i++)wave(E,'wer:sr'+k);}
 let mx=0;for(let i=0;i<20;i++){E.adv(.02);mx=Math.max(mx,E.frame());}ok(mx<=E.api.config.maxDraws&&E.api.inspect().vis<=E.api.config.maxVis,'몰아쳐도 그리기 ≤ '+E.api.config.maxDraws+'(최대 '+mx+')·그림 목록 ≤ '+E.api.config.maxVis);
 ok(E.api.inspect().stats.budgetSkips>0,'상한을 넘는 조각은 건너뜀(건너뜀 '+E.api.inspect().stats.budgetSkips+')');}
{const E=engine({lowFx:true,enemies:[{id:'q1',x:23,y:20}]});E.ctx.special();E.run(.6);let lo=0;for(let i=0;i<10;i++){E.adv(.033);lo=Math.max(lo,E.frame());}
 const E2=engine({enemies:[{id:'q1',x:23,y:20}]});E2.ctx.special();E2.run(.6);let hi=0;for(let i=0;i<10;i++){E2.adv(.033);hi=Math.max(hi,E2.frame());}
 ok(lo>0&&lo<hi,'저사양(lowFx) 모드는 그리기를 줄임('+lo+' < '+hi+')');}
{const E=engine({enemies:[]});E.run(1);ok(!E.g.effects.some(e=>e&&e.r590Sentinel),'할 일이 없으면 그리기 표지를 effects 에서 뺌');}

// ---- R590b: 드라이브 색 바꾼 시트(칼바람 회오리·발도 착지 고리) ----
for(const a of ['hwando-wind-tornado.webp','hwando-iai-ring.webp','hwando-a-draw-cut.webp','hwando-q-wind-blade.webp','hwando-e-delayed-flash.webp','hwando-r-finale-draw.webp','hwando-sigil-back.webp','hwando-sigil-front.webp']){const f=path.join(R,'runtime-text','assets','r590',a);ok(fs.existsSync(f)&&fs.statSync(f).size<250000,'시트 '+a+' 있음, 250KB 미만');
 ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes('assets/r590/'+a),'manifest 에 '+a);}
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("assets/r590/"),'verify-r96-public.py 가 assets/r590/ 확인');
{const E=engine({ready:'b',enemies:[{id:'q1',x:23,y:20}]});E.ctx.special();E.run(.62);E.frame();
 ok(E.draws.includes('sheet:hwando-wind-tornado.webp'),'시트가 준비되면 검풍은 은빛 회오리 시트로 그림');
 const E2=engine({ready:true,enemies:[{id:'a',x:21,y:20}]});E2.ctx.basicAttack();E2.adv(.05);E2.frame();ok(E2.draws.includes('sheet:hwando-iai-ring.webp'),'발도 순간 발밑 착지 고리 시트');
 const E3=engine({ready:true,enemies:[{id:'r1',x:24,y:20}]});for(let i=0;i<7;i++)wave(E3,'wer:rs');E3.run(.36);E3.frame();ok(E3.draws.includes('sheet:hwando-iai-ring.webp'),'종섬 끝자리에도 고리');}
{const E=engine({ready:false,enemies:[{id:'q1',x:23,y:20}]});E.ctx.special();E.run(.62);E.frame();
 ok(!E.draws.some(d=>String(d).startsWith('sheet:'))&&E.draws.includes('slash')&&(E.g.__asked||[]).some(p=>/r590\/hwando-wind-tornado/.test(p)),'시트가 아직 없으면 코드 그림으로 대신하고 불러오기를 요청');}
{const E=engine({ready:true,enemies:[{id:'q1',x:23,y:20},{id:'r1',x:24,y:20}]});for(let k=0;k<4;k++){E.ctx.player.specialCD=0;E.ctx.special();}E.run(.75);for(let k=0;k<3;k++){flight(E,'wer:t'+k,20,20,23.8,20);for(let i=0;i<7;i++)wave(E,'wer:tr'+k);}
 let mx=0;for(let i=0;i<20;i++){E.adv(.02);mx=Math.max(mx,E.frame());}ok(mx<=E.api.config.maxDraws,'시트를 써도 한 프레임 그리기 ≤ '+E.api.config.maxDraws+'(최대 '+mx+')');}

// ---- R590d: Dots CX-0062HW 시트 4장(발도·검풍·일섬·종섬) ----
{const E=engine({ready:true,enemies:[{id:'q1',x:23,y:20}]});E.ctx.special();E.run(.62);E.frame();
 ok(E.draws.includes('sheet:hwando-q-wind-blade.webp')&&!E.draws.includes('sheet:hwando-wind-tornado.webp')&&!E.draws.includes('slash'),'Dots 시트가 있으면 검풍은 HW-02 칼바람 시트 한 장으로(회오리·코드 선 대신)');}
{const E=engine({ready:true,enemies:[{id:'a',x:21,y:20}]});E.ctx.basicAttack();E.adv(.06);E.g.__fr=[];E.frame();const f=E.g.__fr.find(x=>x[0]==='hwando-a-draw-cut.webp');
 ok(f&&!E.draws.includes('slashline'),'발도는 HW-01 발도 시트(코드 빛줄 없음)');ok(f&&f[1]>=4&&f[1]<=6,'발도 시트는 맞는 프레임 5 근처부터 재생(지금 '+(f&&f[1])+')');}
{const E=engine({ready:true,enemies:[{id:'e1',x:22,y:20.2}]});flight(E,'wer:se',20,20,23.8,20);E.adv(.05);E.g.__fr=[];E.frame();const a=E.g.__fr.find(x=>x[0]==='hwando-e-delayed-flash.webp');
 ok(a&&a[1]<7,'일섬: 피해 전에는 HW-03 금이 번지는 앞 프레임(지금 '+(a&&a[1])+')');
 let fr=null;for(let i=0;i<20&&!E.hits.some(h=>h.s.r590==='flash');i++)E.adv(.02);E.g.__fr=[];E.frame();fr=E.g.__fr.find(x=>x[0]==='hwando-e-delayed-flash.webp');
 ok(fr&&fr[1]>=6&&fr[1]<=8,'일섬 피해 순간 = HW-03 맞는 프레임 7 근처(지금 '+(fr&&fr[1])+')');ok(!E.draws.includes('iai-cut'),'일섬은 코드 칼자국 대신 시트');}
{const E=engine({ready:true,enemies:[{id:'r1',x:24,y:20}]});for(let i=0;i<6;i++)wave(E,'wer:rd');E.adv(.02);E.frame();ok(E.draws.includes('sheet:hwando-a-draw-cut.webp')&&!E.draws.includes('iai-cut'),'일곱 파 베기 선도 발도 시트를 돌려 씀');
 wave(E,'wer:rd');E.adv(.1);E.g.__fr=[];E.frame();const c=E.g.__fr.find(x=>x[0]==='hwando-r-finale-draw.webp');ok(c&&c[1]<4,'7파 뒤 납도 0.3초 동안 HW-04 기운 모임(프레임 0~3, 지금 '+(c&&c[1])+')');
 for(let i=0;i<20&&!E.hits.some(h=>h.s.r590==='finale');i++)E.adv(.02);E.adv(.05);E.g.__fr=[];E.frame();const f=E.g.__fr.find(x=>x[0]==='hwando-r-finale-draw.webp');
 ok(f&&f[1]>=4&&f[1]<=6,'종섬 피해 직후 = HW-04 맞는 프레임 5 근처(지금 '+(f&&f[1])+')');}
{const E=engine({ready:true,enemies:[{id:'q1',x:23,y:20},{id:'r1',x:24,y:20}]});for(let k=0;k<4;k++){E.ctx.player.specialCD=0;E.ctx.special();}E.run(.75);for(let k=0;k<3;k++){flight(E,'wer:u'+k,20,20,23.8,20);for(let i=0;i<7;i++)wave(E,'wer:ur'+k);}
 let mx=0;for(let i=0;i<30;i++){E.adv(.02);mx=Math.max(mx,E.frame());}ok(mx<=E.api.config.maxDraws,'Dots 시트로도 한 프레임 그리기 ≤ '+E.api.config.maxDraws+'(최대 '+mx+')');}

{const mk=lo=>{const E=engine({ready:true,lowFx:lo,enemies:[{id:'r1',x:24,y:20}]});for(let i=0;i<7;i++)wave(E,'wer:ink');for(let i=0;i<20&&!E.hits.some(h=>h.s.r590==='finale');i++)E.adv(.02);E.adv(.04);E.g.__flt=[];E.frame();return E;};
 const A=mk(false),B=mk(true);ok(A.g.__flt.length>0&&A.g.__flt.every(f=>/^brightness\([0-9.]+\)$/.test(f))&&A.g.__flt.includes('brightness(0.18)'),'먹 받침은 brightness 필터만 씀('+[...new Set(A.g.__flt)]+')');ok(!B.g.__flt.includes('brightness(0.18)'),'저사양에서는 먹 받침 생략');}

// ---- CX-0064T 수묵 문양: R572 환도 몸 둘레 문양을 시트로 ----
{const mk=(ready)=>{const E=engine({ready,enemies:[]});const calls=[];const T={name:'묵화 검무',draw(L){calls.push('code:'+L);}};E.g.window.__STORYWORLD_SAMONG_THEME_R572__={theme:h=>h==='hwando'?T:null};E.adv(.02);return {E,T,calls};};
 const A=mk(true);A.E.g.__fr=[];A.T.draw('back',300,200,70,{},A.E.ctx.time,1,false);A.T.draw('front',300,200,70,{},A.E.ctx.time,1,false);
 ok(A.calls.length===0&&A.E.draws.includes('sheet:hwando-sigil-back.webp')&&A.E.draws.includes('sheet:hwando-sigil-front.webp'),'사몽 문양: 시트가 있으면 뒤·앞층 모두 Dots 수묵 문양 시트로 그림');
 const B=mk('b');B.T.draw('back',300,200,70,{},B.E.ctx.time,1,false);ok(B.calls.includes('code:back'),'문양 시트가 아직 없으면 R572 코드 문양 그대로');
 const C=mk(true);C.E.api.set(false);C.T.draw('front',300,200,70,{},C.E.ctx.time,1,false);ok(C.calls.includes('code:front'),'연계를 끄면 문양도 R572 원래 그림');
 const D=mk(true);const d0=D.T.draw;D.E.adv(.02);D.E.adv(.02);ok(D.T.draw===d0,'문양 감싸기는 한 번만');}

// ---- R571 사몽 발현 배수: 연계 자체 틱의 사거리·반경만 ×1.77, 상한 그대로 ----
{const mk=on=>{const E=engine({enemies:[{id:'n',x:22,y:20},{id:'far',x:28.6,y:20}]});E.g.window.__STORYWORLD_SAMONG_SURGE_R571__={active:()=>on,range:r=>on?r*1.77:r,cd:s=>on?s*.23:s};return E;};
 const A=mk(false);A.ctx.special();A.run(1.6);const B=mk(true);B.ctx.special();B.run(1.6);
 const hw=E=>E.hits.filter(h=>h.s.r590==='wind').map(h=>h.id);
 ok(!hw(A).includes('far')&&hw(B).includes('far'),'사몽 발현 중 검풍 사거리 ×1.77(6칸 너머 적까지): 평소 '+hw(A)+' / 발현 '+hw(B));
 ok(B.ctx.player.specialCD===A.ctx.player.specialCD,'쿨은 연계가 다시 줄이지 않음(엔진 몫)');
 const C=mk(false),D=mk(true);for(const E of [C,D]){for(let i=0;i<7;i++)wave(E,'wer:sg');E.run(.6);}
 const hf=E=>E.hits.filter(h=>h.s.r590==='finale').map(h=>h.id);
 ok(!hf(C).includes('far')&&hf(D).includes('far'),'사몽 발현 중 종섬 길이 ×1.77: 평소 '+hf(C)+' / 발현 '+hf(D));
 const S=mk(true);for(let k=0;k<6;k++){S.ctx.player.specialCD=0;S.ctx.special();}S.run(.9);ok(S.api.inspect().blades.length<=S.api.config.maxBlades,'발현 중에도 칼바람 상한 '+S.api.config.maxBlades+' 유지');
 const X=mk(true);X.g.window.__STORYWORLD_SAMONG_SURGE_R571__={range:()=>{throw new Error('x');}};X.ctx.special();X.run(1);ok(hw(X).includes('n'),'배수 API 오류가 나도 평소 값으로 동작');}

console.log('R590 hwando chain CPU check: '+n+' passed');
