// R760 불면귀 보스 연출 — 사용자 2026-11-11 "불면귀파트 여러 연출 강화… 불면귀보스도 조금더 모든방면으로 개선하도록 모션이랑 일관성과 불면귀스럽게
//  아까 귀비탕영상참고", "귀비탕영상+동양몽세 진입 시네마틱과 서사에 맞게", "향후 게임 홍보영상으로도 쓰일것이기에 디테일".
//  헤드리스 실측(qa/r760): 불면귀(last303 l303-boss)는 대기 그림과 공격 그림이 서로 다른 그림체·다른 크기(몸 사각형 키 158.7 → 132.6px, 16% 줄어듦)였고,
//  회백 연기의 해골 저승사자라 영상의 '먹색 실타래 · 호박색 눈빛 한 점 · 보라 소용돌이 속 핵'과 달랐다.
//  · 일관성: 같은 인물의 밀도 높은 4자세(R104 mb-last302 p1 준비·p2 타격·p3 이어짐·p4 대기/회수)를 먹색·보라 톤 + 호박색 눈빛으로 칠한 사본
//    (scripts/r760-bulmyeongwi-tone.py → assets/r760/boss)으로 대기·공격을 모두 그린다. 크기는 엔진 대기 그림 기준 하나(×1.3)로 고정.
//    실비(rain)·흩어짐(transition) 패턴 그림도 톤 사본으로, 같은 기준 크기로.
//  · 불면귀다움: 정본 35장 "잠을 빼앗는 시선과 겹겹의 잔상" — 몸 뒤에 같은 자세의 잔상 2겹(체력 절반 이하 3겹), 공격 준비 동안 잔상이 벌어진다.
//  · 중간보스 '검은 안개 심장 · 불면의 기억'(last302)은 불면귀의 기억 조각: 회백 그림·크기는 그대로, 잔상 1겹만.
//  · 그림만 바꾼다. 판정·피해·체력·시간·세이브·생성 지점은 그대로. 최종 그림은 Dots CX-0070BM(보스 768칸 재작화)이 오면 그것으로 바꾼다.
//  · 순서: 그림 바꾸기는 불러올 때 바로 drawEnemy 를 감싸(R620 보다 안쪽 → R620 이 -p1~-p4 자세 번호로 교차 보간·숨쉬기를 얹음),
//    잔상은 setTimeout 0 으로 R620 보다 바깥에서(R620 이 다듬은 몸을 따라감).
//  · R761: Dots CX-0070BM r1 보스 시트(실타래 형상·호박색 눈 한 점·보라 핵, 7분야 심사 통과 6장)가 오면 4자세 대신 시트로 그린다.
//    대기 idle6 · 걷기 move6 · 공격은 실 팔 휘감기 atkA8 과 눈빛 atkB8 을 번갈아 · 실비 패턴은 두 팔을 드는 cast8 · 흩어짐은 핵이 드러나는 reveal8(정본 35장 "마침내 핵이 드러났고").
//    768칸을 512칸으로 줄인 사본(scripts/r761-bulmyeongwi-sheets.py → assets/r760/boss/sheet-*.webp). 시트가 아직 안 실렸으면 톤 4자세로 그린다.
//  · R762 효과음: 그림 스레드가 ElevenLabs 로 만들고 사용자 소리 기준(150Hz 아래 ≤8%·2~5kHz ≤35%·피크 −10~−13dB)에 맞춘 12개 중 보스 8개(assets/r761/sfx).
//    동작이 시작될 때 한 번씩: 실 팔 휘감기(atkA) → wrap, 눈빛(atkB) → gaze, 실비(cast) → rain, 핵 드러남(reveal) → reveal. 보스 소리끼리 1.2초 간격(잦으면 건너뜀), 창이 떠 있으면 조용.
//    엔진 sound()·soundProfiles 에 프로필로만 얹는다(R541 방식, R545 다듬기가 그대로 걸림). 주민 신음·잠드는 소리는 주민 몹 그림이 들어올 때.
//  · R764: Dots CX-0070BM r2·r3 남은 시트. 보스 — 체력 절반 이하로 서 있으면 실타래가 풀려 흐트러진 2페이즈 대기 idle2_6, 서 있거나 걷다 맞으면 움찔 hit4
//    (1.5초에 한 번만, 공격·패턴 중엔 공격 그림 유지), 죽으면 엔진 불꽃 대신 death10 으로 실타래가 풀려 흩어진다(빈 마지막 칸은 안 씀).
//    중간보스 '검은 안개 심장'은 엔진 4자세 대신 시트(대기6·공격8·피격4·죽음8, 512칸·발 (256,470)), 보이는 키는 엔진 대기와 같게.
//    넷째 묶음: 눈빛 공격은 예비 동작이 생긴 atkB8_r2(1~3칸 움츠림·4칸 쏠림·5칸 시선 = 타격, sheet-atkB2), 체력 절반 이하 피격은 hit2nd4(sheet-hit2).
//    scripts/r764-bulmyeongwi-sheets.py → assets/r760/{boss,mid}/sheet-*.webp. 시트가 안 실렸으면 지금 그림·엔진 죽음 그대로.
//  끄기: localStorage['storyworld.r760.bulmyeongwi']='{"on":false}'(시트만 끄기 '{"sheets":false}', 소리만 끄기 '{"sfx":false}'). 점검: window.__STORYWORLD_BULMYEONGWI_R760__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BULMYEONGWI_R760__)return;
const REV='R760-bulmyeongwi-4',KEY='storyworld.r760.bulmyeongwi';
let prefs={on:true,ghosts:true,sheets:true,sfx:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={draws:0,swapped:0,waiting:0,patterns:0,ghosted:0,errors:0};let lastError=null,last=null,lastDeath=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const DIR='assets/r760/boss/bulmyeongwi-';
const POSE={w:393,h:432,px:193,py:406,vis:400};      // R104 mb-last302 열쇠 자세 칸·발 기준점·보이는 키
const IDLE_VIS=257/384;                               // 엔진 대기 그림(672x384)의 보이는 몸 비율(보이는 영역 65..322)
const SCALE=1.3;                                      // 대기 기준 대비 보스 몸 크기
const PATTERN={rain:{foot:353},transition:{foot:353}}; // 672x384 패턴 그림의 발 줄
// R761 Dots 시트: 512칸, 발 (256,469.33)(768칸 (384,704)), 보이는 키 약 383px(768칸 약 575px). fps 는 칸이 바뀌는 빠르기.
const SC={cell:512,px:256,py:469.33,vis:383};
const SHEET={idle:{n:6,fps:7},move:{n:6,fps:9},atkA:{n:8},atkB:{n:8},cast:{n:8,step:.11,loop:[4,6]},reveal:{n:8,step:.14},idle2:{n:6,fps:7},hit:{n:4,step:.075},atkB2:{n:8,strike:4},hit2:{n:4,step:.075}};
// R764 중간보스 시트(원래 512칸, 발 줄 470, 보이는 키 약 400) · 죽음 시트(보스 death10 은 0~8칸, 중간보스 death8 은 0~6칸 — 마지막은 빈 칸)
const MC={cell:512,px:256,py:470,vis:400},MSHEET={idle:{n:6,fps:7},atk:{n:8},hit:{n:4,step:.075},death:{n:8}},MPATH=k=>'assets/r760/mid/sheet-'+k+'.webp';
const DEATH={boss:{n:10,last:8,step:.13,fade:.7,path:()=>SPATH('death'),py:469.33,vis:383},mid:{n:8,last:6,step:.12,fade:.6,path:()=>MPATH('death'),py:470,vis:400}};
const FLINCH_GAP=1.5;
const SPATH=k=>DIR.replace(/bulmyeongwi-$/,'')+'sheet-'+k+'.webp';
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|r92\/boss|death|dissol|burn/i;
const srcOf=c=>String(c?.sourcePath||c?.image?.currentSrc||c?.image?.src||'');
const roomId=()=>{try{return String(room?.id||'');}catch(_){return '';}};
function role(e){return e&&e.hp>0?roleAny(e):null;}
function roleAny(e){if(!e)return null;const id=String(e.nativeId||''),r=roomId();
 if(r==='last303'&&(id==='l303-boss'||(e.boss&&/^불면귀/.test(String(e.name||'')))))return 'boss';
 if(r==='last302'&&/^mb-last302/.test(id))return 'mid';return null;}
function kindOf(p){if(/bulmyeongwi_idle/i.test(p))return 'idle';if(/bulmyeongwi_attack/i.test(p))return 'attack';if(/bulmyeongwi_rain/i.test(p))return 'rain';
 if(/bulmyeongwi_transition/i.test(p))return 'transition';if(/mb-last302-v31231-p[1-4]\./i.test(p))return 'pose';if(/assets\/r760\/boss\//.test(p))return 'done';return null;}
const asked=new Set();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}
 // 엔진은 지역을 옮길 때 그림 캐시를 비울 수 있다 → 준비 안 됐으면 매번 다시 청한다(addImage 는 이미 불러오는 중이면 그 줄을 돌려줌).
 try{if(typeof addImage==='function'){asked.add(p);addImage(p,'R760 불면귀 톤 그림');}}catch(_){}return null;}
function bodyCmd(cmds,st0){let best=null,bh=0;for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.r620Ghost||c.r760Ghost||!Array.isArray(c.points)||c.points.length<4)continue;
  if(FX.test(srcOf(c))&&!/assets\/r760\//.test(srcOf(c)))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}return best;}
// 잔상 흔들림 위상은 적마다 고정(같은 장면을 다시 찍어도 같게 — 홍보 영상 재녹화·검사 재현)
const seedOf=e=>{const t=String(e?.id??e?.nativeId??'');let h=7;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))%9973;return h/9973*6.283;};
const ST=new WeakMap();const stOf=e=>{let s=ST.get(e);if(!s)ST.set(e,s={unit:0,wx:NaN,wy:NaN,vx:0,move:0,lastT:-1,seed:seedOf(e),atkN:0,wasAtk:false,lastA:null,patK:'',patT0:0,patLast:-9});return s;};
// 걷는지(시트 고르기·잔상 꼬리). 그리기 한 번에 한 번, 게임 시간으로.
function track(e,s){const t=T(),dt=s.lastT<0?0:Math.max(0,Math.min(.1,t-s.lastT));s.lastT=t;let sp=0;
 if(Number.isFinite(s.wx)&&dt>0){sp=Math.hypot(e.x-s.wx,e.y-s.wy)/dt;const d=(e.x-s.wx)-(e.y-s.wy);if(Math.abs(d)>1e-4)s.vx=d>0?1:-1;}
 s.wx=e.x;s.wy=e.y;if(dt>0)s.move+=((sp>.18?1:0)-s.move)*Math.min(1,dt*8);}
