// R1156b 실패 먼저: 몹 피격 4칸 Dots CX-0136 A4 r2(HOLD 손질) 적용 — 사용자 2026-11-18 08:41Z "hold 보류자산도 앵간하면 너가 코드나 스킬로 개선해서 적용해".
// 대상: 최종문 공명기사(u203-e3-mech)·이동문 공허잔영(u203-e2-mech)·늪 뿌리 추적자(swamp-root-stalker-darkgreen-v2). 그림만, 판정·경직 시간 그대로.
// 검사: ① 맞은 순간 피격 시트 0칸(피벗·보이는 키·좌우 그대로) ② 70·110·100·100ms 로 4칸 → 끝나면 원래 그림 ③ 공격 중·죽음·다른 몹·그림 못 읽음 → 원래 그림
//  ④ 다른 frameFor 덧씌우기가 나중에 감싸도 바깥으로 다시 감쌈 ⑤ 끄기 ⑥ 자산·빌드 연결
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),N='mob-hit-r1156.js',FILE=path.join(ROOT,'client-source',N);
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const SRC=fs.existsSync(FILE)?fs.readFileSync(FILE,'utf8'):'';
const BASES={'u203-e3-mech':{path:'assets/r374/mobs/u203-e3-mech.webp',cell:[256,256],pivot:[128,235],vh:203},'u203-e2-mech':{path:'assets/r374/mobs/u203-e2-mech.webp',cell:[256,256],pivot:[128,235],vh:198},
 'swamp-root-stalker-darkgreen-v2':{path:'assets/r380/mobs/swamp-root-stalker-darkgreen-v2-walk-d1.webp',cell:[373,320],pivot:[203.36,271.01],vh:223.55},'other':{path:'assets/x/other.webp',cell:[256,256],pivot:[128,235],vh:150}};
function world(o={}){const store={...(o.store||{})},ivs=[],asked=[];
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,String,console,time:10,asked,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:f=>{ivs.push(f);return ivs.length;},setTimeout:f=>{f();return 0;}};
 C.readyImage=p=>o.notReady&&o.notReady.test(p)?null:{image:{naturalWidth:1024}};C.ensureImages=a=>{asked.push(...a);return Promise.resolve();};
 C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor(e,f){const b=BASES[e.mob];if(!b)return f;return {path:b.path,assetFrame:{sourceRect:[b.cell[0]*(e.k||0),0,b.cell[0],b.cell[1]],pivot:[...b.pivot],visibleHeight:b.vh},r208Mob:e.mob,flip:!!e.left};}});
 C.window=C;vm.createContext(C);if(SRC)vm.runInContext(SRC,C,{filename:N});const tickIv=()=>ivs.forEach(f=>f());tickIv();
 return {C,tickIv,ff:(e)=>C.__STORYWORLD_STORY_COMBAT_R54__.frameFor(e,{path:'fallback'}),api:()=>C.__STORYWORLD_MOB_HIT_R1156__};}
