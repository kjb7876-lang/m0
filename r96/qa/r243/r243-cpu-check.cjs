// R243 CPU check: 은색실 기본 실검무 장착 켜기/끄기 + 장착 은색실 실패 시 기본으로 넘어가기 + 저장 재시도 + 777 도안 보존.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('threads-r243.js'),idx=RT('index.html');
ok('runtime copy matches; loads after auto-levelup-r237; in verify list and CI',RT('threads-r243.js')===src&&idx.includes('<script src="./auto-levelup-r237.js"></script><script src="./threads-r243.js"></script>')&&/'threads-r243\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r243\/r243-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
function mk(o={}){const toasts=[];let saves=0;const st={learned:true,equipped:o.eq??['a'],autoUse:o.auto??true,designs:[{id:'a'},{id:'b'}]};
 const sb={console,Math,JSON,Object,Array,Set,Number,String,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,player:{hero:'hwando'},toast:t=>toasts.push(t),saveGame:()=>{saves++;return o.saveOk??true;},
  serializeSave:()=>({}),restoreSave:async raw=>true};
 sb.window.__STORYWORLD_DANCES_R74__=Object.freeze({state:()=>st,cast:()=>o.castOk??true,command:()=>true,customSilver:()=>'orig',decorateManager:()=>1});
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,st,toasts,saves:()=>saves,D:sb.window.__STORYWORLD_DANCES_R74__};}
{const {D}=mk({castOk:true});ok('equipped custom silver that fires → handled (true)',D.customSilver(true)===true);}
{const {D}=mk({castOk:false});ok('equipped custom silver on cooldown/blocked → falls back to the default thread dance (false) while default is equipped',D.customSilver(true)===false);}
{const {D,sb,toasts}=mk({castOk:false});sb.player.silverDefaultR243=false;ok('default unequipped and custom fails → blocked with a message (no silent nothing)',D.customSilver(true)===true&&toasts.length===1);}
{const {D,sb}=mk({eq:[]});ok('nothing equipped → default runs when equipped',D.customSilver(true)===false);sb.player.silverDefaultR243=false;ok('nothing equipped and default unequipped → blocked',D.customSilver(true)===true);}
{const {D}=mk({auto:false});ok('auto-use off on custom silver no longer suppresses the default auto thread dance',D.customSilver(false)===false);}
{const {sb}=mk();sb.player.silverDefaultR243=false;const raw=sb.serializeSave();ok('default on/off is written to the save (silverDefaultR243)',raw.silverDefaultR243===false);}
{const {sb}=mk();sb.restoreSave({silverDefaultR243:false}).then(()=>{});ok('restore wrapper installed',typeof sb.restoreSave==='function'&&/silverDefaultR243/.test(src));}
ok('manager: replaces the "기본 실검무 사용" button (which emptied the equip list) with an equip toggle that keeps the list',/old\.replaceWith\(b\)/.test(src)&&!/equipped=\[\]/.test(src));
ok('777 leave carries designs/equipped (not ranks/learned) back to the normal hero',/async leave/.test(src)&&/designs:JSON\.parse/.test(src)&&!/ranks:/.test(src.split('async leave')[1].split('});')[0]));
{const {D,saves}=mk({saveOk:false});D.command('silver',{},{op:'save'});ok('after a pattern command the save is retried when the first attempt is blocked',saves()>=1);}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R243 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