const Hq=c=>Math.abs(c.points[3][1]-c.points[0][1]);
// 렌더러는 sourceRect 를 imageSize 로 나눠 칸 좌표를 만든다 → 그림을 바꾸면 imageSize 도 새 그림 크기로(안 그러면 옛 크기 기준으로 잘려 늘어남).
function setImg(c,im,path,w,h){c.image=im;c.sourcePath=path;const iw=im.naturalWidth||im.width||w,ih=im.naturalHeight||im.height||h;c.imageSize=[iw,ih];}
function footOf(e,c){try{if(typeof project==='function'){const q=project(e.x,e.y);if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))return [q.x,q.y];}}catch(_){}
 const P=c.points;return [(P[2][0]+P[3][0])/2,(P[2][1]+P[3][1])/2];}
function tileLen(e){try{if(typeof project==='function'){const a=project(e.x,e.y),b=project(e.x+1,e.y+1),d=Math.hypot(b.x-a.x,b.y-a.y);if(d>1e-3&&Number.isFinite(d))return d;}}catch(_){}return 1;}
function facing(e){try{const A=e.attack;if(A&&Number.isFinite(A.angle))return Math.cos(A.angle)-Math.sin(A.angle)>=0?1:-1;const d=(player.x-e.x)-(player.y-e.y);return d>=0?1:-1;}catch(_){return 1;}}
function windupOf(A,e){const w=A?.castWindup150??A?.shape154?.windup??e?.combatProfile?.attackShape?.windup;return Number.isFinite(w)&&w>0?w:.35;}
// 엔진은 휘두르는 동안 e.attack 없이 state 'attack' + 공격 그림만 줄 때가 있다(헤드리스 실측) → 그때는 상태 나이로 자세를 고른다.
function poseFor(e,k){const A=e.attack;if(!A){if(k==='attack'||e.state==='attack'){const a=Number(e.stateAge)||0;return a<.25?1:a<.45?2:3;}return 4;}const w=windupOf(A,e),el=Number(A.elapsed)||0;return el<w?1:el<w+.18?2:3;}
// 동작 단계: 그리기마다 한 번. 공격이 새로 시작되면 번호를 올리고(atkA·atkB 번갈이), 패턴이 새로 시작되면 시각을 잰다. 새로 시작된 동작 이름을 돌려준다(효과음).
// 엔진은 보스가 맞으면 공격 그림을 준다(불면귀 피격 그림 없음, 헤드리스 실측) → 맞은 동안 그 그림만으로는 공격으로 보지 않는다(가짜 공격 칸·소리 방지).
const isAtk=(e,k)=>!!e.attack||e.state==='attack'||(k==='attack'&&!(e.hitTimer>0));
function phase(e,k,s){const t=T();
 if(k==='rain'||k==='transition'){s.wasAtk=false;const key=k==='rain'?'cast':'reveal';let ev=null;if(s.patK!==k||t-s.patLast>.3){s.patK=k;s.patT0=t;ev=key;}s.patLast=t;return ev;}
 const A=e.attack,atk=isAtk(e,k);let ev=null;if(atk&&(!s.wasAtk||(A&&s.lastA&&A!==s.lastA))){s.atkN++;ev=s.atkN%2?'atkA':'atkB';}s.wasAtk=atk;if(A)s.lastA=A;return ev;}
// R762 효과음
const SFX_DIR='assets/r761/sfx/bmg-',CUE={atkA:'r761BossWrap',atkB:'r761BossGaze',cast:'r761BossRain',reveal:'r761BossReveal'},
 SFX={r761BossWrap:['wrap',.7],r761BossGaze:['gaze',.65],r761BossRain:['rain',.6],r761BossReveal:['reveal',.75]},CUE_GAP=1.2;let lastCue=-1e9;
