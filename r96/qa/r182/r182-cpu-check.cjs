// R182 CPU check: 시야 세 모드(전체 기본·횃불·손전등) · 쪽지 한 장씩 넘기기·바로 펼치기 설정 · 같은 서사 중복 표시 막기 · 쪽지 창 하나로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('light-r182 loaded after skills-r181 and before world-tiles-r118, in the public verify list',idx.indexOf('./light-r182.js')>idx.indexOf('./skills-r181.js')&&idx.indexOf('./light-r182.js')<idx.indexOf('./world-tiles-r118.js')&&/light-r182\.js/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
for(const f of ['light-r182.js','samong-r103.js','story-collect-r177.js','play-r169.js','samong-play-r162.js','story-batch-r139.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
// ---- 시야 ----
const store={};const sb={window:{},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},settings:{flashlight58:true},document:{getElementById:()=>null,querySelector:()=>null},addEventListener(){},requestAnimationFrame(){},Math,JSON,Number,Object,Array,String,Set,Map};vm.createContext(sb);vm.runInContext(C('light-r182.js'),sb);
const L=sb.window.__STORYWORLD_LIGHT_R182__;
ok('default (R335) is glow: bright around the hero, darker with distance; auto/full/torch/flashlight still selectable',L.mode()==='glow'&&L.choice()==='glow'&&JSON.stringify(L.MODES)==='["glow","auto","full","torch","flashlight"]');
L.apply();ok('glow default keeps everything visible (R24 sight limit off)',sb.settings.flashlight58===false);
L.set({mode:'torch'});L.apply();ok('torch still turns the R24 sight on',sb.settings.flashlight58===true);
L.set({mode:'full'});L.apply();ok('full mode turns the R24 sight limit off',sb.settings.flashlight58===false);
L.set({mode:'torch'});ok('torch turns the round R24 sight on and is remembered',sb.settings.flashlight58===true&&/torch/.test(Object.values(store).join()));
L.toggle();ok('L key cycles full → torch → flashlight → full',L.mode()==='flashlight');L.toggle();ok('…back to the start of the cycle (R335 glow default: everything visible)',L.mode()==='glow'&&sb.settings.flashlight58===false);
sb.room={samongR103:{zone:'sz115-S05-4'}};sb.window.__STORYWORLD_SAMONG_R103__={};L.set({mode:'full'});L.set({mode:'torch'});ok('R185: switching full → torch inside samong turns the R24 sight on at once (Codex review)',sb.settings.flashlight58===true);L.set({mode:'full'});delete sb.room;
const sm=C('samong-r103.js');
ok('samong maze: full mode never forces the flashlight; torch draws a round light; flashlight keeps the cone',/forceFlash\(on\)\{if\(!on\)\{restoreFlash\(\);return;\}if\(window\.__STORYWORLD_LIGHT_R182__\?\.mode\?\.\(\)==='full'\)return;/.test(sm)&&/half=torch\?Math\.PI:1\.05/.test(sm)&&/mode\?\.\(\)!=='full';/.test(sm));
ok('settings window gets a 시야 select (full/torch/flashlight)',/id='lightModeR182'/.test(C('light-r182.js'))||/lightModeR182/.test(C('light-r182.js')));
// ---- 쪽지 ----
const sc=C('story-collect-r177.js');
ok('notes turn one page at a time (click / wheel / ◀ ▶), with a settings toggle and an auto-open toggle',/prefs=\{on:true,pages:true,autoShow:true(,secs:0)?\}/.test(sc)&&/addEventListener\('wheel'/.test(sc)&&/data-r182="next"/.test(sc)&&/'r182Pages','pages'/.test(sc)&&/'r182Auto','autoShow'/.test(sc));
const sb2={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({style:{},appendChild(){},addEventListener(){}}),head:{appendChild(){}},body:{appendChild(){}}},setInterval(){},performance:{now:()=>0},innerWidth:1200,Math,JSON,Number,Object,Array,String,Set,Map,Promise,RegExp};vm.createContext(sb2);vm.runInContext(sc,sb2);
const V=sb2.window.__STORYWORLD_STORY_COLLECT_R177__,txt=Array.from({length:7},(_,i)=>'문단'+i+' '+'가'.repeat(150)).join('\n\n'),pg=V.paginate(txt,320);
ok('pagination keeps every paragraph, in order, about 300 chars a page',pg.flat().join('\n\n')===txt&&pg.length>=3&&pg.every(p=>p.join('').length<=480),pg.map(p=>p.join('').length).join(','));
ok('a very long paragraph is split at a sentence end, nothing lost',(()=>{const long='가나다라. '.repeat(200).trim(),q=V.paginate(long,300);return q.flat().join(' ').replace(/\s+/g,' ')===long.replace(/\s+/g,' ')&&q.length>2;})());
sb2.window.__STORYWORLD_PLAY_R169__={book:()=>[{key:'story:STORY:dist01:pre:1'},{key:'r177:A|B'}]};
ok('already-collected scenes are recognised (story:<key> and r177:<k1|k2>)',V.collected('STORY:dist01:pre:1')&&V.collected('B')&&!V.collected('C'));
ok('scene interception drops only scenes not yet collected; all-collected → no popup, progress continues',/const fresh=rows\.filter\(s=>!collected\(s\.key\)\);if\(!fresh\.length\)/.test(sc));
ok('R169 kill notes and R162 clue notes open in the same R177 page viewer',/V\.show\(\{form:/.test(C('play-r169.js'))&&/V\.show\(\{form:'shard'/.test(C('samong-play-r162.js')));
const sb139=C('story-batch-r139.js');
ok('leaving a map stashes un-read queued scenes into the note book (no old-style popup replay), closing flush skips collected ones',/function stash\(list\)/.test(sb139)&&/stash\(queue\)\)\{queue=\[\];\}/.test(sb139)&&/queue\.filter\(s=>!gotIt\(s\.key\)\)/.test(sb139));
for(const f of ['light-r182.js','story-collect-r177.js','story-batch-r139.js'])ok('no mid-line // comment swallowing code · '+f,!C(f).split('\n').some(l=>/[;)}]\s*\/\/[^\n]*[;{}]\s*\S/.test(l)&&!/^\s*\/\//.test(l)&&!/['"`][^'"`]*\/\/[^'"`]*['"`]/.test(l)));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
