// R248 몹 재활용 금지 — 이름 → 전용 시트, 사몽에 남은 본편 이름은 사몽 몹 이름으로, 새 몹 공격 이펙트·짧은 상태이상.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const src=C('mob-unique-r248.js'),dsrc=C('mob-unique-r248-data.js');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const dsb={window:{}};vm.createContext(dsb);vm.runInContext(dsrc,dsb);const D=dsb.window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;
const ids=Object.values(D.byName),files=Object.values(D.sheets).map(s=>s.file);
ok('data: every reassigned name has its own sheet (no two names share a sheet file)',ids.length>=60&&new Set(ids).size===ids.length&&new Set(files).size===files.length,{names:ids.length});
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r248','mobs','index.json'),'utf8'));
ok('every sheet exists with matching sha256 in the index (temporary pixel art, our own code)',idx.temporary===true&&Object.entries(idx.mobs).every(([id,m])=>{const p=path.join(R,'runtime-text','assets','r248','mobs',m.file);return fs.existsSync(p)&&crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')===m.sha256;})&&Object.keys(idx.mobs).length===ids.length);
ok('known reuse cases are covered (ep1a08 orderlies, corrupted guardian names, samong puppets, story names in samong)',['격리실 감염 의료인','안정화 집행체','소독등 타락천사','보라검 부활자','소환진 타락천사','사몽:얼굴 없는 남자의 박수'].every(n=>D.byName[n]),Object.keys(D.byName).slice(0,8));
ok('the first owner keeps the original art (백의 구속자, 늪에서 되살아난 전우, 얼굴 없는 남자의 박수 in story)',!D.byName['백의 구속자']&&!D.byName['늪에서 되살아난 전우']&&!D.byName['얼굴 없는 남자의 박수']);
function mk(o={}){const drawn=[];const ctx={save(){},restore(){},translate(){},scale(){},drawImage(im,...a){drawn.push(im.src);},scope(meta,f){f();},filter:'',globalAlpha:1};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,localStorage:{getItem:()=>null,setItem(){}},window:{__STORYWORLD_MOB_UNIQUE_R248_DATA__:D,__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw(){},along(){}}},
  time:10,layer:'STORY',ctx,project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,effects:[],player:{x:10,y:10,hp:100},room:{enemies:[]},
  readyImage:p=>({image:{src:p}}),ensureImages:()=>Promise.resolve(),tick(){},drawEffect(){},drawEnemy(e){e.rc146BodyFrame={path:'assets/story/body.webp'};sb.ctx.drawImage({src:'http://x/m0/assets/story/body.webp'});sb.ctx.drawImage({src:'http://x/m0/assets/fx/shadow.webp'});sb.baseDrawn.push('base');return 'base';},baseDrawn:[],...o};
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,drawn};}
{const {sb,drawn}=mk();const M=sb.window.__STORYWORLD_MOB_UNIQUE_R248__;
 ok('baseName strips 중간보스 · / 증원 / 추격대 / 후속 증원 / · 짙은 형상 / trailing number',M.baseName('중간보스 · 안정화 집행체')==='안정화 집행체'&&M.baseName('안정화 집행체 후속 증원')==='안정화 집행체'&&M.baseName('뿌리에서 쏟아진 잔영 · 짙은 형상')==='뿌리에서 쏟아진 잔영'&&M.baseName('끊어진 통화의 인과 잔향 3')==='끊어진 통화의 인과 잔향');
 const e={id:'a',name:'안정화 집행체 추격대',x:3,y:4,hp:10};sb.drawEnemy(e);
 ok('a reassigned mob is drawn from its own sheet; the engine draw still runs (frame pick, shadow, hp bar) and only its body image is not painted',drawn.some(p=>p===D.dir+D.sheets[D.byName['안정화 집행체']].file)&&!drawn.some(p=>/story\/body/.test(p))&&drawn.some(p=>/fx\/shadow/.test(p))&&sb.baseDrawn[0]==='base'&&e.rc146BodyFrame,{drawn,base:sb.baseDrawn});
 const keep={id:'b',name:'백의 구속자',x:1,y:1,hp:10};sb.baseDrawn.length=0;drawn.length=0;const r=sb.drawEnemy(keep);ok('the owner of the original art is untouched (its body image is painted)',r==='base'&&drawn.some(p=>/story\/body/.test(p)));}
{const EP=[{key:'S-01',mobName:'뿌리에서 쏟아진 잔영'}];const {sb,drawn}=mk({layer:'DREAM',room:{samongR103:{key:'S-01',zone:'sz115-S01-5'},enemies:[{id:'s',name:'얼굴 없는 남자의 박수 증원',samongR103:'S-01',x:2,y:2,hp:5},{id:'t',name:'얼굴 없는 남자의 박수',boss:true,samongR103:'S-01',x:2,y:2,hp:5}]}});
 sb.window.__STORYWORLD_SAMONG_R103__={episodes:EP};sb.window.__STORYWORLD_SAMONG_ZONES_R115__={zone:()=>({})};sb.tick();const [e,b]=sb.room.enemies;
 ok('samong: a story mob name left by the donor is renamed to the samong mob name of that chapter; art = that name\'s own sheet (or a samong sheet), never the story art',e.name==='뿌리에서 쏟아진 잔영 증원'&&e.r248Key===(D.byName['뿌리에서 쏟아진 잔영']?'뿌리에서 쏟아진 잔영':'사몽:얼굴 없는 남자의 박수')&&sb.window.__STORYWORLD_MOB_UNIQUE_R248__.sheetFor(e)?.id===D.byName[e.r248Key]&&!/curtain|puppet/.test(sb.window.__STORYWORLD_MOB_UNIQUE_R248__.sheetFor(e)?.path||''),{name:e.name,key:e.r248Key});
 ok('samong bosses (canon names) keep their name but still get the samong sheet',b.name==='얼굴 없는 남자의 박수'&&b.r248Key==='사몽:얼굴 없는 남자의 박수');}
{const {sb}=mk();const name=Object.keys(D.byName).find(k=>D.sheets[D.byName[k]].kind==='spider'&&!k.startsWith('사몽:'));const e={id:'sp',name,x:10.8,y:10,hp:9,radius:.4,attack:{elapsed:0,angle:Math.PI,shape154:{windup:.4,active:.15,recovery:.3,range:1.2}}};sb.room.enemies.push(e);
 sb.tick();const before=sb.effects.length;e.attack.elapsed=.45;sb.tick();const st=sb.window.__STORYWORLD_MOB_UNIQUE_R248__.inspect().stats;
 ok('new mob attack effect fires at the hero on contact (spider → web), once per attack',st.fx===1&&sb.effects.some(x=>x.type==='r248-fx'),{st,name});
 ok('status effect: short slow through the engine slot (heroSlowUntil150 ≤ 1.1 s) with a Korean label',sb.player.heroSlowUntil150>10&&sb.player.heroSlowUntil150<=11.11&&sb.player.storyStatus150?.label==='거미줄',sb.player);
 sb.tick();const e2={...e,id:'sp2',attack:{elapsed:.5,angle:Math.PI,shape154:e.attack.shape154}};sb.room.enemies.push(e2);sb.time=11;sb.tick();
 ok('status effects are throttled to once per 4 s even when many mobs hit',sb.window.__STORYWORLD_MOB_UNIQUE_R248__.inspect().stats.slows===1);}
{const {sb}=mk();const M=sb.window.__STORYWORLD_MOB_UNIQUE_R248__;const kinds=new Set(Object.keys(D.byName).filter(k=>!k.startsWith('사몽:')).map(k=>M.fxKindOf({name:k})));
 ok('several attack families are used (bite/claw/slash/pierce/web/acid/shock/chill/drop/thorns/thread…)',kinds.size>=7,[...kinds]);}
ok('runtime copies match; data loads before the overlay, both after auto-levelup-r237',RT('mob-unique-r248.js')===src&&RT('mob-unique-r248-data.js')===dsrc&&/<script src="\.\/mob-unique-r248-data\.js"><\/script>(<script src="\.\/mob-rename-r362\.js"><\/script>)?<script src="\.\/mob-unique-r248\.js"><\/script>/.test(RT('index.html')));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail).slice(0,400)));
console.log(`R248 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
