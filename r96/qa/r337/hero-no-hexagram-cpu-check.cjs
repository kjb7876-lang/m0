// R337 영웅 스킬·이펙트에 육망성·마법진 금지(사용자 2026-11-05 "플레이어 스킬에는 육망성 절대 사용하면 안 됨, 모두 십자가로" + "마법진 사용 안 하고 오직 십자가만 — 마법진=악마·적, 십자가=J·아군 구원자").
//  R106 'rune' 스프라이트 = 원 + 육망성. 영웅 쪽 파일에서는 'rune' 을 그리거나 고르지 않는다('runecross' 십자 마법진, 'cross' 십자만).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const HERO=['play-r111.js','polish-r101.js','hero-skills-r269.js','skills-r209.js','hero-fx-r102.js','fx-eden-r108.js','fx-d2s-r106.js','skill-fx-r292.js','hero-palette-r302.js','michaela-r247.js','hwando-r242.js','hwando-r271.js','hwando-r277.js','hwando-r283.js','hero-threads-r174.js','threads-r243.js','skills-r181.js','fx-boost-r225.js','hero-visibility-r350.js'];
for(const f of HERO){const p=path.join(root,'client-source',f);if(!fs.existsSync(p))continue;const s=fs.readFileSync(p,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
 assert(!/draw\(\s*'rune'/.test(s),f+": draws 'rune' (hexagram)");assert(!/\[\s*'rune'\s*,/.test(s),f+": picks 'rune' sprite");assert(!/mark:\s*'rune'/.test(s),f+": mark 'rune'");
 assert(!/ready\('rune'/.test(s),f+": waits for 'rune'");assert(!/'runecross'/.test(s),f+": uses a magic circle (runecross)");
 assert.strictEqual(s,fs.readFileSync(path.join(root,'runtime-text',f),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,''),f+' runtime copy');}
ok('hero-side files never draw or pick the hexagram (rune) or a magic circle (runecross) — crosses only');
const s111=fs.readFileSync(path.join(root,'client-source/play-r111.js'),'utf8');assert(/S\.draw\('cross',HOLY/.test(s111));ok('resonance guard (all heroes) is a cross');
assert(/lauren:\['cross',3,\.22\]/.test(fs.readFileSync(path.join(root,'client-source/hero-skills-r269.js'),'utf8')));ok('Lauren rim uses crosses');
assert(/lauren:\{[^}]*mark:'cross'/.test(fs.readFileSync(path.join(root,'client-source/skills-r209.js'),'utf8'))&&/michaela:\{[^}]*mark:'cross'/.test(fs.readFileSync(path.join(root,'client-source/skills-r209.js'),'utf8')));ok('Michaela and Lauren skill marks are crosses');
assert(/s\.draw\('cross',P,ox,oy/.test(fs.readFileSync(path.join(root,'client-source/polish-r101.js'),'utf8')));ok('Lauren orbit orbs are crosses');
console.log(JSON.stringify({ok:true,checks:n,method:'static'}));
