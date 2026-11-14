// R1031 불면귀(R760) 몸 그림 좌우가 R444 방향 권위를 따르는지 — CPU 검사(가짜 전역, GPU 없음)
// R1028 뒤 R444 는 엔진 자세 그림용 가짜 공격(storyWorldPose5, angle 0)을 무시하는데, R760 facing() 은 그 값을 믿어 몸 그림만 오른쪽으로 튀었다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'../../client-source/bulmyeongwi-r760.js'),'utf8');
const m=src.match(/^function facing\(e\)\{.*$/m);let pass=0,total=0;
function ok(name,cond){total++;if(cond)pass++;console.log((cond?'ok  ':'FAIL')+' '+name);}
ok('R760 has facing(e)',!!m);
function mk(r444,player){const ctx={window:{},player};if(r444!==undefined)ctx.window.__STORYWORLD_ENEMY_FACE_R444__={left:()=>r444};vm.createContext(ctx);vm.runInContext(m[0]+';this.facing=facing;',ctx);return ctx.facing;}
const fake={elapsed:0,angle:0,committed:true,storyWorldPose5:true};
// 화면 왼쪽 = (player.x-player.y) 가 작아지는 쪽
const Lp={x:0,y:4},Rp={x:4,y:0},E={x:2,y:2};
ok('R444 says left + engine fake attack angle 0 → body faces left (-1)',mk(true,Rp)({...E,attack:fake})===-1);
ok('R444 says right + fake attack → right (1)',mk(false,Lp)({...E,attack:fake})===1);
ok('R444 says left, no attack → left',mk(true,Rp)({...E})===-1);
ok('no R444: fake attack is ignored, player on the left → left',mk(undefined,Lp)({...E,attack:fake})===-1);
ok('no R444: fake attack ignored, player on the right → right',mk(undefined,Rp)({...E,attack:fake})===1);
ok('no R444: real attack angle π still turns left (regression)',mk(undefined,Rp)({...E,attack:{angle:Math.PI}})===-1);
ok('no R444: real attack angle 0 still turns right (regression)',mk(undefined,Lp)({...E,attack:{angle:0}})===1);
ok('R444 null (unknown) → fallback, player left → left',mk(null,Lp)({...E})===-1);
ok('NaN positions never throw and give ±1',[1,-1].includes(mk(undefined,{x:NaN,y:NaN})({x:NaN,y:NaN})));
// 10초 루프: 자세 그림 창마다 가짜 공격이 끼어도 R444 가 왼쪽이면 몸은 한 번도 안 뒤집힌다
{const f=mk(true,Lp);let flips=0,prev=null;for(let t=0;t<10;t+=1/60){const e={...E,attack:(t%0.4)<0.1?fake:null};const s=f(e);if(prev!==null&&s!==prev)flips++;prev=s;}ok('10s loop with pose-window fake attacks: 0 flips (got '+flips+')',flips===0);}

// ── 핏빛 수호로 추격자(dist03): 길 칸이 큰 계단(+x 0.85칸 → +y 0.85칸, 속도 2.2) — 화면에선 똑바로 아래로 걷는데 R444 가 칸마다 좌우를 바꿨다(실측 0.35~0.45초마다, 0.5초 안 되돌아옴 0~4회).
//    원인: R702 계단 판정이 최근 1.2칸 자취만 봐서, 한 칸이 0.85칸이면 자취가 마지막 한두 칸뿐이라 '그쪽으로 걷는 중'이라고 믿었다.
const F444=path.join(__dirname,'../../client-source/enemy-face-r444.js'),src444=fs.readFileSync(F444,'utf8');
ok('R444 runtime copy matches client source',fs.readFileSync(path.join(__dirname,'../../runtime-text/enemy-face-r444.js'),'utf8')===src444);
ok('pages.yml runs this check',/r96\/qa\/r1031\/r1031-cpu-check\.cjs/.test(fs.readFileSync(path.join(__dirname,'../../../.github/workflows/pages.yml'),'utf8')));
function env4(){const E={console,Math,JSON,Number,String,Object,WeakMap,Map,Set,Array,localStorage:{getItem:()=>null,setItem:()=>{}},time:0,player:{x:-60,y:60,hp:100},settings:{},read:[]};
 E.window=E;E.drawEnemy=function(e){E.read.push(e.direction);};E.shadow=function(){};vm.createContext(E);vm.runInContext(src444,E);return E;}
const mob=o=>({id:1,name:'핏빛 수호로 추격자',x:16,y:12,hp:1e4,maxHp:1e4,speed:2.2,spawnState:'active',direction:'right',midboss:true,combatProfile:{aggro:7,attackShape:{range:1.6}},...o});
function frames(E,e,n,step,dt=1/60){for(let i=0;i<n;i++){E.time+=dt;if(step)step(e,i,E.time);E.drawEnemy(e);}return E.read[E.read.length-1];}
const flipsIn=a=>{let f=0;for(let i=1;i<a.length;i++)if(a[i]!==a[i-1])f++;return f;};
for(const [leg,sp] of [[.85,2.2],[.85,2.4],[1.0,2.2],[.6,1.7]]){const E=env4(),e=mob({speed:sp});frames(E,e,1);E.read.length=0;let a=0,ax=0;
 frames(E,e,10*60,(e)=>{const d=sp/60;if(ax===0)e.x+=d;else e.y+=d;a+=d;if(a>=leg){a=0;ax^=1;}});
 const f=flipsIn(E.read.slice(60));ok(`big-cell staircase down-screen (leg ${leg}, speed ${sp}): side flips ≤ 1 in 9s (got ${f})`,f<=1);}
// 회귀(R702 와 같은 요구): 진짜 돌아서기는 0.45초 안, 긴 지그재그는 매번, 큰 계단이라도 오른쪽으로 치우치면 오른쪽 고정
{const E=env4(),e=mob({speed:1.7});frames(E,e,1);frames(E,e,90,e=>{e.x+=1.7/60;});frames(E,e,90,e=>{e.x-=1.7/60;});const at=E.read.slice(-90).indexOf('left');ok(`regression: real turn left followed within 0.45s (frame ${at})`,at>=0&&at<=27);}
{const E=env4(),e=mob({speed:2.2});frames(E,e,1);frames(E,e,90,e=>{e.x+=2.2/60;});frames(E,e,90,e=>{e.x-=1.1/60;e.y+=1.1/60;});const at=E.read.slice(-90).indexOf('left');ok(`regression: real turn to screen-left diagonal followed within 0.45s (frame ${at})`,at>=0&&at<=27);}
{const E=env4(),e=mob({speed:1.7});frames(E,e,1);E.read.length=0;frames(E,e,6*60,(e,i,t)=>{const ph=Math.floor(t/1.2)%2;e.x+=(ph?-1:1)*1.7/60;e.y-=(ph?-1:1)*0.2/60;});const f=flipsIn(E.read);ok(`regression: long zigzag (1.2s legs) still turns each leg (flips ${f} ≈ 4)`,f>=4&&f<=5);}
{const E=env4(),e=mob({direction:'left'});frames(E,e,1);E.read.length=0;let a=0,k=0;frames(E,e,8*60,(e)=>{const d=2.2/60;if(k<2)e.x+=d;else e.y+=d;a+=d;if(a>=.85){a=0;k=(k+1)%3;}});
 const tail=E.read.slice(180),f=flipsIn(tail);ok(`regression: big staircase with net right drift settles right and stays (flips ${f}, last ${tail[tail.length-1]})`,f===0&&tail[tail.length-1]==='right');}
// 막힌 채 기어가기(실측 g-fix-2 42.8~43.4초): 속도 2.2 보스가 0.3칸/초로 +x·+y 를 0.15초씩 번갈아 밀림 — 몸이 거의 안 움직이는데 좌우가 바뀌면 안 된다
{const E=env4(),e=mob({speed:2.2});frames(E,e,1);frames(E,e,60,e=>{e.y+=2.2/60;e.x-=.2/60;});E.read.length=0;
 frames(E,e,4*60,(e,i,t)=>{const ph=Math.floor(t/.15)%2;if(ph)e.x+=.3/60;else e.y+=.3/60;});const f=flipsIn(E.read);ok(`blocked crawl (0.3 cells/s on a 2.2 boss, x/y alternating): no side flips (got ${f})`,f===0);}
// 회귀: 느린 몹(속도 0.8)이 제 속도로 돌아서면 따라간다
{const E=env4(),e=mob({speed:.8});frames(E,e,1);frames(E,e,90,e=>{e.x+=.8/60;});frames(E,e,90,e=>{e.x-=.8/60;});const at=E.read.slice(-90).indexOf('left');ok(`regression: slow mob (0.8) real turn left followed within 0.5s (frame ${at})`,at>=0&&at<=30);}
console.log(`\nR1031 CPU check: ${pass}/${total} passed`);process.exit(pass===total?0:1);
