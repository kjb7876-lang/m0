// R1096 실패 먼저: 히든 페르소나(사몽 층 결전)가 라우렌 '천체 공명'의 밀어내는 구·끌어당기는 구·융합 관통탄(R946)을
//  페르소나 방식(붉은 시간 색·거울 반전, 영웅을 겨눔)으로 바꿔 패턴 사이에 확률적으로 섞어 쓴다(사용자 2026-11-16 02:13Z).
// 검사: ① 페르소나가 아닌 보스·결전 밖에서는 안 씀 ② 굴림 확률이 정한 값 근처(깨어남 때 더 높음) ③ 모든 기술은 피해 전에 예고가 있고,
//       예고를 보고 비켜선 영웅은 안 맞음(서 있으면 맞음) ④ 끌어당김은 반경 안 영웅만, 회피 무적 중엔 안 끌림
//       ⑤ 월식(융합탄)은 붉은 구·검은 구를 12초 안에 다 쓴 뒤에만 ⑥ NaN 자리·끄기·장면 중엔 아무 일 없음, 페르소나가 죽으면 정리.
const fs=require('fs'),path=require('path'),vm=require('vm');
const FILE=path.join(__dirname,'../../client-source/persona-gravity-r1096.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
if(!fs.existsSync(FILE)){ok(false,'persona-gravity-r1096.js 가 있음');console.log('R1096 persona-gravity FAILED '+fails);process.exit(1);}
const SRC=fs.readFileSync(FILE,'utf8');
function lcg(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};} // mulberry32
function world(o={}){
 const persona={id:7,name:'페르소나 · 순수악의',persona:true,boss:true,hp:500,maxHp:500,x:10,y:10,damage:20,spawnState:'active',graceUntil:0,invulnerableUntil:0,awakeUntil:0};
 const plain={id:8,name:'다른 보스',boss:true,hp:500,x:10,y:10,damage:20,spawnState:'active'};
 const player={x:15,y:10,hp:500,invincible:0,invReason:'',hero:'seoha'};
 const hurts=[];const effects=[];
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,String,Date,Error,console,setTimeout:()=>0,
  time:100,player,modal:false,loading:false,storyScene:null,started:true,effects,
  room:{id:'cult04',activeEncounter:('encounter' in o)?o.encounter:'persona',enemies:[o.plain?plain:persona],persona:{phase:'fight'}},
  liveEnemies:()=>C.room.enemies.filter(e=>e.hp>0&&e.spawnState!=='dead'),
  blocked:(x,y,r)=>!!(o.wallX!=null&&x>=o.wallX),clearLine:()=>true,
  moveActor:(a,dx,dy)=>{const s=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.17));for(let i=0;i<s;i++){if(!C.blocked(a.x+dx/s,a.y))a.x+=dx/s;if(!C.blocked(a.x,a.y+dy/s))a.y+=dy/s;}},
  hurt:(d,src)=>{hurts.push({d,src,t:C.time,x:C.player.x,y:C.player.y});return 'hit';},
  project:(x,y)=>({x:x*30,y:y*15}),sound(){},tick(){},drawEffect(){},
  localStorage:{_v:{},getItem(k){return this._v[k]??null;},setItem(k,v){this._v[k]=String(v);}}};
 C.window=C;vm.createContext(C);vm.runInContext(SRC,C);
 const api=C.__STORYWORLD_PERSONA_GRAVITY_R1096__;
 const step=(sec,dt=1/30,each)=>{for(let t=0;t<sec;t+=dt){C.time+=dt;if(each)each();C.tick(dt);}};
 return {C,api,persona,plain,player,hurts,step,effects};}
