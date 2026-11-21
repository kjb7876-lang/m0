'use strict';
// R1293 미카엘라 실제 플레이 이펙트 정리 CPU 검사 (사용자 2026-11-21 11:30Z "미카엘라영웅 플레이 관련해서 전수조사 특히 이펙트 … 너무 밝거나 예전이펙트가 나오지 않는지 검토조사후 개선적용")
//  헤드리스 전수(qa/r1293/probe.mjs)에서 찾은 것: 실제 W·E(R247 성흔 광시·성광주)·Q·R(R102 영웅 기술 덧그림)은 R1235 시트 규칙(owner.r106 만)을 안 타 코드 한 장 그림 그대로,
//  평타 적중마다 R160 코드 빛살·고리 + 옛 푸른 베기 F246(final42) + Q·R 적중마다 옛 R100 sig-slash 덧겹(덧셈 2천여 번 → Q 폭발이 하얗게 탐).
//  node r96/qa/r1293/r1293-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,400));}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='hero-dots-fx-r1041.js',src=rd(path.join(R,'client-source',NAME));
ok(rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1293/r1293-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const GOLD='236.190.120:255.246.222',BLOOD='150.22.34:236.120.110',PALE='200.150.120:255.236.210',MF='178.26.62:226.232.242',P=(name,col=MF)=>'r106fx:'+name+':'+col;
function sandbox({prefs={},hero='michaela'}={}){const store=new Map(Object.entries(prefs));
 class DC{constructor(){this.commands=[];this.owner={};this.globalAlpha=.5;}
  scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}}
  push(kind,data){this.commands.push({kind,owner:{...this.owner},alpha:this.globalAlpha,...data});}
  img(path,x,y,w,h){this.push('image',{image:{tag:path},mutable:false,sourcePath:path,immutableTint:{path},sourceRect:[0,0,10,10],imageSize:[10,10],points:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});}}
 const ctx=new DC();
 const w={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Date,Promise,Error,isFinite,setTimeout:()=>0,clearTimeout:()=>0,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  StoryPhase1:{DrawCommands:DC},__STORYWORLD_POLISH_R101__:{effects:()=>[]},
  player:{hero,x:10,y:10,visualLiftPx:0},time:5,ctx,project:(x,y)=>({x:x*32,y:y*32}),actorHeight:()=>60,
  readyImage:p=>({image:{path:p,naturalWidth:2048,naturalHeight:256}}),addImage:()=>{},tick:function(){}};
 w.window=w;w.globalThis=w;vm.createContext(w);vm.runInContext(src,w,{filename:NAME});return {w,ctx};}
const frame=(box,owner,fn,t=5)=>{box.w.time=t;box.ctx.commands=[];box.ctx.scope(owner,()=>fn(box.ctx));return box.ctx.commands.slice();};
const code=c=>/^r106fx:/.test(String(c.sourcePath||'')),fin=c=>c.points.flat().every(Number.isFinite);
const FEATHER='assets/r1048/fx/ego_feathers.webp';
// ① R247 W 성흔 광시·E 성광주 (owner r247:fx, r106 표시 없음)
{const B=sandbox(),O={id:'r247:fx',kind:'scene'};
 const z=frame(B,O,c=>{c.img(P('slashline',GOLD),100,200,300,20);c.img(P('slashline',BLOOD),100,195,300,34);c.img(P('glow',GOLD),150,190,40,40);c.img(P('cross',BLOOD),380,150,54,81);for(let i=0;i<6;i++)c.img(P('feather',PALE),120+i*40,180,10,30);});
 ok(z.length>0&&z.every(c=>!code(c)),'W 성흔 광시: 빛줄·빛·십자·깃털 코드 그림 0',z.map(c=>c.sourcePath));
 ok(z.some(c=>c.sourcePath==='assets/r1235/fx-mk03-michaela-ribbon.webp')&&z.some(c=>c.sourcePath==='assets/r1235/fx-mk04-michaela-glow.webp')&&z.some(c=>c.sourcePath==='assets/r1041/fx-m4-michaela-hit.webp'),'W: 빛줄→MK03 리본, 빛→MK04, 큰 십자→M4 하트 적중');
 ok(z.filter(c=>c.sourcePath==='assets/r1235/fx-mk03-michaela-ribbon.webp').length===1,'빛줄 금빛·핏빛 두 겹 → 리본 한 줄(핏빛 넓은 겹은 분홍 안개라 뺌)');
 const fz=z.filter(c=>c.sourcePath===FEATHER);ok(fz.length>=1&&fz.length<=2,'깃털 6장 → 깃털 흩날림 시트 1~2번(3장에 1번)',fz.length);
 const x=frame(B,O,c=>{c.img(P('halo',GOLD),100,20,132,48);c.img(P('cross',BLOOD),100,300,96,24);for(let i=0;i<4;i++){c.img(P('pillar',GOLD),100+i*60,48,54,252);c.img(P('pillar',BLOOD),100+i*60,96,84,204);c.img(P('glow',GOLD),100+i*60,290,96,48);}},6);
 ok(x.length>0&&x.every(c=>!code(c)),'E 성광주: 후광·기둥·빛·십자 코드 그림 0',x.filter(code).map(c=>c.sourcePath));
 const pil=x.filter(c=>c.sourcePath==='assets/r1041/fx-m7-michaela-sky-pillar.webp');ok(pil.length===4,'기둥 8줄(금·핏빛 겹) → M7 빛기둥 4줄(핏빛 겹은 뺌 — 같은 자리 두 장 겹쳐 밝아짐)',pil.length);
 ok(x.some(c=>c.sourcePath==='assets/r1041/fx-m1-michaela-halo.webp'),'하늘 후광 → M1');ok(x.every(fin),'좌표 유한');}
