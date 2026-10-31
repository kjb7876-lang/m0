// R159 CPU check: 코드 검토(code-review 스킬) 지적 반영 — 없는 방향 동작 대체본을 묻지 않음(404), 자동 플레이 점검 도구 연결.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['visual-r119.js','visual-r92.js','perf-r150.js','perf-r154.js','death-r151.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const v=C('visual-r119.js');
const sb={window:{StoryPhase1:{ThreeRenderer:{prototype:{updateGlows(){}}}}},localStorage:{getItem(){return null;},setItem(){}},imageCache:new Map(),readyImage:()=>null,urlFor:p=>p,cleanPath:p=>p,Image:function(){},Map,Math,JSON,String,Object};
vm.createContext(sb);vm.runInContext(v,sb);const api=sb.window.__STORYWORLD_VISUAL_R119__;
const exists=p=>p&&fs.existsSync(path.join(R,'runtime-text',p));
for(const h of ['lauren','seoha','neon','hunter','slayer'])ok(`${h}: directional skill art is not requested (no such replacement), directional attack still is`,api.swap128(`assets/heroes/normalized/actions-directional/${h}-skill-left.webp`)===null&&exists(api.swap128(`assets/heroes/normalized/actions-directional/${h}-attack-left.webp`)),[api.swap128(`assets/heroes/normalized/actions-directional/${h}-skill-left.webp`),api.swap128(`assets/heroes/normalized/actions-directional/${h}-attack-left.webp`)]);
ok('gunner (R128) has no directional replacements',api.swap128('assets/heroes/normalized/actions-directional/gunner-attack-left.webp')===null);
ok('R92 item lookup uses a Map rebuilt only when the item list changes',/byIdItems!==index\.items/.test(C('visual-r92.js')));
ok('autoplay smoke tool (webapp-testing pattern) is in the repo',fs.existsSync(path.join(__dirname,'autoplay-smoke.mjs')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
