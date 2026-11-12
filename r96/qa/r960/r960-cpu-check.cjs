// R960 무한 생존 효과음 디버깅 CPU 검사(사용자 2026-11-12 14:09Z "무한생존모드 효과음디버깅").
//  공개판 측정(2지역 345초, sound() 536회)에서 나온 두 가지를 본다.
//  ① 생존 전용 사건이 소리 없이 지나감: 조각 줍기·레벨 업·코어 피격·영웅 쓰러짐·코어 파괴(생존이 showDeath 를 가로채 R546 쓰러짐 소리를 건너뜀).
//  ② 회복 차임(swHeal)이 다쳤을 때 0.85초마다 울림: 틱당 최대 체력 0.12% 짜리 실회복도 차임을 불렀다(40초에 178회 요청).
//     → 생존 안에서는 모인 회복량이 최대 체력의 4% 이상이고 앞 차임에서 3초 지났을 때만 울린다.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const sv=CS('survival-r600.js');assert.strictEqual(sv,RT('survival-r600.js'));ok('client-source and runtime copies agree');
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[],querySelector:()=>null};
new Function('window','document','localStorage',sv)(win,doc,{getItem:()=>null,setItem(){}});const A=win.__STORYWORLD_SURVIVAL_R600__,P=A.pure;
// ① 사건 소리
assert(/const snd=\(k,al\)=>\{try\{if\(typeof sound==='function'\)sound\(k,!!al\);\}catch\(_\)\{\}\};/.test(sv),'guarded sound helper');
assert(/stats\.coreHits\+\+;if\(t-coreSndAt>=CORE_SND_GAP\|\|t<coreSndAt\)\{coreSndAt=t;snd\('parry'\);\}/.test(sv),'core hit sound, rate-limited');
assert(/if\(t-gemSndAt>=GEM_SND_GAP\|\|t<gemSndAt\)\{gemSndAt=t;snd\('pickup'\);\}/.test(sv),'shard pickup sound, rate-limited');
assert(/stats\.levels\+=r\.ups;snd\('upgrade'\);/.test(sv),'level-up sound');
assert(/function over\(why\)\{if\(!S\|\|S\.over\)return;snd\('r546Fall',true\);/.test(sv),'fall sound when the run ends (hero or core), allowed over the result panel');
assert(P.SFX&&P.SFX.CORE_SND_GAP>=1&&P.SFX.GEM_SND_GAP>=.25&&P.SFX.GEM_SND_GAP<=.6);ok('survival events call a sound: shard pickup, level-up, core hit, run end — each rate-limited');
// ② 회복 차임 규칙(순수)
assert.strictEqual(typeof P.healCue,'function');const {HEAL_MIN,HEAL_GAP}=P.SFX;assert(HEAL_MIN>=.03&&HEAL_MIN<=.08&&HEAL_GAP>=2.5&&HEAL_GAP<=5);
assert.strictEqual(P.healCue(.0012*1000,1000,10,-9),false,'a 0.12% regen tick alone stays silent');
assert.strictEqual(P.healCue(HEAL_MIN*1000,1000,10,-9),true,'enough accumulated heal chimes');
assert.strictEqual(P.healCue(.5*1000,1000,10,10-HEAL_GAP+.1),false,'no second chime inside the gap, however large');
assert.strictEqual(P.healCue(.5*1000,1000,10,10-HEAL_GAP),true);assert.strictEqual(P.healCue(.5*1000,1000,2,50),true,'game clock reset (new run) does not mute the chime');
assert.strictEqual(P.healCue(5,0,10,-9),false);assert.strictEqual(P.healCue(NaN,1000,10,-9),false);
let plays=0,acc=0,last=-9;for(let t=0;t<40;t+=1/60){acc+=.0012*1000;if(P.healCue(acc,1000,t,last)){plays++;acc=0;last=t;}}
assert(plays>=8&&plays<=40/HEAL_GAP+1,'steady regen: '+plays);ok('heal chime rule: trickle regen is silent until 4% of max HP adds up, at most one chime per '+HEAL_GAP+'s ('+plays+' in 40s of constant regen, was 47)');
assert(/if\(k==='swHeal'&&S\?\.active&&here\(\)\)/.test(sv)&&/sound=function\(k,\.\.\.a\)/.test(sv),'survival-only filter on the engine heal cue');
assert(!/k==='swHeal'[^\n]*soundProfiles\[/.test(sv));ok('filter applies only inside a survival run; story mode and the sound files are untouched');
console.log('R960 survival sfx CPU check: '+n+' groups passed');