// 0) API
{const w=world();ok(w.api&&typeof w.api.inspect==='function'&&typeof w.api.qaForce==='function'&&typeof w.api.qaRandom==='function'&&typeof w.api.set==='function','0) API 노출(inspect·qaForce·qaRandom·set)');}
// ① 페르소나가 아닌 보스 · 페르소나 결전 밖
{const w=world({plain:true});w.api.qaRandom(()=>0);w.step(40);ok(w.api.inspect().stats.casts===0&&w.hurts.length===0,'① 페르소나가 아닌 보스는 쓰지 않음');}
{const w=world({encounter:null});w.api.qaRandom(()=>0);w.step(40);ok(w.api.inspect().stats.casts===0,'① 페르소나 결전 밖에서는 쓰지 않음');}
// ② 확률: 굴림당 성공 비율이 정한 확률 ±0.05, 깨어남 때 더 높음
{const w=world();w.api.qaRandom(lcg(11));const pin=()=>{w.player.x=10;w.player.y=20;w.player.hp=500;};w.step(1500,1/10,pin);const s=w.api.inspect();const p=s.stats.procs/Math.max(1,s.stats.rolls);
 ok(s.stats.rolls>150&&Math.abs(p-s.tuning.CHANCE)<.05,'② 보통 굴림 성공 비율 '+p.toFixed(3)+' ≈ '+s.tuning.CHANCE+' (굴림 '+s.stats.rolls+')');
 ok(s.tuning.CHANCE>0&&s.tuning.CHANCE<.5&&s.tuning.AWAKE_CHANCE>s.tuning.CHANCE&&s.tuning.AWAKE_CHANCE<.6,'② 깨어남 확률이 보통보다 높고 0.6 미만');
 const w2=world();w2.api.qaRandom(lcg(5));w2.persona.awakeUntil=1e9;w2.step(1500,1/10,()=>{w2.player.x=10;w2.player.y=20;});const s2=w2.api.inspect();const p2=s2.stats.procs/Math.max(1,s2.stats.rolls);
 ok(Math.abs(p2-s2.tuning.AWAKE_CHANCE)<.05,'② 깨어남 굴림 성공 비율 '+p2.toFixed(3)+' ≈ '+s2.tuning.AWAKE_CHANCE);
 ok(s.stats.casts>0&&s.stats.casts===s.stats.procs,'② 성공한 굴림은 모두 기술로 나감');}
// ③ 예고 → 피해. 붉은 구(밀어냄): 서 있으면 맞고 밀림, 예고 중 옆으로 비키면 안 맞음
for(const kind of ['crimson','abyss','eclipse']){
 for(const dodge of [false,true]){const w=world();w.api.qaRandom(()=>.99);if(kind==='eclipse')w.api.qaCombo(true);const c=w.api.qaForce(kind);ok(c===kind,'③ '+kind+' 강제 시전 받아짐');
  const a=w.api.inspect().acts[0];ok(a&&a.phase==='warn'&&a.warn>=.6,'③ '+kind+' 처음은 예고 단계('+(a&&a.warn)+'초 ≥ 0.6)');
  let hitDuringWarn=false;const x0=w.player.x;w.step(a.warn-.05,1/30,()=>{if(w.hurts.length)hitDuringWarn=true;});ok(!hitDuringWarn,'③ '+kind+' 예고 동안 피해 없음');
  if(dodge){w.player.y+=4;}
  w.step(3);
  if(dodge)ok(w.hurts.length===0,'③ '+kind+' 예고를 보고 비킨 영웅은 안 맞음');
  else{ok(w.hurts.length>=1&&w.hurts.every(h=>Number.isFinite(h.d)&&h.d>0),'③ '+kind+' 서 있는 영웅은 맞음('+w.hurts.length+'번, '+w.hurts.map(h=>h.d.toFixed(1)).join(',')+')');
   if(kind==='crimson')ok(w.player.x>x0+.8,'③ 붉은 구는 영웅을 진행 방향으로 밀어냄('+x0+'→'+w.player.x.toFixed(2)+')');
   if(kind==='abyss')ok(w.hurts.length<=5,'③ 검은 구 핵 피해는 5번 이하');
   if(kind==='eclipse')ok(w.hurts.length===1,'③ 월식 관통탄은 한 번만 맞힘');}}}
// ④ 끌어당김
{const w=world();w.api.qaRandom(()=>.99);w.api.qaForce('abyss');const a=w.api.inspect().acts[0];ok(Math.hypot(a.x-15,a.y-10)<.01,'④ 검은 구는 시전 순간 영웅 자리에 놓임');
 w.step(a.warn+.05);w.player.x=a.x+a.radius-.4;w.player.y=a.y;const before=w.player.x;w.step(.4);ok(w.player.x<before-.2,'④ 반경 안 영웅은 핵 쪽으로 끌림('+before.toFixed(2)+'→'+w.player.x.toFixed(2)+')');
 w.player.x=a.x+a.radius+1.5;const far=w.player.x;w.step(.3);ok(Math.abs(w.player.x-far)<1e-9,'④ 반경 밖 영웅은 안 끌림');
 w.player.x=a.x+a.radius-.4;w.player.invincible=.5;w.player.invReason='회피';const inv=w.player.x;w.step(.2,1/30,()=>{w.player.invincible=.5;});ok(Math.abs(w.player.x-inv)<1e-9,'④ 회피 무적 중엔 안 끌림');}
