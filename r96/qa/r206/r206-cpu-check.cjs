// R206 CPU check: 떠 있지 않은 몹은 접지 그림자를 그리지 않고, 떠 있는 몹·영웅·소품 그림자는 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');ok('mob-ground-r206 loads before combat-r118',idx.indexOf('./mob-ground-r206.js')>0&&idx.indexOf('./mob-ground-r206.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches',RT('mob-ground-r206.js')===C('mob-ground-r206.js'));
ok('in the public verify list and the CI workflow',/'mob-ground-r206\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r206\/r206-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const sb={console,Math,JSON,String,Number,localStorage:{getItem:()=>null,setItem(){}},window:{},calls:[]};vm.createContext(sb);
vm.runInContext(`function shadow(x,y,r,opt){calls.push([x,y,opt&&opt.lift||0]);} function drawEnemy(e){shadow(e.x,e.y,18,{lift:e.lift||0});} function drawHero(){shadow(1,1,18,{});}`,sb);
vm.runInContext(C('mob-ground-r206.js'),sb);
const run=(js)=>{sb.calls.length=0;vm.runInContext(js,sb);return sb.calls.length;};
ok('grounded mob: no contact shadow',run(`drawEnemy({id:'a',name:'뼈거미',x:2,y:2})`)===0);
ok('hovering mob (lift or R109 visual lift) keeps its shadow',run(`drawEnemy({id:'b',name:'뼈거미',x:2,y:2,lift:.4})`)===1&&run(`drawEnemy({id:'c',name:'x',x:2,y:2,visualLiftPx:9})`)===1);
ok('flying kinds by name keep their shadow',run(`drawEnemy({id:'d',name:'떠도는 망령',x:2,y:2})`)===1);
ok('hero shadow untouched',run(`drawHero()`)===1);
sb.window.__STORYWORLD_MOB_GROUND_R206__.set({on:false});ok('switching off restores mob shadows',run(`drawEnemy({id:'a',name:'뼈거미',x:2,y:2})`)===1);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
