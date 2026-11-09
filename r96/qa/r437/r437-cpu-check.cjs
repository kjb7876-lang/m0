// R437 네온 Q 민트 체인 라이트닝 · 네온/라우렌 새 좌·우 공격 · 네온 새 초상화 — 정적·자산 검사(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='neon-lauren-r437.js',src=C(F),html=RT('index.html');
ok('script tag once, right after combat-flow-r425 and before combat-r118',html.split('"./'+F+'"').length===2&&/<script src="\.\/combat-flow-r425\.js"><\/script><script src="\.\/neon-lauren-r437\.js"><\/script>\s*<script src="\.\/combat-r118\.js">/.test(html));
ok('runtime copy identical to client-source',RT(F)===src);
ok('listed in verify-r96-public.py',/'neon-lauren-r437\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('parses',(()=>{try{new (require('vm').Script)(src);return true;}catch(e){return false;}})());
// ① 민트 체인
ok('mint palette #18A89A → #B8FFF0',/MINT_DARK=\[0x18,0xA8,0x9A\]/.test(src)&&/MINT_LIGHT=\[0xB8,0xFF,0xF0\]/.test(src));
ok('chain uses painted R108 lightning sheet (no stroked lines/arcs)',/assets\/r108\/eden\/lightning\.webp/.test(src)&&!/\.(stroke|arc|lineTo)\(/.test(src));
ok('mint copy marked static for the Three.js recorder, no ctx.filter',/__storyworldStaticSource/.test(src)&&!/ctx\.filter\s*=/.test(src));
ok('each hop drawn under a world-position scope (not buried at depth 0,0)',/ctx\.scope\(meta,run\)/.test(src)&&/kind:'effect',x,y,r437:true/.test(src));
ok('hops follow the actual Q hit targets, nearest-next order',/inQ\.hit\.add\(e\)/.test(src)&&/function order\(origin,targets\)/.test(src));
ok('engine link hidden only while neon Q runs',/if\(inQ&&type==='link'\)/.test(src));
ok('R106 blue chain skipped for neon Q',/__STORYWORLD_NEON_LAUREN_R437__\?\.owns\?\.\(hero,slot\)\)return;/.test(C('fx-d2s-r106.js')));
ok('R411 triangle hit sheet skipped for neon',/__STORYWORLD_NEON_LAUREN_R437__\?\.ownsHit\?\.\(player\.hero\)\)return;/.test(C('skill-sheets-r411.js')));
ok('neon Q white hit flashes dimmed through engine e.alpha (only effects created by the Q cast)',/DIM_TYPES=new Set\(\['burst','e568HeroImpact'/.test(src)&&/e\.alpha=\(Number\.isFinite\(e\.alpha\)\?e\.alpha:1\)\*DIM/.test(src)&&/if\(enabled\)dimNew\(n0\)/.test(src));
ok('no gameplay writes',!/\.hp\s*-?=|specialCD\s*=|\.damage\s*=|saveGame/.test(src));
// ② 공격 시트
for(const h of ['neon','lauren']){const I=JSON.parse(RT('assets/r437/attack/'+h+'/index.json')),E=I.directions.e,B=fs.readFileSync(path.join(R,'runtime-text',E.path));
 ok(h+' attack sheet sha256/bytes match, 6 frames, wide cell',B.length===E.bytes&&crypto.createHash('sha256').update(B).digest('hex')===E.sha256&&E.frames===6&&E.cell[1]===256&&E.cell[0]>192);
 ok(h+' body 180 ±3 on measured frames, foot y 226',I.measured.body_px_non_spear_up_frames.every(v=>Math.abs(v-180)<=3)&&E.foot[1]===226,I.measured);
 ok(h+' rear foot fixed (jitter ≤2 px)',I.measured.rear_foot_x_jitter_px<=2,I.measured);
 ok(h+' tips per frame inside the cell',E.tips.length===6&&E.tips.every(t=>t[0]>=0&&t[0]<=E.cell[0]&&t[1]>=0&&t[1]<=256));
 ok(h+' overlay table matches index.json',new RegExp('"'+h+'":\\{"path":"'+E.path.replace(/\//g,'\\/')+'","cell":\\['+E.cell[0]+',256\\],"foot":\\['+E.foot[0]+',226\\]').test(src));
 ok(h+' source recorded (zip sha256 + 6 frame hashes)',/^[0-9a-f]{64}$/.test(I.source.zip_sha256)&&I.source.frames_png_sha256.length===6);
 ok(h+' original R143 sheets kept',fs.existsSync(path.join(R,'runtime-text','assets/r143/attack/'+h+'/attack-e.webp')));}
const P143=C('attack-anim-r143.js');
ok('R143 place() uses R437 cell/foot/body for attack only',/attackSheet\?\.\(h,sd\)/.test(P143)&&/sourceRect:\[sx,0,CW,256\]/.test(P143)&&/X=v=>fx\+f\*\(v-FX\)\*k/.test(P143)&&/alt\?alt\.body:bodyOf\(im\)/.test(P143));
ok('R425 spear-tip glow uses per-frame R437 tips; neon glow only on R437 frames',/tipFor\?\.\(best\.sourcePath,sr\)/.test(C('combat-flow-r425.js'))&&/neon:\{F:\{a:\[24,168,154\],b:\[184,255,240\]\},k:1\.3,needR437:true\}/.test(C('combat-flow-r425.js')));
// ③ 초상화
const PB=fs.readFileSync(path.join(R,'runtime-text','assets/r437/portrait/neon.webp'));
ok('neon portrait exists (384×512 webp), original R108 portrait kept',PB.slice(0,4).toString()==='RIFF'&&PB.slice(8,12).toString()==='WEBP'&&fs.existsSync(path.join(R,'runtime-text','assets/r108/heroes/neon.webp')));
ok('portrait override through R108 portraitPath',/PORTRAIT=\{neon:'assets\/r437\/portrait\/neon\.webp'\}/.test(src)&&/portraitPath:id=>portraitOn&&PORTRAIT\[id\]/.test(src));
ok('runtime manifest lists new assets',(()=>{const m=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');return ['assets/r437/attack/neon/attack-e.webp','assets/r437/attack/lauren/attack-e.webp','assets/r437/portrait/neon.webp',F].every(p=>m.includes(p));})());
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail||'')));
console.log(`R437 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
