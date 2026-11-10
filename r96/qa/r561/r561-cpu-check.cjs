// R561 CPU check: 기억사수 총기 스킬 4종 — Q 회상 광선포(굵은 관통 레이저)·W 망각 저격(긴 사거리 단발)·E 잔향 연사(소총 연사)·R 기억 소거 폭격(표적 지정 후 대형 폭격).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
let src='';try{src=C('gunner-arms-r561.js');}catch(_){}
const idx=RT('index.html');
ok('runtime copy matches; loads right after michaela-r247 (after R209/R247, before R291 — order-free: WER cast is wrapped on retry, every wrapper is gunner-gated); in verify list and CI',
 (()=>{try{return RT('gunner-arms-r561.js')===src&&src.length>0;}catch(_){return false;}})()&&/michaela-r247\.js"><\/script><script src="\.\/gunner-arms-r561\.js"><\/script>/.test(idx)&&
 /'gunner-arms-r561\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r561\/r561-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
{const r9=C('skills-r209.js');ok('R209 keeps the original gunner W(정화)·E(블링크) blocked but shows their buttons while R561 owns them',/hero==='gunner'&&\(slot==='w'\|\|slot==='e'\)&&!!window\.__STORYWORLD_GUNNER_ARMS_R561__\?\.on\?\.\(\)/.test(r9)&&RT('skills-r209.js')===r9);}
{const k=C('keys-r291.js');ok('R291 key labels keep gunner W·E live while R561 is on',/__STORYWORLD_GUNNER_ARMS_R561__/.test(k)&&RT('keys-r291.js')===k);}

function mk(opt={}){const hits=[],L={},moves=[];
 const enemies=opt.enemies||[{id:'a',x:13,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'},{id:'b',x:16,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'},{id:'c',x:10,y:15,hp:999,maxHp:999,radius:.3,spawnState:'active'}];
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Infinity,localStorage:{getItem:()=>null,setItem(){}},window:{},setTimeout:()=>0,addEventListener(t,f,c){(L[t]=L[t]||[]).push(f);},
  auto:false,guide:false,started:true,modal:null,loading:false,storyScene:null,settings:{},time:10,COMBAT_RHYTHM_R26:opt.rhythm||1,shake:0,
  player:{hero:opt.hero||'gunner',x:10,y:10,hp:100,specialCD:0,direction:'right',storyWER:{ready:{},buffs:{}}},maxHP:()=>200,attackPower:()=>40,rank:()=>opt.rank||0,
  clearLine:opt.clearLine||(()=>true),blocked:opt.blocked||(()=>false),effects:[],sound(){},moveActor:(e,dx,dy)=>moves.push([e.id,dx,dy]),
  HEROES:{gunner:{name:'기억사수',special:'기억 재현',range:8.2},hwando:{name:'환도',special:'x'}},
  room:{enemies},liveEnemies:()=>enemies.filter(e=>e.hp>0),damageable3:()=>true,
  hitEnemy:(e,v,m)=>{hits.push([e.id,v,m&&m.ability,m&&m.friendly]);e.hp-=v;return true;},
  special(){sb.__baseSpecial=(sb.__baseSpecial||0)+1;},serializeSave:()=>({storyWER:{remaining:opt.saveClamp?{'gunner:r':17.7,'gunner:w':17.7,'gunner:e':17.7,'hwando:r':3}:{'gunner:r':1e6,'gunner:w':1e6,'gunner:e':1e6,'hwando:r':3}}}),
  tick(){},drawEffect(){},updateHUD(){}};
 sb.window.__STORYWORLD_WER__=Object.freeze({cast:()=>'base',defs:{}});sb.window.__STORYWORLD_GROWTH_R103__={state:()=>({procs:{'gunner:w':opt.lv||0,'gunner:e':opt.lv||0,'gunner:r':opt.lv||0}})};
 if(opt.coop)sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>opt.coop};if(opt.ego)sb.window.__STORYWORLD_EGO151__={inspect:()=>({state:{active:true}})};
 vm.createContext(sb);vm.runInContext(src||'throw new Error("gunner-arms-r561.js missing")',sb);
 const A=()=>sb.window.__STORYWORLD_GUNNER_ARMS_R561__;
 const run=(t1,step=.05)=>{while(sb.time<t1-1e-9){sb.time=+(sb.time+step).toFixed(4);sb.tick(step);}};
 return {sb,hits,L,moves,A,run,W:()=>sb.window.__STORYWORLD_WER__};}