function sfxProfiles(){try{if(typeof soundProfiles==='undefined'||!soundProfiles)return;for(const[kind,[n,g]]of Object.entries(SFX))if(!soundProfiles[kind]?.length)soundProfiles[kind]=[1,2].map(i=>({key:'r761-'+n+'-'+i,path:SFX_DIR+n+'-'+i+'.ogg',gain:g,r541:true}));}catch(err){fail(err);}}
function cue(ev){if(!ev||!prefs.sfx||typeof sound!=='function')return;try{if(typeof modal!=='undefined'&&modal)return;}catch(_){}const t=T();
 if(t-lastCue<CUE_GAP&&t>=lastCue){stats.cueSkipped=(stats.cueSkipped||0)+1;return;}lastCue=t;sfxProfiles();try{sound(CUE[ev]);stats.cues=(stats.cues||0)+1;}catch(err){fail(err);}}
// R761 시트 칸 고르기: [시트, 칸]. 공격은 시작될 때마다 atkA·atkB 를 번갈아(phase 가 정한 번호), 준비 동안 0→3칸(3칸 = 타격), 뒤로 .12초마다 한 칸씩 7칸까지.
function sheetPick(e,k,s){const t=T();
 if(k==='rain'||k==='transition'){const key=k==='rain'?'cast':'reveal',D=SHEET[key];
  let f=Math.floor((t-s.patT0)/D.step);if(D.loop){const[a,b]=D.loop;if(f>b)f=a+(f-a)%(b-a+1);}return [key,Math.min(D.n-1,f)];}
 const A=e.attack,atk=isAtk(e,k);
 // 눈빛 공격은 넷째 묶음 atkB8_r2(예비 동작, 타격 칸 4)가 실렸으면 그것, 아니면 r1(타격 칸 3)
 if(atk){if(s.atkN%2)return ['atkA',atkFrame(e)];const b2=!!img(SPATH('atkB2'));return [b2?'atkB2':'atkB',atkFrame(e,b2?SHEET.atkB2.strike:3)];}
 const p2=e.maxHp>0&&e.hp/e.maxHp<=.5,hk=p2&&img(SPATH('hit2'))?'hit2':'hit',h=flinch(e,s,SHEET[hk]);if(h>=0)return [hk,h];
 if(s.move>.5)return ['move',Math.floor(t*SHEET.move.fps+s.seed)%6];
 // 체력 절반 이하로 서 있으면 실타래가 풀려 흐트러진 2페이즈 대기
 return [p2?'idle2':'idle',Math.floor(t*SHEET.idle.fps+s.seed*3)%6];}
// R764 중간보스: 엔진 4자세(-p1~-p4) 몸을 시트 칸으로. 크기 기준은 엔진 대기 자세(p4)의 보이는 키(400/432)를 칸 길이로 나눈 값.
//  헤드리스 실측: 엔진 안쪽 몸 키는 44~57px 로 흔들리고 덧씌우기가 바깥에서 94.5px 로 키운다 → 바깥(잔상 단계)에서, 최종 몸 크기로 바꾼다.
//  R620 이 4자세끼리 섞으려 얹은 교차 보간 잔상(옛 그림)은 뺀다.
function midSwap(e,cmds,st0){if(!prefs.sheets)return;const c=bodyCmd(cmds,st0);if(!c)return;const p=srcOf(c);if(!/mb-last302-v31231-p[1-4]\./i.test(p))return;
 for(let i=cmds.length-1;i>=st0;i--){const k=cmds[i];if(k!==c&&k?.kind==='image'&&k.r620Ghost&&/mb-last302-v31231-p[1-4]\./i.test(srcOf(k))){cmds.splice(i,1);stats.dropped=(stats.dropped||0)+1;}}
 const s=stOf(e),tl=tileLen(e);if(/-p4\./i.test(p)){const u=Hq(c)*POSE.vis/POSE.h/tl;s.unit=s.unit?s.unit+(u-s.unit)*.2:u;}const unit=(s.unit||Hq(c)*POSE.vis/POSE.h/tl)*tl;track(e,s);
 const A=e.attack,atk=!!A||e.state==='attack';let k='idle',f=Math.floor(T()*MSHEET.idle.fps+s.seed*3)%6;if(atk){k='atk';f=atkFrame(e);}else{const h=flinch(e,s,MSHEET.hit);if(h>=0){k='hit';f=h;}}
 const path=MPATH(k),im=img(path);last={who:'mid',src:p.split('/').pop(),H:+Hq(c).toFixed(1),tl:+tl.toFixed(2),unitPerTile:+(s.unit||0).toFixed(2),sheet:k,frame:f};if(!im){stats.waiting++;return;}
 const kk=unit/MC.vis,sg=facing(e),[fx,fy]=footOf(e,c),x0=fx-sg*MC.px*kk,y0=fy-MC.py*kk,w=MC.cell*kk;
 c.points=[[x0,y0],[x0+sg*w,y0],[x0+sg*w,y0+w],[x0,y0+w]];setImg(c,im,path,MC.cell*MSHEET[k].n,MC.cell);c.sourceRect=[f*MC.cell,0,MC.cell,MC.cell];stats.mid=(stats.mid||0)+1;}
// 피격 움찔: 맞은 순간(hitTimer>0) 시작, 1.5초 안 연타는 다시 움찔하지 않는다(떨림 방지). 움찔 중이면 칸 번호, 아니면 -1.
function flinch(e,s,D){const t=T();if(!(s.hitT0>-1e9))s.hitT0=-1e9;if(e.hitTimer>0&&t-s.hitT0>=FLINCH_GAP)s.hitT0=t;const f=Math.floor((t-s.hitT0)/D.step);return f>=0&&f<D.n?f:-1;}
// 공격 칸: 준비 동안 0→3칸(3칸 = 타격), 뒤로 .12초마다 한 칸씩 7칸까지(보스·중간보스 같은 박자)
function atkFrame(e,S=3){const A=e.attack;let w=.35,el=Number(e.stateAge)||0;if(A){w=windupOf(A,e);el=Number(A.elapsed)||0;}const pr=el<w?el/w*S:S+(el-w)/.12;return Math.max(0,Math.min(7,Math.floor(pr)));}
// ── 안쪽: 그림·크기 ──
function swap(e,cmds,st0){const c=bodyCmd(cmds,st0);if(!c)return;const p=srcOf(c),k=kindOf(p);if(!k||k==='done')return;const s=stOf(e);
 // 기준 키 = 엔진이 대기 그림을 그리는 보이는 몸 키를 '바닥 한 칸 화면 길이'로 나눈 값(카메라가 공격 때 당겨져도 자세마다 크기가 튀지 않게).
 const tl=tileLen(e);if(k==='idle'){const u=Hq(c)*IDLE_VIS/tl;s.unit=s.unit?s.unit+(u-s.unit)*.2:u;}
 const unit=(s.unit||Hq(c)*IDLE_VIS/tl)*tl;last={k,tl:+tl.toFixed(2),H:+Hq(c).toFixed(1),unitPerTile:+(s.unit||0).toFixed(2)};
 track(e,s);cue(phase(e,k,s));
 if(prefs.sheets){const[sk,f]=sheetPick(e,k,s),D=SHEET[sk],path=SPATH(sk),im=img(path);
  if(im){const kk=unit*SCALE/SC.vis,sg=facing(e),[fx,fy]=footOf(e,c),x0=fx-sg*SC.px*kk,y0=fy-SC.py*kk,w=SC.cell*kk;
   c.points=[[x0,y0],[x0+sg*w,y0],[x0+sg*w,y0+w],[x0,y0+w]];setImg(c,im,path,SC.cell*D.n,SC.cell);c.sourceRect=[f*SC.cell,0,SC.cell,SC.cell];
   last={...last,sheet:sk,frame:f};stats.sheets=(stats.sheets||0)+1;return;}}
 if(k==='rain'||k==='transition'){const path=DIR+k+'.webp',im=img(path);if(!im){stats.waiting++;return;}
  const P=c.points,sg=P[1][0]>=P[0][0]?1:-1,iw=Math.abs(P[1][0]-P[0][0])/Math.max(1e-6,Hq(c)),nh=unit/IDLE_VIS*SCALE,nw=nh*iw,[fx,fy]=footOf(e,c);
  const cx=(P[0][0]+P[1][0])/2-((P[2][0]+P[3][0])/2-fx),top=fy-nh*PATTERN[k].foot/384,L=cx-sg*nw/2;
  c.points=[[L,top],[L+sg*nw,top],[L+sg*nw,top+nh],[L,top+nh]];setImg(c,im,path,672,384);c.sourceRect=[0,0,672,384];stats.patterns++;return;}
 const path=DIR+'p'+poseFor(e,k)+'.webp',im=img(path);if(!im){stats.waiting++;return;}
 const kk=unit*SCALE/POSE.vis,sg=facing(e),[fx,fy]=footOf(e,c),x0=fx-sg*POSE.px*kk,y0=fy-POSE.py*kk,w=POSE.w*kk,h=POSE.h*kk;
 c.points=[[x0,y0],[x0+sg*w,y0],[x0+sg*w,y0+h],[x0,y0+h]];setImg(c,im,path,POSE.w,POSE.h);c.sourceRect=[0,0,POSE.w,POSE.h];stats.swapped++;}
