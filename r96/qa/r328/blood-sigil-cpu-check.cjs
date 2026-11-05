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
{const body=src.slice(src.indexOf('function drawSigils'));const air=body.slice(body.indexOf("y=q.y-h*(1.55"));assert(/q\.y-h\*\(1\.55/.test(src)&&!/S0\.draw\('rune',BLOOD_INK,q\.x,y,[^)]*squash/.test(air)&&!/S0\.draw\('rune',BLOOD_SIGIL,q\.x,y,[^)]*squash/.test(air));}ok('mid-air sigil is drawn upright above the caster (no floor squash)');
assert(/ranged,gx:player\.x,gy:player\.y,pal:palOf\(e,famOf\(\)\)\.main/.test(src)&&/if\(g\.ranged&&Number\.isFinite\(g\.gx\)\)/.test(src)&&/S0\.draw\('rune',BLOOD_SIGIL,q\.x,q\.y,R\*2,R\*2,\{squash:\.5/.test(src));ok('ranged casts also draw a flat blood hexagram on the ground at the aimed spot');
assert(/S0\.draw\('ring',g\.pal,/.test(src));ok('ground sigil inner ring uses the mob unique colour (colour rule)');
assert(src.includes('drawSigils(S0,t,h0)')&&src.includes('if(mfx.length||sigils.length)arm()'));ok('sigil draws through the R169 effect sentinel');
assert(src.includes('sigilTick(t);'));ok('sigilTick runs each tick');
assert(/mfx\.length=0;sigils\.length=0;/.test(src)&&/if\(t<g\.t0\|\|t-g\.t0>g\.draw/.test(src));ok('sigils cleared on enterRegion and dropped when time resets (new game)');
console.log(JSON.stringify({ok:true,checks:n,method:'static; headless capture separately; no GPU or device'}));