const sum=(h,ab,id)=>h.filter(x=>x[2]===ab&&(!id||x[0]===id)).reduce((s,x)=>s+x[1],0);
let T;
// ---------- Q 회상 광선포 ----------
try{T=mk();T.sb.special();T.run(11.5);
 const a=sum(T.hits,'gunnerBeamR561','a'),b=sum(T.hits,'gunnerBeamR561','b'),c=sum(T.hits,'gunnerBeamR561','c');
 ok('Q: replaces the engine special for gunner (base special not called) and becomes a thick beam that pierces every enemy on the line (a,b) but not off-line (c)',!T.sb.__baseSpecial&&a>0&&b>0&&c===0,{a,b,c,base:T.sb.__baseSpecial});
 const SP=40*2.4;ok('Q: total beam damage per target ≈ engine 기억 재현 (2.2 × special power) within ±10%',Math.abs(a/(SP*2.2)-1)<=.10,{a,expect:SP*2.2});
 ok('Q: uses the engine special cooldown 10 s (rank 0) and the HUD Q name becomes 회상 광선포',Math.abs(T.sb.player.specialCD-10)<1e-9&&T.sb.HEROES.gunner.special==='회상 광선포',[T.sb.player.specialCD,T.sb.HEROES.gunner.special]);
 const ticks=T.hits.filter(x=>x[0]==='a'&&x[2]==='gunnerBeamR561').length;ok('Q: beam hits in several ticks over its duration (≥5), all friendly',ticks>=5&&T.hits.every(x=>x[3]===true),ticks);
}catch(e){ok('Q runs',false,String(e));}
try{T=mk({blocked:(x,y)=>x>14.5});T.sb.special();T.run(11.5);
 ok('Q: beam stops at a wall (enemy b behind the wall at x=16 is not hit)',sum(T.hits,'gunnerBeamR561','a')>0&&sum(T.hits,'gunnerBeamR561','b')===0);}catch(e){ok('Q wall',false,String(e));}
