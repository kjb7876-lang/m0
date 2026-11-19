'use strict';
// R1235b 미카엘라 스킬 이펙트 → Dots 프레임 시트 CPU 검사 (사용자 2026-11-19 11:34Z "미카엘라 영웅 이펙트중 아직 프레임애니메이션 아닌 이펙트는 프레임애니메이션으로 개선적용")
//  R106 D2S 기술(Q 천국의 주먹·W 성역 방벽·E 날개 돌진·R 세라핌 강림)이 그리던 코드 한 장 그림 중 맞는 Dots 시트가 있는 것:
//   halo → M1 후광(반복) · pillar → M7 빛기둥(1회) · ring → C4 고리(반복) · 큰 십자(표적 표시) → M4 하트 적중(1회, 발 = 십자 아래끝) · flare → M4(같은 효과에 큰 십자가 있으면 뺌)
//  node r96/qa/r1235/r1235-skill-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='hero-dots-fx-r1041.js',src=rd(path.join(R,'client-source',NAME));
ok(rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1235/r1235-skill-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const MF=(c=>c)('178.26.62:226.232.242'),R106P=(name,col=MF)=>'r106fx:'+name+':'+col;
function sandbox({prefs={},images=true,hero='michaela'}={}){const store=new Map(Object.entries(prefs));
 class DC{constructor(){this.commands=[];this.owner={};this.globalAlpha=.5;}
  scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}}
  push(kind,data){this.commands.push({kind,owner:{...this.owner},alpha:this.globalAlpha,...data});}
  img(path,x,y,w,h){this.push('image',{image:{tag:path},mutable:false,sourcePath:path,immutableTint:{path},sourceRect:[0,0,10,10],imageSize:[10,10],points:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});}}
 const ctx=new DC();
 const w={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Date,Promise,Error,isFinite,setTimeout:()=>0,clearTimeout:()=>0,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  StoryPhase1:{DrawCommands:DC},__STORYWORLD_POLISH_R101__:{effects:()=>[]},
  player:{hero,x:10,y:10,visualLiftPx:0},time:5,ctx,project:(x,y)=>({x:x*32,y:y*32}),actorHeight:()=>60,
  readyImage:p=>images?{image:{path:p,naturalWidth:2048,naturalHeight:256}}:null,addImage:()=>{},tick:function(){}};
 w.window=w;w.globalThis=w;vm.createContext(w);vm.runInContext(src,w,{filename:NAME});return {w,ctx};}
const run=(box,id,fn,ts)=>{const out=[];for(const t of ts){box.w.time=t;box.ctx.commands=[];box.ctx.scope({id,kind:'effect',x:10,y:10,r106:true},()=>fn(box.ctx));out.push(box.ctx.commands.slice());}return out;};
const ts=Array.from({length:12},(_,i)=>5+i/24),H=60;
const src_=c=>c.sourcePath,cx=c=>(c.points[0][0]+c.points[1][0])/2,bot=c=>c.points[3][1],wid=c=>c.points[1][0]-c.points[0][0],hei=c=>c.points[3][1]-c.points[0][1];
// halo → M1
{const B=sandbox();const F=run(B,'r106:7',c=>c.img(R106P('halo'),100,40,66,24),ts).flat();
 ok(F.every(c=>src_(c)==='assets/r1041/fx-m1-michaela-halo.webp')&&new Set(F.map(c=>c.sourceRect[0])).size>=4,'후광(W·R) → M1 후광 시트, 칸이 시간 따라 바뀜');
 ok(F.every(c=>Math.abs(cx(c)-133)<.01&&Math.abs(wid(c)-66*1.45)<.01),'M1 은 원래 후광 가운데 1.45배');}
// pillar → M7 (발 유지, 높이 유지, 너비 = 높이/2)
{const B=sandbox();const F=run(B,'r106:8',c=>c.img(R106P('pillar'),100-42,300-270*.99,84,270),ts).flat();
 ok(F.every(c=>src_(c)==='assets/r1041/fx-m7-michaela-sky-pillar.webp'),'빛기둥(Q·R) → M7 빛기둥 시트');
 ok(F.every(c=>Math.abs(cx(c)-100)<.01&&Math.abs(c.points[0][1]+hei(c)*.98-300)<.6&&Math.abs(hei(c)-270)<.6&&Math.abs(wid(c)-135)<.6),'M7 칸 바닥 .98 = 원래 기둥 발, 높이 같음, 너비 = 높이/2',F[0].points);
 const fr=F.map(c=>c.sourceRect[0]/256);ok(fr[0]===0&&fr.every((v,i)=>i===0||v>=fr[i-1])&&fr.at(-1)>=4,'M7 은 1회 재생(0번 칸부터 앞으로)',fr);}
