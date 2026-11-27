// R1373 CPU 검사: 윤서하 '평행세계 소집'(R949 → R1025 summonList → R1295 고르기)에서 환도·기억사수·미카엘라가 다른 영웅보다 자주 나옴.
//  사용자 2026-11-27 "환도·기억사수·미카엘라가 더 자주". 소환 수·서사 문·레벨 문턱은 그대로여야 한다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..');const F='seoha-summon-mix-r1295.js';const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
let fail=0,n=0;const check=(name,c)=>{n++;if(c)console.log('ok  ',name);else{fail++;console.log('FAIL',name);}};
check('① 원본 = runtime-text 사본',src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8'));
const ALL=['dreamRest','restEp1b','u201','restU2','kair01','hando01'];
// 결정적 난수(같은 결과가 매번 나오게)
function lcg(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function world({level=15,open=ALL,mix=true,seed=7}={}){
 const store={};if(!mix)store['storyworld.r1295.summonMix']='{"on":false}';
 const sb={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},document:{readyState:'complete'},Math,JSON,Number,String,Set,Map,WeakMap,Object,Array,Error,Proxy};sb.window=sb;vm.createContext(sb);
 vm.runInContext('var player={hero:"seoha",level:'+level+'};var visited=new Set('+JSON.stringify(open.map(z=>'STORY:'+z))+');var progress={};',sb);
 vm.runInContext(fs.readFileSync(path.join(R,'client-source','passive-unlock-r1025.js'),'utf8'),sb,{filename:'r1025'});
 const procs={v:0};sb.window.__STORYWORLD_SEOHA_EPOCH_R949__={has:()=>false,inspect:()=>({stats:{procs:{heroes:procs.v}}})};
 vm.runInContext(src,sb,{filename:F});sb.window.__STORYWORLD_SEOHA_SUMMON_MIX_R1295__.test.rng(lcg(seed));return {sb,procs};}
const FAV=['hwando','gunner','michaela'],REST=['hunter','slayer','lauren','neon'];
// ② 모든 서사 연 뒤 소환 1명(문턱 레벨) — 2800번
{const {sb,procs}=world();const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;const seen={};let bad=0;const N=2800;
 for(let i=0;i<N;i++){const l=U.summonList('seoha',['seoha']);if(l.length!==1)bad++;for(const h of l)seen[h]=(seen[h]||0)+1;procs.v++;}
 check('② 소환 수 그대로(1명) '+N+'번 모두',bad===0);
 const favMin=Math.min(...FAV.map(h=>seen[h]||0)),restMax=Math.max(...REST.map(h=>seen[h]||0));
 check('③ 환도·기억사수·미카엘라 각각이 다른 어느 영웅보다 2배 넘게 자주 '+JSON.stringify(seen),favMin>2*restMax);
 check('④ 다른 영웅도 나옴(각 ≥3%)',REST.every(h=>(seen[h]||0)>=N*.03));
 check('⑤ 서하는 안 나옴',!seen.seoha);}
// ⑥ 서사 문: 환도 서사(restU2) 안 열면 환도는 비중이 커도 안 나옴
{const {sb,procs}=world({open:ALL.filter(z=>z!=='restU2')});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;const seen={};
 for(let i=0;i<1400;i++){for(const h of U.summonList('seoha',['seoha']))seen[h]=(seen[h]||0)+1;procs.v++;}
 check('⑥ 서사 안 연 환도는 안 나옴 '+JSON.stringify(seen),!seen.hwando&&(seen.gunner||0)>0&&(seen.michaela||0)>0);}
// ⑦ 소환 수 3명(문턱+20레벨): 겹치지 않고, 세 영웅이 함께 나오는 비율이 높음
{const {sb,procs}=world({level:35});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;let bad=0,favs=0;const N=1400;
 for(let i=0;i<N;i++){const l=U.summonList('seoha',['seoha']);if(l.length!==3||new Set(l).size!==3)bad++;favs+=l.filter(h=>FAV.includes(h)).length;procs.v++;}
 check('⑦ 3명·겹침 없음',bad===0);check('⑦ 세 자리 중 환도·기억사수·미카엘라 평균 ≥1.9명 ('+(favs/N).toFixed(2)+')',favs/N>=1.9);}
// ⑧ 조종 영웅은 빠짐(환도로 조종 중이면 환도 안 나옴)
{const {sb,procs}=world();const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;let hw=0;for(let i=0;i<700;i++){if(U.summonList('seoha',['seoha','hwando']).includes('hwando'))hw++;procs.v++;}check('⑧ exclude 지킴',hw===0);}
// ⑨ 끄면 원래(서사 순 첫 1명)
{const {sb}=world({mix:false});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;check('⑨ 끄면 원래 서사 순',JSON.stringify(U.summonList('seoha',['seoha']))==='["hunter"]');}
// ⑩ 비중 표 공개(검사·조정용)
{const {sb}=world();const M=sb.window.__STORYWORLD_SEOHA_SUMMON_MIX_R1295__;const w=M.inspect().weights||{};check('⑩ 비중 표: 세 영웅 > 1 '+JSON.stringify(w),FAV.every(h=>w[h]>1));}
// ⑪ 소환 영웅 스킬: R663 점수 배우기가 R949 소환 몸(r949Summon)을 막지 않음(EGO 소환 r1157Summon 과 같은 길). 실제 시전은 r1373-browser ② 가 본다.
{const g=fs.readFileSync(path.join(R,'client-source','skill-growth-r663.js'),'utf8');check('⑪ R663 locked 가 r949Summon 몸은 레벨 문턱만 묻고 settle 안 함',/if\(p\.r1157Summon\|\|p\.r949Summon\|\|L\.mode\(\)==='survival'\)return false;/.test(g)&&/!p\.r1157Summon&&!p\.r949Summon&&/.test(g)&&g===fs.readFileSync(path.join(R,'runtime-text','skill-growth-r663.js'),'utf8'));}
console.log(fail?`RESULT FAIL ${fail}/${n}`:`RESULT PASS ${n}`);process.exit(fail?1:0);
