// R1249 CPU 검사: 복원이 실패(false·예외)하면 저장 후 처리가 지금 진행을 바꾸지 않는다.   node r96/qa/r1249/restore-fail-post-cpu-check.cjs
//  리뷰(사용자 2026-11-20 첨부 1·4번) · R1248(저장 실패 처리) 뒤 남은 같은 종류 — restoreSave 감싸개 46곳을 전수로 읽어 보니
//  대부분은 결과(false)를 보고 거르지만 셋은 실패한 저장의 값을 지금 영웅에게 덮어썼다:
//   · threads-r243  silverDefaultR243(은색실 기본 장착 켜기/끄기)
//   · summoning-r251 r251Broken(발록 소환진 부숨 표시 — 실패한 저장이 '안 부숨'이면 이미 부순 소환진이 다시 생김)
//   · gunner-arms-r561 기억사수 W·E·R 남은 대기
//  성공(엔진처럼 undefined 반환)·true 는 지금처럼 적용, false·예외는 그대로 둔다(경계·회귀 모두).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,x===undefined?'':JSON.stringify(x));}};
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
for(const f of ['threads-r243.js','summoning-r251.js','gunner-arms-r561.js'])ok(f+' runtime copy matches source',C(f)===RT(f));
ok('pages.yml runs this check',/node r96\/qa\/r1249\/restore-fail-post-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
const outcomes=[['undefined (engine success)',async()=>undefined,true],['true',async()=>true,true],['false',async()=>false,false],['throws',async()=>{throw new Error('bad save');},false]];
async function main(){
 // ---- R243 ----
 for(const [label,base,applies] of outcomes){const st={learned:true,equipped:['a'],autoUse:true,designs:[{id:'a'}]};
  const sb={console,Math,JSON,Object,Array,Set,Number,String,Promise,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,player:{hero:'hwando',silverDefaultR243:true},toast(){},saveGame:()=>true,serializeSave:()=>({}),restoreSave:base};
  sb.window.__STORYWORLD_DANCES_R74__=Object.freeze({state:()=>st,cast:()=>true,command:()=>true,customSilver:()=>'orig',decorateManager:()=>1});
  vm.createContext(sb);vm.runInContext(C('threads-r243.js'),sb);let threw=false;try{await sb.restoreSave({silverDefaultR243:false});}catch(_){threw=true;}
  ok('R243 restore '+label+': silverDefaultR243 '+(applies?'applied':'kept'),sb.player.silverDefaultR243===(applies?false:true)&&threw===(label==='throws'),sb.player.silverDefaultR243);}
 // ---- R251 ----
 for(const [label,base,applies] of outcomes){
  const sb={console,Math,JSON,Object,Array,Number,String,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},window:{},time:10,uid:1,layer:'STORY',player:{x:20,y:20,hp:500,r251Broken:true},room:{id:'dist06',enemies:[]},
   hazards:[],effects:[],blocked:()=>false,toasts:[],toast(m){sb.toasts.push(m);},saveGame(){},tick(){},drawEnemy(){return 'base';},drawEffect(){},drawHazard(){return 'base';},serializeSave:()=>({v:1}),restoreSave:base};
  vm.createContext(sb);vm.runInContext(C('summoning-r251.js'),sb);let threw=false;try{await sb.restoreSave({r251Broken:false});}catch(_){threw=true;}
  ok('R251 restore '+label+': r251Broken '+(applies?'applied':'kept (broken circle stays broken)'),sb.player.r251Broken===(applies?false:true)&&threw===(label==='throws'),sb.player.r251Broken);}
 // ---- R561 ----
 for(const [label,base,applies] of outcomes){
  const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Infinity,Promise,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,addEventListener(){},
   auto:false,guide:false,started:true,modal:null,loading:false,storyScene:null,settings:{},time:10,COMBAT_RHYTHM_R26:1,shake:0,
   player:{hero:'gunner',x:10,y:10,hp:100,specialCD:0,direction:'right',storyWER:{ready:{},buffs:{}}},maxHP:()=>200,attackPower:()=>40,rank:()=>0,clearLine:()=>true,blocked:()=>false,effects:[],sound(){},moveActor(){},
   HEROES:{gunner:{name:'기억사수',special:'기억 재현',range:8.2}},room:{enemies:[]},liveEnemies:()=>[],damageable3:()=>true,hitEnemy:()=>true,special(){},serializeSave:()=>({}),tick(){},drawEffect(){},updateHUD(){},restoreSave:base};
  sb.window.__STORYWORLD_WER__=Object.freeze({cast:()=>'base',defs:{}});sb.window.__STORYWORLD_GROWTH_R103__={state:()=>({procs:{}})};
  vm.createContext(sb);vm.runInContext(C('gunner-arms-r561.js'),sb);const A=sb.window.__STORYWORLD_GUNNER_ARMS_R561__;
  sb.tick(.05);const before=A.remain('w');let threw=false;try{await sb.restoreSave({storyWER:{remaining:{'gunner:w':9,'gunner:e':5,'gunner:r':12}}});}catch(_){threw=true;}const w=A.remain('w');
  ok('R561 restore '+label+': W cooldown '+(applies?'applied (saved 9s, capped by the skill cooldown)':'kept (still ready)'),(applies?w>before+5:w===before)&&threw===(label==='throws'),{before,w});}
 console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);}
main().catch(e=>{console.log('FAIL crash',e);process.exit(1);});
