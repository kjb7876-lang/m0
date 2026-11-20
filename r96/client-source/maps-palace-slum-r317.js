// R317 — existing-art presentation only. The two R171 maps keep their R204 geometry,
// collisions, doors, rosters and progress. No new boss is placed in ep1a09b.
// Assets in assets/r317/index.json are temporary references; original files are read only.
(()=>{'use strict';
if(window.__STORYWORLD_MAPS_PALACE_SLUM_R317__)return;
const REV='R317-palace-slum-1',KEY='storyworld.r317.betrayal';
const PATHS=Object.freeze({blood:'assets/r161/tiles/blood-memory.webp',asphalt:'assets/r118/tiles/asphalt.webp',
 column:'assets/world-r80/r80-021.webp',arch:'assets/world-r80/r80-011.webp',seal:'assets/world-r80/r80-072.webp',tree:'assets/r299/tree.webp',
 storefront:'assets/world-r80/r80-073.webp',papers:'assets/r299/papers.webp',crack:'assets/r299/stone-cracked.webp',stain:'assets/r299/blood-dried.webp',
 syringe:'assets/r138/props/syringe.webp',bag:'assets/r299/suitcase.webp',
 angel:'assets/generated-v31224/actors-normalized/a6f6c2767d0f_ep1a_false_archangel_smiling_mask.webp',
 balrog:'assets/r104/bosses/dist06-boss-p4.webp',guardian:'assets/episode1a/corrupted_guardian.webp',veil:'assets/world-r80/r80-089.webp',
 glow:'assets/r106/fx/glow.webp',flare:'assets/r106/fx/flare.webp',smoke:'assets/r106/fx/smoke.webp'});
// Literal excerpts of hapil-canon-r106-improved.txt [09]/[10], including punctuation.
const CAPTIONS=Object.freeze(['초천사가 웃으며 권능을 펼쳤다.','그런데 사라진 것은 악마들이 아니었다.','수호자 가운데 남아 있는 것은 나 하나뿐이었다.']);
const WALL_TEXT=Object.freeze(['나는 다른 사람과 다르며','마음만 먹으면 끊을 수 있고','이번이 마지막이라는 믿음이었다.']);
// R1237(사용자 2026-11-19 11:44Z): 상점 건물 벽 글자는 늘 보이지 않는다 — 건물 앞에서 C(상호작용)를 누르면 창으로 읽는다.
//  창 글 = 정본 [10] 문장 그대로(위 WALL_TEXT 세 줄이 나뉘어 있던 바로 그 문장, 쉼표 포함). 제목 '누군가의 낙서'는 사용자 지정.
const GRAFFITI=Object.freeze({title:'누군가의 낙서',text:'나는 다른 사람과 다르며, 마음만 먹으면 끊을 수 있고, 이번이 마지막이라는 믿음이었다.',reach:3.2,height:210});
// R1237(11:51Z): '과거의 봉인 성물함'(r80-072)은 결전의 날 보스방에 큰 것 하나만. 두 지역의 R80/R81 장면 소품 성물함은 뺀다.
const SEAL_PATH='assets/world-r80/r80-072.webp',SEAL_ZONES=new Set(['ep1a09b','ep1a10']);
//  장면 소품 수(지역마다 8개, R81·R86 관문)는 지키므로 빼지 않고 지역에 맞는 기존 R80 그림으로 바꿔 입힌다(새 자산 없음):
//  중독의 도시 = 쓰레기 더미(r80-025)·신호등(r80-052) 번갈아, 결전의 날 = 무너진 궁전 기둥(r80-021).
const SEAL_SWAP=Object.freeze({ep1a10:['r80-025','r80-052'],ep1a09b:['r80-021']});
function pruneSeals(r){if(!r||!Array.isArray(r.props)||r.layer!=='STORY'||!SEAL_ZONES.has(r.id))return 0;const D=window.__STORYWORLD_ASSETS_R80_DATA__,keys=SEAL_SWAP[r.id];let n=0;
 for(const p of r.props){if(!p||p.r317||!p.r80Dressing||String(p.path||'')!==SEAL_PATH)continue;const key=keys[n%keys.length],a=D?.assets?.[key];n++;
  if(a){p.path=a.path;p.r80Art=key;p.height=64*(a.scale||1);p.r1237Reskin=true;}else p.visible=false;}
 if(n&&typeof ensureImages==='function')try{Promise.resolve(ensureImages([...new Set(keys.map(k=>D?.assets?.[k]?.path).filter(Boolean))])).catch(fail);}catch(e){fail(e);}
 return n;}
// R1278(사용자 2026-11-20 "불을지른 남자 맵에 이거 조형물 있는거 제거"): 불을 지른 남자(ep1b07)의 쓰러진 흰 대리석 기둥(r80-021)은 이 지역에서만 뺀다.
//  기둥은 R94 가 '계단참'(r80-032)을 같은 계열 그림으로 바꾼 R80/R81 장면 소품과 R74 장식의 물려받은 그림이다 — 모두 비고체. 장면 소품 8개 관문을 지키려 목록에서 지우지 않고 숨긴다(visible:false).
const COL_ZONE='ep1b07',COL_RE=/world-r80\/r80-021\.webp$/;
const isColumn=p=>!!p&&(COL_RE.test(String(p.path||''))||COL_RE.test(String(p.r81NativeSkin?.path||''))||p.r80Art==='r80-021');
function pruneColumns(r){if(!r||!Array.isArray(r.props)||r.layer!=='STORY'||r.id!==COL_ZONE)return 0;let n=0;
 for(const p of r.props)if(isColumn(p)&&p.visible!==false){p.visible=false;p.r1278Hidden=true;n++;}return n;}
const SPECS=Object.freeze({ep1a09b:{file:'blood-memory',dir:'assets/r161/tiles/',floor:0xdab8b2,wall:0x9c8664},ep1a10:{file:'asphalt',dir:'assets/r118/tiles/',floor:0xdce2ee,wall:0x87919c}});
const stats={layouts:0,rooms:0,plays:0,skips:0,completed:0,errors:0};let lastError=null,active=null,seen=false;
try{seen=JSON.parse(localStorage.getItem(KEY)||'null')?.seen===true;}catch(_){}
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
const solo=()=>{const s=window.__STORYWORLD_COOP_SIM_R62__;return !s?.mode||s.mode()==='off';};
const eligible=r=>!!(r&&SPECS[r.id]&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&!r.exploration?.samongR103&&solo());
// Only this hook selects the floor/wall presentation. Preserve the exact original arrays/objects.
const layouts=new WeakSet();
function themeLayout(id,L){const s=SPECS[id];if(!s||!L||layouts.has(L)||!solo()||L.samongR103||L.samongR115)return L;
 layouts.add(L);const art=L.surface?.art||{};
 L.surface={...L.surface,art:{...art,r317Theme:id,r118Tiles:{id,file:s.file,dir:s.dir,floor:s.floor},r81Palette:{...art.r81Palette,wall:s.wall,cap:s.wall}}};
 stats.layouts++;return L;}
const previousLayout=window.__STORYWORLD_LAYOUT_HOOK_R204__;
window.__STORYWORLD_LAYOUT_HOOK_R204__=function(id,L){const out=previousLayout?.(id,L)||L;return themeLayout(id,out);};

function avoid(r){const L=r.exploration,out=[];for(const d of L.worldR74?.doors||[])out.push({x:d.x,y:d.y,r:Math.max(3.5,(Number(d.width)||0)/2+2)});
 for(const q of[L.entry,L.gate,r.objective,r.altar,L.altar])if(q&&Number.isFinite(q.x+q.y))out.push({...q,r:3.5});
 for(const p of r.props||[])if(p&&!p.r317&&Number.isFinite(p.x+p.y))out.push({x:p.x,y:p.y,r:p.interactive||p.solid||p.r74Door||p.r81WardDoor?3:1.6});return out;}
// R1237: 상점 건물은 벽에 붙인다. 그림의 앞면은 화면 왼쪽 아래(+y)를 보고, 몸통은 가까운 모서리에서 -x·-y 쪽(화면 위)으로 뻗는다.
//  → 뒤(-y)가 벽인 자리(좌우 반전하면 뒤가 -x). 벽은 모서리에서 카메라 반대쪽으로 5칸 이어지고, 카메라 쪽(+)으로는 2칸 안에 끝나야 한다
//  (벽이 카메라 쪽으로 더 이어지면 3D 벽 덩어리가 건물 그림 아래쪽을 가린다 — 헤드리스 확인). 앞쪽 3줄은 바닥. 앵커는 벽에서 2.1칸 앞(그림 발밑 — 그림 옆면 깊이만큼 띄워 벽 끝 머리가 건물에 안 겹치게).
function wallSpots(L,near){const F=new Set(L.floorCells.map(c=>c.join(','))),fl=(x,y)=>F.has(x+','+y),out=[];
 for(const [x,y]of L.floorCells){for(const side of['-y','-x']){const along=(i)=>side==='-y'?[x+i,y]:[x,y+i],back=([ax,ay])=>side==='-y'?[ax,ay-1]:[ax-1,ay],fwd=([ax,ay],d)=>side==='-y'?[ax,ay+d]:[ax+d,ay];let ok=true;
   for(let i=-4;i<=0&&ok;i++){const c=along(i);if(!fl(...c)||fl(...back(c)))ok=false;for(let d=1;d<=3&&ok;d++)if(!fl(...fwd(c,d)))ok=false;}
   for(let i=1;i<=2&&ok;i++){const c=along(i);if(!fl(...c)||!fl(...back(c)))ok=false;}
   if(!ok)continue;const p=side==='-y'?{x:x+.5,y:y+2.1}:{x:x+2.1,y:y+.5};if(near.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=q.r+2))out.push({...p,wall:{side,cx:x,cy:y}});}}return out;}
function plan(r){if(!eligible(r)||!r.exploration?.floorCells?.length)return[];const L=r.exploration,F=new Set(L.floorCells.map(c=>c.join(','))),near=avoid(r),used=[],out=[];
 // Fully open 5x5 only: retain a readable passage; every addition is non-solid.
 const open=L.floorCells.filter(([x,y])=>{for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(!F.has((x+i)+','+(y+j)))return false;return true;}).map(([x,y])=>({x:x+.5,y:y+.5}));
 const take=(name,h,kind='prop',focus=null)=>{const pool=open.filter(p=>near.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=q.r)&&used.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=4));
  const target=focus||{x:33,y:34};pool.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y)||a.y-b.y||a.x-b.x);const p=pool[0];if(!p)return;used.push(p);out.push({...p,name,path:PATHS[name],height:h,kind});};
 if(r.id==='ep1a09b'){take('tree',150,'prop',L.worldWardR81?.bossAnchor||{x:16,y:13});take('column',55);take('arch',100);take('seal',130,'prop',{x:13,y:8});take('stain',80,'decal');take('crack',70,'decal');}
 else{const spots=wallSpots(L,near);for(const focus of[{x:33,y:34},{x:47,y:54}]){const pool=spots.filter(p=>out.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=8));
   pool.sort((a,b)=>Math.hypot(a.x-focus.x,a.y-focus.y)-Math.hypot(b.x-focus.x,b.y-focus.y)||a.y-b.y||a.x-b.x);const p=pool[0];
   if(p){used.push(p);out.push({x:p.x,y:p.y,name:'storefront',path:PATHS.storefront,height:GRAFFITI.height,kind:'prop',r1237Wall:p.wall,r1237Flip:p.wall.side==='-x'});}else take('storefront',100,'prop',focus);}
  take('bag',26);take('syringe',24,'decal');take('papers',75,'decal');take('crack',70,'decal');}
 return out;}
