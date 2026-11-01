// R188 CPU check: 죽을 때 다른 몹 그림 방지, 바닥 가장자리 곡선, 인형(hit-flash) 이펙트 제거, 촉수는 적 전용, 미카엘라 핏빛.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');
ok('mob-death-r188 and edges-r188 load after samong-void-r186, before combat-r118',idx.indexOf('./mob-death-r188.js')>idx.indexOf('./samong-void-r186.js')&&idx.indexOf('./edges-r188.js')>idx.indexOf('./mob-death-r188.js')&&idx.indexOf('./edges-r188.js')<idx.indexOf('./combat-r118.js'));
for(const f of ['mob-death-r188.js','edges-r188.js','skills-r181.js','hero-fx-r102.js','samong-play-r162.js','samong-r103.js'])ok('runtime copy matches · '+f,RT(f)===C(f));
const pub=fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8');ok('both new scripts in the public verify list',/'mob-death-r188\.js'/.test(pub)&&/'edges-r188\.js'/.test(pub));
// 죽음 그림: frameFor 사슬 바깥에서 살아 있을 때 그림을 기억 → 죽은 뒤 다른 그림이면 되돌림
const sb={window:{},localStorage:{getItem:()=>null,setItem(){}}};
const calls=[];sb.window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({clock:()=>null,frameFor(e){return e.hp>0?{path:'assets/r116/mobs/M005-idle.png'}:{path:'assets/episode1a/goat_head_demon_mob_bloodied.webp'};}});
vm.createContext(sb);vm.runInContext(C('mob-death-r188.js'),sb);
const S=sb.window.__STORYWORLD_STORY_COMBAT_R54__,e={hp:10};const a=S.frameFor(e);e.hp=0;const d=S.frameFor(e);const boss={hp:0,boss:true};
ok('a dying mob keeps the picture it had alive (not the native other-mob death art)',a.path===d.path&&/M005/.test(d.path),[a.path,d.path]);
ok('bosses and never-remembered mobs keep the original death frame',/bloodied/.test(S.frameFor(boss).path)&&/bloodied/.test(S.frameFor({hp:0}).path));
ok('other frameFor-chain members are preserved (clock)',typeof S.clock==='function');
// 가장자리
const E=C('edges-r188.js');
ok('edge plane: one presentation-only mesh, depthWrite false, collision unchanged, walls excluded from erosion',(E.match(/new T\.Mesh\(/g)||[]).length===1&&/depthWrite:false/.test(E)&&/collisionChanged:false/.test(E)&&/a\*=1-Math\.min\(1,Wl\[k\]\/255\*1\.4\)/.test(E));
ok('samong edge uses the R186 flesh texture aligned to the void plane; settings toggle r188Edges',/assets\/r186\/flesh-void\.webp/.test(E)&&/\(\(m\.x0-\(b\[0\]-80\)\)\/9\)%1/.test(E)&&/c\.id='r188Edges'/.test(E));
ok('mask built once per zone key, capped size (no per-frame work)',/if\(r\.r188EdgeKey!==key\)/.test(E)&&/W\*H>2\.6e6/.test(E));
// 인형·촉수·귀여움
const all=fs.readdirSync(path.join(R,'client-source')).filter(f=>f.endsWith('.js')).map(f=>[f,C(f)]);
ok("no code plays the R163 'hit-flash' sheet (it is a chibi doll sheet)",!all.some(([f,s])=>/play\('hit-flash'/.test(s)),all.filter(([f,s])=>/play\('hit-flash'/.test(s)).map(x=>x[0]));
const S103=C('samong-r103.js');ok('wave blood hands spawn at the enemy ring, never under the hero',!/play\?\.\('hands-blood',player\.x,player\.y/.test(S103)&&/px=player\.x\+Math\.cos\(a\)\*6/.test(S103));
ok("tendrils-blood is only used by enemy code (combat-r170 towers, samong-play-r162 boss pattern)",all.filter(([f,s])=>/play\('tendrils-blood'/.test(s)).every(([f])=>['combat-r170.js','samong-play-r162.js'].includes(f)));
ok('Michaela palette is blood rose, not pink; her pink art is darkened when drawn',/michaela:pal\(\{a:\[178,26,62\]/.test(C('hero-fx-r102.js'))&&/hue-rotate\(-32deg\) brightness\(\.7\)/.test(C('skills-r181.js')));
ok('only Three.js-recordable CSS filters are used (no drop-shadow/blur on the game ctx)',!/ctx\.filter=[^;]*(drop-shadow|blur)/.test(C('skills-r181.js')));
for(const f of ['mob-death-r188.js','edges-r188.js','skills-r181.js','samong-r103.js'])ok('parses · '+f,(()=>{try{new vm.Script(C(f));return true;}catch(e){return false;}})());
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
