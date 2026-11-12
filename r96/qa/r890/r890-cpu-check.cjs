// R890 무한 생존 서사 두 트랙 CPU 검사(사용자 11-12 06:59Z "서사오디오 키기 끄기 … 화면에 길잡이처럼 바로 나타나게 … 전투집중 or 스토리도음미 두가지 트랙").
//  ① 트랙 규칙(순수): 'story' = 음성+자막, 'combat' = 음성 없이 짧은 자막. 옛 설정 {voice:false} 는 전투 집중으로 읽음. 웨이브 길이(narrMinEnd)는 트랙과 무관.
//  ② 위쪽 단추 줄 토글 단추(생존 안에서만) ③ 끄면 지금 읽던 음성도 멈춤 ④ R880 선화 컷씬이 생존 방(같은 id)에서 돌지 않음(스토리용 '한 번 본 기록'을 생존이 써 버리던 것).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const sv=CS('survival-r600.js'),cine=CS('lineart-cine-r880.js');
assert.strictEqual(sv,RT('survival-r600.js'));assert.strictEqual(cine,RT('lineart-cine-r880.js'));ok('client-source and runtime copies agree');
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[],querySelector:()=>null};
new Function('window','document','localStorage',sv)(win,doc,{getItem:()=>null,setItem(){}});const A=win.__STORYWORLD_SURVIVAL_R600__,P=A.pure;
assert.strictEqual(typeof P.trackOf,'function');assert(P.TRACKS&&P.TRACKS.story&&P.TRACKS.combat);
assert.strictEqual(P.trackOf({}),'story');assert.strictEqual(P.trackOf(null),'story');assert.strictEqual(P.trackOf({voice:false}),'combat');assert.strictEqual(P.trackOf({voice:true}),'story');
assert.strictEqual(P.trackOf({track:'combat'}),'combat');assert.strictEqual(P.trackOf({track:'story',voice:false}),'story');assert.strictEqual(P.trackOf({track:'weird'}),'story');
assert.strictEqual(P.TRACKS.story.voice,true);assert.strictEqual(P.TRACKS.combat.voice,false);assert.strictEqual(P.TRACKS.combat.compact,true);
ok('track rule: story = voice+subtitles (default), combat = no voice + compact subtitles; old {voice:false} reads as combat');
assert(/S\.narrMinEnd=Math\.max\(S\.narrMinEnd\|\|0,G\(\(\)=>time,0\)\)\+sum;/.test(sv),'wave length still from sentence length, not voice');
assert(!/narrMinEnd[^;\n]*(track|TRACKS)/.test(sv));ok('wave length (narrMinEnd) does not depend on the track — balance unchanged');
assert(typeof A.track==='function'&&typeof A.setTrack==='function');assert.strictEqual(A.track(),'story');
let saved=null;const win2={};new Function('window','document','localStorage',sv)(win2,doc,{getItem:()=>JSON.stringify({voice:false}),setItem:(k,v)=>{saved=[k,v];}});
assert.strictEqual(win2.__STORYWORLD_SURVIVAL_R600__.track(),'combat');assert.strictEqual(win2.__STORYWORLD_SURVIVAL_R600__.setTrack('story'),'story');
assert.strictEqual(saved[0],'storyworld.r600.survival');const sp=JSON.parse(saved[1]);assert.strictEqual(sp.track,'story');assert.strictEqual(sp.voice,true);
assert.strictEqual(win2.__STORYWORLD_SURVIVAL_R600__.setTrack('nope'),'story');ok('setTrack saves {track,voice} to the same key and ignores unknown values');
assert(/id='r890TrackBtn'|b\.id='r890TrackBtn'/.test(sv));assert(/nav\.topnav/.test(sv));assert(/for\(const x of \[b,sb,mb\]\)x\.style\.display=show\?'':'none'/.test(sv));ok('top bar toggle button exists and shows only inside survival');
assert(/function applyTrack\(\)\{[^}]*__STORYWORLD_VOICE_R381__\?\.stop\?\.\(\)/.test(sv));ok('switching to combat stops the sentence being read aloud');
assert(/!r\.survivalR600/.test(cine.match(/function eligible\(r\)\{[^\n]*\}/)[0]));
{const m=cine.match(/function eligible\(r\)\{[^\n]*\}/)[0];const f=new Function('SCENES','solo','prefs','finished','layer','return ('+m+')')(new Set(['dist01']),()=>true,{seen:[]},()=>false,'STORY');
 assert.strictEqual(f({id:'dist01',layer:'STORY'}),true);assert.strictEqual(f({id:'dist01',layer:'STORY',survivalR600:{}}),false);}
ok('R880 line-art cutscene skips survival rooms (same id) so story mode keeps its first viewing');
// ⑤ 사용자 07:22Z "무한생존모드에서도 효과음이나 배경음 키고 끄는거 자유롭게": 생존 중 위쪽 단추 줄에 효과음·배경음 토글(엔진 설정 settings.sound·music 을 그대로 씀)
{assert(/audioBtn\(n,'r890SfxBtn','sound','효과음'/.test(sv)&&/audioBtn\(n,'r890BgmBtn','music','배경음'/.test(sv),'sfx/bgm buttons');
 const m=sv.match(/function toggleAudio\(k\)\{[\s\S]*?return settings\[k\];\}/);assert(m,'toggleAudio');
 const settings={sound:true,music:true};let stopped=0,shown=[];const f=new Function('settings','stopEffects','toast','trackBtn','fail',m[0]+';return toggleAudio;')(settings,()=>stopped++,(t)=>shown.push(t),()=>{},e=>{throw e;});
 assert.strictEqual(f('sound'),false);assert.strictEqual(settings.sound,false);assert.strictEqual(stopped,1);assert.strictEqual(f('sound'),true);assert.strictEqual(settings.sound,true);
 assert.strictEqual(f('music'),false);assert.strictEqual(settings.music,false);assert.strictEqual(f('music'),true);assert.strictEqual(f('nope'),null);assert(shown.length===4);
 ok('survival top bar toggles sound effects and background music freely (engine settings, effects stop at once)');}
assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r890/r890-cpu-check.cjs'));ok('Pages CPU step');
console.log('R890 CPU check passed '+n);
