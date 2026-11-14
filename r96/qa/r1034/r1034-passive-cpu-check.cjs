// R1034 환도 칠묵영(확률 발동 분신 패시브) 진형 넓히기 + 분신별 행동 반경 — CPU 검사(가짜 엔진 행동).
//  node r96/qa/r1034/r1034-passive-cpu-check.cjs
//  사용자 2026-11-14 13:34Z: "환도분신이 환도영웅 원형으로감싸는거 원지름을 2배정도 넓힌다음 그원만큼 소환된분신들을 각각 중심으로 또원을그려
//   행동반경으로 하여 각원안에 적이들어오면 분신이 그리로가 적과 전투하도록"
//  채택 규칙: 경호 원 반지름 2→4칸(지름 2배). 분신마다 제자리(경호 자리)를 중심으로 반지름 4칸(큰 원과 같은 크기) 행동 원.
//   원 안에 적이 있으면 그 분신이 달려가 1.2초마다 공격력 ×0.25(R978 경호 베기와 같은 값)로 싸우고, 적이 없거나 원 밖으로 나가면 제자리로 돌아온다.
//   여러 적이면 다른 분신이 아직 맡지 않은 적을 먼저 고른다.
//  가짜 엔진은 R945 검사의 engine()을 그대로 빌려 쓴다(같은 벽·같은 좌표계).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='hwando-ink-r945.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const T945=fs.readFileSync(path.join(R,'qa','r945','r945-cpu-check.cjs'),'utf8');
eval(T945.slice(T945.indexOf('function engine('),T945.indexOf('const sumOn')));/* engine() 정의 */
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const homes=(E)=>{const C=E.api.config.clones,P=E.g.player;return E.api.inspect().clones.map(c=>c.home||null);};
// 분신을 불러 두고 불러낸 적은 치운다(그 뒤 원하는 자리에 적을 놓기 위해)
function summon(opt={}){const E=engine({...opt,enemies:[{id:'h',x:(opt.px||20)+1,y:(opt.py||20)},...(opt.enemies||[])]});E.g.room.enemies.slice(1).forEach(e=>e.hp=0);
 E.api.force('clones');E.ctx.basicAttack();E.g.room.enemies[0].hp=0;E.g.room.enemies.slice(1).forEach(e=>e.hp=1e5);E.run(.6);return E;}

{const E=engine();const C=E.api.config.clones;
 ok(C.guard===4,'경호 원 반지름 4칸(이전 2칸의 2배 = 지름 2배)');
 ok(C.zone===C.guard,'분신 행동 원 반지름 = 큰 원 반지름("그 원만큼")');
 ok(C.mult===.25&&C.guardGap===1.2&&C.count===7&&C.life===7&&C.chance===.06&&C.icd===7,'피해·주기·수·지속·확률·대기 수치는 그대로');}

// ---- 적이 없을 때: 넓어진 원 위 제자리 7방향 ----
{const E=summon();const P=E.g.player;E.run(1.2);const I=E.api.inspect();
 const ds=I.clones.map(c=>d(c,P)),as=I.clones.map(c=>Math.atan2(c.y-P.y,c.x-P.x)).sort((a,b)=>a-b);
 ok(I.clones.length===7,'분신 7체');
 ok(ds.every(v=>v>=3.6&&v<=4.3),'적이 없으면 분신은 영웅 둘레 4칸 원 위에 섬 '+ds.map(v=>v.toFixed(2)).join(','));
 ok(as.every((a,i)=>i===0||a-as[i-1]>.7),'7방향 고르게(한쪽에 안 뭉침)');
 ok(I.clones.every(c=>!E.g.blocked(c.x,c.y,.2)),'벽 안에 서지 않음');
 ok(I.clones.every(c=>c.home&&Math.abs(Math.hypot(c.home.x-P.x,c.home.y-P.y)-4)<.05),'inspect 에 분신 제자리(home) 노출');}

