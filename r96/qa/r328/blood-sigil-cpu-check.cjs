// R328 핏빛 육망성 시전 검사 — 관리자 권한(기억 계열) 하얀 육망성 → 핏빛, 원거리 몹·보스 시전 전 허공 마법진.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/play-r169.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/play-r169.js'),'utf8'));ok('client-source and runtime copies agree');
assert(/memory:\{hit:\['rune','glow'\]/.test(src));assert(src.includes("S.draw(a,a==='rune'?BLOOD_SIGIL:PM,"));ok('memory-family hit rune uses the blood palette, not the mob palette');
const m=src.match(/BLOOD_SIGIL=Object\.freeze\(\{a:Object\.freeze\(\[(\d+),(\d+),(\d+)\]\),b:Object\.freeze\(\[(\d+),(\d+),(\d+)\]\)\}\)/);assert(m);
const [ar,ag,ab,br,bg,bb]=m.slice(1).map(Number);assert(ar>ag*4&&ar>ab*4&&br>bg*4&&br>bb*4,'red dominant');ok('blood palette is red-dominant at both ends');
assert(/function sigilTick\(t\)/.test(src)&&/Number\(e\.rangedWindup\)>0/.test(src)&&/major\(e\)&&e\.attack/.test(src));ok('sigil starts on ranged windup and on boss/midboss attack prep');
assert(/sigils\.length>=10/.test(src));ok('at most 10 sigils at once');
assert(/q\.y-h\*\(1\.55/.test(src)&&!/drawSigils[\s\S]{0,900}squash/.test(src.slice(src.indexOf('function drawSigils'))));ok('sigil is drawn upright in mid-air above the caster (no floor squash)');
assert(src.includes('drawSigils(S0,t,h0)')&&src.includes('if(mfx.length||sigils.length)arm()'));ok('sigil draws through the R169 effect sentinel');
assert(src.includes('sigilTick(t);'));ok('sigilTick runs each tick');
console.log(JSON.stringify({ok:true,checks:n,method:'static; headless capture separately; no GPU or device'}));
