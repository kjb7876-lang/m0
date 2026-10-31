// R179 CPU check: 초반 보스 전투 시간 — 보스·중간보스가 받는 피해 ÷ 배율(뿌리의 문지기 ×0.45 → 피해 ×2.22), 체력 값은 그대로, 사몽·뒤 지역·잡몹은 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('balance-r179 runtime copy matches, loaded, in the public verify list',fs.readFileSync(path.join(R,'runtime-text','balance-r179.js'),'utf8')===C('balance-r179.js')&&/balance-r179\.js/.test(fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8'))&&fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'balance-r179.js'"));
const got=[];const sb={window:{},localStorage:{getItem(){return null;},setItem(){}},layer:'STORY',room:{id:'dist00'},hitEnemy(e,v){got.push(v);e.hp-=v;return true;},Math,JSON,Number,Object};
vm.createContext(sb);vm.runInContext(C('balance-r179.js'),sb);
const hit=(e,v)=>{got.length=0;sb.__e=e;sb.__v=v;vm.runInContext('hitEnemy(__e,__v)',sb);return got[0];};
const boss={boss:true,hp:11066,maxHp:11066};
ok('뿌리의 문지기(dist00): damage ÷0.45, max HP untouched',Math.abs(hit(boss,100)-100/.45)<1e-6&&boss.maxHp===11066);
ok('ordinary mobs take normal damage',hit({hp:50,maxHp:50},10)===10);
sb.room={id:'dist03'};ok('rest of part 1: ÷0.6 (midboss)',Math.abs(hit({midboss:true,hp:1,maxHp:1},60)-100)<1e-6);
sb.room={id:'ep1b02'};ok('later regions unchanged',hit({boss:true,hp:1,maxHp:1},60)===60);
sb.room={id:'dist00',samongR103:{}};ok('samong zones borrowing the room unchanged',hit({boss:true,hp:1,maxHp:1},60)===60);
sb.room={id:'dist00'};sb.layer='DREAM';ok('DREAM layer unchanged',hit({boss:true,hp:1,maxHp:1},60)===60);
ok('health values are never rewritten (no maxHp/hp assignment — load/normalisation would stack it)',!/\.maxHp\s*=|\.hp\s*=/.test(C('balance-r179.js')));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