// ---- 분신 원 안의 적: 그 분신이 달려가 싸움 ----
{const E=summon({enemies:[{id:'t',x:27,y:20}]});/* 영웅(20,20) 정면 분신 0 의 제자리(24,20)에서 3칸 */
 const t=E.g.room.enemies[1];const g0=E.api.inspect().stats.guardHits||0;const h0=E.hits.filter(h=>h.id==='t').length;
 E.run(2.5);const I=E.api.inspect();const c0=I.clones.find(c=>c.foe==='t');
 ok(!!c0,'원 안에 들어온 적을 분신 하나가 맡음');
 ok(c0&&d(c0,t)<=1.4,'맡은 분신이 적 곁으로 달려감(거리 '+(c0?d(c0,t).toFixed(2):'-')+')');
 const hs=E.hits.filter(h=>h.id==='t'&&h.s?.r945==='clone').slice(0);
 ok(hs.length>=1&&(I.stats.guardHits||0)>g0,'달려간 분신이 적과 싸움(경호 베기 '+hs.length+'회)');
 ok(hs.every(h=>Math.abs(h.v-100*E.api.config.clones.mult)<1e-9),'분신 피해 = 공격력 × 0.25 그대로');
 const others=I.clones.filter(c=>c!==c0);ok(others.every(c=>Math.hypot(c.x-c.home.x,c.y-c.home.y)<.5),'다른 분신은 제자리 지킴');
 // 주기: 분신 하나가 1.2초에 한 번
 const k0=E.hits.filter(h=>h.id==='t').length;E.run(2.4);const k1=E.hits.filter(h=>h.id==='t').length;ok(k1-k0<=3,'한 분신은 1.2초에 한 번만 벰('+(k1-k0)+'회/2.4초)');
 // 적이 원 밖으로: 제자리로 돌아옴
 t.x=34;t.y=34;E.run(1.5);const J=E.api.inspect();ok(J.clones.every(c=>Math.hypot(c.x-c.home.x,c.y-c.home.y)<.4)&&J.clones.every(c=>c.foe==null),'적이 원 밖으로 나가면 제자리로 복귀');
 const k2=E.hits.filter(h=>h.id==='t').length;E.run(2);ok(E.hits.filter(h=>h.id==='t').length===k2,'원 밖 적은 베지 않음');}

// ---- 경계: 분신 원 가장자리 안/밖 ----
{const E=summon({enemies:[{id:'in',x:27.6,y:20}]});E.run(2.5);ok(E.api.inspect().clones.some(c=>c.foe==='in'),'원 경계 안쪽(제자리에서 3.6칸 + 몸 반지름) 적은 맡음');}
{const E=summon({enemies:[{id:'out',x:28.8,y:20}]});E.run(2.5);const I=E.api.inspect();ok(I.clones.every(c=>c.foe==null)&&E.hits.filter(h=>h.id==='out').length===0,'원 경계 밖(제자리에서 4.8칸) 적은 쫓지 않음');}
{const E=summon({enemies:[{id:'far',x:32,y:32}]});E.run(3);const I=E.api.inspect();ok(I.clones.every(c=>Math.hypot(c.x-c.home.x,c.y-c.home.y)<.4),'모든 분신 원 밖 적: 아무도 안 움직임');}

// ---- 여러 적: 서로 다른 분신이 나눠 맡음 ----
{const E=summon({enemies:[{id:'a',x:26.5,y:20},{id:'b',x:20,y:26.5}]});E.run(2.5);const I=E.api.inspect();
 const fa=I.clones.filter(c=>c.foe==='a'),fb=I.clones.filter(c=>c.foe==='b');ok(fa.length>=1&&fb.length>=1,'두 적을 서로 다른 분신이 맡음');
 ok(E.hits.some(h=>h.id==='a')&&E.hits.some(h=>h.id==='b'),'두 적 모두 분신과 싸움');}
{const E=summon({enemies:[{id:'a',x:26,y:20.5}]});E.run(2.5);const I=E.api.inspect();ok(I.clones.filter(c=>c.foe==='a').length===1,'적 하나는 분신 하나가 맡음(나머지 둘레 유지)');}

