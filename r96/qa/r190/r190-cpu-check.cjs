// R190 CPU check: CC0 피 튐 자산 출처·해시, 피격·쓰러짐 연결, 설치 스킬 라이선스 기록, 환도 고유기술 섬광 상한.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('fx-blood-r190 loads after edges-r188, before combat-r118',idx.indexOf('./fx-blood-r190.js')>idx.indexOf('./edges-r188.js')&&idx.indexOf('./fx-blood-r190.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches · fx-blood-r190.js',RT('fx-blood-r190.js')===C('fx-blood-r190.js'));
ok('runtime copy matches · skills-r181.js',RT('skills-r181.js')===C('skills-r181.js'));
ok('in the public verify list',/'fx-blood-r190\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')));
const dir=path.join(R,'runtime-text','assets','r190','blood'),ix=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
ok('provenance: OpenGameArt page, author para, CC0, zip sha256 recorded',/opengameart\.org\/content\/animated-particle-effects-2/.test(ix.source)&&ix.author==='para'&&/CC0/.test(ix.license)&&/^[0-9a-f]{64}$/.test(ix.zip_sha256));
ok('three sheets, each file hash/size matches and source hash recorded',Object.keys(ix.effects).length===3&&Object.values(ix.effects).every(m=>{const b=fs.readFileSync(path.join(dir,m.file));return crypto.createHash('sha256').update(b).digest('hex')===m.sha256&&b.length===m.bytes&&/^[0-9a-f]{64}$/.test(m.source_sha256)&&m.columns===4&&m.frame[0]===128;}));
ok('excluded files recorded with reasons (fire cartoonish, teleporter off-style)',ix.excluded&&/만화풍/.test(ix.excluded['fire_*'])&&ix.excluded['teleporter_*']);
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok('runtime manifest lists the script and the three sheets',man.includes('fx-blood-r190.js')&&['blood-splash','blood-burst','blood-death'].every(k=>man.includes('assets/r190/blood/'+k+'.webp')));
const B=C('fx-blood-r190.js');
ok('hooked on real damage (hitEnemy returns true), per-target 0.18s cooldown, max 10 at once, normal blending',/hitEnemy=function\(e,\.\.\.a\)\{const r=base\.apply/.test(B)&&/now-\(last\.get\(e\)\|\|0\)>\.18/.test(B)&&/MAX=10/.test(B)&&!/globalCompositeOperation/.test(B));
ok('drawn inside the three recorder scope and re-armed each tick (R163 pattern), cleared on travel',/ctx\.scope\(\{id:'r190:'/.test(B)&&/tick=function\(\.\.\.a\)\{const r=base\.apply\(this,a\);try\{if\(list\.length\)arm\(\)/.test(B)&&/list\.length=0/.test(B));
ok('hwando special flash capped at 3.3 tiles, faint when the same art overlaps',/e\.size>3\.3\?3\.3\+/.test(C('skills-r181.js')));
// 스킬 기록
const src=fs.readFileSync(path.join(ROOT,'.claude','skills','README-SOURCES.md'),'utf8');
const added=['performance-optimization','game-feel','game-ai','level-design','save-systems','rpg','threejs-scene-setup','create-game-assets','threejs-debug-profiler'];
ok('each added skill exists with SKILL.md and an upstream license file',added.every(n=>fs.existsSync(path.join(ROOT,'.claude','skills',n,'SKILL.md'))&&fs.existsSync(path.join(ROOT,'.claude','skills',n,'LICENSE.upstream'))),added.filter(n=>!fs.existsSync(path.join(ROOT,'.claude','skills',n,'LICENSE.upstream'))));
ok('README-SOURCES records commits, licenses, override rules and the skipped qa-release skill',/19d93f9/.test(src)&&/8286774/.test(src)&&/Apache-2\.0/.test(src)&&/threejs-qa-release/.test(src)&&/덮어 쓰는 규칙/.test(src));
ok('asset record document lists failed downloads honestly',/403/.test(fs.readFileSync(path.join(ROOT,'docs','r190-assets.md'),'utf8')));
ok('parses · fx-blood-r190.js',(()=>{try{new vm.Script(B);return true;}catch(e){return false;}})());
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