// ── 바깥: 겹겹의 잔상 ──
const ALPHA={boss:[.26,.16,.1],mid:[.16]};
function ghosts(e,who,cmds,st0){if(!prefs.ghosts)return;const c=bodyCmd(cmds,st0);if(!c)return;const s=stOf(e),t=T();if(who!=='boss')track(e,s); // 보스는 안쪽에서 이미 잼
 const n=who==='mid'?1:(e.maxHp>0&&e.hp/e.maxHp<=.5?3:2),H=Hq(c);let K=1;const A=e.attack;if(A){const w=windupOf(A,e),el=Number(A.elapsed)||0;if(el<w)K=1+2.2*Math.min(1,el/w);}
 const out=[];for(let i=1;i<=n;i++){const side=i%2?1:-1,amp=H*(.035+.025*i)*K;
  const dx=side*amp*(.8+.2*Math.sin(t*2.4+i*2.3+s.seed))-(s.vx||0)*s.move*H*.05*i,dy=-H*.012*i*(1+Math.cos(t*1.2+i+s.seed))*.5;
  const a=(ALPHA[who][i-1]??.08)*(c.style?.globalAlpha??1);
  out.push({...c,style:{...(c.style||{}),globalAlpha:a},points:c.points.map(q=>Array.isArray(q)?[q[0]+dx,q[1]+dy,...q.slice(2)]:q),key:String(c.key??'enemy')+':r760g'+i,r760Ghost:true,r620Ghost:undefined});}
 const i=cmds.indexOf(c);if(i>=0){cmds.splice(i,0,...out);stats.ghosted++;}
 // 몸이 커져 엔진이 옛 키에 맞춰 둔 이름표가 얼굴을 덮던 것 → 이름표를 몸 맨 위(보이는 윗줄 3%) 위로 올린다.
 if(who==='boss'){const top=Math.min(...c.points.map(q=>q[1]))+H*.03-6;for(let j=st0;j<cmds.length;j++){const k=cmds[j];if(k?.kind==='text'&&k.owner?.kind==='enemy'&&Array.isArray(k.point)&&k.point[1]>top){k.point=[k.point[0],top,...k.point.slice(2)];stats.label=(stats.label||0)+1;}}}}
sfxProfiles();if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);sfxProfiles();return r;};}
const ALL=['p1','p2','p3','p4','rain','transition'];const SALL=Object.keys(SHEET);let visit='';
// 엔진은 지역을 옮길 때 그림 캐시를 비울 수 있다 → 불면귀 지역에 들어와 처음 적이 그려질 때 한 번 미리 청한다(보스 첫 등장에 원본이 비치지 않게).
const PRE=()=>{for(const k of ALL)img(DIR+k+'.webp');if(prefs.sheets){for(const k of SALL)img(SPATH(k));img(SPATH('death'));for(const k of Object.keys(MSHEET))img(MPATH(k));}};
function preload(){const r=roomId();if(r===visit)return;visit=r;if(r==='last303'||r==='last302')PRE();}
function wrap(fn,pre){if(typeof drawEnemy!=='function')return false;const base=drawEnemy;drawEnemy=function(e,...a){
  if(pre&&prefs.on)try{preload();}catch(_){}
  const who=prefs.on?role(e):null;if(!who)return base.call(this,e,...a);
  const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st0=cm?cm.length:-1;const r=base.call(this,e,...a);
  if(cm&&st0>=0)try{fn(e,who,cm,st0);}catch(err){fail(err);}return r;};return true;}
// 마지막으로 그려진 시트 몸 칸 키(칸 길이당) — 죽음 시트를 살아 있을 때와 같은 크기로 그리려고.
//  헤드리스 실측: R205 최소 크기 맞춤(fitMin)이 더 늦게 감싸 몸을 바깥에서 다시 키운다(중간보스 안쪽 49.5px → 화면 125px 칸) → 재는 감싸기는
//  보스·중간보스를 처음 그릴 때 맨 바깥에 한 번 씌운다(그 뒤 누가 또 감싸면 다시, 최대 5번). 원래 함수의 표시(__rNNN)는 옮겨 붙여 이중 감싸기를 막는다.
function measure(e,cm,st0){const c=bodyCmd(cm,st0);if(c&&/assets\/r760\/(boss|mid)\/sheet-/.test(srcOf(c))){const tl=tileLen(e);if(tl>0)stOf(e).cellTile=Hq(c)/tl;}}
let mWraps=0;function ensureMeasure(){if(typeof drawEnemy!=='function'||drawEnemy.__r764m||mWraps>=5)return;const base=drawEnemy;mWraps++;
 const w=function(e,...a){const who=prefs.on?role(e):null;if(!who)return base.call(this,e,...a);const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st0=cm?cm.length:-1;
  const r=base.call(this,e,...a);if(cm&&st0>=0)try{measure(e,cm,st0);}catch(err){fail(err);}return r;};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r764m=true;try{drawEnemy=w;}catch(_){}}
const inner=wrap((e,who,cm,st0)=>{stats.draws++;if(who==='boss')swap(e,cm,st0);try{ensureMeasure();}catch(err){fail(err);}},true);
let outer=false;const installOuter=()=>{if(!outer)outer=wrap((e,who,cm,st0)=>{if(who==='mid')midSwap(e,cm,st0);ghosts(e,who,cm,st0);});};
if(typeof setTimeout==='function')setTimeout(installOuter,0);else installOuter();
// 보스 구역에 들어가기 전에 미리 불러 둔다(첫 등장에 원본이 한 번 비치지 않게).
PRE();
// ── R764 죽음: 엔진 죽음 불꽃(spawnBurnDeath3 → drawBurnDeath3) 대신 보스·중간보스 죽음 시트. 시트가 안 실렸거나 크기 기준이 없으면 엔진 그대로. ──
function deathTag(e){if(!prefs.on||!prefs.sheets)return null;const who=roleAny(e),s=who&&ST.get(e);if(!s||!(s.cellTile>0))return null;const D=DEATH[who];if(!img(D.path()))return null;
 return {who,unit:s.cellTile*D.vis/512,flip:facing(e)<0};}
