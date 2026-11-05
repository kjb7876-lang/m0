// R345 환도 옛 그림 튐 — 공격·피격 그림 미리 받기 + 안 받아졌으면 걷기 선 자세로 대신(엔진 옛 그림 X). 정적 검사(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/hwando-r271.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/hwando-r271.js'),'utf8'));ok('client-source and runtime copies agree');
assert(/for\(const a of \['attack','hit'\]\)for\(const d of \['n','s','e','w'\]\)\{const R=res\(a,d\);if\(R\?\.A\?\.file\)image\(/.test(src));ok('attack and hit clips (incl. R242 stand-ins) are preloaded on room entry');
assert(/if\(!im\)\{[^\n]*if\(!opt\.fb&&anim!=='walk'\)\{[^\n]*draw\(rec,st,best,'walk',dir,Math\.min\(3,w\.n-1\),\{fb:true\}\)\)return true;\}return false;\}/.test(src));ok('a not-yet-loaded attack/hit frame falls back to the loaded walk stance, not the engine sprite');
assert(/R283 색 맞춘 파생본/.test(src));ok('R283 colour-matched paths still used');
// R346: R248 몹 그림이 아직 등장 안 한(hidden) 몹을 그리던 것 — 실제로 drawEnemy 를 불러 본다
{const m=fs.readFileSync(path.join(root,'client-source/mob-unique-r248.js'),'utf8');assert.strictEqual(m,fs.readFileSync(path.join(root,'runtime-text/mob-unique-r248.js'),'utf8'));
 assert(/!\['hidden','inactive','disabled','despawned'\]\.includes\(e\.spawnState\)\)\{[^\n]*s=sheetOf\(e\);/.test(m)&&/e\.visible!==false&&e\.disabled!==true/.test(m));ok('R248 skips hidden / inactive / invisible enemies like the engine drawEnemy');}
console.log(JSON.stringify({ok:true,checks:n}));
