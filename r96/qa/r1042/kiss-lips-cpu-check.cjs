// R1042 CPU 검사: 색욕 보스(붉은 하이힐의 서윤, b05-boss)의 '키스 입술' 공격.
// 사용자 2026-11-15 "색욕보스 키스 입술공격도 추가 적중시 체력66프로 비례데미지" — 현재 체력의 66%(적중 뒤 34% 남음).
// 예고(분홍 고리 프레임 시트) 동안 비키면 안 맞고, 무적(회피·블링크)·패링이면 안 맞는다. 방어·피해 배율이 바뀌어도 결과는 66% 그대로.
// 세 모드 공유: 방 이름이 아니라 보스 nativeId 로 고른다(무한생존·영화도 같은 코드). NaN 이 그리기·체력에 들어가지 않는다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='kiss-lips-r1042.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&C(F)===RT(F));try{new vm.Script(C(F));ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r1042\/kiss-lips-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 const src=C(F);
 ok('uses painted frame sheets (pink aura / pink hit / magenta gather), all in the manifest',['assets/r100/sig-aura-pink.webp','assets/r100/sig-hit-pink.webp','assets/r100/sig-gather-magenta.webp','assets/r100/sig-gather-pink.webp'].every(p=>src.includes(p)&&fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes(p)));
 ok('no code-drawn rings (no arc/ellipse/stroke)',!/\.arc\(|\.ellipse\(|\.stroke\(|\.fill\(/.test(src));
 ok('Mammon zones not touched',!/ep1b06/.test(src));ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));ok('no save writes',!/saveGame/.test(src));
 function env(o={}){const draws=[],texts=[],hurts=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,draws,texts,hurts,Math,JSON,Number,String,Object,Array};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,player={x:20,y:16,hp:1000,maxHp:1000,invincible:0,guard:false,parry:0,shield:0},room={id:"ep1b05",enemies:[]},effects=[],FACTOR=${o.factor??.65};
  function tick(){}function drawEffect(e){}function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}var scopes=[];
  var ctx={scope(o,f){scopes.push(o);f();},save(){},restore(){},globalAlpha:1};
  function readyImage(p){return{ready:true,image:{naturalWidth:p.includes('gather')?2304:1920,naturalHeight:p.includes('gather')?192:160,src:p}};}
  function drawAssetFrame3(p,fr,x,y,h,opt){draws.push({p,sr:fr&&fr.assetFrame&&fr.assetFrame.sourceRect,x,y,h,a:opt&&opt.alpha});}
  function floatText(t,x,y,c){texts.push(String(t));}
  function hurt(d,src){hurts.push({d,src});if(!Number.isFinite(d)||d<=0||player.hp<=0)return'ignored';if(player.invincible>0)return'invulnerable';if(player.guard&&player.parry>0)return'parried';
   let a=d*FACTOR*(player.guard?.4:1);if(player.shield>0){const b=Math.min(a,player.shield);player.shield-=b;a-=b;}if(a>0){player.hp-=a;floatText('-'+Math.ceil(a),player.x,player.y,'#f1a1a9');}player.invincible=.3;if(player.hp<=0){player.hp=0;}return a>0?'hit':'blocked';}`,g);
  vm.runInContext(src,g);return g;}
 const boss=(o={})=>({id:'ep1b05:b05-boss',nativeId:'b05-boss',boss:true,hp:100,maxHp:100,x:16,y:12,spawnState:'active',...o});
 let g=env();const A=()=>g.__STORYWORLD_KISS_LIPS_R1042__;ok('API exposed',!!A()&&typeof A().inspect==='function');
 const step=(n=1,dt=.1)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';if(player.invincible>0)player.invincible=Math.max(0,player.invincible-'+dt+');tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const P=()=>g.player;const untilCast=(max=60)=>{const c0=A().inspect().stats.casts;for(let i=0;i<max&&A().inspect().stats.casts===c0;i++)step(1);return A().inspect().stats.casts>c0;};const W=()=>A().inspect().timing;
 step(40);ok('no kiss before the boss is in the fight',A().inspect().stats.casts===0);
 g.room.enemies.push(boss());ok('first kiss within 6 s of the fight',untilCast(60)&&A().inspect().stats.casts===1);
 const sp=A().inspect().active;ok('kiss aims at the hero position when cast',sp&&Math.hypot(sp.x-20,sp.y-16)<.01);
 ok('telegraph lasts about 1~1.6 s (dodgeable)',W().WARN>=1&&W().WARN<=1.6);ok('reach 0.8~1.4 tiles',W().REACH>=.8&&W().REACH<=1.4);
 step(8);// 예고 0.8초 진행(예고 길이 1초 이상이므로 아직 착지 전)
 ok('warning draws the pink aura sheet frames at the spot (enemy-side effect scope)',g.draws.some(d=>/sig-aura-pink/.test(d.p)&&d.sr&&d.sr[0]%160===0)&&vm.runInContext('scopes',g).some(s=>/^r1042:/.test(s.id)&&s.pxfSide==='enemy'));
 ok('boss blows the kiss: magenta gather sheet frames at the boss',g.draws.some(d=>/sig-gather-magenta/.test(d.p)&&d.sr&&d.sr[0]%192===0));
 ok('aura frames advance (frame animation, not one still)',new Set(g.draws.filter(d=>/sig-aura-pink/.test(d.p)).map(d=>d.sr[0])).size>=3);
 ok('the kiss flies from the boss mouth to the spot (pink gather frames)',(()=>{step(4);return g.draws.some(d=>/sig-gather-pink/.test(d.p)&&d.sr&&d.sr[0]%192===0);})());
 step(13);ok('standing still → hit once, HP = 34% of current (1000 → 340)',Math.abs(P().hp-340)<.01&&A().inspect().stats.hits===1);
 ok('damage number shows 66% (-660)',g.texts.includes('-660'));
 ok('hit burst sheet drawn at the spot',g.draws.some(d=>/sig-hit-pink/.test(d.p)&&d.sr&&d.sr[0]%160===0));
 ok('all draw args finite',g.draws.every(d=>[d.x,d.y,d.h,d.a].every(Number.isFinite)&&d.sr.every(Number.isFinite)));
 // 두 번째: 비켜서면 안 맞음
 const n1=A().inspect().nextAt;ok('next kiss ~9~13 s later',n1-A().inspect().stats.lastCastAt>=9&&n1-A().inspect().stats.lastCastAt<=13);
 g.time=n1-.05;step(2);ok('second kiss cast',A().inspect().stats.casts===2);P().x+=2.2;step(25);ok('stepping out of the ring dodges (HP unchanged)',Math.abs(P().hp-340)<.01&&A().inspect().stats.dodged===1);
 // 세 번째: 무적(회피·블링크)이면 안 맞음
 g.time=A().inspect().nextAt-.05;step(2);const land=A().inspect().active.t0+W().WARN;g.time=land-.15;step(1);P().invincible=1;step(5);ok('invulnerable (dodge/blink) at landing → no damage',Math.abs(P().hp-340)<.01&&A().inspect().stats.blocked===1);
 // 배율이 달라도 66% 그대로
 for(const [f,lab] of [[3,'harsh modifiers (x3) do not overkill'],[.1,'heavy reductions do not shrink it']]){g=env({factor:f});g.room.enemies.push(boss());untilCast();step(25);ok(lab+' → 1000 → 340',Math.abs(P().hp-340)<.01);}
 g=env();g.player.guard=true;g.room.enemies.push(boss());untilCast();step(25);ok('guard (no parry) still 66%',Math.abs(P().hp-340)<.01);
 g=env();g.player.guard=true;g.player.parry=1;g.room.enemies.push(boss());untilCast();step(25);ok('parry → no damage',g.player.hp===1000);
 // 경계값: 체력 1 → 0.34, 쓰러지지 않음 · 체력 NaN/0 → 아무것도 안 함
 g=env();g.player.hp=1;g.room.enemies.push(boss());untilCast();step(25);ok('HP 1 → 0.34, never kills',Math.abs(P().hp-.34)<1e-6&&P().hp>0);
 g=env();g.player.hp=NaN;g.room.enemies.push(boss());untilCast();step(25);ok('HP NaN → no hurt call, no NaN spread',g.hurts.length===0&&A().inspect().stats.errors===0);
 g=env();g.room.enemies.push(boss({x:NaN}));step(80);ok('boss NaN position → no draw with NaN',g.draws.every(d=>[d.x,d.y,d.h,d.a].every(Number.isFinite)));
 // 세 모드 공유: 다른 방 이름(무한생존이 빌린 무대)도 같은 보스면 작동, 다른 보스는 아님
 g=env();g.room.id='survival-arena';g.room.enemies.push(boss());untilCast();ok('same boss in another room id (survival/cinema share) → works',A().inspect().stats.casts===1);
 g=env();g.room.enemies.push(boss({nativeId:'b03-boss',id:'ep1b03:b03-boss'}));step(80);ok('other boss → none',A().inspect().stats.casts===0);
 // 보스 멀리·쓰러짐·숨음·분신
 g=env();g.room.enemies.push(boss());g.player.x=40;step(80);ok('hero 13+ tiles away → none',A().inspect().stats.casts===0);
 g=env();g.room.enemies.push(boss({hp:0}));step(80);ok('boss down → none',A().inspect().stats.casts===0);
 g=env();g.room.enemies.push(boss({spawnState:'hidden'}));step(80);ok('boss hidden → none',A().inspect().stats.casts===0);
 // 장면·창·협동·끄기
 g=env();g.room.enemies.push(boss());vm.runInContext('storyScene={}',g);step(80);ok('story scene → none',A().inspect().stats.casts===0);
 g=env();g.room.enemies.push(boss());vm.runInContext('modal={}',g);step(80);ok('modal → none',A().inspect().stats.casts===0);
 g=env();g.room.enemies.push(boss());g.__STORYWORLD_COOP_SIM_R62__={mode:()=>'guest'};step(80);ok('co-op → none',A().inspect().stats.casts===0);
 g=env();g.localStorage.setItem('storyworld.r1042.kiss','{"on":false}');g.room.enemies.push(boss());step(80);ok('switch off → none',A().inspect().stats.casts===0&&g.draws.length===0&&vm.runInContext('effects.length',g)===0);
 g=env();g.room.enemies.push(boss());untilCast();step(3);vm.runInContext('storyScene={}',g);step(25);ok('scene opening mid-warning cancels (no damage)',g.player.hp===1000&&!A().inspect().active);
}
console.log(`R1042 kiss-lips cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
