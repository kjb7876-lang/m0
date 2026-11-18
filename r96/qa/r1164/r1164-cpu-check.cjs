// R1164: Dots CX-0152-2 r1 ROUGH(사용자 11-18 밤샘 "좀 별로라도 일단 업로드 → 코드로 개선 적용") — b04 탐식 인간 총주방장(phase0) 대기 6칸·피격 4칸을 R620 보스 움직임에 붙인다.
//  · 그림 한 장(672×384) 보스라 칸 거르기 없이 그 그림일 때만 바꾼다. 다른 폼(phase1~)·공격 그림은 그대로.
//  · 대기 8fps 6칸 반복, 피격 16fps 4칸 한 번, 걷기·공격 중엔 시트를 안 쓴다. 시트가 안 실렸으면 원래 그림.
//  · 시트 파일: 칸 = 엔진 그림 크기, 발 줄·키(±5%)·원래 그림과 겹침(IoU)·색(평균 차)·알파 1~16 0·가장자리 안 닿음. 원래 그림은 빌드된 site 에서 읽는다.
//  · 겹침 하한: 대기 0.6, 피격 0.45(b04 는 몸 둘레 연기·재료 조각이 칸마다 달라지고 피격 2·3칸째가 뒤로 젖혀(실측 .525·.497) R1163 칸 시트 0.55 보다 낮게 둠).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','boss-motion-r620.js'),'utf8');
const BOSSES={b04:['assets/generated-v31224/actors-normalized/fbc0132dd447_ep1b04_glutton_head_chef_phase0.webp',672,384,{boss:true}]};
function world(p,W,H,{ready=true,cell=0}={}){const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,Symbol,isFinite,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}}};ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(`var time=0,room={id:'z'},player={x:0,y:0},ctx={commands:[]};var __ready=${ready},__added=[],__cell=${cell};function addImage(p){__added.push(p);}
  function readyImage(p){if(/assets\\/r(620|1147|1160|1161|1163|1164)\\//.test(p))return __ready?{ready:true,image:{src:p}}:null;return {ready:true,image:{src:p}};}
  function drawEnemy(e){ctx.commands.push({kind:'image',owner:{kind:'enemy'},image:{src:'http://127.0.0.1:4410/m0/${p}'},sourcePath:'http://127.0.0.1:4410/m0/${p}',sourceRect:[0,0,${W},${H}],style:{globalAlpha:1},points:[[50,100],[150,100],[150,200],[50,200]]});}`,ctx);
 vm.runInContext(src,ctx);return ctx;}
