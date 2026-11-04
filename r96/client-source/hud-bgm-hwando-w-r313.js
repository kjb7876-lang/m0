// R313 — current audible classical track, and only the split tail of the R292 Hwando W strip.
// Registration is a separate integration step. No combat objects, timings or source assets change.
(()=>{'use strict';
if(window.__STORYWORLD_HUD_BGM_HWANDO_R313__)return;
const REV='R313-hud-bgm-hwando-1',DIR='assets/audio/bgm/classical/';
const PAL=Object.freeze({a:Object.freeze([214,222,234]),b:Object.freeze([255,198,72])});
const COMPOSERS={'Johann Sebastian Bach':'바흐','Edvard Grieg':'그리그','Camille Saint-Saëns':'생상스','Antonio Vivaldi':'비발디','Frederic Chopin':'쇼팽','Ludwig van Beethoven':'베토벤','Wolfgang Amadeus Mozart':'모차르트'};
const TITLES={
 'Etude in E-flat minor, Op. 10 No. 6':'연습곡 Op.10-6',
 'Nocturne in C-sharp minor, Op. 27 No. 1':'녹턴 Op.27-1',
 'Nocturne in F minor, Op. 55 No. 1':'녹턴 Op.55-1',
 'Prelude in C-sharp minor, Op. 45':'전주곡 Op.45',
 'Cello Sonata in G minor, Op. 65 - III. Largo':'첼로 소나타 Op.65 · 3악장',
 'Etude in C-sharp minor, Op. 25 No. 7':'연습곡 Op.25-7',
 'Funeral March in C minor, Op. posth. 72 No. 2':'장송행진곡 Op.72-2',
 'Nocturne in G minor, Op. 15 No. 3':'녹턴 Op.15-3',
 'String Quartet No. 15 in D minor, K. 421 - I. Allegro moderato':'현악 사중주 15번 · 1악장',
 'String Quartet No. 6, Op. 18 No. 6 - IV. La Malinconia':'현악 사중주 6번 · 4악장',
 'Toccata and Fugue in D minor, BWV 565':'토카타와 푸가 BWV 565',
 'In the Hall of the Mountain King (Peer Gynt Suite No. 1, Op. 46 IV)':'산왕의 궁전에서',
 'Danse macabre, Op. 40':'죽음의 무도 Op.40',
 'Danse macabre, Op. 40 (historic 1925 recording)':'죽음의 무도 Op.40',
 "The Four Seasons, Winter (L'inverno) RV 297 - I. Allegro non molto":'사계 겨울 · 1악장',
 "Air (Orchestral Suite No. 3 in D, BWV 1068) - 'Air on the G string'":'G선상의 아리아',
 'Piano Sonata No. 2 in B-flat minor, Op. 35 - III. Marche funebre (Lento)':'장송행진곡 Op.35',
 "Piano Sonata No. 14 in C-sharp minor 'Moonlight', Op. 27 No. 2 - I. Adagio sostenuto":'월광 소나타 · 1악장',
 'Symphony No. 40 in G minor, K. 550 - I. Molto allegro':'교향곡 40번 · 1악장',
 'Piano Sonata No. 2 in B-flat minor, Op. 35 - IV. Finale (Presto)':'피아노 소나타 2번 · 4악장',
 "Etude in C minor, Op. 10 No. 12 'Revolutionary'":'혁명 연습곡 Op.10-12',
 'Nocturne in C minor, Op. 48 No. 1':'녹턴 Op.48-1',
 'Coriolan Overture in C minor, Op. 62':'코리올란 서곡 Op.62',
 'Prelude in A minor, Op. 28 No. 2':'전주곡 Op.28-2'
};
let mapCatalog=null;
fetch('assets/r308/bgm/index.json').then(r=>r.ok?r.json():null).then(j=>{mapCatalog=j?.tracks||null;}).catch(()=>{});
let catalog=null,label=null,pending='',shown='',changedAt=0,lastError=null;
const stats={replaced:0,fallback:0,errors:0};
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,180);};
fetch(DIR+'catalog.json').then(r=>r.ok?r.json():null).then(j=>{catalog=j?.tracks||null;}).catch(fail);
function currentText(){
 if(typeof settings==='undefined'||!settings.music||!(settings.bgm>0)||document.hidden)return '';
 const legacy=window.__STORYWORLD_BGM_CLASSICAL_R195__?.inspect?.();
 const map=window.__STORYWORLD_BGM_MAP_R308__?.inspect?.();
 const audible=d=>d&&!d.paused&&!d.muted&&!d.ended&&d.readyState>=3&&d.volume>0;
 let t;
 if(map?.active){
  if(!map.prefs?.on||legacy?.prefs?.on===false)return '';
  // cur points at the incoming deck even while it buffers. Show the louder audible deck.
  const d=(map.decks||[]).filter(d=>audible(d)&&!map.failed?.includes(d.id)).sort((a,b)=>b.volume-a.volume)[0];
  t=d&&mapCatalog?.[d.id];
 }else{
  const a=legacy?.active;if(!legacy?.prefs?.on||legacy.blocked||!audible(a)||legacy.failed?.includes(a.id))return '';
  t=catalog?.[a.id];
 }
 if(!t?.composer||!t?.title)return '';
 // Localize the credit metadata, never infer a title from a filename or selected/pending track.
 const c=COMPOSERS[t.composer]||(/[가-힣]/.test(t.composer)?t.composer:null),n=TITLES[t.title]||(/[가-힣]/.test(t.title)?t.title:null);
 return c&&n?'♪ '+c+' · '+n:'';
}
function mount(){
 if(label?.isConnected)return true;
 const name=document.getElementById('regionName');if(!name?.parentNode)return false;
 if(!document.getElementById('r313Style')){const style=document.createElement('style');style.id='r313Style';style.textContent=`
 #r313RegionLine{display:flex;align-items:center;min-width:0;width:100%;gap:7px}
 #r313RegionLine #regionName{flex:0 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 #r313RegionLine #layerTag{flex:none;margin-left:0}
 #r313Bgm{flex:1 1 0;min-width:0;max-width:22rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:11px/1.5 'Malgun Gothic',serif;color:#72551f;background:linear-gradient(100deg,#e3d5b6,#cbb88f);border-radius:2px;opacity:0;transition:opacity .2s ease}
 #r313Bgm[hidden]{display:none}
 @media(max-width:780px){header:has(#r313RegionLine) .brand{display:none}header:has(#r313RegionLine) .topnav{flex:0 0 auto;max-width:45%;overflow-x:auto;white-space:nowrap}header:has(#r313RegionLine) .topnav button{flex:none;white-space:nowrap}#r313RegionLine{display:grid;grid-template-columns:minmax(0,max-content) minmax(0,1fr);gap:0 5px}#r313RegionLine #layerTag{grid-row:2;grid-column:1 / -1;width:max-content}}
 `;document.head.appendChild(style);}
 const line=document.createElement('span');line.id='r313RegionLine';name.parentNode.insertBefore(line,name);line.appendChild(name);
 label=document.createElement('span');label.id='r313Bgm';label.hidden=true;line.appendChild(label);
 const tag=document.getElementById('layerTag');if(tag)line.appendChild(tag);
 return true;
}
function update(){try{
 if(!mount())return;
 const next=currentText(),now=performance.now();
 if(!next){pending=shown='';label.textContent='';label.title='';label.hidden=true;label.style.opacity='0';return;}
 if(next!==pending){pending=next;changedAt=now;label.style.opacity='0';}
 // Two 0.2s halves: old text fades out before the new text fades in.
 if(now-changedAt>=200){if(shown!==pending){shown=pending;label.textContent=shown;label.title=shown;}label.hidden=false;label.style.opacity='1';}
 }catch(e){fail(e);}}
