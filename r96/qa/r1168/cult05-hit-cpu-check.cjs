// R1168 실패 먼저: cult05 '설원 아래의 기계 다리'(r380 cult-mech-legs-walk-d1) 피격 4칸 — Dots CX-0136 A4 cult05 hit4 r2 DIAGNOSTIC_HOLD 손질 적용.
// 사용자 2026-11-18 08:41Z "hold 보류자산도 앵간하면 너가 코드나 스킬로 개선해서 적용해". 그림만, 판정·경직 시간 그대로. 기존 R1156 세 몹은 그대로.
// 검사: ① 맞은 순간 피격 시트 0칸(피벗·보이는 키·좌우 그대로) ② 70·110·100·100ms 4칸 뒤 원래 그림 ③ 공격 중·죽음 → 원래 그림 ④ R1156 세 몹 경로 그대로 ⑤ 자산·출처표·빌드 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),N='mob-hit-r1156.js',FILE=path.join(ROOT,'client-source',N);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.existsSync(FILE)?fs.readFileSync(FILE,'utf8'):'';
const ID='cult-mech-legs-walk-d1',OWN='assets/r380/mobs/cult-mech-legs-walk-d1.webp',HIT='assets/r1168/mob-hit/cult05-hit4.webp';
const B={path:OWN,cell:[320,320],pivot:[159.23,319.23],vh:218.18};
function world(){const store={},ivs=[],asked=[];
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,String,console,time:10,asked,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:f=>{ivs.push(f);return ivs.length;},setTimeout:f=>{f();return 0;}};
 C.readyImage=()=>({image:{naturalWidth:1280}});C.ensureImages=a=>{asked.push(...a);return Promise.resolve();};
 C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor(e,f){if(e.mob!==ID)return {path:'assets/r374/mobs/'+e.mob+'.webp',assetFrame:{sourceRect:[0,0,256,256],pivot:[128,235],visibleHeight:200},r208Mob:e.mob,flip:false};
  return {path:B.path,assetFrame:{sourceRect:[320*(e.k||0),0,320,320],pivot:[...B.pivot],visibleHeight:B.vh},r380Mob:ID,r208Mob:ID,flip:!!e.left};}});
 C.window=C;vm.createContext(C);if(SRC)vm.runInContext(SRC,C,{filename:N});ivs.forEach(f=>f());
 return {C,ff:e=>C.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,{path:'fallback'})};}
const mob=(id,x={})=>({id:'m1',mob:id,hp:50,maxHp:50,hitTimer:0,...x});
if(!SRC)ok(false,'모듈 없음');else{
 for(const left of [false,true]){const w=world(),e=mob(ID,{left});w.ff(e);e.hitTimer=.14;const f=w.ff(e);
  ok(f&&f.path===HIT&&f.assetFrame.sourceRect.join()==='0,0,320,320','① 맞은 순간 cult05 피격 0칸 ('+(f&&f.path)+')');
  ok(f&&f.assetFrame.pivot.join()===B.pivot.join()&&f.assetFrame.visibleHeight===B.vh&&f.flip===left&&f.r380Mob===ID,'① 피벗·보이는 키·좌우('+(left?'왼':'오른')+'쪽) 그대로');
  if(!left){const seq=[];for(let i=0;i<14;i++){w.C.time+=.03;e.hitTimer=Math.max(0,e.hitTimer-.03);const g=w.ff(e);seq.push(g.path===HIT?g.assetFrame.sourceRect[0]/320:'b');}
   const MS=[70,110,100,100],exp=[];for(let i=1;i<=14;i++){let el=i*30,k=0;while(k<4&&el>=MS[k]){el-=MS[k];k++;}exp.push(k<4?k:'b');}
   ok(seq.join()===exp.join(),'② 4칸 차례 뒤 원래 그림 ('+seq.join()+')');}}
 {const w=world(),a=mob(ID,{attack:{elapsed:.1}});w.ff(a);a.hitTimer=.14;ok(w.ff(a).path===OWN,'③ 공격 중엔 원래 그림');
  const d=mob(ID);w.ff(d);d.hitTimer=.14;d.hp=0;ok(w.ff(d).path===OWN,'③ 죽으면 원래 그림');}
 for(const [id,n] of [['u203-e3-mech','u203-e3'],['u203-e2-mech','u203-e2']]){const w=world(),e=mob(id);w.ff(e);e.hitTimer=.14;ok(w.ff(e).path==='assets/r1156/mob-hit/'+n+'-hit4.webp','④ R1156 '+id+' 그대로');}
}
{const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};
 const f=path.join(ROOT,'runtime-text',HIT),b=fs.existsSync(f)?fs.readFileSync(f):Buffer.alloc(0);let W=0,H=0;
 if(b.length>30&&b.toString('ascii',12,16)==='VP8X'){W=1+b.readUIntLE(24,3);H=1+b.readUIntLE(27,3);}
 ok(W===1280&&H===320,'⑤ 자산 '+HIT+' '+W+'×'+H);
 let J=null;try{J=JSON.parse(rd('runtime-text/assets/r1168/index.json'));}catch(_){}const r=J&&J.assets&&J.assets[0];
 const sha=b.length?require('crypto').createHash('sha256').update(b).digest('hex'):'';
 ok(!!r&&r.file===HIT&&r.sha256===sha&&/^[0-9a-f]{64}$/.test(r.sourceSha256)&&r.gameSha256==='0f4bf7b3396f5c32f6bcfae117456ea9379481896fc9eba9eeb66a0cb30d369f','⑤ 출처표(원본·게임 sha·파생 sha 일치)');
 ok(!!r&&Math.abs(r.srcBodyH*r.perFrame[0].scale-r.gameBodyH)<=3&&r.perFrame.length===4,'⑤ 몸 키 게임에 맞춤 ('+(r&&r.srcBodyH)+'×'+(r&&r.perFrame[0].scale)+' → '+(r&&r.gameBodyH)+')');
 ok(rd('runtime-inputs.json').includes(HIT)&&rd('runtime-manifest.json').includes(HIT),'⑤ manifest·inputs 등록');
 ok(rd('../scripts/verify-r96-public.py').includes("'assets/r1168/'"),'⑤ verify-r96-public.py 접두');
 ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1168/cult05-hit-cpu-check.cjs'),'⑤ pages.yml CPU 검사 줄');
 ok(rd('runtime-text/'+N)===SRC,'⑤ runtime-text 사본 = client-source');}
console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
