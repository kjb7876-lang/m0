// R601 적 공격 모션 2배속(그림만) — CPU 검사(정적 + 가짜 엔진).
//  node r96/qa/r601/attack-tempo-cpu-check.cjs
//  그리기(drawEnemy) 동안만 e.attack.elapsed 를 '보이는 시간'으로 바꿔 몸 그림·몸 동작이 2배로 흐르게 하고,
//  준비 끝(=판정 순간)은 그대로 맞춘다. 예고 도형(근접 예고·발판 테두리·바닥 그림·예고 안내선)은 실제 시간을 본다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='enemy-attack-tempo-r601.js',SRC=path.join(R,'client-source',F);
ok(fs.existsSync(SRC),'오버레이 파일 있음');
const src=fs.readFileSync(SRC,'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적(빌드 연결 다섯 곳) ----
ok(fs.existsSync(path.join(R,'runtime-text',F))&&src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'),'runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2&&/<script src="\.\/enemy-attack-tempo-r601\.js"><\/script>\s*(?:<script src="\.\/hero-motion-r895\.js"><\/script>)?\s*<script src="\.\/combat-r118\.js">/.test(html),'index.html 스크립트 태그 한 번(combat-r118 바로 앞 = drawEnemy 덧씌우기 중 가장 바깥)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r601\/attack-tempo-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'))).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/\btime\s*=[^=]/.test(code)&&!/\.(windup|active|recovery|castWindup150)\s*=[^=]/.test(code),'게임 시간·공격 모양(준비·타격·회복 길이)을 바꾸지 않음');
// 다른 스레드 소유 파일을 건드리지 않음(예고 도형·죽음 연출)
ok(!/mob-death-r462|skill-attack-r440/.test(code),'예고 도형·죽음 연출 오버레이를 직접 고치지 않음');

// ---- 가짜 엔진 ----
function boot(prefs){
 const log=[];const store=new Map();if(prefs)store.set('storyworld.r601.attackTempo',JSON.stringify(prefs));
 const sb={console,Math,Number,JSON,Object,WeakMap,Map,Set,Error,String,Array,isFinite,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},time:0};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`
  var seen=[];var throwNext=false;
  function drawMeleeWarning154(e){seen.push(['warn',e.attack&&e.attack.elapsed]);}
  function strokeFootprint154(g,stage,c){seen.push(['stroke',g&&g.owner&&g.owner.attack&&g.owner.attack.elapsed]);}
  function drawNativeGroundArt154(e){seen.push(['ground',e&&e.attack&&e.attack.elapsed]);}
  function drawTelegraphGuide39(e){seen.push(['guide',e&&e.attack&&e.attack.elapsed]);}
  function drawEnemy(e){seen.push(['body0',e.attack&&e.attack.elapsed]);
   if(e.attack&&e.attack.footprint154){drawMeleeWarning154(e);strokeFootprint154({owner:e},'warning','#fff');drawNativeGroundArt154(e);drawTelegraphGuide39(e);}
   seen.push(['body1',e.attack&&e.attack.elapsed]);if(throwNext){throwNext=false;throw new Error('boom');}}
 `,sb);
 vm.runInContext(src,sb,{filename:F});
 return sb;}
const S=boot();
const api=S.__STORYWORLD_ATTACK_TEMPO_R601__;
ok(api&&typeof api.visual==='function'&&typeof api.inspect==='function','공개 API(visual·inspect)');
const mk=(t,sh={windup:.5,active:.15,recovery:.6},extra={})=>({hp:10,attack:{elapsed:t,angle:0,committed:false,id:1,shape154:sh,footprint154:{},...extra}});
function draw(e){S.seen.length=0;S.drawEnemy(e);return Object.fromEntries(S.seen.map(([k,v])=>[k,v]));}
const near=(a,b,eps=1e-9)=>Math.abs(a-b)<=eps;

