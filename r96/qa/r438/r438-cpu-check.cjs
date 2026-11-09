// R438 CPU check: 드라이브 core24 남은 시트 8종 — 보스 근접 충격파/냉기파·광폭화·상태이상 시작·R230 블링크 망령 돌진·회복·보호 결계·방 정화.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='fx-more-r438.js',src=C(F);ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===src);
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loads once right after boss-arena-r431, before combat-r118',/<script src="\.\/boss-arena-r431\.js"><\/script><script src="\.\/fx-more-r438\.js"><\/script>/.test(html)&&html.split(F).length===2&&html.indexOf(F)<html.indexOf('combat-r118.js'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r438/r438-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
const H=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,p))).digest('hex');
ok('runtime-manifest hash matches',M.get(F)===H(F));
const idx=JSON.parse(fs.readFileSync(path.join(RT,'assets/r438/fx/index.json'),'utf8'));
let bad=[];for(const [n,m] of Object.entries(idx.fx)){const p='assets/r438/fx/'+m.file;if(!fs.existsSync(path.join(RT,p))||H(p)!==m.outSha256||M.get(p)!==m.outSha256)bad.push(n);}
ok('8 sheets exist, hash = index = manifest',Object.keys(idx.fx).length===8&&!bad.length,bad.join(','));
// R411·R430 와 같은 원본을 다시 쓰지 않음
const used=new Set([...Object.values(JSON.parse(fs.readFileSync(path.join(RT,'assets/r411/fx/index.json'),'utf8')).fx).map(v=>v.effect),...Object.values(JSON.parse(fs.readFileSync(path.join(RT,'assets/r430/index.json'),'utf8')).fx).map(v=>v.effect)]);
const mine=Object.values(idx.fx).map(v=>v.effect);
ok('no effect reused from R411 combat; R430 ambient reuse only for curse/poison/cold (status onset)',mine.every(e=>!['meteor','fire_wall','corpse_explosion','tentacle_bind','gravity_well','bone_spikes','infection_mark','lightning_strike','ground_fissure','explosion_hit','fire_hit','ice_spikes','chain_lightning','teleport'].includes(e))&&mine.filter(e=>used.has(e)).every(e=>['curse_brand','poison_mist','cold_wave'].includes(e)),mine.join(','));
ok('flamethrower (known defect) not used',!mine.includes('flamethrower'));
ok('every sheet 24 frames 6x4',idx.frames===24&&idx.cols===6&&idx.rows===4);
const code=src.split('\n').filter(l=>!l.trim().startsWith('//')).join('\n');
ok('no forbidden CSS filters (drop-shadow/blur/ctx.filter)',!/drop-shadow|blur\(|ctx\.filter/.test(code));
ok('no gameplay writes (hp/damage/hazards/collision)',!/hazards\.push|\.hp\s*[-+*]?=(?!=)|damage\s*=|solid\s*:\s*true|floorCells\s*=|walls\s*=/.test(code));
ok('Mammon vault excluded on boss side',/roomId\(\)==='ep1b06'/.test(src));
// 가짜 게임
const effects=[],draws=[];let t=0,hurtCalls=0;
const ctx={save(){},restore(){},translate(){},scale(){},rotate(a){draws.push({rot:a});},drawImage(im,sx,sy){draws.push({im:im.src,sx,sy});},scope(meta,run){draws.push({meta});run();},globalAlpha:1,globalCompositeOperation:''};
const boss={id:'b',boss:true,hp:100,x:10,y:10},mid={id:'m',midboss:true,hp:50,x:12,y:10},mob={id:'z',hp:10,x:14,y:10};
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Date,Promise,effects,ctx,TILE:34,zoom:.667,settings:{lowFx:false},loading:false,
 room:{id:'ep1b03',enemies:[boss,mid,mob]},player:{x:11,y:11,hp:50,shield:0,invincible:0,hero:'gunner'},maxHP:()=>100,
 project:(x,y)=>({x:(x-y)*22+640,y:(x+y)*11}),readyImage:p=>({image:{src:p}}),ensureImages(){},drawEffect(){},tick(){},enterRegion:async()=>{},
 hurt(v,src){hurtCalls++;return src?.res||'hit';}};