const rooms=new WeakMap(),loaded=new Set();
function ensure(p){if(typeof readyImage==='function'&&readyImage(p))return true;if(!loaded.has(p)){loaded.add(p);try{if(typeof addImage==='function')addImage(p,'R317 existing temporary art');if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(fail);}catch(e){fail(e);}}return false;}
function apply(r){pruneSeals(r);pruneColumns(r);if(!eligible(r)||!Array.isArray(r.props)||!r.exploration||rooms.get(r)===r.exploration)return;
 rooms.set(r,r.exploration);const list=plan(r);r.r317Decals=[];for(const [i,p]of list.entries()){ensure(p.path);if(p.kind==='decal'){r.r317Decals.push(p);continue;}
 r.props.push({...p,id:'r317:'+r.id+':'+i,r317:true,...(p.name==='seal'?{r1237Seal:true}:{}),solid:false,visible:true,enabled:true,interactive:false,autoTargetEligible6:false,r80PresentationOnly:true});}stats.rooms++;}
function visible(x,y){const s=window.__STORYWORLD_SIGHT24__;return !s?.enabled||s.pointVisible(x,y);}
function drawOwn(p){/* R1278: R81 이 나중에 입히는 물려받은 그림까지 그릴 때 한 번 더 숨긴다 */if(isColumn(p)&&typeof room!=='undefined'&&room?.id===COL_ZONE&&room.layer==='STORY'){if(p.visible!==false){p.visible=false;p.r1278Hidden=true;}return true;}if(!p?.r317)return false;if(p.visible===false||!visible(p.x,p.y))return true;
 if(ensure(p.path)&&typeof sprite==='function'){const q=project(p.x,p.y),z=typeof zoom==='number'?zoom:1,h=p.height*z,hero=project(player.x,player.y),behind=q.y>hero.y-3&&q.y-h<hero.y-15&&Math.abs(q.x-hero.x)<h*.55;
 const paint=()=>sprite(p.path,q.x,q.y,h,{alpha:behind?.32:1,filter:'brightness(.94) saturate(.85)',flip:!!p.r1237Flip});
 const detailed=()=>{paint();if(p.name==='storefront'){
 /* R1237: 늘 보이던 벽 글자는 그리지 않는다 — 건물 앞 C 로 '누군가의 낙서' 창에서 읽는다. */
 // Existing painted glow, small local reflected neon; no full-screen tint.
 window.__STORYWORLD_FX_SPRITES_R106__?.draw?.('glow',{a:[60,86,112],b:[136,170,186]},q.x,q.y,70*z*p.height/100,18*z*p.height/100,{alpha:.3,blend:'lighter'});
 }};
 if(typeof ctx?.scope==='function')ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:p.path,alive:true},detailed);else detailed();}return true;}
