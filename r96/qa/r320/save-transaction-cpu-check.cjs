'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const site=path.resolve(__dirname,'../../hospital-three-pc/site'),html=fs.readFileSync(path.join(site,'index.html'),'utf8');
const native=html.match(/<script id="save-slots-r73">([\s\S]*?)<\/script>/)[1];
const guarded=html.includes('<script src="./save-transition-r320.js"></script>');
const out={method:'CPU isolated shipped R73 slot transactions, controlled asynchronous restore backend and simulation/render spies. Synthetic saves/DOM only; no browser/natural-play claim.',checks:[]};
function check(name,passed,detail){out.checks.push({name,passed:!!passed,detail});console.log(passed?'PASS':'FAIL',name);}
async function scenario(reject){
 const raw={version:6,scope:'hapil.storyworld.depth-full.20261008',zone:'hub',layer:'STORY',hero:'hwando',player:{x:30,y:20,hp:777,level:1},progress:{STORY:{},DREAM:{}},rooms:{}};
 const store=new Map([['save.slot-r73.1',JSON.stringify(raw)]]);let release,restores=0;const held=new Promise(r=>release=r);
 const c={console,document:{readyState:'complete'},SAVE:'save',started:true,booted:true,loading:false,modal:false,storyScene:null,time:40,zone:'hub',layer:'STORY',player:{x:15,y:19,hp:777,level:1},room:{id:'hub',layer:'STORY',enemies:[]},enemyHp:100,draws:0,regionById:{hub:{title:'CPU fixture'}},route:[],command:null,cam:{},blocked:()=>false,normalizeSave3:x=>x,escapeHTML:String,toast(){},button(){},$:()=>null,showTitle(){},showMenu(){},openPanel(){c.modal=true},closePanel(){c.modal=false},enterRegion:async()=>true,loadLocal(){},saveGame:()=>true};c.window=c;c.__STORYWORLD_TEST_STORAGE_B1__={store:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}};
 c.serializeSave=()=>JSON.parse(JSON.stringify({...raw,player:c.player}));
 c.restoreSave=async value=>{const first=++restores===1;c.loading=false;c.modal=false;c.player={...value.player,x:5,y:5};if(first){await held;if(reject)throw Error('controlled late restore rejection');}c.player={...value.player};return true};
 c.tick=dt=>{c.time+=dt;c.player.x+=dt;c.player.hp--;c.enemyHp-=2};c.draw=()=>c.draws++;
 vm.createContext(c);vm.runInContext(native,c,{filename:'shipped-save-slots-r73'});if(guarded)vm.runInContext(fs.readFileSync(path.join(site,'save-transition-r320.js'),'utf8'),c,{filename:'shipped-save-transition-r320'});
 const A=c.__STORYWORLD_SAVE_SLOTS_R73__,pending=A.confirm('load',1);await Promise.resolve();const state=A.inspect(),prefix=reject?'reject: ':'success: ';
 check(prefix+'real native transaction remains pending after base opens gameplay',state.busy&&state.operation==='load'&&state.transitionDepth>0&&!c.loading&&!c.modal,state);
 const before={time:c.time,hp:c.player.hp,enemy:c.enemyHp};for(let i=0;i<8;i++)c.tick(1/60);c.draw();
 check(prefix+'pending restore preserves simulation clock',c.time===before.time,{before:before.time,after:c.time});check(prefix+'pending restore prevents player damage',c.player.hp===before.hp);check(prefix+'pending restore prevents enemy damage',c.enemyHp===before.enemy);check(prefix+'rendering remains available',c.draws===1);
 release();await pending;check(prefix+'native transaction always releases',!A.inspect().busy&&A.inspect().transitionDepth===0);check(prefix+'success restores saved position or rejection restores prior position',c.player.x===(reject?15:30)&&c.player.y===(reject?19:20),c.player);
 const at=c.time;c.tick(.25);check(prefix+'normal simulation resumes with original delta',c.time===at+.25);check(prefix+'save schema is unchanged',c.serializeSave().version===6&&!c.serializeSave().cheat777?.active);
}
(async()=>{await scenario(false);await scenario(true)})().catch(e=>{out.error=e.stack;console.error(e.stack)}).finally(()=>{out.passed=!out.error&&out.checks.every(c=>c.passed);out.total=out.checks.length;fs.writeFileSync(process.env.R320_REPORT||path.join(__dirname,'save-transaction-results.json'),JSON.stringify(out,null,2));if(!out.passed)process.exitCode=1;});
