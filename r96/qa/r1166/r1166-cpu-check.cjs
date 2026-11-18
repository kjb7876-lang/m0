// R1166 CPU 검사: Dots 사망 시트 2벌 추가 — MD-01 유령 환자(병원 원거리 아틀라스 R52 셋째 줄) · MD-03 가면 잡역부(병원 R51 아틀라스 앞모습 줄)
//  (CX-0115MD r1 ROUGH, 사용자 11-18 밤샘 "좀 별로라도 일단 업로드 → 코드로 개선 적용"). 15세: 피·시체 없이 재·연기로.
//  R1158 과 같은 길(R1065 사망 표). 아틀라스 한 장에 다른 인물(R52 첫·둘째 줄 가면 투척수)·뒷모습(R51 둘째 줄)이 있어, 살아 있는 칸 줄(sourceRect y)이 맞을 때만 고른다. 이름으로는 안 고른다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','mob-attack-dots-r1065.js'),'utf8');
function world(){const store={};const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=()=>({image:{naturalWidth:10}});ctx.ensureImages=()=>Promise.resolve();
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>({path:'x'})});vm.runInContext(src,ctx);return ctx;}
const API=c=>c.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
const C=world(),A=API(C),S=A.inspect().sheets;
// 살아 있을 때: 그림 경로, 시트 칸 크기, 살아 있는 칸 사각(그 줄의 여러 칸), 살아 있을 때 키(visibleHeight), 고르면 안 되는 칸
const NEW={'MD-01':{cell:[313,368],live:'assets/visual-test/hospital-ranged-motion-r52.png',rect:[0,718,350,368],more:[[350,718,380,368],[1135,718,313,368]],no:[[0,0,350,362],[730,362,405,356]],vh:340},
 'MD-03':{cell:[444,444],live:'assets/visual-test/hospital-orderly-motion-r51-v2.png',rect:[0,0,444,444],more:[[887,0,443,444]],no:[[0,444,444,443],[1330,444,444,443]],vh:322}};