try{const P=window.__STORYWORLD_PERF_GROUPS_R266__;if(P?.registerPropRenderer)P.registerPropRenderer(drawOwn);
 else if(typeof drawProp==='function'){const b=drawProp;drawProp=function(p,...a){if(drawOwn(p))return;return b.call(this,p,...a);};}}catch(e){fail(e);}
function decals(){if(typeof room==='undefined'||!eligible(room)||!room.r317Decals?.length)return;
 const z=typeof zoom==='number'?zoom:1;for(const d of room.r317Decals){if(!visible(d.x,d.y)||!ensure(d.path))continue;const row=readyImage(d.path),im=row.image,q=project(d.x,d.y),w=d.height*z,h=w*(im.naturalHeight||im.height)/(im.naturalWidth||im.width);
 const paint=()=>{ctx.save();try{ctx.globalAlpha*=d.name==='syringe'?.85:.5;ctx.drawImage(im,q.x-w/2,q.y-h/2,w,h);}finally{ctx.restore();}};
 if(ctx.scope)ctx.scope({id:'r317:decal:'+d.name,kind:'ground',x:d.x,y:d.y,groundAligned:true,presentationOnly:true,alive:false,sourcePath:d.path},paint);else paint();}}
if(typeof groundImage==='function'){const b=groundImage;groundImage=function(...a){const out=b.apply(this,a);try{decals();}catch(e){fail(e);}return out;};}
if(typeof makeRoom==='function'){const b=makeRoom;makeRoom=function(...a){const r=b.apply(this,a);try{apply(r);}catch(e){fail(e);}return r;};}
// R1237: 건물 앞에서 C → '누군가의 낙서'. 다른 덧씌우기가 base 를 안 부르는 경우가 있어 첫 tick 에 바깥에서 얹는다(R840·R1060 과 같은 방식).
const graffitiSpot=p=>({x:p.x,y:p.y});
function graffitiNear(r){if(!r||r.id!=='ep1a10'||r.layer!=='STORY'||typeof player==='undefined'||!player)return null;let best=null,bd=GRAFFITI.reach;
 for(const p of r.props||[]){if(!p?.r317||p.name!=='storefront'||p.visible===false)continue;const s=graffitiSpot(p),d=Math.hypot(player.x-s.x,player.y-s.y);if(d<=bd){bd=d;best=p;}}return best;}
