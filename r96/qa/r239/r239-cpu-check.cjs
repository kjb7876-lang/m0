// R239 CPU check: ep1a08 병원 — 보스 격파 뒤(exit·exitStory·done) 길잡이 목표를 주사실 문(door-2) 옆 빈자리로 준다.
// 777 실플레이에서 길잡이가 보스방 피 제단(room.objective 15,13)에 서서 14분 멈췄다(E 는 door-2 3.2칸 안에서만 받음).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('hospital-maze-progression.js');
ok('runtime copy matches; CI step present',RT('hospital-maze-progression.js')===src&&/qa\/r239\/r239-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const i=src.indexOf('let exitGoalCache'),j=src.indexOf('(function armExitGoal');
ok('exit goal block exists and wraps OBJECTIVES_R75.goal',i>0&&j>i&&/__r239:true,goal\(/.test(src));
// exitGoal 을 떼어 내 가짜 환경에서 돌려 본다
const body=src.slice(i,j);
function run(phase,blockedFn,pathOk=true){const sb={Math,player:{x:15.8,y:13.8},room:{id:'ep1a08'},time:10,blocked:blockedFn||((x,y)=>x<4||y<4),findPath:(a,b)=>pathOk?[a,b]:[],
 hospital:()=>true,state:()=>({phase}),door:id=>id==='door-2'?{x:5,y:6}:null};vm.createContext(sb);vm.runInContext(body+';this.g=exitGoal();',sb);return sb.g;}
const g=run('exit');
ok('in exit phase the goal is a free spot within 2.4 of the injection-room door (5,6), not the altar (15,13)',g&&g.id==='hospital-exit-r239'&&Math.hypot(g.point.x-5,g.point.y-6)<=2.31&&g.point.x>=4&&g.point.y>=4&&/주사실 문/.test(g.label),g);
ok('done phase also targets the door (travel happens there)',run('done')?.id==='hospital-exit-r239');
ok('route/rally/boss phases leave the original goal alone',['route','rally','door','boss'].every(ph=>run(ph)===null));
ok('no reachable spot → no override (falls back to the original goal)',run('exit',null,false)===null);
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R239 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
