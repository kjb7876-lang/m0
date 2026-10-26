/* R102 props: theme and real-world scale.
   Presentation only: prop ids, positions, collision, interaction and saves are untouched.
   - Story fit: the Western-fantasy regions no longer show Eastern pieces. The R92 incense
     burner, pagoda lantern and red-cloth altar lights stay in the Eastern village scenes
     (잠들지 못하는 마을, 한약과 불면귀); elsewhere a region gets Western lamps of its own
     kind. The roofed well and the roofed notice board are drawn there as the R74 stone
     well and memorial obelisk.
   - Scale: every prop is drawn at a height that matches its real size next to the 66 px
     hero (about 1.75 m): trees about 3×, obelisks, pillars and statues 2–2.3×, gates
     and stalls about 1.6×, altars and boulders about 1.1×, chairs, carts, coffins and
     small clutter below the hero. Each piece varies ±8% so a row of trees is not uniform. */
(() => {
'use strict';
if(window.__STORYWORLD_PROPS_R102__)return;
if(typeof drawProp!=='function'||typeof project!=='function'||typeof drawAssetFrame3!=='function')return;
const finite=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
let lastError=null;
const stats={swaps:0,sized:0,r74Sized:0,r80Sized:0,treeSized:0,lampSwaps:0,errors:0};
function fail(err){stats.errors++;lastError=String(err?.message||err);}

// ---- preferences -------------------------------------------------------------------
const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r102.props';
const DEFAULTS=Object.freeze({theme:true,scale:true});
const LABELS={theme:'지역 서사에 맞는 조형물 (서양 판타지 지역에 동양풍 등불·우물·방문판 대신 서양식, 등불은 다음 지역부터)',scale:'조형물 실물 크기 (나무 영웅의 약 3배, 비석·기둥 2배, 의자·수레 등은 영웅보다 작게)'};
const prefs={...DEFAULTS};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}

// ---- story fit -------------------------------------------------------------------------
// The Korean harbour village and the herbal-medicine house are the only Eastern scenes.
const EAST=Object.freeze(new Set(['last302','last303']));
const eastern=(z=typeof zone!=='undefined'?zone:null)=>EAST.has(z);
const EAST_LIGHTS=Object.freeze(new Set(['lights_regional_02','lights_regional_03','lights_regional_04']));
// Western lamp pairs by R81 environment family (the R92 'regional' lamp group).
const WEST_LIGHTS=Object.freeze({garden:['lights_stone_03','lights_regional_01'],snow:['lights_stone_02','lights_ash_03'],coast:['lights_domestic_03','lights_stone_02'],regional:['lights_regional_01','lights_stone_03']});
function lamps(z,reg,items,list,fam){if(!prefs.theme||!Array.isArray(items)||!Array.isArray(list))return null;
 if(EAST.has(z)){const east=list.filter(i=>EAST_LIGHTS.has(i.id));return east.length?east:null;}
 if(!list.some(i=>EAST_LIGHTS.has(i?.id)))return null;
 const ids=WEST_LIGHTS[fam]||WEST_LIGHTS.regional,out=ids.map(id=>items.find(i=>i.id===id&&i.kind==='light')).filter(Boolean);stats.lampSwaps++;
 return out.length?out:list.filter(i=>!EAST_LIGHTS.has(i.id));}
// Roofed (Eastern) pieces → R74 atlas cells, with their drawn height.
const SWAP=Object.freeze({village_well:{cell:'well',height:92},blank_memorial:{cell:'obelisk',height:136}});

// ---- real-world heights (px at zoom 1; hero 66) -----------------------------------------
const NATIVE=Object.freeze({
 dead_tree:205,memory_archivist_statue:128,collapsed_pillar:70,corrupted_shrine:128,moss_boulders:74,bone_heap:54,
 broken_gate:118,collapsed_stairs:96,blood_altar:76,hotel_luggage_cart:70,broken_street_lamp:150,blank_memorial:96,
 ruined_market:104,village_well:92,'bootloader-cable-junction':64,'neural-ego-vat':120,surveillance_console:66,
 silver_seal_pillar:140,rail_signal:112,armored_wall:100,chrono_engine:96,ruined_portal:130,industrial_barricade:60,
 shattered_memory_core:86,'memory-time-anchor':115,time_obelisk:150,'seal-command-pillar':135,'evidence-loop-console':76,
 infernal_oath_effigy:120});
// R80 scene art: height = 66 × scale.
const R80=Object.freeze({
 'r80-000':2.8,'r80-001':1.3,'r80-002':1,'r80-007':.6,'r80-008':.3,'r80-009':1.45,'r80-013':1.2,'r80-014':1,'r80-015':1.6,'r80-016':.85,'r80-017':.62,
 'r80-018':2.2,'r80-019':2.2,'r80-020':1,'r80-021':1.1,'r80-022':1.1,'r80-023':.8,'r80-024':.7,'r80-025':.8,'r80-026':1.05,'r80-027':.85,'r80-028':1.45,
 'r80-030':3.4,'r80-033':.85,'r80-034':1.65,'r80-035':1.35,'r80-037':2.8,'r80-039':1.5,'r80-040':1.1,'r80-043':1.2,'r80-044':1.3,'r80-045':1.3,'r80-046':1.3,
 'r80-048':.85,'r80-049':1.3,'r80-050':.6,'r80-051':.4,'r80-052':2,'r80-053':.35,'r80-054':.95,'r80-056':.4,'r80-058':.8,'r80-059':.85,'r80-060':.85,
 'r80-061':.8,'r80-062':.55,'r80-063':.75,'r80-064':.9,'r80-065':1,'r80-066':1.3,'r80-067':1.1,'r80-069':1.1,'r80-070':1.35,'r80-071':1,
 'r80-072':.85,'r80-074':.45,'r80-075':.9,'r80-076':.26,'r80-077':.3,
 'r80-141':1.1,'r80-142':.9,'r80-143':.95,'r80-144':.62,'r80-145':.62,'r80-146':.66,'r80-147':.32,'r80-148':.8,'r80-149':.68,'r80-150':.3,'r80-151':.9,'r80-152':.85});
// R74 generated props (not doors): drawn height, and the multiplier the R74 painter uses.
const R74=Object.freeze({'ash-tree':205,pine:230,stump:52,ferns:40,crate:46,well:92,statue:124,obelisk:136,brazier:72,cabinet:76,'empty-bed':62,workbench:60});
const r74Mult=cell=>/tree|pine/.test(cell)?2.65:/stump|ferns|crate/.test(cell)?.65:1.18;
const TREE_K=1.15;// R99 outdoor trees (151–225 px) → 174–259 px
const names=new Map();
function base(path){if(typeof path!=='string')return'';let n=names.get(path);if(n===undefined){n=(path.split('/').pop()||'').replace(/\.(webp|png)$/i,'');if(names.size>512)names.clear();names.set(path,n);}return n;}
const jitter=p=>1+((hash(p.id??(p.x+':'+p.y))%17)-8)/100;
const skip=p=>!p||p.terrainWall||p.r74Door||p.hospitalDoorFrameB3||p.hospitalLine12||p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson||p.passivePointDropR64||p.visualHospitalFrame;
const objective=p=>/objective/i.test(String(p.id||''));

// ---- drawing ---------------------------------------------------------------------------
const atlas=()=>typeof StoryArtR74!=='undefined'?StoryArtR74?.atlases?.props:null;
function cellOf(key){const A=atlas();const c=A?.cells?.find?.(v=>v.key===key);return c?{A,c}:null;}
// The R74 painter's height is scaled while one of its props is drawn.
let r74K=1;
const frameBase=drawAssetFrame3;drawAssetFrame3=function(path,frame,x,y,height,...rest){if(r74K!==1&&path===atlas()?.path&&Number.isFinite(height))height*=r74K;return frameBase.call(this,path,frame,x,y,height,...rest);};
// A swapped piece is drawn like R80 scene art: hidden outside sight, culled off screen,
// faded while the hero stands behind it.
function paintCell(p,key,height){const hit=cellOf(key);if(!hit)return false;const{A,c}=hit;
 if(typeof readyImage!=='function'||!readyImage(A.path)){if(typeof addImage==='function')try{addImage(A.path,'R102 props');}catch(_){}return false;}
 const sight=window.__STORYWORLD_SIGHT24__;if(sight?.enabled&&typeof sight.pointVisible==='function'&&!sight.pointVisible(p.x,p.y))return true;
 const z=typeof zoom==='number'?zoom:1,q=project(p.x,p.y),h=height*z,vb=c.visibleBounds||[0,0,c.sourceRect[2],c.sourceRect[3]],w=h*(vb[2]-vb[0])/c.visibleHeight,vw=typeof W==='number'?W:innerWidth,vh=typeof H==='number'?H:innerHeight;
 if(q.x+w<-40||q.x-w>vw+40||q.y-h>vh+40||q.y<-40)return true;
 const lift=clamp(finite(p.visualLiftPx),0,h*.7),hero=typeof player!=='undefined'&&player?project(player.x,player.y):null,behind=!!hero&&q.y>hero.y-3&&q.y-lift-h<hero.y-15&&Math.abs(q.x-hero.x)<w*.4;
 const frame={path:A.path,assetFrame:{sourceRect:c.sourceRect,pivot:c.pivot,visibleHeight:c.visibleHeight,bakedFacing:'right'}};
 const filter=p.revisitFilterSix||(typeof layer!=='undefined'&&layer==='DREAM'?'saturate(.5) hue-rotate(10deg) brightness(.85)':undefined);
 const paint=()=>{if(typeof shadow==='function')shadow(q.x,q.y,Math.max(12*z,Math.min(w*.36,h*.56)),{lift:lift/Math.max(1,h)});frameBase(A.path,frame,q.x,q.y-lift,h,{alpha:behind?.36:1,filter});};
 if(typeof ctx?.scope==='function')ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:A.path,alive:true,r102Swap:key},paint);else paint();
 stats.swaps++;return true;}
