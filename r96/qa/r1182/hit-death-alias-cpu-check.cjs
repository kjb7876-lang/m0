// R1182 실패 먼저: 피격 4칸(R1156 표) 도중에 죽으면 R462 가 마지막으로 그린 '피격 시트 경로'를 죽는 몹 그림으로 넘긴다.
// R1065 사망 표는 살아 있는 원본 경로만 알아서 Dots 사망 6칸 대신 옛 실루엣 소멸로 떨어졌다(Dots CX-0158DY R1169 검수 메모 P2).
// 검사: 피격 시트 경로로 물어도 그 몹의 own(원본) 경로로 사망 시트를 고른다. 사망 시트가 없는 몹·모르는 경로는 그대로 null. 판정·보상 그대로(그림만).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let fails=0,n=0;const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL '+m);}};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
function world(){const store={};const C={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,isFinite,console,setInterval:()=>0,setTimeout:()=>0,time:0,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};C.window=C;vm.createContext(C);
 C.readyImage=()=>({image:{naturalWidth:10}});C.ensureImages=()=>Promise.resolve();
 C.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({frameFor:()=>({path:'x',assetFrame:{sourceRect:[0,0,10,10],pivot:[5,9],visibleHeight:9}})});
 vm.runInContext(rd('client-source/mob-hit-r1156.js'),C);vm.runInContext(rd('client-source/mob-attack-dots-r1065.js'),C);return C;}
const C=world(),A=C.__STORYWORLD_MOB_ATTACK_DOTS_R1065__,H=C.__STORYWORLD_MOB_HIT_R1156__.sheets,S=A.inspect().sheets;
const norm=p=>String(p||'').replace(/^.*?assets\//,'');
const deathByOwn={};for(const [id,s] of Object.entries(S))if(s.kind==='death')for(const b of Object.keys(s.bases))deathByOwn[b]=id;
let pairs=0;
for(const [k,h] of Object.entries(H)){const own=norm(h.own),id=deathByOwn[own];
 const look={path:'assets/'+norm(h.path),name:'x',flip:true,frame:{path:'assets/'+norm(h.path),flip:true,assetFrame:{sourceRect:[h.cell[0],0,h.cell[0],h.cell[1]],pivot:[h.cell[0]/2,h.cell[1]-20],visibleHeight:150}}};
 const ownLook={...look,path:'assets/'+own,frame:{...look.frame,path:'assets/'+own}};
 const d=A.deathFrame(look,.5),d0=A.deathFrame(ownLook,.5);
 if(id){pairs++;ok(d&&d0&&d.path===S[id].path&&d.id===d0.id,'피격 중 사망 '+k+' → '+id+' ('+(d&&d.path)+')');ok(d&&d.frame.flip===true,'좌우 유지 '+k);}
 else ok(d===null,'사망 시트 없는 몹은 그대로 '+k);}
ok(pairs>=17,'피격·사망 둘 다 있는 몹 17종 이상('+pairs+')');
ok(A.deathFrame({path:'assets/r1169/unknown-hit4.webp',name:'x'},.5)===null,'모르는 경로 null');
ok(rd('runtime-text/mob-attack-dots-r1065.js')===rd('client-source/mob-attack-dots-r1065.js'),'runtime-text 사본');
ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1182/hit-death-alias-cpu-check.cjs'),'pages.yml');
console.log(fails?'FAILED '+fails+'/'+n:'ALL PASS '+n);process.exit(fails?1:0);
