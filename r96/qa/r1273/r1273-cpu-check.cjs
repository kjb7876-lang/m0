// R1273 CPU 검사: 7대죄 보스가 서 있거나 맞을 때 몸이 '접히듯 홀쭉해지는' 버그(사용자 2026-11-20 07:57Z).
//  원인: R620 은 엔진이 그린 몸 그림 경로가 시트 열쇠(phase0·p4 원본)면 그림을 Dots 대기6·피격4 시트 칸(원본 전체 크기, 예 672×384)으로 바꾸는데,
//  엔진(R463·R425)이 그 원본에서 몸만 잘라 그린 칸(예 질투 252,72,168,284)일 때도 네 점(잘린 칸 비율)을 그대로 둬 넓은 칸이 좁은 사각형에 눌려 그려졌다.
//  헤드리스 실측(qa/r1262/sin-census.mjs, 화면 가로세로비 ÷ 그림 칸 가로세로비): 질투 0.34 · 탐식 0.40 · 분노 0.59 · 교만 0.81.
//  기대: 잘린 칸을 시트 칸으로 바꿀 때 같은 그림 축척으로 네 점을 넓혀(잘린 칸이 원래 자리에 오게) 가로세로비 = 시트 칸 비율.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,300):''));};
const src=fs.readFileSync(path.join(R,'client-source','boss-motion-r620.js'),'utf8');
const PH='assets/generated-v31224/actors-normalized/1a8ca2c5759b_ep1b03_envy_sister_phase0.webp',P4='assets/r104/bosses/b07-boss-p4.webp',SL='assets/r380/mobs/sloth-burden-man-v1.webp';
function world(draw){const store={};const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,performance:{now:()=>0},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};c.window=c;vm.createContext(c);
 c.__draw=draw;vm.runInContext(`var time=0,room={id:'ep1b03',enemies:[]},player={x:0,y:0},ctx={commands:[]};
  function addImage(){} function readyImage(p){return {ready:true,image:{src:p}};}
  function drawEnemy(e){ctx.commands.push(__draw(e));}`,c);vm.runInContext(src,c);return c;}
// 잘린 칸 rect 를 화면 축척 k 로, 발밑(100,300)에 그린 몸 명령
const crop=(path,rect,k)=>e=>{const w=rect[2]*k,h=rect[3]*k;return {kind:'image',owner:{kind:'enemy'},image:{src:path},sourcePath:'http://x/m0/'+path,sourceRect:rect.slice(),imageSize:[0,0],style:{globalAlpha:1},points:[[100-w/2,300-h],[100+w/2,300-h],[100+w/2,300],[100-w/2,300]]};};
function draw(c,e,secs=1,step=null){let last=null;for(let t=0;t<secs;t+=1/30){vm.runInContext('time+=1/30;ctx.commands.length=0',c);if(step)step(e,t);c.drawEnemy(e);last=vm.runInContext('ctx.commands',c).find(k=>k.kind==='image'&&!k.r620Ghost);}return last;}
const W=c=>Math.hypot(c.points[1][0]-c.points[0][0],c.points[1][1]-c.points[0][1]),H=c=>Math.hypot(c.points[3][0]-c.points[0][0],c.points[3][1]-c.points[0][1]);
const asp=c=>(W(c)/H(c))/(c.sourceRect[2]/c.sourceRect[3]);
const boss=o=>({id:'b',nativeId:'b03-boss',boss:true,x:3,y:3,hp:100,hitTimer:0,...o});
// ① 질투: 잘린 칸(252,72,168,284) 서 있을 때 → 대기 시트 칸 672×384
{const c=world(crop(PH,[252,72,168,284],.5));const e=boss();const b=draw(c,e);
 ok(/r620\/bosses\/b03-idle6/.test(b.sourcePath),'질투 서기: Dots 대기 시트로 바뀜',b.sourcePath);
 ok(Math.abs(asp(b)-1)<.05,'질투 서기: 화면 가로세로비 = 시트 칸 비율(눌림 없음) '+asp(b).toFixed(3),b.points);
 ok(Math.abs(H(b)/b.sourceRect[3]-.5)<.02,'질투 서기: 그림 축척 그대로(잘린 칸과 같은 0.5) '+(H(b)/b.sourceRect[3]).toFixed(3));
 const cx=(b.points[0][0]+b.points[1][0])/2,cropCx=100-(252+84-336)*.5;ok(Math.abs(cx-cropCx)<3,'질투 서기: 잘린 몸이 원래 자리(가로 가운데 ±3px) '+cx.toFixed(1)+' vs '+cropCx.toFixed(1));
 const foot=(b.points[2][1]+b.points[3][1])/2,expFoot=300+(384-(72+284))*.5;ok(Math.abs(foot-expFoot)<4,'질투 서기: 시트 칸 아래끝 = 잘린 칸 아래 + 남은 여백 '+foot.toFixed(1)+' vs '+expFoot);}
// ② 질투: 맞을 때 피격 시트도 같은 비율
{const c=world(crop(PH,[252,72,168,284],.5));const e=boss({hitTimer:.3});const b=draw(c,e,.1);
 ok(/b03-hit4/.test(b.sourcePath)&&Math.abs(asp(b)-1)<.06,'질투 맞음: 피격 시트·눌림 없음 '+asp(b).toFixed(3),b.sourcePath);}
// ③ 분노: p4 잘린 칸(92,9,208,402) → R1147 대기 시트 411×473
{const c=world(crop(P4,[92,9,208,402],.4));const e=boss({nativeId:'b07-boss'});const b=draw(c,e);
 ok(/b07-idle6/.test(b.sourcePath)&&Math.abs(asp(b)-1)<.05,'분노 서기: 눌림 없음 '+asp(b).toFixed(3),b.sourcePath);}
// ④ 회귀: 원본 전체 칸으로 그린 몸은 지금과 같게(네 점 비율 그대로)
{const c=world(crop(PH,[0,0,672,384],.3));const e=boss();const b=draw(c,e);
 ok(Math.abs(asp(b)-1)<.05&&Math.abs(H(b)-384*.3)<4,'전체 칸 그림: 비율·크기 그대로 '+asp(b).toFixed(3)+' h='+H(b).toFixed(1));}
// ⑤ 회귀: 칸 시트(R1163 나태, cells)는 칸이 맞을 때만, 비율 그대로
{const c=world(crop(SL,[256,0,256,256],.5));const e=boss({nativeId:'b02-boss'});const b=draw(c,e);
 ok(/b02-idle6/.test(b.sourcePath)&&Math.abs(asp(b)-1)<.05,'나태 칸 시트: 그대로 '+asp(b).toFixed(3),b.sourcePath);}
// ⑥ 경계: 잘린 칸 rect 가 이상(0 폭·NaN)이면 바꾸지 않거나 비율이 유한
{const c=world(crop(PH,[252,72,0,284],.5));const e=boss();const b=draw(c,e);
 ok(b.points.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])),'폭 0 칸: 네 점 유한(NaN 없음)',b.points);}
// ⑦ 걷는 중(시트 안 씀)엔 잘린 칸 그대로
{const c=world(crop(PH,[252,72,168,284],.5));const e=boss();const b=draw(c,e,1,(e)=>{e.x+=.06;});
 ok(!/r620\/bosses/.test(b.sourcePath)&&Math.abs(asp(b)-1)<.06,'걷기: 잘린 원본 그대로 '+asp(b).toFixed(3),b.sourcePath);}
console.log(`R1273 ${n-bad}/${n} PASS`);process.exit(bad?1:0);
