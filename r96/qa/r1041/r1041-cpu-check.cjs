'use strict';
// R1041 Dots CX-0099FX 첫 시트(M1 미카엘라 후광·A5 슬레이어 피 불꽃·C2 영웅 피격·C4 성장 바닥 고리·H6 환도 발도) — CPU 검사.
// 사용자 2026-11-14 12:10Z·12:11Z·13:53Z "코드로 아직 스킬 구현해서 어색한 것 … 닷츠 프레임 애니메이션으로 … 가장 시급하게".
//  ① 빌드 연결(사본·태그·verify·pages.yml·manifest)  ② 시트 5장: 칸 수·칸마다 그림·서로 다른 칸
//  ③ 기록기 push 에서 R106 1장 그림(halo·flame(DARK)·glow(발밑 2:1)·iai-cut)을 Dots 시트 칸으로 바꾸고, 칸이 시간 따라 바뀜
//  ④ 영웅 피격(r101:N, 영웅 자리·heroHurt)만 C2 로, 선 줄기는 빠짐 / 적중(heroHit)은 그대로
//  ⑤ 그림 없으면 원래 그대로, 끔이면 손대지 않음, NaN 에도 던지지 않음, 범위 밖 R106 그대로
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='hero-dots-fx-r1041.js',src=rd(path.join(R,'client-source',NAME));
ok(src.length>0,NAME+' 존재');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
const html=rd(path.join(R,'runtime-text/index.html')),tag='<script src="./'+NAME+'"></script>';
ok(html.split(tag).length===2&&html.indexOf(tag)>html.indexOf('<script src="./polish-r101.js">')&&html.indexOf(tag)>html.indexOf('<script src="./fx-sprites-r106.js">')&&html.indexOf(tag)<html.indexOf('<script src="./combat-r118.js">'),'index.html 태그 한 번(polish-r101·fx-sprites-r106 뒤, combat-r118 앞)');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1041/r1041-cpu-check.cjs'),'pages.yml CPU 검사 줄');
const man=rd(path.join(R,'runtime-manifest.json')),inp=rd(path.join(R,'runtime-inputs.json'));
ok(man.includes(NAME)&&inp.includes(NAME),'runtime-manifest·runtime-inputs 에 모듈');
// ② 시트
const SHEETS={'fx-m1-michaela-halo':[256,96,8],'fx-a5-slayer-flame':[256,256,8],'fx-c2-hero-hurt':[192,192,6],'fx-c4-ground-ring':[256,128,8],'fx-h6-hwando-iai':[512,128,8],
 'fx-m3-michaela-ego-on':[384,384,6],'fx-m3-michaela-ego-loop':[384,384,10],'fx-m4-michaela-hit':[256,256,8],'fx-m5-michaela-ground-heart':[256,128,10],'fx-m7-michaela-sky-pillar':[256,512,12]};
const stats=(()=>{try{return JSON.parse(rd(path.join(__dirname,'sheet-stats.json')));}catch(_){return null;}})();
for(const [k,[w,h,f]] of Object.entries(SHEETS)){const p='assets/r1041/'+k+'.webp';ok(fs.existsSync(path.join(R,'runtime-text',p))&&man.includes(p),`시트 ${p} 있음·manifest 등록`);
 const s=stats?.[p];ok(!!s&&s.width===w*f&&s.height===h&&s.frames===f&&s.alpha.every(a=>a>0)&&s.distinct>=f-2,`${k} ${f}칸(${w}×${h}) 모두 그림·서로 다른 칸 ${s?.distinct}/${f-1}`);}
