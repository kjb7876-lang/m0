// R1295b CPU 검사: 서하 '평행세계 소집'이 열린 영웅 중 무작위로 고름(seoha-summon-mix-r1295.js) — 환도도 나옴.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');const F='seoha-summon-mix-r1295.js';const src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
let fail=0,n=0;const check=(name,c)=>{n++;if(c)console.log('ok  ',name);else{fail++;console.log('FAIL',name);}};
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
check('① index.html 한 번, target-hold-r1295 바로 뒤(passive-unlock-r1025 보다 뒤)',html.split('"./'+F+'"').length===2&&/<script src="\.\/target-hold-r1295\.js"><\/script>\n<script src="\.\/seoha-summon-mix-r1295\.js"><\/script>\n/.test(html)&&html.indexOf('passive-unlock-r1025.js')<html.indexOf(F));
check('② 공개 검사 기대 목록',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
check('③ runtime-inputs 등록',fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(F));
// 진짜 R1025 + 가짜 R949 위에서
function world({level=15,open=['dreamRest','restEp1b','u201','restU2','kair01'],procs={v:0},mix=true}={}){
 const store={};if(!mix)store['storyworld.r1295.summonMix']='{"on":false}';
 const sb={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},document:{readyState:'complete'},Math,JSON,Number,String,Set,Map,WeakMap,Object,Array,Error,Proxy};sb.window=sb;vm.createContext(sb);
 vm.runInContext('var player={hero:"seoha",level:'+level+'};var visited=new Set('+JSON.stringify(open.map(z=>'STORY:'+z))+');var progress={};',sb);
 vm.runInContext(fs.readFileSync(path.join(R,'client-source','passive-unlock-r1025.js'),'utf8'),sb,{filename:'r1025'});
 sb.window.__STORYWORLD_SEOHA_EPOCH_R949__={has:()=>false,inspect:()=>({stats:{procs:{heroes:procs.v}}})};
 vm.runInContext(src,sb,{filename:F});return sb;}
{const sb=world();const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__,M=sb.window.__STORYWORLD_SEOHA_SUMMON_MIX_R1295__;
 check('④ R1025 API 를 감쌈(다른 키 그대로)',M.inspect().installed&&typeof U.r1295Base?.summonList==='function'&&U.summonOpen===U.r1295Base.summonOpen&&U.storyOrder===U.r1295Base.storyOrder);
 check('⑤ 끄기 전 원래 목록 = 서사 순 첫 1명(헌터)',JSON.stringify(U.r1295Base.summonList('seoha',['seoha']))==='["hunter"]');}
{const procs={v:0};const sb=world({procs});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;const seen={};let bad=0;
 for(let i=0;i<700;i++){const l=U.summonList('seoha',['seoha','seoha']);if(l.length!==1)bad++;for(const h of l)seen[h]=(seen[h]||0)+1;procs.v++;}
 check('⑥ 소환 수 그대로(1명) 700번 모두',bad===0);
 check('⑦ 환도가 나옴 ('+(seen.hwando||0)+'/700)',(seen.hwando||0)>=70);
 // R1373(사용자 2026-11-27 비중 변경): 고루 → 열린 5명 모두 나옴(각 ≥4%). 비중 자체는 r1373 검사가 본다.
 check('⑧ 열린 5명 모두 나옴(각 ≥4%) '+JSON.stringify(seen),['hunter','slayer','michaela','gunner','hwando'].every(h=>(seen[h]||0)>=28));
 check('⑨ 서사 안 연 네온·라우렌·서하는 안 나옴',!seen.neon&&!seen.lauren&&!seen.seoha);}
{const procs={v:0};const sb=world({procs});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;const a=U.summonList('seoha',['seoha']);let same=true;for(let i=0;i<50;i++)if(JSON.stringify(U.summonList('seoha',['seoha']))!==JSON.stringify(a))same=false;
 check('⑩ 소집 전까지 같은 묶음(미리 받은 그림 = 부를 영웅)',same);}
{const sb=world({level:200});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;const l=U.summonList('seoha',['seoha','hwando']);check('⑪ 소환 수 ≥ 열린 수면 원래 목록, 제외(조종 영웅 환도) 지킴 '+JSON.stringify(l),!l.includes('hwando')&&!l.includes('seoha')&&l.length===4);}
{const sb=world({open:[]});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;check('⑫ 서사 하나도 안 열면 빈 목록',U.summonList('seoha',['seoha']).length===0);}
{const sb=world({mix:false});const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;let all=true;for(let i=0;i<30;i++)if(JSON.stringify(U.summonList('seoha',['seoha']))!=='["hunter"]')all=false;check('⑬ 끄면 원래(서사 순)',all);}
{const sb=world();const U=sb.window.__STORYWORLD_PASSIVE_UNLOCK_R1025__;check('⑭ 서하 아닌 호출은 원래 그대로',JSON.stringify(U.summonList('hunter',['hunter']))===JSON.stringify(U.r1295Base.summonList('hunter',['hunter'])));}
console.log(fail?`RESULT FAIL ${fail}/${n}`:`RESULT PASS ${n}`);process.exit(fail?1:0);
