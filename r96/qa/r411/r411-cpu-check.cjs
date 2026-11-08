// R411 CPU check: 드라이브 core24 스킬·적중 시트 — 보스 장판 착탄(보스마다 다른 그림)과 영웅 적중(영웅마다 다른 그림), 그림만.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='skill-sheets-r411.js',src=C(F);ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===src);
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loads once right after mob-art-r410, before combat-read-r409/combat-r118',/<script src="\.\/mob-art-r410\.js"><\/script><script src="\.\/skill-sheets-r411\.js"><\/script>/.test(html)&&html.split(F).length===2&&html.indexOf(F)<html.indexOf('combat-read-r409.js')&&html.indexOf('skill-fx-r292.js')<html.indexOf(F)&&html.indexOf('fx-boss-r105.js')<html.indexOf(F));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r411/r411-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
const H=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
ok('runtime-manifest hash matches',M.get(F)===H(F));
const idx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r411/fx/index.json'),'utf8'));
let bad=[];for(const [n,m] of Object.entries(idx.fx)){const p='assets/r411/fx/'+m.file;if(!fs.existsSync(path.join(RT,p))||H(p)!==m.outSha256||M.get(p)!==m.outSha256)bad.push(n);}
ok('14 sheets exist, hash = index = manifest',Object.keys(idx.fx).length===14&&!bad.length,bad.join(','));
ok('no forbidden CSS filters, no ctx.filter',!/drop-shadow|blur\(|ctx\.filter\s*=/.test(src));
ok('gameplay untouched: hitEnemy wrapper returns base result and never changes value',/const r=base\.call\(this,e,value,\.\.\.a\);.*return r;/.test(src)&&!/value\s*=/.test(src));
// 가짜 게임으로 돌려 본다
const effects=[],hazards=[],draws=[];let t=0;
const ctx={save(){},restore(){},translate(){},scale(){},drawImage(im,sx,sy){draws.push({im:im.src,sx,sy});},scope(meta,run){draws.push({meta});run();},globalAlpha:1,globalCompositeOperation:''};
const boss={id:'b1',nativeId:'dist00-boss',boss:true,x:5,y:5,hp:100},boss2={id:'b2',nativeId:'c102-boss',boss:true,x:9,y:9,hp:100},mob={id:'m1',x:3,y:3,hp:10};
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Date,Promise,
 effects,hazards,ctx,TILE:32,zoom:1,settings:{lowFx:false},room:{enemies:[boss,boss2,mob]},player:{hero:'gunner',x:4,y:4},
 project:(x,y)=>({x:x*32,y:y*32}),readyImage:p=>({image:{src:p}}),ensureImages(){},
 hitEnemy(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=v;return true;},drawEffect(){},tick(){},enterRegion:async()=>{}};
Object.defineProperty(sb,'time',{get:()=>t});
sb.window.__STORYWORLD_BOSS_FX_R105__={palOf:e=>({'dist00-boss':{elem:'corruption'},'c102-boss':{elem:'fire'}})[e.nativeId]};
vm.runInNewContext(src,sb);const A=sb.window.__STORYWORLD_SKILL_SHEETS_R411__;ok('api',A&&A.revision.startsWith('R411'));
const b1=A.bossSet(boss),b2=A.bossSet(boss2);ok('boss sets come from their own family',A.families.corruption.includes(b1.a)&&A.families.fire.includes(b2.a),[b1.a,b2.a].join());
const bossNames=new Set(Object.values(A.families).flat()),heroNames=new Set(Object.values(A.heroes));
ok('boss and hero sheets never overlap',[...bossNames].every(n=>!heroNames.has(n))&&[...bossNames].every(n=>n.startsWith('boss-'))&&[...heroNames].every(n=>n.startsWith('hit-')));
ok('michaela and hwando not mapped',!A.heroes.michaela&&!A.heroes.hwando);
// 장판: warning 전에는 재생 안 함, warning 무렵 한 번
hazards.push({id:1,type:'field',owner:'b1',x:6,y:6,radius:2.2,age:0,warning:1.2,life:3});hazards.push({id:2,type:'field',owner:'m1',x:2,y:2,radius:2,age:2,warning:1,life:3});
sb.tick();ok('no play before telegraph ends',A.inspect().active.length===0);
hazards[0].age=1.15;sb.tick();let act=A.inspect().active;ok('boss impact plays once at warning-lead, mob field ignored',act.length===1&&act[0].side==='boss'&&act[0].name===b1.a,JSON.stringify(act));
sb.tick();ok('same hazard not replayed',A.inspect().active.length===1);
// 그리기: 표지 항목이 effects 에 있고 drawEffect 로 그리면 enemy:true scope
ok('sentinel armed',effects.some(e=>e.type==='r411-sheet-fx'));sb.drawEffect(effects.find(e=>e.type==='r411-sheet-fx'));
const sc=draws.find(d=>d.meta);ok('boss draw scoped enemy-side',sc&&sc.meta.enemy===true&&/^r411:boss:/.test(sc.meta.id));
// 영웅 적중: 건너 → 폭발, 조절(0.22초)
const r=sb.hitEnemy(mob,1);ok('hitEnemy result passes through',r===true&&mob.hp===9);
act=A.inspect().active;ok('gunner hit → hit-explosion',act.some(a=>a.name==='hit-explosion'));
sb.hitEnemy(mob,1);ok('throttled second hit',A.inspect().active.filter(a=>a.side==='hero').length===1);
t=1;sb.player.hero='seoha';const m2={id:'m2',x:1,y:1,hp:5};sb.room.enemies.push(m2);sb.hitEnemy(m2,1);ok('seoha → ice spikes',A.inspect().active.some(a=>a.name==='hit-ice-spikes'));
t=2;sb.player.hero='michaela';const m3={id:'m3',x:1,y:1,hp:5};sb.hitEnemy(m3,1);ok('michaela gets nothing new',!A.inspect().active.some(a=>a.side==='hero'&&a.x===1&&a.y===1&&t===2&&a.name==='hit-teleport'));
t=10;sb.tick();ok('finished sheets removed',A.inspect().active.length===0);
A.set({on:false});t=11;hazards.push({id:3,type:'field',owner:'b1',x:6,y:6,radius:2,age:5,warning:1,life:9});sb.tick();ok('off → nothing plays',A.inspect().active.length===0);
const pass=checks.filter(c=>c.pass).length;for(const c of checks)if(!c.pass)console.log('FAIL',c.name,c.detail||'');
console.log(`R411 CPU ${pass}/${checks.length}`);process.exit(pass===checks.length?0:1);
