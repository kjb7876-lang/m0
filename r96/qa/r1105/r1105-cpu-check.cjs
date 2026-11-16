// R1105 EGO 공격 모션 다듬기 CPU 검사(사용자 2026-11-16 06:38Z "히든영웅에고 공격모션 어색한부분").
//  ① 히트스톱 뒤 타격 칸을 건너뛰지 않음 ② 이어지는 휘두름·기본↔스킬 바뀜도 섞기 ③ 휘두르는 중 방향 고정(오래 이어지는 방향만 따름)
//  ④ 분신·환영 다시 그리기(겹친 영웅 그리기)는 재생기·속도·방향을 건드리지 않음
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..'),src=fs.readFileSync(path.join(R,'client-source/ego-motion-r1048.js'),'utf8');
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(c)console.log('ok  ',m);else{bad++;console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,300));}};
ok(fs.readFileSync(path.join(R,'runtime-text/ego-motion-r1048.js'),'utf8')===src,'runtime-text 사본 = client-source');
ok(/node r96\/qa\/r1105\/r1105-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')),'CI 검사 줄');
const win={};vm.runInNewContext(src,{window:win,Math,Number,Object});const M=win.__STORYWORLD_EGO_MOTION_R1048__;
ok(+M.revision.split('-').pop()>=7,'R1048 개정 7 이상',M.revision);
const atk={frames:16,fps:16,loop:false,phases:{windup:[0,4],strike:[5,10],follow:[11,15]}};/* 실제 시트와 같은 구간 */
const sheets={actions:{idle:{frames:12,fps:8,loop:true},walk:{frames:12,fps:14,loop:true},run:{frames:10,fps:18,loop:true},attack:atk,hit:{frames:8,fps:16,loop:false}}};
// 실제 기본 공격 길이 .23초를 60fps 로(측정: 히트스톱 .06초가 타격 구간 .046초보다 길어 6→12 로 건너뜀)
const swing=(P,dur=.23,ex={})=>{const f=[];let r,held=0;const N=Math.round(dur*60);for(let i=0;i<=N;i++){r=P.step(1/60,{at:1,basic:true,attackP:i/N,attackDur:dur,fx:1,fy:1,...ex});f.push(r.frame);if(r.hold)held++;}return{f,r,held};};
{const P=M.createPlayer(sheets);const{f,held}=swing(P);const S=new Set(f);
 ok(held>0,'타격 첫 칸에서 멈춤');const sf=f.filter(k=>k>=5&&k<=10);ok(new Set(sf).size>=3&&f.every((v,i)=>i===0||v-f[i-1]<=2||f[i-1]<5),'타격 칸(5~10)을 지나며 보임 — 히트스톱 뒤 2칸 넘게 건너뛰지 않음(전: 6→12)',f);
 ok(held<=3,'짧은 기본 공격엔 히트스톱도 짧게(.035초 안팎)',held);
 ok(f.every((v,i)=>i===0||v>=f[i-1]),'한 휘두름 안에서 되감기 없음',f);ok(f[f.length-1]===15,'끝 칸 15 에서 끝남(시간은 그대로)',f);}
{const P=M.createPlayer(sheets);swing(P);const r=P.step(1/60,{at:1,basic:true,attackP:0,fx:1,fy:1});
 ok(r.clip==='attack'&&r.frame===0&&r.fade&&r.fade.frame===15&&r.fade.alpha>.5,'이어지는 휘두름: 15→0 을 짧게 섞음',r);
 const{held}=swing(P);ok(held>0,'다음 휘두름도 히트스톱');}
{const P=M.createPlayer(sheets);let r;for(let i=0;i<8;i++)r=P.step(1/60,{at:1,basic:true,attackP:.5+i*.06,fx:1,fy:1});r=P.step(1/60,{at:1,basic:false,attackP:.2,fx:1,fy:1});
 ok(r.fade&&r.fade.clip==='attack','기본 공격 → 스킬 진행도로 바뀔 때 섞기',r);}
{const P=M.createPlayer(sheets);let r=P.step(1/60,{at:1,basic:true,attackP:0,fx:1,fy:1});const d0=r.dir;const ds=[];
 for(let i=1;i<=6;i++){r=P.step(1/60,{at:1,basic:true,attackP:i/14,fx:1,fy:0});ds.push(r.dir);}
 ok(d0==='s'&&ds.every(d=>d==='s'),'휘두르는 중 짧은 방향 흔들림은 무시(시작 방향 유지)',ds);
 for(let i=7;i<=14;i++)r=P.step(1/60,{at:1,basic:true,attackP:Math.min(1,i/14),fx:1,fy:0});
 const P2=M.createPlayer(sheets);P2.step(1/60,{sk:1,attackP:0,fx:1,fy:1});let r2;for(let i=1;i<=20;i++)r2=P2.step(1/60,{sk:1,attackP:i/60,fx:1,fy:-1});
 ok(r2.dir==='e','오래 이어지는 방향(이동하며 쓰는 스킬)은 따름',r2.dir);
 const P3=M.createPlayer(sheets);P3.step(1/60,{mv:1,speed:2.4,fx:1,fy:-1});const r3=P3.step(1/60,{at:1,basic:true,attackP:0,fx:1,fy:1});ok(r3.dir==='s','공격 시작 때는 바로 그 방향',r3.dir);}
{const P=M.createPlayer(sheets);let r;for(let i=0;i<5;i++)r=P.step(1/60,{at:1,basic:true,attackP:NaN,fx:NaN,fy:1});ok(Number.isInteger(r.frame)&&typeof r.dir==='string','NaN 입력 안전',r);}
{const P=M.createPlayer(sheets);for(let i=0;i<4;i++)P.step(1/60,{at:1,basic:true,attackP:i*.1,attackDur:.23,fx:1,fy:1});const f=[];let held=0;
 for(let i=0;i<8;i++){const r=P.step(1/60,{sk:1,basic:false,attackP:.83+i*.02,attackDur:.6,fx:1,fy:1});f.push(r.frame);if(r.hold)held++;}
 ok(held===0&&f.every(v=>v>=11),'타격을 지난 진행도로 들어오면 멈추거나 타격 첫 칸으로 되감지 않음(전: 12→5→12)',f);}
// ④ 겹친 영웅 그리기(분신)
function rig(){const w={},cmds=[];vm.runInNewContext(fs.readFileSync(path.join(R,'client-source/ego-motion-r1048-sheets.js'),'utf8'),{window:w,Object});
 const S={};w.__STORYWORLD_EGO_SOVEREIGN_R1046__={formActive:()=>true,inspect:()=>({})};w.__STORYWORLD_HERO_MOTION_R895__={sample:()=>({...S}),moveCancel:()=>false};
 const im={naturalWidth:4096,naturalHeight:256,width:4096,height:256};
 const C={window:w,Math,Number,Object,String,Array,JSON,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},readyImage:()=>({image:im,ready:true}),addImage(){},actorHeight:()=>66,
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),room:{enemies:[]},player:{x:5,y:5,hp:10},time:1,ctx:{commands:cmds},clones:true};
 let busy=false;C.drawHero=function(){cmds.push({kind:'image',owner:{kind:'hero',id:'hero'},order:cmds.length,key:'hero:'+cmds.length,points:[[0,0],[40,0],[40,80],[0,80]],sourcePath:'assets/r271/hwando/idle-s.webp',image:{},style:{globalAlpha:1}});
  if(C.clones&&!busy){busy=true;const k={x:C.player.x,y:C.player.y};try{for(const [dx,dy] of [[3,-2],[-3,2]]){C.player.x=k.x+dx;C.player.y=k.y+dy;C.drawHero();}}finally{C.player.x=k.x;C.player.y=k.y;busy=false;}}};
 vm.runInNewContext(src,C);const E=w.__STORYWORLD_EGO_MOTION_R1048__;const frame=(dt=1/60)=>{cmds.length=0;C.time+=dt;C.drawHero();return cmds.slice();};return{E,frame,C,S};}
{const{E,frame}=rig();let c;for(let i=0;i<40;i++)c=frame();const I=E.inspect();
 ok(I.stats.nested>0,'분신 그리기는 겹친 호출로 인식',I.stats);ok(I.state.clip==='idle'&&+I.input.speed<.5&&!I.input.mv,'서 있는 영웅: 분신이 있어도 대기(달리기로 안 바뀜)',{clip:I.state.clip,sp:I.input.speed});
 const bodies=c.filter(x=>x.kind==='image'&&/r1048\/ego\//.test(x.sourcePath||''));ok(bodies.length===3,'영웅+분신 둘 모두 EGO 몸',bodies.map(b=>b.sourcePath));
 const xs=bodies.map(b=>Math.round(b.points[0][0]));ok(new Set(xs).size===3,'분신은 제자리에 그림',xs);}
{const{E,frame,C}=rig();C.clones=false;for(let i=0;i<40;i++)frame();const a=E.inspect().state.dir;C.clones=true;for(let i=0;i<40;i++)frame();ok(E.inspect().state.dir===a,'분신이 생겨도 영웅 방향 그대로',[a,E.inspect().state.dir]);}
console.log(`\nR1105 CPU ${n-bad}/${n} 통과`);process.exitCode=bad?1:0;