// 정상: 준비 구간은 2배로 흐른 뒤 마지막 준비 자세를 판정 순간까지 붙든다
let r=draw(mk(.1));ok(near(r.body0,.2)&&near(r.body1,.2),'준비 0.1초 → 그림 0.2초(2배)');
r=draw(mk(.3));ok(r.body0<.5&&r.body0>.49,'준비 0.3초(W=0.5) → 마지막 준비 자세 붙듦(W 미만)');
ok(near(r.warn,.3)&&near(r.stroke,.3)&&near(r.ground,.3)&&near(r.guide,.3),'예고 도형 넷은 실제 시간 0.3초를 봄');
ok(near(r.body1,r.body0),'예고 도형 뒤 몸 그림 시간은 다시 보이는 시간');
// 경계: 판정 순간(W) 일치
r=draw(mk(.5));ok(near(r.body0,.5),'판정 순간 t=W → 그림도 W(타격 칸 시작이 피해와 같은 프레임)');
r=draw(mk(.4999));ok(r.body0<.5,'t=W-ε → 그림은 아직 준비(W 미만)');
r=draw(mk(0));ok(r.body0===0,'t=0 → 0');
// 타격·회복 2배, 끝에서 멈춤
r=draw(mk(.55));ok(near(r.body0,.6),'타격 t=W+0.05 → W+0.10');
r=draw(mk(.5+.375));ok(r.body0<1.25&&r.body0>1.24,'회복 끝(W+(A+R)/2) 이후엔 마지막 칸 붙듦(총 길이 미만)');
r=draw(mk(1.2));ok(r.body0<1.25,'총 길이 직전도 총 길이 미만');
// 원래 값 복구·객체 동일성
let e=mk(.3);const a0=e.attack;S.drawEnemy(e);ok(e.attack===a0&&e.attack.elapsed===.3,'그린 뒤 elapsed 실제값으로 복구·같은 공격 객체');
e=mk(.2);S.throwNext=true;let threw=false;try{S.drawEnemy(e);}catch(_){threw=true;}ok(threw&&e.attack.elapsed===.2,'그리기 중 오류가 나도 실제값 복구');
// 시전(castWindup150) 은 준비 길이로 castWindup150 을 씀
r=draw(mk(.6,{windup:.3,active:.15,recovery:.4},{castWindup150:1.2}));ok(near(r.body0,1.2*.999,1e-3)||r.body0<1.2&&r.body0>1.19,'시전 준비(castWindup150=1.2) t=0.6 → 준비 끝 자세(1.2 미만)');
r=draw(mk(1.2,{windup:.3,active:.15,recovery:.4},{castWindup150:1.2}));ok(near(r.body0,1.2),'시전 판정 순간 일치');
// 손대지 않는 경우
r=draw({hp:10});ok(r.body0===undefined,'공격 없음 → 그대로');
r=draw(mk(NaN));ok(Number.isNaN(r.body0),'elapsed 비정상 → 그대로');
r=draw({hp:10,attack:{elapsed:.1,shape154:{}}});ok(r.body0===.1,'준비 길이 모름 → 그대로');
r=draw(mk(.1,undefined,{r442:true}));ok(near(r.body0,.2),'shape154 기본 모양');
const off=boot({on:false});off.seen.length=0;off.drawEnemy(mk(.1));ok(off.seen[0][1]===.1,'끄기 {on:false} → 원래 속도');
const x3=boot({rate:3});x3.seen.length=0;x3.drawEnemy(mk(.1));ok(near(x3.seen[0][1],.3),'배율 설정 {rate:3}');
const bad=boot({rate:99});bad.seen.length=0;bad.drawEnemy(mk(.1));ok(bad.seen[0][1]<=.4+1e-9,'배율 상한 4');
const low=boot({rate:.2});low.seen.length=0;low.drawEnemy(mk(.1));ok(near(low.seen[0][1],.1),'배율 하한 1(느리게 안 함)');
// 회귀: 여러 모양에서 단조·경계 불변·조각 그림(strip) 타격 칸 일치
let mono=true,bound=true,strike=true;
for(const sh of [{windup:.2,active:.1,recovery:.3},{windup:.45,active:.15,recovery:.35},{windup:1.4,active:.2,recovery:.8},{windup:.05,active:.04,recovery:.1}]){
 const tot=sh.windup+sh.active+sh.recovery;let prev=-1;
 for(let t=0;t<tot;t+=tot/400){const v=api.visual(t,sh.windup,sh.active,sh.recovery);if(v<prev-1e-12)mono=false;prev=v;if((v>=sh.windup)!==(t>=sh.windup))bound=false;}
 const N=8,fr=t=>Math.floor(Math.min(.999,t/tot)*N);if(fr(api.visual(sh.windup,sh.windup,sh.active,sh.recovery))!==fr(sh.windup))strike=false;}
ok(mono,'보이는 시간은 줄지 않음(뒤로 감기 없음)');ok(bound,'모든 모양에서 준비/타격 경계 = 실제 판정 경계');ok(strike,'조각 그림 8칸: 판정 순간 칸이 예전과 같음');
// 렉: 2만 번 그리기 덧씌우기 비용
const t0=process.hrtime.bigint();const ee=mk(.3);for(let i=0;i<20000;i++){ee.attack.elapsed=(i%100)/100;S.drawEnemy(ee);}const ms=Number(process.hrtime.bigint()-t0)/1e6;
ok(ms<400,'2만 번 그리기 '+ms.toFixed(1)+'ms(렉 없음)');

// ---- R778 보스 연타(사용자 11-12 07:59Z "보스들은 공격모션 빠르게 여러번해서 생동감있게 자연스럽고") ----
{ok(typeof api.flurry==='function','R778 flurry 내보냄');
 for(const sh of [{windup:.6,active:.2,recovery:.7},{windup:1.1,active:.25,recovery:.9},{windup:.45,active:.15,recovery:.45}]){const {windup:W,active:A,recovery:Rr}=sh,end=W+A+Rr;
  let strikes=0,inS=false,bound=true,last=0;for(let t=0;t<end;t+=.004){const v=api.flurry(t,W,A,Rr);if((v>=W)!==(t>=W))bound=false;if(v>=end)bound=false;const s=v>=W&&v<W+A;if(s&&!inS)strikes++;inS=s;last=v;}
  ok(strikes>=2&&strikes<=4,'R778 보스 공격 한 번에 타격 자세 '+strikes+'번(빠르게 여러 번) W='+W);ok(bound,'R778 준비/타격 경계 = 실제 판정 경계, 끝을 넘지 않음 W='+W);
  ok(api.flurry(W,W,A,Rr)>=W&&api.flurry(W,W,A,Rr)<W+A,'R778 첫 타격은 실제 판정 순간 W='+W);ok(last>W+A+Rr*.5,'R778 마지막은 회수 자세로 끝남 W='+W);}
 // 보스만: 일반 몹은 예전처럼 2배속 한 번
 const boss=mk(.9);boss.boss=true;const mob=mk(.9);const seenB=draw(boss).body0,seenM=draw(mob).body0;
 ok(seenM>1.24&&seenM<1.25,'R778 일반 몹은 예전 2배속 '+seenM);ok(near(seenB,api.flurry(.9,.5,.15,.6)),'R778 보스는 연타 시간 '+seenB);
 ok(boss.attack.elapsed===.9&&mob.attack.elapsed===.9,'R778 그린 뒤 실제 시간으로 돌아옴');}
const st=api.inspect();ok(st.stats.remapped>0&&st.browser===false,'inspect 통계');
console.log('R601 attack tempo CPU check: '+n+' passed');