const R80API=()=>window.__STORYWORLD_WORLD_ASSETS_R80__;
const R80DATA=()=>window.__STORYWORLD_ASSETS_R80_DATA__?.assets;
function r80Key(p){if(p.r80Dressing&&typeof p.r80Art==='string')return p.r80Art;if(typeof p.id==='string'&&/^ep1a08-prop-[1-8]$/.test(p.id)){try{const a=R80API()?.artFor?.(p);if(a?.path)return base(a.path);}catch(e){fail(e);}}return null;}
const propBase=drawProp;drawProp=function(p,...args){
 if(skip(p)||typeof p!=='object')return propBase.apply(this,arguments);
 const undo=[];
 try{const skin=p.r81NativeSkin,path=skin?.path||(!p.r80Dressing&&!p.r74Prop&&!p.r99Tree?p.path:null),name=base(path),obj=objective(p),k=obj?1:jitter(p);
  // 1) story fit: roofed Eastern pieces outside the Eastern scenes
  const swap=prefs.theme&&name&&SWAP[name]&&!eastern()?SWAP[name]:null;
  // (the R55 objective marker keeps a marker's size: about the hero's height)
  if(swap){const h=obj?64:(prefs.scale?swap.height*k:finite(skin?.height??p.height,swap.height));if(paintCell(p,swap.cell,h))return;}
  if(prefs.scale&&!obj){
   if(p.r99Tree&&Number.isFinite(p.height)){undo.push([p,'height',p.height]);p.height*=TREE_K;stats.treeSized++;}
   else if(skin&&NATIVE[name]){undo.push([skin,'height',skin.height]);skin.height=NATIVE[name]*k;stats.sized++;}
   else if(p.r74Prop&&!skin&&typeof p.r74Prop==='string'&&R74[p.r74Prop]){r74K=R74[p.r74Prop]*k/(66*r74Mult(p.r74Prop));stats.r74Sized++;}
   else{const key=r80Key(p),a=key&&R80[key]?R80DATA()?.[key]:null;
    if(a){undo.push([a,'scale',a.scale]);a.scale=R80[key]*k;if(Number.isFinite(p.height)){undo.push([p,'height',p.height]);p.height=64*a.scale;}stats.r80Sized++;}
    else if(!p.r80Dressing&&!p.r74Prop&&NATIVE[name]&&Number.isFinite(p.height)){undo.push([p,'height',p.height]);p.height=NATIVE[name]*k;stats.sized++;}}}
 }catch(e){fail(e);}
 try{return propBase.apply(this,arguments);}
 finally{r74K=1;for(let i=undo.length-1;i>=0;i--){const[o,f,v]=undo[i];o[f]=v;}}};