function wrapDeath(){let ok=true;
 if(typeof spawnBurnDeath3==='function'&&!spawnBurnDeath3.__r764){const base=spawnBurnDeath3;const w=function(e){let tag=null;try{tag=deathTag(e);}catch(err){fail(err);}const r=base.apply(this,arguments);
   try{if(tag&&typeof effects!=='undefined'&&Array.isArray(effects))for(let i=effects.length-1;i>=0;i--){const f=effects[i];if(f?.type==='enemyBurnDeath'&&f.sourceId===e.id&&!f.r764){const D=DEATH[tag.who];f.r764=tag;f.life=Math.max(f.life||0,D.last*D.step+D.fade+.2);stats.deaths=(stats.deaths||0)+1;break;}}}catch(err){fail(err);}return r;};
  for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r764=true;try{spawnBurnDeath3=w;}catch(_){ok=false;}}else if(typeof spawnBurnDeath3!=='function')ok=false;
 if(typeof drawBurnDeath3==='function'&&!drawBurnDeath3.__r764){const base=drawBurnDeath3;const w=function(fx){try{if(fx?.r764&&prefs.on&&typeof drawAssetFrame3==='function'&&drawDying(fx))return;}catch(err){fail(err);}return base.apply(this,arguments);};
  for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r764=true;try{drawBurnDeath3=w;}catch(_){ok=false;}}else if(typeof drawBurnDeath3!=='function')ok=false;
 return ok;}
function drawDying(fx){const R=fx.r764,D=DEATH[R.who],path=D.path(),a=Math.max(0,fx.age||0),life=fx.life||1,f=Math.min(D.last,Math.floor(a/D.step)),q=project(fx.x,fx.y),sx=f*512;
 const fr={path,assetFrame:{sourceRect:[sx,0,512,512],pivot:[256,D.py],visibleHeight:D.vis},sourceAlphaCore:[sx,0,512,512],metricThreshold:16,sourcePixelsEdited:false};
 const tl=tileLen(fx);lastDeath={who:R.who,unit:+R.unit.toFixed(2),tl:+tl.toFixed(2),f,age:+a.toFixed(2)};return drawAssetFrame3(path,fr,q.x,q.y,R.unit*tl,{alpha:Math.max(0,Math.min(1,(life-a)/D.fade)),flip:R.flip});}
