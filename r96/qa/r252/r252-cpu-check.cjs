// R252 스킬창 스크롤 유지 · R253 쪽지 자동 넘기기 초(1~60) · R254 시야 자동(미로만 시대에 맞춰 횃불/손전등).
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const store=init=>{const m=new Map(Object.entries(init||{}));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};};
const docStub=(panel)=>({getElementById:id=>id==='panel'?panel:null,querySelector:()=>null,createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{toggle(){}}}),head:{appendChild(){}},body:{appendChild(){}},addEventListener(){}});
// ---- R254 ----
function light(roomObj,stored,era){const sb={console,Math,JSON,Object,Array,Number,String,RegExp,localStorage:store(stored),window:{__STORYWORLD_ERA_R191__:{eraOf:()=>era||null},__STORYWORLD_SAMONG_ZONES_R115__:{zone:id=>({'sz-maze':{kind:'maze',style:'clinical'},'sz-cave':{kind:'maze',style:'ruin'},'sz-fight':{kind:'combat',style:'clinical',dark:true}})[id]||null}},
  document:docStub(null),addEventListener(){},requestAnimationFrame(){},settings:{flashlight58:false},room:roomObj,started:true,player:{x:1,y:1}};vm.createContext(sb);vm.runInContext(C('light-r182.js'),sb);return sb.window.__STORYWORLD_LIGHT_R182__;}
{const L=light({id:'dist01',exploration:{}},null);L.set({mode:'auto'});ok('R254 auto (R335: no longer the default, still selectable): story map (not a maze) → full vision',L.mode()==='full'&&L.choice()==='auto');}
{const L=light({id:'x',samongR103:{zone:'sz-fight',stage:'survival'}},null);L.set({mode:'auto'});ok('R254 auto: samong dark combat zone (not a maze): full vision',L.mode()==='full');}
{const L=light({id:'x',samongR103:{zone:'sz-maze',stage:'maze'}},null);L.set({mode:'auto'});ok('R254 auto: modern maze (school, clinical) → flashlight',L.mode()==='flashlight');}
{const L=light({id:'x',samongR103:{zone:'sz-cave',stage:'maze'}},null);L.set({mode:'auto'});ok('R254 auto: old-era maze → torch',L.mode()==='torch');}
{const L=light({id:'x',samongR103:{zone:'sz-cave',stage:'maze'}},null,'tech');L.set({mode:'auto'});ok('R254 auto: machine-era maze → flashlight',L.mode()==='flashlight');}
{const L=light({id:'dist01',exploration:{}},{'storyworld.r182.light':JSON.stringify({mode:'full'})});ok('R335 a pre-R254 saved choice moves to the new default (glow) once',L.mode()==='glow'&&L.choice()==='glow');}
{const L=light({id:'dist01',exploration:{}},{'storyworld.r182.light':JSON.stringify({mode:'auto',v:254})});ok('R335 the old default (auto, v254) moves to glow once',L.choice()==='glow');}
{const L=light({id:'dist01',exploration:{}},{'storyworld.r182.light':JSON.stringify({mode:'full',v:254})});ok('R335 an explicit v254 choice (full) is kept',L.choice()==='full'&&L.mode()==='full');}
{const L=light({id:'dist01',exploration:{}},{'storyworld.r182.light':JSON.stringify({mode:'torch',v:254})});ok('R254 a manual choice made after R254 is respected',L.mode()==='torch');}
// ---- R253 ----
function collect(stored){const sb={console,Math,JSON,Object,Array,Number,String,Map,Set,localStorage:store(stored),window:{},document:docStub(null),setInterval(){},performance:{now:()=>0},addEventListener(){}};vm.createContext(sb);vm.runInContext(C('story-collect-r177.js'),sb);return sb.window.__STORYWORLD_STORY_COLLECT_R177__;}
{const D=collect(null);ok('R253 default: automatic by text length (unchanged)',D.pageMs(12345)===12345&&D.prefs().secs===0);}
{const D=collect({'storyworld.r177.collect':JSON.stringify({secs:5})});ok('R253 a saved value is used per page (5 s)',D.pageMs(12345)===5000,D.prefs());}
{const D=collect(null);D.set({secs:1});const a=D.pageMs(9000);D.set({secs:60});const b=D.pageMs(9000);D.set({secs:99});const c=D.pageMs(9000);D.set({secs:0});const d=D.pageMs(9000);
 ok('R253 range 1~60 s per page (clamped), 0 = automatic',a===1000&&b===60000&&c===60000&&d===9000,[a,b,c,d]);}
const sc=C('story-collect-r177.js');ok('R253 settings row: select with 자동 + 1~60초, saved in prefs.secs',/id='r253Secs'/.test(sc)&&/for\(let i=1;i<=60;i\+\+\)/.test(sc)&&/set\(\{secs:v\}\)/.test(sc));
ok('R253 samong clue notes (R162) and map notes (R169) use the same setting',/__STORYWORLD_STORY_COLLECT_R177__\?\.pageMs\?\./.test(C('samong-play-r162.js'))&&/__STORYWORLD_STORY_COLLECT_R177__\?\.pageMs\?\./.test(C('play-r169.js')));
// ---- R252 ----
{const h2={childNodes:[{nodeType:3,textContent:'패시브 강화 '}],textContent:'패시브 강화 자동 스킬레벨업: 켜짐'};const panel={scrollTop:0,innerHTML:'',querySelector:q=>q==='h2'?h2:null};
 const sb={console,Math,JSON,Object,Array,Number,String,localStorage:store(null),window:{},document:docStub(panel),setInterval(){},setTimeout:f=>f(),requestAnimationFrame:f=>f(),modal:true,
  openPanel(html){panel.innerHTML=html;panel.scrollTop=0;}};vm.createContext(sb);vm.runInContext(C('auto-levelup-r237.js'),sb);
 panel.scrollTop=480;sb.openPanel('<h2>패시브 강화</h2>');const kept=panel.scrollTop;
 h2.childNodes=[{nodeType:3,textContent:'환경 설정'}];panel.scrollTop=300;sb.openPanel('<h2>환경 설정</h2>');const keptSame=panel.scrollTop;
 sb.modal=false;panel.scrollTop=300;sb.openPanel('<h2>환경 설정</h2>');const fresh=panel.scrollTop;
 ok('R252 buying in the skill window keeps the scroll position (same window redrawn); a freshly opened window starts at the top',kept===480&&keptSame===300&&fresh===0,{kept,keptSame,fresh});}
ok('runtime copies match',['light-r182.js','story-collect-r177.js','samong-play-r162.js','play-r169.js','auto-levelup-r237.js'].every(f=>RT(f)===C(f)));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R252 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
