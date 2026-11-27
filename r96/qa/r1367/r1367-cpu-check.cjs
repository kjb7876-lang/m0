// R1367 CPU 검사 — 제7부 중간보스 4종(파란불 역주행 목격자·공실장부 당직감사·진술 봉쇄 인과핵·옥상 인과보관인)이
//  본보스 파란불(서 있기·돌진 준비 두 그림)도 같은 방식. 걷는 동안 R974 이 '걷기 8칸'(assets/r1367/*-walk8.webp)을 칸을 바꿔 가며 그리는지, 서 있을 때는 원래 그림 그대로인지,
//  좌우 뒤집힘(엔진 사각형)이 그대로 이어지는지, 끄기 설정이면 옛 안개 시트로 돌아가는지, 연결(태그·공개 목록·CI·입력)이 있는지.
'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const R=path.resolve(__dirname,'../..'),CS=path.join(R,'client-source'),RT=path.join(R,'runtime-text');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const BX='assets/generated-story10-cycle-20261005/cyclic-murder/';
// id → [그림 경로, 이미지 크기, 칸, 옛 떠서 이동 시트]
const IDS={'mb-murder01':['assets/r104/bosses/mb-murder01-p4.webp',[367,418],[0,0,367,418],'assets/r1029/float/mb-murder01-p4.webp'],
 'mb-murder02':['assets/r104/bosses/mb-murder02-p4.webp',[305,412],[0,0,305,412],'assets/r1029/float/mb-murder02-p4.webp'],
 'murder04-mid':['assets/r104/bosses/murder04-mid-p4.webp',[517,471],[0,0,517,471],'assets/r1029/float/murder04-mid-p4.webp'],
 'mb-murder03':['assets/r104/bosses/mb-murder03-p4.webp',[443,416],[0,0,443,416],'assets/r1029/float/mb-murder03-p4.webp'],
 'blue-executor-idle':[BX+'blue_executor_idle.png',[1254,1254],[270,73,768,1134],'assets/r1224/float/blue-executor-idle.webp'],
 'blue-executor-charge':[BX+'blue_executor_charge.png',[1254,1254],[160,26,1054,1210],'assets/r1029/float/blue-executor-charge.webp']};
function sample(id,[p,size,rect],delta,{off=false,steps=24,cast=false}={}){
  const art={path:p,size,rect};const boss=/^blue/.test(id);
  const e={id:boss?'blue-executor':id,nativeId:boss?'blue-executor':id,hp:60,x:0,y:0,midboss:!boss,boss,storyAttackUntil5:cast?99:0};
  const feet=[[32,6],[-38,6]];
  const world={layer:'STORY',time:0,ctx:{commands:[]},project:(x,y)=>({x:(x-y)*24,y:(x+y)*12}),
    localStorage:{getItem:k=>off&&k==='storyworld.r1367.murderWalk'?'{"on":false}':null},
    readyImage(p){return {image:{src:p},ready:true};},addImage(){},setTimeout(fn){fn();},
    drawEnemy(){world.ctx.commands.push({kind:'image',owner:{kind:'enemy'},sourcePath:art.path,image:{src:art.path},imageSize:art.size,sourceRect:art.rect,points:[[38,-80],[-32,-80],...feet]});}};
  world.window=world;vm.createContext(world);
  for(const f of ['move-dir-r974-data.js','move-dir-r1190-data.js','move-float-r1029-data.js','move-float-r1224-data.js','murder-boss-walk-r1367.js','move-dir-r974.js']){
    const p=path.join(CS,f);if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),world,{filename:f});}
  const rows=[];for(let i=0;i<steps;i++){e.x+=delta[0];e.y+=delta[1];world.time+=1/16;world.ctx.commands.length=0;world.drawEnemy(e);if(i>=6)rows.push(world.ctx.commands[0]);}
  return rows;}
for(const [id,A] of Object.entries(IDS)){const size=A;
  const walk=sample(id,A,[.1,-.1]);
  ok(walk.every(c=>c.sourcePath===`assets/r1367/${id}-walk8.webp`),id+': 걷는 동안 걷기 8칸 시트');
  ok(new Set(walk.map(c=>c.sourceRect[0])).size>=6,id+': 걷는 동안 칸이 바뀜(6칸 이상)');
  ok(walk.every(c=>c.points[1][0]<c.points[0][0]),id+': 엔진 좌우 뒤집힘 유지');
  const stand=sample(id,A,[0,0]);ok(stand.every(c=>c.sourcePath===A[0]),id+': 서 있을 땐 원래 회수 자세');
  const cast=sample(id,A,[.1,-.1],{cast:true});ok(cast.every(c=>c.sourcePath===`assets/r1367/${id}-walk8.webp`),id+': 시전 중(storyAttackUntil5) 걸음에도 걷기 칸(옛 안개 시트와 같은 때)');
  const off=sample(id,A,[.1,-.1],{off:true});ok(off.every(c=>c.sourcePath===A[3]),id+': 끄기 설정이면 옛 떠서 이동');
  const b=fs.readFileSync(path.join(RT,`assets/r1367/${id}-walk8.webp`));ok(b.slice(0,4).toString()==='RIFF'&&b.length<400000,id+': webp 400KB 미만');}
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
ok(rd('runtime-text/murder-boss-walk-r1367.js')===rd('client-source/murder-boss-walk-r1367.js'),'runtime-text 사본 같음');
const html=rd('runtime-text/index.html');const i0=html.indexOf('<script src="./move-float-r1224-data.js">'),i1=html.indexOf('<script src="./murder-boss-walk-r1367.js">');ok(i0>0&&i1>i0,'R1224 표 뒤 태그');
ok(rd('../scripts/verify-r96-public.py').includes("'murder-boss-walk-r1367.js'"),'공개 확인 목록');
ok(rd('../.github/workflows/pages.yml').includes('r96/qa/r1367/r1367-cpu-check.cjs'),'CI 줄');
const inputs=rd('runtime-inputs.json');ok(inputs.includes('murder-boss-walk-r1367.js')&&inputs.includes('assets/r1367/mb-murder03-walk8.webp'),'runtime inputs');
console.log('R1367 CPU check passed:',n,'assertions');