Object.defineProperty(sb,'time',{get:()=>t});
let statusRows=[];sb.window.__STORYWORLD_THEME_FX_R430__={statusRows:()=>statusRows};
let flank={flanks:0,last:null};sb.window.__STORYWORLD_MOB_FLANK_R230__={inspect:()=>({stats:{...flank}})};
let elem='corruption';sb.window.__STORYWORLD_BOSS_FX_R105__={palOf:()=>({elem})};
vm.runInNewContext(src,sb);const A=sb.window.__STORYWORLD_FX_MORE_R438__;ok('api',A&&A.revision.startsWith('R438'));
const plays=()=>A.inspect().stats.plays;const step=(dt=.1)=>{t+=dt;sb.tick();};
step();step(1.2);// room settled
// ① 보스 근접 → 충격파, 탄·장판·도트·일반 몹은 아님
sb.hurt(5,boss);ok('boss melee hit → shockwave',plays()['enemy-shockwave']===1);
step(1);sb.hurt(5,{vx:1,vy:0,owner:'b'});sb.hurt(5,{type:'field',owner:'b'});sb.hurt(5,{r431:true,dot:true,owner:'b'});sb.hurt(5,mob);sb.hurt(5,{owner:'b',attack:{},res:'blocked'});
ok('projectile/field/dot/normal mob/blocked → nothing',plays()['enemy-shockwave']===1&&!plays()['enemy-cold-wave'],JSON.stringify(plays()));
step(1);sb.hurt(5,{owner:'m',attack:{id:1}});ok('midboss swing (attack row) → shockwave',plays()['enemy-shockwave']===2);
step(1);elem='frost';sb.hurt(5,boss);ok('frost boss → cold wave instead',plays()['enemy-cold-wave']===1&&plays()['enemy-shockwave']===2);elem='corruption';
ok('hurt result passes through untouched',sb.hurt(1,{res:'parried'})==='parried');
// ② 광폭화
step(1);boss.r205Enraged={at:t};step();ok('R205 enrage → big shockwave once',plays()['enemy-shockwave']===3);step();ok('enrage not repeated',plays()['enemy-shockwave']===3);
// ③ 상태이상 시작
statusRows=[{key:'r431-curse'}];step();ok('curse onset → curse brand',plays()['enemy-curse-brand']===1);step();ok('held status does not replay',plays()['enemy-curse-brand']===1);
statusRows=[{key:'r431-curse'},{key:'r431-poison'}];step();ok('poison onset → poison mist',plays()['enemy-poison-mist']===1);
statusRows=[{key:'r431-burn'},{key:'r431-shock'}];step();ok('burn/shock (other systems) → nothing new',Object.keys(plays()).length===4,JSON.stringify(plays()));
// ④ R230 블링크
flank={flanks:1,last:{id:'z',from:[14,10],to:[12,12]}};step();ok('R230 flank → wraith dash',plays()['enemy-wraith-dash']===1);
const rots=draws.filter(d=>'rot'in d);
// ⑤ 회복·보호·정화
sb.player.hp=70;step();ok('heal +20% → healing',plays()['hero-healing']===1);
sb.player.hp=72;step(2);ok('small regen ignored',plays()['hero-healing']===1);
sb.player.hero='michaela';sb.player.hp=95;step(2);ok('michaela excluded',plays()['hero-healing']===1);sb.player.hero='gunner';
sb.player.shield=20;step();ok('new shield → barrier',plays()['hero-barrier']===1);
step(3);sb.player.invincible=2;sb.player.invReason='협동 부활 보호';step();ok('revive guard → barrier',plays()['hero-barrier']===2);
for(const e of sb.room.enemies)e.hp=0;step();ok('room cleared → cleanse',plays()['hero-cleanse']===1);
sb.player.hp=99;step();ok('no heal sprite right after cleanse',plays()['hero-healing']===1);
// ⑥ 맘몬 금고 보스 쪽 제외
sb.room={id:'ep1b06',enemies:[{...boss,hp:100}]};step();step(1.2);const s0=plays()['enemy-shockwave'];sb.hurt(5,sb.room.enemies[0]);ok('ep1b06 boss melee → nothing',plays()['enemy-shockwave']===s0);
// ⑦ 그리기: 표지 하나로 effects 안에서, 적 쪽 enemy 메타·영웅 쪽 r409
sb.room={id:'ep1b03',enemies:[{...boss,hp:100}]};step();step(1.2);sb.hurt(5,sb.room.enemies[0]);A.play('hero-barrier',11,11);
const sent=effects.find(e=>e.type==='r438-sheet-fx');ok('one sentinel in effects',effects.filter(e=>e.type==='r438-sheet-fx').length===1);
draws.length=0;sb.drawEffect(sent);const metas=draws.filter(d=>d.meta).map(d=>d.meta);
ok('enemy-side drawn with enemy:true, hero-side with r409:true',metas.some(m=>m.enemy&&/enemy-shockwave/.test(m.id))&&metas.some(m=>m.r409&&/hero-barrier/.test(m.id)),JSON.stringify(metas));
ok('frames come from 6x4 256 grid',draws.filter(d=>d.im).every(d=>d.sx%256===0&&d.sy%256===0&&d.sx<1536&&d.sy<1024));
ok('wraith dash tilt within ±35°',rots.every(d=>Math.abs(d.rot)<=.62));
// ⑧ 저사양: 독안개·회복·블링크 생략, 동시 4개
sb.settings.lowFx=true;const before=plays()['hero-healing'];A.play('hero-healing',1,1);ok('lowFx skips healing',plays()['hero-healing']===before);
for(let i=0;i<9;i++)A.play('hero-barrier',i,1,{gap:0});ok('lowFx cap 4',A.inspect().active.length<=4,A.inspect().active.length);
// ⑧-2 새 게임·이전 저장: 게임 시계가 뒤로 가도 간격 기록에 막히지 않음
sb.settings.lowFx=false;t+=600;step();A.play('hero-barrier',3,3,{gap:2});const b0=plays()['hero-barrier'];t=10;step();ok('clock rewind clears throttle',A.play('hero-barrier',3,3,{gap:2})!==null&&plays()['hero-barrier']===b0+1&&A.inspect().stats.rewinds>=1);
// ⑨ 끄기
A.set(false);sb.settings.lowFx=false;const n0=JSON.stringify(plays());sb.hurt(5,sb.room.enemies[0]);ok('off switch',JSON.stringify(plays())===n0);
ok('no runtime errors',A.inspect().stats.errors===0,A.inspect().lastError);
const failed=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+c.detail));
console.log(JSON.stringify({check:'r438',total:checks.length,failed:failed.length}));if(failed.length)process.exit(1);
