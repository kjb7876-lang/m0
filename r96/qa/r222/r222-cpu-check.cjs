// R222 CPU check: 스킬업(P) 창 — 막힌 단추 이유(최대·잠김·부족), 살 수 있는 단추 강조, 설명 접기, 수식 → 지금·다음 수치.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('ui-upgrades-r222.js'),idx=RT('index.html'),pos=f=>idx.indexOf('./'+f);
ok('runtime copy matches; loads right after play-r115.js (the skill book it decorates)',RT('ui-upgrades-r222.js')===src&&pos('ui-upgrades-r222.js')>pos('play-r115.js')&&pos('play-r115.js')>0&&idx.indexOf('<script src="./play-r115.js"></script><script src="./ui-upgrades-r222.js"></script>')>0);
ok('in the public verify list and the CI workflow',/'ui-upgrades-r222\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r222\/r222-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const sb={window:{},localStorage:{getItem:()=>null},document:{readyState:'complete',getElementById:()=>null,head:{appendChild(){}},createElement:()=>({})},MutationObserver:class{observe(){}},Promise,console,Number,Math,JSON,String,player:{points:1}};
vm.createContext(sb);vm.runInContext(src,sb);const U=sb.window.__STORYWORLD_UPGRADES_UI_R222__;
const card=t=>({innerText:t});
ok('maxed card (6 / 6) reads as max, not "next 1 point"',U.reasonOf(card('단단한 자아 6 / 6최대 체력 777 유지. 강화 비용 1점'),1).kind==='max');
const lk=U.reasonOf(card('Z · 월섬 회천 0단계 / 7발동 0% → 7% · 기본 공격 때 이 기술이 확률로 저절로 나갑니다. 사몽 루트를 시작하면 열립니다. 강화 비용 1점 (k단계 k²점)'),1);
ok('locked card shows its unlock condition',lk.kind==='lock'&&/사몽 루트를 시작하면 열립니다/.test(lk.why),lk);
ok('not enough points (cost 4, have 1) reads as short',U.reasonOf(card('끝없는 의지 1 / ∞ 단계마다 위력 +2%. 강화 비용 4점'),4).kind==='short');
ok('attack-interval formula → current and next percent',U.friendly('공격 간격 × [0.28 + 0.72 / (1 + 0.04 × 단계)].',0)==='공격 간격 100% → 다음 97.2%');
ok('cooldown formula at level 3',U.friendly('기술·블링크·EGO·사몽 대기시간 × [0.25 + 0.75 / (1 + 0.035 × 단계)].',3)==='기술·블링크·EGO·사몽 대기시간 92.9% → 다음 90.8%');
ok('damage-reduction formula',U.friendly('추가 피해감소 30 × 단계 / (단계 + 40)%.',0)==='추가 피해감소 0% → 다음 0.7%');
ok('plain descriptions are left alone',U.friendly('단계마다 위력 +1%.',2)===null);
ok('calculator refuses anything but numbers and + - × / ( )',(()=>{try{U.calc('1+alert(1)');return false;}catch(_){return true;}})()&&U.calc('2×(3+1)/4')===2);
ok('no eval / Function in the overlay',!/\beval\s*\(|new\s+Function\s*\(/.test(src));
ok('can be switched off',/storyworld\.r222\.upgradesUi/.test(src)&&/s\.on===false/.test(src));

// 길잡이 멈춤 풀기(guide-unstick-r222.js)
{const g=C('guide-unstick-r222.js');
 ok('unstick: runtime copy matches; loads right after lag-r217.js; in the public verify list',RT('guide-unstick-r222.js')===g&&idx.indexOf('<script src="./lag-r217.js"></script><script src="./guide-unstick-r222.js"></script>')>0&&/'guide-unstick-r222\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 const mk=(walls,doorsOpen)=>{const opened=new Set(doorsOpen||[]);const door={id:'door-1',x:5,y:3,reach:3};const sb={console,Math,JSON,localStorage:{getItem:()=>null,setItem(){}},window:{},time:0,modal:null,loading:false,guide:true,
   player:{x:5,y:5,hp:10},room:{id:'z',exploration:{worldR74:{doors:[door]}}},route:[],used:[],
   blocked:(x,y)=>walls.some(([x0,y0,x1,y1])=>x>=x0&&x<=x1&&y>=y0&&y<=y1),
   interact(){sb.used.push('interact');}};
  sb.window.__STORYWORLD_WORLD_R74__={isOpen:(r,d)=>opened.has(d.id),canUse:()=>true,use:t=>{opened.has(t.id)?opened.delete(t.id):opened.add(t.id);sb.used.push('use:'+t.id);return true;}};
  vm.createContext(sb);vm.runInContext('function tick(dt){time+=dt;}',sb);vm.runInContext(g,sb);return {sb,opened,door};};
 const run=(sb,sec)=>{for(let i=0;i<sec*30;i++)vm.runInContext('tick(1/30)',sb);};
 // 1) 막힌 앞 길점 건너뛰기
 {const {sb}=mk([[3.6,4.6,4.0,5.4]]);sb.route=[{x:3.9,y:5},{x:3.5,y:6},{x:3,y:7}];run(sb,.8);
  ok('unstick: after 0.6s still, leading route points blocked at hero radius are skipped',sb.route.length===2&&sb.route[0].x===3.5,sb.route);}
 // 2) 옆걸음
 {const {sb}=mk([[3.0,4.0,4.6,6.0]]);sb.route=[{x:3,y:5},{x:2,y:5}];run(sb,1.7);const I=sb.window.__STORYWORLD_GUIDE_UNSTICK_R222__.inspect().stats;
  ok('unstick: after 1.5s a sidestep (0.3 cell, perpendicular, unblocked side) is tried',I.sidesteps===1&&Math.abs(sb.player.x-5)<1e-9&&Math.abs(Math.abs(sb.player.y-5)-.3)<1e-9,{I,p:sb.player});}
 // 3) 닫힌 문 열기
 {const {sb,opened}=mk([[0,0,10,4.6]]);sb.route=[];run(sb,3.2);ok('unstick: after 3s a closed door within reach is opened (doors open with E anyway)',opened.has('door-1'),[...opened]);}
 // 4) 길잡이 E 는 열린 문을 닫지 않음
 {const {sb,opened,door}=mk([],['door-1']);vm.runInContext('interact()',sb);ok('unstick: the guide E press never closes an open door (reach restored after)',opened.has('door-1')&&door.reach===3&&sb.used.includes('interact'));}
 // 5) 손으로 할 때는 그대로
 {const {sb}=mk([[3.0,4.0,4.6,6.0]]);sb.guide=false;sb.route=[{x:3,y:5}];run(sb,7);ok('unstick: nothing happens when the guide is off',sb.player.x===5&&sb.player.y===5&&sb.route.length===1);}
 // 6) 가까운 적과 싸우는 중이면 그대로, 필드 전투(engaged)만으로는 막지 않음
 {const {sb}=mk([[3.0,4.0,4.6,6.0]]);sb.room.enemies=[{hp:5,x:6,y:5,spawnState:'active'}];sb.route=[{x:3,y:5}];run(sb,7);ok('unstick: no action while fighting an enemy within 3 cells',sb.player.x===5&&sb.player.y===5);}
 {const {sb}=mk([[3.0,4.0,4.6,6.0]]);sb.room.engaged=true;sb.room.enemies=[{hp:5,x:15,y:25,spawnState:'active'}];sb.route=[{x:3,y:5},{x:2,y:5}];run(sb,1.7);ok('unstick: still works during a field encounter (room.engaged) when no enemy is near',sb.window.__STORYWORLD_GUIDE_UNSTICK_R222__.inspect().stats.sidesteps===1);}
 ok('unstick: can be switched off',/storyworld\.r222\.guideUnstick/.test(g));}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