function readGraffiti(){const esc=typeof escapeHTML==='function'?escapeHTML:x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 openPanel('<h2>'+esc(GRAFFITI.title)+'</h2><p class="r1237Graffiti" style="font-family:serif;font-size:1.08em;line-height:1.8;letter-spacing:.02em;margin:12px 0 16px">'+esc(GRAFFITI.text)+'</p><div class="actions"><button id="graffitiCloseR1237">닫기</button></div>');
 try{const el=typeof $==='function'?$('graffitiCloseR1237'):document.getElementById('graffitiCloseR1237');if(el)el.onclick=()=>closePanel(true);}catch(e){fail(e);}stats.graffiti=(stats.graffiti||0)+1;return true;}
let hinted=null,installed=false;
function hint(){try{const r=typeof room!=='undefined'?room:null;if(!r||hinted===r||typeof started==='undefined'||!started||modal||loading)return;if(!graffitiNear(r))return;hinted=r;
 const k=window.__STORYWORLD_KEYS_R291__?.legacy?'E':'C';if(typeof toast==='function')toast(k+' · 벽의 낙서 살펴보기',2.4);}catch(e){fail(e);}}
function install(){if(installed||typeof interact!=='function')return;installed=true;const base=interact;
 interact=function(...a){try{if(started&&!modal&&!loading&&player?.hp>0&&graffitiNear(typeof room!=='undefined'?room:null))return readGraffiti();}catch(e){fail(e);}return base.apply(this,a);};}

