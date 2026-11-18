// R1176 히든 영웅 EGO — '2D EGO' · '3D EGO' 두 모습(사용자 2026-11-18 14:47Z "히든영웅에고도 모션이나 이펙트 및 공격모션특히 뭔가 자연스럽지않고 겹치는 느낌이 있는데
//  2d화랑 3d화 두개로해서 영웅창에서 2d히든영웅에고 3d히든영웅에고 두개 계속넘나들수 있게해줘 스킬이펙트랑 적중이펙트는 완전동일하고").
//  재현(헤드리스 960×540, dist02, 기본 공격 연타): 한 화면에 ① 공격 잔상 몸 1~3겹(반투명 몸이 본체에 겹침) ② 삼협묵희 분신마다 검 궤적·광륜이 또 그려져 궤적 14~20장
//   ③ 대기(3D 렌더를 수묵으로 구운 두건 인물) ↔ 기본 공격(Dots 가로 베기의 광륜 인물) 두 인물 그림을 0.1초 섞어 넘김.
//  고침: 한 영웅(판정·수치·저장·해금 777 공유)에 '모습'만 둘. 저장은 모습 열쇠 하나(storyworld.r1176.egoLook = '2d'|'3d').
//   · 3D EGO = 대기·걷기·달리기·공격·피격·관측 폐기 전부 R1048 3D 렌더 시트 한 인물(수묵 굽기 R1099·Dots 가로 베기 교체 R1139b 는 표식으로 건너뜀).
//   · 2D EGO = 대기·걷기·달리기·피격·스킬 시전·관측 폐기 전부 Dots 붓 그림 전신 세트(CX-0155EG r1, assets/r1176/ego2d, 256칸·발 128,220) + 기본 공격은 R1139b 가로 베기 시트 — 한 인물.
//     그림이 아직 안 받아졌으면 그 칸만 예전 길(수묵 몸)로 그린다. 관측 폐기도 방향별 그림(R1176b: Dots CX-0155EG-6 오른쪽·뒤 추가).
//   · 두 모습 공통: 공격 잔상 몸을 뺀다, 분신(겹쳐 부른 영웅 그리기) 몫 궤적·광륜을 뺀다. 2D 는 다른 인물끼리 섞어 넘기기를 뺀다.
//   · 스킬·적중 이펙트: 이 모듈은 이펙트 명령의 주소·칸·자리·알파를 모습에 따라 바꾸지 않는다(R1139b 가로 붓 궤적·먹 튐·보호막 고리·아이콘, R1094 협주탄, R1145 천체 공명 모두 그대로).
//  영웅창: 영웅 선택창·무한 생존 고르기 창의 EGO 칸을 '2D EGO'·'3D EGO' 두 칸으로, 배치 창(B)과 설정 창 '전투 화면' 구역에는 모습 단추 줄(게임 도중 전환). 어느 쪽을 눌러도 같은 EGO, 모습만 바뀐다.
//  그림만 바꾼다 — 판정·피해·시간·쿨다운·키·저장 필드는 그대로. 손질 전체를 잠깐 쉬게 하려면 API enable(false)(저장하지 않음).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_FORM_R1176__)return;
const REV='R1176-ego-form-3',KEY='storyworld.r1176.egoLook';
const LOOKS=Object.freeze({'2d':Object.freeze({name:'2D EGO',hint:'붓 그림 몸'}),'3d':Object.freeze({name:'3D EGO',hint:'입체 렌더 몸'})});
const LIFT='brightness(1.22) contrast(1.1)',THUMB='assets/r1176/ego3d-portrait.webp'/* R1048 대기 시트 첫 칸 윗몸을 키운 작은 초상(자산 표는 PR 본문) */;
const fin=Number.isFinite,G=(f,d)=>{try{return f();}catch(_){return d;}};
const norm=v=>{if(typeof v!=='string')return null;const k=v.toLowerCase();return Object.prototype.hasOwnProperty.call(LOOKS,k)?k:null;};
let look='2d',on=true;
try{look=norm(localStorage.getItem(KEY))||'2d';}catch(_){}
const stats={frames:0,ghosts:0,fades:0,fx:0,body3d:0,body2d:0,noImage:0,cells:0,switches:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
function set(v){const k=norm(v);if(!k||k===look)return look;look=k;stats.switches++;try{localStorage.setItem(KEY,look);}catch(_){}
 try{if(typeof toast==='function'&&egoUnlocked())toast(LOOKS[look].name+' · '+LOOKS[look].hint,2);}catch(_){}try{ui(true);}catch(e){fail(e);}return look;}
const toggle=()=>set(look==='2d'?'3d':'2d');
// ---- 순수: 영웅 몫 명령 손질 ----
//  R1048 이 붙인 열쇠: 본체 = 원래 열쇠, 섞는 옛 칸 ':r1048f', 잔상 ':r1048g<n>', 검 궤적 ':r1048s<n>', 광륜 ':r1048h', 깃 버스트 ':r1048b'. r1048 값 = 동작 이름 또는 'fx'.
const GHOST=/:r1048g\d+$/,FADE=/:r1048f$/;
// 2D 몸 시트: R1048 동작(칸 수) → Dots 시트(칸 수). 방향 8 → 앞·오른쪽·뒤(+좌우 뒤집기, R1139b 와 같은 표)
const D2=Object.freeze({base:'assets/r1176/ego2d/',slash:'assets/r1139/ego/slash-',cell:256,foot:Object.freeze([128,220]),bodyPx:150,size:1.1,lift:'brightness(1.32) contrast(1.22)',
 old:Object.freeze({cell:160,foot:Object.freeze([80,140.8]),bodyPx:96}),
 clips:Object.freeze({idle:Object.freeze({to:'idle',from:12,n:8}),walk:Object.freeze({to:'walk',from:12,n:8}),run:Object.freeze({to:'run',from:10,n:8}),hit:Object.freeze({to:'hit',from:8,n:4}),discard:Object.freeze({to:'discard',from:20,n:12}),attack:Object.freeze({to:'cast',from:16,n:8})}),
 dirs:Object.freeze({s:['front',false],n:['rear',false],e:['right',false],se:['right',false],ne:['rear',false],w:['right',true],sw:['right',true],nw:['rear',true]}),
 slashMap:Object.freeze([0,0,1,1,2,3,3,4,4,4,5,5,6,6,7,7])});
const SRC2=/assets\/r1048\/ego\/([a-z]+)-([a-z]{1,2})\.webp/;
const D2_ALL=Object.freeze(['idle','walk','run','hit','cast','discard'].flatMap(k=>['front','right','rear'].map(d=>D2.base+k+'-'+d+'.webp')).concat(['front','right','rear'].map(d=>D2.slash+d+'.webp')));
// 순수: 옛 몸 명령 → 2D 시트 주소·칸·뒤집기
function target2d(c,basic){const m=SRC2.exec(String(c?.sourcePath||''));if(!m)return null;const K=Object.prototype.hasOwnProperty.call(D2.clips,m[1])?D2.clips[m[1]]:null,d=Object.prototype.hasOwnProperty.call(D2.dirs,m[2])?D2.dirs[m[2]]:null;if(!K||!d)return null;
 const w=+c.sourceRect?.[2],f0=w>0?Math.round(+c.sourceRect[0]/w):NaN;if(!fin(f0)||f0<0)return null;
 if(m[1]==='attack'&&basic)return {path:D2.slash+d[0]+'.webp',frame:D2.slashMap[Math.min(15,f0)],flip:d[1],clip:'slash'};
 const sheet=K.only||d[0],flip=K.only?false:d[1];return {path:D2.base+K.to+'-'+sheet+'.webp',frame:Math.min(K.n-1,Math.floor(Math.min(K.from-1,f0)*K.n/K.from)),flip,clip:K.to};}
const okPts=p=>Array.isArray(p)&&p.length===4&&p.every(q=>Array.isArray(q)&&fin(q[0])&&fin(q[1]));
// 순수: 옛 몸 칸 네 점 → 새 몸 칸 네 점(발 자리·몸 키 그대로)
function quad2d(points,flip){if(!okPts(points))return null;const O=D2.old,k=Math.abs(points[1][0]-points[0][0])/O.cell;if(!(k>0))return null;
 const fx=Math.min(points[0][0],points[1][0])+O.foot[0]*k,fy=Math.min(points[0][1],points[3][1])+O.foot[1]*k,k2=k*O.bodyPx/D2.bodyPx*D2.size;
 const L=fx-D2.foot[0]*k2,R=fx+(D2.cell-D2.foot[0])*k2,T=fy-D2.foot[1]*k2,M=fy+(D2.cell-D2.foot[1])*k2;
 const q=flip?[[R,T],[L,T],[L,M],[R,M]]:[[L,T],[R,T],[R,M],[L,M]];return q.every(v=>fin(v[0])&&fin(v[1]))?q:null;}
function shape(cmds,st,o){const out={ghosts:0,fades:0,fx:0,body3d:0,body2d:0,noImage:0};if(!Array.isArray(cmds))return out;o=o||{};const lk=norm(o.look)||'2d';st=fin(st)&&st>0?Math.floor(st):0;
 let main=null;for(let i=st;i<cmds.length;i++){const c=cmds[i];if(c&&typeof c==='object'&&c.kind==='image'&&c.owner?.kind==='hero'&&typeof c.r1048==='string'&&c.r1048!=='fx'&&!GHOST.test(String(c.key||''))&&!FADE.test(String(c.key||'')))main=c;}
 for(let i=cmds.length-1;i>=st;i--){const c=cmds[i];if(!c||typeof c!=='object'||c.kind!=='image'||c.owner?.kind!=='hero'||typeof c.r1048!=='string')continue;const key=String(c.key||'');
  if(c.r1048==='fx'){if(o.nested){cmds.splice(i,1);out.fx++;}continue;}
  if(GHOST.test(key)&&c.r1048==='attack'){cmds.splice(i,1);out.ghosts++;continue;}
  if(lk==='2d'&&FADE.test(key)){const was=c.r1048==='attack'&&!!o.basicWas,now=!!main&&main.r1048==='attack'&&!!o.basicNow;if(was!==now){cmds.splice(i,1);out.fades++;continue;}}
  c.r1176=lk;
  if(lk==='2d'&&typeof o.img==='function'){const t=target2d(c,FADE.test(key)?!!o.basicWas:!!o.basicNow),q=t&&quad2d(c.points,t.flip);
   if(t&&q){const im=o.img(t.path);if(!im){out.noImage++;}else{c.image=im;c.sourcePath=t.path;c.sourceRect=[t.frame*D2.cell,0,D2.cell,D2.cell];c.imageSize=[im.naturalWidth||im.width,im.naturalHeight||im.height];c.points=q;c.immutableTint=null;c.mutable=false;
     c.egoDotsR1139b=true;c.r1099=true;c.r1090=true;c.r1176clip=t.clip;c.owner={...c.owner,r409:true};/* 이미 붓 그림 — 수묵 굽기·담묵·테두리를 또 얹지 않는다(R1139b 가로 베기와 같은 처리) */
     const f0=typeof c.style?.filter==='string'&&c.style.filter!=='none'?c.style.filter.trim():'';if(!f0.includes(D2.lift))c.style={...(c.style||{}),filter:(f0?f0+' ':'')+D2.lift};out.body2d++;}}}
  if(lk==='3d'){c.r1099=true;c.egoDotsR1139b=true;c.r1090=true;/* 3D 렌더 색 그대로 — 수묵 굽기·가로 베기 교체·담묵(채도 절반)을 건너뛴다 */const f0=typeof c.style?.filter==='string'&&c.style.filter!=='none'?c.style.filter.trim():'';if(!f0.includes(LIFT))c.style={...(c.style||{}),filter:(f0?f0+' ':'')+LIFT};out.body3d++;}}
 return out;}
function cellLabel(text,lk){const k=norm(lk)||'2d',base=String(text==null?'':text).replace(/^\s*[23]D\s+/i,'').trim()||'EGO';return k.toUpperCase()+' '+base;}
// ---- 게임: 영웅 그리기 뒤 손질 ----
const ego=()=>G(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__,null);
const egoOn=()=>G(()=>{const E=ego();return !!E&&(E.formActive?.()||E.inspect?.().rc151===true);},false);
const egoUnlocked=()=>G(()=>ego()?.unlocked?.()===true,false);
let depth=0,basicWas=false;const done={};
// 그림 받기(R1048·R1139b 와 같은 길: readyImage 캐시 줄 → 한 번 받은 그림은 쥐고 있는다)
const held=new Map(),asked=new Map();
function img(p){try{if(typeof readyImage==='function'){const im=readyImage(p)?.image||null;if(im&&(im.naturalWidth||im.width)>0){held.set(p,im);return im;}}
  const h=held.get(p);if(h)return h;const t=Date.now?.()||0;if(typeof addImage==='function'&&!(t-(asked.get(p)||-1e9)<1500)){asked.set(p,t);addImage(p);}}catch(_){}return null;}
let warmAt=0;function warm(){const t=Date.now();if(t<warmAt||look!=='2d'||!egoUnlocked())return;warmAt=t+(held.size>=D2_ALL.length?30000:1200);for(const p of D2_ALL)img(p);}
function after(rec,st,nested){if(!on||!egoOn())return;const m=G(()=>window.__STORYWORLD_EGO_MOTION_R1048__?.inspect?.(),null),atk=m?.state?.clip==='attack',basicNow=!!(atk&&m?.input?.basic);
 const r=shape(rec.commands,st,{look,nested,basicNow,basicWas,img});if(!nested){if(atk)basicWas=basicNow;stats.frames++;}
 stats.ghosts+=r.ghosts;stats.fades+=r.fades;stats.fx+=r.fx;stats.body3d+=r.body3d;stats.body2d+=r.body2d;stats.noImage+=r.noImage;}
function wrapHero(){if(done.hero||typeof drawHero!=='function')return;done.hero=true;const base=drawHero;
 drawHero=function(...a){let rec=null,st=-1;try{rec=typeof ctx==='object'?ctx:null;st=Array.isArray(rec?.commands)?rec.commands.length:-1;}catch(_){}
  const nested=depth>0;depth++;let r;try{r=base.apply(this,a);}finally{depth--;}
  try{if(st>=0)after(rec,st,nested);}catch(e){fail(e);}return r;};}
// ---- 영웅창: EGO 칸을 두 칸으로 ----
const hasDoc=()=>typeof document==='object'&&!!document&&!!document.body;
const url=p=>G(()=>typeof urlFor==='function'?urlFor(p):'./'+p,'./'+p);
function css(){if(document.getElementById('r1176Css'))return;const s=document.createElement('style');s.id='r1176Css';s.textContent=[
 '[data-r1176].r1176dim{opacity:.78}[data-r1176].r1176dim.selected,[data-r1176].r1176dim.sel{box-shadow:none!important}',
 '[data-r1176].r1176on{border-color:#c8323f!important;box-shadow:0 0 14px #c8323f80!important;opacity:1}',
 '[data-r1176="3d"] img.r1176thumb{object-fit:cover!important;object-position:50% 12%!important;background:#0b0708}',
 '.r1176Bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 10px;font-size:13px;color:#cdbfb1}',
 '.r1176Bar button{min-height:40px;min-width:92px;padding:6px 14px;border-radius:6px;border:1px solid #6a3a3f;background:#1a0f10;color:#e9d9cf;font:inherit;cursor:pointer}',
 '.r1176Bar button.on{border-color:#c8323f;background:#3a1216;color:#fff;box-shadow:0 0 10px #c8323f70}'].join('\n');document.head.appendChild(s);}
const nameEl=c=>c.querySelector('strong')||[...c.querySelectorAll('span')].find(x=>!x.classList.contains('r1046tag')&&!x.classList.contains('role')&&!x.querySelector('img'))||null;
let synthetic=false;
function twinOf(orig){const t=orig.cloneNode(true);t.removeAttribute('data-ego-r1046');t.removeAttribute('data-r600hero');t.removeAttribute('data-hero');t.removeAttribute('id');t.classList.remove('selected','sel');t.dataset.r1176='3d';t.title=LOOKS['3d'].name;
 const n=nameEl(t);if(n)n.textContent=cellLabel(n.textContent,'3d');const im=t.querySelector('img');if(im){im.onerror=null;im.classList.add('r1176thumb');im.alt=LOOKS['3d'].name;im.src=url(THUMB);}
 t.onclick=ev=>{try{ev?.stopPropagation?.();set('3d');/* 창이 다시 그려져 원래 칸이 바뀌었을 수 있다 — 지금 줄에 있는 EGO 칸을 누른다 */const live=t.parentElement?.querySelector('[data-ego-r1046],[data-r600hero="ego"]')||orig;synthetic=true;try{live.click();}finally{synthetic=false;}setTimeout(()=>ui(true),0);}catch(e){fail(e);}};return t;}
function cells(){const list=[];for(const sel of ['#panel [data-ego-r1046]','#panel [data-r600hero="ego"]'])for(const c of document.querySelectorAll(sel))list.push(c);
 for(const c of list){if(c.dataset.r1176!=='2d'){c.dataset.r1176='2d';}const n=nameEl(c);if(n){const want=cellLabel(n.textContent,'2d');if(n.textContent!==want)n.textContent=want;}
  let t=c.nextElementSibling;if(!t||t.dataset?.r1176!=='3d'){t=twinOf(c);c.insertAdjacentElement('afterend',t);stats.cells++;}
  const picked=c.classList.contains('selected')||c.classList.contains('sel');
  /* EGO 를 골랐을 때만: 지금 모습 칸은 켜짐 표시, 다른 모습 칸은 살짝 흐리게(누르면 넘어감) */
  c.classList.toggle('r1176dim',picked&&look==='3d');c.classList.toggle('r1176on',picked&&look==='2d');t.classList.toggle('r1176dim',picked&&look==='2d');t.classList.toggle('r1176on',picked&&look==='3d');}
 // 주인 없는 3D 칸(원래 칸이 다시 그려져 사라짐)은 치운다
 for(const t of document.querySelectorAll('#panel [data-r1176="3d"]')){const p=t.previousElementSibling;if(!p||p.dataset?.r1176!=='2d')t.remove();}}
function makeBar(id,cls){const b=document.createElement('div');b.id=id;b.className='r1176Bar'+(cls?' '+cls:'');b.innerHTML='<span>EGO 모습</span><button type="button" data-r1176look="2d">'+LOOKS['2d'].name+'</button><button type="button" data-r1176look="3d">'+LOOKS['3d'].name+'</button>';
 for(const x of b.querySelectorAll('button'))x.onclick=ev=>{try{ev?.stopPropagation?.();ev?.preventDefault?.();set(x.getAttribute('data-r1176look'));}catch(e){fail(e);}};return b;}
const litBar=b=>{for(const x of b.querySelectorAll('button'))x.classList.toggle('on',x.getAttribute('data-r1176look')===look);};
// 배치 창(B · 무한 생존/방어)과 설정 창 '전투 화면' 구역: 게임 도중 어느 모드에서나 모습을 오간다
function bar(){if(!egoUnlocked())return;const P=document.getElementById('r720Panel');
 if(P){let b=document.getElementById('r1176Bar');if(!b||!P.contains(b)){b=makeBar('r1176Bar');const h=P.querySelector('h2');if(h)h.insertAdjacentElement('afterend',b);else P.insertAdjacentElement('afterbegin',b);}litBar(b);}
 const host=document.getElementById('combatScreenR1021')||document.getElementById('quickSettingsR114');
 if(host){let b=document.getElementById('r1176Set');if(!b||!host.contains(b)){b=makeBar('r1176Set','r1021-row');const anchor=document.getElementById('egoInkRowR1099');if(anchor&&anchor.parentNode===host)anchor.insertAdjacentElement('afterend',b);else host.appendChild(b);}litBar(b);}}
let uiAt=0;
function ui(force){if(!hasDoc())return;const t=Date.now();if(!force&&t<uiAt)return;uiAt=t+200;try{css();if(egoUnlocked())cells();bar();}catch(e){fail(e);}}
function onClick(ev){try{if(ev.target?.closest?.('#panel'))setTimeout(()=>ui(true),30);if(synthetic)return;const c=ev.target?.closest?.('[data-r1176="2d"]');if(c)set('2d');}catch(e){fail(e);}}
function install(){try{wrapHero();warm();if(hasDoc()&&!done.click){done.click=true;document.addEventListener('click',onClick,true);}ui();}catch(e){fail(e);}}
install();try{setInterval(install,250);}catch(_){}
window.__STORYWORLD_EGO_FORM_R1176__=Object.freeze({revision:REV,storageKey:KEY,LOOKS,LIFT,D2,D2_ALL,look:()=>look,set,toggle,shape,target2d,quad2d,cellLabel,
 enable(v){on=v!==false;return on;},
 inspect:()=>({revision:REV,on,look,installed:{...done},basicWas,stats:{...stats},lastError})});
})();