const mob=(id,extra={})=>({id:'m1',mob:id,hp:50,maxHp:50,hitTimer:0,...extra});
if(!SRC){ok(false,'모듈 파일 없음: client-source/'+N);}
else{
// ① ②
for(const id of ['u203-e3-mech','u203-e2-mech','swamp-root-stalker-darkgreen-v2']){const w=world(),e=mob(id,{left:true});w.ff(e);e.hitTimer=.14;const f=w.ff(e),B=BASES[id];
 ok(f&&f.path==='assets/r1156/mob-hit/'+({'u203-e3-mech':'u203-e3','u203-e2-mech':'u203-e2','swamp-root-stalker-darkgreen-v2':'swamp-root'})[id]+'-hit4.webp'&&f.assetFrame.sourceRect.join()===[0,0,...B.cell].join(),'① '+id+' 맞은 순간 피격 시트 0칸 ('+(f&&f.path)+' '+(f&&f.assetFrame.sourceRect)+')');
 ok(f&&f.assetFrame.pivot.join()===B.pivot.join()&&f.assetFrame.visibleHeight===B.vh&&f.flip===true&&f.r208Mob===id,'① 피벗·보이는 키·좌우(왼쪽 보기)·몹 id 그대로');
 const seq=[];for(let i=0;i<14;i++){w.C.time+=.03;e.hitTimer=Math.max(0,e.hitTimer-.03);const g=w.ff(e);seq.push(/r1156/.test(g.path)?g.assetFrame.sourceRect[0]/B.cell[0]:'b');}
 const MS=[70,110,100,100],exp=[];for(let i=1;i<=14;i++){let el=i*30,k=0;while(k<4&&el>=MS[k]){el-=MS[k];k++;}exp.push(k<4?k:'b');}
 ok(seq.join()===exp.join(),'② 70·110·100·100ms 4칸 차례 뒤 원래 그림 ('+seq.join()+' / 기대 '+exp.join()+')');}
// ③
{const w=world(),e=mob('u203-e3-mech',{attack:{elapsed:.1}});w.ff(e);e.hitTimer=.14;ok(!/r1156/.test(w.ff(e).path),'③ 공격 중엔 원래 그림');
 const d=mob('u203-e3-mech');w.ff(d);d.hitTimer=.14;d.hp=0;ok(!/r1156/.test(w.ff(d).path),'③ 죽으면 원래 그림');
 const x=mob('other');w.ff(x);x.hitTimer=.14;ok(w.ff(x).path==='assets/x/other.webp','③ 다른 몹은 그대로');
 const w2=world({notReady:/r1156/}),n=mob('u203-e2-mech');w2.ff(n);n.hitTimer=.14;ok(!/r1156/.test(w2.ff(n).path)&&w2.C.asked.some(p=>/r1156/.test(p)),'③ 피격 시트를 못 읽었으면 원래 그림 + 읽기 요청');
 const s=mob('u203-e3-mech');w.ff(s);s.hitTimer=.14;w.ff(s);w.C.time+=.1;s.hitTimer=.14;const g=w.ff(s);ok(/r1156/.test(g.path)&&g.assetFrame.sourceRect[0]===256,'③ 0.25초 안 연타는 처음부터 다시 안 함');}
// ④ 나중 덧씌우기(R1065 처럼 안쪽을 부름)가 감싸면 그 안에 남고 다시 감싸지 않음(핑퐁 없음), 안쪽을 안 부르는 덧씌우기에 밀리면 다시 감쌈, 두 번 거쳐도 한 번만 바꿈
{const w=world();const prev=w.C.__STORYWORLD_STORY_COMBAT_R54__;let calls=0;const outer=Object.freeze({...prev,frameFor(e,f){calls++;return prev.frameFor(e,f);}});w.C.__STORYWORLD_STORY_COMBAT_R54__=outer;
 for(let i=0;i<5;i++)w.tickIv();const e=mob('u203-e3-mech',{left:true});w.ff(e);e.hitTimer=.14;const f=w.ff(e);
 ok(w.C.__STORYWORLD_STORY_COMBAT_R54__===outer&&/r1156/.test(f.path)&&w.api().inspect().stats.rewraps===1,'④ 안쪽을 부르는 덧씌우기 안에 남음, 다시 감싸지 않음 (rewraps '+w.api().inspect().stats.rewraps+')');
 const w2=world();const p2=w2.C.__STORYWORLD_STORY_COMBAT_R54__;w2.C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...p2,frameFor(e,f){return {path:'assets/r374/mobs/u203-e3-mech.webp',assetFrame:{sourceRect:[0,0,256,256],pivot:[128,235],visibleHeight:203},r208Mob:e.mob,flip:false};}});
 w2.tickIv();const e2=mob('u203-e3-mech');w2.ff(e2);e2.hitTimer=.14;ok(/r1156/.test(w2.ff(e2).path)&&w2.api().inspect().stats.rewraps===2,'④ 안쪽을 안 부르는 덧씌우기에 밀리면 다시 바깥으로');
 const w4=world();const p4=w4.C.__STORYWORLD_STORY_COMBAT_R54__;const own={path:'assets/r374/mobs/u203-e3-mech.webp',assetFrame:{sourceRect:[0,0,256,256],pivot:[128,235],visibleHeight:203},r374Mob:'u203-e3-mech',flip:false};
 w4.C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...p4,__r374:true,frameFor(e,f){return e&&e.mob==='u203-e3-mech'?{...own}:p4.frameFor(e,f);}});/* R374·R380 처럼 자기 몹만 안쪽을 안 부르고 나머지는 부름(실제 브라우저에서 일어난 순서) */
 w4.tickIv();const e4=mob('u203-e3-mech');w4.ff(e4);e4.hitTimer=.14;const h4=w4.ff(e4);for(let i=0;i<5;i++)w4.tickIv();
 ok(/r1156/.test(h4.path)&&w4.api().inspect().stats.rewraps===2,'④ 자기 몹만 가로채는 덧씌우기(__r374)가 나중에 감싸도 다시 바깥으로, 한 번만 (rewraps '+w4.api().inspect().stats.rewraps+')');
 const w3=world();const p3=w3.C.__STORYWORLD_STORY_COMBAT_R54__;w3.C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...p3,frameFor(e,f){return p3.frameFor(e,p3.frameFor(e,f));}});const e3=mob('u203-e3-mech',{left:true});w3.ff(e3);e3.hitTimer=.14;const g=w3.ff(e3);
 ok(/r1156/.test(g.path)&&g.flip===true,'④ 같은 프레임이 두 번 거쳐도 좌우가 뒤집히지 않음');}