// Native entry/restore wrappers prune decoded images after makeRoom. Reload only
// this active room's existing visual paths after those wrappers have completed.
async function prepareCurrent(){const r=typeof room!=='undefined'?room:null;if(!eligible(r))return;apply(r);const paths=[...new Set([...(r.props||[]).filter(p=>p.r317).map(p=>p.path),...(r.r317Decals||[]).map(p=>p.path)])];if(paths.length&&typeof ensureImages==='function')await ensureImages(paths);}
if(typeof enterRegion==='function'){const b=enterRegion;enterRegion=async function(...a){const out=await b.apply(this,a);if(out!==false)try{await prepareCurrent();}catch(e){fail(e);}return out;};}
if(typeof restoreSave==='function'){const b=restoreSave;restoreSave=async function(...a){const out=await b.apply(this,a);if(out!==false)try{await prepareCurrent();}catch(e){fail(e);}return out;};}

// Separate DOM layers animate existing images. No image asset is generated or edited.
// No replay command is added; absent Balrog placement leaves this automatic path dormant.
const SCENE_MS=2500,TOTAL_MS=15000;
function node(tag,parent,style){const n=document.createElement(tag);if(style)n.style.cssText=style;parent?.appendChild(n);return n;}
function imageNode(parent,path,style){const n=node('img',parent,style);n.src=path;n.alt='';n.draggable=false;return n;}
function key(e){if(!active)return;e.preventDefault();e.stopImmediatePropagation();if(e.type==='keyup')return;if(e.repeat)return;if(e.key==='Escape')finish(true);else if(e.key==='Enter'||e.key===' '||e.code==='Space')next();}
function finish(skipped=false){const a=active;if(!a)return;active=null;cancelAnimationFrame(a.raf);a.root.remove();removeEventListener('keydown',key,true);removeEventListener('keyup',key,true);try{if(typeof keys!=='undefined')keys.clear();a.focus?.focus?.({preventScroll:true});}catch(_){}if(skipped)stats.skips++;else stats.completed++;}
function next(){if(!active)return;const t=performance.now();active.start=t-(active.scene+1)*SCENE_MS;update(t);}
function bgmGain(){return active?.3:1;}
function update(now){const a=active;if(!a)return;if((typeof room!=='undefined'&&room!==a.room)||!solo()){finish(true);return;}
 if(a.held!=null)return; // R368: 영상이 덮는 동안 멈춤
 const elapsed=Math.max(0,now-a.start);if(elapsed>=TOTAL_MS){finish();return;}
 const k=Math.floor(elapsed/SCENE_MS),u=elapsed/SCENE_MS-k;a.scene=k;a.root.dataset.scene=String(k);
 a.caption.textContent=k<2?'':CAPTIONS[k<4?0:k===4?1:2];
 a.balrog.style.opacity=k===0?String(1-u*.2):'0';a.seal.style.opacity=k<2?'1':'.22';a.tree.style.opacity=k===2?'.25':'.6';
 a.angel.style.opacity=k>=1&&k<5?'1':'0';a.angel.style.transform=k===2?'translate(-50%,-50%) scale('+(1.5+u*.3)+')':'translate(-50%,-50%) scale('+(1+u*.06)+')';
 a.glow.style.opacity=k===1?String(u*.7):k===3?String(.3+u*.55):k===4?String(.85-u*.6):'0';a.glow.style.transform='translate(-50%,-50%) scale('+(k===3?1+u*3:1.5)+')';
 a.hero.style.opacity=k===2?'.2':'1';for(const [i,g]of a.guardians.entries()){g.style.opacity=k<4?'.5':k===4?String(Math.max(0,1-u*1.4-i*.08)):'0';g.style.transform='translate(-50%,-100%) translateY('+(-u*(k===4?60:3))+'px)';}
 a.veil.style.opacity=k===4?String(Math.sin(u*Math.PI)*.7):'0';
 a.root.style.backgroundColor=k===3?'#1e1a1b':'#0e0a0d';}
