// R356 카이로 오마주 — 윤서하 특수 패시브 '시간 제어'와 카이로 구역 소리 판정을 가짜 전역으로 돌린다(GPU·실기기·소리 품질 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');const src=RT('kairo-homage-r356.js');
assert.strictEqual(src,fs.readFileSync(path.join(root,'client-source/kairo-homage-r356.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=RT('index.html'),at=idx.indexOf('"./kairo-homage-r356.js"');
assert(at>0&&idx.split('"./kairo-homage-r356.js"').length===2);assert(idx.indexOf('"./enemy-hexagram-r341.js"')<at&&at<idx.indexOf('"./combat-r118.js"'));ok('script tag once, in the overlay group after enemy-hexagram-r341 and before combat-r118');
const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
assert(!/'rune'|'runecross'/.test(code));assert(!/ctx\.(arc|stroke|lineTo)\(/.test(code));assert(/drawImage\(sh\.img,f\*sh\.cell/.test(code)&&/path:'assets\/r356\/seoha-time-control\.webp',cell:384,frames:10/.test(code));
{const b=fs.readFileSync(path.join(root,'runtime-text/assets/r356/seoha-time-control.webp'));assert(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'&&b.toString('ascii',12,16)==='VP8L');
 const bits=b.readUInt32LE(21),w=(bits&0x3fff)+1,h=((bits>>14)&0x3fff)+1;assert.strictEqual(w,3840);assert.strictEqual(h,384);}
assert(fs.existsSync(path.join(root,'../scripts/r356-seoha-time-sheet.py')));
ok("hero visual is a 10-frame painted strip (384 cells, lossless WebP) from a deterministic generator — no code-drawn lines/circles, no hexagram or magic circle");
assert(/'시간 제어'/.test(src)&&!/[A-Za-z]{3,}'\s*,\s*p\.x/.test(code));ok('on-screen text is Korean (시간 제어)');
const meta=JSON.parse(RT('assets/r356/index.json'));assert(meta.files.length>=10&&meta.files.every(f=>/^[0-9a-f]{64}$/.test(f.sha256)&&f.applied===false&&f.bytes>0));
{const g=meta.generated.find(r=>r.path==='assets/r356/seoha-time-control.webp');const b=fs.readFileSync(path.join(root,'runtime-text',g.path));assert(g.applied===true&&g.bytes===b.length&&g.sha256===require('crypto').createHash('sha256').update(b).digest('hex'));}
assert(!fs.readdirSync(path.join(root,'runtime-text/assets/r356')).some(f=>/\.(mp3|ogg|wav)$/i.test(f)));ok('provenance index lists prototype files with sha256/size; no prototype audio shipped');

function world(opt={}){const store={};if(opt.off)store['storyworld.r356.kairo']='0';
 const W={__STORYWORLD_COOP_SIM_R62__:opt.coopApi||{mode:()=>opt.coop||null}};const floats=[];
 const G=new Function('window','localStorage','performance','setTimeout','clearTimeout','document','floatsOut','audioIn',`
  let time=1,room=${JSON.stringify(opt.room||{id:'kair02',layer:'STORY',enemies:[]})},player={x:10,y:10,hp:100,hero:${JSON.stringify(opt.hero||'seoha')},blinkCD:2,specialCD:.3};
  let hazards=[],projectiles=[],effects=[],settings={sound:true,volume:.7},audioContext=audioIn,masterGain=null,stopCalls=0;
  function stopEffects(){stopCalls++;}
  ${opt.engine||''}
  function floatText(t,x,y,c){floatsOut.push(t);}
  // 엔진 tick() 과 같은 순서: time 을 먼저 올리고 그다음 tickHazards(dt) 가 h.age 만 올린다
  function tickHazards(dt){for(const h of hazards)h.age+=dt;}
  function drawEffect(e){return 'base';}
  ${src};
  return {get time(){return time},set time(v){time=v},get player(){return player},set player(v){player=v},settings,stop:()=>stopEffects(),get stopCalls(){return stopCalls},room,get hazards(){return hazards},set hazards(v){hazards=v},projectiles,effects,tick:dt=>{time+=dt;return tickHazards(dt);},draw:e=>drawEffect(e),api:window.__STORYWORLD_KAIRO_HOMAGE_R356__};`)(
  W,{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},{now:()=>Date.now()},opt.timeout||((f)=>{f();return 1;}),()=>{},{hidden:false},floats,opt.audio||null);
 G.floats=floats;return G;}
const escape=G=>{G.hazards.push({id:1,x:10,y:10,radius:1.2,age:0,warning:.5,life:1.6,damage:20,lastHit:-99});G.tick(.1);G.tick(.1);G.player.x=12;G.tick(.1);G.tick(.1);G.tick(.2);};
{const G=world();G.room.enemies.push({x:11,y:10,hp:50,cd:1},{x:30,y:30,hp:50,cd:1});G.projectiles.push({x:11,y:11,vx:3,vy:0,age:0,life:2},{x:11,y:11,vx:1,vy:1,friendly:true},{x:40,y:40,vx:2,vy:0,life:2});
 escape(G);const s=G.api.inspect();assert.strictEqual(s.stats.triggers,1);assert.deepStrictEqual(G.floats,['시간 제어']);ok('Seoha escaping an enemy telegraph just before it lands triggers 시간 제어');
 assert.strictEqual(G.projectiles[0].vx,0);assert.strictEqual(G.projectiles[0].life,2.7);assert.strictEqual(G.projectiles[1].vx,1);assert.strictEqual(G.projectiles[2].vx,2);ok('only hostile projectiles within 4 tiles freeze (life extended 0.7s)');
 assert.strictEqual(G.room.enemies[0].cd,1.7);assert.strictEqual(G.room.enemies[1].cd,1);ok('nearby enemies next attack delayed 0.7s; far enemies untouched');
 assert(Math.abs(G.player.blinkCD-1.3)<1e-9&&G.player.specialCD===0);ok('blink/special cooldowns refunded 0.7s (floored at 0)');
 assert.strictEqual(G.effects.length,1);assert.strictEqual(G.draw(G.effects[0]),undefined);assert.strictEqual(G.draw({type:'x'}),'base');ok('own effect drawn by the overlay; other effects go to the engine');
 G.tick(.4);assert.strictEqual(G.projectiles[0].vx,0);G.tick(.4);G.tick(.4);assert.strictEqual(G.projectiles[0].vx,3);ok('frozen projectiles resume their velocity after 0.7s');
 escape(G);assert.strictEqual(G.api.inspect().stats.triggers,1);ok('7s cooldown blocks a second trigger');
 for(let i=0;i<40;i++)G.tick(.2);G.player.x=10;escape(G);assert.strictEqual(G.api.inspect().stats.triggers,2);ok('ready again after 7s');}
{const G=world();G.hazards.push({x:10,y:10,radius:1.2,age:0,warning:.3,life:1,damage:20});G.tick(.2);G.tick(.2);assert.strictEqual(G.api.inspect().stats.triggers,0);ok('staying inside (getting hit) does not trigger');}
{const G=world();G.hazards.push({x:13,y:10,radius:1.2,age:0,warning:.3,life:1,damage:20});G.tick(.2);G.tick(.2);assert.strictEqual(G.api.inspect().stats.triggers,0);ok('never inside the telegraph does not trigger');}
{const G=world({hero:'hwando'});escape(G);assert.strictEqual(G.api.inspect().stats.triggers,0);ok('other heroes never get the passive');}
{const G=world({coop:'guest'});G.room.enemies.push({x:11,y:10,hp:50,cd:1});escape(G);assert.strictEqual(G.api.inspect().stats.triggers,1);assert.strictEqual(G.room.enemies[0].cd,1);assert.strictEqual(G.player.blinkCD,2);ok('co-op guest: presentation only, no gameplay writes');}
{const G=world({off:true});G.room.enemies.push({x:11,y:10,hp:50,cd:1});escape(G);assert.strictEqual(G.api.inspect().stats.triggers,0);assert.strictEqual(G.room.enemies[0].cd,1);ok("localStorage storyworld.r356.kairo='0' turns everything off");}
{const G=world();G.hazards.push({x:12,y:12,radius:1,age:0,warning:1,life:2,damage:5});for(let i=0;i<10;i++)G.tick(.1);const s=G.api.inspect();assert(s.kairo&&s.stats.ticks>=3);assert(s.stats.stings===1);ok('Kairo story zone: entry toll once and clock ticks while a nearby telegraph ripens');}
{const G=world({room:{id:'dist02',layer:'STORY',enemies:[]}});G.hazards.push({x:12,y:12,radius:1,age:0,warning:1,life:2,damage:5});for(let i=0;i<10;i++)G.tick(.1);const s=G.api.inspect();assert(!s.kairo&&s.stats.ticks===0&&s.stats.stings===0);ok('outside Kairo zones no Kairo sounds');}
{const G=world({room:{id:'kair02',layer:'DREAM',enemies:[]}});assert.strictEqual(G.api.isKairo(),false);ok('Kairo sounds are story-layer only');}

// --- Codex 리뷰 반영(PR #254) ---
const ENG=(()=>{const lines=idx.split('\n');const a=lines.findIndex(l=>l.startsWith('function lockPatternFootprint154('));const b=lines.findIndex(l=>l.startsWith('function footprintContains154('));let e=b;while(lines[e].trim()!=='}')e++;
 return 'const finite=(v,f=0)=>Number.isFinite(+v)?+v:f,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy)}\n'+lines[a]+'\n'+lines.slice(b,e+1).join('\n');})();
assert(/storyPatternTouches5\(hazard,x,y\)\{return footprintContains154\(lockPatternFootprint154\(hazard\),x,y\);\}/.test(idx));
// 1) story-pattern 선(line) 공격: 반경 원 밖이지만 선 위에 있다가 빠져나가면 발동, 원 안이지만 선 밖이면 발동 안 함
const linePat=(x0)=>({type:'story-pattern',x:x0,y:10,originX:x0,originY:10,angle:0,radius:6,width:.4,age:0,warning:.5,life:1.6,damage:20,storyPattern5:{shape:'line'}});
{const G=world({engine:ENG});G.player.x=14;G.player.y=10;G.hazards.push(linePat(10));G.tick(.1);G.tick(.1);G.player.y=11.5;G.tick(.1);G.tick(.1);G.tick(.2);
 assert.strictEqual(G.api.inspect().stats.triggers,1);ok('story-pattern line: escaping the locked line footprint (outside the radius circle) triggers');}
{const G=world({engine:ENG});G.player.x=10.5;G.player.y=11;G.hazards.push(linePat(10));G.tick(.1);G.tick(.1);G.player.y=12;G.tick(.1);G.tick(.1);G.tick(.2);
 assert.strictEqual(G.api.inspect().stats.triggers,0);ok('story-pattern line: standing beside the line (inside the radius circle) is not an escape');}
{const G=world({engine:ENG});G.hazards.push({...linePat(10),radius:3,storyPattern5:{shape:'safe'}});G.player.x=15;G.tick(.1);G.tick(.1);G.player.x=11;G.tick(.1);G.tick(.1);G.tick(.2);
 assert.strictEqual(G.api.inspect().stats.triggers,1);ok('story-pattern safe-zone: moving into the safe circle counts as escaping');}
// 2) 재사용 기한: 새 게임(새 player·time 0)·이른 세이브에서 막히지 않는다
{const G=world();G.time=1000;escape(G);assert.strictEqual(G.api.inspect().stats.triggers,1);
 G.player={x:10,y:10,hp:100,hero:'seoha',blinkCD:2,specialCD:0};G.time=0;assert.strictEqual(G.api.inspect().readyIn,0);escape(G);assert.strictEqual(G.api.inspect().stats.triggers,2);ok('new game (fresh player, time reset to 0) is not blocked by the old 7s deadline');
 G.time=500;G.player.x=10;assert.strictEqual(G.api.inspect().readyIn,0);escape(G);assert.strictEqual(G.api.inspect().stats.triggers,3);
 G.time=100;G.player.x=10;escape(G);assert.strictEqual(G.api.inspect().stats.triggers,4);ok('same player with time moved backward (earlier save) is not blocked');
 G.player.x=10;escape(G);assert.strictEqual(G.api.inspect().stats.triggers,4);ok('cooldown still holds within the same session');}
// 3) 합성 소리는 stopEffects(탭 숨김·효과음 끔)와 함께 끊긴다
function fakeAudio(){const made=[];const node=()=>({connect(){},disconnect(){this.dc=true;},gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},frequency:{value:0,setValueAtTime(){}},Q:{value:0}});
 const src=()=>{const n=node();n.start=()=>{};n.stop=(t)=>{if(t===undefined)n.killed=true;};made.push(n);return n;};
 return {made,state:'running',currentTime:0,sampleRate:8000,destination:node(),createGain:node,createBiquadFilter:node,createOscillator:src,createBufferSource:src,createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)})};}
{const au=fakeAudio();const G=world({audio:au,timeout:()=>1});assert(G.api.play('toll'));assert(au.made.length>=9&&G.api.inspect().liveSounds===1);
 G.stop();assert(au.made.every(n=>n.killed)&&G.api.inspect().liveSounds===0&&G.stopCalls===1);ok('stopEffects (tab hidden / sound off) also stops already-scheduled synthesized clock ticks');
 G.api.play('tick',1);G.settings.sound=false;G.tick(.1);assert.strictEqual(G.api.inspect().liveSounds,0);ok('turning combat sound off mid-playback silences overlay sounds on the next tick');}
// 4) 협동: 호스트가 윤서하가 아니고 손님이 윤서하일 때 손님이 받는다
{const host={x:20,y:20,hp:100,hero:'hwando',blinkCD:2,specialCD:2,coopIdR62:'h'},guest={x:10,y:10,hp:100,hero:'seoha',blinkCD:2,specialCD:2,coopIdR62:'g'};
 const G=world({coopApi:{mode:()=>'host',livingPlayers:()=>[host,guest],localPlayer:()=>host}});G.player=host;G.room.enemies.push({x:11,y:10,hp:50,cd:1},{x:20,y:21,hp:50,cd:1});
 G.hazards.push({x:10,y:10,radius:1.2,age:0,warning:.5,life:1.6,damage:20});G.tick(.1);G.tick(.1);guest.x=12;G.tick(.1);G.tick(.1);G.tick(.2);
 assert.strictEqual(G.api.inspect().stats.triggers,1);assert(Math.abs(guest.blinkCD-1.3)<1e-9&&host.blinkCD===2);assert(G.room.enemies[0].cd===1.7&&G.room.enemies[1].cd===1);
 assert.deepStrictEqual(G.floats,['시간 제어']);assert(G.effects[0].x===12&&G.effects[0].coopPlayerR62==='g');assert.strictEqual(G.api.inspect().stats.sounds.chime,undefined);ok('co-op host: Seoha guest escaping gets the passive (refund on guest, enemies near guest delayed); effect placed on the guest, no chime on host screen');}
// 5) 엔진 저작 캐스트: warning 은 releaseAt 에서 끝나도 impactAt 기준으로 0.7초 창을 본다
{const G=world();const h={x:10,y:10,radius:1.2,age:0,warning:.3,life:2.5,damage:20,row150:{warningAt:1,releaseAt:1.3,impactAt:2.5}};G.hazards.push(h);
 for(let i=0;i<10;i++)G.tick(.1);assert.strictEqual(G.api.inspect().stats.triggers,0);G.player.x=12;G.tick(.1);G.tick(.1);assert.strictEqual(G.api.inspect().stats.triggers,0);
 G.tick(.1);G.tick(.25);assert.strictEqual(G.api.inspect().stats.triggers,1);ok('native authored cast: leaving during flight (after releaseAt, before impactAt) triggers at impact');}
{const G=world();G.hazards.push({x:10,y:10,radius:1.2,age:0,warning:.3,life:2.5,damage:20,row150:{warningAt:1,releaseAt:1.3,impactAt:2.5}});G.tick(.1);G.player.x=12;for(let i=0;i<16;i++)G.tick(.1);
 assert.strictEqual(G.api.inspect().stats.triggers,0);ok('native authored cast: leaving long before impact (>0.7s) does not trigger');}
const bgm=['bgm-map-r308.js'].map(f=>RT(f));assert(!bgm.some(s=>/kairo-homage|R356/.test(s)));assert(!/audioCatalog|musicElement|__STORYWORLD_BGM__/.test(code));ok('classical BGM tables and decks untouched');
console.log(JSON.stringify({ok:true,checks:n,method:'CPU fake globals; headless separately; sound quality unverified'}));