const SP=()=>window.__STORYWORLD_FX_SPRITES_R106__;
const low=()=>!!(typeof settings!=='undefined'&&settings.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
function ready(){const s=SP();if(!s?.on?.())return false;s.warm(PAL,['blade','slashline']);return s.ready('blade',PAL)&&s.ready('slashline',PAL);}
function drawSplit(age,a){
 const s=SP(),u=Math.max(0,Math.min(1,(age-.48)/.12)),fade=1-u*.86;
 // R292 already applied world projection, body lift and scale: these are cell-local coordinates.
 const cx=a[4]+a[6]/2,cy=a[5]+a[7]/2,k=a[6]/384,trails=low()?2:4;
 for(let i=0;i<3;i++){
  const phase=-Math.PI/2+i*Math.PI*2/3,ang=phase+u*.7,r=(115+u*45)*k;
  const x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r,turn=ang+Math.PI/2+u*.9;
  for(let j=trails;j>0;j--){const v=j/trails,b=ang-v*.4,rr=r-v*18*k;
   s.draw('slashline',PAL,cx+Math.cos(b)*rr,cy+Math.sin(b)*rr,(80-35*v)*k,(9-6*v)*k,{angle:b+Math.PI/2,alpha:fade*(1-v*.7)*.42,blend:'screen',pivot:[.5,.5]});}
  s.draw('blade',PAL,x,y,97*k,32*k,{angle:turn,alpha:fade,blend:'screen',pivot:[.5,.5]});
  s.draw('slashline',PAL,x-Math.cos(ang)*10*k,y-Math.sin(ang)*10*k,66*k,3*k,{angle:turn-.16,alpha:fade*.65,blend:'screen',pivot:[.5,.5]});
 }
}
const patched=new WeakSet();let stripPass=false,ages=[],ordinal=0,reentrant=false;
function patchContext(c){if(!c||patched.has(c)||typeof c.drawImage!=='function')return;patched.add(c);const base=c.drawImage;
 c.drawImage=function(im,...a){
  const path=typeof im?.src==='string'?im.src:'';
  if(stripPass&&!reentrant&&/assets\/r(?:292|302)\/fx\/hwando\/w\.webp(?:[?#].*)?$/.test(path)&&a.length===8&&a[2]===384&&a[3]===384){
   const age=ages[ordinal++]?.age??a[0]/384*.06;
   // Source frames 0..7 (including the complete initial ring) are byte-for-byte original calls.
   if(a[0]>=8*384&&a[0]<10*384){
    if(ready()){reentrant=true;try{drawSplit(age,a);stats.replaced++;return;}catch(e){fail(e);}finally{reentrant=false;}}
    stats.fallback++;
   }
  }
  return base.call(this,im,...a);
 };
}
let drawInstalled=false;
function installDraw(){if(drawInstalled||!window.__STORYWORLD_SKILL_FX_R292__||typeof drawEffect!=='function')return;drawInstalled=true;const base=drawEffect;drawEffect=function(e,...a){
 if(e?.type!=='r292-skill-fx')return base.call(this,e,...a);
 patchContext(typeof ctx==='undefined'?null:ctx);
 const prev=stripPass,oldAges=ages,oldOrdinal=ordinal;
 stripPass=true;ordinal=0;ages=(window.__STORYWORLD_SKILL_FX_R292__?.inspect?.().active||[]).filter(x=>x.key==='hwando:w'&&x.age>=0&&x.age<.6);
 try{return base.call(this,e,...a);}finally{stripPass=prev;ages=oldAges;ordinal=oldOrdinal;}
};}
installDraw();
if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r=base.apply(this,a);update();return r;};}
if(typeof musicTick==='function'){const base=musicTick;musicTick=function(...a){const r=base.apply(this,a);update();return r;};}
document.addEventListener('visibilitychange',update);
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{installDraw();if(typeof player!=='undefined'&&player?.hero==='hwando')ready();}catch(e){fail(e);}return r;};}
window.__STORYWORLD_HUD_BGM_HWANDO_R313__=Object.freeze({revision:REV,update,currentText,inspect:()=>({revision:REV,text:shown,pending,stats:{...stats},lastError,presentationOnly:true})});
update();
})();
