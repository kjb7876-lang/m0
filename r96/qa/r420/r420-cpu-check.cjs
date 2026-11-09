// R420 CPU check: 보기 편의 — 밝기 슬라이더·글자 크기·포탈 이름표 옅게·영웅 각성 그림 첫 로딩 미루기.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=path.join(R,'runtime-text');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const F='access-r420.js',src=C(F);ok(F+' runtime copy matches',fs.readFileSync(path.join(RT,F),'utf8')===src);
const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
ok('loads after props-place/sin-room-art and right before combat-read-r409',/<script src="\.\/access-r420\.js"><\/script>(?:<script src="\.\/readability-r434\.js"><\/script>)?(?:<script src="\.\/surface-r435\.js"><\/script>)?(?:<script src="\.\/bossroom-tidy-r438\.js"><\/script>)?(?:<script src="\.\/props-space-r447\.js"><\/script>)?<script src="\.\/combat-read-r409\.js"><\/script>/.test(html)&&html.indexOf('cinema-r114.js')<html.indexOf(F)&&html.split(F).length===2);
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r420/r420-cpu-check.cjs'));
const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
ok('runtime-manifest hash matches',M.get(F)===crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,F))).digest('hex'));
// 첫 로딩: 8영웅 각성 그림 전부 → 환도 것만(heroPaths('hwando') 안). 다른 영웅 것은 지역 입장 때 heroPaths(player.hero) 로 받는다.
ok('boot no longer decodes every hero awakening image',!html.includes('flatMap(id=>[heroArt[id].idle.front,heroArt[id].awakening])')&&html.includes('...heroPaths(\'hwando\'),...Object.keys(HEROES).map(id=>heroArt[id].idle.front),'));
ok('region entry still loads the current hero (awakening included via heroPaths)',html.includes('...heroPaths(player.hero),...Object.values(VFX)],(n,total)=>loadingText(\'지역 그림 \'')&&/heroArt\[heroId\]\?\.awakening/.test(html));
const code=src.split('\n').filter(l=>!l.trim().startsWith('//')).join('\n');ok('no game ctx.filter / no blur or drop-shadow',!/ctx\.filter|drop-shadow|blur\(/.test(code));
ok('does not touch saves, damage, maps',!/hitEnemy|damage|saveGame|localStorage\.removeItem|enterRegion|regionById\[/.test(src));

// 전투 집중 HUD(사용자 2026-11-08): PC(pointer:fine, 781px+)만, 보스 체력 띠·메뉴는 안 옅게, 밝기·색은 그대로
ok('focus HUD is PC-only (pointer:fine, min-width 781px)',src.includes("FOCUS_MQ='(min-width:781px) and (pointer:fine)'"));
ok('focus HUD on by default',/DEF=Object\.freeze\(\{[^}]*focus:true/.test(src));
ok('combat fade keeps the boss bar and menu',src.includes('header:not(:hover)>*:not(#bossbar):not(nav){opacity:.32}'));
ok('focus HUD extends the game view under the footer',src.includes("body.r420-focus #stage{bottom:0!important}"));
ok('focus HUD does not change brightness or colour of the game view',!/r420-focus[^']*#stage\{[^}]*filter/.test(src)&&!/r420-focus[^']*(canvas|#game)\{/.test(src));
ok('R421: memory paper (R177 #r177Doc) fades only in combat focus and returns on hover',src.includes('body.r420-focus.r420-combat #r177Doc:not(:hover){opacity:.4}'));
ok('R421: touch hint text C를 눌러 → 버튼을 눌러 (updateHUD wrap, coarse only)',src.includes("n.split(k+'를 눌러').join('버튼을 눌러')")&&/function fixHint\(\)\{if\(!coarse\(\)/.test(src));
ok('R421: 3D scene caption wraps by word with a soft backing, scene brightness untouched',src.includes('html body #r183 .cap{word-break:keep-all;text-wrap:balance')&&!/#r183[^{]*\{[^}]*filter/.test(src));
ok('R432: phone music note (R313 #r331BgmNote) sits below the top button row',src.includes('@media (max-width:780px){html body #r331BgmNote{top:calc(132px + env(safe-area-inset-top,0px))!important'));
ok('R432: PC memory paper (R177 #r177Doc) steps left of the compass and minimap (right 118px, top 118px)',src.includes('@media (min-width:1100px){html body #r177Doc{top:118px;right:118px;max-height:min(52vh,calc(100vh - 236px))}'));
ok('R432: paged paper (R182) ends above the bottom HUD (beats #r177Doc.r182pages specificity)',src.includes('html body #r177Doc.r182pages{max-height:calc(100vh - 236px)}html body #r177Doc.r182pages .pg{max-height:calc(100vh - 302px)}'));
ok('focus HUD can be turned off in settings',src.includes('id="r420Focus"'));
// 샌드박스 실행
function run(store){const listeners=[];const stage={style:{filter:''}};const els={};
 const ctx={globalAlpha:1,measureText:t=>({width:String(t).length*8})};const drawn=[];
 ctx.fillText=function(t,x,y){drawn.push({t,x,y,a:this.globalAlpha});};
 const proto=Object.getPrototypeOf(ctx);
 const sb={console,Math,JSON,Number,String,Object,Set,WeakMap,Array,Error,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
  matchMedia:()=>({matches:false}),requestAnimationFrame:f=>0,setInterval:()=>0,getComputedStyle:()=>({fontSize:'9px'}),
  document:{getElementById:id=>id==='stage'?stage:(els[id]||null),querySelectorAll:()=>[],createElement:()=>({style:{},textContent:''}),head:{appendChild:el=>{els[el.id||'x']=el;}}},
  player:{x:5,y:5},ctx,KR291:{i:'C'},zoom:1,
  project:(x,y)=>({x:(x-y)*32+640,y:(x+y)*16}),actorHeight:()=>66,
  openPanel:function(){return 1;}};
 sb.drawExits=function(){ctx.fillText('이전 시작점 · 마수궁 피난 거점',640,160+20);ctx.fillText('C · 이동',640,160+35);ctx.fillText('다음 기억 · 거미동굴',900,400);ctx.fillText('적 처치 0/3',640,170);};
 sb.window=sb;vm.createContext(sb);vm.runInContext(src,sb);return{sb,stage,ctx,drawn};}
{const {sb,stage,ctx,drawn}=run({});const api=sb.__STORYWORLD_ACCESS_R420__;
 ok('default keeps the look: brightness 100% -> no stage filter',api.prefs().bright===100&&stage.style.filter==='');
 ok('default text size is base',api.prefs().text==='base');
 sb.drawExits();
 const near=drawn.find(d=>d.t.startsWith('이전 시작점')),move=drawn.find(d=>d.t==='C · 이동'),far=drawn.find(d=>d.t.startsWith('다음 기억')),other=drawn.find(d=>d.t.startsWith('적 처치'));
 ok('portal label over the hero body is faded to 38%',near&&Math.abs(near.a-.38)<1e-9,near);
 ok('move hint below the hero feet stays fully readable (desktop keeps C)',move&&move.a===1&&move.t==='C · 이동',move);
 ok('portal label away from the hero is drawn as before',far&&far.a===1,far);
 ok('non-portal text is untouched',other&&other.a===1,other);
 ok('ctx.fillText restored after drawExits',!Object.prototype.hasOwnProperty.call(ctx,'fillText')||ctx.fillText.toString().includes('drawn.push'));
 ok('globalAlpha restored',ctx.globalAlpha===1);
 api.set({bright:130});ok('brightness 130% -> CSS brightness on #stage only',stage.style.filter==='brightness(1.30)');
 api.set({bright:999});ok('brightness clamps to 160%',api.prefs().bright===160);
 api.set({bright:100});ok('back to 100% clears the filter',stage.style.filter==='');}
{const {sb,stage}=run({'storyworld.r420.access':JSON.stringify({bright:120,text:'large'})});
 ok('saved prefs restored on load',sb.__STORYWORLD_ACCESS_R420__.prefs().bright===120&&sb.__STORYWORLD_ACCESS_R420__.prefs().text==='large'&&stage.style.filter==='brightness(1.20)');}
{const {sb}=run({});const tt=sb.__STORYWORLD_ACCESS_R420__.touchText;
 ok('touchText maps the portal hint',tt('포탈 · C를 눌러 이동 · 거미동굴')==='포탈 · 버튼을 눌러 이동 · 거미동굴');
 ok('touchText maps leading key labels and altar hints',tt('C · 경계 제단 / 세계 전환')==='버튼 · 경계 제단 / 세계 전환'&&tt('제단에서 C · 다음 단계')==='제단에서 버튼 · 다음 단계');
 ok('touchText leaves other text alone',tt('적 처치 0/3 · Combat')==='적 처치 0/3 · Combat');}
{const {sb}=run({'storyworld.r420.access':'{bad json'});ok('broken saved prefs fall back to defaults',sb.__STORYWORLD_ACCESS_R420__.prefs().bright===100);}

const failed=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail||'')));
console.log(JSON.stringify({check:'r420',total:checks.length,failed:failed.length}));process.exit(failed.length?1:0);
