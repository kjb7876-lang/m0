// R255 서사는 모두 쪽지·기억 조각 모양으로 — 사용자 2026-11-03 "모든텍스트서사 기억조각및 쪽지같은 형식으로 해줘 조형물이랑상호작용하는것도 쪽지or3d체험형식으로
//  연출해주고 보스맵들어가는것도 모든서사를 조각및쪽지같은방식으로 구현해야함 혹은 3d체험방식 or 너가 코드로 짧은영상이나 애니메이션생성".
//  진행이 걸리지 않은 서사는 R139·R169·R177 이 이미 바닥의 쪽지로 떨어뜨린다. 남은 것은 진행이 걸린 서사(보스 문 앞 '전투 전', 출구 '전투 후',
//  조형물·제단을 E 로 조사, 최종장 단계)로, 엔진의 서사 창(배경 지도 + 인물 그림 + 긴 글 상자)으로 화면을 덮었다.
//  · 그 창을 쪽지 한 장처럼 바꾼다: 배경 지도·인물 그림을 빼고, 화면 오른쪽에 작은 종이(쪽지·기억 조각·진료기록·보고서 — R177 과 같은 분류·같은 종이)로,
//    머리에 '쪽지 · 제목', 아래에 원래 '계속' 단추. 창이 떠 있는 동안 전투가 멈추고, 끝나면 원래 하던 일(보스 전투·문·지역 완료)을 그대로 한다(진행 코드 그대로).
//  · 보스 구역 서사(그 지역에 보스가 있고 '전투 전' 장면이 처음 뜰 때): 쪽지 앞에 코드로 그린 짧은 이름 카드(약 3.4초, R682 새 디자인 — 아래 설명).
//    지역 이름과 보스 이름(게임에 있는 이름 그대로)이 떠오른다. 누르기·Esc·Enter·Space 로 건너뛴다.
//  · 그대로 두는 것: 기억 책(쪽지 모음)에서 직접 여는 읽기(journal:)는 책 모양 그대로. 함께하기는 예전 창.
//  끄기: localStorage['storyworld.r255.fragments']='{"on":false}' ({"cinema":false} 로 연출만 끔)
(()=>{'use strict';
if(window.__STORYWORLD_STORY_FRAGMENTS_R255__)return;
const REV='R255-fragments-3-R682-R1036',KEY='storyworld.r255.fragments';
let prefs={on:true,cinema:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={styled:0,cinemas:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const FORMS={chart:'진료기록',shard:'기억 조각',report:'누군가의 보고서',note:'쪽지'};
function css(){if(typeof document==='undefined'||document.getElementById('r255Css'))return;const s=document.createElement('style');s.id='r255Css';s.textContent=
 '#modal.r255{backdrop-filter:none;background:radial-gradient(120% 90% at 30% 50%,rgba(0,0,0,.05),rgba(0,0,0,.55));justify-content:flex-end;align-items:center}'
 +'#panel.r255-doc{width:min(460px,92vw);max-height:78vh;margin-right:max(18px,3vw);padding:16px 18px 12px;background:#1a1412f2;border:1px solid #6b5640;border-radius:3px;box-shadow:0 18px 50px #000c}'
 +'#panel.r255-doc .storyLayout{display:block}#panel.r255-doc .storyArt{display:none!important}'
 +'#panel.r255-doc .eyebrow{font-size:11px;letter-spacing:.14em;opacity:.7;margin:0 0 2px}#panel.r255-doc h2{font-size:17px;margin:0 0 6px}'
 +'#panel.r255-doc .r255Tag{display:inline-block;margin:0 0 6px;padding:1px 8px;font:700 11px/1.6 "Malgun Gothic",sans-serif;letter-spacing:.08em;border-radius:2px;background:#d9c5a6;color:#7a2a24}'
 +'#panel.r255-doc .storyText{max-height:52vh;overflow:auto;font-size:14px;line-height:1.75}'
 +'#panel.r255-doc.f-note .storyText{background:linear-gradient(172deg,#efe4cf,#d9c5a6);color:#2a1d16;padding:12px 16px;border:1px solid #8a6a4a;box-shadow:inset 0 0 28px #7a4a2a3a}'
 +'#panel.r255-doc.f-chart .storyText{background:#f3f1ea repeating-linear-gradient(180deg,transparent 0 27px,#c9d3dc 27px 28px);color:#1d2630;padding:10px 16px;border:1px solid #7d8a96}#panel.r255-doc.f-chart .r255Tag{background:#7d8a96;color:#fff}'
 +'#panel.r255-doc.f-shard .storyText{background:radial-gradient(120% 90% at 30% 10%,#3a1820,#120a10);color:#ecd9d6;padding:12px 16px;border:1px solid #b0404a;box-shadow:0 0 18px #b0404a55}#panel.r255-doc.f-shard .r255Tag{background:#3a1820;color:#ff9a9a;border:1px solid #b0404a}'
 +'#panel.r255-doc.f-report .storyText{background:#e9e4d8;color:#1e1c18;padding:10px 16px;border:1px solid #6c6556;font-family:"Nanum Gothic Coding","D2Coding",monospace}#panel.r255-doc.f-report .r255Tag{background:#e9e4d8;color:#5a1a14;border:1px dashed #6c6556}'
 +'@media (max-width:700px){#modal.r255{justify-content:center;align-items:flex-end}#panel.r255-doc{margin:0 0 12px}}';document.head.appendChild(s);}
function formOf(s){try{const f=window.__STORYWORLD_STORY_COLLECT_R177__?.formOf;if(typeof f==='function')return f([s]);}catch(e){fail(e);}return 'note';}
function eligible(s){if(!prefs.on||!solo()||!s)return false;if(/^journal:/.test(String(s.key||'')))return false;return true;}
function unstyle(){try{document.getElementById('panel')?.classList.remove('r255-doc','f-note','f-chart','f-shard','f-report');document.getElementById('modal')?.classList.remove('r255');}catch(_){}}
function style(s){const pn=document.getElementById('panel'),md=document.getElementById('modal');if(!pn||!pn.querySelector('.storyText'))return;css();const f=formOf(s);
 pn.classList.remove('f-note','f-chart','f-shard','f-report');pn.classList.add('r255-doc','f-'+(FORMS[f]?f:'note'));md?.classList.add('r255');
 const h=pn.querySelector('h2');if(h&&!pn.querySelector('.r255Tag')&&!pn.querySelector('.r177Tag')){const t=document.createElement('div');t.className='r255Tag';t.textContent=FORMS[f]||'쪽지';h.parentNode.insertBefore(t,h);}stats.styled++;}
// ---- 보스 구역 짧은 연출(코드로 그린 애니메이션) ----
// R682(사용자 2026-11-11 00:26Z "보스 이름나오고 지그재그빨간선나오는거 너무 디자인구려서 … 닷츠컷신에 맞게 새디자인"):
//  예전 붉은 먹 얼룩·사인 곡선 지그재그 붉은 금·#ff6a6a 이름을 버리고, R568 보스 컷신·CX-0063CN 결로 '이름 카드'를 새로 그린다.
//  검은 띠가 닫힘 → 화면이 가라앉고 가운데에 검붉은 그늘이 번짐 → 보스 그림이 어둠 속 실루엣으로 떠오름(왼쪽 위 빛의 금빛 테두리, 통째로 화면 안)
//  → 금빛 가는 선이 가운데에서 양쪽으로 자라며 끝이 사라짐(가운데 작은 마름모, 십자가 모양 없음) → 지역 이름(금빛)·보스 이름(상아색 세리프)이 천천히 가라앉듯 또렷해짐
//  → 불규칙한 잿불 조각이 천천히 오름 → 띠가 열리며 사라짐. 약 3.4초(움직임 줄이기 설정이면 1.8초). 누르기·Esc·Enter·Space 로 건너뜀.
//  렉: 글자·실루엣은 시작할 때 한 번만 미리 그리고, 한 프레임은 그리기 명령 40개 안팎. 게임 캔버스에는 filter 를 쓰지 않는다.
//  Dots 자산(CX-0069BT 이름 카드 장식·잿불 시트)이 오면 장식선·잿불을 그 시트로 바꾼다. 지금 것은 코드 임시본.
const shown=new Set();
function bossInfo(s){try{if(!s||s.part!=='pre')return null;const r=regionById?.[s.id];if(!r||!(r.bosses?.length))return null;const k=String(s.id)+':'+(typeof layer!=='undefined'?layer:'');if(shown.has(k))return null;shown.add(k);
  const live=(typeof room!=='undefined'&&room?.enemies||[]).find(e=>e&&e.boss&&e.hp>0);return {region:String(r.title||''),boss:String(live?.name||r.bosses[0]?.name||''),...artOf(live)};}catch(e){fail(e);return null;}}
// R1036: 실루엣 그림은 게임이 지금 그 보스 몸을 그리는 그림으로(불면귀는 R760 portrait — 엔진 e.path 는 옛 회백 해골). 없으면 e.path 그대로.
function artOf(e){let p=null;try{p=e?window.__STORYWORLD_BULMYEONGWI_R760__?.portrait?.(e)||null:null;}catch(err){fail(err);}
 return p&&p.path?{path:String(p.path),crop:p.crop||null}:{path:e?.path||null,crop:null};}
const GOLD='#c9a46a',IVORY='#efe2cf',SHADE='58,13,34',SERIF='"Gowun Batang","Noto Serif KR","Nanum Myeongjo","Malgun Gothic",serif';
const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x),win=(t,a,b)=>ease((t-a)/(b-a));
function bossArt(path,crop){try{if(!path||typeof readyImage!=='function')return null;const r=readyImage(path);const im=r?.image;if(!im)return null;const iw=im.naturalWidth||im.width||0,ih=im.naturalHeight||im.height||0;if(!(iw>1&&ih>1))return null;
 const c=crop||r.crop||{x:0,y:0,w:iw,h:ih},k=Math.min(1,512/Math.max(c.w||iw,c.h||ih)),w=Math.max(1,Math.round((c.w||iw)*k)),h=Math.max(1,Math.round((c.h||ih)*k));
 // 원본이 칼로 자른 듯 끝나면(끝 열 불투명 > 높이 12%, 루시퍼 오른쪽 날개 등) 그쪽 14% 를 서서히 투명하게(R568 과 같은 처리)
 const base=document.createElement('canvas');base.width=w;base.height=h;const bg=base.getContext('2d');if(!bg)return null;bg.drawImage(im,+c.x||0,+c.y||0,c.w||iw,c.h||ih,0,0,w,h);
 try{const d=bg.getImageData?.(0,0,w,h)?.data;if(d){const col=x=>{let n=0;for(let y=0;y<h;y++)if(d[(y*w+x)*4+3]>40)n++;return n;},F=Math.max(8,w*.14);
  for(const [side,n] of [['left',Math.max(col(0),col(1))],['right',Math.max(col(w-1),col(w-2))]]){if(n<=h*.12)continue;const gr=side==='right'?bg.createLinearGradient(w-F,0,w,0):bg.createLinearGradient(F,0,0,0);
   gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');bg.globalCompositeOperation='destination-out';bg.fillStyle=gr;if(side==='right')bg.fillRect(w-F,0,F,h);else bg.fillRect(0,0,F,h);bg.globalCompositeOperation='source-over';}}}catch(_){}
 const tint=col=>{const t=document.createElement('canvas');t.width=w;t.height=h;t.__bossArt=true;const g=t.getContext('2d');if(!g)return null;g.drawImage(base,0,0);g.globalCompositeOperation='source-atop';g.fillStyle=col;g.fillRect(0,0,w,h);return t;};
 const dark=tint('#0b0608'),rim=tint(GOLD);return dark&&rim?{dark,rim,w,h}:null;}catch(e){fail(e);return null;}}
function cinema(info){if(!prefs.cinema||!info||typeof document==='undefined')return;const st=document.getElementById('stage')||document.body;if(!st)return;stats.cinemas++;
 const c=document.createElement('canvas');c.id='r255Cinema';c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:2147482400;cursor:pointer';document.body.appendChild(c);
 let reduced=false;try{reduced=!!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_){}
 const t0=performance.now(),D=reduced?1800:3400;let done=false,art=null,artTry=0,lay=null;
 const onKey=ev=>{const k=ev&&ev.key;if(k==='Escape'||k==='Enter'||k===' '||k==='Spacebar'){try{ev.preventDefault();ev.stopImmediatePropagation?.();ev.stopPropagation?.();}catch(_){}end();}};
 const end=()=>{if(done)return;done=true;try{removeEventListener('keydown',onKey,true);}catch(_){}c.remove();};c.onclick=end;try{addEventListener('keydown',onKey,true);}catch(_){}
 try{if(info.path&&typeof ensureImages==='function'){const p=ensureImages([info.path]);if(p&&typeof p.catch==='function')p.catch(()=>{});}}catch(_){}
 const R=(()=>{let s=2166136261;for(const ch of info.boss)s=Math.imul(s^ch.charCodeAt(0),16777619);return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};})();
 const embers=[...Array(18)].map(()=>({x:R(),y:R(),v:.05+R()*.09,s:1.2+R()*2.4,r:R()*6.28,w:.6+R()*1.4,p:R()*6.28,hot:R()<.55}));
 // 글자 한 장: 지역(금빛, 자간 넓게) + 보스 이름(상아색, 따뜻한 빛 번짐). 처음 한 번만.
 function layout(W,H,dp){const U=Math.min(W,H),bar=H*.12,regPx=Math.max(11,Math.round(U*.026));let namePx=Math.max(18,Math.round(Math.min(U*.085,W*.07)));
  const m=document.createElement('canvas').getContext('2d');const fit=(txt,px)=>{if(!m)return 0;m.font='700 '+px+'px '+SERIF;return m.measureText(txt).width+txt.length*px*.04;};
  // 긴 이름: 먼저 글자를 줄이고(18px 까지), 그래도 넘치면 ' · ' 또는 가운데 띄어쓰기에서 두 줄로 나눈다(글은 그대로).
  let rows=[info.boss];while(namePx>18&&fit(info.boss,namePx)>W*.84)namePx--;
  if(fit(info.boss,namePx)>W*.84){const b=info.boss,dot=b.indexOf(' · ');let i=dot>0?dot:-1;if(i<0){let best=-1;for(let j=0;j<b.length;j++)if(b[j]===' '&&(best<0||Math.abs(j-b.length/2)<Math.abs(best-b.length/2)))best=j;i=best;}
   if(i>0)rows=[b.slice(0,i).trim(),b.slice(i).replace(/^\s*·?\s*/,'').trim()].filter(Boolean);namePx=Math.max(18,Math.round(Math.min(U*.085,W*.07)));while(namePx>12&&Math.max(...rows.map(r=>fit(r,namePx)))>W*.84)namePx--;}
  const nameH=namePx*(1.9+(rows.length-1)*1.2),cw=Math.ceil(W*dp),ch=Math.ceil((regPx*2.2+nameH)*dp),tc=document.createElement('canvas');tc.width=Math.max(1,cw);tc.height=Math.max(1,ch);const g=tc.getContext('2d');
  if(g){g.setTransform(dp,0,0,dp,0,0);g.textAlign='center';g.textBaseline='middle';
   g.fillStyle=GOLD;g.font='600 '+regPx+'px '+SERIF;try{g.letterSpacing=Math.round(regPx*.32)+'px';}catch(_){}g.globalAlpha=.95;g.fillText(info.region,W/2,regPx*.9);
   try{g.letterSpacing=Math.round(namePx*.04)+'px';}catch(_){}g.font='700 '+namePx+'px '+SERIF;g.shadowColor='rgba(233,194,122,.38)';g.shadowBlur=namePx*.45;g.fillStyle=IVORY;g.globalAlpha=1;
   rows.forEach((r,i)=>g.fillText(r,W/2,regPx*2.2+namePx*(.8+i*1.2)));g.shadowBlur=0;}
  const top=H*.5-(regPx*2.2+nameH)*.5;
  return{W,H,dp,U,bar,regPx,namePx,tc,top,th:ch/dp,lineY:top+regPx*1.85,line2Y:top+regPx*2.2+nameH-namePx*.28};}
 const frame=()=>{if(done)return;const t=(performance.now()-t0)/D;if(t>=1){end();return;}const W=innerWidth,H=innerHeight,dp=Math.min(2,devicePixelRatio||1);
  if(c.width!==Math.round(W*dp)||c.height!==Math.round(H*dp)){c.width=Math.round(W*dp);c.height=Math.round(H*dp);lay=null;}
  const g=c.getContext('2d');if(!g){end();return;}if(!lay)lay=layout(W,H,dp);
  if(!art&&info.path&&artTry<40&&(artTry++%6===0))art=bossArt(info.path,info.crop);
  g.setTransform(dp,0,0,dp,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,W,H);
  const out=1-win(t,.84,1),shut=win(t,0,.14)*out,L=lay;
  // 가라앉는 화면 + 가운데 검붉은 그늘(빛 번짐 아님)
  g.fillStyle='rgba(6,3,5,'+(.8*shut).toFixed(3)+')';g.fillRect(0,0,W,H);
  const sp=win(t,.06,.4)*out;if(sp>0){g.save();g.translate(W/2,H*.5);g.scale(Math.max(1,W/H)*1.25,1);const R0=H*.42*(.7+.3*sp),gr=g.createRadialGradient(0,0,0,0,0,R0);gr.addColorStop(0,'rgba('+SHADE+','+(.85*sp).toFixed(3)+')');gr.addColorStop(.55,'rgba('+SHADE+','+(.35*sp).toFixed(3)+')');gr.addColorStop(1,'rgba('+SHADE+',0)');g.fillStyle=gr;g.fillRect(-R0,-R0,R0*2,R0*2);g.restore();}
  // 보스 실루엣: 띠 안·화면 안에 통째로, 아주 천천히 떠오름
  if(art){const a=win(t,.1,.42)*out;if(a>0){const ih=H-2*L.bar,maxH=ih*.84,maxW=W*.62,h0=Math.min(maxH,maxW*art.h/art.w),w0=h0*art.w/art.h,x=(W-w0)/2,rise=(1-win(t,.1,.9))*ih*.025,y=Math.min(H-L.bar-h0,L.bar+(ih-h0)*.5+rise);
   g.globalAlpha=.32*a;g.drawImage(art.rim,x-1.6,y-1.6,w0,h0);g.globalAlpha=.92*a;g.drawImage(art.dark,x,y,w0,h0);g.globalAlpha=1;}}
  // 금빛 가는 선(가운데에서 양쪽으로, 끝은 사라짐) + 가운데 작은 마름모
  const hair=(y,k,a,thick)=>{if(k<=0||a<=0)return;const half=W*.28*k,gr=g.createLinearGradient(W/2-half,0,W/2+half,0);gr.addColorStop(0,'rgba(201,164,106,0)');gr.addColorStop(.5,'rgba(201,164,106,'+a.toFixed(3)+')');gr.addColorStop(1,'rgba(201,164,106,0)');g.fillStyle=gr;g.fillRect(W/2-half,y,half*2,thick);};
  const k1=win(t,.12,.46),k2=win(t,.2,.54);hair(L.lineY,k1,.9*out,1.2);hair(L.line2Y,k2,.55*out,1);
  const dk=win(t,.3,.42)*out;if(dk>0){const r=Math.max(2.5,L.U*.006)*dk;g.globalAlpha=dk;g.fillStyle=GOLD;g.beginPath();g.moveTo(W/2,L.lineY+.6-r);g.lineTo(W/2+r,L.lineY+.6);g.lineTo(W/2,L.lineY+.6+r);g.lineTo(W/2-r,L.lineY+.6);g.closePath();g.fill();g.globalAlpha=1;}
  // 글자: 가운데부터 옆으로 열림(지역 먼저, 이름은 조금 뒤)
  const reg=win(t,.18,.38)*out,nm=win(t,.26,.52)*out;
  if(reg>0){const rh=L.regPx*1.8;g.globalAlpha=reg;g.drawImage(L.tc,0,0,L.tc.width,rh*L.dp,0,L.top,W,rh);g.globalAlpha=1;}
  // 이름: 칼같이 자르며 여는 대신, 살짝 크게(1.05배)·아래에서 천천히 가라앉듯 또렷해진다(가장자리가 잘려 보이지 않게)
  if(nm>0){const y0=L.regPx*1.8,hh=L.th-y0,sc=1+.05*(1-ease(win(t,.26,.6))),lift=(1-ease(nm))*L.namePx*.14,dw=W*sc,dh=hh*sc;
   g.globalAlpha=nm;g.drawImage(L.tc,0,y0*L.dp,W*L.dp,hh*L.dp,(W-dw)/2,L.top+y0+lift-(dh-hh)/2,dw,dh);g.globalAlpha=1;}
  // 잿불: 불규칙한 조각이 천천히 오름(네모 점 아님)
  const ea=win(t,.15,.4)*out;if(ea>0){const sec=t*D/1000;for(const p of embers){const y=((p.y-(reduced?0:sec*p.v))%1+1)%1,x=p.x+Math.sin(sec*.9+p.p)*.012,X=x*W,Y=L.bar+y*(H-2*L.bar),s=p.s*(L.U/720+.4),fl=.55+.45*Math.sin(sec*5+p.p);
    g.globalAlpha=ea*fl*(.35+.65*Math.sin(Math.PI*y));g.fillStyle=p.hot?'#e9a85a':'#8a7a70';g.beginPath();const a0=p.r+sec*.6;g.moveTo(X+Math.cos(a0)*s*p.w,Y+Math.sin(a0)*s);g.lineTo(X+Math.cos(a0+2.3)*s*.7,Y+Math.sin(a0+2.3)*s*p.w*.8);g.lineTo(X+Math.cos(a0+4.1)*s*.9,Y+Math.sin(a0+4.1)*s*.6);g.closePath();g.fill();}g.globalAlpha=1;}
  // 위아래 검은 띠
  const bar=L.bar*shut;if(bar>.5){g.fillStyle='#040203';g.fillRect(0,0,W,bar);g.fillRect(0,H-bar,W,bar);}
  requestAnimationFrame(frame);};requestAnimationFrame(frame);}
if(typeof advanceScene==='function'){const base=advanceScene;advanceScene=function(...a){const r=base.apply(this,a);
 try{const s=typeof storyScene!=='undefined'?storyScene:null;if(s&&eligible(s)){style(s);const info=bossInfo(s);if(info)cinema(info);}else unstyle();}catch(e){fail(e);}return r;};}
if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){unstyle();return base.apply(this,a);};}// 다른 창에는 쪽지 모양이 남지 않게(서사 창은 advanceScene 뒤에 다시 입힌다)
if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){unstyle();return base.apply(this,a);};}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
// 미리보기(검수·녹화용): 지금 지역·살아 있는 보스로 이름 카드를 한 번 띄운다. 진행·저장은 건드리지 않는다.
function preview(o={}){try{const r=regionById?.[o.id||(typeof room!=='undefined'?room?.id:'')];const live=(typeof room!=='undefined'&&room?.enemies||[]).find(e=>e&&e.boss&&e.hp>0);
 const a=o.path!=null?{path:o.path,crop:o.crop||null}:artOf(live);cinema({region:String(o.region??r?.title??''),boss:String(o.boss??live?.name??r?.bosses?.[0]?.name??''),...a});return true;}catch(e){fail(e);return false;}}
window.__STORYWORLD_STORY_FRAGMENTS_R255__=Object.freeze({revision:REV,set,preview,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
