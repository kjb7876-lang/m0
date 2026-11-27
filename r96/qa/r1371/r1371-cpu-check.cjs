'use strict';
// R1371 CPU 검사: 2D 몹·보스 최종 좌우(원본 방향 표 + 기록기 finish 뒤처리).
// node r96/qa/r1371/r1371-cpu-check.cjs  (빌드 없이 client-source 로, 빌드가 있으면 site 연결도 본다)
const fs=require('fs'),path=require('path'),vm=require('vm');
const R96=path.resolve(__dirname,'../..'),SRC=path.join(R96,'client-source'),SITE=path.join(R96,'hospital-three-pc/site');
let pass=0,fail=0;const ok=(name,cond,detail)=>{if(cond){pass++;console.log('PASS',name);}else{fail++;console.log('FAIL',name,detail!==undefined?JSON.stringify(detail).slice(0,600):'');}};
const read=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return null;}};
const dataSrc=read(path.join(SRC,'enemy-face-truth-r1371-data.js')),ovSrc=read(path.join(SRC,'enemy-face-final-r1371.js'));
ok('① 원본 방향 표 파일이 있다',!!dataSrc);ok('② 최종 좌우 오버레이 파일이 있다',!!ovSrc);
// ---- 표 ----
let T={};
if(dataSrc){const box={window:{}};try{vm.runInNewContext(dataSrc,box);T=box.window.__STORYWORLD_ENEMY_FACE_TRUTH_R1371_DATA__||{};}catch(e){ok('③ 표가 실행된다',false,String(e));}}
const keys=Object.keys(T);
ok('③ 표에 시트가 100개 넘게 있다(전수)',keys.length>100,keys.length);
ok('④ 값은 L/R/F 뿐',keys.every(k=>['L','R','F'].includes(T[k])),keys.filter(k=>!['L','R','F'].includes(T[k])).slice(0,10));
ok('⑤ 열쇠는 assets/ 뒤 경로(+#sx,sy)',keys.every(k=>/^[^/].*\.(png|webp|jpe?g)(#-?\d+,-?\d+)?$/i.test(k)&&!k.startsWith('assets/')),keys.filter(k=>!/^[^/].*\.(png|webp|jpe?g)(#-?\d+,-?\d+)?$/i.test(k)||k.startsWith('assets/')).slice(0,10));
// 회귀 사례: 사용자가 본 흑장미 귀막은 신도 — 그림은 오른쪽을 본다(R223 목록 'left' 는 틀림)
ok('⑥ 흑장미 귀막은 신도 censer-priest 그림은 R',T['r275/mobs/censer-priest.webp']==='R'&&T['r223/mobs/censer-priest.webp']==='R',[T['r275/mobs/censer-priest.webp'],T['r223/mobs/censer-priest.webp']]);
// R1226 이 눈으로 맞춘 일반몹 표와 어긋나지 않는다
{const s=read(path.join(SRC,'mob-motion-consistency-r1226.js'))||'';const m=/const FACE=Object\.freeze\(\{([\s\S]*?)\n\}\);/.exec(s);const bad=[];
 if(m)for(const x of m[1].matchAll(/'([^']+)':'([LR])'/g)){if(T[x[1]]&&T[x[1]]!==x[2])bad.push([x[1],x[2],T[x[1]]]);}
 ok('⑦ R1226 FACE 표와 충돌 없음',!!m&&bad.length===0,bad);}
// 표의 그림이 실제로 있다(빌드가 있을 때)
if(fs.existsSync(path.join(SITE,'assets'))){const miss=[...new Set(keys.map(k=>k.split('#')[0]))].filter(p=>!fs.existsSync(path.join(SITE,'assets',p)));ok('⑧ 표의 그림 파일이 site 에 있다',miss.length===0,miss.slice(0,20));}
// 전수 탐침 요약(qa/r1371/probe-summary.json): 공격·원거리 준비 동안 그린 쪽 ≠ 영웅 쪽 0건, 표 누락 0건
{const s=read(path.join(__dirname,'probe-summary.json'));let j=null;try{j=JSON.parse(s);}catch(_){}
 ok('⑨ 전수 탐침 요약이 있다(지역 50곳 넘게)',!!j&&j.zones>50,j&&j.zones);
 if(j){ok('⑩ 전수: 공격 중 영웅 반대쪽을 보는 2D 몹·보스 0',j.after.wrong===0,j.after.wrongList?.slice(0,20));
  ok('⑪ 전수: 공격 몸 그림 중 원본 방향 표에 없는 2D 시트 0',j.after.unlabeled===0,j.after.unlabeledList?.slice(0,20));
  ok('⑫ 전수: 고치기 전엔 귀막은 신도가 반대쪽이었다(재현 기록)',j.before.wrongList?.some(r=>/귀막은/.test(r.name)),null);
  ok('⑬ 전수: 보스·중간보스도 탐침했다',(j.after.bossProbes||0)>20,j.after.bossProbes);}}
// ---- 오버레이 동작(가짜 기록기) ----
if(ovSrc&&dataSrc){
 const mk=(over={})=>{const enemies=[],R444={};let finishCalls=0;
  class Rec{constructor(){this.commands=[];}finish(){finishCalls++;return this.commands;}}
  const rec=new Rec();
  const box={localStorage:{getItem:()=>null,setItem(){}},setInterval:(f)=>{box.__tick=f;return 1;},clearInterval(){},console,
   room:{id:over.zone||'cult01',enemies},project:(x,y)=>({x:(x-y)*10+500,y:(x+y)*5}),
   /* 실제 게임처럼: 프레임 밖 ctx 는 기록기가 아니고(보통 캔버스), 기록기 클래스는 StoryPhase1.DrawCommands 로 드러나 있다 */ctx:{},StoryPhase1:{DrawCommands:Rec}};
  box.window=box;vm.createContext(box);vm.runInContext(dataSrc,box);vm.runInContext(ovSrc,box);box.window.__STORYWORLD_ENEMY_FACE_R444__={left:e=>e.__want};for(let i=0;i<3;i++)box.__tick?.();
  return {box,rec,enemies};};
 const body=(id,src,sr,x0,x1,mir)=>({kind:'image',owner:{kind:'enemy',id},sourcePath:src,sourceRect:sr,image:{src},points:mir?[[x1,0],[x0,0],[x0,100],[x1,100]]:[[x0,0],[x1,0],[x1,100],[x0,100]]});
 const drawnLeft=(c,f)=>(f==='L')!==(c.points[1][0]<c.points[0][0]);
 {const {box,rec,enemies}=mk();const e={id:7,x:2,y:2,hp:10,__want:false,name:'흑장미 귀막은 신도'};enemies.push(e);
  // R208 이 그린 모습 그대로: 원본 R 그림을 거울로(=왼쪽을 봄) 그렸는데 영웅은 오른쪽
  const c=body(7,'http://x/assets/r275/mobs/censer-priest.webp',[721,0,103,190],480,520,true);rec.commands.push(c);const out=rec.finish();
  ok('⑭ 오버레이: 기록기 finish 를 감쌌다',box.__STORYWORLD_ENEMY_FACE_FINAL_R1371__?.stats().hooked===true);
  ok('⑮ 귀막은 신도 공격(영웅 오른쪽) → 오른쪽을 보게 뒤집힘',out[0]&&drawnLeft(out[0],'R')===false,out[0]?.points);
  ok('⑯ 발 세로선(500) 기준 뒤집기 — 몸 가로 범위 보존',Math.min(...out[0].points.map(p=>p[0]))===480&&Math.max(...out[0].points.map(p=>p[0]))===520,out[0].points);
  rec.commands=[body(7,'http://x/assets/r275/mobs/censer-priest.webp',[721,0,103,190],480,520,false)];const p0=JSON.stringify(rec.commands[0].points);rec.finish();
  ok('⑰ 이미 맞는 쪽이면 그대로',JSON.stringify(rec.commands[0].points)===p0);
  e.__want=true;rec.commands=[body(7,'http://x/assets/r275/mobs/censer-priest.webp',[721,0,103,190],480,520,false)];rec.finish();
  ok('⑱ 영웅 왼쪽 → 왼쪽을 보게',drawnLeft(rec.commands[0],'R')===true);
  e.__want=null;rec.commands=[body(7,'http://x/assets/r275/mobs/censer-priest.webp',[721,0,103,190],480,520,true)];const p1=JSON.stringify(rec.commands[0].points);rec.finish();
  ok('⑲ R444 가 정하지 않으면(null) 건드리지 않음',JSON.stringify(rec.commands[0].points)===p1);}
 {const {rec,enemies}=mk();const e={id:'b1',x:0,y:0,hp:10,boss:true,__want:false};enemies.push(e);
  const k=Object.keys(T).find(k=>T[k]==='L'&&!k.includes('#'));const c=body('boss:b1','http://x/assets/'+k,[0,0,100,100],480,520,false);rec.commands.push(c);rec.finish();
  ok('⑳ 보스도 맡는다(원본 L 그림, 영웅 오른쪽 → 뒤집힘)',!!k&&drawnLeft(c,'L')===false,k);}
 {const {rec,enemies}=mk();const e={id:3,x:0,y:0,hp:10,persona:true,__want:false};enemies.push(e);const c=body(3,'http://x/assets/r275/mobs/censer-priest.webp',[0,0,1,1],480,520,true);const p=JSON.stringify(c.points);rec.commands.push(c);rec.finish();
  ok('㉑ 페르소나는 건드리지 않음',JSON.stringify(c.points)===p);}
 {const {rec,enemies}=mk({zone:'ep1b06'});const e={id:3,x:0,y:0,hp:10,__want:false};enemies.push(e);const c=body(3,'http://x/assets/r275/mobs/censer-priest.webp',[0,0,1,1],480,520,true);const p=JSON.stringify(c.points);rec.commands.push(c);rec.finish();
  ok('㉒ 맘몬 구역(ep1b06)은 건드리지 않음',JSON.stringify(c.points)===p);}
 {const {rec,enemies}=mk();const e={id:4,x:0,y:0,hp:10,__want:false};enemies.push(e);const F=Object.keys(T).find(k=>T[k]==='F');
  const c=body(4,'http://x/assets/'+(F||'none.webp').split('#')[0],F&&F.includes('#')?[+F.split('#')[1].split(',')[0],+F.split('#')[1].split(',')[1],10,10]:[0,0,10,10],480,520,true);const p=JSON.stringify(c.points);rec.commands.push(c);rec.finish();
  ok('㉓ 정면(F) 그림은 건드리지 않음',!!F&&JSON.stringify(c.points)===p,F);}
 {const {rec,enemies}=mk();const e={id:5,x:0,y:0,hp:10,__want:false};enemies.push(e);
  const big=body(5,'http://x/assets/r275/mobs/censer-priest.webp',[721,0,103,190],480,520,true),fx=body(5,'http://x/assets/pixelfx/slash.webp',[0,0,9,9],400,700,false),layer=body(5,'http://x/assets/r275/mobs/censer-priest.webp',[721,0,103,190],480,520,true);
  layer.image=big.image;const pf=JSON.stringify(fx.points);rec.commands.push(fx,big,layer);rec.finish();
  ok('㉔ 같은 그림 겹은 함께 뒤집고, 이펙트는 그대로',drawnLeft(big,'R')===false&&drawnLeft(layer,'R')===false&&JSON.stringify(fx.points)===pf);}
 {const {rec,enemies}=mk();const e={id:6,x:0,y:0,hp:10,__want:false};enemies.push(e);const c=body(6,'http://x/assets/unknown/never-labeled.webp',[0,0,1,1],480,520,true);const p=JSON.stringify(c.points);rec.commands.push(c);rec.finish();
  ok('㉕ 표에 없는 그림은 건드리지 않음(검사 ⑪ 이 잡음)',JSON.stringify(c.points)===p);}
 {const {box,rec,enemies}=mk();box.__STORYWORLD_ENEMY_FACE_FINAL_R1371__.set({on:false});const e={id:7,x:2,y:2,hp:10,__want:false};enemies.push(e);const c=body(7,'http://x/assets/r275/mobs/censer-priest.webp',[721,0,103,190],480,520,true);const p=JSON.stringify(c.points);rec.commands.push(c);rec.finish();
  ok('㉖ 끄기 {"on":false} 면 원래대로',JSON.stringify(c.points)===p);}
 {const {rec,enemies}=mk();const e={id:'cult01:c101-e2',x:2,y:2,hp:10,__want:false};enemies.push(e);
  // R409 테두리가 몸을 테와 한 장에 구운 명령(경로 앞머리 'r409:outline:enemy:u:'), 주인 id 는 'enemy:<id>:r373c0' 겹
  const c=body('enemy:cult01:c101-e2:r373c0','r409:outline:enemy:u:http://x/m0/assets/r275/mobs/censer-priest.webp:721,0,103,190:6:enemy',[0,0,120,200],480,520,true);rec.commands.push(c);rec.finish();
  ok('㉚ R409 테두리로 구운 몸·겹 주인 id 도 원래 그림으로 읽어 뒤집음',drawnLeft(c,'R')===false,c.points);}
}
// ---- 빌드 연결 ----
{const html=read(path.join(R96,'runtime-text/index.html'))||'';const iT=html.indexOf('enemy-face-truth-r1371-data.js'),iO=html.indexOf('enemy-face-final-r1371.js');
 ok('㉗ index.html 에 표·오버레이 태그(표가 먼저)',iT>0&&iO>iT,[iT,iO]);
 const v=read(path.join(R96,'..','scripts/verify-r96-public.py'))||'';ok('㉘ 공개 검증 기대 목록에 들어 있다',v.includes('enemy-face-final-r1371.js')&&v.includes('enemy-face-truth-r1371-data.js'));
 const inp=read(path.join(R96,'runtime-inputs.json'))||'';ok('㉙ runtime-inputs 에 들어 있다',inp.includes('enemy-face-final-r1371.js')&&inp.includes('enemy-face-truth-r1371-data.js'));}
console.log(`R1371 ${pass} PASS / ${fail} FAIL`);process.exitCode=fail?1:0;
