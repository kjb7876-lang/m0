// R1034 환도 W '월섬 회천' 7방향 분신 되살리기 — CPU 검사(가짜 엔진, R348 검사의 engine() 재사용).
//  node r96/qa/r1034/r1034-w-cpu-check.cjs
//  사용자 2026-11-14 13:34Z: "환도영웅 w 스킬 사용시 7방향에 환도분신 나오고 십자가베기 하면서 사라지는 이펙트 그거 멋있었는데 왜 없어짐"
//  원인: R705c(묶음 H 3f38f4b4, 2026-11-12)가 빈 둘레 채우기를 지워 원 밖 적이 없으면 분신 0. → 원 밖 적 곁(R705c) 먼저, 남은 자리는 원 둘레 7방향으로 채움.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='hwando-w-cross-r348.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const T=fs.readFileSync(path.join(R,'qa','r348','hwando-w-cross-cpu-check.cjs'),'utf8');
eval(T.slice(T.indexOf('function engine('),T.indexOf('const release=')));/* engine() */
const release=(E,id='wer:1')=>E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId:id,size:3.15});
const ring=3.15;
const sAngs=(E,c)=>{const o=E.g.project(20,20);return c.clones.map(s=>{const q=E.g.project(s.x,s.y);return Math.atan2(q.y-o.y,q.x-o.x);}).sort((a,b)=>a-b);};
const gaps=a=>a.map((v,i)=>i?v-a[i-1]:v+Math.PI*2-a[a.length-1]);
// ---- 원 밖 적 0: 7방향 분신 + 십자 베기 ----
{const E=engine({enemies:[{id:'in',x:21.5,y:20}]});E.ctx.drawHero();release(E,'wer:0');const c=E.api.inspect().casts[0];
 ok(c.clones.length===7,'원 밖에 적이 없어도 분신 7체(7방향) — '+c.clones.length);
 ok(c.clones.every(s=>s.foe==null),'빈 둘레 분신은 맡은 적 없음');
 ok(c.clones.every(s=>Math.hypot(s.x-20,s.y-20)>ring&&!E.g.blocked(s.x,s.y)),'분신 자리 모두 판정 원(3.15칸) 밖·막힌 칸 아님');
 const g=gaps(sAngs(E,c));ok(g.every(v=>v>.6&&v<1.3),'화면 기준 7방향 고르게(간격 '+g.map(v=>v.toFixed(2)).join(',')+')');
 E.adv(.5);E.cuts.length=0;E.ctx.drawEffect(E.g.effects.find(e=>e.r348Sentinel));
 for(let i=0;i<17;i++)E.adv(.033);E.cuts.length=0;E.ctx.drawEffect(E.g.effects.find(e=>e.r348Sentinel));
 const V=E.cuts.filter(k=>Math.abs(k.x0-k.x1)<1e-6),Hh=E.cuts.filter(k=>Math.abs(k.y0-k.y1)<1e-6);
 ok(V.length>=7&&Hh.length>=7,'분신 7 모두 그 자리에서 십자 베기(세로 '+V.length+'·가로 '+Hh.length+')');
 ok(E.cuts.every(k=>Math.abs(k.x0-k.x1)<1e-6||Math.abs(k.y0-k.y1)<1e-6),'십자는 똑바른 형태만(기울거나 거꾸로 된 칼 없음)');
 for(let i=0;i<20;i++)E.adv(.033);ok(E.hits.length===0,'곁에 적이 없는 분신 베기는 피해 없음(원 안 적도 분신 피해 없음)');
 ok(E.api.inspect().stats.slashes===7&&E.api.inspect().casts.length===0,'7번 베고 사라짐(정리)');}
// ---- 원 밖 적 3: 적 곁 3(R705c 유지) + 빈 둘레 4 ----
{const out=[{id:'a',x:25,y:20},{id:'b',x:20,y:25.2},{id:'c',x:16.5,y:23.5}];const E=engine({enemies:out});E.ctx.drawHero();release(E,'wer:3');const c=E.api.inspect().casts[0];
 ok(c.clones.length===7,'원 밖 적 3: 분신 7');const nf=c.clones.filter(s=>s.foe);ok(nf.length===3&&nf.every(s=>{const e=out.find(e=>e.id===s.foe);return Math.hypot(e.x-s.x,e.y-s.y)<=1;}),'R705c 유지: 적 3 곁(1칸 안)에 먼저 섬');
 const g=gaps(sAngs(E,c));ok(Math.min(...g)>.3,'분신끼리 겹치지 않음(최소 간격 '+Math.min(...g).toFixed(2)+')');
 for(let i=0;i<40;i++)E.adv(.033);ok(JSON.stringify(E.hits.map(h=>h.id).sort())==='["a","b","c"]','피해는 적 곁 분신 베기에서만(a,b,c 한 번씩)');
 ok(E.hits.every(h=>Math.abs(h.v-100*1.25*.45)<1e-9),'분신 피해 수치 그대로(W×0.45)');}
// ---- 원 밖 적 9: 7 모두 적 곁 ----
{const out=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;out.push({id:'e'+i,x:20+Math.cos(a)*5,y:20+Math.sin(a)*5});}
 const E=engine({enemies:out.filter(e=>!(e.x>14&&e.x<15.5))});E.ctx.drawHero();release(E,'wer:9');const c=E.api.inspect().casts[0];
 ok(c.clones.length===7&&c.clones.every(s=>s.foe),'원 밖 적이 많으면 7 모두 적 곁');}
// ---- 경계·회귀 ----
{const E=engine({enemies:[]});E.ctx.drawHero();E.ctx.fx('storySourceSkill',NaN,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId:'nan'});ok(E.api.inspect().casts.length===0&&E.api.inspect().stats.errors===0,'원점 NaN 이면 시전 안 받음·오류 0');}
{const E=engine({enemies:[]});E.ctx.drawHero();release(E,'wer:e');const c=E.api.inspect().casts[0];ok(c.clones.length===7&&c.clones.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)),'적 하나도 없는 방: 분신 7, 좌표 유한');}
{const E=engine({coop:'host',enemies:[]});E.ctx.drawHero();release(E,'wer:co');ok(!E.api.inspect().casts[0]?.clones.length,'협동: 분신 만들지 않음(그대로)');}
{const E=engine({enemies:[]});E.ctx.drawHero();E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'e',stage:'release',castId:'e1'});ok(E.api.inspect().casts.length===0,'환도 E 등 다른 슬롯은 분신 없음');}
{const E=engine({enemies:[]});E.ctx.drawHero();release(E,'wer:w1');release(E,'wer:w1');ok(E.api.inspect().casts.length===1,'같은 castId 는 한 번');}
{const E=engine({enemies:[]});E.api.set(false);E.ctx.drawHero();release(E,'wer:off');ok(E.api.inspect().casts.length===0,'끄기 설정 그대로 작동');E.api.set(true);}
console.log(JSON.stringify({ok:true,checks:n,method:'fake-engine(R348 engine)'}));
