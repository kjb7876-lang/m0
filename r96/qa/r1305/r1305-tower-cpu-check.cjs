'use strict';
// R1305 CPU 검사 — 무한 생존 배치 영웅 '타워형'(사용자 2026-11-25 03:53~03:54Z):
//  "무한생존모드에서는 영웅배치시 2d영웅 자리고정해서 타워형처럼 공격모션만 나가는거"
//  "모든영웅다 원거리판정하고 근접영웅 사거리도 늘려서 다 사거리 엇비슷하게"(→ "무한생존모드만")
//  "무한생존모드에서 모든영웅 좌나우공격모션만"
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..');let n=0,bad=0;
const ok=(c,m,x)=>{n++;if(!c){bad++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));}else console.log('ok  ',m);};
const NAME='hero-defense-r720.js',src=fs.readFileSync(path.join(R,'client-source',NAME),'utf8');
const sb={console,Math,JSON,Number,Object,Array,String,Set,Map,WeakMap,Proxy,structuredClone:globalThis.structuredClone,
 localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:()=>null,getElementById:()=>null,createElement:()=>({style:{}})},addEventListener(){},setInterval:()=>({unref(){}})};
sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb,{filename:NAME});
const P=sb.__STORYWORLD_HERO_DEFENSE_R720__.pure;
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
const HEROES=vm.runInNewContext('('+/HEROES=(\{[\s\S]*?\n\});/.exec(idx)[1]+')');
const ids=Object.keys(HEROES);ok(ids.length===8,'엔진 영웅 8명 읽음',ids);
// ① 사거리 엇비슷: 모든 영웅(근접 포함) 기본 사거리가 원거리 수준(7칸 이상)이고 최대-최소 차가 1.4칸 이하
const S=ids.map(id=>[id,P.slotStats({hero:id,lv:1,rangeLv:0,radiusLv:0},HEROES)]);
ok(S.every(([,s])=>s.range>=7),'모든 배치 영웅 기본 사거리 ≥ 7칸(근접 영웅도 늘림)',S.map(([i,s])=>[i,s.range]));
{const r=S.map(([,s])=>s.range);ok(Math.max(...r)-Math.min(...r)<=1.4,'배치 영웅 사거리 차 ≤ 1.4칸(엇비슷)',r);}
ok(S.every(([,s])=>s.ranged===true),'모든 배치 영웅 원거리 판정 표식(ranged)',S.map(([i,s])=>[i,s.ranged]));
ok(S.find(([i])=>i==='hunter')[1].range===HEROES.hunter.range,'원래 원거리 영웅(헌터) 사거리는 줄이지 않음');
// 경계: 사거리 강화는 여전히 쌓인다, 최대 단계 넘으면 묶임
{const a=P.slotStats({hero:'hwando',lv:1,rangeLv:5,radiusLv:0},HEROES),b=P.slotStats({hero:'hwando',lv:1,rangeLv:99,radiusLv:0},HEROES),c=P.slotStats({hero:'hwando',lv:1,rangeLv:0,radiusLv:0},HEROES);
 ok(Math.abs(a.range-c.range-3)<1e-9&&b.range===a.range,'사거리 강화 +0.6×5 그대로·최대에서 묶임',[c.range,a.range,b.range]);}