// ② R102 영웅 기술 덧그림(Q·R)
{const B=sandbox(),O={id:'r102:41',kind:'effect'};
 const f=frame(B,O,c=>{for(let i=0;i<6;i++){c.img(P('spark'),100+i*9,100,40,8);c.img(P('shard'),90+i*9,120,12,18);c.img(P('feather'),80+i*9,90,10,30);}c.img(P('ring'),60,200,160,60);c.img(P('glow'),60,60,90,90);c.img(P('slashline'),40,80,200,14);c.img(P('cross'),120,80,20,30);c.img(P('flare'),130,90,50,50);});
 ok(f.every(c=>!code(c)),'Q·R 덧그림(R102): 빛살·파편·깃털·고리·빛·베기선·십자·섬광 코드 그림 0',f.filter(code).map(c=>c.sourcePath));
 const rb=f.filter(c=>c.sourcePath==='assets/r1235/fx-mk03-michaela-ribbon.webp').length;ok(rb>=2&&rb<=3,'빛살 6·베기선 1 → 빛 리본 2~3장(3장에 1장, 화면 분홍빛 덮임 방지)',rb);
 ok(f.filter(c=>c.sourcePath==='assets/r1235/fx-mk02-michaela-mark.webp').length<=4,'파편 6장 → MK02 빛 표식 많아야 3장(+작은 십자 1)');ok(f.every(fin),'좌표 유한');}
// ③ 깃털 흩날림 1회 재생 · R106 D2S 깃털(천국의 주먹)도 시트로
{const B=sandbox();const O={id:'r102:3',kind:'effect'};
 const fr=[5,5.1,5.2,5.3,5.45].map(t=>frame(B,O,c=>c.img(P('feather'),80,90,10,30),t)[0].sourceRect[0]/256);
 ok(fr[0]===0&&fr.every((v,i)=>!i||v>=fr[i-1])&&fr.at(-1)>=4,'깃털 시트는 1회 재생(0번 칸부터)',fr);
 const f=frame(B,{id:'r106d2s:3',kind:'effect',r106:true},c=>{for(let i=0;i<9;i++)c.img(P('feather'),80+i*9,90,10,30);});ok(f.every(c=>!code(c))&&f.filter(c=>c.sourcePath===FEATHER).length===3,'D2S(천국의 주먹) 깃털 9장 → 깃털 시트 3번(사용자 12:27Z 결정)',f.map(c=>c.sourcePath));}
