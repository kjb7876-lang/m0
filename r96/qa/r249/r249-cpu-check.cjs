// R249 — 맵 처음 입장 때 엉뚱한 자리(엔진 기본 15,19 = 보스 전투실 등)를 몇 초 보여 주다 입구로 튀던 문제.
//  엔진 enterRegion 이 자리를 정하고 화면을 여는 순간(banner) R171 rescue 를 바로 돌린다. 실제 이동 시점은 헤드리스 실게임 검사로 따로 잰다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const src=C('story-maps-r171.js'),idx=RT('index.html');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
ok('engine enterRegion opens the screen (closePanel) and then calls banner() after placing the hero',/player\.x=pos\.x;player\.y=pos\.y;[\s\S]{0,200}cam=\{x:player\.x,y:player\.y\}[\s\S]{0,900}closePanel\(true\);banner\(\);/.test(idx));
ok('R171 wraps banner() once to run rescue() right there (same conditions as before: in a wall or a locked boss core)',/if\(typeof banner==='function'&&!banner\.storyMapR249\)\{const b=banner;banner=function\(\.\.\.a\)\{const r=b\.apply\(this,a\);try\{rescue\(\);\}catch\(e\)\{fail\(e\);\}return r;\};banner\.storyMapR249=true;\}/.test(src));
ok('rescue still also runs after the whole enterRegion/restoreSave chain',/enterRegion=async function\(\.\.\.a\)\{const out=await b\.apply\(this,a\);if\(out!==false\)rescue\(\);return out;\}/.test(src)&&/restoreSave=async function\(\.\.\.a\)\{const out=await b\.apply\(this,a\);if\(out!==false\)rescue\(\);return out;\}/.test(src));
ok('rescue moves the camera together with the hero (no pan)',/player\.x=p\.x;player\.y=p\.y;try\{cam=\{x:p\.x,y:p\.y\};/.test(src));
ok('runtime copy matches',RT('story-maps-r171.js')===src);
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax',false,String(e));}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R249 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
