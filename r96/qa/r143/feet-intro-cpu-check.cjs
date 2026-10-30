// R143 CPU check: self-foot ring drawn on the ground layer centred on the hero's ground point (solo), DOM marker hidden; opening intro unwired.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('feet-r143.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','feet-r143.js'),'utf8')===C('feet-r143.js'));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads feet-r143 before audio-r98',(html.indexOf('./feet-r143.js')>0&&html.indexOf('./feet-r143.js')<html.indexOf('./audio-r98.js')));
ok('opening intro script is no longer loaded',!html.includes('intro-r140.js'));
ok('intro files are kept (not deleted)',fs.existsSync(path.join(R,'runtime-text','intro-r140.js'))&&fs.existsSync(path.join(R,'runtime-text','assets','r140','intro','index.json')));
ok('public verify list includes feet-r143',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'feet-r143.js'"));
function run(o={}){const ops=[];const m={style:{display:'block'}};
 const ctx={save(){},restore(){},beginPath(){},stroke(){ops.push('stroke');},ellipse(...a){ops.push(['ellipse',...a]);}};
 const sb={window:{__STORYWORLD_COOP_SIM_R62__:o.coop?{mode:()=>'duo'}:undefined},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>m},
  started:true,modal:false,zoom:1.5,player:{x:3,y:4,hp:o.dead?0:10},ctx,project:(x,y)=>({x:x*10,y:y*10}),drawHero(){ops.push('body');},draw(){m.style.display='block';},Math};
 vm.createContext(sb);vm.runInContext(C('feet-r143.js'),sb);sb.draw();sb.drawHero();return{ops,m};}
let r=run();const e=r.ops.find(x=>Array.isArray(x)&&x[0]==='ellipse');
ok('solo: ring centred on the ground point, R63 size scaled by zoom',e&&e[1]===30&&e[2]===40&&e[3]===13.5&&e[4]===6,JSON.stringify(e));
ok('solo: ring is drawn before the hero body (ground layer, under the boots)',r.ops.indexOf('stroke')>=0&&r.ops.indexOf('stroke')<r.ops.indexOf('body'));
ok('solo: DOM marker hidden',r.m.style.display==='none');
r=run({coop:true});ok('co-op: R63 DOM marker kept, no ground ring',r.m.style.display==='block'&&!r.ops.some(x=>Array.isArray(x)));
r=run({dead:true});ok('dead hero: no ring',!r.ops.some(x=>Array.isArray(x)));
ok('workflow runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r143/feet-intro-cpu-check.cjs'));
const fail=checks.filter(c=>!c.pass);console.log(JSON.stringify({status:fail.length?'FAIL':'PASS',passed:checks.length-fail.length,total:checks.length,fail},null,1));process.exit(fail.length?1:0);
