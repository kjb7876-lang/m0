// R176 CPU check: 뒤로가기·앞으로가기 — 창을 열 때마다 기록, 뒤로 = 앞 창/닫기, 앞으로 = 다시 열기, 창 없을 때 뒤로 = 메뉴, 서사 장면 중 무시.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('nav-r176.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','nav-r176.js'),'utf8')===C('nav-r176.js'));
ok('loads after every overlay that wraps openPanel/show* (only combat-r118 and world-tiles-r118, which wrap neither, come after)',/audio-r98\.js"><\/script><script src="\.\/nav-r176\.js"><\/script>\s*<script src="\.\/combat-r118\.js"><\/script>\s*<script src="\.\/world-tiles-r118\.js"><\/script>\s*$/.test(fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8')));
// fake history
const entries=[{state:null}];let idx=0;const listeners=[];
const history={get length(){return entries.length;},pushState(s){entries.splice(idx+1);entries.push({state:s});idx++;},replaceState(s){entries[idx]={state:s};},
 go(n){idx=Math.max(0,Math.min(entries.length-1,idx+n));listeners.forEach(f=>f({state:entries[idx].state}));},back(){this.go(-1);},forward(){this.go(1);}};
let panel=null;const sb={window:{history},history,localStorage:{getItem(){return null;},setItem(){}},document:{getElementById:()=>null,createElement:()=>({}),head:{appendChild(){}}},
 addEventListener:(t,f)=>{if(t==='popstate')listeners.push(f);},started:true,loading:false,modal:false,storyScene:null,
 openPanel(html){sb.modal=true;panel=html;},closePanel(){sb.modal=false;panel=null;},
 showMenu(){sb.openPanel('menu');},showUpgrades(){sb.openPanel('upgrades');},showJournal(){sb.openPanel('journal');},Math,JSON,Number,String,Object,Array};
vm.createContext(sb);vm.runInContext(C('nav-r176.js'),sb);const N=sb.window.__STORYWORLD_NAV_R176__;
vm.runInContext('showMenu();showUpgrades();',sb);ok('opening menu then upgrades stacks two entries',JSON.stringify(N.stack())==='["showMenu","showUpgrades"]'&&panel==='upgrades');
history.back();ok('back returns to the menu',panel==='menu'&&N.forward().length===1);
history.forward();ok('forward reopens upgrades',panel==='upgrades');
history.back();history.back();ok('back from the first window closes it',sb.modal===false&&N.stack().length===0);
history.back();ok('back with no window open opens the menu instead of leaving the page',panel==='menu'&&sb.modal===true);
vm.runInContext('closePanel()',sb);ok('closing with the X keeps history in sync (stack cleared)',N.stack().length===0&&sb.modal===false);
vm.runInContext('showJournal()',sb);sb.storyScene={};const before=panel;history.back();ok('back is ignored while a story scene is shown',panel===before);
// ---- R176 검수 수정(정적) ----
{const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
 ok('golden-thread orbit checks the wall along the whole step and stops moving once blocked',/if\(!o\.stuck\)try\{let ok=true/.test(C('hero-threads-r174.js'))&&/o\.stuck=true/.test(C('hero-threads-r174.js')));
 ok('a new memory note is pushed to the live room.props (not the array replaced by filter)',/\(room\.props\|\|\(room\.props=\[\]\)\)\.push\(\{id:'r169:note:'/.test(C('play-r169.js'))&&!/[^.]props\.push\(\{id:'r169:note:'/.test(C('play-r169.js')));
 ok('co-op: squared cost, effect boost and merged cards are solo-only (host/guest stay in sync)',/if\(!prefs\.square\|\|!solo\(\)\)return 1/.test(C('upgrades-r169.js'))&&/prefs\.boost!==false&&solo\(\)/.test(C('upgrades-r169.js'))&&/if\(!prefs\.merge\|\|!solo\(\)\)return/.test(C('upgrades-r169.js')));}
{const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),w={};new Function('window',C('samong-text-r103.js'))(w);const rp=w.__STORYWORLD_SAMONG_TEXT_R103__.sections.record.blocks[0].paras,cut=rp.findIndex(t=>/^에필로그\s*—/.test(t));
 ok('canon epilogue (병원장 talks with 서하, then visits 미카엘라) sits after the medical record in the samong text',cut>0&&rp.slice(cut).join('').includes('내가 직접 한번 만나 보지')&&!rp.slice(0,cut).join('').includes('내가 직접 한번 만나 보지'));
 ok('the record window shows only the record; the epilogue plays as a story scene after it, text unchanged',/findIndex\(t=>\/\^에필로그\\s\*—\/\.test/.test(C('samong-r103.js'))&&/playScenes\(\[\{id:room\.id,record:\{title,narrator:'',chapter:'에필로그'\}/.test(C('samong-r103.js'))&&/text=epi\.slice\(1\)\.join/.test(C('samong-r103.js')));}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
