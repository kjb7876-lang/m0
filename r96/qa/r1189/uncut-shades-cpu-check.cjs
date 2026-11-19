// R1189 실패 먼저(R1188 다음): 칸이 좁아 공격 칸 양옆이 잘리던 사몽 잔영 나머지 6종(검은 고리의 대련생·폐선로 태엽 군단병·낚싯바늘 원고지 망령·카이로 회랑의 시계침 수문장 잔영·검은 제단의 전선 망자 잔영·승전식 제복 마네킹 잔영)을
// Dots CX-0164CR 새 시트(칸 256×256, 11칸, 발 y236)로 바꾼다. 사용자 2026-11-19 "너무 심각한것들은 다시 재창조해서 개선 적용해 닷츠랑 협업해서".
// 검사: ① 여섯 잔영이 새 시트·새 칸·새 발로 그려짐(칸 순서 그대로) ② 다른 잔영·끄기(uncut:false)는 원래 그대로 ③ 새 시트 칸마다 그림이 가장자리에서 8px 안쪽(잘림 없음)·발 줄 236
// ④ 파일·index(원본 해시·임시 표시)·빌드 연결
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const ROOT=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};
const SRC=rd('client-source/samong-shades-r200.js'),INDEX=JSON.parse(rd('runtime-text/assets/r200/shades/index.json'));
async function world(zone,prefs){const store={'storyworld.r200.shades':JSON.stringify(prefs||{})};
 const C={Math,String,Number,Array,Object,JSON,RegExp,Promise,console,performance:{now:()=>0},setTimeout:f=>f(),localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(INDEX)))}),room:{id:'ep1b05',samongR103:{zone}},time:0,player:{x:0,y:0}};
 C.window=C;C.__STORYWORLD_STORY_COMBAT_R54__={frameFor:()=>null};vm.createContext(C);if(SRC)vm.runInContext(SRC,C);await new Promise(r=>setImmediate(r));return C;}
function pick(C,zone,id){for(let i=0;i<400;i++){const e={id:'m'+i,name:'x',hp:10,samongR103:{zone},x:1,y:0};const f=C.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,null);if(f&&f.r200Shade===id)return {e,f};}return null;}
(async()=>{const IDS=['ring-sparrer','clockwork-legionary','fishhook-manuscript','clockhand-warden','wire-bound-dead','parade-mannequin'];
 const W={'ring-sparrer':'sz115-S03-2','clockwork-legionary':'sz115-S06-10','fishhook-manuscript':'sz115-RF-1','clockhand-warden':'sz115-RB-1','wire-bound-dead':'sz115-RG-1','parade-mannequin':'sz115-RE-1'};
 for(const [id,z] of Object.entries(W)){const C=await world(z);const r=pick(C,z,id);
  ok(r&&r.f.path==='assets/r1189/shades/'+id+'.webp','① '+id+' 새 시트 ('+(r&&r.f.path)+')');
  ok(r&&r.f.assetFrame.sourceRect[2]===256&&r.f.assetFrame.sourceRect[3]===256&&r.f.assetFrame.sourceRect[0]%256===0,'① '+id+' 256 칸');
  ok(r&&r.f.assetFrame.pivot[1]===236&&r.f.assetFrame.visibleHeight>150&&r.f.assetFrame.visibleHeight<170,'① '+id+' 발 236·보이는 키');
  if(r){r.e.attack={elapsed:.9};const f=C.__STORYWORLD_STORY_COMBAT_R54__.frameFor(r.e,null);ok(f.assetFrame.sourceRect[0]/256>=5,'① '+id+' 공격 칸 5~10');
   r.e.attack=null;r.e.moving=true;let mx=0;for(let t=0;t<40;t++){C.time=t*.07;mx=Math.max(mx,C.__STORYWORLD_STORY_COMBAT_R54__.frameFor(r.e,null).assetFrame.sourceRect[0]/256);}ok(mx<=4,'① '+id+' 걷기는 0~4칸만(새 시트 칸 나눔) (최대 '+mx+')');}
  const D=await world(z,{uncut:false});const d=pick(D,z,id);ok(d&&d.f.path==='assets/r200/shades/'+id+'.webp','② '+id+' 끄면 원래 그림');}
 {const C=await world('sz115-RG-1');const m=INDEX.mobs.find(m=>m.zone==='RG'&&!['wire-bound-dead'].includes(m.id));const o=m&&pick(C,'sz115-RG-1',m.id);ok(o&&o.f.path===m.path,'② 다른 잔영('+(m&&m.id)+') 그대로');}
 {const C=await world('sz115-S01-2');const r=pick(C,'sz115-S01-2','mannequin');const P=()=>C.__STORYWORLD_STORY_COMBAT_R54__.frameFor(r.e,null).path,A=C.__STORYWORLD_SAMONG_SHADES_R200__;const p1=r&&P();A.set({uncut:false});const p2=r&&P();A.set({uncut:true});const p3=r&&P();
  ok(p1==='assets/r1188/shades/mannequin.webp'&&p2==='assets/r200/shades/mannequin.webp'&&p3===p1,'② 켜기·끄기가 새로고침 없이 바로 먹음 ('+[p1,p2,p3].join(' → ')+')');}
 {const C=await world('sz115-S05-2');const r=pick(C,'sz115-S05-2','tram-passenger');ok(r&&r.f.path==='assets/r1188/shades/tram-passenger.webp','② R1188 3종 그대로');}
 let S=null;try{S=JSON.parse(cp.execFileSync('python3',['-c',`import sys,json
from PIL import Image
r={}
for p in sys.argv[1:]:
  im=Image.open(p).convert('RGBA');a=im.getchannel('A').point(lambda v:255 if v>16 else 0);m=[];f=[]
  for k in range(im.size[0]//256):
    b=a.crop((k*256,0,k*256+256,256)).getbbox();m.append(min(b[0],256-b[2],b[1],256-b[3]) if b else 99);f.append(b[3] if b else 0)
  r[p.split('/')[-1]]={'size':im.size,'margin':min(m),'feet':sorted(set(f))}
print(json.dumps(r))`,...IDS.map(s=>path.join(ROOT,'runtime-text/assets/r1189/shades/'+s+'.webp'))]).toString());}catch(_){}
 for(const s of IDS){const v=S&&S[s+'.webp'];ok(v&&v.size.join()==='2816,256','③ '+s+' 2816×256');ok(v&&v.margin>=8,'③ '+s+' 가장자리 여백 ≥8 ('+(v&&v.margin)+')');ok(v&&v.feet.length===1&&v.feet[0]===236,'③ '+s+' 발 줄 236 ('+(v&&v.feet)+')');}
 {let ix=null;try{ix=JSON.parse(rd('runtime-text/assets/r1189/shades/index.json'));}catch(_){}ok(ix&&ix.assets.length===6&&ix.assets.every(a=>a.finalArt===false&&a.sourceSha256&&a.replaces),'④ index.json');}
 ok(rd('runtime-text/samong-shades-r200.js')===SRC&&SRC.length>0,'④ runtime-text 사본');ok(rd('runtime-inputs.json').includes('assets/r1189/shades/parade-mannequin.webp')&&rd('runtime-manifest.json').includes('assets/r1189/shades/ring-sparrer.webp'),'④ sync 등록');
 ok(rd('../scripts/verify-r96-public.py').includes("'assets/r1189/'"),'④ verify 자산 접두');ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1189/uncut-shades-cpu-check.cjs'),'④ pages.yml');
 console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);})();