try{T=mk({hero:'hwando'});T.sb.special();ok('Q: other heroes keep the engine special',T.sb.__baseSpecial===1&&T.hits.length===0);}catch(e){ok('Q other hero',false,String(e));}
try{T=mk();T.sb.player.specialCD=3;T.sb.special();T.run(11);ok('Q: refuses while the special is cooling down',T.hits.length===0&&!T.sb.__baseSpecial);}catch(e){ok('Q cd',false,String(e));}
// ---------- W 망각 저격 ----------
try{T=mk({enemies:[{id:'near',x:12,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'},{id:'far',x:22,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'}]});
 const r=T.W().cast('w',false);const early=T.hits.length;T.run(11);
 ok('W: aim windup first (no damage at cast), then one heavy shot',r===true&&early===0&&T.hits.filter(x=>x[2]==='gunnerSnipeR561').length>=1,{r,early,h:T.hits});
 const d=sum(T.hits,'gunnerSnipeR561','near');ok('W: first target takes 2.2 × attack power at level 0',Math.abs(d-88)<1e-6,d);
 const f=sum(T.hits,'gunnerSnipeR561','far');ok('W: long range — the bullet pierces to one enemy behind (12 tiles away) for half damage',Math.abs(f-44)<1e-6,f);
 ok('W: knocks the first target back along the shot',T.moves.some(m=>m[0]==='near'&&m[1]>0));
 ok('W: own cooldown 8 s × rhythm, second cast refused',Math.abs(T.A().remain('w')-(18-T.sb.time))<1e-6&&T.W().cast('w',false)===false,T.A().remain('w'));
}catch(e){ok('W runs',false,String(e));}
try{const a=mk({lv:0}),b=mk({lv:7});a.W().cast('w',false);b.W().cast('w',false);a.run(11);b.run(11);ok('W: grows with the R103 W skill level (lv7 ≥ 1.6×)',sum(b.hits,'gunnerSnipeR561','a')>=1.6*sum(a.hits,'gunnerSnipeR561','a'));}catch(e){ok('W growth',false,String(e));}
// ---------- E 잔향 연사 ----------
try{T=mk();const r=T.W().cast('e',false);T.run(11.5);const n=T.hits.filter(x=>x[2]==='gunnerRifleR561').length;
 ok('E: rifle burst of 8 rounds over ~0.8 s, each hits the first enemy in line (a), not through it',r===true&&n===8&&sum(T.hits,'gunnerRifleR561','b')===0,{n});
 ok('E: total 1.2 × attack power (8 × 0.15) at level 0',Math.abs(sum(T.hits,'gunnerRifleR561')-48)<1e-6,sum(T.hits,'gunnerRifleR561'));
 ok('E: cooldown 6 s',Math.abs(T.A().remain('e')-(16-T.sb.time))<1e-6);
}catch(e){ok('E runs',false,String(e));}
try{T=mk({enemies:[]});const r=T.W().cast('e',false);ok('E: with no enemy in range a manual cast still fires (aim forward) but auto-cast refuses',r===true&&T.A().fire('w',true)===false);}catch(e){ok('E empty',false,String(e));}
// ---------- R 기억 소거 폭격 ----------
try{const E=[{id:'p',x:15,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'},{id:'q',x:15.8,y:10.4,hp:999,maxHp:999,radius:.3,spawnState:'active'},{id:'s',x:16.6,y:9.6,hp:999,maxHp:999,radius:.3,spawnState:'active'},{id:'lone',x:7,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'}];
 T=mk({enemies:E});const r=T.W().cast('r',false);T.run(11.4);const early=T.hits.length;T.run(12.2);
 const hitIds=[...new Set(T.hits.filter(x=>x[2]==='gunnerStrikeR561').map(x=>x[0]))].sort().join();
 ok('R: marks the densest group (p,q,s), waits ~1.6 s warning (no damage before), then one big blast hits the group but not the lone enemy',r===true&&early===0&&hitIds==='p,q,s',{early,hitIds});
 const center=Math.max(...['p','q','s'].map(id=>sum(T.hits,'gunnerStrikeR561',id)));ok('R: centre damage 3.6 × attack power at level 0 (=144), edge ≥ 55%',Math.abs(center-144)<1e-6&&['p','q','s'].every(id=>sum(T.hits,'gunnerStrikeR561',id)>=144*.55-1e-6),center);
 ok('R: cooldown 16 s, shakes the screen on impact',Math.abs(T.A().remain('r')-(26-T.sb.time))<1e-6&&T.sb.shake>=1);
 ok('R: the engine 시간 지연포 slot is held on a far cooldown while R561 owns R',T.sb.player.storyWER.ready['gunner:r']>T.sb.time+1e5);
}catch(e){ok('R runs',false,String(e));}
// ---------- 입구·자동·저장 ----------
try{T=mk();const kd=T.L.keydown&&T.L.keydown[0];kd({key:'z',target:{tagName:'CANVAS'}});kd({key:'x',target:{tagName:'CANVAS'}});kd({key:'c',target:{tagName:'CANVAS'}});
 ok('W·E·R keys (engine logical z/x/c after R291) are captured by R561',T.A().remain('w')>0&&T.A().remain('e')>0&&T.A().remain('r')>0);}catch(e){ok('keys',false,String(e));}
try{T=mk();T.sb.tick(.05);const off=T.hits.length;T.sb.auto=true;T.run(13);ok('semi-auto / guide casts gunner skills by itself when an enemy is near',off===0&&T.hits.length>0,{off,n:T.hits.length});}catch(e){ok('auto',false,String(e));}
try{T=mk({hero:'hwando'});ok('other heroes still use the original W·E·R cast',T.W().cast('w',false)==='base'&&T.W().cast('r',false)==='base');}catch(e){ok('other hero cast',false,String(e));}
try{T=mk();T.sb.tick(.05);const d=T.sb.serializeSave();ok('save: far cooldowns of the replaced gunner slots are not written; other heroes untouched',!('gunner:r' in d.storyWER.remaining)&&d.storyWER.remaining['hwando:r']===3);}catch(e){ok('save',false,String(e));}
try{T=mk();T.A().set(false);T.sb.special();T.sb.tick(.05);ok('off switch (storyworld.r561.gunner {"on":false}) gives back the engine skills and the old Q name',T.sb.__baseSpecial===1&&T.W().cast('r',false)==='base'&&T.sb.HEROES.gunner.special==='기억 재현'&&!(T.sb.player.storyWER.ready['gunner:r']>1e5));}catch(e){ok('off',false,String(e));}