// ③~⑤ 상자: 기록기 push 를 흉내 낸다(phase1 DrawCommands 와 같은 꼴의 명령).
const R106P=(name,a='200.200.200',b='255.255.255')=>'r106fx:'+name+':'+a+':'+b;
function sandbox({prefs,images=true,hero='michaela'}={}){const store=new Map();if(prefs)store.set('storyworld.r1041.dotsfx',prefs);
 class DC{constructor(){this.commands=[];this.owner={};this.globalAlpha=.5;}
  scope(o,fn){const p=this.owner;this.owner=o;try{return fn();}finally{this.owner=p;}}
  push(kind,data){this.commands.push({kind,owner:{...this.owner},alpha:this.globalAlpha,...data});}
  img(path,x,y,w,h){this.push('image',{image:{tag:path},mutable:false,sourcePath:path,immutableTint:{path},sourceRect:[0,0,10,10],imageSize:[10,10],points:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});}
  stroke(pts){this.push('stroke',{paths:pts?[{points:pts}]:[]});}fill(pts){this.push('fill',{paths:pts?[{points:pts}]:[]});}}
 const ctx=new DC(),fx=[];
 const w={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Date,Promise,Error,isFinite,setTimeout:()=>0,clearTimeout:()=>0,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  StoryPhase1:{DrawCommands:DC},__STORYWORLD_POLISH_R101__:{effects:()=>fx.slice()},
  player:{hero,x:10,y:10,visualLiftPx:0},time:5,ctx,project:(x,y)=>({x:x*32,y:y*32}),actorHeight:()=>60,
  readyImage:p=>images?{image:{path:p,naturalWidth:2048,naturalHeight:256}}:null,addImage:()=>{},tick:function(){}};
 w.window=w;w.globalThis=w;vm.createContext(w);let err=null;try{vm.runInContext(src,w,{filename:NAME});}catch(e){err=e;}
 return {w,ctx,fx,err};}