// ring → C4
{const B=sandbox();const F=run(B,'r106:9',c=>c.img(R106P('ring'),40,280,120,60),ts).flat();
 ok(F.every(c=>src_(c)==='assets/r1041/fx-c4-ground-ring.webp'&&Math.abs(wid(c)-120)<.01&&Math.abs(hei(c)-60)<.01),'고리(Q·W·E·R) → C4 고리 시트, 같은 자리·크기');}
// 큰 십자 → M4(발 = 십자 아래끝), 같은 효과의 flare 는 뺌
{const B=sandbox();const F=run(B,'r106:10',c=>{c.img(R106P('cross'),100-33,200-99*.3385,66,99);c.img(R106P('flare','255.230.200:255.255.255'),60,190,100,100);},ts);
 const all=F.flat();ok(all.every(c=>src_(c)==='assets/r1041/fx-m4-michaela-hit.webp')&&F.every(f=>f.length===1),'표적 큰 십자(Q·R) → M4 하트 적중 시트 한 장, 같은 효과 섬광은 빠짐',F.map(f=>f.length));
 ok(all.every(c=>Math.abs(cx(c)-100)<.01&&Math.abs(c.points[0][1]+hei(c)*.85-(200+99*(1-.3385)))<.6&&Math.abs(wid(c)-H*1.7)<.6),'M4 크기 = 영웅 키 1.7배, 칸 .85 = 십자 아래끝');}
// 섬광만(E 날개 돌진 적중) → M4 (중심 아래 영웅 키 .4 를 발로)
{const B=sandbox();const F=run(B,'r106:11',c=>c.img(R106P('flare'),60,100,120,120),ts).flat();
 ok(F.every(c=>src_(c)==='assets/r1041/fx-m4-michaela-hit.webp'&&Math.abs(cx(c)-120)<.01&&Math.abs(c.points[0][1]+hei(c)*.85-(160+H*.4))<.6),'큰 십자 없는 섬광(E) → M4, 발 = 섬광 가운데 + 영웅 키 .4');}
// 작은 십자(방벽 둘레·주먹 빛살) → 그대로(맞는 시트 없음, Dots 요청 대상)
{const B=sandbox();const F=run(B,'r106:12',c=>c.img(R106P('cross'),100,100,18,27),ts).flat();ok(F.every(c=>src_(c)===R106P('cross')),'작은 십자(영웅 키 .5 미만) 그대로');}
// 회귀·경계
{const B=sandbox();const F=run(B,'r106:13',c=>{c.img(R106P('feather'),0,0,20,60);c.img(R106P('spark'),0,0,40,10);c.img(R106P('glow'),0,0,50,50);},ts).flat();ok(F.every(c=>/^r106fx:(feather|spark|glow):/.test(src_(c))),'시트 없는 깃털·불꽃줄·빛은 그대로');}
{const B=sandbox({hero:'neon'});const F=run(B,'r106:14',c=>{c.img(R106P('ring'),0,0,50,25);c.img(R106P('halo'),0,0,50,20);},ts).flat();ok(F.every(c=>/^r106fx:/.test(src_(c))),'다른 영웅 기술 그대로');}
{const B=sandbox({prefs:{'storyworld.r1235.skillSheets':'off'}});const F=run(B,'r106:15',c=>c.img(R106P('ring'),0,0,50,25),ts).flat();ok(F.every(c=>/^r106fx:/.test(src_(c))),'끄면(storyworld.r1235.skillSheets=off) 그대로');}
{const B=sandbox({images:false});const F=run(B,'r106:16',c=>c.img(R106P('pillar'),0,0,50,200),ts).flat();ok(F.every(c=>/^r106fx:/.test(src_(c))),'시트 그림이 아직 없으면 원래 그림');}
{const B=sandbox();let thrown=null;try{run(B,'r106:17',c=>{c.img(R106P('pillar'),NaN,0,50,200);c.img(R106P('cross'),0,NaN,66,99);c.img(R106P('flare'),0,0,NaN,NaN);},ts);}catch(e){thrown=e;}
 const all=B.ctx.commands;ok(!thrown&&all.every(c=>c.points.flat().every(v=>Number.isFinite(v))||/^r106fx:/.test(src_(c))),'NaN 자리에도 던지지 않고 유한하지 않은 시트 명령을 만들지 않음');}
{const B=sandbox();const F=run(B,'r101:aura-front:hero',c=>c.img(R106P('halo'),100,40,56,21),ts).flat();ok(F.every(c=>src_(c)==='assets/r1041/fx-m1-michaela-halo.webp'),'예전 R1041 오라 후광 규칙 그대로');}
console.log(JSON.stringify({passed:n-bad,failed:bad}));process.exit(bad?1:0);
