// R272 CPU check: 병원 길잡이(중앙 준비실·보스방 문) · 777 앞질러 가기(이전 대신 다음 포탈) 오버레이 연결과 판단.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('guide-r272.js'),idx=RT('index.html');
ok('runtime copy matches; loads after hwando-r271 (after every guideStep wrapper)',RT('guide-r272.js')===src&&idx.indexOf('hwando-r271.js')<idx.indexOf('guide-r272.js')&&idx.indexOf('guide-r272.js')<idx.indexOf('combat-r118.js'));
ok('in verify list, CI and manifest',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'guide-r272.js'")&&fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r272-cpu-check.cjs')&&fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('guide-r272.js'));
// 샌드박스에서 오버레이를 실제로 실행해 판단 함수를 꺼낸다.
let base=0;const sb={window:{},guideStep:()=>{base++;},setTimeout,console};sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);
const G=sb.__STORYWORLD_GUIDE_R272__;
ok('exports decide/forwardRole and wraps guideStep',G&&typeof G.decide==='function'&&typeof G.forwardRole==='function'&&sb.guideStep.toString().includes('base.apply'));
const ctx={guide:true,modal:false,loading:false,hp:100,enemyNear:false,px:31.5,py:49.5,merge:{x:20,y:30,radius:3}};
ok('route phase with no enemy near → walk to merge (stall at 31.5,49.5 repro)',G.decide('route',ctx)==='merge');
ok('route phase: fighting enemy near → leave to native guide',G.decide('route',{...ctx,enemyNear:true})===null);
ok('route phase inside merge → nothing (rally fires natively)',G.decide('route',{...ctx,px:20.5,py:30.5})===null);
ok('guide off / modal / dead → nothing',[{guide:false},{modal:true},{hp:0},{loading:true}].every(o=>G.decide('route',{...ctx,...o})===null));
ok('door phase → door; other phases untouched',G.decide('door',ctx)==='door'&&['rally','boss','exit','done','doorStory'].every(p=>G.decide(p,ctx)===null));
const f={cheat:true,completed:true,pendingIdx:1,zoneIdx:13,nextOpen:true};
ok('777 + cleared + earlier pending + next open → forward (dreamRest repro)',G.forwardRole(f)===true);
ok('no forward without 777, uncleared map, pending ahead, or closed next portal',[{cheat:false},{completed:false},{pendingIdx:20},{nextOpen:false},{pendingIdx:-1}].every(o=>G.forwardRole({...f,...o})===false));
ok('no balance/progression writes (route/door/hp/difficulty untouched)',!/\.hp\s*=[^=]|difficultyR63\s*=|setMapMode|\.phase\s*=[^=]|progress\[/.test(src));
ok('base guide still runs when R272 has nothing to do',(sb.guideStep(.1),base===1));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R272 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
