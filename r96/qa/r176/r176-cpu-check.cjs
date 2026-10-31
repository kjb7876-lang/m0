// R176 CPU check: 뒤로가기·앞으로가기 — 창을 열 때마다 기록, 뒤로 = 앞 창/닫기, 앞으로 = 다시 열기, 창 없을 때 뒤로 = 메뉴, 서사 장면 중 무시.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
ok('nav-r176.js runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','nav-r176.js'),'utf8')===C('nav-r176.js'));
ok('loads after every overlay that wraps openPanel/show* (only combat-r118 and world-tiles-r118, which wrap neither, come after)',/audio-r98\.js"><\/script>(<script src="\.\/story-collect-r177\.js"><\/script><script src="\.\/samong-hud-r177\.js"><\/script>)?<script src="\.\/nav-r176\.js"><\/script>\s*<script src="\.\/combat-r118\.js"><\/script>\s*<script src="\.\/world-tiles-r118\.js"><\/script>\s*$/.test(fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8')));
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
// ---- R177 ----
{const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
 ok('samong-hud-r177 copied, loaded, in the public verify list',fs.readFileSync(path.join(R,'runtime-text','samong-hud-r177.js'),'utf8')===C('samong-hud-r177.js')&&/samong-hud-r177\.js/.test(html)&&fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'samong-hud-r177.js'"));
 const hud=C('samong-hud-r177.js');
 ok('samong cut-in moves to the top-left and stays while samong is on; the short spec (time left / duration, pulse, kill rule, cooldown) lives in the skill bar (EGO button tooltip + time badge), not on the battle screen',/#cutin\{left:14px!important/.test(hud)&&/cutinUntil=Math\.max\(cutinUntil,time\+\.2\)/.test(hud)&&/남은 /.test(hud)&&/재사용 /.test(hud)&&/getElementById\('egoBtn'\)/.test(hud)&&/#r177SkillTip/.test(hud)&&!/r177Spec/.test(hud));
 ok('bottom-left samong icon (R160) and the sky-blue guard ring on the HP orb (R137) are switched off',/\['__STORYWORLD_COMBAT_R160__','samongIcon'\]/.test(hud)&&/\['__STORYWORLD_COMBAT_R137__','guardOrb'\]/.test(hud));
 ok('a samong combat zone does not open while its boss (or boss-grade) is alive, and the HUD says so',/e\.samongBossR170\|\|e\.boss\)\)\)return false/.test(C('samong-zones-r115.js'))&&/를 쓰러뜨려야 문/.test(C('samong-zones-r115.js')));
 ok('frame animation instead of stretched still sprites: tower burst = pixelfx tentacles, midboss blood stele = earth-spike sheet, blood burst = dark explosion sheet, mob hits = sheet only',/if\(!warn&&S&&!pxOn\)/.test(C('combat-r170.js'))&&/PX\.play\('mob-stone'/.test(C('samong-r161.js'))&&/PX\.play\('dark-explosion-blood'/.test(C('samong-r161.js'))&&/!window\.__STORYWORLD_PIXELFX_R163__\?\.has\?\.\('mob-'/.test(C('play-r169.js')));}
{const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),hud=C('samong-hud-r177.js');
 ok('samong zone names: region name / chapter line / entry banner / menu use the samong episode and zone, not the borrowed hub story names',/function samongNames\(\)/.test(hud)&&/updateHUD=function/.test(hud)&&/banner=function/.test(hud)&&/displayRegion=function/.test(hud)&&/'사몽 · '\+n\.ep\+' · '\+n\.zone/.test(hud));
 ok('hero ground-spike pattern plays the earth-spike frame animation (tinted with the hero colours) instead of stretched still spikes; pixelfx has a screen-space frameAt',/function frameAt\(name,u,x,y,o=\{\}\)/.test(C('pixelfx-r163.js'))&&/PX\.frameAt\('mob-stone',v,px,py/.test(C('hero-fx-r102.js')));}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