let dTries=0;(function armDeath(){let done=false;try{done=wrapDeath();}catch(e){fail(e);}if(!done&&++dTries<80&&typeof setTimeout==='function')setTimeout(armDeath,250);})();
window.__STORYWORLD_BULMYEONGWI_R760__=Object.freeze({rev:REV,inspect:()=>({rev:REV,inner,outer,last,lastDeath,prefs:{...prefs},stats:{...stats},lastError,scale:SCALE}),
 set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();
// R763 불면귀에 잠식된 주민 — 사용자 2026-11-11 "닷츠에게 불면귀쪽 불면귀에 잠식된 사람1,2,3 해서 근거리 원거리 남녀약간 좀비화해서 불면귀파트에 일반몹으로 적용하라고 해
//  기존 불면귀 모든 일반몹 삭제". Dots CX-0070BM 의 7분야 심사 통과 시트(그림 스레드 손질본)로 last302(잠들지 못하는 마을)·last303 의 일반몹을 바꾼다.
//  · 어부(vil1, 남·근거리, 갈고리): l302-e3(가까이 붙는 몹). 대기6·걷기8·공격8·피격4·죽음8 모두 있음.
//  · 약방 아낙(vil2, 여·원거리, 실타래 사발): l302-e1(거리를 두는 몹). 대기6·걷기8·공격8, R770 부터 피격4(16fps)·죽음8(10fps) Dots r1.
//  · last303 은 모두 l302-e1 이라 번호로 어부·아낙을 반씩 나눈다. 소복 처녀(vil3)는 R769 걷기 임시본 → R770 Dots 부유 이동·대기·공격.
//  · '지우기' = 옛 안개 몹 그림·이름을 다 바꾸는 것. 정본 계약(지역마다 3×10 무리, 적 id·능력치·생성 지점 불변)·밸런스·저장은 그대로, 효과 키(r248Key)는 옛 이름.
//    보스·중간보스(mb-last302)·'불면귀의 안개 잔영'(보스 쪽 서사)은 건드리지 않는다.
//  · R770: R462(불타 부서짐·피 터짐) 이 바깥에서 같은 죽음을 가져가 death8 이 화면에 한 번도 안 나왔다(헤드리스 실측) → fx.r462=null 로 넘겨받지 않게(R462 owns 는 그대로라 R91 잔해·R165 연기도 안 겹침).
//  · 죽음: 어부는 death8(무릎 꿇고 엎드려 잠듦)을 R462 불·피 연출 대신 그린다, 아낙은 R770 부터 death8(실 끊기고 사발 쥔 채 엎드려 잠듦), 소복은 대기 그림이 가라앉으며 사라진다. 소리는 그림 스레드의 신음(피격)·실 끊기고 잠드는 숨(죽음).
//  · 엔진 frameFor 사슬(R54)에 R380 과 같은 꼴의 그림을 내준다. 끄기: localStorage['storyworld.r763.villagers']='{"on":false}'(소리만 '{"sfx":false}').
(()=>{'use strict';
if(window.__STORYWORLD_VILLAGERS_R763__)return;
const REV='R763-villagers-1',KEY='storyworld.r763.villagers';
let prefs={on:true,sfx:true,sobok:true,proj:true,melee:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={assigned:0,renamed:0,frames:0,waiting:0,deaths:0,groans:0,sleeps:0,reinstalls:0,shots:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const D='assets/r763/villagers/',CELL=256,PIV=[128,234.67];
// vis = 시트 보이는 키(256칸 기준, 발 줄 234.67 에서 머리끝까지 칸마다 재서 가운데 값).
// 어부 걷기 8번 칸은 1번 칸과 같은 넓은 걸음이라 돌 때마다 멈칫했다(분석 스레드 실측 발 벌림 .57 .44 .21 .33 | .58 .42 .26 .56) → 8번 칸 자리에 4번 칸.
const V={fisher:{name:'잠식된 어부',vis:208,n:{idle:6,walk:8,atk:8,hit:4,death:8},walkOrder:[0,1,2,3,4,5,6,3]},herbwife:{name:'잠식된 약방 아낙',vis:211,n:{idle:6,walk:8,atk:8,hit:4,death:8},hitStep:1/16,deathStep:.1,p:{hit:'assets/r770/villagers/herbwife-hit.webp',death:'assets/r770/villagers/herbwife-death.webp'}},
 // R770 소복 처녀(vil3): 사용자 검수 통과 Dots 부유 이동 float8(걷기 대신 부유, 120ms)과 같은 인물 r1 대기6·공격8. (R769 걷기 임시본 sobok-walk 은 파일만 남김)
 //  부유 그림은 발끝이 바닥 위 y316~332(384칸, 바닥 352)에서 오르내린다 → 바닥에 선 대기·공격도 hover(256칸 기준 평균 17px, ±4, 0.96초 한 바퀴 — R772: 기준점이 칸 밖으로 나가지 않는 만큼)만큼 띄워 움직임과 멈춤 사이에 툭 떨어지지 않게.
 //  R771: 피격 hit4(같은 인물, 떠 있는 채 젖혀졌다 돌아옴, 16fps) — 부유 시트처럼 발끝이 이미 떠 있어 hover 를 더하지 않는다(hoverOn 은 바닥에 선 대기·공격만).
 sobok:{name:'잠식된 소복 처녀',vis:193,n:{idle:6,walk:8,atk:8,hit:4},hitStep:1/16,walkFps:1/.12,hover:[17,4,.96],hoverOn:['idle','atk'],p:{walk:'assets/r770/villagers/sobok-float.webp',idle:'assets/r770/villagers/sobok-idle.webp',atk:'assets/r770/villagers/sobok-atk.webp',hit:'assets/r770/villagers/sobok-hit.webp'}}};
const pathOf=(k,a)=>V[k].p?.[a]||D+k+'-'+a+'.webp';
const PROJ='assets/r769/herbwife-proj6.webp',PCELL=128,PN=6;
const PATHS=[...Object.entries(V).flatMap(([k,v])=>Object.keys(v.n).map(a=>pathOf(k,a))),PROJ];
const ZONES=new Set(['last302','last303']),OLD=/포구 검은 안개|귀비탕 공명 안개핵|유리 망령|주민에게서 떨어진 검은 안개/;
const zoneOf=()=>{try{return String(typeof room==='object'&&room?room.id||'':'');}catch(_){return '';}};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const slot=e=>{const m=/(\d+)$/.exec(String(e.id||''));return m?+m[1]:Math.floor(hash(e.id||e.name)*1000);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rename(e,k){const n=String(e.name||'');if(!OLD.test(n))return;if(!e.r763From)e.r763From=n;if(!e.r248Key)e.r248Key=n.replace(/^중간보스 · /,'').replace(/ \d+$/,'');
 e.name=n.replace(OLD,V[k].name);if(typeof e.r373Name==='string')e.r373Name=e.r373Name.replace(OLD,V[k].name);stats.renamed++;}
// R774(사용자 11-12 06:31Z '어부·소복은 근접 전용으로'): 둥지(last303)는 모두 l302-e1 이고 대부분 ai hybrid 라 어부·소복도 멀리서 시전 → 근접 AI(엔진 index.html 이 ai 를 melee 로 바꿀 때와 같은 방식: ai·선호 거리). 원래 값은 r774Ai·r774Pref.
function melee(e,k){if(!prefs.melee||(k!=='fisher'&&k!=='sobok')||e.ai==='melee')return;if(e.r774Ai===undefined)e.r774Ai=e.ai;e.ai='melee';const P=e.combatProfile;
 if(P&&typeof P==='object'){const r=Number(P.attackShape?.range);if(Number.isFinite(r)&&r>0){if(e.r774Pref===undefined)e.r774Pref=P.preferredRange;e.combatProfile={...P,preferredRange:r*.86};}}stats.melee=(stats.melee||0)+1;}
function kindFor(e,zone){if(!prefs.on||!e||typeof e!=='object'||e.boss||e.hero||e.r170Tower||e.r251Circle)return null;const z=typeof zone==='string'?zone:zoneOf();if(!ZONES.has(z))return null;
 // 아니라고 정한 것은 이름이 그대로일 때만 기억한다(R74 순찰처럼 지역을 만든 뒤 이름이 바뀌는 몹이 있음).
 if(e.r763Zone===z&&(e.r763||e.r763N===e.name)){if(e.r763){if(e.r74Monster){e.r763Atlas=e.r74Monster;delete e.r74Monster;}if(OLD.test(String(e.name||'')))rename(e,e.r763);melee(e,e.r763);}return e.r763||null;}const id=String(e.nativeId||'');let k=null;
 // R769: l302-e3(근거리) 셋에 하나는 소복 처녀, last303 은 번호로 아낙·어부·소복을 차례로(소복을 끄면 그 자리는 어부).
 if((id==='l302-e1'||id==='l302-e3')&&(e.r763From||OLD.test(String(e.name||'')))){const n=slot(e);k=id==='l302-e3'?(n%2===0?'sobok':'fisher'):z==='last303'?['herbwife','fisher','sobok'][n%3]:'herbwife';if(k==='sobok'&&!prefs.sobok)k='fisher';}
 // R773: 순찰·증원이 이미 바뀐 이름(잠식된 …)을 물려받고 옛 이름 흔적이 없으면 위에서 못 잡는다(last303 순찰 6명이 옛 그림) → 이름으로 고름.
 else if(id==='l302-e1'||id==='l302-e3'){const nm=String(e.name||'');k=Object.keys(V).find(q=>nm.includes(V[q].name))||null;if(k==='sobok'&&!prefs.sobok)k='fisher';}
 e.r763=k;e.r763Zone=z;e.r763N=k?undefined:e.name;if(k){
  // R74 순찰(유리 망령)은 지도 괴물 그림 표시(r74Monster)가 있으면 frameFor 사슬을 타지 않고 이름도 그 표로 되돌아간다 → R386 처럼 표시를 떼어 둔다(원래 값은 r763Atlas).
  if(e.r74Monster){e.r763Atlas=e.r74Monster;delete e.r74Monster;}rename(e,k);melee(e,k);stats.assigned++;}return k;}
const ST=new WeakMap();const stOf=e=>{let s=ST.get(e);if(!s)ST.set(e,s={seed:hash(e.id||e.name),hitAt:0});return s;};
function faceLeft(e){try{const r=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);if(typeof r==='boolean')return r;}catch(_){}
 try{const A=e.attack;if(A&&Number.isFinite(A.angle))return Math.cos(A.angle)-Math.sin(A.angle)<0;return (player.x-player.y)<(e.x-e.y);}catch(_){return false;}}
// 칸 고르기. 공격: 준비 동안 0→2(치켜듦), 맞히는 동안 3(내리찍기·던짐), 거둠 4→7.
function cell(e,k){const v=V[k],t=T(),s=stOf(e);
 if(!(e.hp>0))return v.n.death?['death',v.n.death-1]:['idle',0];
 const A=e.attack;if(A&&Number.isFinite(A.elapsed)){const sh=A.shape154||e.combatProfile?.attackShape||{},w=Math.max(.05,A.castWindup150??sh.windup??.45),act=sh.active??.15,rec=Math.max(.05,sh.recovery??.35),el=A.elapsed;
  const f=el<w?Math.floor(el/w*3):el<w+act?3:4+Math.floor((el-w-act)/rec*4);return ['atk',clamp(f,0,7)];}
 if(e.rangedWindup>0)return ['atk',2];
 if(e.hitTimer>0){if(!s.hitAt||t-s.hitAt>.4)s.hitAt=t;return v.n.hit?['hit',Math.min(v.n.hit-1,Math.floor((t-s.hitAt)/(v.hitStep||.035)+1e-9))]:['idle',0];}s.hitAt=0;
 if(e.moving){const i=Math.floor(t*(v.walkFps||10)+s.seed*8)%v.n.walk;return ['walk',v.walkOrder?v.walkOrder[i]:i];}
 return ['idle',Math.floor(t*7+s.seed*6)%v.n.idle];}
// hover(R770 소복): 바닥에 선 그림(부유 시트가 아닌 것)은 발 기준점을 칸 아래로 내려 그만큼 떠 보이게.
function frameOf(k,a,f,flip,seed){const v=V[k],vh=v.vis,sx=f*CELL,hv=v.hover&&(v.hoverOn||[]).includes(a)?v.hover:null;
 // R772: 엔진 그림 검사는 pivot[1] 이 칸 높이(256)를 넘으면 그 그림을 버리고 시트 통째(6칸이 한 줄로)를 그린다(3D 화면, 사용자 신고 '여러 이미지가 한 번에') → 칸 안으로.
 const py=hv?Math.min(CELL,PIV[1]+hv[0]+hv[1]*Math.sin((T()/hv[2]+(seed||0))*Math.PI*2)):PIV[1],pv=hv?[PIV[0],py]:PIV;
 return {path:pathOf(k,a),assetFrame:{sourceRect:[sx,0,CELL,CELL],pivot:pv,visibleHeight:vh},sourceAlphaCore:[sx,0,CELL,CELL],metricThreshold:16,sourcePixelsEdited:false,
  normalizedFullRectangleExtents:[-pv[0]/vh,-pv[1]/vh,(CELL-pv[0])/vh,(CELL-pv[1])/vh],flip,r763:k,r380Mob:'r763-'+k,r208Mob:'r763-'+k};}
const ready=p=>{try{return typeof readyImage==='function'&&readyImage(p)?.image?.naturalWidth>0;}catch(_){return false;}};
let visit='';function preload(){const z=zoneOf();if(z===visit)return;visit=z;if(ZONES.has(z)&&typeof ensureImages==='function')try{Promise.resolve(ensureImages(PATHS)).catch(()=>{});}catch(_){}}
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r763)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r763:true,frameFor(e,f){try{if(prefs.on){preload();const k=kindFor(e);if(k){const[a,i]=cell(e,k),fr=frameOf(k,a,i,faceLeft(e),stOf(e).seed);
   if(ready(fr.path)){stats.frames++;return fr;}stats.waiting++;if(typeof ensureImages==='function')Promise.resolve(ensureImages([fr.path])).catch(()=>{});}}}catch(err){fail(err);}return S.frameFor(e,f);}});
 stats.reinstalls++;return true;}
// 지역을 만들 때 한 번 모두(아직 안 그려진 몹·숨은 증원까지 이름이 한꺼번에 바뀌게). 꿈 층(DREAM)은 사몽 쪽이라 그대로.
function installRoom(){if(typeof makeRoom!=='function')return false;if(makeRoom.__r763)return true;const base=makeRoom;
 const w=function(id,l,...a){const r=base.call(this,id,l,...a);try{if(prefs.on&&r&&ZONES.has(String(id))&&l!=='DREAM'&&Array.isArray(r.enemies))for(const e of r.enemies)kindFor(e,String(id));if(prefs.on&&ZONES.has(String(id))&&typeof ensureImages==='function')Promise.resolve(ensureImages(PATHS)).catch(()=>{});}catch(err){fail(err);}return r;};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r763=true;try{makeRoom=w;}catch(_){return false;}try{window.makeRoom=w;}catch(_){}return true;}
// ── 죽음: 엔진 죽음 불꽃(spawnBurnDeath3 → drawBurnDeath3)을 주민만 '쓰러져 잠듦'으로 ──
const LIFE={fisher:2.4,herbwife:2.4,sobok:1.6},FSTEP=.11;
function wrapDeath(){let ok=true;
 if(typeof spawnBurnDeath3==='function'&&!spawnBurnDeath3.__r763){const base=spawnBurnDeath3;const w=function(e){const k=e&&prefs.on?(e.r763Zone===zoneOf()?e.r763:kindFor(e)):null,r=base.apply(this,arguments);
   try{if(k&&typeof effects!=='undefined'&&Array.isArray(effects)){for(let i=effects.length-1;i>=0;i--){const f=effects[i];if(f?.type==='enemyBurnDeath'&&f.sourceId===e.id&&!f.r763){f.r763={k,flip:faceLeft(e)};if(f.r462===undefined)f.r462=null;f.life=Math.max(f.life||0,LIFE[k]);stats.deaths++;break;}}}}catch(err){fail(err);}return r;};
  w.__r763=true;try{spawnBurnDeath3=w;}catch(_){ok=false;}}else if(typeof spawnBurnDeath3!=='function')ok=false;
 if(typeof drawBurnDeath3==='function'&&!drawBurnDeath3.__r763){const base=drawBurnDeath3;const w=function(fx){try{if(fx?.r763&&prefs.on&&typeof drawAssetFrame3==='function'){drawDying(fx);return;}}catch(err){fail(err);}return base.apply(this,arguments);};
  w.__r763=true;try{drawBurnDeath3=w;}catch(_){ok=false;}}else if(typeof drawBurnDeath3!=='function')ok=false;
 return ok;}
function drawDying(fx){const R=fx.r763,v=V[R.k],q=project(fx.x,fx.y),h=Number.isFinite(fx.bodyHeight)?fx.bodyHeight:60,a=Math.max(0,fx.age||0),life=fx.life||1;
 const end=clamp((life-a)/.7,0,1);
 if(v.n.death){const f=Math.min(v.n.death-1,Math.floor(a/(v.deathStep||FSTEP)+1e-9)),fr=frameOf(R.k,'death',f,R.flip);if(ready(fr.path)){drawAssetFrame3(fr.path,fr,q.x,q.y,h,{alpha:end,flip:R.flip});return;}
  if(typeof ensureImages==='function')try{Promise.resolve(ensureImages([fr.path])).catch(()=>{});}catch(_){}}
 // 죽음 시트가 없는 몹(R770 부터 소복)·죽음 시트가 아직 안 실린 몹(R770 아낙 첫 죽음에 빈 자리가 되던 것): 대기 첫 칸이 무릎 높이까지 가라앉으며 사라진다.
 const u=clamp(a/life,0,1),fr=frameOf(R.k,v.n.idle?'idle':'walk',0,R.flip);if(!ready(fr.path))return;drawAssetFrame3(fr.path,fr,q.x,q.y+h*.12*u,h*(1-.18*u),{alpha:Math.pow(1-u,.9),flip:R.flip});}
// ── 소리: 피격 신음·죽음 잠드는 숨(그림 스레드가 만든 assets/r761/sfx) ──
const VS={r761VillagerGroan:['groan',.55],r761VillagerSleep:['sleep',.65]},GROAN_GAP=1.5;let hitNow=null,dyingNow=null,lastGroan=-1e9;
function sfxProfiles(){try{if(typeof soundProfiles==='undefined'||!soundProfiles)return;for(const[kind,[n,g]]of Object.entries(VS))if(!soundProfiles[kind]?.length)soundProfiles[kind]=[1,2].map(i=>({key:'r761-'+n+'-'+i,path:'assets/r761/sfx/bmg-'+n+'-'+i+'.ogg',gain:g,r541:true}));}catch(err){fail(err);}}
function wrapSound(){if(typeof sound!=='function')return false;if(sound.__r763)return true;const base=sound;
 const w=function(kind,...a){let k=kind;try{if(prefs.on&&prefs.sfx){
   if(kind==='r541Death'&&dyingNow){sfxProfiles();k='r761VillagerSleep';stats.sleeps++;}
   else if(kind==='enemyHit'&&hitNow){const t=T();if(t-lastGroan>=GROAN_GAP||t<lastGroan){sfxProfiles();lastGroan=t;k='r761VillagerGroan';stats.groans++;}}}}catch(err){fail(err);k=kind;}
  return base.call(this,k,...a);};w.__r763=true;try{sound=w;}catch(_){return false;}return true;}
function wrapHits(){let ok=true;const vil=e=>{try{return !!(e&&prefs.on&&(e.r763Zone===zoneOf()?e.r763:kindFor(e)));}catch(_){return false;}};
 if(typeof hitEnemy==='function'&&!hitEnemy.__r763){const base=hitEnemy;const w=function(e){const prev=hitNow;hitNow=vil(e)?e:null;try{return base.apply(this,arguments);}finally{hitNow=prev;}};w.__r763=true;try{hitEnemy=w;}catch(_){ok=false;}}
 if(typeof killEnemy==='function'&&!killEnemy.__r763){const base=killEnemy;const w=function(e){const prev=dyingNow;dyingNow=vil(e)?e:null;try{return base.apply(this,arguments);}finally{dyingNow=prev;}};w.__r763=true;try{killEnemy=w;}catch(_){ok=false;}}
 return ok&&typeof hitEnemy==='function'&&typeof killEnemy==='function';}
sfxProfiles();if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);sfxProfiles();return r;};}
// ── R769 약방 아낙 투사체: 엔진 적 투사체(enemyShot → drawProjectile)를 proj6 r4 시트(실타래 공, 오른쪽으로 날아가는 그림)로. 크기는 엔진 투사체 크기의 1.7배(칸의 공은 반쯤). ──
function shooter(b){try{if(!b||b.friendly||!b.owner||!Array.isArray(room?.enemies))return null;for(const e of room.enemies)if(e&&e.id===b.owner)return e;}catch(_){}return null;}
function drawShot(b){const e=shooter(b);if(!e)return false;const z=zoneOf();if(!ZONES.has(z)||(e.r763Zone===z?e.r763:kindFor(e,z))!=='herbwife')return false;
 const im=(typeof readyImage==='function'&&readyImage(PROJ)?.image)||null;if(!im){if(typeof ensureImages==='function')try{Promise.resolve(ensureImages([PROJ])).catch(()=>{});}catch(_){}return false;}
 const zz=typeof zoom==='number'&&zoom>0?zoom:1,q=project(b.x,b.y),pr=project(b.x-(b.vx||0)*.06,b.y-(b.vy||0)*.06),ang=Math.atan2(q.y-pr.y,q.x-pr.x);
 const mx=(typeof W==='number'&&typeof H==='number')?Math.min(W,H)*.2/Math.SQRT2:120,sz=Math.min(mx,24*(b.scale||1)*zz)*1.7,f=Math.floor((b.age||0)*12+hash(b.id||'')*PN)%PN;
 ctx.save();try{ctx.translate(q.x,q.y-18*zz);ctx.rotate(ang);ctx.drawImage(im,f*PCELL,0,PCELL,PCELL,-sz/2,-sz/2,sz,sz);}finally{ctx.restore();}stats.shots++;return true;}