// ④ 평타 적중: R160 코드 빛살·고리·섬광·베기선, F246 옛 푸른 베기 → 미카엘라만 뺀다(하트 적중 시트가 이미 있음)
{const B=sandbox();const f=frame(B,{id:'r160:7',kind:'effect'},c=>{c.img(P('spark'),1,1,9,9);c.img(P('ring'),1,1,9,9);c.img(P('flare'),1,1,9,9);c.img(P('slashline'),1,1,9,9);});
 ok(f.length===0,'평타 R160 코드 적중 섬광 0(미카엘라)',f.map(c=>c.sourcePath));
 const g=frame(B,{id:'final42-r88:r99:r98:12:F246',kind:'effect'},c=>c.img('assets/final42-r88/effects/246/atlas.png',1,1,90,90));ok(g.length===0,'평타 옛 푸른 베기 F246 0(미카엘라)');
 const s=frame(B,{id:'r101:55',kind:'effect',x:10,y:10},c=>{c.img('assets/r100/sig-hit-magenta.webp',300,300,90,90);c.img('assets/r100/sig-slash-magenta.webp',300,300,160,90);});
 ok(!s.some(c=>/sig-slash/.test(c.sourcePath))&&s.some(c=>c.sourcePath==='assets/r1041/fx-m4-michaela-hit.webp'),'스킬 적중: M4 하트 적중만, 옛 R100 sig-slash 덧겹 0',s.map(c=>c.sourcePath));}
// ④b 밝기: 스킬 적중 M4·D2S 성광 캔버스·R102 시트는 옅게(Q 한 번에 화면이 하얗게 타지 않게)
{const B=sandbox();const s=frame(B,{id:'r101:56',kind:'effect',x:10,y:10},c=>c.img('assets/r100/sig-hit-magenta.webp',300,300,90,90));ok(s.length===1&&Math.abs(s[0].alpha-.25)<1e-9,'스킬 적중 M4 알파 .5배',s.map(c=>c.alpha));
 const d=frame(B,{id:'r106d2s:4',kind:'effect',r106:true},c=>c.img('',10,10,90,90));ok(d.length===1&&Math.abs(d[0].alpha-.25)<1e-9,'D2S 성광 캔버스 알파 .5배',d.map(c=>c.alpha));
 const g=frame(B,{id:'r563:pillar:1:2:sheet',kind:'effect'},c=>c.img('assets/r563/dots/michaela-pillar.webp',10,10,90,300));ok(g.length===1&&Math.abs(g[0].alpha-.4)<1e-9,'R 제네시스 R563 시트 .8배',g.map(c=>c.alpha));
 const w=frame(B,{id:'r247:fx',kind:'scene'},c=>c.img(P('glow',GOLD),150,190,40,40));ok(w.length===1&&w[0].alpha>.5&&w[0].alpha<=1,'R247 W·E 시트는 2.2배 진하게(상한 1) — 코드 한 장보다 가늘어 안 보이던 것',w.map(c=>c.alpha));
 const r=frame(B,{id:'r102:8',kind:'effect'},c=>c.img(P('ring'),40,280,120,60));ok(r.length===1&&Math.abs(r[0].alpha-.5*1.6*.55)<1e-9,'R102 고리 시트 .55배',r.map(c=>c.alpha));}
// ⑤ 다른 영웅은 그대로
{const B=sandbox({hero:'hwando'});const f=frame(B,{id:'r160:7',kind:'effect'},c=>{c.img(P('spark'),1,1,9,9);c.img('assets/final42-r88/effects/246/atlas.png',1,1,9,9);});
 ok(f.length===2&&f.every(c=>!/r1041|r1235|r1048/.test(c.sourcePath)),'환도: R160·F246 그대로');
 const r=frame(B,{id:'r102:4',kind:'effect'},c=>c.img(P('spark'),1,1,9,9));ok(r.length===1&&code(r[0]),'환도: R102 덧그림 그대로');
 const s=frame(B,{id:'r101:9',kind:'effect',x:99,y:99},c=>c.img('assets/r100/sig-slash-crimson.webp',1,1,9,9));ok(s.length===1,'환도: sig-slash 그대로');}
// ⑥ 끄기
{const B=sandbox({prefs:{'storyworld.r1293.michaelaFx':'off'}});const f=frame(B,{id:'r247:fx',kind:'scene'},c=>c.img(P('glow',GOLD),1,1,9,9));
 ok(f.length===1&&code(f[0]),'끄기(storyworld.r1293.michaelaFx=off) → 예전 그림');
 const g=frame(B,{id:'r160:1',kind:'effect'},c=>c.img(P('spark'),1,1,9,9));ok(g.length===1,'끄기 → R160 그대로');}
console.log(JSON.stringify({checks:n,fails:bad}));process.exit(bad?1:0);
