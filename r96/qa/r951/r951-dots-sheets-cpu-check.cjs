// R951 Dots 시트 적용 CPU 검사 (CX-0092NS 결과, 2026-11-13).
// 받은 것: NS-04 충전 빛기둥(조건부 — 끝 섬광에서 뚝 끊기니 코드 감쇠 160ms), NS-05 큰 낙뢰, NS-01 쌍갈래 뇌창(알파 1~16 정리), NS-02 뇌창 착지(타원 납작함 보정).
// NS-06 경보 표식은 기존 r951 검사(안개 중 그린 시트 알파 ≤ .6)와 부딪혀 보류 — 검사를 바꾸지 않고 사용자 확인을 기다린다.
// 계속 코드/기존 시트: NS-03 회로진(루프 이음 HOLD), NS-07·NS-08 독안개(수정 요청 중) → R562 안개 시트 + 코드.
// 시트가 아직 안 읽혔으면 예전 그림(R562 낙뢰·코드 창·코드 표식)으로 그린다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='neon-storm-r951.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const SHEETS={skybeam:['neon-skybeam.webp',1536,2048],bigStrike:['neon-big-strike.webp',1536,3072],lance:['neon-lance.webp',1536,3072],impact:['neon-lance-impact.webp',1536,1024]};
const P=k=>'assets/r951/'+SHEETS[k][0];
for(const k of Object.keys(SHEETS)){const f=path.join(R,'runtime-text',P(k));const ex=fs.existsSync(f);
 ok(k+' sheet exists ('+P(k)+')',ex);if(ex){const b=fs.readFileSync(f);ok(k+' is webp ≤ 600KB',b.slice(0,4).toString()==='RIFF'&&b.slice(8,12).toString()==='WEBP'&&b.length<=600000);}
 ok(k+' path used in module',src.includes(P(k)));}
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'),manifest=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');
ok('all four sheets in runtime-inputs.json and runtime-manifest.json',Object.keys(SHEETS).every(k=>inputs.includes(P(k))&&manifest.includes(P(k))));
ok('runtime copy matches source',fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src);
ok('CI runs this check',/qa\/r951\/r951-dots-sheets-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('R562 strike kept as fallback',/assets\/r562\/neon-lightning-strike\.webp/.test(src));

function env(ready){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,READY:ready};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0;
 var player={hero:'neon',x:10,y:10,hp:100,ap:10};var room={id:'z1',engaged:true,enemies:[],props:[]};var effects=[];
 function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}function blocked(){return false;}function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}
 function damageable3(){return true;}function clearLine(){return true;}function attackPower(){return player.ap;}
 function hitEnemy(e,v,s){e.hp-=v;return true;}function sound(){}function tick(){}function drawEffect(e){}
 function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17+300};}function actorHeight(){return 66;}
 const DIM={'assets/r562/neon-lightning-strike.webp':[1152,768],'assets/r562/neon-toxic-mist.webp':[1152,768]};
 var drawn=[];function readyImage(p){if(!READY(p))return null;const d=DIM[p]||READY(p);return {image:{src:p,naturalWidth:d[0],naturalHeight:d[1],width:d[0],height:d[1]}};}function ensureImages(){return Promise.resolve();}
 var grad={addColorStop(){}};
 var ctx={translate(){},rotate(){},scale(){},setLineDash(){},drawImage(im,...a){drawn.push({src:im.src,a,alpha:ctx.globalAlpha,w:im.width,h:im.height});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},closePath(){},ellipse(){},arc(){},
  fill(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},fillRect(){},createRadialGradient(){return grad;},createLinearGradient(){return grad;},scope(o,f){f();}};`,g);
 vm.runInContext(src,g);return g;}
const A=g=>g.window.__STORYWORLD_NEON_STORM_R951__;
const mob=(id,x,y)=>({id,x,y,hp:1e6,maxHp:1e6,radius:.3});
const hit=(g,id)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),1,{kind:'basic',sourceHero:'neon'})`,g);
// drawEffect 감싸기는 effects 안 감시 객체를 그릴 때 돈다 → 감시 객체를 직접 넘긴다
const draw=(g,dt)=>{vm.runInContext(`time+=${dt};tick(${dt});drawn.length=0;for(const e of effects.slice())drawEffect(e);`,g);return g.drawn.slice();};
const all=()=>true,none=p=>/r562/.test(p);
const dimOf=p=>{for(const k of Object.keys(SHEETS))if(P(k)===p)return [SHEETS[k][1],SHEETS[k][2]];return null;};
const readyNew=p=>/r562/.test(p)?true:dimOf(p);
const sane=d=>d.every(x=>x.a.every(Number.isFinite))&&d.every(x=>{if(x.a.length<8)return true;const [sx,sy,sw,sh]=x.a;return sx>=0&&sy>=0&&sx+sw<=x.w+.5&&sy+sh<=x.h+.5;});