const B=sandbox(),A=B.w.__STORYWORLD_HERO_DOTS_FX_R1041__;
ok(!B.err&&!!A&&typeof A.inspect==='function','전역 __STORYWORLD_HERO_DOTS_FX_R1041__ (inspect)');
const frames=(box,ownerId,fn,ts)=>{const out=[];for(const t of ts){box.w.time=t;box.ctx.commands=[];box.ctx.scope({id:ownerId,kind:'effect',x:10,y:10,r101:true},()=>fn(box.ctx));out.push(box.ctx.commands.slice());}return out;};
const ts=Array.from({length:24},(_,i)=>5+i/24);
// M1 후광
let F=frames(B,'r101:aura-front:hero',c=>c.img(R106P('halo'),100,40,56,21),ts);
let im=F.flat().filter(c=>c.kind==='image');
ok(im.length===24&&im.every(c=>c.sourcePath==='assets/r1041/fx-m1-michaela-halo.webp'),'미카엘라 후광 R106 halo → M1 시트');
ok(new Set(im.map(c=>c.sourceRect[0])).size>=6&&im.every(c=>c.sourceRect[2]===256&&c.sourceRect[3]===96),`M1 칸이 시간 따라 바뀜(${new Set(im.map(c=>c.sourceRect[0])).size}종)`);
ok(im.every(c=>Math.abs((c.points[0][0]+c.points[1][0])/2-128)<.01&&Math.abs((c.points[0][1]+c.points[3][1])/2-50.5)<.01&&Math.abs(c.points[1][0]-c.points[0][0]-56*1.45)<.01&&Math.abs(c.points[3][1]-c.points[0][1]-21*1.45)<.01),'M1 은 원래 후광 가운데에 1.45배(256:96 같은 비율)');
ok(im.every(c=>Math.abs(c.alpha-.575)<1e-9)&&B.ctx.globalAlpha===.5,'M1 알파 1.15배(기록기 알파는 원래대로 돌아옴)');
// A5 슬레이어 DARK 불꽃(두 겹 → 한 장)
const B2=sandbox({hero:'slayer'});
F=frames(B2,'r101:aura-back:hero',c=>{c.img(R106P('flame','60.8.16','110.30.42'),80,0,60,80);c.img(R106P('flame','222.22.52','255.120.130'),90,20,40,60);},ts);
im=F.flat().filter(c=>c.kind==='image');
ok(im.length===24&&im.every(c=>c.sourcePath==='assets/r1041/fx-a5-slayer-flame.webp'),'슬레이어 검붉은 불꽃(DARK) → A5 시트, 덧칠 불꽃 한 겹은 빠짐');
ok(new Set(im.map(c=>c.sourceRect[0])).size>=6,'A5 칸이 시간 따라 바뀜');
ok(im.every(c=>{const top=c.points[0][1],bot=c.points[3][1],feet=top+(bot-top)*.78,w=c.points[1][0]-c.points[0][0];return Math.abs(feet-77.6)<1&&Math.abs(w-75)<1&&Math.abs(bot-top-w)<1;}),'A5 는 발밑(원래 불꽃 바닥 .97)에 칸 불꽃 바닥(.78)을 맞춘 정사각(가로 1.25배)');
F=frames(B2,'r101:aura-back:hero',c=>c.img(R106P('flame','222.22.52','226.232.242'),80,0,60,80),ts.slice(0,4));
ok(F.flat().every(c=>c.sourcePath==='assets/r1041/fx-a5-slayer-flame.webp'),'DARK 겹 없이 슬레이어색 불꽃만 와도 A5');
// 밝은 불꽃(다른 영웅 EGO)은 그대로
F=frames(B2,'r101:aura-back:hero',c=>c.img(R106P('flame','255.200.80','255.255.200'),80,0,60,80),[6]);
ok(F[0][0].sourcePath.startsWith('r106fx:flame'),'DARK 아닌 밝은 불꽃(EGO 등)은 그대로');
// C4 발밑 고리(2:1 glow) / 몸 둘레 field glow(세로) 는 그대로
F=frames(B,'r101:aura-back:hero',c=>{c.img(R106P('glow'),60,300,120,60);c.img(R106P('glow'),70,200,60,84);},ts);
const g=F.flat().filter(c=>c.kind==='image');
ok(g.filter(c=>c.sourcePath==='assets/r1041/fx-c4-ground-ring.webp').length===24&&g.filter(c=>c.sourcePath.startsWith('r106fx:glow')).length===24,'발밑 glow(2:1) → C4, 몸 둘레 glow 는 그대로');
ok(new Set(g.filter(c=>c.sourcePath.includes('c4')).map(c=>c.sourceRect[0])).size>=6,'C4 칸이 시간 따라 바뀜');
// H6 환도 발도(along): 1회, 칸이 0 → 끝으로 가고 slashline 덧줄은 빠짐
const B3=sandbox({hero:'hwando'});
F=frames(B3,'r106d2s:7',c=>{c.img(R106P('iai-cut'),0,50,200,20);c.img(R106P('slashline'),0,55,200,10);},Array.from({length:12},(_,i)=>5+i/24));
im=F.flat();
ok(im.every(c=>c.sourcePath==='assets/r1041/fx-h6-hwando-iai.webp'),'환도 iai-cut → H6, 같은 범위 slashline 은 빠짐');
const fr=im.map(c=>c.sourceRect[0]/512);ok(fr[0]===0&&fr.every((v,i)=>i===0||v>=fr[i-1])&&fr.at(-1)===7,`H6 1회: 칸 ${fr.join(',')}`);
ok(im.every(c=>{const ys=c.points.map(p=>p[1]);return Math.min(...ys)<50&&Math.max(...ys)>70;}),'H6 은 원래 베기 줄보다 두껍게(칸 비율 4:1)');
// ④ 피격 C2
const B4=sandbox({hero:'neon'});B4.fx.push({kind:'heroHurt',age:.01,life:.42});
const hurt=frames(B4,'r101:91',c=>{c.img('assets/r100/sig-hit-red.webp',290,260,66,66);c.stroke();c.stroke();c.fill();},Array.from({length:8},(_,i)=>5+i*.055));
im=hurt.flat().filter(c=>c.kind==='image');
ok(im.length===8&&im.every(c=>c.sourcePath==='assets/r100/sig-hit-red.webp'||c.sourcePath==='assets/r1041/fx-c2-hero-hurt.webp')&&im.filter(c=>c.sourcePath.includes('c2')).length===8,'영웅 피격: C2 시트를 몸 둘레에(손그림 sig 대신)');
ok(hurt.flat().filter(c=>c.kind==='stroke').length===0&&hurt.flat().some(c=>c.kind==='fill'),'피격 선 줄기 0, 채우기는 그대로');
const hf=im.map(c=>c.sourceRect[0]/192);ok(hf[0]===0&&hf.at(-1)===5,`C2 1회 6칸(${hf.join(',')})`);
// 적중(적 자리, heroHurt 없음)은 그대로
const B5=sandbox({hero:'neon'});const hit=frames(B5,'r101:92',c=>{c.img('assets/r100/sig-hit-teal.webp',500,500,66,66);c.stroke();},[5]);
ok(hit[0].some(c=>c.sourcePath==='assets/r100/sig-hit-teal.webp')&&hit[0].some(c=>c.kind==='stroke'),'미카엘라 밖 적중(heroHit) 범위는 손대지 않음');
// r2 ─ M3 미카엘라 EGO(R1039 sig-aura/gather-magenta → 발동 6칸 .5초 → 반복 10칸)
const BM=sandbox({hero:'michaela'});
const egoF=frames(BM,'r111:ego-back',c=>{c.img('assets/r100/sig-gather-magenta.webp',0,0,100,50);c.img('assets/r100/sig-gather-magenta.webp',0,0,100,50);for(let k=0;k<3;k++)c.img('assets/r100/sig-aura-magenta.webp',100,0,156,156);},Array.from({length:36},(_,i)=>5+i/24));
ok(egoF.every(f=>f.length===3&&f.every(c=>/fx-m3-michaela-ego-(on|loop)/.test(c.sourcePath))),'미카엘라 EGO: 손그림 오라 3겹·소용돌이 2겹 → M3 세 겹(같은 칸), 소용돌이는 뺌');
const on=egoF.flat().filter(c=>c.sourcePath.includes('ego-on')),loop=egoF.flat().filter(c=>c.sourcePath.includes('ego-loop'));
ok(on.length===36&&new Set(on.map(c=>c.sourceRect[0])).size===6&&loop.length===72&&new Set(loop.map(c=>c.sourceRect[0])).size>=8,`M3 발동 6칸(.5초) 뒤 반복 칸 ${new Set(loop.map(c=>c.sourceRect[0])).size}종`);
ok(egoF[0][0].points[3][1]>156*.63&&egoF[0][0].points[0][1]<0,'M3 칸 피벗(.5,.9)을 R1039 오라의 발(사각 v .63)에');
const front=frames(BM,'r111:ego-front',c=>c.img('assets/r100/sig-aura-magenta.webp',100,0,156,156),[7]);ok(front[0].length===0,'M3: 앞 겹은 뺀다(고리가 몸을 감싼 그림이라)');
const BN=sandbox({hero:'neon'});const ne=frames(BN,'r111:ego-back',c=>c.img('assets/r100/sig-aura-teal.webp',100,0,156,156),[5]);ok(ne[0][0].sourcePath.includes('sig-aura-teal'),'다른 영웅 EGO(네온 민트)는 R1039 그대로');
// M4 미카엘라 적중(heroHit sig-hit, 피격 아님)
const hitM=frames(BM,'r101:300',c=>{c.img('assets/r100/sig-hit-magenta.webp',500,500,66,66);c.img('assets/r100/sig-hit-pale.webp',505,505,50,50);},Array.from({length:10},(_,i)=>5+i*.045));
ok(hitM.every(f=>f.length===1&&f[0].sourcePath.includes('fx-m4-michaela-hit')),'미카엘라 스킬 적중 sig-hit → M4 한 장(덧겹 뺌)');
const h4=hitM.map(f=>f[0].sourceRect[0]/256);ok(h4[0]===0&&h4.at(-1)===7,`M4 1회 8칸(${h4.join(',')})`);
const hitN=frames(BN,'r101:301',c=>c.img('assets/r100/sig-hit-teal.webp',500,500,66,66),[5]);ok(hitN[0][0].sourcePath.includes('sig-hit-teal'),'다른 영웅 적중은 그대로');
// M5 바닥 하트(groundHeart: 같은 하트 경로 채우기+테두리, 고리는 다른 경로)
const heart=[[300,300],[340,280],[360,300],[300,330],[240,300],[260,280]],ring=[[260,290],[340,290],[340,310],[260,310]];
const hF=frames(BM,'r948:bloom:12.00:blast',c=>{c.fill(heart);c.stroke(heart);c.stroke(ring);},Array.from({length:20},(_,i)=>5+i*.0834));
ok(hF.every(f=>f.length===2&&f[0].kind==='image'&&f[0].sourcePath.includes('fx-m5')&&f[1].kind==='stroke'),'바닥 하트 채우기·테두리 → M5 한 장, 같은 범위 고리는 그대로');
const h5=hF.map(f=>f[0].sourceRect[0]/256);ok(h5.slice(0,4).join()==='0,1,2,3'&&h5.slice(4).every(v=>v>=4&&v<=6),`M5 그려짐 4칸 뒤 맥박(${h5.join(',')})`);
ok(hF.every(f=>{const p=f[0].points;return Math.abs((p[0][0]+p[1][0])/2-300)<.01&&p[1][0]-p[0][0]>120/.7-1;}),'M5 는 하트 경로 상자 가운데에, 가로 1/0.7배');
// M7 하늘 빛기둥(코드 기둥 채우기 3겹 + 알갱이 → 한 장)
const beam=w=>[[300-w/2,-40],[300+w/2,-40],[300+w/2,400],[300,400+w*.18],[300-w/2,400]];
const bF=frames(BM,'r563:pillar:5.000:3.0:beam',c=>{c.fill(beam(40));c.fill(beam(25));c.fill(beam(10));c.fill([[298,100],[302,100],[302,110],[298,110]]);},Array.from({length:14},(_,i)=>5+i/12));
ok(bF.every(f=>f.length===1&&f[0].kind==='image'&&f[0].sourcePath.includes('fx-m7')),'R 빛기둥 코드 채우기 4개 → M7 한 장');
ok(bF.every(f=>{const p=f[0].points,h=p[3][1]-p[0][1];return Math.abs(p[0][1]+h*.98-400)<1&&Math.abs(p[1][0]-p[0][0]-h/2)<.01;}),'M7 칸 바닥 .98 = 기둥 발, 1:2 비율');
const b7=bF.map(f=>f[0].sourceRect[0]/256);ok(b7[0]===0&&b7.at(-1)===11,`M7 1회 12칸(${b7.join(',')})`);
// 그림이 아직 없으면 r2 도 원래 그대로(겹을 빼지 않음)
const NM=sandbox({images:false,hero:'michaela'});const nm=frames(NM,'r111:ego-back',c=>{for(let k=0;k<3;k++)c.img('assets/r100/sig-aura-magenta.webp',100,0,156,156);},[5]);
const nh=frames(NM,'r948:x:mark',c=>{c.fill(heart);c.stroke(heart);},[5]);ok(nm[0].length===3&&nh[0].length===2,'시트 없으면 EGO 3겹·하트 채우기/테두리 그대로');
// ⑤ 범위 밖·그림 없음·끔·NaN
F=frames(B,'r328:sigil:1',c=>c.img(R106P('halo'),0,0,56,21),[5]);ok(F[0][0].sourcePath.startsWith('r106fx:halo'),'R101 오라 범위 밖 halo 는 그대로');
const N=sandbox({images:false});F=frames(N,'r101:aura-front:hero',c=>c.img(R106P('halo'),0,0,56,21),[5]);ok(F[0][0].sourcePath.startsWith('r106fx:halo'),'시트 그림이 아직 없으면 원래 그림 그대로');
const O=sandbox({prefs:'off'});F=frames(O,'r101:aura-front:hero',c=>c.img(R106P('halo'),0,0,56,21),[5]);ok(F[0][0].sourcePath.startsWith('r106fx:halo'),'끔(storyworld.r1041.dotsfx=off)이면 손대지 않음');
let threw=false;try{F=frames(B,'r101:aura-front:hero',c=>c.img(R106P('halo'),NaN,0,56,21),[NaN]);}catch(_){threw=true;}
ok(!threw&&F[0].every(c=>c.points.flat().every(Number.isFinite)||c.sourcePath.startsWith('r106fx:')),'NaN 좌표·시간에도 던지지 않고 NaN 을 넣지 않음');
ok(A&&A.inspect().stats.swapped>0,'inspect 통계(swapped)');
ok(!/drop-shadow|blur\(/.test(src)&&!/flipY|scale\([^)]*-1\s*\)/.test(src),'blur·drop-shadow·뒤집기 없음');
console.log(`\n${n-bad}/${n} 통과`);process.exitCode=bad?1:0;
