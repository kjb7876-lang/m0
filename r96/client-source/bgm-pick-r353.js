// R353 — 설정에서 배경음악 고르기(사용자 2026-11-05 "브금 바꾸기 기능도 넣어줘 설정에")
//        + 자동 배정 손질(같은 날 "첫부분에 나오는 바흐 음악 뒤쪽맵에 나오게하고 등장빈도 많이 줄여줘 별로임 / 생상스 죽음의무도 좋음 등장 늘려줘").
//  · 설정 창에 '배경음악' 칸을 둔다: [자동 · 지역에 맞춰](기본) / [고정 · 한 곡만] / [다음 곡] + 곡 목록(한국어 제목 · 작곡가).
//    - 자동: R308 이 맵마다 정한 곡(아래 AUTO_FIX 손질 포함). 맵 안에서는 바뀌지 않는다(R308 규칙 그대로).
//    - 고정: 고른 곡 하나를 모든 맵에서 이어서 튼다. 보스방·절정 맵·사몽도 고정 곡이 이긴다(단순하게: 고정이면 언제나 그 곡).
//      맵을 옮겨도 같은 곡이라 끊기지 않고 이어진다. localStorage 'storyworld.r353.bgm' {mode,track} 에 저장해 다시 열어도 남는다.
//    - 다음 곡: 고정이면 목록의 다음 곡으로 고정을 바꾼다(저장). 자동이면 지금 맵에 있는 동안만 다음 곡을 틀고, 맵을 옮기면 다시 자동.
//  · 실제 재생은 R308 이 한다: R308 tick 이 맵 곡을 정할 때 choose(sel) 를 부르고, key() 가 바뀌면 같은 맵에서도 다시 고른다(2.4초 교차 페이드).
//    그래서 음량(settings.bgm)·음악 끄기(settings.music)·'클래식 BGM' 스위치·탭 숨김 멈춤·대화 줄이기·인트로 영상 줄이기·HUD 곡 제목(R313/R331)이 그대로 따른다.
//    R195 '클래식 BGM' 을 끄거나 R308 목록을 못 읽으면 고르기는 쓰이지 않는다(설정 칸에 그렇게 적는다).
//  · AUTO_FIX(자동 배정 손질, R308 index.json 은 고치지 않고 여기서 덮는다):
//    바흐 토카타와 푸가(toccata): 1부 dist00~dist05(악마화 나무의 정원 ~) → 생상스 죽음의 무도(danse-macabre). 사몽 서문(P) 절정 → 죽음의 무도.
//    토카타는 뒤쪽 카이로노미콘 수문장 긴장 맵 2곳(kair10·kair02, 원래 쇼팽 전주곡 Op.45)에만 남긴다(사몽역행 RA 절정 정의는 맞서는 구역이 없어 실제로 틀리지 않음).
//  · 곡이 바뀔 때 R308 이 띄우는 알림도 label(id) 로 한국어 제목(작곡가 · 제목)을 쓴다.
//  · 새 음원·내려받기 없음. 끄기: 설정에서 '자동'(손질만 남음), 손질까지 끄려면 localStorage 'storyworld.r353.bgm' 에 {"fix":false}.
(()=>{'use strict';
if(window.__STORYWORLD_BGM_PICK_R353__)return;
const REV='R353-bgm-pick-1',KEY='storyworld.r353.bgm';
// 곡 id → [한국어 제목, 작곡가] (R313 제목 표기와 같은 이름). 목록 순서 = 설정 목록·'다음 곡' 순서.
const TRACKS=[
 ['danse-macabre','죽음의 무도 Op.40','생상스'],['danse-macabre-1925','죽음의 무도 Op.40 (1925년 녹음)','생상스'],
 ['mountain-king','산왕의 궁전에서','그리그'],['winter','사계 겨울 · 1악장','비발디'],
 ['moonlight','월광 소나타 · 1악장','베토벤'],['coriolan','코리올란 서곡 Op.62','베토벤'],['beethoven-malinconia','현악 사중주 6번 · 4악장','베토벤'],
 ['mozart40','교향곡 40번 · 1악장','모차르트'],['mozart-k421','현악 사중주 15번 · 1악장','모차르트'],
 ['pathetique-1','비창 교향곡 · 1악장','차이콥스키'],['pathetique-2','비창 교향곡 · 2악장','차이콥스키'],['pathetique-3','비창 교향곡 · 3악장','차이콥스키'],['pathetique-4','비창 교향곡 · 4악장','차이콥스키'],
 ['toccata','토카타와 푸가 BWV 565','바흐'],['air','G선상의 아리아','바흐'],
 ['funeral-march','장송행진곡 Op.35','쇼팽'],['sonata2-finale','피아노 소나타 2번 · 4악장','쇼팽'],['revolutionary','혁명 연습곡 Op.10-12','쇼팽'],
 ['nocturne-c-minor','녹턴 Op.48-1','쇼팽'],['prelude-2','전주곡 Op.28-2','쇼팽'],['chopin-etude-lament','연습곡 Op.10-6','쇼팽'],
 ['chopin-nocturne-27-1','녹턴 Op.27-1','쇼팽'],['chopin-nocturne-55-1','녹턴 Op.55-1','쇼팽'],['chopin-prelude-45','전주곡 Op.45','쇼팽'],
 ['chopin-cello-largo','첼로 소나타 Op.65 · 3악장','쇼팽'],['chopin-etude-cello','연습곡 Op.25-7','쇼팽'],['chopin-funeral-72','장송행진곡 Op.72-2','쇼팽'],
 ['chopin-nocturne-15-3','녹턴 Op.15-3','쇼팽']];
const IDS=TRACKS.map(t=>t[0]),LABEL=Object.fromEntries(TRACKS.map(([id,t,c])=>[id,{title:t,composer:c}]));
// 자동 배정 손질: 맵 id → 곡, 사몽 'samong:<장>' + 역할 → 곡.
const AUTO_FIX=Object.freeze({
 maps:Object.freeze({dist00:'danse-macabre',dist01:'danse-macabre',dist02:'danse-macabre',dist03:'danse-macabre',dist04:'danse-macabre',dist05:'danse-macabre',kair10:'toccata',kair02:'toccata'}),
 samong:Object.freeze({'samong:P|climax':'danse-macabre'})});
let prefs={mode:'auto',track:null,fix:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
if(prefs.mode!=='fixed'||!LABEL[prefs.track])prefs.mode='auto';prefs.fix=prefs.fix!==false;
let skip=null/* {zone,track}: 자동에서 '다음 곡' — 지금 맵에 있는 동안만 */;
const stats={choose:0,fixed:0,skipped:0,fixedAuto:0,next:0,ui:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const curZone=()=>{try{return typeof zone!=='undefined'?String(zone||''):'';}catch(_){return '';}};
const map=()=>{try{return window.__STORYWORLD_BGM_MAP_R308__?.inspect?.()||null;}catch(_){return null;}};
function save(){try{localStorage.setItem(KEY,JSON.stringify({mode:prefs.mode,track:prefs.track,fix:prefs.fix}));}catch(_){}}
function key(){if(prefs.mode==='fixed'&&LABEL[prefs.track])return 'f:'+prefs.track;if(skip&&skip.zone===curZone())return 's:'+skip.track;return prefs.fix?'a':'a0';}
function autoTrack(sel){if(!prefs.fix||!sel)return null;return AUTO_FIX.maps[sel.zone]||(String(sel.episode||'').startsWith('samong:')?AUTO_FIX.samong[sel.episode+'|'+sel.role]:null)||null;}
// R308 이 맵 곡을 정할 때 부른다. sel={zone,track,episode,role}. 돌려준 곡이 목록에 없거나 실패한 곡이면 R308 이 원래 sel 을 쓴다.
function choose(sel,ix,current){stats.choose++;if(!sel)return sel;const has=id=>!!(id&&(!ix||ix.tracks?.[id]));
 if(prefs.mode==='fixed'&&has(prefs.track)){stats.fixed++;return {...sel,track:prefs.track,role:'fixed',autoTrack:sel.track};}
 if(skip){if(skip.zone===sel.zone&&has(skip.track)){stats.skipped++;return {...sel,track:skip.track,role:'skip',autoTrack:sel.track};}skip=null;}
 const a=autoTrack(sel);if(a&&has(a)&&a!==sel.track){stats.fixedAuto++;return {...sel,track:a,autoFrom:sel.track};}
 return sel;}
const stem=id=>(LABEL[id]?.title||'').replace(/\s*\(.*\)$/,'');
// 다음 곡: 목록의 다음 곡. 같은 곡의 다른 녹음(죽음의 무도 1925)은 건너뛴다(같은 곡이 이어 들려 '다음'처럼 안 느껴진다).
function after(id){let i=IDS.indexOf(id);for(let k=0;k<IDS.length;k++){i=(i+1)%IDS.length;if(!LABEL[id]||stem(IDS[i])!==stem(id))return IDS[i];}return IDS[(IDS.indexOf(id)+1)%IDS.length];}
function playing(){const m=map();return m?.active?.track||m?.visit?.track||null;}
function set(mode,track){if(mode==='fixed'){const t=LABEL[track]?track:LABEL[prefs.track]?prefs.track:playing()&&LABEL[playing()]?playing():IDS[0];prefs.mode='fixed';prefs.track=t;}else{prefs.mode='auto';}skip=null;save();refresh();return inspect();}
function next(){stats.next++;if(prefs.mode==='fixed'){prefs.track=after(prefs.track);save();}else{const z=curZone(),from=skip&&skip.zone===z?skip.track:playing();skip={zone:z,track:after(from||IDS[IDS.length-1])};}
 refresh();return inspect();}
function inspect(){const m=map();return {revision:REV,prefs:{...prefs},skip:skip?{...skip}:null,key:key(),playing:m?.active?.track||null,playingZone:m?.active?.zone||null,role:m?.visit?.role||null,
 r308:!!m,r308On:!!(m&&m.prefs?.on!==false&&m.loaded),tracks:IDS.length,stats:{...stats},lastError};}
/* ---- 설정 창 ---- */
const CSS=`#r353Bgm{margin:12px 0 4px;padding:10px 12px 12px;border:1px solid #7a6033;border-radius:3px;background:linear-gradient(160deg,rgba(43,33,22,.92),rgba(24,18,13,.94));box-shadow:inset 0 0 0 1px rgba(214,178,110,.12)}
#r353Bgm h3{margin:0 0 8px;font:600 14px/1.4 'Malgun Gothic',serif;letter-spacing:.12em;color:#d9bd84}
#r353Bgm .r353Modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#r353Bgm button{min-height:38px;margin:0;padding:4px 6px;font:13px/1.3 'Malgun Gothic',serif;color:#e8dcc4;background:#1b1612;border:1px solid #8a6b3c;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
#r353Bgm button.on{background:#5d3a1c;border-color:#d8a050;color:#fff4dc;box-shadow:inset 0 0 0 1px rgba(255,214,140,.25)}
#r353Bgm select{width:100%;min-height:40px;margin-top:8px;padding:4px 8px;font:14px/1.3 'Malgun Gothic',serif;color:#3d2a12;background:linear-gradient(100deg,#e3d5b6,#cbb88f);border:1px solid #6b5124;border-radius:2px}
#r353Bgm .r353Now{margin:8px 0 0;font:12px/1.5 'Malgun Gothic',serif;color:#e0c89e}
#r353Bgm .r353Hint{margin:4px 0 0;font:11px/1.5 'Malgun Gothic',serif;color:#a99876}
#r353Bgm .r353Warn{color:#e09a7a}
@media(max-width:640px){#r353Bgm{padding:9px 9px 10px}#r353Bgm .r353Modes{grid-template-columns:repeat(2,minmax(0,1fr))}#r353Bgm #r353Next{grid-column:1 / -1}#r353Bgm button{min-height:44px;font-size:14px}}`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const name=id=>LABEL[id]?LABEL[id].composer+' · '+LABEL[id].title:'';
function nowText(){const s=inspect();
 if(!s.r308||!s.r308On)return ['클래식 BGM 이 꺼져 있거나 곡 목록을 아직 읽지 못해 고르기가 적용되지 않습니다.',true];
 let off=false;try{off=typeof settings!=='undefined'&&(!settings.music||!(settings.bgm>0));}catch(_){}
 const head=prefs.mode==='fixed'?'고정':skip&&skip.zone===curZone()?'이 맵에서만 다음 곡':'자동';
 const want=prefs.mode==='fixed'?prefs.track:skip&&skip.zone===curZone()?skip.track:s.playing;
 return ['지금 ('+head+'): '+(want?'♪ '+name(want):'—')+(off?' · 배경 음악이 꺼져 있거나 음량이 0입니다':''),off];}
function refresh(){try{const box=document.getElementById('r353Bgm');if(!box)return;
 box.querySelectorAll('[data-r353-mode]').forEach(b=>b.classList.toggle('on',b.dataset.r353Mode===prefs.mode));
 const sel=box.querySelector('select');if(sel)sel.value=prefs.mode==='fixed'?prefs.track:'';
 const [t,warn]=nowText(),p=box.querySelector('.r353Now');if(p){p.textContent=t;p.classList.toggle('r353Warn',!!warn);}}catch(e){fail(e);}}
function build(){const box=document.createElement('section');box.id='r353Bgm';
 box.innerHTML='<h3>배경음악</h3><div class="r353Modes"><button type="button" data-r353-mode="auto">자동 · 지역에 맞춰</button><button type="button" data-r353-mode="fixed">고정 · 한 곡만</button><button type="button" id="r353Next">다음 곡 ▶</button></div>'
  +'<select id="r353Track" aria-label="고정할 곡"><option value="">— 곡을 고르면 그 곡으로 고정 —</option>'+TRACKS.map(([id,t,c])=>'<option value="'+esc(id)+'">'+esc(t)+' — '+esc(c)+'</option>').join('')+'</select>'
  +'<p class="r353Now"></p><p class="r353Hint">고정하면 보스방·절정 맵·사몽을 포함해 모든 맵에서 그 곡만 이어서 틉니다. 자동에서 \'다음 곡\'은 지금 맵에 있는 동안만 바뀝니다. 음량·켜고 끄기는 위 배경 음악 설정을 따릅니다.</p>';
 box.querySelectorAll('[data-r353-mode]').forEach(b=>b.onclick=()=>set(b.dataset.r353Mode));
 box.querySelector('#r353Next').onclick=()=>next();
 box.querySelector('select').onchange=e=>{const v=e.target.value;if(v)set('fixed',v);else set('auto');};
 return box;}
function place(){try{const panel=document.getElementById('panel');if(!panel||!panel.querySelector('#settingsClose'))return;
 if(!document.getElementById('r353Style')){const s=document.createElement('style');s.id='r353Style';s.textContent=CSS;document.head.appendChild(s);}
 let box=document.getElementById('r353Bgm');if(!box){box=build();stats.ui++;}
 // 간이설정(R114) 바로 뒤, 세부설정 앞. 모바일 간결화(R142)는 간이설정 '안'만 접으므로 이 칸은 접히지 않고 보인다.
 const quick=panel.querySelector('#quickSettingsR114'),anchor=quick||panel.querySelector('.settings');
 if(anchor){if(anchor.nextElementSibling!==box)anchor.after(box);}else if(box.parentNode!==panel)panel.appendChild(box);
 refresh();}catch(e){fail(e);}}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);place();setTimeout(place,0);setTimeout(place,80);setTimeout(place,400);return r;};}}catch(e){fail(e);}
setInterval(()=>{if(document.getElementById('r353Bgm'))refresh();},1000);
window.__STORYWORLD_BGM_PICK_R353__=Object.freeze({revision:REV,KEY,TRACKS:Object.freeze(TRACKS.map(t=>Object.freeze([...t]))),AUTO_FIX,key,choose,set,next,autoTrack,place,inspect,label:id=>name(id),
 setFix:v=>{prefs.fix=!!v;save();return inspect();}});
})();