// ⑤
{const w=world({store:{'storyworld.r1156.mobHit':'{"on":false}'}}),e=mob('u203-e3-mech');w.ff(e);e.hitTimer=.14;ok(!/r1156/.test(w.ff(e).path),'⑤ 끄기 설정 → 원래 그림');}
}
// ⑥
{const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};const html=rd('runtime-text/index.html');
 ok(SRC.length>0&&rd('runtime-text/'+N)===SRC,'⑥ runtime-text 사본 = client-source');
 const t=x=>html.indexOf('<script src="./'+x+'"></script>');ok(t(N)>0&&t(N)<t('combat-r118.js'),'⑥ 스크립트 태그');
 ok(rd('../scripts/verify-r96-public.py').includes("'"+N+"'"),'⑥ verify-r96-public.py 기대 목록');ok(rd('runtime-manifest.json').includes(N)&&rd('runtime-inputs.json').includes(N),'⑥ manifest·inputs');
 ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1156/mob-hit-cpu-check.cjs'),'⑥ pages.yml CPU 검사 줄');
 for(const [n,w,h] of [['u203-e3',1024,256],['u203-e2',1024,256],['swamp-root',1492,320]]){const p='assets/r1156/mob-hit/'+n+'-hit4.webp',f=path.join(ROOT,'runtime-text',p),b=fs.existsSync(f)?fs.readFileSync(f):Buffer.alloc(0);let W=0,H=0;
  if(b.length>30&&b.toString('ascii',12,16)==='VP8X'){W=1+b.readUIntLE(24,3);H=1+b.readUIntLE(27,3);}
  ok(W===w&&H===h&&rd('runtime-inputs.json').includes(p),'⑥ 자산 '+p+' '+W+'×'+H+' 등록');}
 let J=null;try{J=JSON.parse(rd('runtime-text/assets/r1156/index.json'));}catch(_){}ok(!!J&&J.assets.filter(a=>/mob-hit/.test(a.file)&&/^[0-9a-f]{64}$/.test(a.sourceSha256)).length===3,'⑥ 출처 표 3장');}
console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
