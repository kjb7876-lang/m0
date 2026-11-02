// R230 CPU check: 몹이 화면 위·아래에서 근접 공격하려 하면 영웅 옆자리로 블링크한 뒤 공격.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('mob-flank-r230.js'),idx=RT('index.html');
ok('runtime copy matches; loads after guide-unstick-r222; in the public verify list and CI',RT('mob-flank-r230.js')===src&&idx.includes('<script src="./guide-unstick-r222.js"></script><script src="./mob-flank-r230.js"></script>')&&/'mob-flank-r230\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r230\/r230-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
function mk(o={}){const plays=[];const sb={console,Math,JSON,Number,String,Object,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,time:10,
 player:{x:10,y:10},room:{},blocked:o.blocked||(()=>false),clearLine:()=>true,
 facing:(x,y)=>{const sx=x-y,sy=(x+y)*.5;return Math.abs(sx)>Math.abs(sy)*1.35?(sx>0?'right':'left'):sy>0?'front':'back';}};
 sb.window.__STORYWORLD_PIXELFX_R163__={has:()=>true,play:n=>plays.push(n)};
 sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({canPrepare:(e,k)=>o.allow!==false});
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,plays};}
const scr=(e,p)=>({sx:(p.x-p.y)-(e.x-e.y),sy:((p.x+p.y)-(e.x+e.y))*.5});
// 영웅이 화면에서 몹 바로 위(몹이 화면 아래): 화면 세로만 차이 → x,y 둘 다 +1.0 쪽
{const {sb,plays}=mk();const e={x:11,y:11,hp:5,spawnState:'active',combatProfile:{attackShape:{range:1.45}}};
 const r=sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'melee');const s=scr(e,sb.player);
 ok('vertical approach: the mob blinks to the hero\'s side before the melee windup',r===true&&e.r230Flanks===1&&Math.abs(s.sy)<1e-6&&Math.abs(s.sx)>.9,{e,s});
 ok('it lands within attack range (0.75 × range) and faces sideways',Math.abs(Math.hypot(e.x-10,e.y-10)-1.45*.75)<1e-6&&/left|right/.test(e.direction),{e});
 ok('vanish and appear puffs (dark implosion) are played',plays.length===2&&plays.every(n=>n==='pvfx-void-implosion'));}
{const {sb}=mk();const e={x:11.5,y:10,hp:5,spawnState:'active',combatProfile:{attackShape:{range:1.45}}};sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'melee');
 ok('a mob already beside the hero on screen is left where it is',e.x===11.5&&e.y===10&&!e.r230Flanks);}
for(const flag of ['boss','midboss','persona','r170Tower']){const {sb}=mk();const e={x:11,y:11,hp:5,spawnState:'active',[flag]:true,combatProfile:{attackShape:{range:1.45}}};sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'melee');
 ok(flag+' is never moved',e.x===11&&e.y===11);}
{const {sb}=mk({allow:false});const e={x:11,y:11,hp:5,spawnState:'active',combatProfile:{attackShape:{range:1.45}}};const r=sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'melee');
 ok('when the engine refuses the attack, nothing moves and the refusal is kept',r===false&&e.x===11);}
{const {sb}=mk({blocked:()=>true});const e={x:11,y:11,hp:5,spawnState:'active',combatProfile:{attackShape:{range:1.45}}};sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'melee');
 ok('both side spots blocked → attacks from where it stands',e.x===11&&e.y===11&&sb.window.__STORYWORLD_MOB_FLANK_R230__.inspect().stats.blocked===1);}
{const {sb}=mk();const e={x:11,y:11,hp:5,spawnState:'active',combatProfile:{attackShape:{range:1.45}}};const M=sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__;M.canPrepare(e,'melee');e.x=11;e.y=11;M.canPrepare(e,'melee');
 ok('one blink per mob per 2.4 s',e.r230Flanks===1&&e.x===11);sb.time=13;M.canPrepare(e,'melee');ok('after 2.4 s it may blink again',e.r230Flanks===2);}
{const {sb}=mk();const e={x:11,y:11,hp:5,spawnState:'active',combatProfile:{attackShape:{range:1.45}}};sb.window.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'ranged');ok('ranged attacks are not touched',e.x===11);}
ok('can be switched off; never changes damage/cooldown',/storyworld\.r230\.flank/.test(src)&&!/\.hp\s*[-+]?=[^=]|\.cd\s*=|damage/.test(src.replace(/\/\/.*$/gm,'')));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