// ---- settings --------------------------------------------------------------------------
function settingsSection(){const host=document.getElementById('retroSettingsR102')||document.getElementById('retroSettingsR101')||document.getElementById('retroSettingsR93');if(!host||document.getElementById('retroSettingsR102Props'))return;
 const s=document.createElement('section');s.id='retroSettingsR102Props';s.innerHTML='<h3>R102 조형물 테마·실물 크기</h3><p class="small muted">보이는 그림만 바꾸며 위치·충돌·상호작용·저장은 그대로입니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r102p-'+k+'"> '+LABELS[k]+'</label> ').join('');
 host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r102p-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...a){const r=sb.apply(this,a);try{settingsSection();}catch(e){fail(e);}return r;};}

function heightOf(p){if(!p)return null;const skin=p.r81NativeSkin,name=base(skin?.path||p.path);if(p.r99Tree)return finite(p.height)*TREE_K;if(skin&&NATIVE[name])return NATIVE[name];if(p.r74Prop&&R74[p.r74Prop])return R74[p.r74Prop];const key=r80Key(p);if(key&&R80[key])return 66*R80[key];return NATIVE[name]??null;}
window.__STORYWORLD_PROPS_R102__=Object.freeze({revision:'R102-props',prefs:()=>({...prefs}),set,eastern,lamps,heightOf,
 tables:Object.freeze({native:NATIVE,r80:R80,r74:R74,treeScale:TREE_K,swap:SWAP,east:[...EAST],eastLights:[...EAST_LIGHTS],westLights:WEST_LIGHTS}),
 inspect:()=>({revision:'R102-props',prefs:{...prefs},stats:{...stats},lastError,presentationOnly:true,collisionChanged:false,savesTouched:false})});
})();
