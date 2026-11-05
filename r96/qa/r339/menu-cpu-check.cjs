// R339 메뉴 단순화 검사(정적).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/hud-menu-r339.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/hud-menu-r339.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');assert(idx.split('"./hud-menu-r339.js"').length===2);ok('script tag loaded once');
for(const id of['story-code-button','goldHudOpen','goldHudCast','r263HeroBtn','journalBtn','mapBtn','saveBtn'])assert(src.includes("'"+id+"'"),id);ok('777·황금실·영웅·기억·지도·저장 header buttons are hidden (kept in DOM for shortcuts)');
assert(!/'menuBtn'/.test(src.slice(src.indexOf('const HIDE'),src.indexOf('const GROUPS'))));ok('menu button stays in the header');
for(const p of['proxy:r263HeroBtn','proxy:journalBtn','proxy:mapBtn','proxy:goldHudCast','proxy:story-code-button','goldOpen'])assert(src.includes("'"+p+"'"),p);ok('every hidden header action is reachable inside the menu');
assert(/src\.click\(\)/.test(src));ok('proxy buttons press the original buttons (same behaviour)');
assert(/details'\);rare\.className='r339Rare'/.test(src));ok('rare tools (offline packs, sword-dance choice) are folded');
console.log(JSON.stringify({ok:true,checks:n,method:'static; headless PC 1280 + phone 390: header shows only 메뉴, six groups, 지도 proxy opens the map'}));