const cineOn=()=>{try{return window.__STORYWORLD_CINEMA_MODE_R370__?.prefs?.().on===true;}catch(_){return false;}};
function play(r){if(active||(seen&&!cineOn())||!eligible(r)||r.id!=='ep1a09b'||typeof document==='undefined')return false;
 const root=node('div',document.body,'position:fixed;inset:0;z-index:10010;overflow:hidden;background:#0e0a0d;color:#eadcc8;touch-action:none;');root.id='r317Cinema';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','결전의 날 기억');root.tabIndex=-1;
 const base='position:absolute;object-fit:contain;pointer-events:none;';
 const tree=imageNode(root,PATHS.tree,base+'left:50%;top:40%;height:62%;transform:translate(-50%,-50%);opacity:.6');
 const seal=imageNode(root,PATHS.seal,base+'left:50%;top:66%;height:28%;transform:translate(-50%,-50%);');
 const balrog=imageNode(root,PATHS.balrog,base+'left:26%;top:65%;height:40%;transform:translate(-50%,-50%) rotate(-78deg) scaleY(.7);');
 const angel=imageNode(root,PATHS.angel,base+'left:50%;top:43%;height:72%;transform:translate(-50%,-50%);');
 const guardians=[.2,.32,.68,.8].map((x,i)=>imageNode(root,PATHS.guardian,base+'left:'+(x*100)+'%;top:'+(76+i%2*4)+'%;height:32%;filter:brightness(.15) saturate(.2);transform:translate(-50%,-100%);'));
 let heroPath=PATHS.guardian;try{heroPath=heroArt[player.hero].idle.back||heroArt[player.hero].idle.n||Object.values(heroArt[player.hero].idle)[0]||heroPath;}catch(_){}
 const hero=imageNode(root,heroPath,base+'left:50%;top:81%;height:31%;max-width:26%;transform:translate(-50%,-100%);');
 const glow=imageNode(root,PATHS.flare,base+'left:50%;top:45%;width:min(75vw,75vh);height:min(75vw,75vh);mix-blend-mode:screen;transform:translate(-50%,-50%);opacity:0;');
 const veil=imageNode(root,PATHS.veil,base+'left:50%;top:44%;width:75%;height:90%;transform:translate(-50%,-50%);opacity:0;');
 const caption=node('div',root,'position:absolute;left:6%;right:6%;bottom:9%;text-align:center;font:clamp(15px,2.2vw,24px)/1.7 "Malgun Gothic",serif;text-shadow:0 2px 4px #000;background:#120c1099;padding:8px;border-block:1px solid #6b564066;');caption.setAttribute('aria-live','polite');
 const controls=node('div',root,'position:absolute;top:14px;right:14px;display:flex;gap:8px;');
 for(const [label,fn]of[['다음',next],['건너뛰기',()=>finish(true)]]){const b=node('button',controls,'background:#21181e;color:#eadcc8;border:1px solid #80684d;padding:10px 14px;cursor:pointer;');b.textContent=label;b.onclick=e=>{e.stopPropagation();fn();};}
 root.onclick=next;active={root,tree,seal,balrog,angel,guardians,hero,glow,veil,caption,room:r,start:performance.now(),scene:0,focus:document.activeElement,raf:0};
 seen=true;try{localStorage.setItem(KEY,JSON.stringify({seen:true}));}catch(e){fail(e);}try{if(typeof keys!=='undefined')keys.clear();}catch(_){}
 addEventListener('keydown',key,true);addEventListener('keyup',key,true);root.focus();stats.plays++;
 const frame=t=>{try{update(t);}catch(e){fail(e);finish(true);}if(active)active.raf=requestAnimationFrame(frame);};update(active.start);active.raf=requestAnimationFrame(frame);return true;}
