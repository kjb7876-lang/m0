// R151 CPU check: 영웅 쓰러짐 6프레임 연출 뒤 '기억은 남아 있습니다' 창(showDeath) — 지연·중복·그림 없을 때·협동·자산 출처.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('death-r151.js');
ok('runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','death-r151.js'),'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads death-r151 after attack-anim-r143 and before audio-r98',html.indexOf('./death-r151.js')>html.indexOf('./attack-anim-r143.js')&&html.indexOf('./death-r151.js')<html.indexOf('./audio-r98.js'));
ok('public verify list includes death-r151',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'death-r151.js'"));
const HEROES=['lauren','seoha','neon','michaela','hunter','slayer','gunner'];
for(const h of [...HEROES,'hwando']){const dir=path.join(R,'runtime-text','assets','r151','death',h),idx=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));const dirs=Object.keys(idx.directions);
 ok(`${h}: death sheets ${h==='hwando'?'e':'5 directions'} · 6 frames · Drive source+sha recorded`,(h==='hwando'?dirs.join()==='e':dirs.length===5)&&dirs.every(d=>idx.directions[d].frames===6&&/^[0-9a-f]{64}$/.test(idx.directions[d].source.sha256)&&idx.directions[d].source.driveId&&fs.existsSync(path.join(dir,'death-'+d+'.webp'))),dirs);}
function run({ready=true,coop='off',story=null,hero='lauren'}={}){let panels=0,timers=[];const drawn=[];
 const rec={commands:[],save(){},restore(){},translate(){},scale(){},drawImage(...a){drawn.push(a);this.commands.push({kind:'image',owner:this._o});},scope(o,f){this._o=o;f();this._o=null;}};
 const img={naturalWidth:1152,naturalHeight:256,width:1152};let now=0;
 const sb={window:{__STORYWORLD_COOP_SIM_R62__:{mode:()=>coop}},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:()=>({getContext:()=>null})},performance:{now:()=>now},
  setTimeout:(f,ms)=>timers.push({f,ms}),player:{hero,hp:777,maxHp:777,x:5,y:5,direction:'left'},started:true,storyScene:story,ctx:rec,
  readyImage:p=>ready?{image:img}:null,ensureImages:()=>Promise.resolve(),project:()=>({x:100,y:200}),actorHeight:()=>54,
  drawHero(){},showDeath(){panels++;}};
 vm.createContext(sb);vm.runInContext(src,sb);const api=sb.window.__STORYWORLD_DEATH_R151__;
 return {sb,api,rec,drawn,timers,get panels(){return panels;},tick(ms){now+=ms;sb.drawHero();}};}
{const t=run();t.sb.player.hp=0;t.sb.showDeath();ok('death waits for the collapse instead of opening the panel at once',t.panels===0&&t.timers.length===1&&t.timers[0].ms===1500,{p:t.panels,t:t.timers});
 t.tick(0);t.tick(400);t.tick(1200);const st=t.api.inspect().stats;ok('collapse frames are drawn in the hero slot (owner hero) and reach the last (lying) frame',t.drawn.length===3&&t.rec.commands.every(c=>c.owner?.kind==='hero')&&st.lastFrame===5,st);
 ok('frame advances 0 → 2 → 5 over time',t.drawn[0][1]===0&&t.drawn[1][1]===2*192&&t.drawn[2][1]===5*192,t.drawn.map(d=>d[1]));
 t.sb.showDeath();ok('a second death call while collapsing is ignored',t.timers.length===1&&t.panels===0);
 t.timers[0].f();ok('panel opens after the collapse',t.panels===1&&!t.api.inspect().dying);}
{const t=run();t.sb.player.hp=0;t.sb.showDeath();t.sb.player.hp=777;t.timers[0].f();ok('if the hero is back on their feet (new game/load) the stale panel is skipped',t.panels===0&&t.api.inspect().stats.skipped===1);}
{const t=run({ready:false});t.sb.player.hp=0;t.sb.showDeath();ok('sheet not loaded yet → original panel at once',t.panels===1&&t.timers.length===0);}
{const t=run({coop:'duo'});t.sb.player.hp=0;t.sb.showDeath();ok('co-op mode → original panel at once',t.panels===1&&t.timers.length===0);}
{const t=run({story:{id:'x'}});t.sb.player.hp=0;t.sb.showDeath();ok('during a story scene → original panel at once',t.panels===1);}
{const t=run({hero:'hwando'});t.sb.player.hp=0;t.sb.showDeath();t.tick(10);ok('hwando (e only) facing left uses the mirrored e sheet',t.api.inspect().stats.frames===1);}
{const t=run();let cleared=0;t.sb.clearControls=()=>cleared++;t.sb.stopVoice=()=>{};t.sb.player.hp=0;t.sb.showDeath();ok('R159: controls are cleared the moment the hero falls (held attack/guard keys do not linger)',cleared===1,cleared);
 t.tick(100);t.sb.player.hp=777;t.tick(100);ok('R159: if the hero is alive again during the fall (new game/load), the fall frames stop at once',!t.api.inspect().dying&&t.api.inspect().stats.revived===1,t.api.inspect());}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
