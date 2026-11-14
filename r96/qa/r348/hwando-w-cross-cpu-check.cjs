// R348 환도 W '월섬 회천' 십자 베기 + 원 밖 분신 7 + 분신 스플래시 — CPU 검사(정적 + 가짜 엔진 행동).
//  node r96/qa/r348/hwando-w-cross-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F='hwando-w-cross-r348.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적 ----
for(const f of [F,'fx-d2s-r106.js','hero-fx-r102.js','hud-bgm-hwando-w-r313.js'])ok(fs.readFileSync(path.join(R,'client-source',f),'utf8')===fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),f+' runtime-text 사본 일치');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2&&/<script src="\.\/enemy-hexagram-r341\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/hwando-w-cross-r348\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*\s*<script src="\.\/combat-r118\.js">/.test(html),'index.html 스크립트 태그 한 번(enemy-hexagram-r341 뒤, combat-r118 앞)');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r348\/hwando-w-cross-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));ok(JSON.stringify(man).includes(F),'runtime-manifest 에 들어 있음');
const code=strip(src);
ok(!/'rune'|'runecross'|'blade'/.test(code),'상징 규칙: 룬·십자 마법진·초승달 칼날 그림을 쓰지 않음');
ok(!/drop-shadow|blur\(/.test(code)&&/ctx\.filter='saturate\(\.3\) brightness\(1\.12\)'/.test(code),'Three.js 기록기: filter 는 saturate·brightness 만');
ok(/S\.draw\('cross'/.test(code)&&/'iai-cut'/.test(code),'바닥 표식은 십자가(cross), 베기는 iai-cut + slashline');
const d2s=strip(fs.readFileSync(path.join(R,'client-source','fx-d2s-r106.js'),'utf8')),r102=strip(fs.readFileSync(path.join(R,'client-source','hero-fx-r102.js'),'utf8')),r313=strip(fs.readFileSync(path.join(R,'client-source','hud-bgm-hwando-w-r313.js'),'utf8'));
ok(/function launch\(hero,slot,angle,target\)\{if\(!on\(\)\|\|!live\(\)\)return;if\(window\.__STORYWORLD_HWANDO_W_CROSS_R348__\?\.owns\?\.\(hero,slot\)\)return;/.test(d2s),'fx-d2s-r106: 환도 W 의 소용돌이 칼날(hammer) 을 띄우지 않음');
ok(/function cast\(slot,angle,origin,target\)\{[^\n]*if\(window\.__STORYWORLD_HWANDO_W_CROSS_R348__\?\.owns\?\.\(hero,slot\)\)return;/.test(r102),'hero-fx-r102: 환도 W 의 초승달(blade 스타일) 을 띄우지 않음');
ok(/owns\?\.\('hwando','w'\)\)\{[^\n]*base\.call\(this,im,7\*384,/.test(r313),'R313: 띠 꼬리 세 칼날 대신 다 그려진 원(7칸)이 옅어짐');
ok(/slayer:\{w:'nova',r:'hammer'\}/.test(fs.readFileSync(path.join(R,'client-source','hero-skills-r269.js'),'utf8')),'다른 영웅(슬레이어 R hammer) 표는 그대로');

// ---- 가짜 엔진 행동 ----
function engine({coop=null,enemies}={}){
 const hits=[],draws=[],floats=[];let clock=10;
 const room={id:'room1',enemies:enemies.map(e=>({radius:.3,hp:1000,maxHp:1000,...e}))};
 const W={};const g={window:W,localStorage:{getItem:()=>null,setItem:()=>{}},console,Math,JSON,Set,Map,WeakSet,Array,Object,String,Number,Error,
  get time(){return clock;},TILE:32,zoom:1,room,zone:'z1',settings:{lowFx:false},effects:[],
  player:{x:20,y:20,hp:100,hero:'hwando',direction:'e'},
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>room.enemies.filter(e=>e.hp>0),damageable3:()=>true,
  blocked:(x,y)=>x<1||y<1||x>60||y>60||(x>14&&x<15.5),clearLine:()=>true,attackPower:()=>100,
  hitEnemy:(e,v,s)=>{hits.push({id:e.id,v,s});e.hp-=v;return true;},floatText:(t)=>floats.push(t),
  fx:()=>{},drawEffect:()=>{},tick:()=>{},
  // 영웅 몸 그림 한 장(R271 몸)
  drawHero(){g.ctx.commands.push({kind:'image',owner:{kind:'hero'},r271:'walk',image:{width:192,height:256},sourceRect:[0,0,192,256],sourcePath:'assets/r283/hwando/r271/walk-e.webp',points:[[620,580],[680,580],[680,660],[620,660]]});},enterRegion:async()=>true,
  ctx:{commands:[],save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(){draws.push('body');},globalAlpha:1,globalCompositeOperation:'source-over',filter:'none'}};
 const cuts=[],sprites=[];W.__STORYWORLD_FX_SPRITES_R106__={on:()=>true,warm(){},draw:(nm,F,x,y,w,h,o)=>{draws.push(nm);sprites.push({nm,x,y,w,h,o:o||{}});return true;},along:(nm,F,x0,y0,x1,y1,th)=>{draws.push(nm);if(nm==='iai-cut')cuts.push({x0,y0,x1,y1,th});return true;}};
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 const ctx=vm.createContext(g);vm.runInContext(src,ctx,{filename:F});
 return {g,ctx,W,hits,draws,floats,room,cuts,sprites,adv(dt){clock+=dt;ctx.tick(dt);},api:W.__STORYWORLD_HWANDO_W_CROSS_R348__};
}
const release=(E,id='wer:1')=>E.ctx.fx('storySourceSkill',20,20,{storyWER:true,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId:id,size:3.15});
const outside=[{id:'a',x:25,y:20},{id:'b',x:20,y:25.2},{id:'c',x:16.5,y:23.5},{id:'far',x:40,y:40}],inside={id:'in',x:21.5,y:20};
{const E=engine({enemies:[inside,...outside]});const A=E.api;
 ok(A.owns('hwando','w')&&!A.owns('hwando','r')&&!A.owns('slayer','r')&&!A.owns('seoha','w'),'owns: 환도 W 만');
 E.ctx.drawHero();E.adv(.016);release(E);release(E);// 같은 castId 두 번 → 한 번만
 const c=A.inspect().casts;ok(c.length===1&&c[0].clones.length===7&&c[0].clones.filter(s=>s.foe).length===3,'R1034(사용자 11-14 동작 변경, R705c 대체): 원 밖 적 3 곁 먼저 + 남은 자리 원 둘레 채워 분신 7(같은 castId 는 한 번)');
 ok(c[0].clones.filter(s=>s.foe).every(s=>{const e=[...outside].find(e=>e.id===s.foe);return e&&Math.hypot(e.x-s.x,e.y-s.y)<=1;}),'R705c: 적을 맡은 분신은 그 적에서 1칸 안(근접 영웅은 적 곁에 나타남)');
 ok(c[0].body,'분신은 그 순간 영웅 몸 그림(R271 몸)을 쓴다');
 const near=c[0].clones.filter(s=>s.foe).map(s=>s.foe).sort();ok(JSON.stringify(near)===JSON.stringify(['a','b','c']),'원 밖 적 곁을 먼저 고름(원 안·너무 먼 적 제외): '+near);
 ok(c[0].clones.every(s=>Math.hypot(s.x-20,s.y-20)>3.15&&!E.g.blocked(s.x,s.y)),'분신 자리는 모두 판정 원(3.15) 밖, 막힌 칸 아님');
 E.adv(.5);ok(E.hits.length===0,'0.7초 서 있는 동안은 피해 없음');
 ok(E.draws.includes('iai-cut')&&E.draws.includes('cross')&&E.draws.includes('body')||(E.ctx.drawEffect(E.g.effects.find(e=>e.r348Sentinel)),E.draws.includes('iai-cut')&&E.draws.includes('cross')&&E.draws.includes('body')),'그림: 십자 베기(iai-cut)·바닥 십자가·분신 몸');
 ok(!E.draws.includes('blade')&&!E.draws.includes('rune')&&!E.draws.includes('runecross'),'초승달 칼날·룬 없음');
 for(let i=0;i<40;i++)E.adv(.033);
 const ids=E.hits.map(h=>h.id).sort();ok(JSON.stringify(ids)===JSON.stringify(['a','b','c']),'0.7초 뒤 분신 십자 베기가 곁의 적에게 스플래시(원 안·먼 적은 분신 피해 없음): '+ids);
 ok(E.hits.every(h=>Math.abs(h.v-100*1.25*.45)<1e-9&&h.s.friendly&&h.s.owner==='hero'&&h.s.sourceHero==='hwando'&&h.s.r348Clone&&h.s.attackKind9==='skill'),'피해 = W 원 피해(공격력×1.25)의 0.45배, 영웅 피해 경로(hitEnemy friendly)');
 ok(E.floats.length===3,'피해 숫자 표시');
 const st=A.inspect().stats;ok(st.slashes===7&&st.clones===7,'분신 7(적 곁 3 + 빈 둘레 4) 모두 한 번씩 베기(R1034)');
 for(let i=0;i<30;i++)E.adv(.05);ok(E.hits.length===3&&A.inspect().casts.length===0,'끝난 뒤 다시 때리지 않고 정리됨');}
{const E=engine({enemies:[inside]});E.ctx.drawHero();release(E,'wer:9');const c=E.api.inspect().casts[0];
 ok(c.clones.length===7&&c.clones.every(s=>!s.foe),'R1034(사용자 11-14 동작 변경, R705c 대체): 원 밖에 적이 없어도 원 둘레 7방향 분신');
 for(let i=0;i<40;i++)E.adv(.033);ok(E.hits.length===0,'적이 없으면 피해 없음');}
{const E=engine({coop:'host',enemies:[inside,...outside]});E.ctx.drawHero();release(E);for(let i=0;i<40;i++)E.adv(.033);
 ok(E.api.inspect().casts.length===0||E.api.inspect().casts[0].clones.length===0,'협동(R62 mode≠off): 분신을 만들지 않음');ok(E.hits.length===0&&E.api.inspect().stats.coopSkipped===1,'협동: 분신 피해를 넣지 않음(권한 불분명)');}
{const E=engine({enemies:[inside,...outside]});E.api.set(false);E.ctx.drawHero();release(E);for(let i=0;i<40;i++)E.adv(.033);
 ok(E.hits.length===0&&!E.api.owns('hwando','w'),'끄면 예전 그대로(분신·피해 없음, owns false)');}
{const E=engine({enemies:[inside,...outside]});E.ctx.drawHero();release(E);E.g.room={id:'other',enemies:[]};E.ctx.room=E.g.room;for(let i=0;i<40;i++)E.adv(.033);
 ok(E.hits.length===0,'방이 바뀌면 남은 분신 베기 취소');}
// Codex P2: 원 바로 밖 적(3.6칸) — 0.72칸 물러선 자리(2.88)는 원 안이라 적 자리로 바꿔야 한다
{const E=engine({enemies:[{id:'edge',x:23.6,y:20}]});E.ctx.drawHero();release(E,'wer:edge');const c=E.api.inspect().casts[0],s=c.clones.find(s=>s.foe==='edge');
 const o=E.g.project(20,20),sd=p=>{const q=E.g.project(p.x,p.y);return Math.hypot(q.x-o.x,q.y-o.y);},ringPx=E.api.config.ringCell*32;
 ok(c.clones.every(s=>Math.hypot(s.x-20,s.y-20)>3.15&&(!s.foe||sd(s)>ringPx*1.02)),'원 바로 밖 적: 물러선 뒤에도 분신은 원 밖(판정·화면) — '+(s?s.x+','+s.y:'skip'));}
// R425(사용자 2026-11-08 "분신7개나오고 십자베기하는거 십자를-십자가로"): '+' 베기 → 정십자가(위 짧고 아래 긴, 바닥 십자가 그림과 같은 비율). 역십자·회전 금지.
function latin(cuts){const V=cuts.filter(c=>Math.abs(c.x0-c.x1)<1e-6&&c.y1>c.y0),Hs=cuts.filter(c=>Math.abs(c.y0-c.y1)<1e-6&&c.x1>c.x0),out=[];
 for(const v of V){/* 같은 화면 x 에 분신 둘이 설 수 있어 세로 칼 길이 안에 걸친 가로 칼 가운데 가장 가까운 것과 짝짓는다 */
  const h=Hs.filter(h=>Math.abs((h.x0+h.x1)/2-v.x0)<1e-6&&h.y0>v.y0&&h.y0<v.y1).sort((a,b)=>Math.abs(a.y0-(v.y0+v.y1)/2)-Math.abs(b.y0-(v.y0+v.y1)/2))[0];if(!h)continue;const by=h.y0,top=by-v.y0,bottom=v.y1-by,hw=(h.x1-h.x0)/2;out.push({cx:v.x0,by,top,bottom,hw,ratio:top/bottom,side:hw/top});}return out;}
{const E=engine({enemies:[inside,...outside]});E.ctx.drawHero();E.adv(.016);release(E,'wer:latin');const S=E.g.effects.find(e=>e.r348Sentinel);
 E.adv(.2);E.cuts.length=0;E.sprites.length=0;E.ctx.drawEffect(S);
 const main=latin(E.cuts);ok(main.length===1&&main[0].top>0&&main[0].ratio>.45&&main[0].ratio<.6,'원 안 베기: 정십자가 — 교차점 위 칼이 아래 칼의 '+(main[0]?main[0].ratio.toFixed(2):'?')+'배(위 짧고 아래 긴)');
 ok(main.length===1&&Math.abs(main[0].side-1)<.1,'원 안 베기: 가로 칼 반폭이 위 칼과 거의 같음(라틴 십자가 비율 '+(main[0]?main[0].side.toFixed(2):'?')+')');
 const fl=E.sprites.filter(s=>s.nm==='flare');ok(fl.length===1&&Math.abs(fl[0].y-main[0].by)<1e-6&&!fl[0].o.angle,'교차점 반짝임은 가로 칼 높이(교차점)에, 돌리지 않음');
 E.adv(.9);E.cuts.length=0;E.sprites.length=0;E.ctx.drawEffect(S);
 const cl=latin(E.cuts);ok(cl.length===7&&cl.every(c=>c.top>0&&c.ratio>.45&&c.ratio<.6&&Math.abs(c.side-1)<.1),'분신 베기 모두 정십자가(위 짧고 아래 긴): '+cl.length+'개 '+cl.map(c=>c.ratio.toFixed(2)).join(','));
 ok(E.cuts.every(c=>Math.abs(c.x0-c.x1)<1e-6&&c.y1>c.y0||Math.abs(c.y0-c.y1)<1e-6&&c.x1>c.x0),'베기는 세로(위→아래)·가로(왼→오른)뿐 — 기울거나 거꾸로 된 칼 없음');}
console.log(JSON.stringify({ok:true,checks:n,method:'static+fake-engine'}));
