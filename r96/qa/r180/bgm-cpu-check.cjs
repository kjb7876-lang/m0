// R180 CPU check: 'The Sovereign's Last March' 가 제8부(cult*) 보스·중간보스전에서만 고르고, 다른 곳은 기존 곡 그대로.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..','..'),SRC=path.join(ROOT,'client-source'),RT=path.join(ROOT,'runtime-text');
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+String(detail).slice(0,300)));};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const code=fs.readFileSync(path.join(SRC,'bgm-r180.js'),'utf8');
check('client-source and runtime-text copies match',code===fs.readFileSync(path.join(RT,'bgm-r180.js'),'utf8'));
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
check('script tag after audio-r108.js',html.includes('<script src="./audio-r108.js"></script><script src="./bgm-r180.js"></script>'));
check('native select asks the hook once, after safe/awakening, before the persona rule',html.split('__STORYWORLD_BGM_PICK__').length===2&&/return mapping\.awakening;\{let k=null;try\{k=window\.__STORYWORLD_BGM_PICK__\?\.\(group\(\),room\)\|\|null;\}catch\(_\)\{\}if\(k&&audioCatalog\?\.music\?\.\[k\]\)return k;\}\/\* R180 track hook \*\/const boss=/.test(html)&&html.includes("if(boss)return 'timeControl';"));
function sandbox(){
 const sb={console,Math,JSON,Object,Array,Number,String,Boolean,Error};sb.window=sb;
 sb.audioCatalog=null;sb.STORY_BGM_GAINS={timeControl:.396};sb.audioAllowed=()=>true;sb.ticks=0;sb.musicTick=function(){sb.ticks++;};
 vm.createContext(sb);vm.runInContext(code+'\n;this.__get=()=>({audioCatalog,STORY_BGM_GAINS});',sb);
 return sb;}
const sb=sandbox(),api=sb.__STORYWORLD_BGM_R180__,pick=sb.__STORYWORLD_BGM_PICK__;
const row=api.row,file=path.join(RT,row.path.replace(/^\.\//,'')),b=fs.readFileSync(file);
check('processed mp3 matches recorded sha and is under 3.5 MB',sha(b)===row.sha256&&b.length===3432960&&b.length<3.5e6);
check('source sha recorded',row.sourceSha256==='b61b82cc348577d4b53bff181079d508d285a0f884e21ddd3b915ce57a805f9e');
check('loop window inside the track',row.loopStart===0&&row.loopEnd<row.duration&&row.duration>170&&row.crossfade===2.5);
const room=(boss)=>({enemies:[{id:'m',hp:10,spawnState:'active'},...(boss?[boss]:[])]});
check('no catalog yet -> no pick',pick('cult',room({id:'b',boss:true,hp:5,spawnState:'active'}))===null);
sb.audioCatalog={music:{timeControl:{path:'x'}},effects:{}};sb.musicTick();
check('registers on the music tick and calls the base tick',!!sb.audioCatalog.music.sovereignsLastMarch&&sb.ticks===1&&sb.STORY_BGM_GAINS.sovereignsLastMarch===.45&&sb.STORY_BGM_GAINS.timeControl===.396);
check('cult boss active -> march',pick('cult',room({id:'b',boss:true,hp:5,spawnState:'active'}))==='sovereignsLastMarch');
check('cult midboss active -> march',pick('cult',room({id:'b',midboss:true,hp:5,spawnState:'active'}))==='sovereignsLastMarch');
check('cult boss hidden/dead -> no pick',pick('cult',room({id:'b',boss:true,hp:5,spawnState:'hidden'}))===null&&pick('cult',room({id:'b',boss:true,hp:0,spawnState:'active'}))===null);
check('cult without boss -> no pick',pick('cult',room(null))===null);
check('other chapters keep their tracks',['ep1a','ep1b','dist','last','default'].every(g=>pick(g,room({id:'b',boss:true,hp:5,spawnState:'active'}))===null));
sb.audioAllowed=()=>false;
check('offline pack without the file -> no pick',pick('cult',room({id:'b',boss:true,hp:5,spawnState:'active'}))===null);
check('inspect reports no gameplay writes',api.inspect().gameplayWrites===false&&api.inspect().inCatalog===true);
console.log(`R180 BGM CPU check: ${n-failed}/${n} PASS`);process.exit(failed?1:0);
