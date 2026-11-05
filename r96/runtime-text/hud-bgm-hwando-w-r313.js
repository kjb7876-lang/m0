// R313 — current audible classical track, and only the split tail of the R292 Hwando W strip.
// Registration is a separate integration step. No combat objects, timings or source assets change.
(()=>{'use strict';
if(window.__STORYWORLD_HUD_BGM_HWANDO_R313__)return;
const REV='R313-hud-bgm-hwando-1',DIR='assets/audio/bgm/classical/';
const PAL=Object.freeze({a:Object.freeze([214,222,234]),b:Object.freeze([255,198,72])});
const COMPOSERS={'Johann Sebastian Bach':'바흐','Edvard Grieg':'그리그','Camille Saint-Saëns':'생상스','Antonio Vivaldi':'비발디','Frederic Chopin':'쇼팽','Ludwig van Beethoven':'베토벤','Wolfgang Amadeus Mozart':'모차르트','Pyotr Ilyich Tchaikovsky':'차이코프스키'};
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
 'Prelude in A minor, Op. 28 No. 2':'전주곡 Op.28-2',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - I. Adagio - Allegro non troppo":'비창 교향곡 · 1악장',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - II. Allegro con grazia":'비창 교향곡 · 2악장',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - III. Allegro molto vivace":'비창 교향곡 · 3악장',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - IV. Finale: Adagio lamentoso":'비창 교향곡 · 4악장'
};
// R331(사용자 2026-11-05 "맵에서 곡 설명 간략하게"): 곡이 바뀌면 제목 아래에 한 줄 설명을 7초 띄운다(제목 칸에 마우스를 올려도 보인다).
const DESC={
 'Etude in E-flat minor, Op. 10 No. 6':'쇼팽 연습곡 중 가장 어둡고 느린 곡. 안쪽 성부가 흐느끼듯 이어진다.',
 'Nocturne in C-sharp minor, Op. 27 No. 1':'불안한 왼손 위로 어둠이 짙어졌다가 끝에 장조로 풀리는 녹턴.',
 'Nocturne in F minor, Op. 55 No. 1':'단순한 선율이 되풀이되며 쓸쓸함을 쌓아 가는 만년의 녹턴.',
 'Prelude in C-sharp minor, Op. 45':'즉흥처럼 떠도는 화성이 꿈결 같은, 쇼팽의 가장 긴 전주곡.',
 'Cello Sonata in G minor, Op. 65 - III. Largo':'쇼팽이 생전에 마지막으로 낸 소나타의 짧고 고요한 느린 악장.',
 'Etude in C-sharp minor, Op. 25 No. 7':'왼손이 첼로처럼 노래해 \'첼로 연습곡\'이라 불린다.',
 'Funeral March in C minor, Op. posth. 72 No. 2':'쇼팽이 10대에 쓰고 세상을 떠난 뒤에야 출판된 장송행진곡.',
 'Nocturne in G minor, Op. 15 No. 3':'끝에서 종소리 같은 코랄로 바뀌는, 기도문 같은 녹턴.',
 'String Quartet No. 15 in D minor, K. 421 - I. Allegro moderato':'하이든에게 바친 여섯 사중주 가운데 유일한 단조 곡.',
 'String Quartet No. 6, Op. 18 No. 6 - IV. La Malinconia':'베토벤이 \'우울\'이라 이름 붙인 느린 서주가 춤곡과 엇갈린다.',
 'Toccata and Fugue in D minor, BWV 565':'오르간 대표곡. 첫 음형은 공포 영화로 널리 알려졌다.',
 'In the Hall of the Mountain King (Peer Gynt Suite No. 1, Op. 46 IV)':'트롤 왕의 궁전 장면. 점점 빨라지고 커지며 쫓아온다.',
 'Danse macabre, Op. 40':'한밤중 해골들의 춤. 조율을 비튼 독주 바이올린이 죽음의 신이다.',
 'Danse macabre, Op. 40 (historic 1925 recording)':'한밤중 해골들의 춤. 1925년의 오래된 녹음.',
 "The Four Seasons, Winter (L'inverno) RV 297 - I. Allegro non molto":'얼어붙은 겨울의 떨림과 이 부딪는 소리를 그린 협주곡.',
 "Air (Orchestral Suite No. 3 in D, BWV 1068) - 'Air on the G string'":'관현악 모음곡의 아리아. 훗날 G현 하나로 편곡되어 이 이름이 붙었다.',
 'Piano Sonata No. 2 in B-flat minor, Op. 35 - III. Marche funebre (Lento)':'장례식 음악의 대명사가 된 쇼팽의 장송행진곡.',
 "Piano Sonata No. 14 in C-sharp minor 'Moonlight', Op. 27 No. 2 - I. Adagio sostenuto":'\'월광\'은 후대 평론가가 붙인 이름. 느린 셋잇단음 위의 독백.',
 'Symphony No. 40 in G minor, K. 550 - I. Molto allegro':'모차르트의 단조 교향곡. 쫓기는 듯한 첫 주제로 시작한다.',
 'Piano Sonata No. 2 in B-flat minor, Op. 35 - IV. Finale (Presto)':'1분 남짓, 두 손이 같은 음으로 유령처럼 내달리는 피날레.',
 "Etude in C minor, Op. 10 No. 12 'Revolutionary'":'바르샤바 봉기가 꺾였다는 소식 무렵 쓰였다고 전하는 격정의 연습곡.',
 'Nocturne in C minor, Op. 48 No. 1':'장엄한 코랄이 폭풍처럼 격해지는, 가장 극적인 녹턴.',
 'Coriolan Overture in C minor, Op. 62':'로마 장군 코리올라누스의 비극을 그린 베토벤의 서곡.',
 'Prelude in A minor, Op. 28 No. 2':'낮은 불협화음이 기어가는, 쇼팽 전주곡 중 가장 기괴한 곡.',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - I. Adagio - Allegro non troppo":'차이코프스키의 마지막 교향곡. 낮은 바순의 신음에서 폭풍 같은 절규로 치닫는다.',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - II. Allegro con grazia":'5/4박자로 절뚝이는 왈츠. 우아하지만 한 박이 모자란 듯 불안하다.',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - III. Allegro molto vivace":'점점 격해지는 행진곡. 승리처럼 들리지만 끝은 비극으로 이어진다.',
 "Symphony No. 6 in B minor 'Pathétique', Op. 74 - IV. Finale: Adagio lamentoso":'느리게 끝나는 보기 드문 피날레. 탄식처럼 사그라들며 침묵으로 끝난다.'
};
let lastTitle='',note=null,noteText='',noteAt=0;const NOTE_SEC=7;
function showNote(text){try{if(!text)return;if(!note||!note.isConnected){note=document.createElement('div');note.id='r331BgmNote';
  note.style.cssText='position:fixed;left:50%;top:64px;transform:translateX(-50%);max-width:min(92vw,34rem);padding:5px 12px;font:12px/1.5 \'Malgun Gothic\',serif;color:#3d2a12;background:linear-gradient(100deg,rgba(227,213,182,.94),rgba(203,184,143,.94));border:1px solid #6b5124;border-radius:2px;box-shadow:0 2px 10px rgba(0,0,0,.45);pointer-events:none;z-index:40;opacity:0;transition:opacity .4s ease;text-align:center';
  document.body.appendChild(note);}
 note.textContent=text;noteText=text;noteAt=performance.now();note.style.opacity='1';stats.notes=(stats.notes||0)+1;}catch(e){fail(e);}}
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
 lastTitle=t.title;
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
 if(now-changedAt>=200){if(shown!==pending){shown=pending;label.textContent=shown;const d=DESC[lastTitle]||'';label.title=d?shown+' — '+d:shown;if(d)showNote(shown+' · '+d);}label.hidden=false;label.style.opacity='1';}
 if(note&&note.style.opacity==='1'&&now-noteAt>NOTE_SEC*1000)note.style.opacity='0';
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
