// R209 CPU check: 중복 스킬(본편 E=블링크, 미카엘라·기억사수 본편 W=공명방어)을 지우고, 남은 본편 W·R 에 영웅 결 이펙트를 깐다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html'),pos=f=>idx.indexOf('./'+f);
ok('skills-r209 loads after the story W/E/R block and before combat-r118',pos('skills-r209.js')>0&&pos('skills-r209.js')<pos('combat-r118.js')&&idx.indexOf("bindings={z:'w',x:'e',c:'r'}")<pos('skills-r209.js'));
ok('runtime copy matches',RT('skills-r209.js')===C('skills-r209.js'));
ok('in the public verify list and the CI workflow',/'skills-r209\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r209\/r209-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 원래 W/E/R 정의에서 중복 근거 확인
const defs=idx.slice(idx.indexOf(' const defs={'),idx.indexOf("bindings={z:'w',x:'e',c:'r'}"));
ok('every hero E is a dash/escape (same as blink)',(defs.match(/e:\['[^']+',[\d.]+,'(dash|escape)'\]/g)||[]).length===8);
ok('michaela W is shield, gunner W is purify (same as resonance guard)',/michaela:\{w:\['천상 방패',[\d.]+,'shield'\]/.test(defs)&&/gunner:\{w:\['상태 정화',[\d.]+,'purify'\]/.test(defs));
const draws=[];const bindings={z:'w',x:'e',c:'r'};
const sb={console,Math,JSON,String,Number,Object,localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,time:10,zoom:1,TILE:34,player:{hero:'michaela'},
 window:{__STORYWORLD_WER__:{bindings},__STORYWORLD_FX_SPRITES_R106__:{pal:(a,b)=>({a,b}),draw:(n,P,x,y,w,h,o)=>draws.push([n,o&&o.alpha])}},
 document:{getElementById:id=>(sb.btn[id]||(sb.btn[id]={id,hidden:false,style:{display:''}}))},btn:{},
 project:(x,y)=>({x:x*10,y:y*10}),calls:[]};vm.createContext(sb);
vm.runInContext(`function tick(dt){calls.push('tick');} function updateHUD(){} function drawEffect(e){calls.push('draw:'+e.type);} function serializeSave(){return {storyWER:{remaining:{'michaela:e':3,'michaela:w':2,'michaela:r':5}}};}`,sb);
vm.runInContext(C('skills-r209.js'),sb);
// R291(사용자 2026-11-04 "E·W 둘 다 되살리기"): 기본값이 dedupe:false 로 바뀜 — 아래 '기본' 단언만 바뀌고, 예전 동작은 set({dedupe:true}) 뒤에 그대로 확인한다.
ok('R291 default: dedupe off — X (story E) stays bound, Z/C kept',bindings.x==='e'&&bindings.z==='w'&&bindings.c==='r');
vm.runInContext('tick(1/60);updateHUD();',sb);
ok('R291 default: michaela (no R247) E and W not blocked, all buttons shown',!Object.keys(vm.runInContext('player.storyWER.ready',sb)).some(k=>vm.runInContext('player.storyWER.ready',sb)[k]>1e5)&&!sb.btn['story-wer-e'].hidden&&!sb.btn['story-wer-w'].hidden&&!sb.btn['story-wer-r'].hidden);
{const sv0=vm.runInContext('serializeSave()',sb).storyWER.remaining;ok('R291 default: save keeps every slot',sv0['michaela:e']===3&&sv0['michaela:w']===2&&sv0['michaela:r']===5,sv0);}
// R247 이 미카엘라 W·E 를 맡으면 원래 칸은 dedupe 와 상관없이 막힌다(같은 키에 두 기술 금지), 단추는 R247 이 쓰므로 보인다
vm.runInContext("window.__STORYWORLD_MICHAELA_R247__={on:()=>true};tick(1/60);updateHUD();",sb);
{const r=vm.runInContext('player.storyWER.ready',sb);ok('R291: michaela with R247 — original W/E stay blocked (no double cast), buttons shown for R247',r['michaela:e']>1e5&&r['michaela:w']>1e5&&!sb.btn['story-wer-e'].hidden&&!sb.btn['story-wer-w'].hidden,r);
 const sv1=vm.runInContext('serializeSave()',sb).storyWER.remaining;ok('R291: save drops the R247-owned far cooldowns',!('michaela:e' in sv1)&&!('michaela:w' in sv1)&&sv1['michaela:r']===5,sv1);}
vm.runInContext("window.__STORYWORLD_MICHAELA_R247__={on:()=>false};player.storyWER.ready={};",sb);
draws.length=0;vm.runInContext("drawEffect({type:'storySourceSkill',storyWER:true,sourceHero:'michaela',stage:'release',x:3,y:3,age:.2,life:.4,size:8,castId:'wer:1'})",sb);
ok('release draws themed layers (glow, ground ring, stigmata runecross, crosses) then the original art',draws.some(d=>d[0]==='ring')&&draws.some(d=>d[0]==='runecross')&&draws.filter(d=>d[0]==='cross').length===7&&sb.calls.at(-1)==='draw:storySourceSkill',draws.map(d=>d[0]));
draws.length=0;vm.runInContext("drawEffect({type:'storySourceSkill',storyWER:true,sourceHero:'neon',stage:'hit',x:3,y:3,age:.05,life:.22,size:1.1,castId:'wer:2'})",sb);
ok('hit draws a small themed spark (neon bolt)',draws.some(d=>d[0]==='bolt'));
draws.length=0;vm.runInContext("drawEffect({type:'burst',x:1,y:1,age:0,life:.4})",sb);ok('other effects untouched',draws.length===0);
const T=vm.runInContext('window.__STORYWORLD_SKILLS_R209__.THEME',sb);ok('all 8 heroes have a theme with distinct marks or palettes',Object.keys(T).length===8&&new Set(Object.values(T).map(t=>t.mark+t.a)).size===8);
// 토글로 예전 동작(중복 정리) 그대로
vm.runInContext('window.__STORYWORLD_SKILLS_R209__.set({dedupe:true});tick(1/60);updateHUD();',sb);
ok('dedupe:true — X key unbound (E removed for all heroes), Z/C kept',!('x' in bindings)&&bindings.z==='w'&&bindings.c==='r');
{const rd=vm.runInContext('player.storyWER.ready',sb);ok('dedupe:true — michaela: E and W blocked far ahead, R untouched',rd['michaela:e']>1e5&&rd['michaela:w']>1e5&&!('michaela:r' in rd),rd);}
ok('dedupe:true — buttons for removed slots hidden, R shown',sb.btn['story-wer-e'].hidden&&sb.btn['story-wer-w'].hidden&&!sb.btn['story-wer-r'].hidden);
vm.runInContext("player.hero='hwando';tick(1/60);updateHUD();",sb);
ok('dedupe:true — hwando keeps W (월섬 회천) and R; only E blocked',!sb.btn['story-wer-w'].hidden&&sb.btn['story-wer-e'].hidden&&vm.runInContext("player.storyWER.ready['hwando:e']",sb)>1e5&&!('hwando:w' in vm.runInContext('player.storyWER.ready',sb)));
vm.runInContext("player.hero='michaela'",sb);const sv=vm.runInContext('serializeSave()',sb).storyWER.remaining;
ok('dedupe:true — save drops the removed slots, keeps R',!('michaela:e' in sv)&&!('michaela:w' in sv)&&sv['michaela:r']===5,sv);
vm.runInContext('window.__STORYWORLD_SKILLS_R209__.set({dedupe:false});tick(1/60);updateHUD();',sb);
ok('switching dedupe off again restores X and the slots',bindings.x==='e'&&!sb.btn['story-wer-e'].hidden&&vm.runInContext("player.storyWER.ready['michaela:e']",sb)===0);
// 저장값: R291 전에 저장된 dedupe(옛 기본값)는 무시, R291 뒤 set() 으로 저장한 값은 따른다
for(const [stored,exp] of [[{dedupe:true,fx:true},false],[{dedupe:true,fx:true,r291:true},true]]){const b2={z:'w',x:'e',c:'r'};
 const sb2={console,Math,JSON,String,Number,Object,localStorage:{getItem:()=>JSON.stringify(stored),setItem(){}},setTimeout:()=>0,time:10,player:{hero:'hwando'},window:{__STORYWORLD_WER__:{bindings:b2}},document:{getElementById:()=>null}};vm.createContext(sb2);
 vm.runInContext('function tick(){} function updateHUD(){}',sb2);vm.runInContext(C('skills-r209.js'),sb2);
 ok('stored '+JSON.stringify(stored)+' → dedupe '+exp,vm.runInContext('window.__STORYWORLD_SKILLS_R209__.inspect().prefs.dedupe',sb2)===exp&&(exp?!('x' in b2):b2.x==='e'));}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