function wrapShots(){if(typeof drawProjectile!=='function')return false;if(drawProjectile.__r769)return true;const base=drawProjectile;
 const w=function(b){try{if(prefs.on&&prefs.proj&&drawShot(b))return;}catch(err){fail(err);}return base.apply(this,arguments);};w.__r769=true;try{drawProjectile=w;}catch(_){return false;}return true;}
// 다른 오버레이(R191 시대 순찰 등)가 지역에 들어온 뒤 이름을 다시 붙여도 0.7초 안에 다시 맞춘다(화면에 안 그려진 몹의 이름표·목록까지).
if(typeof setInterval==='function')setInterval(()=>{try{const z=zoneOf();if(prefs.on&&ZONES.has(z)&&Array.isArray(room?.enemies))for(const e of room.enemies)kindFor(e,z);}catch(err){fail(err);}},700);
// 다른 덧씌우기(R380·R188·R462·R541)가 먼저 감싼 뒤 바깥에서 감싸도록 늦게, 될 때까지 몇 번.
let tries=0;(function arm(){let done=false;try{done=[install(),installRoom(),wrapDeath(),wrapSound(),wrapHits(),wrapShots()].every(Boolean);}catch(e){fail(e);}if(!done&&++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
if(typeof setTimeout==='function')setTimeout(()=>{try{install();installRoom();wrapDeath();wrapSound();wrapHits();wrapShots();}catch(e){fail(e);}},0);
window.__STORYWORLD_VILLAGERS_R763__=Object.freeze({rev:REV,kindFor,cell,frameOf,villagers:V,inspect:()=>({rev:REV,prefs:{...prefs},stats:{...stats},lastError}),
 set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();

// ─────────────────────────────────────────────────────────────────────────────
// R768 불면귀 일반몹 예고 띠 끄기 — 사용자 2026-11-11 "불면귀 일반몹들이 예고공격 자동으로 나오는거 이거 끌 수 있도록".
//  · 헤드리스 실측(last302): 잠식된 약방 아낙 원거리 준비 동안 R58 이 drawEnemy 안에서 strokeFootprint154(길이 7.4칸 capsule,
//    'warning', '#c6b59b') 조준 띠를 그린다(3게임초 102번). R425 '적 공격·돌진 예고 표시'(기본 꺼짐)는 색 표로 거르므로 이 선을 못 지웠다.
//  · 불면귀 지역(last302·last303)의 보스·중간보스가 아닌 몹을 그리는 동안만, 'warning' 단계 띠를 R425 설정(혼자 할 때)에 따라 건너뛴다.
//    설정에서 켜면 다시 보인다. 타격 순간(active)·회수·바닥 위험(drawEnemy 밖)·보스 예고·다른 지역은 그대로. 공격 자체(판정·시간)는 안 바꾼다.
(()=>{'use strict';
const REV='R768-tele-1',ZONES=new Set(['last302','last303']);let cur=null,wrapped=false,lastError=null;const stats={hidden:0};
const roomId=()=>{try{return String(room?.id||'');}catch(_){return '';}};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const teleOff=()=>{try{const f=window.__STORYWORLD_COMBAT_FLOW_R425__;return !!f&&f.inspect().prefs.tele===false;}catch(_){return false;}};
const normal=e=>!!e&&!e.boss&&!e.midboss&&ZONES.has(roomId());
function wrap(){if(wrapped)return true;try{if(typeof strokeFootprint154!=='function'||typeof drawEnemy!=='function')return false;
 const sf=strokeFootprint154;strokeFootprint154=function(g,stage,...a){try{if(stage==='warning'&&cur&&teleOff()&&solo()){stats.hidden++;return false;}}catch(err){lastError=String(err);}return sf.call(this,g,stage,...a);};
 const de=drawEnemy;drawEnemy=function(e,...a){const prior=cur;cur=normal(e)?e:null;try{return de.call(this,e,...a);}finally{cur=prior;}};
 wrapped=true;return true;}catch(err){lastError=String(err);return false;}}
if(!wrap())setTimeout(wrap,0);
window.__STORYWORLD_TELE_R768__=Object.freeze({rev:REV,inspect:()=>({rev:REV,wrapped,stats:{...stats},teleOff:teleOff(),lastError})});
})();
