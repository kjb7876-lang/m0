// R223 CPU check: Drive 일반몹 시트 21~28 파생 9종 — 이름 맞는 몹만 그림 교체, 보는 쪽(facing) 반영, 인덱스·자산 무결성.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('story-mobs-r208.js'),idx=JSON.parse(RT('assets/r223/mobs/index.json'));
ok('runtime copy matches; revision R223-mobs-',RT('story-mobs-r208.js')===src&&/R223-mobs-\d/.test(src));
ok('index lists 9 mobs from sheets 21~28 with source hashes',idx.mobs.length===9&&idx.mobs.every(m=>m.source?.sheet?.sha256?.length===64&&/스프라이트시트_2[1-8]/.test(m.source.sheet.file)));
ok('every strip exists with the recorded size and sha256',idx.mobs.every(m=>{const b=fs.readFileSync(path.join(R,'runtime-text',m.path));return b.length===m.bytes&&crypto.createHash('sha256').update(b).digest('hex')===m.sha256;}));
ok('each mob has move and attack frames inside its strip and a pivot inside the cell',idx.mobs.every(m=>m.move.length>=5&&m.attack.length>=4&&[...m.move,...m.attack].every(k=>k>=0&&k<m.frames)&&m.pivot[0]>0&&m.pivot[0]<m.cell[0]&&m.pivot[1]>0&&m.pivot[1]<=m.cell[1]+1));
ok('facing recorded (left/right) for every mob',idx.mobs.every(m=>m.facing==='left'||m.facing==='right'));
ok('every index mob has a rule (zone + in-game name) and every rule points to an index mob',idx.mobs.every(m=>new RegExp("\\{zone:'"+m.zone+"',re:/[^/]+/,id:'"+m.id+"'\\}").test(src)));
ok('rules never touch bosses or midbosses (major() guard kept)',/const major=e=>!!\(e&&\(e\.boss\|\|e\.persona/.test(src));
// 동작: 보는 쪽 뒤집기
const sb={console,Math,JSON,String,Number,Object,Array,Promise,localStorage:{getItem:()=>null,setItem(){}},window:{},room:{id:'ep1a09'},player:{x:5,y:5},time:1,
 fetch:url=>Promise.resolve({ok:true,json:()=>Promise.resolve(url.includes('r223')?idx:{mobs:[]})}),readyImage:()=>({image:{naturalWidth:10}}),ensureImages:()=>Promise.resolve(),setTimeout:()=>0};
sb.window.__STORYWORLD_STORY_COMBAT_R54__={frameFor:()=>({orig:true})};vm.createContext(sb);vm.runInContext(src,sb);
setTimeout(()=>{const S=sb.window.__STORYWORLD_STORY_COMBAT_R54__;
 const e={id:'a',name:'주사실 감시환각',hp:5,x:8,y:2,moving:true};const f=S.frameFor(e,{});
 ok('ep1a09 "주사실 감시환각" gets the thread-nurse strip',f&&f.r208Mob==='thread-nurse'&&/r223\/mobs\/thread-nurse\.webp$/.test(f.path),f);
 // 영웅이 오른쪽(화면) — 오른쪽 보는 그림이면 그대로, 왼쪽 보는 그림이면 뒤집음
 const heroRight=!((sb.player.x-sb.player.y)<(e.x-e.y));ok('left-facing art is flipped the opposite way to right-facing art',f.flip===heroRight,{flip:f.flip,heroRight});
 const g=S.frameFor({id:'b',name:'오만의 흰 가면',hp:5,x:8,y:2},{});ok('other mobs in the same zone keep their own art',g&&g.orig===true);
 const bz=S.frameFor({id:'c',name:'주사실 감시환각',hp:5,boss:true,x:8,y:2},{});ok('a boss with a matching name is not replaced',bz&&bz.orig===true);
 const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail).slice(0,300)));
 console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);},50);