// ② 자리 고정: 이동 반경 0(강화해도 0), think 는 표적이 멀어도 걷지 않는다
ok(S.every(([,s])=>s.radius===0),'모든 배치 영웅 이동 반경 0(타워)',S.map(([i,s])=>[i,s.radius]));
ok(P.slotStats({hero:'slayer',lv:3,rangeLv:0,radiusLv:5},HEROES).radius===0,'옛 이동 반경 강화가 있어도 0');
{const st=P.slotStats({hero:'slayer',lv:1,rangeLv:0,radiusLv:0},HEROES),an={x:10,y:10},a={x:10,y:10,cd:0},e={x:15,y:10,hp:5};let moved=false,hit=null;
 for(let i=0;i<40;i++){const o=P.think(a,[e],.05,st,an,{engaged:true});moved=moved||o.moved;if(o.hits.length)hit=o.hits[0];}
 ok(!moved&&a.x===10&&a.y===10,'근접 영웅(슬레이어)도 5칸 앞 적을 쫓아 걷지 않음',a);ok(hit===e,'5칸 앞 적을 자리에서 침(원거리 판정)');}
{const st=P.slotStats({hero:'neon',lv:1,rangeLv:0,radiusLv:0},HEROES),an={x:10,y:10},a={x:10,y:10,cd:0},e={x:10+st.range+.3,y:10,hp:5};let moved=false,hits=0;
 for(let i=0;i<20;i++){const o=P.think(a,[e],.05,st,an,{engaged:true});moved=moved||o.moved;hits+=o.hits.length;}
 ok(!moved&&hits===0,'경계: 사거리 바로 밖 적은 걷지도 치지도 않음',{a,hits});}
{const st=P.slotStats({hero:'lauren',lv:1,rangeLv:0,radiusLv:0},HEROES),an={x:10,y:10},a={x:12,y:9,cd:0};P.think(a,[],.05,st,an,{});ok(a.x===10&&a.y===10,'자리에서 밀려난 몸은 자리로 되돌림',a);}
// ③ 근접 영웅 원거리 판정: 엔진 근접 공격을 표적 앞 '닿는 점'에서 낸다
ok(typeof P.reachPoint==='function','pure.reachPoint 공개');
if(typeof P.reachPoint==='function'){const an={x:10,y:10},e={x:16,y:13};const q=P.reachPoint(an,e,3.15);
 const dT=Math.hypot(q.x-e.x,q.y-e.y),cross=(q.x-an.x)*(e.y-an.y)-(q.y-an.y)*(e.x-an.x);
 ok(dT<=3.15*.75&&dT>=.4,'닿는 점은 표적에서 근접 사거리 안',dT);ok(Math.abs(cross)<1e-9,'닿는 점은 자리→표적 직선 위(바라보는 방향 같음)',cross);
 const near=P.reachPoint(an,{x:10.5,y:10},3.15);ok(near.x===10&&near.y===10,'표적이 이미 근접 사거리 안이면 자리 그대로',near);
 const nan=P.reachPoint(an,{x:NaN,y:1},3.15);ok(nan.x===10&&nan.y===10,'NaN 표적이면 자리 그대로');}
// ④ 좌·우만
ok(typeof P.sideFace==='function','pure.sideFace 공개');
if(typeof P.sideFace==='function'){const dirs=[];for(let k=0;k<64;k++){const a=k/64*Math.PI*2;dirs.push(P.sideFace('right',Math.cos(a)*3,Math.sin(a)*3));dirs.push(P.sideFace('left',Math.cos(a)*3,Math.sin(a)*3));}
 ok(dirs.every(d=>d==='left'||d==='right'),'64방향 모두 좌·우 중 하나',[...new Set(dirs)]);
 ok(P.sideFace('front',2,-2)==='right'||P.sideFace('front',2,-2)==='left','앞·뒤 방향에서 시작해도 좌·우로');
 ok(P.sideFace('left',3,0)==='right'&&P.sideFace('right',-3,0)==='left','화면 오른쪽 적 → right, 왼쪽 → left');
 ok(P.sideFace('left',.1,-.05)==='left'&&P.sideFace('right',-.1,.05)==='right','경계: 좌우 차가 작으면(0.4칸 안) 지금 방향 유지');
 ok(P.sideFace('right',NaN,1)==='right'&&P.sideFace(undefined,NaN,1)==='right','NaN → 지금 방향(없으면 right)');}
// ⑤ 엔진 연결(소스): step 이 좌우만 쓰고, act 가 근접 몸을 닿는 점에 두고, 창에서 이동 반경 강화 단추를 뺀다
ok(/sideFace\(/.test(src.slice(src.indexOf('function step('),src.indexOf('// ── 그리기'))),'step 이 sideFace 로 방향을 정한다');
ok(/reachPoint\(/.test(src.slice(src.indexOf('function act('),src.indexOf('// ── 방 소품'))),'act 가 reachPoint 로 근접 공격 위치를 정한다');
ok(!/up\('radius'/.test(src),'배치 창에서 이동 반경 강화 단추 없음');
// ⑥ R113 분신·시선 덧씌우기는 배치 영웅 몸(r720Ally)을 건너뛴다(헤드리스에서 배치 몸이 조종 영웅 분신 자리에 또 그려지고 앞·뒤 방향으로 돌던 것)
{const p113=fs.readFileSync(path.join(R,'client-source','play-r113.js'),'utf8');ok((p113.match(/G113ally\(\)\)return/g)||[]).length===2&&/player\.r720Ally/.test(p113),'R113 분신·시선이 배치 몸을 건너뜀');}
console.log(`\nR1305 타워 CPU ${n-bad}/${n}`);process.exit(bad?1:0);
