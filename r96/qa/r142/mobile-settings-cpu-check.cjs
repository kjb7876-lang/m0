// R142 CPU check: mobile settings '시작 메뉴로' (confirm → save → title, blocked during scenes/loading), condensed quick settings, wiring.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of['mobile-settings-r142.js','combat-r137.js'])ok(f+' runtime copy matches',fs.readFileSync(path.join(R,'runtime-text',f),'utf8')===C(f));
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads mobile-settings-r142 before audio-r98',/mobile-settings-r142\.js"><\/script><script src="\.\/audio-r98\.js"/.test(html));
ok('public verify list includes mobile-settings-r142',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'mobile-settings-r142.js'"));
const src=C('mobile-settings-r142.js');
ok('condensing only on mobile',/prefs\.on&&mobile\(\)/.test(src));
ok('quick settings keep graphics row and volumes, rest folded into 더 보기',/rows\[0\],vol,more/.test(src)&&src.includes("'moreSettingsR142'"));
ok('R137 box is placed inside the settings panel',/settingsR118'\)\?\.parentElement\|\|document\.getElementById\('detailSettingsR114'\)/.test(C('combat-r137.js')));
function run(state){let titled=0,toasts=[];const sb={window:{__STORYWORLD5__:{returnToTitle:()=>{titled++;return true;}}},localStorage:{getItem:()=>null,setItem(){}},document:{},
 started:true,loading:false,storyScene:null,room:{},confirm:()=>state.confirm!==false,toast:t=>toasts.push(t),showSettings(){},...state.sb};
 vm.createContext(sb);vm.runInContext(src,sb);const r=sb.window.__STORYWORLD_MOBILE_SETTINGS_R142__.toTitle();return{r,titled,toasts};}
let x=run({});ok('confirmed: goes to title through native returnToTitle',x.r===true&&x.titled===1);
x=run({confirm:false});ok('cancelled confirm: stays in game',x.r===false&&x.titled===0);
x=run({sb:{storyScene:{}}});ok('during a story scene: blocked with a notice',x.r===false&&x.titled===0&&x.toasts.length===1);
x=run({sb:{loading:true}});ok('while loading: blocked',x.r===false&&x.titled===0);
x=run({sb:{room:{finalizing:true}}});ok('while the room is finalizing: blocked',x.r===false&&x.titled===0);
x=run({sb:{started:false}});ok('before the game starts: no title jump',x.r===false&&x.titled===0);
const fail=checks.filter(c=>!c.pass);console.log(JSON.stringify({status:fail.length?'FAIL':'PASS',passed:checks.length-fail.length,total:checks.length,fail},null,1));process.exit(fail.length?1:0);
