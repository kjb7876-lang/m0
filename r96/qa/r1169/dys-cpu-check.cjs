// R1169 실패 먼저: 사몽 S-06 디스토피아 일반 몹 9종 피격 4칸(R1156 표)·사망 6칸(R1065 사망 표 DY-01~09) — Dots CX-0158DY r1 ROUGH 손질 적용.
// 사용자 2026-11-18 22:06Z "부족한거 닷츠랑계속협업". 그림만, 판정·경직·보상 그대로.
// 검사: ① 맞은 순간 피격 시트 0칸(피벗·보이는 키·좌우 그대로) ② 사망 표가 살아 있는 그림 경로로 DY 시트를 고름 ③ 기존 몹 그대로 ④ 자산·출처표·빌드 연결
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'../..');let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};
const MOBS=[['scythe','dys-scythe-v1','r380/mobs/dys-scythe-v1.webp',240,224],['sacshell','dys-sacshell-v1','r380/mobs/dys-sacshell-v1.webp',240,224],['membrane','dys-membrane-v1','r380/mobs/dys-membrane-v1.webp',240,224],
 ['bulwark','dys-bulwark-v2','r380/mobs/dys-bulwark-v2.webp',256,320],['disc','dys-disc-v2','r380/mobs/dys-disc-v2.webp',256,320],['engineer','dys-engineer-v2','r380/mobs/dys-engineer-v2.webp',256,320],
 ['pulse-raider','dys-pulse-raider-v2','r380/mobs/dys-pulse-raider-v2-walk-d1.webp',256,320],['prism-stalker','dys-prism-stalker-v2','r380/mobs/dys-prism-stalker-v2-walk-d1.webp',256,320],['siege-gunner','dys-siege-gunner-v2','r380/mobs/dys-siege-gunner-v2-walk-d1.webp',256,320]];
// ① 피격
{const SRC=rd('client-source/mob-hit-r1156.js');
 function world(){const store={},ivs=[];const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,String,console,time:10,localStorage:{getItem:k=>store[k]??null,setItem:()=>{}},setInterval:f=>{ivs.push(f);return 1;},setTimeout:f=>{f();return 0;}};
  C.readyImage=()=>({image:{naturalWidth:1024}});C.ensureImages=()=>Promise.resolve();
  C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor(e,f){const m=MOBS.find(x=>x[1]===e.mob);return {path:'assets/'+(m?m[2]:'x/other.webp'),assetFrame:{sourceRect:[0,0,m?m[3]:256,m?m[4]:256],pivot:[120,200],visibleHeight:190},r380Mob:e.mob,r208Mob:e.mob,flip:!!e.left};}});
  C.window=C;vm.createContext(C);vm.runInContext(SRC,C);ivs.forEach(f=>f());return {C,ff:e=>C.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,null)};}
 for(const [k,id,live,W,H] of MOBS){const w=world(),e={id:'m',mob:id,hp:5,maxHp:5,hitTimer:0,left:true};w.ff(e);e.hitTimer=.14;const f=w.ff(e);
  ok(f&&f.path==='assets/r1169/dys-'+k+'-hit4.webp'&&f.assetFrame.sourceRect.join()===[0,0,W,H].join()&&f.flip===true&&f.assetFrame.visibleHeight===190,'① '+id+' 피격 0칸·좌우·보이는 키 ('+(f&&f.path)+')');}
 const w=world(),e={id:'m',mob:'u203-e3-mech',hp:5,maxHp:5,hitTimer:0};w.ff(e);e.hitTimer=.14;ok(!/r1169/.test(w.ff(e).path),'③ 다른 몹 피격 표 그대로');}
// ② 사망
{const SRC=rd('client-source/mob-attack-dots-r1065.js');const m=SRC.match(/const SHEETS=(\{.*?\});/s);let S={};try{S=JSON.parse(m[1]);}catch(_){}
 MOBS.forEach(([k,id,live,W,H],i)=>{const did='DY-0'+(i+1),s=S[did];
  ok(s&&s.kind==='death'&&s.path==='assets/r1169/dys-'+k+'-death6.webp'&&s.cells===6&&s.cell[0]===W&&s.cell[1]===H&&s.bases&&s.bases[live],'② '+did+' '+id+' 사망 6칸 표('+W+'×'+H+', 살아 있는 그림 '+live+')');
  ok(s&&s.anchor[1]+8*s.bodyH/s.bases[live].bodyH<=s.cell[1]&&Math.abs(s.anchor[0]-W/2)<W*.25,'② '+did+' 발 자리·발 아래 여백');});
 ok(S['MD-25']&&S['MD-25'].path==='assets/r1165/mobs/md-25-clockwork-collector-death.webp','③ MD-25 그대로');}
// ④
{let J=null;try{J=JSON.parse(rd('runtime-text/assets/r1169/index.json'));}catch(_){}
 ok(!!J&&J.assets.length===18,'④ 출처표 18장');
 for(const a of (J&&J.assets)||[]){const f=path.join(ROOT,'runtime-text',a.file),b=fs.existsSync(f)?fs.readFileSync(f):Buffer.alloc(0);
  ok(b.length>0&&crypto.createHash('sha256').update(b).digest('hex')===a.sha256&&/^[0-9a-f]{64}$/.test(a.sourceSha256)&&rd('runtime-inputs.json').includes(a.file)&&rd('runtime-manifest.json').includes(a.file),'④ '+a.file+' sha·등록');}
 ok(rd('../scripts/verify-r96-public.py').includes("'assets/r1169/'"),'④ verify 접두');ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1169/dys-cpu-check.cjs'),'④ pages.yml');
 for(const n of ['mob-hit-r1156.js','mob-attack-dots-r1065.js'])ok(rd('runtime-text/'+n)===rd('client-source/'+n),'④ runtime-text 사본 '+n);}
console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
