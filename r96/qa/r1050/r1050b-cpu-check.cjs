// R1050b CPU check: 영웅이 공격·스킬할 때 공격 그림을 쓰게(환도 밀림 걷기 꼬리·R440 EGO 버프).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const h=C('hwando-r271.js'),s=C('skill-attack-r440.js');
ok('runtime copies match',RT('hwando-r271.js')===h&&RT('skill-attack-r440.js')===s);
ok('R440: EGO buff no longer skips the swap, samong still does',!/p\.ego>0\|\|p\.samong>0/.test(s)&&/if\(p\.samong>0\)/.test(s));
// 환도 걷기 판정 순수 함수
const box={window:{},console,performance:{now:()=>0}};box.window=box;vm.createContext(box);
try{vm.runInContext(h,box);}catch(e){}
const W=box.__STORYWORLD_HWANDO_R271__?.pure?.walkTail;
ok('R271 exports pure walkTail',typeof W==='function');
if(typeof W==='function'){
 ok('normal: moved .05s ago, no attack → walking',W(.05,false,0,true)===true);
 ok('normal: input walk during attack (engine moving) → walking (R895 cancel decides)',W(.05,false,.3,true)===true);
 ok('pushed while attacking (engine not moving) → not walking',W(.05,false,.3,false)===false);
 ok('pushed while not attacking → walking tail kept (regression)',W(.05,false,0,false)===true);
 ok('boundary: moved exactly .15s ago → not walking',W(.15,false,0,true)===false);
 ok('attack over tail (R895 rule 5) → not walking',W(.05,true,.3,true)===false);
 ok('NaN inputs → finite boolean, no walk on NaN time',W(NaN,false,NaN,undefined)===false&&W(.05,false,NaN,false)===true);
}
ok('R271 choose uses walkTail with engine moving flag',/moving=walkTail\(t-S\.movedAt,!!M\?\.attackOverTail\?\.\(\),atk,player\.moving\)/.test(h));
// R143: 좌·우 공격 시트가 있는 영웅(네온·라우렌)은 대각 공격도 좌·우 시트로
const a143=C('attack-anim-r143.js');
ok('R143 runtime copy matches',RT('attack-anim-r143.js')===a143);
const box2={window:{},console,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}}};box2.window=box2;vm.createContext(box2);
try{vm.runInContext(a143,box2);}catch(e){}
const SF=box2.__STORYWORLD_ATTACK_ANIM_R143__?.pure?.sideFirst;
ok('R143 exports pure sideFirst',typeof SF==='function');
if(typeof SF==='function'){
 ok('neon diagonal se/ne attack → side sheet e',SF('se','attack',false,true)==='e'&&SF('ne','attack',false,true)==='e');
 ok('side already e stays e',SF('e','attack',false,true)==='e');
 ok('up/down keep their own sheet',SF('n','attack',false,true)==='n'&&SF('s','attack',false,true)==='s');
 ok('hero without side sheet keeps diagonal (regression)',SF('se','attack',false,false)==='se');
 ok('idle pose and hit keep diagonal',SF('se','attack',true,true)==='se'&&SF('ne','hit',false,true)==='ne');
 ok('unknown/NaN dir passes through',SF(undefined,'attack',false,true)===undefined);
}
ok("R143 place() routes through sideFirst",/sd0=sideFirst\(sd1,act,idle,/.test(a143));
// 스킬(R440 이 공격으로 바꿔 보이는 중)이 피격 그림에 덮이지 않게(R1053 '피격 중에도 공격'과 같은 원칙)
const box3={window:{},console,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},drawHero(){}};box3.window=box3;vm.createContext(box3);
try{vm.runInContext(s,box3);}catch(e){}
const S440=box3.__STORYWORLD_SKILL_ATTACK_R440__;
ok('R440 exports swapping() and it is false when idle',typeof S440?.swapping==='function'&&S440.swapping()===false);
ok('R143 hit branch steps aside while R440 swaps a skill to attack',/sw440=!!window\.__STORYWORLD_SKILL_ATTACK_R440__\?\.swapping\?\.\(\)/.test(a143)&&/player\.hurtAnim>0&&!sw440/.test(a143)&&(a143.match(/player\.guard\|\|sw440\)/g)||[]).length===2);
// 스킬이 휘두르기(공격 시트 한 번)보다 길면 끝난 뒤 '선 자세(걷기 시트 칸)'로 돌아가던 것 → 마지막 공격 칸을 붙든다(R143 과 같은 방식)
const sl=C('slayer-r351.js');
ok('runtime copy slayer matches',RT('slayer-r351.js')===sl);
ok('R271 hwando holds the last attack frame while R440 skill swap outlasts the swing',/if\(el>=tot&&!moving&&window\.__STORYWORLD_SKILL_ATTACK_R440__\?\.swapping\?\.\(\)\)\{S\.dir=S\.swing\.dir;stats\.skillHold=\(stats\.skillHold\|\|0\)\+1;return draw\(rec,st,best,'attack',S\.swing\.dir,frameAt\(a\.ms,tot-1,false\)\);\}S\.swing=null;/.test(h));
ok('R351 slayer holds the last attack frame while R440 skill swap outlasts the swing',/if\(el>=tot&&!moving&&window\.__STORYWORLD_SKILL_ATTACK_R440__\?\.swapping\?\.\(\)\)\{stats\.skillHold=\(stats\.skillHold\|\|0\)\+1;return draw\(rec,st,best,'attack',S\.swing\.dir,frameAt\(SA\.ms,tot-1,false\),undefined,SA\);\}S\.swing=null;/.test(sl));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.detail?' '+JSON.stringify(c.detail):''));
console.log(`R1050b ${checks.length-fail.length}/${checks.length}`);if(fail.length)process.exit(1);
