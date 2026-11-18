// R1117d CPU 검사: Dots 사망 시트 8벌 추가 — MD-07 부정의 잔영·MD-12 곰팡이와 오물 봉투·MD-16 붉은 하이힐 칼날·MD-22 분노의 사냥개·MD-26 소형 로봇·MD-30 재의 미장이·MD-43 시간핵 연결자·MD-79 검은기둥 주문사.
//  R1065c 11벌 + R1111 5벌 위에 얹는다. 15세(피·시체 없음) — R462 재 소멸 안에서 deathFrame 이 칸을 준다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
const R=path.join(__dirname,'../..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const src=fs.readFileSync(path.join(R,'client-source','mob-attack-dots-r1065.js'),'utf8');
function world(){const store={};const ctx={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,setInterval:()=>0,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};ctx.window=ctx;vm.createContext(ctx);
 ctx.time=0;ctx.readyImage=()=>({image:{naturalWidth:10}});ctx.ensureImages=()=>Promise.resolve();
 ctx.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>({path:'x'})});vm.runInContext(src,ctx);return ctx;}
const API=c=>c.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
const C=world(),A=API(C),S=A.inspect().sheets;
const NEW={'MD-07':{cells:4,cell:[192,192]},'MD-12':{cells:6,cell:[342,162]},'MD-16':{cells:6,cell:[320,328]},'MD-22':{cells:6,cell:[256,256]},'MD-26':{cells:6,cell:[256,320]},'MD-30':{cells:6,cell:[95,189]},'MD-43':{cells:4,cell:[362,362]},'MD-79':{cells:4,cell:[256,320]}};
const D=Object.entries(S).filter(([k,v])=>v.kind==='death');ok(D.length===29,'29 death sheets (16 + 8 new + R1158 MD-08·MD-09 + R1165 MD-15·17·25): '+D.length);
for(const [k,e] of Object.entries(NEW)){const s=S[k];ok(s&&s.kind==='death','death sheet '+k);ok(s.cells===e.cells&&s.cell[0]===e.cell[0]&&s.cell[1]===e.cell[1],k+' cells/cell size');
 const p=path.join(R,'runtime-text',s.path);ok(fs.existsSync(p)&&fs.statSync(p).size>1000,k+' sheet file');
 const dim=cp.execFileSync('python3',['-I','-c','from PIL import Image;import sys;print(*Image.open(sys.argv[1]).size)',p]).toString().trim().split(' ').map(Number);
 ok(dim[0]===s.cell[0]*s.cells&&dim[1]===s.cell[1],k+' sheet size = cell×cells '+dim);ok(s.anchor[1]<=s.cell[1]&&s.bodyH>40,k+' anchor in cell');}
const ks=(look,cells)=>{const o=[];for(let t=0;t<1.25;t+=.05){const d=A.deathFrame(look,t);ok(d&&d.frame.assetFrame.visibleHeight>0&&d.frame.assetFrame.pivot.every(Number.isFinite),'death frame '+t.toFixed(2));o.push(d.cell);}return o;};
const mk=(p,name,x,y,w,h)=>({path:p,name,frame:{path:p,assetFrame:{sourceRect:[x,y,w,h],pivot:[w/2,h-10],visibleHeight:h*.7}}});
const X='assets/other.webp';
const CASES=[['MD-07',mk('assets/r92/mobs/M016-move.png','부정의 잔영',282,0,141,172)],['MD-07',mk(X,'부정의 잔영 증원',0,0,10,10)],
 ['MD-12',mk('assets/r198/mobs/M022-move.png','곰팡이와 오물 봉투',342,0,342,156)],['MD-12',mk(X,'곰팡이와 오물 봉투 우두머리',0,0,10,10)],
 ['MD-16',mk('assets/r380/mobs/ep1b-red-heel-blade-walk-d1.webp','붉은 하이힐 칼날',640,0,320,320)],['MD-16',mk(X,'붉은 하이힐 칼날 증원',0,0,10,10)],
 ['MD-22',mk('assets/r380/mobs/wrath-hound-v1.webp','분노의 사냥개',256,0,256,256)],['MD-22',mk(X,'분노의 사냥개 우두머리',0,0,10,10)],
 ['MD-26',mk('assets/r380/mobs/small-walking-robot-v1.webp','걸어다니는 소형 로봇',256,320,256,320)],['MD-26',mk(X,'걸어다니는 소형 로봇 증원',0,0,10,10)],
 ['MD-30',mk('assets/r275/mobs/ash-mason.webp','성벽 침식 봉인병 추격대',0,0,95,187)],['MD-30',mk(X,'성벽 침식 봉인병 후속 증원',0,0,10,10)],
 ['MD-43',mk('assets/kair/enemies/connector.png','시간핵의 명령 파동',0,0,362,362)],
 ['MD-79',mk('assets/r410/mobs/m009.webp','검은기둥 주문사',0,320,256,320)],['MD-79',mk(X,'검은기둥 주문사 우두머리',0,0,10,10)]];
