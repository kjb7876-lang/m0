// R1184 실패 먼저: S-06 외계 침공군(m077, R248 직접 그리기) 피격 4칸·사망 6칸(Dots CX-0162IV) + 악몽 정찰체 MD-31 사망 6칸(Dots CX-0115MD).
// 사용자 2026-11-18 22:06Z "부족한거 닷츠랑계속협업". 그림만, 판정·경직·보상 그대로.
// 검사: ① R1156 r248() 가 맞은 순간 4칸을 차례로 주고(공격·죽음·다른 몹은 null) ② R248 이 그 칸으로 그린다 ③ 사망 표 IV-01(경로·이름)·MD-31 ④ 피격 중 처치(피격 시트 경로)도 IV-01 ⑤ 자산·빌드 연결
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return '';}};
function world(){const store={},ivs=[];const C={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,console,time:10,localStorage:{getItem:k=>store[k]??null,setItem:()=>{}},setInterval:f=>{ivs.push(f);return 1;},setTimeout:f=>{f();return 0;}};
 C.readyImage=p=>({image:{naturalWidth:1024,src:p}});C.ensureImages=()=>Promise.resolve();
 C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>({path:'x',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,9],visibleHeight:9}})});C.window=C;vm.createContext(C);
 vm.runInContext(rd('client-source/mob-hit-r1156.js'),C);vm.runInContext(rd('client-source/mob-attack-dots-r1065.js'),C);return C;}
const P='assets/r1179/mobs/m077.webp';
{const C=world(),H=C.__STORYWORLD_MOB_HIT_R1156__;ok(typeof H.r248==='function','① r248 API');
 const e={id:'iv',name:'외계 침공군',hp:5,maxHp:5,hitTimer:0};ok(H.r248&&H.r248(e,P)===null,'① 평소 null');
 e.hitTimer=.3;const seen=[];for(const t of [10,10.05,10.12,10.25,10.35,10.5]){C.time=t;e.hitTimer=Math.max(0,.3-(t-10));const A=H.r248&&H.r248(e,P);seen.push(A?A.cell:-1);
  if(A)ok(A.img&&/r1184\/iv-m077-hit4/.test(A.img.src)&&A.w===256&&A.h===320&&A.dx===-128&&A.dy===-300&&A.r===1,'① 칸 모양 t='+t);}
 ok(seen.join()==='0,0,1,2,3,-1','① 4칸 차례(70·110·100·100ms) '+seen.join());
 const e2={id:'b',name:'x',hp:5,hitTimer:.3};ok(H.r248&&H.r248(e2,'assets/r248/mobs/m001.webp')===null,'① 다른 몹 null');
 const e3={id:'c',hp:5,hitTimer:.3,attack:{elapsed:.1}};ok(H.r248&&H.r248(e3,P)===null,'① 공격 중 null');const e4={id:'d',hp:0,hitTimer:.3};ok(H.r248&&H.r248(e4,P)===null,'① 죽음 null');}
{const s=rd('client-source/mob-unique-r248.js');ok(/__STORYWORLD_MOB_HIT_R1156__\?\.r248\?\.\(e,s\.path\)/.test(s),'② R248 이 피격 칸을 묻는다');
 const i=s.indexOf('aimR248?.(e,s.path)'),j=s.indexOf('r248?.(e,s.path)'),k=s.indexOf('if(fr<0)fr=T()<m.moving');ok(i>0&&j>i&&k>j,'② 조준 다음·걷기 칸 앞');}
{const C=world(),A=C.__STORYWORLD_MOB_ATTACK_DOTS_R1065__,S=A.inspect().sheets;
 for(const [id,p,live,W] of [['IV-01','assets/r1184/iv-m077-death6.webp','r1179/mobs/m077.webp',256],['MD-31','assets/r1184/md-31-timeless-silver-scout-death6.webp','r380/mobs/hando-timeless-silver-scout-walk-d1.webp',320]]){const s=S[id];
  ok(s&&s.kind==='death'&&s.path===p&&s.cells===6&&s.cell[0]===W&&s.bases[live],'③ '+id+' 사망 6칸 표');ok(s&&s.anchor[1]+8*s.bodyH/s.bases[live].bodyH<=s.cell[1],'③ '+id+' 발 아래 여백');
  const d=A.deathFrame({path:'assets/'+live,name:'x',frame:{assetFrame:{sourceRect:[0,0,W,320],pivot:[128,300],visibleHeight:200}}},.5);ok(d&&d.path===p,'③ '+id+' 경로로 고름');}
 ok(/iv-m077-death6/.test(A.deathFrame({path:'assets/r248/mobs/m077.webp',name:'외계 침공군 3'},.5)?.path||''),'③ IV-01 이름으로도(R248 직접 그리기)');
 ok(/iv-m077-death6/.test(A.deathFrame({path:'assets/r1184/iv-m077-hit4.webp',name:'x',frame:{assetFrame:{sourceRect:[256,0,256,320],pivot:[128,300],visibleHeight:200}}},.5)?.path||''),'④ 피격 시트 경로로 죽어도 IV-01');
 ok(S['MD-30']&&S['MD-34']&&S['DY-09']&&S['MM-08'],'③ 기존 사망 표 그대로');}
{let J=null;try{J=JSON.parse(rd('runtime-text/assets/r1184/index.json'));}catch(_){}ok(J&&J.assets.length===3,'⑤ 출처표 3장');
 for(const a of (J&&J.assets)||[]){const f=path.join(ROOT,'runtime-text',a.file),b=fs.existsSync(f)?fs.readFileSync(f):Buffer.alloc(0);
  ok(b.length>0&&crypto.createHash('sha256').update(b).digest('hex')===a.sha256&&rd('runtime-inputs.json').includes(a.file)&&rd('runtime-manifest.json').includes(a.file),'⑤ '+a.file+' sha·등록');}
 ok(rd('../scripts/verify-r96-public.py').includes("'assets/r1184/'"),'⑤ verify 접두');ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1184/iv-md31-cpu-check.cjs'),'⑤ pages.yml');
 for(const f of ['mob-hit-r1156.js','mob-attack-dots-r1065.js','mob-unique-r248.js'])ok(rd('runtime-text/'+f)===rd('client-source/'+f),'⑤ runtime-text 사본 '+f);}
console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);
