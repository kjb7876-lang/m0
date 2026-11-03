// R280 — 봉인된 문 너머에 갇힌 필수 적 데려오기(kair01 집결 중간보스 교착) + R272 777 앞질러 가기 적 거리 8칸(kair02 이전 포탈 멈춤).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const src=C('stranded-r280.js'),idx=RT('index.html');
ok('runtime copies match',RT('stranded-r280.js')===src&&RT('guide-r272.js')===C('guide-r272.js'));
ok('loaded once, after mob-fix-r275 and before combat-r118',idx.split('"./stranded-r280.js"').length===2&&idx.indexOf('"./mob-fix-r275.js"')<idx.indexOf('"./stranded-r280.js"')&&idx.indexOf('"./stranded-r280.js"')<idx.indexOf('"./combat-r118.js"'));
ok('in verify list and CI',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'stranded-r280.js'")&&fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r280/r280-cpu-check.cjs'));
// 가짜 세계: 영웅(20.5,20.5) 문 앞, R75 목표 = 보스 구역 안 중간보스(7.99,4.83), 그쪽 길 없음
function world(o={}){let t=0;const frames=[];const e={id:'kair01:ward-champion-r81:w1',nativeId:'w1',x:7.99,y:4.83,hp:100,spawnState:'active',nav:[1,2],...(o.e||{})};
 const ctx={localStorage:{getItem:()=>null,setItem(){}},console,performance:{now:()=>t*1000},setTimeout:()=>0,
  started:true,loading:false,modal:null,storyScene:null,zone:'kair01',time:0,player:{x:20.5,y:20.5,hp:777},room:{enemies:[e]},
  requestAnimationFrame:f=>{frames.push(f);return frames.length;},blocked:(x,y)=>x<1||y<1,
  findPath:(a,b)=>{const inBoss=p=>p.x<15&&p.y<15;return (o.reach||inBoss(a)===inBoss(b))?[b]:[];}};
 ctx.window=ctx;ctx.__STORYWORLD_GUIDE_R75__={currentGoal:()=>o.goal===null?null:{kind:o.kind||'enemy',id:e.id,point:e}};
 vm.createContext(ctx);vm.runInContext(src,ctx);const api=ctx.__STORYWORLD_STRANDED_R280__;
 const run=s=>{for(let i=0;i<s*30;i++){t+=1/30;ctx.time=t;const f=frames.shift();if(f)f(t*1000);}};return {ctx,e,api,run};}
{const W=world();W.run(3.5);ok('no move before ~6 s of no path (2 checks so far)',W.e.x===7.99&&W.api.inspect().stats.rescued===0,W.api.inspect());
 W.run(3);const s=W.api.inspect().stats,d=Math.hypot(W.e.x-20.5,W.e.y-20.5);
 ok('kair01 repro: unreachable rally midboss is blinked beside the hero (2.5–5 cells, reachable side)',s.rescued===1&&d>=2.4&&d<=5.1&&!(W.e.x<15&&W.e.y<15)&&W.e.nav.length===0,{e:[W.e.x,W.e.y],s});
 const hp=W.e.hp;ok('hp / spawn state untouched (position only)',hp===100&&W.e.spawnState==='active');}
{const W=world({reach:true});W.run(10);ok('reachable goal enemy is never moved',W.e.x===7.99&&W.api.inspect().stats.rescued===0);}
{const W=world({kind:'objective'});W.run(10);ok('only when the game goal is that enemy (objective/portal goals ignored)',W.e.x===7.99);}
{const W=world({e:{r170Tower:true}});W.run(10);ok('towers / fixed enemies are left alone',W.e.x===7.99);}
{const W=world();W.ctx.modal={};W.run(10);ok('paused while a panel is open',W.e.x===7.99);}
{const W=world({e:{attack:{t:0}}});W.run(10);ok('not during an attack',W.e.x===7.99);}
{const W=world();W.api.set(false);W.run(10);ok('off switch',W.e.x===7.99);}
{const j=world().api.judge;ok('judge: 3 misses → rescue, any reach resets',j(2,false).rescue===true&&j(1,false).rescue===false&&j(5,true).count===0);}
const g=C('guide-r272.js');ok('R272 forward: only enemies within 8 cells hold the 777 next-portal walk (kair02 stall, 26 cells away)',/function forward\(dt\)\{[^]*?nearestEnemy\(8\)/.test(g)&&!/function forward\(dt\)\{[^\n]*nearestEnemy\(40\)/.test(g));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R280 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