// ---------- Codex #369 리뷰(2026-11-10) ----------
try{T=mk({rhythm:1.18});T.sb.special();ok('Q cooldown keeps the engine rhythm multiplier (COMBAT_RHYTHM_R26 1.18 → 11.8 s at rank 0), like W/E/R',Math.abs(T.sb.player.specialCD-11.8)<1e-6,T.sb.player.specialCD);}catch(e){ok('Q rhythm',false,String(e));}
try{T=mk({ego:true});T.sb.special();ok('Q during EGO goes to the engine special (EGO 융합 정화), not swallowed',T.sb.__baseSpecial===1,T.sb.__baseSpecial);}catch(e){ok('Q EGO',false,String(e));}
try{T=mk();const kd=T.L.keydown[0];kd({key:'c',target:{tagName:'CANVAS'}});T.run(10.5);const fresh=[{id:'n',x:13,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'},{id:'m',x:16,y:10,hp:999,maxHp:999,radius:.3,spawnState:'active'}];
 T.sb.room={enemies:fresh};T.sb.liveEnemies=()=>fresh.filter(e=>e.hp>0);T.run(14);const I=T.A().inspect();
 ok('pending shots and chains are dropped when the room changes (an R cast before a region change does not blast the new room)',!T.hits.some(h=>h[0]==='n'||h[0]==='m')&&I.chain.queue.length===0,{hits:T.hits.map(h=>h[0]+':'+h[2]),q:I.chain.queue});}catch(e){ok('room change',false,String(e));}
try{T=mk({coop:'host'});T.sb.tick(.05);ok('co-op: R561 reports itself off so R209/R291 give the original gunner W·E back (no slot left gated)',T.A().on()===false&&!(T.sb.player.storyWER.ready['gunner:r']>1e5),{on:T.A().on(),r:T.sb.player.storyWER.ready['gunner:r']});}catch(e){ok('coop',false,String(e));}

// 엔진 serializeSave 는 남은 대기를 15×박자로 자른다(먼 값이 17.7 로 저장됨) — saveClamp 로 그 결과를 흉내 낸다
try{T=mk({saveClamp:true});T.L.keydown[0]({key:'c',target:{tagName:'CANVAS'}});const d=T.sb.serializeSave().storyWER.remaining;
 ok('save writes the real gunner cooldowns (R used → ≈16 s; unused W·E not written) even though the engine clamps the gated values to 15×rhythm',Math.abs(d['gunner:r']-16)<.01&&!('gunner:w' in d)&&!('gunner:e' in d),d);}catch(e){ok('save real cd',false,String(e));}
try{T=mk();T.sb.player.storyWER.ready['gunner:r']=T.sb.time+5;T.sb.tick(.05);ok('load: a saved gunner cooldown is restored into R561 (R still 5 s away after reload)',Math.abs(T.A().remain('r')-5)<.06,T.A().remain('r'));}catch(e){ok('load cd',false,String(e));}
try{T=mk();T.sb.time=3600;T.sb.tick(.05);T.L.keydown[0]({key:'c',target:{tagName:'CANVAS'}});T.sb.player={hero:'gunner',x:10,y:10,hp:100,specialCD:0,direction:'right',storyWER:{ready:{},buffs:{}}};T.sb.time=0;T.sb.tick(.05);
 ok('new journey (time back to 0, new player) clears old cooldown timestamps — R can be used again',T.A().remain('r')===0&&T.A().fire('r',false)===true,T.A().remain('r'));}catch(e){ok('new game cd',false,String(e));}

// ---------- 연계(사용자 2026-11-10 03:23Z "스킬키를 늘리지 말고 기존 키에서 여러 스킬이 자동으로 연속으로 더 나가게, 자연스럽고 렉 신경") ----------
try{T=mk();const kd=T.L.keydown[0];kd({key:'z',target:{tagName:'CANVAS'}});T.run(10.5);const e0=T.A().remain('e');T.run(12.4);
 const order=[];for(const h of T.hits){if(!order.includes(h[2]))order.push(h[2]);}
 ok('chain: one W press → 저격, then 잔향 연사 and 회상 광선포 follow by themselves in that order (no extra key)',e0===0&&order.join()==='gunnerSnipeR561,gunnerRifleR561,gunnerBeamR561',order);
 ok('chain: follow-ups spend their own cooldowns (E 6 s, Q special 10 s) — damage budget per minute unchanged',T.A().remain('e')>4&&T.sb.player.specialCD>7,[T.A().remain('e'),T.sb.player.specialCD]);
 const t=T.A().inspect().chain;ok('chain: a beat between links (first follow-up starts ≥0.5 s after the press, never two links at once)',t.links>=2&&t.minGap>=.45&&t.overlap===0,t);}catch(e){ok('chain W',false,String(e));}
try{T=mk();T.sb.player.specialCD=5;const kd=T.L.keydown[0];kd({key:'z',target:{tagName:'CANVAS'}});T.run(12.4);ok('chain: a link that is cooling down is skipped (Q on cooldown → W then E only)',!T.hits.some(h=>h[2]==='gunnerBeamR561')&&T.hits.some(h=>h[2]==='gunnerRifleR561'));}catch(e){ok('chain skip',false,String(e));}
try{T=mk({enemies:[]});const kd=T.L.keydown[0];kd({key:'z',target:{tagName:'CANVAS'}});T.run(12.4);ok('chain: no enemy in range → no follow-ups (only the pressed shot)',T.A().remain('e')===0&&T.sb.player.specialCD===0);}catch(e){ok('chain empty',false,String(e));}
try{T=mk();const kd=T.L.keydown[0];kd({key:'z',target:{tagName:'CANVAS'}});T.run(10.2);kd({key:'c',target:{tagName:'CANVAS'}});T.run(12.4);const t=T.A().inspect().chain;
 ok('chain: pressing another key mid-chain cancels the old chain and starts the new one (player stays in control)',t.cancelled>=1&&T.A().remain('r')>0,t);}catch(e){ok('chain cancel',false,String(e));}
try{T=mk();T.A().set({chain:false});const kd=T.L.keydown[0];kd({key:'z',target:{tagName:'CANVAS'}});T.run(12.4);ok('chain off switch (storyworld.r561.gunner {"chain":false}) → single skills only',T.A().remain('e')===0&&T.sb.player.specialCD===0);}catch(e){ok('chain off',false,String(e));}
try{T=mk();T.sb.auto=true;T.run(30,.05);const I=T.A().inspect();ok('lag guard: live effect entries never exceed the cap (8) even with auto + chains for 20 s',I.peakFx<=8&&I.stats.errors===0,I);}catch(e){ok('cap',false,String(e));}
ok('drawn with R106 painted sprites in gunner colours (cobalt [70,124,255] + silver), no crosses; the only sheet asset is assets/r561/',/\[70,124,255\]/.test(src)&&/'slashline'/.test(src)&&/'ring'/.test(src)&&/'smoke'/.test(src)&&(src.match(/assets\/[a-z0-9-]+\//g)||[]).every(a=>a==='assets/r561/')&&!/'cross'|'runecross'/.test(src));
// R561-2: R 폭격 낙하 시트(R411 보스 meteor 를 코발트로 재색)
{const f=path.join(R,'runtime-text','assets','r561','gunner-bombard-meteor.webp');let sz=null;try{const b=fs.readFileSync(f);if(b.toString('ascii',12,16)==='VP8X')sz=[1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];}catch(_){}
 const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'),tbl=(()=>{try{return fs.readFileSync(path.join(__dirname,'assets.md'),'utf8');}catch(_){return '';}})();
 ok('R meteor sheet: 1152×768 (6×4 × 192) webp in runtime assets + manifest, ≤ 250 KB, with an asset table (source, hash, size, use)',sz&&sz[0]===1152&&sz[1]===768&&fs.statSync(f).size<=250000&&/assets\/r561\/gunner-bombard-meteor\.webp/.test(man)&&/gunner-bombard-meteor/.test(tbl)&&/SHA-256/.test(tbl),{sz,tbl:tbl.length});
 ok('R meteor sheet is timed so its impact frame (10 @ 12.5 fps) lands on the 1.6 s blast, and the code smoke/pillar are skipped while the sheet is shown',/impact:10/.test(src)&&/fps:12\.5/.test(src)&&/STRIKE\.delay-METEOR\.impact\/METEOR\.fps/.test(src)&&/if\(sheetOn\)/.test(src));}
ok('hero id and save format untouched (no new player fields persisted, id stays gunner)',!/player\.hero\s*=(?!=)/.test(src)&&!/HEROES\.[a-z]+\s*=/.test(src));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R561 gunner arms: ${pass}/${checks.length}`);if(pass!==checks.length)process.exitCode=1;