for(const [id,look] of CASES){const d=A.deathFrame(look,.5);ok(d&&d.id===id,'which sheet: '+look.name+' → '+(d&&d.id)+' want '+id);const o=ks(look);const last=NEW[id].cells-1;
 ok(o[0]===0&&o[o.length-1]===last&&o.every((v,i)=>!i||v>=o[i-1]),id+' cells 0→'+last+' in order ('+[...new Set(o)]+')');ok(new Set(o).size===NEW[id].cells,id+' every cell shown');}
// 기존 시트는 그대로, 시간핵 명령 파동은 경로가 connector 면 MD-43, resonance-slave 면 MD-44
ok(A.deathFrame(mk('assets/kair/enemies/resonance-slave.png','시간핵의 명령 파동',0,0,362,362),.5).id==='MD-44','MD-44 untouched');
ok(A.deathFrame(mk('assets/r380/mobs/ep1b-steel-jaw-hound-walk-d1.webp','강철 턱의 사이보그 개',640,0,320,320),.5).id==='MD-27','MD-27 untouched');
ok(A.deathFrame(mk(X,'알 수 없는 몹',0,0,10,10),.5)===null,'unknown mob: no sheet');
{const c=world();API(c).set(false);ok(API(c).deathFrame(CASES[0][1],.3)===null,'off: null');}
// 15세: 적색 우세 픽셀 비율
for(const k of Object.keys(NEW)){const p=path.join(R,'runtime-text',S[k].path);const pct=cp.execFileSync('python3',['-I','-c','from PIL import Image;import sys\nim=Image.open(sys.argv[1]).convert("RGBA");px=[p for p in im.getdata() if p[3]>64];r=sum(1 for a,b,c,d in px if a>150 and a>b+80 and a>c+80);print(r/max(1,len(px)))',p]).toString();ok(+pct<.04,k+' red-dominant pixels < 4% ('+(+pct).toFixed(4)+')');}
{const pages=fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8');ok(pages.includes('r96/qa/r1117d/r1117d-cpu-check.cjs'),'pages.yml');
 const v=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');for(const k of Object.keys(NEW))ok(v.includes(S[k].path),k+' in runtime-manifest');
 ok(fs.readFileSync(path.join(R,'runtime-text','mob-attack-dots-r1065.js'),'utf8')===src,'runtime copy matches');}
// A8 페르소나 영웅 쓰러짐(옆 6칸): R151 쓰러짐이 라우렌 형상 켜짐(personaHeroR1117)일 때 persona 시트(오른쪽 한 방향, 왼쪽은 반전)를 쓴다
{const d=fs.readFileSync(path.join(R,'client-source','death-r151.js'),'utf8');ok(/HEROES=\[[^\]]*'persona'/.test(d),'death-r151 HEROES has persona');ok(/E_ONLY=new Set\(\['persona'\]\)/.test(d),'persona is east-only (west mirrors)');ok(/personaHeroR1113===true/.test(d),'persona form switch');
 ok(!/HEROES\.includes\(player\.hero\)|sheetOf\(player\.hero|pathOf\(player\.hero/.test(d),'no raw player.hero lookups left');
 const f=path.join(R,'runtime-text/assets/r151/death/persona/death-e.webp');ok(fs.existsSync(f),'persona death sheet');
 const dim=cp.execFileSync('python3',['-I','-c','from PIL import Image;import sys;print(*Image.open(sys.argv[1]).size)',f]).toString().trim().split(' ').map(Number);ok(dim[0]===1152&&dim[1]===256,'persona death 6 cells 192x256 '+dim);
 ok(fs.readFileSync(path.join(R,'runtime-text','death-r151.js'),'utf8')===d,'death-r151 runtime copy matches');}
console.log('R1117d CPU check passed:',n);
