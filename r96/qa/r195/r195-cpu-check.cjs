// R195 CPU check: 클래식 BGM — 라이선스·파일 무결성, 지역/보스별 선곡, 페이드·이어 듣기, 대화 더킹, 설정 창 멈춤, 실패 시 원래 엔진으로 물러나기.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html'),SRC=C('bgm-classical-r195.js');
ok('bgm-classical-r195 loads after audio-r108 and before combat-r118',idx.indexOf('./bgm-classical-r195.js')>idx.indexOf('./audio-r108.js')&&idx.indexOf('./bgm-classical-r195.js')<idx.indexOf('./combat-r118.js')&&idx.indexOf('./bgm-classical-r195.js')>0);
ok('runtime copy matches',RT('bgm-classical-r195.js')===SRC);
ok('in the public verify list',/'bgm-classical-r195\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
// ---- 실제 목록: 허용 라이선스·파일·해시·크레딧 ----
const DIR=path.join(R,'runtime-text','assets','audio','bgm','classical'),cat=JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8'));
const ALLOWED=/^(Public domain|PD|CC0|CC BY [0-9.]+)/i,BANNED=/\bNC\b|\bSA\b|NoDerivs|\bND\b/i;
const tracks=Object.entries(cat.tracks);
ok('catalog has tracks and slots',tracks.length>=4&&Object.keys(cat.slots).length>=4,{tracks:tracks.length,slots:Object.keys(cat.slots).length});
ok('every track license is PD/CC0/CC BY (no NC/SA/ND/unclear)',tracks.every(([,t])=>ALLOWED.test(t.license||'')&&!BANNED.test(t.license||'')),tracks.map(([id,t])=>id+':'+t.license));
ok('every track names title, composer, performer, source page and license page',tracks.every(([,t])=>t.title&&t.composer&&t.performer&&/^https:\/\//.test(t.source||'')&&(t.licenseUrl===undefined||/^https?:\/\//.test(t.licenseUrl))));
ok('CC BY tracks carry attribution (author + license url)',tracks.filter(([,t])=>/CC BY/i.test(t.license)).every(([,t])=>t.performer&&t.licenseUrl));
const bad=tracks.filter(([,t])=>{const f=path.join(DIR,t.file);if(!fs.existsSync(f))return true;const b=fs.readFileSync(f);return b.length!==t.bytes||crypto.createHash('sha256').update(b).digest('hex')!==t.sha256;});
ok('every track file exists with the recorded size and sha256',bad.length===0,bad.map(([id])=>id));
ok('every slot points at a known track',Object.values(cat.slots).every(id=>cat.tracks[id]),Object.entries(cat.slots).filter(([,id])=>!cat.tracks[id]));
ok('default explore and combat slots exist (fallback for any zone)',cat.slots['explore:default']&&cat.slots['combat:default']);
const credits=fs.readFileSync(path.join(R,'..','MUSIC_CREDITS.md'),'utf8');
ok('MUSIC_CREDITS.md lists every track title and source',tracks.every(([,t])=>credits.includes(t.title)&&credits.includes(t.source)));
const total=tracks.reduce((a,[,t])=>a+t.bytes,0);ok('total classical audio stays under 40 MB',total<40e6,total);
// ---- 동작(가짜 브라우저) ----
function sandbox(catalog){
 const els=[];class Audio{constructor(){this.paused=true;this.volume=1;this.currentTime=0;this.readyState=4;this.loop=false;this.src='';this.l={};els.push(this);}play(){this.paused=false;this.plays=(this.plays||0)+1;return Promise.resolve();}pause(){this.paused=true;}addEventListener(k,f){this.l[k]=f;}}
 let nativeCalls=0,nativeWithMusicOn=0;const listeners={};
 const sb={window:{},globalThis:null,Audio,performance:{now:()=>sb.__now},__now:1000,Date:{now:()=>sb.__date},__date:1e9,console,
  localStorage:{getItem:()=>null,setItem(){}},document:{hidden:false,querySelector:()=>null,getElementById:()=>null,addEventListener(){},body:{appendChild(){}},createElement:()=>({style:{},appendChild(){},querySelector:()=>({}),addEventListener(){}})},
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(catalog)}),
  settings:{music:true,bgm:.5,volume:.7},started:true,loading:false,modal:false,storyScene:null,voiceElement:null,zone:'dist01',
  regionById:{hub:{safe:true,chapter:'제1부'},dist01:{chapter:'제1부 — 마지막 수호자 EGO'},ep1b04:{chapter:'제2부 — 일곱'},cult04:{chapter:'제8부 — 사이비'}},
  room:{engaged:false,enemies:[]},toast(){},showSettings(){},
  musicTick(){nativeCalls++;if(sb.settings.music)nativeWithMusicOn++;}};
 sb.globalThis=sb;sb.addEventListener=(k,f)=>{listeners[k]=f;};sb.window.addEventListener=(k,f)=>{listeners[k]=f;};
 vm.createContext(sb);vm.runInContext(SRC,sb);
 return {sb,els,listeners,api:sb.window.__STORYWORLD_BGM_CLASSICAL_R195__,native:()=>({nativeCalls,nativeWithMusicOn}),step(ms=100){sb.__now+=ms;sb.musicTick();}};
}
const fake={tracks:{a:{file:'a.ogg',title:'A',composer:'X',gain:.6},b:{file:'b.ogg',title:'B',composer:'Y',gain:.6},boss:{file:'c.ogg',title:'C',composer:'Z',gain:.6},boss2:{file:'d.ogg',title:'D',composer:'Z',gain:.6},calm:{file:'e.ogg',title:'E',composer:'W',gain:.5},dream:{file:'f.ogg',title:'F',composer:'V',gain:.5}},
 slots:{'safe:default':'calm','explore:default':'a','explore:p2':'b','combat:default':'b','boss:default':'boss','boss2:default':'boss2','explore:samong':'dream'}};
(async()=>{
 const T=sandbox(fake);await new Promise(r=>setImmediate(r));const S=T.sb;
 T.step();ok('explore in part 1 picks explore:default',T.api.inspect().active?.id==='a',T.api.inspect());
 ok('native engine is silenced (only ever called with music off) while classical plays',T.native().nativeCalls>0&&T.native().nativeWithMusicOn===0,T.native());
 S.zone='ep1b04';T.step();ok('part 2 picks explore:p2',T.api.inspect().active?.id==='b');ok('switch cross-fades (fading flag)',T.api.inspect().fading);
 for(let i=0;i<40;i++)T.step();ok('fade completes and only one deck stays audible',!T.api.inspect().fading&&T.els.filter(e=>!e.paused).length===1);
 S.zone='hub';T.step();ok('safe region picks calm',T.api.inspect().active?.id==='calm');
 S.zone='cult03';S.room={engaged:false,enemies:[],samongR103:{zone:'sz115-S02-3'}};T.step();ok('a samong room is detected from room.samongR103 even when the global zone is a story id',T.api.inspect().active?.id==='dream');S.room={engaged:false,enemies:[]};S.zone='sz115-S02-3';T.step();ok('samong zone picks explore:samong',T.api.inspect().active?.id==='dream');
 S.zone='cult04';S.room={engaged:true,enemies:[{persona:true,hp:900,maxHp:1000,spawnState:'active'}]};T.step();ok('boss alive + engaged picks boss',T.api.inspect().active?.id==='boss');
 for(let i=0;i<20;i++)T.step();const bossEl=T.els.find(e=>!e.paused);bossEl.currentTime=42;
 S.room.enemies[0].hp=300;T.step();ok('boss under half hp switches to boss2 (phase change)',T.api.inspect().active?.id==='boss2');
 // 보스에게 지고 다시: 탐색으로 돌아갔다가 다시 보스 → 이어서
 S.room={engaged:false,enemies:[]};for(let i=0;i<20;i++)T.step();S.room={engaged:true,enemies:[{boss:true,hp:1000,maxHp:1000,spawnState:'active'}]};S.__date+=30000;T.step();
 const act=T.api.inspect();ok('retrying the boss resumes the boss track where it stopped (no restart from 0)',act.active?.id==='boss'&&act.stats.resumes>=1,act);
 // 대화 더킹, 설정 창 멈춤
 for(let i=0;i<20;i++)T.step();S.modal=true;S.storyScene={id:'x'};for(let i=0;i<20;i++)T.step();ok('dialogue open ducks to ~35% and keeps playing',T.api.inspect().duck<.45&&!T.api.inspect().active.paused,T.api.inspect().duck);
 S.storyScene=null;S.showSettings();T.step();ok('settings panel keeps the music going (R265: continuous, ducked by the open window)',!T.api.inspect().active.paused);
 S.modal=false;T.step();T.step();ok('closing the panel resumes',!T.api.inspect().active.paused);
 S.settings.bgm=0;T.step();ok('BGM volume 0 pauses (existing bgm setting is the volume)',T.api.inspect().active.paused);S.settings.bgm=.5;T.step();
 // 실패한 곡 → 원래 엔진
 const cur=T.els.find(e=>!e.paused);cur.onerror();const before=T.native().nativeWithMusicOn;S.room={engaged:false,enemies:[]};S.zone='dist01';T.step();ok('a failed track is skipped; with no fallback track left the slot still resolves',T.api.inspect().failed.length===1);
 T.api.set({on:false});T.step();ok('turning classical off hands music back to the native engine',T.native().nativeWithMusicOn>before&&T.els.every(e=>e.paused));
 // 목록이 없으면 원래 엔진
 const N=sandbox(null);N.sb.fetch=()=>Promise.reject(new Error('404'));await new Promise(r=>setImmediate(r));N.step();ok('no catalog → native engine plays unchanged',N.native().nativeWithMusicOn>0&&N.els.every(e=>e.paused));
 // 자동재생 막힘 → 다음 입력 때 다시
 const B=sandbox(fake);await new Promise(r=>setImmediate(r));B.els.forEach(e=>{e.play=function(){this.paused=true;return Promise.reject(Object.assign(new Error('no'),{name:'NotAllowedError'}));};});B.step();await new Promise(r=>setImmediate(r));
 ok('autoplay rejection is remembered as blocked',B.api.inspect().blocked);B.els.forEach(e=>{e.play=function(){this.paused=false;return Promise.resolve();};});(B.listeners.pointerdown||(()=>{}))();ok('next pointer/touch gesture retries playback',!B.api.inspect().blocked&&B.els.some(e=>!e.paused));
 ok('settings panel gets the toggle and credits button',/r195On/.test(SRC)&&/r195CreditsBtn/.test(SRC)&&/음악 크레딧/.test(SRC));
 const fails=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
 console.log(JSON.stringify({passed:checks.length-fails.length,total:checks.length}));if(fails.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
