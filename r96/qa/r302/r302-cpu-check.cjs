// R302 CPU 검사: 영웅 2색 팔레트(hero-palette-r302.js + assets/r302/fx).
//  ① 파생 띠: R292 띠마다 파생본·sha256·매니페스트, 원본(R292) sha 그대로, 팔레트 밖 색 0(생성기가 디코드해 셈)
//  ② 네온 basic(창끝 모임 R292 neon/basic)은 쓰지 않음: 파생 원천 = neon/special, 결과 sha 가 R292 basic 과 다름
//  ③ 팔레트 표 = 생성기 표 = R102 표(네온만 민트 #3EE6C1), 미카엘라 포함 8명, 각 2색
//  ④ 가짜 엔진(VM): R292 경로 → R302 경로, 영웅 파일의 칠한 스프라이트 팔레트는 영웅 2색(명암만)으로, 적 파일은 그대로,
//     실 파일 금빛 → {고유색, 골드}, 은빛 → {고유색, 실버}, pixelfx 영웅 호출에 tint, 적 호출엔 없음, 끄기
//  ⑤ ctx.filter 에 blur·drop-shadow 없음 ⑥ 스크립트 순서·CI·공개 검증 등록
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f));
let n=0;const lum=c=>c[0]*.299+c[1]*.587+c[2]*.114;const ok=(c,m)=>{assert.ok(c,m);n++;};const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const SRC=C('hero-palette-r302.js');ok(RT('hero-palette-r302.js').toString()===SRC,'runtime copy matches client-source');
const rows=new Map(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'))).files.map(f=>[f.path,f]));
ok(rows.get('hero-palette-r302.js')?.sha256===sha(RT('hero-palette-r302.js')),'overlay in manifest');
const I292=JSON.parse(RT('assets/r292/fx/index.json')).effects,IDX=JSON.parse(RT('assets/r302/fx/index.json')),I302=IDX.effects;
ok(rows.get('assets/r302/fx/index.json')?.sha256===sha(RT('assets/r302/fx/index.json')),'index in manifest');
// ①
for(const[h,acts]of Object.entries(I292))for(const[a,r]of Object.entries(acts)){
 ok(sha(RT('assets/r292/fx/'+r.file))===r.sha256,'R292 original untouched '+r.file);
 const d=I302[h]?.[a];ok(d,'derivative exists '+h+'/'+a);const b=RT('assets/r302/fx/'+d.file);
 ok(sha(b)===d.sha256&&b.length===d.bytes,'derivative sha/bytes '+d.file);ok(rows.get('assets/r302/fx/'+d.file)?.sha256===d.sha256,'derivative in manifest '+d.file);
 ok(d.offPaletteColours===0&&d.uniqueColours>0,'no colour outside hero palette ramp '+d.file);
 ok(JSON.stringify(d.palette)===JSON.stringify(IDX.palette[h]),'strip palette = table '+d.file);
 ok(d.frames===r.frames&&JSON.stringify(d.origin)===JSON.stringify(r.origin),'same frames/origin as R292 '+d.file);
 if(!(h==='neon'&&a==='basic'))ok(d.derivedFromSha256===r.sha256,'derived from R292 strip '+d.file);}
// ②
ok(I302.neon.basic.derivedFrom==='assets/r292/fx/neon/special.webp'&&I302.neon.basic.derivedFromSha256===I292.neon.special.sha256,'neon basic rebuilt from special single bolt');
ok(I302.neon.basic.sha256!==I292.neon.basic.sha256,'neon spear-tip strip not used');
// ③
const PY=fs.readFileSync(path.join(ROOT,'scripts/r302-hero-palette-strips.py'),'utf8');
const ctxP={};vm.runInNewContext(SRC.replace(/^\(\(\)=>\{'use strict';/m,"(()=>{").replace(/window\.__STORYWORLD_HERO_PALETTE_R302__=Object\.freeze\(/,'globalThis.OUT=('),Object.assign(ctxP,{window:{},localStorage:{getItem:()=>null,setItem(){}},document:{},performance:{now:()=>0}}));
const H302=ctxP.OUT;ok(H302&&H302.palette,'module exports palette');
const PAL=H302.palette;const R102=C('hero-fx-r102.js');
ok(Object.keys(PAL).sort().join()==='gunner,hunter,hwando,lauren,michaela,neon,seoha,slayer','8 heroes incl. michaela');
for(const[h,p]of Object.entries(PAL)){ok(JSON.stringify(IDX.palette[h])===JSON.stringify({main:p.main,sub:p.sub}),'index palette = js '+h);
 if(h!=='neon')ok(R102.includes(h+':pal({a:['+p.main.join(',')+']'),'main from R102 '+h);
 ok(R102.includes("name:'"+p.name+"',name2:'"+p.name2+"'"),'names from R102 '+h);}
ok(PAL.neon.main.join()==='62,230,193'&&PAL.neon.name==='민트','neon mint #3EE6C1');
// ④ 가짜 엔진
function engine(){const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,RegExp,Promise,performance:{now:()=>0}};g.window=g;g.globalThis=g;
 g.localStorage={s:{},getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=v;}};g.document={createElement:()=>({getContext:()=>null})};
 const seen=[];g.readyImage=p=>{seen.push(p);return null;};g.ensureImages=l=>{seen.push(...l);};g.time=0;g.basicAttack=function(){g.effects.push({type:'burst',owner:'hero',x:1,y:1,life:.2});g.effects.push({type:'enemyBurnDeath',x:1,y:1});};g.effects=[];g.fx=(type,x,y,o)=>{g.effects.push({type,x,y,...(o||{})});};g.drawEffect=()=>{};g.tick=()=>{};
 g.player={hero:'neon',x:0,y:0};const calls=[];
 const pal=(a,b)=>{if(a&&a.a&&a.b)return a;return{a:a.slice(),b:(b||a).slice()};};
 g.__STORYWORLD_FX_SPRITES_R106__=Object.freeze({pal,draw:(n,F)=>{calls.push(pal(F));return true;},along:(n,F)=>{calls.push(pal(F));return true;},poly:F=>{calls.push(pal(F));return true;},warm(){},ready:()=>true,on:()=>true,parseColour:s=>[255,255,255]});
 const px=[];g.__STORYWORLD_PIXELFX_R163__=Object.freeze({play:(n,x,y,o)=>{px.push(o);return{};},frameAt:(n,u,x,y,o)=>{px.push(o);return true;},has:()=>true});
 vm.createContext(g);vm.runInContext(SRC,g,{filename:'/x/hero-palette-r302.js'});return{g,seen,calls,px};}
const run=(E,file,code)=>vm.runInContext(code,E.g,{filename:'/x/'+file+'.js'});
{const E=engine(),P=E.g.__STORYWORLD_HERO_PALETTE_R302__;
 E.g.readyImage('assets/r292/fx/neon/basic.webp');E.g.readyImage('assets/r292/fx/hwando/r.webp');E.g.readyImage('assets/r292/fx/neon/zzz.webp');E.g.readyImage('assets/other.webp');
 ok(E.seen[0]==='assets/r302/fx/neon/basic.webp'&&E.seen[1]==='assets/r302/fx/hwando/r.webp'&&E.seen[2]==='assets/r292/fx/neon/zzz.webp'&&E.seen[3]==='assets/other.webp','strip paths swapped (only known strips)');
 const inPal=(c,h,extra=[])=>{const p=PAL[h],cols=[p.main,p.sub,...extra];return cols.some(x=>x.join()===c.join());};
 for(const h of Object.keys(PAL)){E.g.player.hero=h;E.calls.length=0;
  run(E,'skills-r209',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[40,170,176],b:[170,250,240]},0,0);__STORYWORLD_FX_SPRITES_R106__.along('line',[255,96,0],0,0,1,1,1);__STORYWORLD_FX_SPRITES_R106__.poly({a:[150,22,34],b:[236,190,120]},[[0,0],[1,1]],1);");
  ok(E.calls.length===3&&E.calls.every(c=>inPal(c.a,h)&&inPal(c.b,h)),'hero-file sprite colours are the 2-colour palette '+h+' '+JSON.stringify(E.calls));
  E.calls.length=0;run(E,'hero-threads-r174',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[120,80,18],b:[255,236,170]},0,0);__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[150,160,180],b:[240,244,250]},0,0);");
  ok(E.calls[0].a.concat(E.calls[0].b).join()!==''&&[E.calls[0].a,E.calls[0].b].every(c=>c.join()===PAL[h].main.join()||c.join()==='255,198,72'),'golden thread = main + gold '+h);
  ok([E.calls[1].a,E.calls[1].b].every(c=>c.join()===PAL[h].main.join()||c.join()==='226,232,242'),'silver thread = main + silver '+h);
  E.calls.length=0;run(E,'mob-motion-r286',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[70,6,10],b:[220,70,52]},0,0);");
  ok(E.calls[0].a.join()==='70,6,10'&&E.calls[0].b.join()==='220,70,52','enemy file colours untouched '+h);
  E.px.length=0;run(E,'effects-r178',"function special(){__STORYWORLD_PIXELFX_R163__.play('pvfx-electric-impact',0,0,{k:1});} special();");run(E,'samong-r161',"__STORYWORLD_PIXELFX_R163__.play('mob-x',0,0,{k:1});");
  ok(E.px[0].tint&&E.px[0].tint.a.join()===PAL[h].main.join()&&E.px[0].tint.b.join()===PAL[h].sub.join(),'hero pixelfx tinted '+h);ok(!E.px[1].tint,'enemy pixelfx not tinted '+h);}
 // 끄기
 E.g.player.hero='neon';P.set(false);E.calls.length=0;run(E,'skills-r209',"__STORYWORLD_FX_SPRITES_R106__.draw('glow',{a:[40,170,176],b:[170,250,240]},0,0);");ok(E.calls[0].a.join()==='40,170,176','off restores original');
 E.seen.length=0;E.g.readyImage('assets/r292/fx/neon/basic.webp');ok(E.seen[0]==='assets/r292/fx/neon/basic.webp','off keeps R292 path');}
{const E=engine(),P=E.g.__STORYWORLD_HERO_PALETTE_R302__;E.g.player.hero='hwando';E.g.effects.push({type:'burst',x:0,y:0,life:.2});E.g.time=5;E.g.tick();
 ok(!E.g.effects[0].r302,'unowned burst not marked');E.g.basicAttack();E.g.tick();
 ok(E.g.effects[1].r302==='hwando'&&!E.g.effects[2].r302,'explicitly hero-owned burst marked; other types not');
 E.g.time=6;E.g.effects.push({type:'burst',x:0,y:0});E.g.effects.push({type:'e568HeroImpact',x:0,y:0});E.g.tick();ok(!E.g.effects[3].r302&&E.g.effects[4].r302==='hwando','unowned burst stays unchanged; hero-only impact type marked');
 for(const h of Object.keys(PAL)){const L=P.rampOf(h),p=PAL[h],cols=[];for(let x=0;x<256;x++)cols.push([L[x*3],L[x*3+1],L[x*3+2]]);
  const onLine=(c,a,b)=>{for(let t=0;t<=1.0001;t+=.002){if([0,1,2].every(i=>Math.abs(a[i]+(b[i]-a[i])*t-c[i])<=1.5))return true;}return false;};
  const[d,m]=lum(p.main)>lum(p.sub)?[p.sub,p.main]:[p.main,p.sub];const D=d.map(v=>v*.28),Mx=m.map(v=>v+(255-v)*.5);
  ok(cols.every(c=>onLine(c,D,d)||onLine(c,d,m)||onLine(c,m,Mx)),'runtime tint ramp only shades of the 2 colours '+h);}}
