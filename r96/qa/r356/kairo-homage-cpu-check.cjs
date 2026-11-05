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

// 엔진의 실제 발자국 판정 함수(index.html 에서 그대로 떼어 온다)
const ENG=(()=>{const lines=idx.split('\n');const a=lines.findIndex(l=>l.startsWith('function lockPatternFootprint154('));const b=lines.findIndex(l=>l.startsWith('function footprintContains154('));let e=b;while(lines[e].trim()!=='}')e++;
 return 'const finite=(v,f=0)=>Number.isFinite(+v)?+v:f,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy)}\n'+lines.slice(a,e+1).join('\n');})();
function world(opt={}){const store={};if(opt.off)store['storyworld.r356.kairo']='0';
 const W={__STORYWORLD_COOP_SIM_R62__:opt.coopApi||{mode:()=>opt.coop||null},...(opt.win||{})};const floats=[];
 const G=new Function('window','localStorage','performance','setTimeout','clearTimeout','document','floatsOut','audioIn',`
  let time=1,room=${JSON.stringify(opt.room||{id:'kair02',layer:'STORY',enemies:[]})},player={x:10,y:10,hp:100,hero:${JSON.stringify(opt.hero||'seoha')},blinkCD:2,specialCD:.3};
  let hazards=[],projectiles=[],effects=[],settings={sound:true,volume:.7},audioContext=audioIn,masterGain=null,stopCalls=0;
  function stopEffects(){stopCalls++;}
  ${opt.engine===undefined?ENG:opt.engine}
  function clearLine(a,b){return true;}
  function floatText(t,x,y,c){floatsOut.push(t);}
  // 엔진 tick() 과 같은 순서(index.html tick: time+=dt → … → tickEnemies(dt) → tickHazards(dt)). tickHazards 는 h.age 만 올린다.
  function tickHazards(dt){for(const h of hazards)h.age+=dt;}
  // 적 공격 상태기계: 엔진 tickEnemies(1121·1125·1126·1128·1129)와 같은 cd 덮어쓰기. sim 표시된 적만 돈다(기존 판정 검사의 cd 를 건드리지 않게).
  function tickEnemies(dt){for(const e of room.enemies){if(!e.sim||e.hp<=0)continue;e.cd-=dt;if(e.rest>0){e.rest-=dt;continue;}
   if(e.r61Action){if(time>=e.r61Action.endAt){delete e.r61Action;e.cd=Math.max(e.cd,.4);}continue;}
   if(e.attack){e.attack.elapsed+=dt;if(e.attack.elapsed>=e.attack.total){e.attack=null;e.cd=.55;}continue;}
   if(e.rangedWindup>0){e.rangedWindup-=dt;if(e.rangedWindup<=0){e.cd=2.1;}continue;}
   if(e.cd<=0&&time>=(e.waitUntil||0)){(e.starts||(e.starts=[])).push(+time.toFixed(3));if(e.ai==='ranged')e.rangedWindup=.55;else e.attack={elapsed:0,total:1};}}}
  function drawEffect(e){return 'base';}
  ${src};
  return {get time(){return time},set time(v){time=v},get player(){return player},set player(v){player=v},settings,stop:()=>stopEffects(),get stopCalls(){return stopCalls},room,get hazards(){return hazards},set hazards(v){hazards=v},projectiles,effects,tick:dt=>{time+=dt;tickEnemies(dt);return tickHazards(dt);},draw:e=>drawEffect(e),api:window.__STORYWORLD_KAIRO_HOMAGE_R356__};`)(
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
assert(/storyPatternTouches5\(hazard,x,y\)\{return footprintContains154\(lockPatternFootprint154\(hazard\),x,y\);\}/.test(idx));
// 1) story-pattern 선(line) 공격: 반경 원 밖이지만 선 위에 있다가 빠져나가면 발동, 원 안이지만 선 밖이면 발동 안 함
const linePat=(x0)=>({type:'story-pattern',x:x0,y:10,originX:x0,originY:10,angle:0,radius:6,width:.4,age:0,warning:.5,life:1.6,damage:20,storyPattern5:{shape:'line'},row150:{stage:'warning',warningAt:1,releaseAt:1.5,impactAt:1.5}});
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
// --- Codex 리뷰 2차(4482321004·4482321017) + 위험지대 종류 전수 점검 ---
// 위험지대 종류마다 엔진이 실제로 쓰는 안쪽 판정(패딩·발 위치 보정 포함)과 착탄 시각을 그대로 따라가는지 본다.
assert(/function pulse\(h,index\)\{[^\n]*footprintContains154\(geometry\(h\),player\.x,player\.y-\.15,\.25\)/.test(idx));
assert(/const h=\{id:m\.id,type:'medical20',owner:e\.id,x:target\.x,y:target\.y,age:0,warning,life:endAt-start,damage:budget,footprint154:g,/.test(idx));
assert(/footprintContains154\(g,player\.x,player\.y-\.15,\.12\)&&clearLine\(\{x:h\.x,y:h\.y\},player\)/.test(idx));
assert(/__STORYWORLD_BOSS_FIELDS_R62__=Object\.freeze\(\{[^}]*\btouches\b/.test(idx));
assert(/touches=footprintContains154\(g,player\.x,player\.y,h\.type==='beam'\?\.25:0\);\}else touches=distance\(player,h\)<h\.radius;/.test(idx));
ok('engine predicates the passive mirrors are still the ones in index.html (medical20 pulse, R61 field, R62 touches, base beam/field/radius)');
// 엔진 make() 그대로의 medical20(반경 없음·footprint154 만, row150 없음=일반 몹)
const med=(kind,{x=10,y=10,warning=.4,flight=.3,cancelled=false,released=true,origin={x:6,y:10}}={})=>{const start=1,releaseAt=start+warning,impactAt=releaseAt+flight,radius=kind==='poison'?1.1:kind==='shock'?1.05:.175,angle=Math.atan2(y-origin.y,x-origin.x);
 const g=Object.freeze(kind==='tools'?{shape:'capsule',x:origin.x,y:origin.y,originX:origin.x,originY:origin.y,angle,radius:28,width:.175}:{shape:'circle',x,y,radius});
 const m={kind,start,releaseAt,impactAt,endAt:impactAt+1.3,budget:20,spent:0,released,cancelled,origin,target:{x,y}};return {id:'m'+kind,type:'medical20',owner:'e1',x,y,age:0,warning,life:m.endAt-start,damage:20,footprint154:g,medical20:m,cast150:null,row150:null};};
const run=(G,h,{from,to,steps=8,leaveAt=2,dt=.1})=>{Object.assign(G.player,from);G.hazards.push(h);for(let i=0;i<steps;i++){if(i===leaveAt)Object.assign(G.player,to);G.tick(dt);}return G.api.inspect().stats.triggers;};
// 4482321004: 반경이 없는 medical20 — 엔진 pulse() 처럼 발 위치 y-.15·몸 반경 .25 를 더해 footprint 로 본다
{const G=world();assert.strictEqual(run(G,med('poison'),{from:{x:10,y:11.45},to:{x:13,y:11.45}}),1);ok('medical20 poison (footprint154 only, no radius): standing at the padded/offset edge then leaving before impact triggers');}
{const G=world();assert.strictEqual(run(G,med('poison'),{from:{x:10,y:11.55},to:{x:13,y:11.55}}),0);ok('medical20 poison: just outside the engine pulse footprint (y-.15, +.25) is not "inside"');}
{const G=world();assert.strictEqual(run(G,med('shock',{flight:0}),{from:{x:10,y:10.2},to:{x:12,y:10.2}}),1);ok('medical20 shock: escape triggers at its impactAt');}
{const G=world();assert.strictEqual(run(G,med('poison',{warning:.2,flight:.5}),{from:{x:10,y:10},to:{x:13,y:10},leaveAt:3,steps:9}),1);ok('medical20 poison: leaving during flight (after releaseAt=warning, before impactAt) still counts — landing time is medical20.impactAt');}
{const G=world();assert.strictEqual(run(G,med('tools',{flight:0}),{from:{x:12,y:10.15},to:{x:12,y:11.5}}),1);ok('medical20 tools: stepping out of the capsule lane before release triggers');}
{const G=world();assert.strictEqual(run(G,med('poison',{cancelled:true}),{from:{x:10,y:10},to:{x:13,y:10}}),0);ok('cancelled medical20 never triggers');}
{const G=world();assert.strictEqual(run(G,med('poison',{released:false}),{from:{x:10,y:10},to:{x:13,y:10}}),0);ok('medical20 that never released (no pulse) does not trigger');}
// R61 던진 장판: damage 0, 남은 예산(remaining)으로 피해 — 착탄은 r61Field.impactAt, 판정은 y-.15·.12
const r61=(o={})=>({id:'r61',type:'field',owner:'e1',x:10,y:10,radius:1.45,age:0,warning:.6,life:4,damage:0,lastHit:-99,r61Field:{action:{start:1,cancelled:!!o.cancelled},impactAt:1.6,endAt:5,remaining:o.remaining??14,pulses:0,released:o.released??true}});
{const G=world();assert.strictEqual(run(G,r61(),{from:{x:10,y:11.65},to:{x:13,y:11.65},leaveAt:3}),1);ok('R61 thrown field (damage 0, budget in r61Field.remaining): escape triggers using the engine pulse footprint (y-.15, +.12)');}
{const G=world();assert.strictEqual(run(G,r61(),{from:{x:10,y:11.75},to:{x:13,y:11.75},leaveAt:3}),0);ok('R61 field: outside the y-.15/+.12 footprint is not inside');}
{const G=world();assert.strictEqual(run(G,r61({released:false}),{from:{x:10,y:10},to:{x:13,y:10},leaveAt:3}),0);ok('R61 field that was never released does not trigger');}
// R62 보스 공성 장판: 엔진이 내보인 touches(h,p)(칸·안전지대·벽) 그대로
{let calls=0;const W={__STORYWORLD_BOSS_FIELDS_R62__:{touches:(h,p)=>{calls++;return h.r62Field.cells.some(c=>c[0]===Math.floor(p.x)&&c[1]===Math.floor(p.y-.15));}}};
 const mk=()=>({id:'r62',type:'field',owner:'e1',x:10.5,y:10.5,radius:3,age:0,warning:.6,life:4,damage:0,lastHit:-99,r62Field:{impactAt:1.6,endAt:5,start:1,cells:[[10,10]],safe:[],released:true,remote:false}});
 {const G=world({win:W});assert.strictEqual(run(G,mk(),{from:{x:10.5,y:10.5},to:{x:11.5,y:10.5},leaveAt:3}),1);assert(calls>0);ok('R62 siege field (damage 0): escape uses the engine-exported touches() (cell grid)');}
 {const G=world({win:W});assert.strictEqual(run(G,mk(),{from:{x:11.5,y:10.5},to:{x:14,y:10.5},leaveAt:3}),0);ok('R62: inside the radius but off the claimed cells is not inside');}}
// 엔진 바탕 tickHazards: beam=capsule+.25, field=원+0, 그 밖(운석 R241·R251 손·R330 재해 등)=distance<radius
{const G=world();assert.strictEqual(run(G,{id:'b',type:'beam',x:5,y:10,angle:0,reach:25,width:.38,age:0,warning:.5,life:1.6,damage:9,lastHit:-99},{from:{x:12,y:10.6},to:{x:12,y:12}}),1);ok('beam: inside the capsule incl. +.25 body radius, then out → triggers');}
{const G=world();assert.strictEqual(run(G,{id:'f',type:'field',x:10,y:10,radius:1.7,age:0,warning:.5,life:1.6,damage:9,lastHit:-99},{from:{x:11.75,y:10},to:{x:14,y:10}}),0);ok('field: engine uses no body padding — 1.75 from a 1.7 field is outside');}
for(const type of ['meteor-r241','r251-hands','r330-magma','r330-bomb']){const G=world();assert.strictEqual(run(G,{id:type,type,x:10,y:10,radius:1.2,age:0,warning:.5,life:1,damage:9,lastHit:-99},{from:{x:10.9,y:10},to:{x:13,y:10}}),1,type);}
ok('overlay radius hazards (meteor-r241, r251-hands, r330-*) use the engine radius test');
// 피해 없는 표식·주인 없는 저작 패턴은 탈출로 치지 않는다(엔진이 때리지 않는다)
{const G=world();assert.strictEqual(run(G,{...linePat(10),row150:undefined},{from:{x:14,y:10},to:{x:14,y:11.5}}),0);ok('story-pattern without row150 (engine never hits it) does not trigger');}
{const G=world();assert.strictEqual(run(G,{...linePat(10),row150:{stage:'cancel',warningAt:1,releaseAt:1.5,impactAt:1.5}},{from:{x:14,y:10},to:{x:14,y:11.5}}),0);ok('cancelled authored cast does not trigger');}
for(const h of [{type:'field',r74Residue:true},{type:'r330-zone-burn',r330Zone:true},{type:'persona-warning150',personaWarning150:{}}]){const G=world();assert.strictEqual(run(G,{id:'z',x:10,y:10,radius:1.5,age:0,warning:.5,life:2,damage:0,lastHit:-99,...h},{from:{x:10,y:10},to:{x:13,y:10}}),0,h.type);}
ok('damage-0 markers (R74 residue, R330 status zone, persona warning) never trigger');

// 4482321017: 공격 도중인 적도 '다음 공격'이 0.7초 늦어진다(엔진이 공격 끝에 cd 를 덮어써도)
const startsWith=(hero,enemy,{steps=60,dt=.05,winApi}={})=>{const G=world({hero,win:winApi});const e={x:11,y:10,hp:50,sim:true,...enemy};G.room.enemies.push(e);G.tick(dt);escape(G);for(let i=0;i<steps;i++)G.tick(dt);return {e,G};};
const gap=(a,b,i)=>+(a.e.starts[i]-b.e.starts[i]).toFixed(3);
// 틱(0.05초) 단위로 시작하므로 0.7초 ± 한 틱(엔진도 프레임 단위로 cd<=0 을 본다). 옛 코드는 0(늦춤이 사라짐)이 나온다.
const near7=g=>assert(Math.abs(g-.7)<=.05+1e-9,'gap '+g);
{const base=startsWith('hwando',{cd:.2,attack:{elapsed:0,total:1}}),got=startsWith('seoha',{cd:.2,attack:{elapsed:0,total:1}});
 assert.strictEqual(got.G.api.inspect().stats.triggers,1);near7(gap(got,base,0));ok('melee attack in progress (e.attack.elapsed): next attack still starts 0.7s later after the engine resets cd');}
{const base=startsWith('hwando',{cd:0,ai:'ranged',rangedWindup:1},{steps:100}),got=startsWith('seoha',{cd:0,ai:'ranged',rangedWindup:1},{steps:100});near7(gap(got,base,0));ok('ranged windup in progress (e.rangedWindup): next attack 0.7s later');}
{const base=startsWith('hwando',{cd:.3,r61Action:{endAt:1.7}}),got=startsWith('seoha',{cd:.3,r61Action:{endAt:1.7}});near7(gap(got,base,0));ok('R61/R62 motion-owned action in progress (e.r61Action): next attack 0.7s later');}
{const base=startsWith('hwando',{cd:-3,waitUntil:1.7}),got=startsWith('seoha',{cd:-3,waitUntil:1.7}),at=got.G.api.inspect().log.find(r=>r.kind==='time-control').at;
 assert(Math.abs(base.e.starts[0]-1.7)<.051&&got.e.starts[0]-at>=.7-.05-1e-9,JSON.stringify([base.e.starts,got.e.starts,at]));ok('idle enemy whose cd already ran negative (waiting for range) cannot attack for 0.7s after 시간 제어');}
{const base=startsWith('hwando',{cd:.1,rest:.9}),got=startsWith('seoha',{cd:.1,rest:.9});/* 엔진은 rest 가 0 이 된 틱을 건너뛰고 다음 틱에 공격하므로 한 틱 더 흔들린다 */assert(Math.abs(gap(got,base,0)-.7)<=.1+1e-9,'gap '+gap(got,base,0));ok('resting enemy (e.rest longer than cd): next attack 0.7s later');}
{const st=new Map(),api={major:e=>!!e.major,ownerState:e=>{if(!st.has(e))st.set(e,{next:0});return st.get(e);}};const got=startsWith('seoha',{cd:5,major:true},{winApi:{__STORYWORLD_BOSS_FIELDS_R62__:api},steps:1});
 const s=st.get(got.e);assert(s&&Math.abs(s.next-(got.G.time-.05+.7))<.06);ok('R62 siege boss schedule (ownerState.next, not gated by cd) is pushed 0.7s too');}
const bgm=['bgm-map-r308.js'].map(f=>RT(f));assert(!bgm.some(s=>/kairo-homage|R356/.test(s)));assert(!/audioCatalog|musicElement|__STORYWORLD_BGM__/.test(code));ok('classical BGM tables and decks untouched');
console.log(JSON.stringify({ok:true,checks:n,method:'CPU fake globals; headless separately; sound quality unverified'}));