// ---- 천공 낙뢰: 충전 동안 NS-04 빛기둥, 그 뒤 NS-05 큰 낙뢰 ----
{const g=env(readyNew);for(let i=0;i<10;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*3,10+Math.sin(i)*3));A(g).qaForce('storm');hit(g,'m0');
 let beam=[],strikes=[],old=0,bad=false,maxStrikes=0,lastBeamT=-1,beamAlphaEnd=1;const log=[];
 for(let i=0;i<180;i++){const d=draw(g,1/60),t=g.time;if(!sane(d))bad=true;
  const b=d.filter(x=>x.src===P('skybeam'));if(b.length){beam.push({t,fr:b[0].a[1]/1024*6+b[0].a[0]/256,alpha:b[0].alpha});lastBeamT=t;}
  const s=d.filter(x=>x.src===P('bigStrike'));strikes.push(s.length);maxStrikes=Math.max(maxStrikes,s.length);old+=d.filter(x=>/r562\/neon-lightning-strike/.test(x.src)).length;}
 ok('storm: NS-04 skybeam drawn during the charge',beam.length>=10&&beam[0].t<.1);
 const frs=beam.map(b=>b.fr);ok('storm: skybeam frames advance and reach the last (sky flash) frame',frs.every((f,i)=>i===0||f>=frs[i-1])&&Math.max(...frs)===11);
 const atLast=beam.filter(b=>b.fr===11);ok('storm: after the last frame the flash fades out over ~160ms (not cut)',atLast.length>=6&&atLast[atLast.length-1].alpha<.35&&atLast[0].alpha>.8);
 ok('storm: skybeam gone by .75s',lastBeamT>0&&lastBeamT<.75);
 ok('storm: NS-05 big strike drawn, R562 strike not used when NS-05 ready',strikes.some(n=>n>0)&&old===0);
 ok('storm: strike draws ≤ 12 per frame',maxStrikes<=12);
 ok('storm: draw args finite and inside the sheet',!bad);
 ok('no errors (storm)',A(g).inspect().stats.errors===0);}
// 두 파도가 겹칠 때 새 파도가 그려진다(오래된 것부터 잘리면 새 낙뢰가 안 보임)
{const g=env(readyNew);for(let i=0;i<16;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i*2.4)*(2+i*.3),10+Math.sin(i*2.4)*(2+i*.3)));A(g).qaForce('storm');hit(g,'m0');
 let seen=false;for(let i=0;i<150;i++){const d=draw(g,1/60),t=g.time;if(t>1.12&&t<1.2){const s=d.filter(x=>x.src===P('bigStrike'));const fresh=s.filter(x=>x.a[1]===0&&x.a[0]<256*2);if(fresh.length>=8)seen=true;}}
 ok('storm: newest wave (8 targets) is drawn even when older strikes are still fading',seen);}
// 시트 없으면 예전 그림
{const g=env(none);for(let i=0;i<6;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*3,10+Math.sin(i)*3));A(g).qaForce('storm');hit(g,'m0');let old=0,neu=0;
 for(let i=0;i<120;i++){const d=draw(g,1/60);old+=d.filter(x=>/r562/.test(x.src)).length;neu+=d.filter(x=>/r951/.test(x.src)).length;}
 ok('storm fallback: R562 strike when the new sheets are not loaded',old>0&&neu===0);ok('no errors (fallback)',A(g).inspect().stats.errors===0);}

// ---- 쌍갈래 뇌창: 떨어지는 동안 NS-01, 꽂힌 뒤 NS-02 착지 ----
{const g=env(readyNew);g.room.enemies.push(mob('a',13,10));A(g).qaForce('lance');hit(g,'a');let fall=0,imp=0,bad=false,impFr=[];
 for(let i=0;i<150;i++){const d=draw(g,1/60);if(!sane(d))bad=true;fall+=d.filter(x=>x.src===P('lance')).length;const im=d.filter(x=>x.src===P('impact'));imp+=im.length;im.forEach(x=>impFr.push(x.a[1]/256*6+x.a[0]/256));}
 ok('lance: NS-01 spear sheet drawn',fall>0);ok('lance: NS-02 impact sheet drawn after landing',imp>0&&Math.max(...impFr)>=8);ok('lance: draw args finite and inside the sheet',!bad);
 ok('no errors (lance)',A(g).inspect().stats.errors===0);}
{const g=env(none);g.room.enemies.push(mob('a',13,10));A(g).qaForce('lance');hit(g,'a');let neu=0;for(let i=0;i<150;i++)neu+=draw(g,1/60).filter(x=>/r951/.test(x.src)).length;ok('lance fallback: code spear when sheets missing (no r951 draws)',neu===0&&A(g).inspect().stats.errors===0);}

// NS-06 경보 표식은 보류: 아직 코드 표식
{const g=env(readyNew);g.room.enemies.push(mob('a',12,10));A(g).qaForce('fog');hit(g,'a');let n=0;for(let i=0;i<90;i++)n+=draw(g,1/60).filter(x=>/r951/.test(x.src)).length;ok('fog: no r951 sheet yet (NS-06 on hold)',n===0&&A(g).inspect().stats.errors===0);}
console.log(`R951 Dots sheets: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