const D=Object.entries(S).filter(([k,v])=>v.kind==='death');ok(D.length>=31,'>=31 death sheets (R1165 29 + 2 new): '+D.length);
const py=`
import json,sys
from PIL import Image
o={}
for k,(p,W,H) in json.loads(sys.argv[1]).items():
  im=Image.open(sys.argv[2]+'/'+p).convert('RGBA');fr=[]
  for i in range(im.size[0]//W):
    c=im.crop((i*W,0,(i+1)*W,H));a=c.getchannel('A');d=list(c.getdata());px=[q for q in d if q[3]>64]
    fr.append({'bb':a.point(lambda v:255 if v>16 else 0).getbbox(),'mass':sum(a.getdata()),'low':sum(1 for q in d if 0<q[3]<=16),'red':sum(1 for r,g,b,_ in px if r>150 and r>g+80 and r>b+80)/max(1,len(px))})
  o[k]={'size':list(im.size),'fr':fr}
print(json.dumps(o))`;
let M={};try{M=JSON.parse(cp.execFileSync('python3',['-I','-c',py,JSON.stringify(Object.fromEntries(Object.keys(NEW).map(k=>[k,[S[k]?.path||'x',...NEW[k].cell]]))),path.join(R,'runtime-text')],{encoding:'utf8',maxBuffer:1<<26}));}catch(err){ok(false,'sheets measurable: '+String(err.message).slice(0,200));}
for(const [k,e] of Object.entries(NEW)){const s=S[k];ok(s&&s.kind==='death','death sheet '+k);ok(s.cells===6&&s.cell[0]===e.cell[0]&&s.cell[1]===e.cell[1],k+' 6 cells of '+e.cell);
 ok(/^assets\/r1166\/mobs\/md-\d\d-/.test(s.path),k+' path under assets/r1166');const m=M[k];ok(m.size[0]===e.cell[0]*6&&m.size[1]===e.cell[1],k+' sheet size');
 const f0=m.fr[0],h0=f0.bb[3]-f0.bb[1];ok(Math.abs(s.anchor[1]-f0.bb[3])<=2,k+' anchor y on first-cell foot ('+s.anchor[1]+' vs '+f0.bb[3]+')');ok(s.anchor[0]>f0.bb[0]&&s.anchor[0]<f0.bb[2],k+' anchor x inside body');
 ok(s.bases[e.live.replace(/^assets\//,'')]?.rows?.length===1,k+' row-gated base');ok(s.liveH>0&&Math.abs(s.bodyH-e.vh*h0/s.liveH)<=2,k+' bodyH = living height × first cell / living cell ('+s.bodyH+')');
 for(const [i,f] of m.fr.entries()){ok(f.low===0,k+' f'+i+' no alpha 1..16');if(f.bb)ok(f.bb[0]>=1&&f.bb[1]>=1&&f.bb[2]<=e.cell[0]-1&&f.bb[3]<=e.cell[1]-1,k+' f'+i+' inside cell');}
 ok(m.fr.every((f,i)=>!i||f.mass<=m.fr[0].mass*1.1),k+' no frame heavier than the standing one');ok(m.fr[5].mass<=m.fr[0].mass*.12,k+' last cell mostly gone ('+(m.fr[5].mass/m.fr[0].mass).toFixed(3)+')');
 ok(m.fr.every(f=>f.red<=Math.max(.02,s.liveRed+.01)),k+' red-dominant pixels not above the living art (15세, 피 없음)');}
const mk=(p,name,[x,y,w,h])=>({path:p,name,frame:{path:p,assetFrame:{sourceRect:[x,y,w,h],pivot:[w/2,h-6],visibleHeight:h*.9}}});
for(const [k,e] of Object.entries(NEW)){const look=mk(e.live,'아무 이름',e.rect);const d=A.deathFrame(look,.5);ok(d&&d.id===k,k+' picked by living art path');
 const o=[];for(let t=0;t<1.25;t+=.05){const q=A.deathFrame(look,t);ok(q&&q.frame.assetFrame.pivot.every(Number.isFinite)&&q.frame.assetFrame.visibleHeight>0,k+' finite frame '+t.toFixed(2));o.push(q.cell);}
 ok(o[0]===0&&o[o.length-1]===5&&o.every((v,i)=>!i||v>=o[i-1])&&new Set(o).size===6,k+' cells 0→5 in order');
 const fl=A.deathFrame({...look,frame:{...look.frame,flip:true}},.3);ok(fl.frame.flip===true,k+' keeps living flip');
 for(const r of e.more)ok(A.deathFrame(mk(e.live,'x',r),.3)?.id===k,k+' other cell of same row '+r);
 for(const r of e.no)ok(A.deathFrame(mk(e.live,'x',r),.3)===null,k+' other row '+r+' (other figure/back view) not picked');
 ok(A.deathFrame({path:e.live,name:'x',frame:{path:e.live}},.3)===null,k+' no cell rect → not picked');
 ok(A.deathFrame({path:e.live,name:'x',frame:{path:e.live,sourceRect:e.rect}},.3)?.id===k,k+' plain frame.sourceRect also read');}
ok(A.deathFrame(mk('assets/r410/mobs/m033.webp','태엽 수집자',[0,0,256,320]),.5)?.id==='MD-25','MD-25 (R1165, no rows) untouched');
ok(A.deathFrame(mk('assets/r92/mobs/M027-move.png','x',[186,0,186,158]),.5)?.id==='MD-17','MD-17 (R1165) untouched');
ok(A.deathFrame(mk('assets/r380/mobs/blackmarket-suspect-v1.webp','암시장의 수상한 자',[0,0,256,320]),.5).id==='MD-08','MD-08 untouched');
ok(A.deathFrame(mk('assets/r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp','무명 검흔',[192,0,192,256]),.5).id==='MD-37','MD-37 untouched');
// 미리 읽기: 처음 본 칸이 다른 줄(R51 뒷모습)이어도 경로가 같으면 사망 시트를 미리 읽어 둔다(실플레이 ep1a08 은 대부분 뒷모습 줄로 처음 보임)
{const store={},asked=[];const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=p=>/r1166/.test(p)?null:{image:{naturalWidth:10}};ctx.ensureImages=a=>{asked.push(...a);return Promise.resolve();};
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>({path:'assets/visual-test/hospital-orderly-motion-r51-v2.png',assetFrame:{sourceRect:[0,444,444,443],pivot:[251.8,361],visibleHeight:322}})});vm.runInContext(src,ctx);
 ctx.__STORYWORLD_STORY_COMBAT_R54__.frameFor({id:'m',name:'백의 구속자',hp:10},null);ok(asked.some(p=>/r1166\/mobs\/md-03-/.test(p)),'MD-03 sheet preloaded when first seen in back row ('+asked+')');
 const L={path:'assets/visual-test/hospital-orderly-motion-r51-v2.png',name:'백의 구속자',frame:{path:'x',assetFrame:{sourceRect:[0,0,444,444]}}};ok(API(ctx).deathFrame(L,.2)===null,'not ready → null (fallback to R462 silhouette)');}
{const c=world();API(c).set(false);ok(API(c).deathFrame(mk(NEW['MD-01'].live,'x',NEW['MD-01'].rect),.3)===null,'off: null');}
{const pages=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');ok(pages.includes('node r96/qa/r1166/r1166-cpu-check.cjs'),'pages.yml');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'assets/r1166/'"),'public verify prefix');
 const v=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');for(const k of Object.keys(NEW))ok(v.includes(S[k].path),k+' in runtime-inputs');
 ok(fs.readFileSync(path.join(R,'runtime-text','mob-attack-dots-r1065.js'),'utf8')===src,'runtime copy matches');
 const rec=JSON.parse(fs.readFileSync(path.join(R,'r1166-md-deaths.json'),'utf8'));ok(rec.files.length===2&&rec.files.every(f=>f.sha256&&f.sourceSha256&&f.finalArt===false),'asset record');}
console.log('R1166 CPU check passed:',n);
