// R1111 CPU 검사: Dots 사망 시트 추가 5벌 — MD-05 소독등 타락천사 r2 · MD-27 강철 턱의 사이보그 개 r2 · MD-29 중간보스 강철 턱 개(MD-27 r2 재사용) · MD-44 시간핵의 명령 파동(기존 4칸 정리) · MD-72 재 나방.
//  기존 R1065c 사망 11벌 위에 얹는다. 15세(피·시체 없음) — R462 재 소멸 안에서 deathFrame 이 칸을 준다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','mob-attack-dots-r1065.js'),'utf8');
function world(){const store={};const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=()=>({image:{naturalWidth:10}});ctx.ensureImages=()=>Promise.resolve();
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>({path:'x'})});vm.runInContext(src,ctx);return ctx;}
const API=c=>c.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
const C=world(),A=API(C),S=A.inspect().sheets;
const NEW={'MD-05':{cells:6,cell:[256,320],re:/md-05-/},'MD-27':{cells:6,cell:[320,320],re:/md-27-/},'MD-29':{cells:6,cell:[418,418],re:/md-29-/},'MD-44':{cells:4,cell:[362,362],re:/md-44-/},'MD-72':{cells:6,cell:[192,240],re:/md-72-/}};
const D=Object.entries(S).filter(([k,v])=>v.kind==='death');ok(D.length===16,'16 death sheets (11 + 5 new): '+D.map(x=>x[0]));
for(const [k,e] of Object.entries(NEW)){const s=S[k];ok(s&&s.kind==='death','death sheet '+k);ok(s.cells===e.cells&&s.cell[0]===e.cell[0]&&s.cell[1]===e.cell[1],k+' cells/cell size');
 const p=path.join(R,'runtime-text',s.path);ok(fs.existsSync(p)&&fs.statSync(p).size>1000,k+' sheet file');
 const dim=require('child_process').execFileSync('python3',['-I','-c','from PIL import Image;import sys;print(*Image.open(sys.argv[1]).size)',p]).toString().trim().split(' ').map(Number);
 ok(dim[0]===s.cell[0]*s.cells&&dim[1]===s.cell[1],k+' sheet size = cell×cells '+dim);ok(s.anchor[1]<=s.cell[1]&&s.bodyH>40,k+' anchor in cell');}
// 칸 고르기: 6칸은 0→5, 4칸은 0→3, 모두 차례대로
const ks=(look)=>{const o=[];for(let t=0;t<1.25;t+=.05){const d=A.deathFrame(look,t);ok(d&&d.frame.assetFrame.visibleHeight>0&&d.frame.assetFrame.pivot.every(Number.isFinite),'death frame '+t.toFixed(2));o.push(d.cell);}return o;};
const mk=(p,name,x,y,w,h)=>({path:p,name,frame:{path:p,assetFrame:{sourceRect:[x,y,w,h],pivot:[w/2,h-10],visibleHeight:h*.7}}});
const CASES=[['MD-05',mk('assets/r410/mobs/m016.webp','소독등 타락천사',256,0,256,320)],['MD-05',mk('assets/other.webp','소독등 타락천사 추격대',0,0,10,10)],
 ['MD-27',mk('assets/r380/mobs/ep1b-steel-jaw-hound-walk-d1.webp','강철 턱의 사이보그 개',640,0,320,320)],['MD-27',mk('assets/other.webp','강철 턱의 사이보그 개 우두머리',0,0,10,10)],['MD-27',mk('assets/other.webp','강철 턱의 사이보그 개 증원',0,0,10,10)],
 ['MD-29',mk('assets/episode1b/generated-v394/polar_cyborg_hound.webp','중간보스 · 강철 턱의 사이보그 개',0,0,418,418)],['MD-29',mk('assets/other.webp','중간보스 · 강철 턱의 사이보그 개',0,0,10,10)],
 ['MD-44',mk('assets/kair/enemies/resonance-slave.png','시간핵의 명령 파동',0,0,362,362)],['MD-44',mk('assets/r1029/float/resonance-slave.webp','시간핵의 명령 파동',0,0,254,226)],
 ['MD-72',mk('assets/r380/mobs/ash-moth-v2.webp','재 나방 3',192,0,192,240)],['MD-72',mk('assets/other.webp','재 나방 1',0,0,10,10)]];
for(const [id,look] of CASES){const d=A.deathFrame(look,.5);ok(d&&d.id===id,'which sheet: '+look.name+' → '+(d&&d.id)+' want '+id);const o=ks(look);const last=NEW[id].cells-1;
 ok(o[0]===0&&o[o.length-1]===last&&o.every((v,i)=>!i||v>=o[i-1]),id+' cells 0→'+last+' in order ('+[...new Set(o)]+')');ok(new Set(o).size===NEW[id].cells,id+' every cell shown');}
// 기존 11벌은 그대로, 중간보스 강철 턱 개만 MD-29, 일반은 MD-27
ok(A.deathFrame(mk('assets/r380/mobs/legacy-m119-nameless-scar-v4-walk-d1.webp','무명 검흔',192,0,192,256),.5).id==='MD-37','MD-37 untouched');
ok(A.deathFrame(mk('assets/x.webp','강철 턱의 사이보그 개 외 아무개',0,0,10,10),.5)?.id!=='MD-29','hound plain name is not MD-29');
ok(A.deathFrame(mk('assets/x.webp','알 수 없는 몹',0,0,10,10),.5)===null,'unknown mob: no sheet');
// 끄면 null
{const c=world();API(c).set(false);ok(API(c).deathFrame(CASES[0][1],.3)===null,'off: null');}
// 15세: 피·시체 없이 — 새 시트에 붉은 상처 표시(MD-18 보류 사유)가 없는지 한 번 더 본다(적색 우세 픽셀 비율)
for(const k of Object.keys(NEW)){const p=path.join(R,'runtime-text',S[k].path);const pct=require('child_process').execFileSync('python3',['-I','-c','from PIL import Image;import sys\nim=Image.open(sys.argv[1]).convert("RGBA");px=[p for p in im.getdata() if p[3]>64];r=sum(1 for a,b,c,d in px if a>150 and a>b+80 and a>c+80);print(r/max(1,len(px)))',p]).toString();ok(+pct<.02,k+' red-dominant pixels < 2% ('+(+pct).toFixed(4)+')');}
{const pages=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');ok(pages.includes('r96/qa/r1111/r1111-cpu-check.cjs'),'pages.yml');
 const v=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');for(const k of Object.keys(NEW))ok(v.includes(S[k].path),k+' in runtime-manifest');
 ok(fs.readFileSync(path.join(R,'runtime-text','mob-attack-dots-r1065.js'),'utf8')===src,'runtime copy matches');}
console.log('R1111 CPU check passed:',n);
