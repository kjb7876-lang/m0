// R227 CPU check: 사몽 E 가 단서·문보다 먼 미카엘라(처방)·상자를 먼저 집지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const g=C('growth-r103.js');
ok('runtime copy matches the client source',RT('growth-r103.js')===g);
ok('interact checks closerGoal before Michaela and the chest',/near\('chest'\);if\(c&&!chestSeen\(c\.chestR103\|\|c\.chest\)&&!closerGoal\(c\)\)/.test(g)&&/near\('michaela'\);if\(m&&!closerGoal\(m\)\)/.test(g));
const src=g.match(/function closerGoal\(p\)\{[\s\S]*?\n/)[0];
const run=(props,p)=>{const sb={Math,player:{x:10,y:10},room:{props}};vm.createContext(sb);vm.runInContext(src+';var out=closerGoal(P);',Object.assign(sb,{P:p}));return sb.out;};
const mich={x:11.5,y:10,samongR103:'michaela',growthR103:'michaela'};
ok('a clue under the player wins over Michaela 1.5 away (S01-1 case)',run([mich,{x:10,y:10,samongR103:'record',r115Clue:'c0'}],mich)===true);
ok('Michaela still answers when no samong goal is nearer',run([mich,{x:13,y:10,samongR103:'record'}],mich)===false);
ok('the previous-zone marker never hides Michaela',run([mich,{x:10.2,y:10,samongR103:'back'}],mich)===false);
ok('hidden props are ignored',run([mich,{x:10,y:10,samongR103:'record',visible:false}],mich)===false);
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
