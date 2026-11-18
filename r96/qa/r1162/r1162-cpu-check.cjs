// R1162 CPU 검사: 제14단계 역전 관리자(u205-mid) 아래 걷기 — Dots CX-P3 B1 r2 HOLD(4번 칸 들린 발 무릎 접힘)를 코드로 손질해 R974 방향 이동 표에 더한다.
//  ① 표 move-dir-r1162-data.js 가 R974 표에 u205-mid 로 붙고 다른 번호는 그대로. ② 걷는 동안 엔진이 그리는 R374 u205-mid-new 이동 칸 0~7 이 대기 그림.
//  ③ 화면 아래로 걸을 때만 시트로, 위·옆·공격·죽음·다른 그림은 엔진 그대로. 몸통 키 = 엔진 그림, 칸이 바뀌어도 크기 고정, 앞모습 뒤집지 않음.
//  ④ 시트 그림: 4칸 모두 발 줄 같음(±2), 4번 칸 들린 왼발이 2번 칸 들린 오른발의 좌우 거울과 같은 높이·길이(±3), 칼은 4번 칸 그대로, 알파 1~16 없음, 칸 가장자리 안 닿음.
//  ⑤ 연결(태그·검증 목록·CI 줄·매니페스트·자산 기록).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),{execFileSync}=require('child_process');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');const ex=f=>fs.existsSync(path.join(R,f));
ok(ex('client-source/move-dir-r1162-data.js'),'R1162 table exists');const d1162=rd('client-source/move-dir-r1162-data.js');
ok(rd('runtime-text/move-dir-r1162-data.js')===d1162,'runtime-text copy identical');
const src=rd('client-source/move-dir-r974.js');const OLD=['r974','r1001','r1018','r1019','r1024','r1125'].map(k=>rd('client-source/move-dir-'+k+'-data.js'));
function world({withNew=true,order='data-first'}={}){const timers=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,WeakSet,Set,isFinite,RegExp,performance:{now:()=>0},setTimeout:f=>{timers.push(f);return timers.length;},localStorage:{getItem:()=>null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'u205',enemies:[]},player={x:9,y:9},ctx={commands:[]};
  function addImage(){}function readyImage(p){const q=/assets\\/r1162\\//.test(p);return {ready:true,image:{src:'http://x/m0/'+p,naturalWidth:q?1280:1536,naturalHeight:q?320:384}};}
  function project(x,y){return {x:100+(x-3)*10,y:200+(y-3)*5};}
  function drawEnemy(e){const P=project(e.x,e.y),A=e.__art,h=e.__h||100,w=h*A.rect[2]/A.rect[3],top=P.y-h*.95,L=P.x-w/2;
   ctx.commands.push({kind:'image',key:'enemy:'+e.nativeId,owner:{kind:'enemy'},image:{src:'http://x/m0/'+A.path},imageSize:A.size,sourcePath:A.path,sourceRect:A.rect.slice(),style:{},points:[[L,top],[L+w,top],[L+w,top+h],[L,top+h]]});}`,ctx);
 const data=()=>{for(const s of OLD)vm.runInContext(s,ctx);if(withNew)vm.runInContext(d1162,ctx);};
 if(order==='data-first'){data();vm.runInContext(src,ctx);}else{vm.runInContext(src,ctx);data();}while(timers.length)timers.shift()();return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
const w0=world({order:'module-first'}),M=w0.__STORYWORLD_MOVE_DIR_R1162__,DATA=w0.__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;
ok(M&&M.rev==='R1162-u205mid-down-1'&&M.joined===true&&M.ids.length===1&&M.ids[0]==='u205-mid','R1162 table joined with u205-mid only');
const BEF=world({withNew:false}).__STORYWORLD_MOVE_DIR_R974_DATA__.enemies;ok(!BEF['u205-mid'],'u205-mid had no entry before');
for(const k of Object.keys(BEF))ok(JSON.stringify(DATA[k])===JSON.stringify(BEF[k]),'other entry untouched '+k);
const V=DATA['u205-mid'];ok(V&&V.n===4&&V.fps===8&&V.cell===320&&V.dirs.down&&!V.dirs.up&&!V.dirs.side,'u205-mid: 320 square cell, 4 frames, down only');
ok(V.idle.length===8&&V.idle.every((I,k)=>I.path==='assets/r374/mobs/u205-mid-new.webp'&&I.rect.join()===[k*256,0,256,320].join()),'idle = R374 u205-mid-new move cells 0–7');
const S=V.dirs.down;ok(S.path==='assets/r1162/move/u205-mid-down.webp'&&ex('runtime-text/'+S.path),'down sheet exists');ok(S.vis>150&&S.vis<=320&&S.py>290&&S.py<=320&&S.px>130&&S.px<190,'sheet metrics sane '+JSON.stringify(S));
const H=k=>Math.abs(k.points[3][1]-k.points[0][1]);const I0=V.idle[0];
const mk=o=>({id:'u205-mid#1',nativeId:'u205-mid',name:'중간보스 · 제14단계 역전 관리자',midboss:true,x:3,y:3,hp:100,maxHp:100,hitTimer:0,state:'chase',__art:{path:I0.path,rect:I0.rect,size:I0.size},...o});
function frames(c,e,secs,step){const out=[];for(let t=0;t<secs-1e-9;t+=1/30){run(c,'time+=1/30');if(step)step(e,t,out.length);run(c,'ctx.commands.length=0');c.drawEnemy(e);out.push(run(c,'ctx.commands').find(k=>/enemy:/.test(k.key||'')));}return out;}
const cyc=(e,t,i)=>{const J=V.idle[Math.floor(i/4)%8];e.__art={path:J.path,rect:J.rect,size:J.size};};
{const c=world(),e=mk();const st=frames(c,e,.5);ok(st[st.length-1].sourcePath===I0.path,'standing → engine art');
 const dn=frames(c,e,1.2,(e,t,i)=>{e.y+=.06;cyc(e,t,i);}).slice(14);ok(dn.every(k=>k.sourcePath===S.path),'moving down → R1162 down sheet');
 ok(new Set(dn.map(k=>Math.round(k.sourceRect[0]/320))).size===4&&dn.every(k=>k.sourceRect[2]===320&&k.imageSize[0]===1280),'4 square frames');
 const hs=dn.map(H);ok(Math.max(...hs)-Math.min(...hs)<.5,'size steady while engine cycles cells');
 const vis=hs[0]*S.vis/320,eng=100*I0.body/320;ok(Math.abs(vis-eng)<1,'body height equals engine walk art ('+vis.toFixed(1)+' vs '+eng.toFixed(1)+')');
 ok(dn.every(k=>k.points[1][0]>k.points[0][0]),'front view not mirrored');
 ok(frames(c,e,1.2,(e,t,i)=>{e.y-=.06;cyc(e,t,i);}).slice(14).every(k=>!/r1162/.test(k.sourcePath)),'moving up → engine art (no up sheet)');
 ok(frames(c,e,1.2,(e,t,i)=>{e.x+=.06;e.y-=.06;cyc(e,t,i);}).slice(14).every(k=>!/r1162/.test(k.sourcePath)),'moving sideways → engine art');
 ok(frames(c,e,1,e=>{e.y+=.06;e.attack={t:1};}).slice(10).every(k=>!/r1162/.test(k.sourcePath)),'attacking → untouched');e.attack=null;
 ok(frames(c,e,1,e=>{e.y+=.06;e.__art={path:'assets/r380/mobs/u204-mech-04-v1.webp',rect:[0,0,256,320],size:[1024,320]};}).slice(10).every(k=>!/r1162/.test(k.sourcePath)),'other art → untouched');
 ok(frames(c,mk({hp:0}),1,e=>{e.y+=.06;}).every(k=>!/r1162/.test(k.sourcePath)),'dead → untouched');}
// ④ 그림 검사(파이썬)
const py=`
import sys,json
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGBA');C=320
al=im.getchannel('A');h=al.histogram()
mask=al.point(lambda v:255 if v>16 else 0)
def bb(box):
  b=mask.crop(box).getbbox()
  return b  # (x0,y0,x1,y1) of alpha>16 pixels
H=al.size[1]
r={'midAlpha':int(sum(h[1:17])),'edge':[],'foot':[],'f2':None,'f4':None}
for i in range(4):
  x0,y0,x1,y1=bb((i*C,0,(i+1)*C,H))
  r['foot'].append(y1-1);r['edge'].append(bool(x0<=0 or x1-1>=C-1 or y0<=0))
cx=160
def lifted(i,side):
  # 지지발(발 줄에 닿는 쪽)이 아닌 반쪽의 가장 낮은 줄 = 들린 발 밑
  l=i*C;box=(l,0,l+cx,H) if side=='L' else (l+cx,0,l+C,H)
  return bb(box)[3]-1
r['f2']=lifted(1,'R');r['f4']=lifted(3,'L');r['f4R']=lifted(3,'R');r['f2L']=lifted(1,'L')
print(json.dumps(r))`;
const P=JSON.parse(execFileSync('python3',['-I','-c',py,path.join(R,'runtime-text',S.path)],{encoding:'utf8'}));
ok(P.midAlpha===0,'no alpha 1–16');ok(P.edge.every(x=>!x),'no frame touches the cell edge');
ok(Math.max(...P.foot)-Math.min(...P.foot)<=2,'foot line steady '+P.foot);
ok(P.f2L>=P.foot[1]-2&&P.f4R>=P.foot[3]-2,'support foot on the foot line in frames 2 and 4');
ok(P.f2<P.foot[1]-8&&P.f4<P.foot[3]-8,'lifted foot clears the ground in frames 2 and 4 ('+P.f2+','+P.f4+')');
ok(Math.abs(P.f4-P.f2)<=3,'frame-4 lifted left foot mirrors frame-2 lifted right foot (bottom '+P.f4+' vs '+P.f2+')');
// ⑤ 연결
{const html=rd('runtime-text/index.html');ok(html.includes('<script src="./move-dir-r1125-data.js"></script>\n<script src="./move-dir-r1162-data.js"></script>\n'),'tag right after move-dir-r1125-data.js');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'move-dir-r1162-data.js'"),'public verify list');
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1162/r1162-cpu-check.cjs'),'CI step');
 const man=rd('runtime-manifest.json');ok(man.includes(S.path)&&man.includes('move-dir-r1162-data.js'),'manifest has sheet and data script');
 const rec=JSON.parse(rd('r1162-u205mid-down.json'));ok(rec.files.filter(f=>f.applied).length===1&&rec.files.filter(f=>f.applied).every(f=>f.sha256&&f.sourceSha256&&f.bytes>0&&f.finalArt===false),'asset record with source/hash/size, not final art');}
console.log('R1162 u205-mid down CPU check OK ('+n+' assertions)');
