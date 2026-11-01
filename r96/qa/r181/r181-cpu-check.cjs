// R181 CPU check: 스킬 이펙트 정리(상태 칩 합치기·고유기술 큰 그림 밝기·네모 섬광 중복 제거·약한 기본공격 섬광) + 렉(벽 실선·R106 큰 덧셈 조각·혼잡 상한).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('skills-r181 loaded after perf-r180 and before world-tiles-r118, in the public verify list',idx.indexOf('./skills-r181.js')>idx.indexOf('./perf-r180.js')&&idx.indexOf('./skills-r181.js')<idx.indexOf('./world-tiles-r118.js')&&/skills-r181\.js/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
for(const f of ['skills-r181.js','perf-r180.js','fx-sprites-r106.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
// ---- 상태 칩 ----
const wounds={statusRows:()=>[{key:'a',label:'출혈↓',remaining:2,kind:'debuff'},{key:'b',label:'출혈',remaining:3.5,kind:'debuff'},{key:'c',label:'쇠약 · 공격↓',remaining:1,kind:'debuff'},{key:'d',label:'오염 · 중독',remaining:2.2,kind:'debuff'},{key:'e',label:'중독',remaining:1.1,kind:'debuff'},{key:'f',label:'EGO',remaining:2,kind:'buff'}],lifestealEfficiency:()=>1};
const sb={window:{__STORYWORLD_HOSPITAL_WOUNDS_R53__:Object.freeze(wounds)},localStorage:{getItem(){return null;},setItem(){}},setTimeout:(f)=>f(),Math,JSON,Number,Object,Array,Map,Set,String,RegExp};vm.createContext(sb);vm.runInContext(C('skills-r181.js'),sb);
const W=sb.window.__STORYWORLD_HOSPITAL_WOUNDS_R53__,rows=W.statusRows();
ok('wounds API wrapped (other methods kept)',W.__r181===true&&typeof W.lifestealEfficiency==='function');
ok('same debuff from different sources is one chip, keeping the longest time',rows.filter(r=>r.label==='출혈').length===1&&rows.find(r=>r.label==='출혈').remaining===3.5,JSON.stringify(rows));
ok('labels keep the head word only (쇠약 · 공격↓ → 쇠약, 오염 · 중독 → 오염)',rows.some(r=>r.label==='쇠약')&&rows.some(r=>r.label==='오염')&&rows.some(r=>r.label==='중독'),rows.map(r=>r.label).join(','));
ok('buffs are not merged with debuffs and stay',rows.some(r=>r.label==='EGO'&&r.kind==='buff'));
ok('6 rows → 5 chips (one row on screen)',rows.length===5,rows.length);
// ---- 그리기 손질(정적) ----
const s=C('skills-r181.js');
ok('special big art (hero -q, size ≥3) dimmed (R190: ×.6, ×.5 when ≥5, fainter when the same art overlaps) and capped at 3.3, restored after draw',/HERO_Q=\/assets\\\/vfx\\\/heroes\\\/\[a-z\]\+-q\\\.webp\$\//.test(s)&&/const k=\(e\.size>=5\?\.5:\.6\)\*\(same\?/.test(s)&&/e\.size>3\.3\?3\.3\+/.test(s)&&/function withTemp/.test(s)&&/finally\{for\(const \[k,had,v\] of old\)/.test(s));
ok('hero impact art capped at 0.95 × hero height (Hando keeps its own R44/R49 path)',/actorHeight\(\)\*\.95\/Math\.max\(\.01,zoom\)/.test(s)&&/heroOf\(e\)!=='hwando'/.test(s));
ok('square burst skipped only when a hero impact hits the same target within 0.12 s',/f\.type==='e568HeroImpact'&&f\.r7DamageTarget===e\.r7DamageTarget&&Math\.abs\(\(f\.age\|\|0\)-\(e\.age\|\|0\)\)<\.12/.test(s));
ok('faint basic attacks (michaela/seoha/gunner/hunter) get one darkened hero-colour blood burst (R188: not the hit-flash doll sheet), not skills/ultimates',/new Set\(\['michaela','seoha','gunner','hunter'\]\)/.test(s)&&/skill\|ultimate/.test(s)&&/P\.play\('dark-explosion-blood'/.test(s)&&!/P\.play\('hit-flash'/.test(s));
ok('damage, cooldowns and timers untouched (no assignment to hp/specialCD/attackCD/remaining on game objects)',!/\b(hp|specialCD|attackCD|egoCD)\s*=[^=]/.test(s));
// ---- 렉 ----
const p=C('perf-r180.js'),fx=C('fx-sprites-r106.js');
ok('wall hairlines (alpha ≤ .14, thin) skipped only while drawing terrain walls; ctx.stroke restored',/if\(C\.globalAlpha<=\.14&&\(C\.lineWidth\|\|1\)<=2\.5\)/.test(p)&&/finally\{if\(own\)C\.stroke=prev;else delete C\.stroke;\}/.test(p)&&/w\?\.terrainWall/.test(p));
ok('R106 big additive pieces dimmed by area (floor ×.35) and by per-frame additive area over 3 hero areas',/tame=Math\.max\(\.35,1\/ar\)/.test(fx)&&/addArea>3\)\{tame\*=Math\.max\(\.35,3\/addArea\)/.test(fx)&&/addArea=0;/.test(fx));
ok('R106 frame budget tightens ×.73 in crowds over 25 enemies',/crowd>25\?Math\.round\(FB\*\.73\):FB/.test(fx));
// ---- 3D 기록기가 받지 않는 CSS 필터(drop-shadow 등)를 캔버스에 쓰면 'Three.js 실행 실패'로 화면이 꺼진다(R181: 북부 방어선·불탄 거리 큰 꼭두각시) ----
{const bad=[];for(const f of fs.readdirSync(path.join(R,'client-source')).filter(f=>f.endsWith('.js'))){const src=C(f);for(const m of src.matchAll(/\b(?:ctx|c|g|context|cx)\.filter\s*\+?=\s*([^;]{0,300})/g)){for(const lit of m[1].matchAll(/'([^']*)'/g)){const fns=[...lit[1].matchAll(/([a-z-]+)\(/g)].map(x=>x[1]);const no=fns.filter(x=>!['brightness','contrast','saturate','grayscale','hue-rotate','rgba','rgb'].includes(x));if(no.length)bad.push(f+': '+lit[1].slice(0,60));}}}
 ok('canvas ctx.filter strings only use filters the Three.js recorder supports (brightness/contrast/saturate/grayscale/hue-rotate)',!bad.length,bad.join(' | '));}
ok('R161 big puppet: no drop-shadow filter, red glow drawn as an R106 sprite instead',!/ctx\.filter=[^;]*drop-shadow/.test(C('samong-r161.js'))&&/S\.draw\('glow',\{a:\[120,0,18\]/.test(C('samong-r161.js')));
for(const f of ['skills-r181.js','perf-r180.js','fx-sprites-r106.js'])ok('no mid-line // comment swallowing code · '+f,!C(f).split('\n').some(l=>/[;)}]\s*\/\/[^\n]*[;{}]\s*\S/.test(l)&&!/^\s*\/\//.test(l)&&!/['"`][^'"`]*\/\/[^'"`]*['"`]/.test(l)));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