// ---- 영웅이 움직이면 제자리도 따라감 ----
{const E=summon();E.g.player.x=25;E.g.player.y=26;E.run(1.5);const P=E.g.player,I=E.api.inspect();
 ok(I.clones.every(c=>{const r=d(c,P);return r>=2.8&&r<=4.3;}),'영웅이 옮겨 가면 분신 원도 따라감');}

// ---- 벽 ----
{const E=summon({px:17,py:20});/* 벽 x 14~15.5 가까이 */E.run(1);const I=E.api.inspect();ok(I.clones.every(c=>!E.g.blocked(c.x,c.y,.2)),'벽 곁: 제자리가 벽이면 안쪽으로 당겨 섬');}
{const E=summon({px:17.5,py:20,enemies:[{id:'w',x:13,y:20}]});E.run(3);const I=E.api.inspect();
 ok(I.clones.every(c=>!E.g.blocked(c.x,c.y,.2)),'벽 너머 적을 쫓아도 벽 안에 들어가지 않음');ok(E.hits.filter(h=>h.id==='w').length===0,'벽 너머 적은 베지 않음');}

// ---- 회귀: 영웅 공격 따라 베기(R945)·협동·NaN ----
{const E=summon({enemies:[{id:'m',x:25.2,y:20}]});E.run(1.5);const c0=E.hits.filter(h=>h.id==='m').length;
 E.g.room.enemies.push({id:'near',x:21,y:20,radius:.3,hp:1e5,maxHp:1e5,spawnState:'active'});E.g.player.attackCD=0;E.ctx.basicAttack();
 ok(E.hits.filter(h=>h.id==='m'&&h.s?.r945==='clone').length>c0,'영웅 기본 공격 때 분신도 곁 적을 함께 벰(R945 따라 하기 유지)');}
{const E=engine({enemies:[{id:'a',x:21,y:20},{id:'b',x:26,y:20}],coop:'online'});E.api.force('clones');E.ctx.basicAttack();E.run(2);
 ok(E.hits.filter(h=>h.s?.r945==='clone').length===0,'협동 모드: 분신 베기 없음');}
{const E=summon({enemies:[{id:'t',x:27,y:20}]});E.run(.5);E.g.room.enemies[1].x=NaN;E.run(.3);E.g.player.x=NaN;E.run(.3);const I=E.api.inspect();
 ok(I.clones.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.y))&&I.errors===0,'영웅·적 좌표 NaN 에도 분신 좌표 유한·오류 0');}
// ---- 생존 배치 영웅(R720) 분신은 그 몸 둘레 ----
{const E=engine({enemies:[{id:'a',x:31,y:29},{id:'b',x:10,y:5}]});const main=E.g.player;const ally={x:30,y:29,hp:100,hero:'hwando',direction:'right',attackCD:0,specialCD:0,attackAnim:0,r720Ally:true};E.g.__allies=[ally];
 E.g.player=ally;E.api.force('clones');E.ctx.basicAttack();E.g.player=main;E.g.room.enemies[0].hp=0;E.run(1.2);
 ok(E.api.inspect(ally).clones.every(c=>{const r=d(c,ally);return r>=2.8&&r<=4.3;}),'배치 영웅 분신은 그 영웅 둘레 4칸');}
// ---- 렉: 적 60 마리 · 1000 틱 ----
{const foes=[];for(let i=0;i<60;i++)foes.push({id:'z'+i,x:8+((i*7.3)%28),y:3+((i*5.1)%33)});const E=summon({enemies:foes});const t0=process.hrtime.bigint();E.run(6,.006);const ms=Number(process.hrtime.bigint()-t0)/1e6;
 ok(E.api.inspect().clones.length===7&&ms<1500,'분신 7 살아 있는 동안 적 60·1000틱 '+ms.toFixed(0)+'ms (틱당 '+(ms/1000).toFixed(3)+'ms)');ok(E.api.inspect().errors===0,'오류 0');}
console.log(JSON.stringify({ok:true,checks:n,method:'fake-engine(R945 engine)'}));
