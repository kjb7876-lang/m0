// R1165 CPU 검사: Dots 사망 시트 3벌 추가 — MD-15 붉은 커튼 마네킹(r275 curtain-mannequin) · MD-17 붉은 날개 인물(r92 M027 둘째 칸) · MD-25 태엽 수집자(r410 m033)
//  (CX-0115MD r1 ROUGH, 사용자 11-18 밤샘 "좀 별로라도 일단 업로드 → 코드로 개선 적용"). R1158 과 같은 길(R1065 사망 표). 15세: 피·시체 없이 재·연기로.
//  그림 고르기는 살아 있을 때 그림 경로로(MD-17 은 Dots 가 '립스틱 탄환' 이름과 실제 그림이 다르다고 해 이름으로는 안 고름). 태엽 수집자만 이름으로도 고른다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','mob-attack-dots-r1065.js'),'utf8');
function world(){const store={};const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=()=>({image:{naturalWidth:10}});ctx.ensureImages=()=>Promise.resolve();
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>({path:'x'})});vm.runInContext(src,ctx);return ctx;}
const API=c=>c.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
const C=world(),A=API(C),S=A.inspect().sheets;
// 살아 있을 때: 그림 경로, 시트 칸 크기(MD-15·17 은 발 아래 투명 8px 덧댐), 살아 있는 칸 사각, 살아 있을 때 키(visibleHeight)
const NEW={'MD-15':{cell:[87,166],live:'assets/r275/mobs/curtain-mannequin.webp',rect:[87,0,87,158],vh:150},
 'MD-17':{cell:[186,166],live:'assets/r92/mobs/M027-move.png',rect:[186,0,186,158],vh:151},
 'MD-25':{cell:[256,320],live:'assets/r410/mobs/m033.webp',rect:[0,0,256,320],vh:217}};
const D=Object.entries(S).filter(([k,v])=>v.kind==='death');ok(D.length>=29,'>=29 death sheets (R1158 26 + 3 new): '+D.length);
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
 ok(/^assets\/r1165\/mobs\/md-\d\d-/.test(s.path),k+' path under assets/r1165');const m=M[k];ok(m.size[0]===e.cell[0]*6&&m.size[1]===e.cell[1],k+' sheet size');
 const f0=m.fr[0],h0=f0.bb[3]-f0.bb[1];ok(Math.abs(s.anchor[1]-f0.bb[3])<=2,k+' anchor y on first-cell foot ('+s.anchor[1]+' vs '+f0.bb[3]+')');ok(s.anchor[0]>f0.bb[0]&&s.anchor[0]<f0.bb[2],k+' anchor x inside body');
 ok(s.liveH>0&&Math.abs(s.bodyH-e.vh*h0/s.liveH)<=2,k+' bodyH = living height × first cell / living cell ('+s.bodyH+')');
 for(const [i,f] of m.fr.entries()){ok(f.low===0,k+' f'+i+' no alpha 1..16');if(f.bb)ok(f.bb[0]>=1&&f.bb[1]>=1&&f.bb[2]<=e.cell[0]-1&&f.bb[3]<=e.cell[1]-1,k+' f'+i+' inside cell');}
 ok(m.fr.every((f,i)=>!i||f.mass<=m.fr[0].mass*1.1),k+' no frame heavier than the standing one');ok(m.fr[5].mass<=m.fr[0].mass*.12,k+' last cell mostly gone ('+(m.fr[5].mass/m.fr[0].mass).toFixed(3)+')');
 ok(m.fr.every(f=>f.red<=Math.max(.02,s.liveRed+.01)),k+' red-dominant pixels not above the living art (15세, 피 없음)');}
const mk=(p,name,[x,y,w,h])=>({path:p,name,frame:{path:p,assetFrame:{sourceRect:[x,y,w,h],pivot:[w/2,h-6],visibleHeight:h*.9}}});
for(const [k,e] of Object.entries(NEW)){const look=mk(e.live,'아무 이름',e.rect);const d=A.deathFrame(look,.5);ok(d&&d.id===k,k+' picked by living art path');
 const o=[];for(let t=0;t<1.25;t+=.05){const q=A.deathFrame(look,t);ok(q&&q.frame.assetFrame.pivot.every(Number.isFinite)&&q.frame.assetFrame.visibleHeight>0,k+' finite frame '+t.toFixed(2));o.push(q.cell);}
 ok(o[0]===0&&o[o.length-1]===5&&o.every((v,i)=>!i||v>=o[i-1])&&new Set(o).size===6,k+' cells 0→5 in order');
 const fl=A.deathFrame({...look,frame:{...look.frame,flip:true}},.3);ok(fl.frame.flip===true,k+' keeps living flip');}
ok(A.deathFrame(mk('assets/other.webp','태엽 수집자',[0,0,10,10]),.5)?.id==='MD-25','태엽 수집자 by name');
ok(A.deathFrame(mk('assets/other.webp','공중을 가르는 립스틱 탄환',[0,0,10,10]),.5)?.id!=='MD-17','MD-17 not picked by the lipstick name');
ok(A.deathFrame(mk('assets/r380/mobs/blackmarket-suspect-v1.webp','암시장의 수상한 자',[0,0,256,320]),.5).id==='MD-08','MD-08 untouched');
ok(A.deathFrame(mk('assets/r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp','무명 검흔',[192,0,192,256]),.5).id==='MD-37','MD-37 untouched');
{const c=world();API(c).set(false);ok(API(c).deathFrame(mk(NEW['MD-25'].live,'x',NEW['MD-25'].rect),.3)===null,'off: null');}
// 살아 있을 때 공격 시트(MA-03·MA-10)는 그대로 — 같은 그림 경로라도 사망 표와 섞이지 않는다
ok(S['MA-03'].bases['r92/mobs/M027-move.png']&&S['MA-10'].bases['r410/mobs/m033.webp'],'MA-03/MA-10 attack bases kept');
{const pages=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');ok(pages.includes('node r96/qa/r1165/r1165-cpu-check.cjs'),'pages.yml');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'assets/r1165/'"),'public verify prefix');
 const v=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');for(const k of Object.keys(NEW))ok(v.includes(S[k].path),k+' in runtime-inputs');
 ok(fs.readFileSync(path.join(R,'runtime-text','mob-attack-dots-r1065.js'),'utf8')===src,'runtime copy matches');
 const rec=JSON.parse(fs.readFileSync(path.join(R,'r1165-md-deaths.json'),'utf8'));ok(rec.files.length===3&&rec.files.every(f=>f.sha256&&f.sourceSha256&&f.finalArt===false),'asset record');}
console.log('R1165 CPU check passed:',n);