// ⑤ 월식 조건
{const w=world();w.api.qaRandom(()=>.99);ok(w.api.qaForce('eclipse')===null,'⑤ 붉은·검은 구를 안 썼으면 월식 못 씀');
 w.api.qaForce('crimson');w.step(4);ok(w.api.qaForce('eclipse')===null,'⑤ 붉은 구만 썼으면 월식 못 씀');
 w.api.qaForce('abyss');w.step(4);ok(w.api.inspect().comboReady===true,'⑤ 둘 다 쓰면 월식 준비');
 w.step(w.api.inspect().tuning.COMBO_WINDOW+1);ok(w.api.inspect().comboReady===false,'⑤ 준비 시간(COMBO_WINDOW)이 지나면 월식 준비 풀림');
 const w2=world();let seq=[];w2.api.qaRandom(lcg(3));w2.step(900,1/10,()=>{w2.player.x=10;w2.player.y=20;w2.player.hp=500;});seq=w2.api.inspect().stats.order;
 const W=w2.api.inspect().tuning.COMBO_WINDOW;let bad=0,haveR=-1e9,haveB=-1e9;for(const s of seq){if(s.kind==='crimson')haveR=s.t;else if(s.kind==='abyss')haveB=s.t;else if(s.kind==='eclipse'){if(!(s.t-haveR<=W&&s.t-haveB<=W))bad++;haveR=haveB=-1e9;}}
 ok(seq.some(s=>s.kind==='eclipse')&&bad===0,'⑤ 자연 굴림에서 월식은 조건 맞을 때만('+seq.filter(s=>s.kind==='eclipse').length+'번, 어긋남 '+bad+')');
 const c=w2.api.inspect().stats.cast;ok(c.crimson>0&&c.abyss>0,'⑤ 붉은·검은 구 모두 자연 굴림에 나옴('+JSON.stringify(c)+')');}
// ⑥ 안전
{const w=world();w.api.qaRandom(()=>0);w.player.x=NaN;let threw=null;try{w.step(20);}catch(e){threw=e;}ok(!threw&&w.hurts.every(h=>Number.isFinite(h.d)),'⑥ 영웅 자리 NaN 이어도 오류·NaN 피해 없음');}
{const w=world();w.api.set(false);w.api.qaRandom(()=>0);w.step(40);ok(w.api.inspect().stats.casts===0,'⑥ 끄면 안 씀');}
{const w=world();w.api.qaRandom(()=>0);w.C.storyScene={};w.step(40);ok(w.api.inspect().stats.casts===0,'⑥ 장면 중엔 안 씀');}
{const w=world();w.api.qaRandom(()=>.99);w.api.qaForce('abyss');w.persona.hp=0;w.step(.2);ok(w.api.inspect().acts.length===0,'⑥ 페르소나가 죽으면 기술 정리');}
{const w=world();w.api.qaRandom(()=>.99);w.api.qaForce('crimson');ok(w.effects.some(e=>e&&e.r1096Sentinel),'⑥ 그리기 표지가 effects 에 들어감');w.persona.hp=0;w.step(.2);ok(!w.effects.some(e=>e&&e.r1096Sentinel),'⑥ 끝나면 표지 빠짐');}
// ⑦ 그림 규칙: 금지 필터·흰 원+빨간 고리 예고 없음
{ok(!/drop-shadow|blur\(/.test(SRC),'⑦ ctx.filter 금지 값(drop-shadow·blur) 없음');ok(/assets\/r946\//.test(SRC),'⑦ Dots 시트(r946) 재사용 경로');}
// ⑧ 예고 크기 = 실제 범위: 검은 우물별 바닥 원 가로 반지름 = 2.6칸 × TILE·√2 (엔진 project 기준)
{const W2=world();const calls=[];const noop=()=>{};const ctx=new Proxy({globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',lineWidth:1,fillStyle:'',strokeStyle:'',
  scope:(o,f)=>f(),ellipse:(x,y,rx,ry)=>calls.push({rx,ry,x,y})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>{o[k]=v;return true;}});
 Object.assign(W2.C,{ctx,TILE:34,zoom:1,project:(x,y)=>({x:(x-y)*34+480,y:(x+y)*17+280})});
 W2.api.qaRandom(()=>.99);W2.api.qaForce('abyss');W2.step(.3);const sent=W2.effects.find(e=>e&&e.r1096Sentinel);calls.length=0;
 W2.C.drawEffect(sent);const want=2.6*34*Math.SQRT2;const big=calls.reduce((m,c)=>c.rx>m.rx?c:m,{rx:0});
 ok(Math.abs(big.rx-want)/want<.03&&Math.abs(big.ry-want/2)/want<.03,'⑧ 검은 우물별 예고 원 가로 '+big.rx.toFixed(1)+'px ≈ 실제 범위 '+want.toFixed(1)+'px (오류 '+W2.api.inspect().stats.lastError+')');}
console.log(fails?'R1096 persona-gravity FAILED '+fails:'R1096 persona-gravity PASSED');process.exit(fails?1:0);