// ⑤
ok(!/blur\(|drop-shadow/.test(SRC.replace(/\/\/.*$/mg,'')),'no blur/drop-shadow filter');
// ⑥
const html=RT('index.html').toString();ok(html.split('"./hero-palette-r302.js"').length===2&&/<script src="\.\/skill-fx-r292\.js"><\/script><script src="\.\/hero-palette-r302\.js"><\/script><script src="\.\/terrain-readability-r323\.js"><\/script>(?:<script src="\.\/prop-shadow-r329\.js"><\/script>)?(?:<script src="\.\/disaster-r330\.js"><\/script>)?(?:<script src="\.\/mob-foot-r332\.js"><\/script>)?(?:<script src="\.\/hud-bossbar-r334\.js"><\/script>)?(?:<script src="\.\/hero-facing-r336\.js"><\/script>)?(?:<script src="\.\/samong-gate-r338\.js"><\/script>)?(?:<script src="\.\/hud-menu-r339\.js"><\/script>)?(?:<script src="\.\/enemy-hexagram-r341\.js"><\/script>)?(?:<script src="\.\/hwando-arc-r349\.js"><\/script>)?(?:<script src="\.\/wave-orphans-r352\.js"><\/script>)?(?:<script src="\.\/slayer-r351\.js"><\/script>)?(?:<script src="\.\/bgm-pick-r353\.js"><\/script>)?(?:<script src="\.\/hwando-w-cross-r348\.js"><\/script>)?(?:<script src="\.\/hero-visibility-r350\.js"><\/script>)?(?:<script src="\.\/samong-wide-r355\.js"><\/script>)?(?:<script src="\.\/kairo-homage-r356\.js"><\/script>)?(?:<script src="\.\/perf-r360\.js"><\/script>)?(?:<script src="\.\/mob-legacy-r363\.js"><\/script>)?(?:<script src="\.\/mob-legacy-r363\.js"><\/script>)?(?:<script src="\.\/guide-fragment-r365\.js"><\/script>)?(?:<script src="\.\/mob-student-walk-r615\.js"><\/script>)?(?:<script src="\.\/perf-r367\.js"><\/script>)?(?:<script src="\.\/perf-r493\.js"><\/script>)?(?:<script src="\.\/slayer-r-tornado-r366\.js"><\/script>)?(?:<script src="\.\/betrayal-video-r368\.js"><\/script><script src="\.\/poison-city-video-r369\.js"><\/script>)?(?:<script src="\.\/cinema-mode-r370\.js"><\/script>)?(?:<script src="\.\/root-gate-video-r372\.js"><\/script>)?(?:<script src="\.\/mob-squads-r373\.js"><\/script>)?(?:<script src="\.\/mob-dots-r374\.js"><\/script>)?(?:<script src="\.\/mob-dots-r375\.js"><\/script>)?(?:<script src="\.\/real-mode-r376\.js"><\/script>)?(?:<script src="\.\/hud-cinema-r376\.js"><\/script>)?(?:<script src="\.\/music-box-r378\.js"><\/script>)?(?:<script src="\.\/approved-mobs-r380\.js"><\/script>)?(?:<script src="\.\/voice-r381-data\.js"><\/script><script src="\.\/voice-r381\.js"><\/script>)?(?:<script src="\.\/cinema-sync-r384\.js"><\/script>)?(?:<script src="\.\/mob-moves-r385\.js"><\/script>)?(?:<script src="\.\/aggro-chase-r390\.js"><\/script>)?(?:<script src="\.\/guide-clear-r426\.js"><\/script>)?<script src="\.\/mammon-bossroom\.js"><\/script><script src="\.\/seven-sins-bossrooms\.js"><\/script><script src="\.\/sin-room-art\.js"><\/script>(<script src="\.\/props-place-r406\.js"><\/script>)?(<script src="\.\/mob-art-r410\.js"><\/script>)?(<script src="\.\/skill-sheets-r411\.js"><\/script>)?(<script src="\.\/theme-fx-r430\.js"><\/script>)?(<script src="\.\/boss-arena-r431\.js"><\/script>)?(?:<script src="\.\/fx-more-r438\.js"><\/script>)?(<script src="\.\/props-tidy-r412\.js"><\/script>)?(<script src="\.\/doors-fit-r413\.js"><\/script>)?(<script src="\.\/drive-buildings-r414\.js"><\/script>)?(<script src="\.\/access-r420\.js"><\/script>(?:<script src="\.\/readability-r434\.js"><\/script>)?(?:<script src="\.\/surface-r435\.js"><\/script>)?(?:<script src="\.\/bossroom-tidy-r438\.js"><\/script>)?(?:<script src="\.\/props-space-r449\.js"><\/script>)?(?:<script src="\.\/enemy-face-r444\.js"><\/script>)?)?(<script src="\.\/combat-read-r409\.js"><\/script>)?(<script src="\.\/slayer-blood-r425\.js"><\/script><script src="\.\/combat-flow-r425\.js"><\/script>(?:<script src="\.\/perf-r441\.js"><\/script>)?(?:<script src="\.\/skill-attack-r440\.js"><\/script>)?(?:<script src="\.\/enemy-skill-pose-r442\.js"><\/script>)?(?:<script src="\.\/depth-overlap-r448\.js"><\/script>)?(?:<script src="\.\/cinema-run-r461\.js"><\/script>)?(?:<script src="\.\/mob-death-r462\.js"><\/script>)?(?:<script src="\.\/sin-boss-art-r463-data\.js"><\/script><script src="\.\/sin-boss-art-r463\.js"><\/script>)?(<script src="\.\/samong-rooms-r511\.js"><\/script>)?(?:<script src="\.\/weather-r450\.js"><\/script><script src="\.\/local-light-r451\.js"><\/script><script src="\.\/ground-fringe-r452\.js"><\/script><script src="\.\/actor-tone-r453\.js"><\/script>(?:<script src="\.\/hwando-chain-r590\.js"><\/script>)?(?:<script src="\.\/[a-z-]+-r56[1-4]\.js"><\/script>)*(?:<script src="\.\/samong-theme-r572\.js"><\/script>)?(?:<script src="\.\/samong-surge-r571\.js"><\/script>)?(?:<script src="\.\/survival-r600\.js"><\/script>)?(?:<script src="\.\/slayer-sheets-r585\.js"><\/script>)?(?:<script src="\.\/slayer-berserk-r586\.js"><\/script>)?(?:<script src="\.\/enemy-attack-tempo-r601\.js"><\/script>)?)?)?\s*<script src="\.\/combat-r118\.js">/.test(html),'script tag after skill-fx-r292, before combat-r118');
ok(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'hero-palette-r302.js'")&&fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'assets/r302/'"),'public verify list');
ok(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('node r96/qa/r302/r302-cpu-check.cjs'),'CI step');
const inputs=fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8');ok(inputs.includes('hero-palette-r302.js')&&inputs.includes('assets/r302/fx/neon/basic.webp'),'runtime inputs');
console.log('R302 CPU check: '+n+' checks passed');

require('./review-regression.cjs');