const balrog=e=>!!(e?.boss&&!e.midboss&&/발록|balrog/i.test(String(e.name||'')+' '+String(e.nativeId||'')+' '+String(e.kind||'')));
if(typeof killEnemy==='function'){const b=killEnemy;killEnemy=function(e,...a){const r=typeof room!=='undefined'?room:null,trigger=eligible(r)&&r.id==='ep1a09b'&&balrog(e)&&!e.deadRecorded&&typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading);const out=b.call(this,e,...a);
 if(trigger&&e.hp<=0&&e.deadRecorded&&r===(typeof room!=='undefined'?room:null))try{play(r);}catch(err){fail(err);finish(true);}return out;};}
// R426: '본 적 있음'을 기기 전체가 아니라 한 판(새 게임)마다로 — 새 게임을 시작하면 다시 나온다(영화 모드에서는 늘 나온다).
if(typeof newGame==='function'){const b=newGame;newGame=function(...a){seen=false;try{localStorage.removeItem(KEY);}catch(_){}return b.apply(this,a);};}
if(typeof tick==='function'){const b=tick;tick=function(...a){try{if(!installed)install();hint();}catch(e){fail(e);}if(active){try{update(performance.now());}catch(e){fail(e);finish(true);}if(active)return;}return b.apply(this,a);};}
window.__STORYWORLD_MAPS_PALACE_SLUM_R317__=Object.freeze({revision:REV,KEY,PATHS,CAPTIONS,WALL_TEXT,GRAFFITI,SEAL_PATH,install,graffitiSpot,graffitiNear,pruneSeals,pruneColumns,isColumn,wallSpots,themeLayout,plan,apply,bgmGain,next,skip:()=>finish(true),update,
 hold(on){const a=active;if(!a)return false;const t=performance.now();if(on){if(a.held==null)a.held=t;}else if(a.held!=null){a.start+=t-a.held;a.held=null;}return true;},
 inspect:()=>({revision:REV,temporary:true,seen,active:!!active,scene:active?.scene??null,stats:{...stats},lastError,GPUVerified:false,naturalBalrogPlacement:false})});
})();
