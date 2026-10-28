// R108 CPU check: the BGM continuity overlay (audio-r108.js) only maps the approved music paths to
// in-memory object URLs under a byte cap, re-arms a silent-but-wanted deck through unlockAudio()
// with backoff, and writes no catalog, gain, settings or gameplay state.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../../..'),R=p=>path.join(root,p);
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const src=fs.readFileSync(R('r96/client-source/audio-r108.js'),'utf8');
check('guard flag and prerequisites',src.includes("if(window.__STORYWORLD_AUDIO_R108__||typeof musicTick!=='function'||typeof urlFor!=='function'||typeof unlockAudio!=='function')return;"));
check('memory cap 24 MB and bounded retry window',/CAP_BYTES=24\*1024\*1024/.test(src)&&/RETRY_MIN_MS=3000/.test(src)&&/RETRY_MAX_MS=20000/.test(src));
check('no gameplay, settings or catalog writes',!/\b(player|room|enemies|settings|audioCatalog|STORY_BGM_GAINS|mediaPack)\s*(\.[\w$]+|\[[^\]]+\])?\s*=[^=]/.test(src)&&!/\.(hp|x|y|speed|damage)\s*=[^=]/.test(src));
check('object URLs only for music catalog paths, everything else passes to the native urlFor',src.includes('return c?c.url:baseUrl.apply(this,arguments)')&&src.includes("Object.entries(audioCatalog?.music||{})")&&src.includes('if(mediaPack[p])'));
check('low-memory / save-data devices skip the cache',src.includes('saveData===true')&&src.includes('deviceMemory<2'));
check('re-arm only with a prior user activation and never under 400 ms of silence',src.includes('activation()&&t-silentSince>400')&&src.includes('userActivation'));
check('runtime copy present and identical',fs.existsSync(R('r96/runtime-text/audio-r108.js'))&&fs.readFileSync(R('r96/runtime-text/audio-r108.js'),'utf8')===src);
check('loaded before audio-r98.js',/audio-r108\.js"><\/script>[\s\S]*audio-r98\.js"><\/script>/.test(fs.readFileSync(R('r96/runtime-text/index.html'),'utf8')));
// behaviour in a sandbox: wanted + blocked -> one unlockAudio per backoff window; unwanted -> nothing
let unlocks=0,ticks=0,plays=0,clock=0;const w={addEventListener(){},__STORYWORLD_BGM__:{inspect:()=>({selected:'clockwork',blocked:true,decks:[{key:'clockwork',weight:1,paused:true,failed:false}]})}};
const el={paused:true,ended:false,readyState:4,currentTime:0,play(){plays++;return Promise.resolve();}};
const sb=vm.createContext({window:w,document:{hidden:false,addEventListener(){}},navigator:{userActivation:{hasBeenActive:true},deviceMemory:8,connection:{saveData:false}},performance:{now:()=>clock},
 musicTick(){ticks++;},urlFor:p=>'BASE/'+p,cleanPath:p=>p,unlockAudio(){unlocks++;return Promise.resolve(true);},audioAllowed:()=>true,mediaPack:{},audioCatalog:{music:{clockwork:{path:'audio/a.mp3'}}},
 settings:{music:true,bgm:.5},started:false,modal:false,loading:false,musicElement:el,audioUnlocked:true,time:0,fetch:()=>Promise.reject(new Error('offline')),URL:{createObjectURL:()=>'blob:x'},Promise,Number,Math,Map,Object,Array,String,Error,console});
vm.runInContext(src,sb);
check('installs and wraps musicTick / urlFor',typeof w.__STORYWORLD_AUDIO_R108__?.inspect==='function'&&sb.musicTick!==undefined);
check('non-music path falls through to the native urlFor',sb.urlFor('assets/x.webp')==='BASE/assets/x.webp');
sb.musicTick();check('nothing happens while music is not wanted (not started)',ticks===1&&unlocks===0&&plays===0);
sb.started=true;clock=1000;sb.musicTick();clock=1600;sb.musicTick();
check('wanted + blocked + silent for >400 ms -> one unlockAudio re-arm',unlocks===1&&w.__STORYWORLD_AUDIO_R108__.inspect().stats.lastReason==='blocked');
clock=2500;sb.musicTick();check('no second re-arm inside the backoff window',unlocks===1);
clock=1600+3000+10;sb.musicTick();check('re-arm again after the 3 s window, window grows',unlocks===2&&w.__STORYWORLD_AUDIO_R108__.inspect().retry.nextInMs>3000);
// playing normally -> no re-arms, no nudges
w.__STORYWORLD_BGM__.inspect=()=>({selected:'clockwork',blocked:false,decks:[{key:'clockwork',weight:1,paused:false,failed:false}]});el.paused=false;el.currentTime=1;clock+=1000;sb.musicTick();el.currentTime=2;clock+=1000;sb.musicTick();
check('playing deck -> no further re-arms or nudges',unlocks===2&&plays===0);
// stall: time not advancing for >2.5 s while playing -> one play() nudge
clock+=2600;sb.musicTick();check('stalled element (no time advance >2.5 s) -> one play() nudge',plays===1&&w.__STORYWORLD_AUDIO_R108__.inspect().stats.stalls===1);
// modal open -> wanted false -> nothing
sb.modal=true;el.paused=true;clock+=5000;sb.musicTick();check('modal open -> no re-arm or nudge',unlocks===2&&plays===1);
console.log((failed?'FAIL ':'PASS ')+(n-failed)+'/'+n+' r108 audio checks');process.exit(failed?1:0);
