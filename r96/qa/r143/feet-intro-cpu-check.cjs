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

// attack-anim-r143: basic-attack frames from the Drive 6-frame sheets, hwando idle from the same white sheet.
ok('attack-anim-r143.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','attack-anim-r143.js'),'utf8')===C('attack-anim-r143.js'));
ok('index.html loads attack-anim-r143 before audio-r98',html.indexOf('./attack-anim-r143.js')>0&&html.indexOf('./attack-anim-r143.js')<html.indexOf('./audio-r98.js'));
{const crypto=require('crypto');let all=true,detail='';for(const h of ['lauren','hwando','seoha','neon','michaela','hunter','slayer','gunner']){const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r143','attack',h,'index.json'),'utf8'));
  for(const d of ['s','se','e','ne','n']){const r=idx.directions[d];const b=fs.readFileSync(path.join(R,'runtime-text',r.path));if(r.frames!==6||crypto.createHash('sha256').update(b).digest('hex')!==r.sha256||!/^[A-Za-z0-9_-]{20,}$/.test(r.source.driveId)||!r.source.sha256){all=false;detail+=h+d+' ';}}}
 ok('attack sheets: 8 heroes x 5 directions, 6 frames, hashes and Drive sources recorded',all,detail);}
function runA(o){const cmds=[];const body={kind:'image',owner:{kind:'hero'},sourcePath:o.src||'assets/r130/lauren/g-e.webp',image:{src:'old'},points:[[0,0],[10,0],[10,50],[0,50]]};
 const copy={...body,points:body.points.map(p=>p.slice())};const im={naturalWidth:1152,naturalHeight:256,width:1152,height:256};
 const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:()=>({getContext:()=>null})},Date,Math,Promise,
  started:true,time:1,player:{hero:o.hero||'lauren',x:0,y:0,hp:10,attackAnim:0,direction:'right'},room:{enemies:o.enemies||[]},ctx:{commands:cmds},
  project:(x,y)=>({x:x*10+100,y:y*10+200}),actorHeight:()=>54,readyImage:p=>({image:{...im,...(/\/hit\//.test(p)?{naturalWidth:384,width:384}:{}),src:p}}),drawHero(){cmds.push(body);if(o.dup)cmds.push(copy);}};
 vm.createContext(sb);vm.runInContext(C('attack-anim-r143.js'),sb);return{sb,cmds,body};}
{let t=runA({enemies:[{x:-2,y:0,hp:5}]});const seq=[];for(const a of [.24,.2,.16,.12,.08,.04]){t.cmds.length=0;t.body.sourcePath='assets/r130/lauren/g-e.webp';t.sb.player.attackAnim=a;t.sb.drawHero();seq.push(t.body.sourceRect?t.body.sourceRect[0]/192:-1);}
 ok('basic attack walks through the 6 frames in order (wind-up, strike, recovery)',seq.join()==='0,0,1,3,4,5',seq.join());
 ok('attack faces the nearest enemy (west → mirrored east sheet)',/attack-e\.webp$/.test(t.body.sourcePath)&&t.body.points[1][0]<t.body.points[0][0],t.body.sourcePath);
 const P=t.body.points;ok('attack frame keeps the foot anchor on the ground point',Math.abs(((P[2][1]+P[3][1])/2)-(200+(256-227)*54*.98/199))<3,JSON.stringify(P));}
{let t=runA({});t.sb.player.skillAnim=.3;t.sb.player.attackAnim=.2;t.sb.drawHero();ok('skill/hurt/dash/guard keep their own art',t.body.sourcePath==='assets/r130/lauren/g-e.webp');}
{let t=runA({hero:'hwando',src:'assets/r93/idle/idle-hwando-s.png',dup:true});t.sb.drawHero();
 ok('hwando idle uses the white sheet (first attack frame), old double body removed',/r143\/attack\/hwando\/attack-/.test(t.body.sourcePath)&&t.body.sourceRect[0]===0&&t.cmds.length===1,t.body.sourcePath+' '+t.cmds.length);}
{let t=runA({hero:'hwando',src:'assets/r130/hwando/walk-e.webp'});t.body.r121Walk=true;t.sb.drawHero();ok('walking (R119 walk cycle) is left alone',t.body.sourcePath==='assets/r130/hwando/walk-e.webp');}
{let t=runA({enemies:[{x:2,y:0,hp:5}]});const seq=[];for(const a of [.3,.2,.1]){t.cmds.length=0;t.body.sourcePath='assets/heroes/normalized/actions-v3126/lauren-hurt-right.webp';t.sb.player.hurtAnim=a;t.sb.drawHero();seq.push(/r143\/hit\/lauren\/hit-e\.webp$/.test(t.body.sourcePath)?t.body.sourceRect[0]/192:-1);}
 ok('hit plays the 2-frame hit sheet facing the attacker (impact, recoil)',seq.join()==='0,0,1',seq.join());}
{let t=runA({hero:'hwando',src:'assets/hero-authored-v314rc5/hwando-action-atlas.png'});t.sb.player.hurtAnim=.2;t.sb.drawHero();ok('hwando hit (no hit sheet): white sheet ready stance instead of the old tan atlas',/r143\/attack\/hwando\//.test(t.body.sourcePath)&&t.body.sourceRect[0]===0,t.body.sourcePath);
 t.cmds.length=0;t.body.r143Attack=false;t.body.sourcePath='assets/hero-authored-v314rc5/hwando-action-atlas.png';t.sb.player.hurtAnim=0;t.sb.player.skillAnim=.3;t.sb.drawHero();ok('hwando skill: white attack sheet 3rd frame (R130 mapping)',/r143\/attack\/hwando\//.test(t.body.sourcePath)&&t.body.sourceRect[0]===2*192,t.body.sourcePath+' '+t.body.sourceRect);
 t.cmds.length=0;t.body.r143Attack=false;t.body.sourcePath='assets/hero-authored-v314rc5/hwando-walk-atlas.png';t.sb.player.skillAnim=0;t.sb.player.dashAnim=.2;t.sb.drawHero();ok('hwando dash: white walk sheet 4th frame',/r130\/hwando\/walk-/.test(t.body.sourcePath)&&t.body.sourceRect[0]===3*192,t.body.sourcePath);
 t.cmds.length=0;t.body.r143Attack=false;t.body.sourcePath='assets/hero-authored-v314rc5/hwando-action-atlas.png';t.sb.player.dashAnim=0;t.sb.player.ultimateAnim=.5;t.sb.drawHero();ok('hwando ultimate keeps its own art (built-in effect)',t.body.sourcePath==='assets/hero-authored-v314rc5/hwando-action-atlas.png');}
{const crypto=require('crypto');let all=true;for(const h of ['lauren','seoha','neon','michaela','hunter','slayer','gunner']){const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r143','hit',h,'index.json'),'utf8'));for(const d of ['s','se','e','ne','n']){const r=idx.directions[d];if(r.frames!==2||crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'runtime-text',r.path))).digest('hex')!==r.sha256)all=false;}}
 ok('hit sheets: 7 heroes x 5 directions, 2 frames, hashes recorded',all);}
ok('workflow runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r143/feet-intro-cpu-check.cjs'));
const fail=checks.filter(c=>!c.pass);console.log(JSON.stringify({status:fail.length?'FAIL':'PASS',passed:checks.length-fail.length,total:checks.length,fail},null,1));process.exit(fail.length?1:0);
