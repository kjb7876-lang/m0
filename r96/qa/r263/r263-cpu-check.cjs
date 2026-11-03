// R263 — 캐릭터 선택창 바로가기('영웅' 단추) + 선택창 무대(큰 초상화·영웅 색 기운·불티).
//  헤드리스(dist02): 단추 → 창 열림('영웅 변경') → 라우렌 고름(무대 바뀜) → 돌아가기 = 게임으로 / 미카엘라로 변경 성공 /
//  쉼터에서 연 창의 돌아가기 = 원래대로 쉼터 창 / 서사 장면 중엔 열리지 않음 / 휴대폰 폭(420px) 한 줄 배치, 페이지 오류 0.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('hero-select-r263.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('runtime copy matches and is loaded after heroes-r108 (its portraits/roles)',RT('hero-select-r263.js')===src&&RT('index.html').indexOf('hero-select-r263.js')>RT('index.html').indexOf('heroes-r108.js'));
ok('top-bar button goes before 기억 and opens the native hero window (hero change logic untouched)',/nav\.querySelector\('#journalBtn'\)/.test(src)&&/pending=true;stats\.opened\+\+;showHeroes\(false\);/.test(src)&&!/player\.hero\s*=/.test(src));
ok('reads game state directly (top-level let, not window): started/loading/storyScene/modal/player',/typeof started!=='undefined'/.test(src)&&/typeof storyScene!=='undefined'&&storyScene/.test(src)&&/typeof modal!=='undefined'&&modal/.test(src)&&!/globalThis\[/.test(src));
ok('blocked during story scenes, loading, co-op, death',/function canOpen\(\)\{try\{return on&&isStarted\(\)&&!\(typeof loading!=='undefined'&&loading\)&&!\(typeof storyScene!=='undefined'&&storyScene\)&&solo\(\)/.test(src)&&/player\.hp>0/.test(src));
ok('back from a shortcut-opened window returns to the game; a sanctuary-opened window still goes back to the sanctuary',/showHeroes=function\(\.\.\.a\)\{fromField=pending;/.test(src)&&/if\(fromField&&document\.getElementById\('heroBack'\)\)\{fromField=false;stats\.backToGame\+\+;try\{closePanel\(true\);\}/.test(src)&&/closePanel=function\(\.\.\.a\)\{fromField=false;/.test(src));
ok('stage uses existing R108 portraits and each hero colour, falls back to the idle sprite',/portraitPath\?\.\(id\)/.test(src)&&/setProperty\('--c',H\.color/.test(src)&&/heroArt\[id\]\.idle\.front/.test(src));
ok('escapes text into the stage HTML',/const esc=v=>String\(v\?\?''\)\.replace\(\/\[&<>"\]\/g/.test(src));
ok('respects reduced motion and stacks to one column on phones',/prefers-reduced-motion:reduce/.test(src)&&/@media \(max-width:700px\)\{#r263Stage\{grid-template-columns:1fr/.test(src));
ok('no canvas filters used (DOM only — Three recorder safe)',!/ctx\.filter/.test(src));
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R263 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