const run=(c,s)=>vm.runInContext(s,c);
function frames(c,e,secs,{dt=1/30,step=null}={}){const out=[];for(let t=0;t<secs-1e-9;t+=dt){run(c,`time+=${dt}`);if(step)step(e,t);run(c,'ctx.commands.length=0');c.drawEnemy(e);const b=run(c,'ctx.commands').find(k=>k.kind==='image'&&!k.r620Ghost);out.push({src:b.sourcePath,rect:[...b.sourceRect],pts:b.points.map(p=>[...p])});}return out;}
for(const [id,[p,W,H,flag]] of Object.entries(BOSSES)){const mk=o=>({id:'b-'+id,x:3,y:3,hp:100,hitTimer:0,...flag,...o});
 for(const cell of [0]){const c=world(p,W,H,{cell}),e=mk();const L=frames(c,e,1.6);
  ok(L.every(f=>f.src==='assets/r1164/bosses/'+id+'-idle6.webp'),id+' cell '+cell+': idle uses R1164 idle6 sheet');
  const cells=new Set(L.map(f=>f.rect[0]));ok(cells.size===6&&L.every(f=>f.rect[1]===0&&f.rect[2]===W&&f.rect[3]===H&&f.rect[0]%W===0&&f.rect[0]<=W*5),id+' cell '+cell+': cycles 6 cells of '+W+'x'+H);
  ok(L.every(f=>f.pts.flat().every(Number.isFinite)),id+': finite points');}
 {const c=world(p,W,H),e=mk();frames(c,e,.5);e.hitTimer=.14;const Lh=frames(c,e,.6,{step:e=>{e.hitTimer=Math.max(0,e.hitTimer-1/30);}});
  ok(Lh.slice(0,3).every(f=>f.src==='assets/r1164/bosses/'+id+'-hit4.webp'),id+': hit uses R1164 hit4 sheet');const hc=Lh.filter(f=>f.src.includes('-hit4')).map(f=>f.rect[0]);ok(new Set(hc).size===4&&hc.every(x=>x%W===0&&x<=W*3),id+': hit plays 4 cells once');
  ok(Lh[Lh.length-1].src.includes('-idle6'),id+': back to idle sheet after hit');ok(c.__STORYWORLD_BOSS_MOTION_R620__.inspect().stats.errors===0,id+': no errors');
  const Lw=frames(c,e,1,{step:e=>{e.x+=.05;}});ok(Lw.slice(15).every(f=>!f.src.includes('r1164')),id+': walking keeps engine art');
  e.attack={elapsed:0,angle:0};const La=frames(c,e,.3,{step:e=>{e.attack.elapsed+=1/30;}});ok(La.every(f=>!f.src.includes('r1164')),id+': attack keeps engine art');}
 for(const q of ['assets/generated-v31224/actors-normalized/27ef01c10a8f_gluttony-human-attack.webp','assets/r104/bosses/b04-boss-p2.webp']){const c=world(q,W,H),L=frames(c,mk(),.5);ok(L.every(f=>!f.src.includes('r1164')),id+': other art '+q.split('/').pop()+' untouched');}
 {const c=world(p,W,H,{ready:false}),L=frames(c,mk(),.3);ok(L.every(f=>!f.src.includes('r1164')),id+': sheet not loaded → original');ok(run(c,'__added').some(q=>q.includes('r1164/bosses/'+id+'-idle6')),id+': sheet requested');}
 {const c=world(p,W,H),L=frames(c,{id:'m',x:3,y:3,hp:100,hitTimer:0},.5);ok(L.every(f=>!f.src.includes('r1164')),id+': same art on a non-boss mob untouched');}}
{// 기존 시트 회귀
 const c=world('assets/r104/bosses/b07-boss-p4.webp',411,473),L=frames(c,{id:'b',boss:true,x:3,y:3,hp:100,hitTimer:0},.5);ok(L.every(f=>f.src.includes('r1147/bosses/b07-idle6')),'b07 idle sheet still used');}
{const py=`
import json,sys
from PIL import Image
out={}
for k,(p,W,H,_) in json.loads(sys.argv[1]).items():
  src=Image.open('${R}/hospital-three-pc/site/'+p).convert('RGBA').crop((0,0,W,H))
  def info(im):
    a=im.getchannel('A').point(lambda v:255 if v>16 else 0);b=a.getbbox();d=[q for q in im.getdata() if q[3]>16]
    return {'bb':b,'rgb':[sum(q[j] for q in d)/len(d) for j in range(3)],'low':sum(1 for q in im.getdata() if 0<q[3]<=16),'m':list(a.getdata())}
  s=info(src);o={'src':{'bb':s['bb'],'rgb':s['rgb']}}
  for sh,nn in (('idle6',6),('hit4',4)):
    im=Image.open('${R}/runtime-text/assets/r1164/bosses/'+k+'-'+sh+'.webp').convert('RGBA');fr=[]
    for i in range(nn):
      f=info(im.crop((i*W,0,(i+1)*W,H)));f['iou']=sum(1 for a,b in zip(s['m'],f['m']) if a and b)/max(1,sum(1 for a,b in zip(s['m'],f['m']) if a or b));del f['m'];fr.append(f)
    o[sh]={'size':list(im.size),'fr':fr}
  out[k]=o
print(json.dumps(out))`;
 let M=null;try{M=JSON.parse(cp.execFileSync('python3',['-I','-c',py,JSON.stringify(BOSSES)],{encoding:'utf8',maxBuffer:1<<26}));}catch(err){ok(false,'sheet files measurable: '+String(err.message).slice(0,300));}
 for(const [id,[,W,H]] of Object.entries(BOSSES)){const m=M[id],s=m.src,vh=s.bb[3]-s.bb[1];
  for(const [sh,nn,fy,hh,io,cc] of [['idle6',6,1,.05,.6,6],['hit4',4,2,.08,.45,8]]){const h=m[sh];ok(h.size[0]===W*nn&&h.size[1]===H,id+' '+sh+': '+W*nn+'x'+H);
   for(const [i,f] of h.fr.entries()){const fvh=f.bb[3]-f.bb[1];ok(Math.abs(f.bb[3]-s.bb[3])<=fy,id+' '+sh+' f'+i+': foot '+f.bb[3]+' ≈ '+s.bb[3]);ok(Math.abs(fvh-vh)/vh<=hh,id+' '+sh+' f'+i+': height');ok(f.iou>=io,id+' '+sh+' f'+i+': overlap with engine cell '+f.iou.toFixed(3));
    const dc=f.rgb.reduce((a,v,j)=>a+Math.abs(v-s.rgb[j]),0)/3;ok(dc<=cc,id+' '+sh+' f'+i+': colour diff '+dc.toFixed(1));ok(f.low===0,id+' '+sh+' f'+i+': no alpha 1..16');ok(f.bb[0]>=1&&f.bb[1]>=1&&f.bb[2]<=W-1&&f.bb[3]<=H-1,id+' '+sh+' f'+i+': not touching cell edge');}}}}
{const ri=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');for(const id of Object.keys(BOSSES))for(const sh of ['idle6','hit4'])ok(ri.includes('assets/r1164/bosses/'+id+'-'+sh+'.webp'),'runtime-inputs lists '+id+' '+sh);
 ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r1164/r1164-cpu-check.cjs'),'pages.yml runs this check');
 ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'assets/r1164/'"),'public verify prefix');
 const rec=JSON.parse(fs.readFileSync(path.join(R,'r1164-b04-boss.json'),'utf8'));ok(rec.files.filter(f=>f.applied).length===2&&rec.files.filter(f=>f.applied).every(f=>f.sha256&&f.sourceSha256&&f.finalArt===false),'asset record: 2 sheets with hashes, not final art');}
console.log('R1164 CX-0152-2 b04 idle/hit CPU check: '+n+' ok');
