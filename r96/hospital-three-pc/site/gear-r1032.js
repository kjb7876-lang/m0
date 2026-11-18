/* R1032 고유 장비 3종 · 꿈의 조각 강화 · K 패시브 창 · I 장비/기억 조각 창 · B 영웅 배치
   사용자 2026-11-14 10:59Z "k를 누르면 패시브 스킬창목록이 i를 누르면 고유장비템과 기억조각목록 … j의인장(원형 안 황금 십자가 + 오른쪽 아래 작은 J 이니셜),
     피리부는 고블린 서사에 나오는 습득아이템, 각자 고유무기(환도 영웅은 환도) … 인장 강화 = 흡혈·방어·EGO 지속 / 장미 = 치명 확률·치명 피해
     (치명 시 모든 공격·스킬 한 번 더, 그 피해는 치명 피해에 비례) / 고유무기 = 쿨 감소·모든 피해 증가".
   11:01Z "3고유장비 모두 강화 … 몹과 보스몹 그리고 서사플레이퀘스트로 난이도 비례해서 꿈의조각 … 제곱수 비례해서 강화".
   11:08Z 카드: I 는 어디서나 장비 창(무한생존 영웅 배치는 단추로) / 꿈의 조각은 '사몽 층에 들어간 뒤부터만'(사몽·사몽역행 층·무한생존).
   11:09Z: 영웅 배치는 B 키로도.
   · 정본(hapil-canon-r106-improved) 근거: J의 인장 = ep1a11 "손바닥에는 선을 향한 J의 인장이 떠올랐고", 장미 인장 = last305 "피리로 늑대를 조종하는 고블린 두목 … 그가 남긴 장미 인장".
     무한생존은 서사와 무관하게 생존 레벨 2·4 에 얻는다(R1025 와 같은 방식). 고유무기는 처음부터 든다.
   · 무기 이름: 환도(정본), 기억사수 '기억탄 소총'(정본 "내 소총의 기억탄"), 라우렌 '쌍둥이 기사창'(정본 창기사·창술사). 정본에 이름이 없는 헌터·슬레이어·네온·
     미카엘라·서하는 게임 영웅 자료(자원·특수기)에서 이름을 땄고 모양은 실제 영웅 그림이 든 무기다(창 안 그림도 그 영웅 그림을 잘라 보인다).
   · 강화: 세 장비 모두 0~7단계, n단계 비용 = 10 × n² 꿈의 조각. 무기 단계는 영웅마다 따로.
   · 치명 재발동: 치명이 난 타격마다 0.12초 뒤 같은 대상에 한 번 더(치명 피해 × 0.35). 재발동은 다시 치명·재발동을 부르지 않고, 대기 줄·초당 수에 상한(렉 방지).
   · 장비 효과는 조종 영웅에게만(배치·소환 몸 r720Ally 등에는 안 붙음). 피해 값은 유한·양수만 엔진에 넘긴다.
   끄기: localStorage storyworld.r1032.off = '1'. */
(()=>{'use strict';
const REV='R1032',KEY='storyworld.r1032.gear',MAX=7,BASE=10,ECHO_MAX=24,ECHO_DELAY=.12,ECHO_RATIO=.35,LS_CAP=.04;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
let off=false;try{off=localStorage.getItem('storyworld.r1032.off')==='1';}catch(_){}
const stats={kills:0,frags:0,quests:0,crits:0,echoes:0,echoDropped:0,heal:0,saves:0,opens:{i:0,k:0},errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const HERO_IDS=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
const N='assets/heroes/normalized/';
// 무기: 이름 · 모양 · 근거 · 그림(그 영웅 정면 그림에서 무기 부분 자르기, 512 기준 [x,y,w,h])
const WEAPONS=Object.freeze({
 hwando:{name:'환도',shape:'휜 외날 칼',from:'정본 — 주인공이 쥔 칼의 이름',img:N+'actions-consistent/hwando-guard-front.webp',box:[230,150,170,170]},
 seoha:{name:'최초명령 시계반',shape:'손에 띄운 푸른 시계 원반',from:'정본 윤서하의 세계(최초명령의 세계·카이로노미콘) + 그림',img:N+'directions/seoha-front.webp',box:[255,175,90,90]},
 neon:{name:'과충전 회로창',shape:'초록 회로가 흐르는 창',from:'게임 영웅 자료(자원 과충전·특수기 회로 폭주) — 정본에 이름 없음',img:N+'directions/neon-front.webp',box:[150,190,240,240]},
 michaela:{name:'성흔 십자 처방봉',shape:'똑바른 십자가 새겨진 처방봉 한 쌍',from:'정본 미카엘라(정신과 의사) + 게임 자원 성흔',img:N+'directions/michaela-front.webp',box:[165,135,190,140]},
 lauren:{name:'쌍둥이 기사창',shape:'보랏빛 긴 창',from:'정본 "창기사·창술사 형상 … 라우렌 쌍둥이 기사"',img:N+'directions/lauren-front.webp',box:[176,48,90,190]},
 hunter:{name:'표적 추적 장궁',shape:'붉은 장궁',from:'게임 영웅 자료(자원 표적·특수기 추적 일제사격) — 정본에 이름 없음',img:N+'directions/hunter-front.webp',box:[260,250,110,130]},
 slayer:{name:'처형 대검',shape:'붉은 날의 대검',from:'게임 영웅 자료(자원 처형 의지·특수기 종결 강타) — 정본에 이름 없음',img:N+'actions-consistent/slayer-guard-front.webp',box:[95,250,190,230]},
 gunner:{name:'기억탄 소총',shape:'청록 기억탄을 쏘는 소총',from:'정본 "내 소총의 기억탄은 청록색이었다"',img:'assets/hero_direction337/gunner/s.webp',box:[200,170,140,320]}});
const ITEMS=Object.freeze({
 seal:{name:'J의 인장',story:'ep1a11',storyName:'천사의 가면과 의목사 후보생',svLv:2,from:'정본 ep1a11 "손바닥에는 선을 향한 J의 인장이 떠올랐고"'},
 rose:{name:'장미 인장',story:'last305',storyName:'고블린 두목과 장미 인장',svLv:4,from:'정본 last305 "피리로 늑대를 조종하는 고블린 두목 … 그가 남긴 장미 인장"'},
 weapon:{name:'고유무기'}});
// ── 순수 규칙 ──
const lvOf=v=>{v=Math.floor(+v);return Number.isFinite(v)?Math.max(0,Math.min(MAX,v)):0;};
function cost(n){n=+n;if(!Number.isInteger(n)||n<1||n>MAX)return Infinity;return BASE*n*n;}
function effects(l){const s=lvOf(l?.seal),r=lvOf(l?.rose),w=lvOf(l?.weapon);
 return {lifesteal:.005+.01*s,defense:.02+.03*s,ego:.05+.07*s,critChance:.05+.03*r,critMult:1.5+.1*r,echo:ECHO_RATIO,damage:.07*w,cdr:.03*w};}
const KIND=Object.freeze({mob:1,elite:3,mid:8,boss:30,quest:15}),DIFF=Object.freeze({easy:.75,normal:1,hard:1.5,combat:1.5});
function gain(c){if(!c)return 0;const sv=c.survival===true;if(!sv&&c.layer!=='DREAM')return 0;/* 11:08Z: 사몽 층·무한생존만 */
 const b=KIND[c.kind]||0,d=Object.prototype.hasOwnProperty.call(DIFF,c.diff)?DIFF[c.diff]:1,i=Number.isFinite(+c.index)?Math.max(0,+c.index):0;
 const v=b*d*Math.min(3,1+i/20)*(sv?1.25:1);return Number.isFinite(v)?Math.max(0,v):0;}
function owned(item,c){if(item==='weapon')return true;const it=ITEMS[item];if(!it||!c)return false;
 if(c.mode==='survival')return (+c.lv||0)>=it.svLv;return Array.isArray(c.done)&&c.done.includes(it.story);}
function sealSvg(){/* 원 안 황금 십자(똑바로) + 오른쪽 아래 작은 J — 밀랍·금속 인장 느낌 */
 return '<svg class="r1032seal" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="r1032sg" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#5a3a2a"/><stop offset="1" stop-color="#24140f"/></radialGradient>'
 +'<linearGradient id="r1032gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3a0"/><stop offset=".55" stop-color="#e2ad48"/><stop offset="1" stop-color="#9c6a1e"/></linearGradient></defs>'
 +'<circle cx="50" cy="50" r="46" fill="url(#r1032sg)" stroke="#c9963c" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="none" stroke="#8a6327" stroke-width="1.5" stroke-dasharray="2 3"/>'
 +'<rect data-cross="v" x="45" y="20" width="10" height="58" rx="1" fill="url(#r1032gold)" stroke="#6b4512" stroke-width="1"/>'
 +'<rect data-cross="h" x="29" y="37" width="42" height="10" rx="1" fill="url(#r1032gold)" stroke="#6b4512" stroke-width="1"/>'
 +'<text x="64" y="80" font-size="19" font-family="Georgia,serif" font-style="italic" font-weight="700" fill="#ffe3a0" stroke="#3a2008" stroke-width=".8">J</text></svg>';}
function roseSvg(){/* 장미 인장 — 원 안 다섯 꽃잎 장미 문양 */
 let p='';for(let i=0;i<5;i++){const a=i*72-90,x=50+Math.cos(a*Math.PI/180)*13,y=50+Math.sin(a*Math.PI/180)*13;p+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="11" fill="#9e1b34" stroke="#e6b45a" stroke-width="1.4"/>';}
 return '<svg class="r1032rose" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#2a1216" stroke="#c9963c" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="none" stroke="#7a2232" stroke-width="1.5"/>'
 +p+'<circle cx="50" cy="50" r="8" fill="#c22a46" stroke="#f0c46a" stroke-width="1.4"/><path d="M46 49 a4 4 0 1 1 6 3 a2.4 2.4 0 1 1 -3 -2.4" fill="none" stroke="#f0c46a" stroke-width="1.3"/></svg>';}
const pure=Object.freeze({MAX,BASE,ECHO_MAX,ECHO_DELAY,LS_CAP,cost,effects,gain,owned,sealSvg,roseSvg,WEAPONS,ITEMS,KIND,DIFF});
// ── 상태(저장) ──
function blank(){return {frags:0,seal:0,rose:0,weapon:Object.fromEntries(HERO_IDS.map(h=>[h,0])),cleared:[]};}
function clean(o){const s=blank();if(!o||typeof o!=='object')return s;const f=+o.frags;s.frags=Number.isFinite(f)&&f>0?Math.min(1e9,f):0;s.seal=lvOf(o.seal);s.rose=lvOf(o.rose);
 for(const h of HERO_IDS)s.weapon[h]=lvOf(o.weapon?.[h]);if(Array.isArray(o.cleared))s.cleared=o.cleared.filter(x=>typeof x==='string').slice(-400);return s;}
let st=blank();try{st=clean(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){st=blank();}
let dirty=false,saveAt=0;
function save(){try{localStorage.setItem(KEY,JSON.stringify(st));stats.saves++;dirty=false;}catch(e){fail(e);}}
// ── 게임 읽기 ──
const SV=()=>window.__STORYWORLD_SURVIVAL_R600__;
const survival=()=>G(()=>!!SV()?.here?.(),false);
const P=()=>G(()=>player,null);
const isBody=p=>!!(p&&(p.r720Ally||p.r952Ally||p.bodyOf||p.r949Ally));
const heroId=()=>{const h=G(()=>player.hero,'hwando');return HERO_IDS.includes(h)?h:'hwando';};
const T=()=>{const t=G(()=>time,0);return Number.isFinite(t)?t:0;};
function ctx(){if(survival())return {mode:'survival',lv:G(()=>SV().state().lv,1)};return {mode:'story',done:['ep1a11','last305'].filter(z=>G(()=>completed(z,'STORY'),false)===true)};}
const has=item=>!off&&owned(item,ctx());
function levelsNow(){return {seal:has('seal')?st.seal:0,rose:has('rose')?st.rose:0,weapon:st.weapon[heroId()]||0};}
const cur=()=>effects(levelsNow());
const active=()=>{const p=P();return !off&&!!p&&!isBody(p);};
// ── 꿈의 조각 ──
function give(v,why){if(!(v>0)||!Number.isFinite(v))return 0;st.frags=Math.min(1e9,st.frags+v);stats.frags+=v;dirty=true;return v;}
function killCtx(e){if(survival()){const s=G(()=>SV().state(),{})||{};const big=!!e.boss||!!(e.r600Boss&&G(()=>room.survivalR600.roster.boss,null));
  return {survival:true,diff:s.diff,index:(+s.i||0)+10*(+s.loop||0),kind:big?'boss':e.r600Boss?'mid':(e.r600Elite||e.elite)?'elite':'mob'};}
 return {layer:G(()=>layer,''),diff:G(()=>room.difficultyR63,'normal'),index:G(()=>regionById[zone].index,0),kind:e.boss?'boss':(e.elite||e.miniBoss)?'elite':'mob'};}
let clearKey=null,egoArmed=false;
function questTick(){
 if(survival()){const s=G(()=>SV().state(),null);if(s&&s.phase==='clear'){const k=(s.loop||0)+':'+s.i;if(clearKey!==k){clearKey=k;give(gain({survival:true,kind:'quest',diff:s.diff,index:(+s.i||0)+10*(+s.loop||0)}));stats.quests++;}}return;}
 if(G(()=>layer,'')!=='DREAM')return;const z=G(()=>zone,null);if(!z)return;const k='DREAM:'+z;
 if(G(()=>completed(z,'DREAM'),false)===true&&!st.cleared.includes(k)){st.cleared.push(k);if(st.cleared.length>400)st.cleared.shift();give(gain({layer:'DREAM',kind:'quest',diff:G(()=>room.difficultyR63,'normal'),index:G(()=>regionById[z].index,0)}));stats.quests++;dirty=true;}}
// ── 강화 ──
function upgrade(item,hero){try{if(off)return {ok:false,why:'off'};if(!ITEMS[item])return {ok:false,why:'item'};if(!has(item))return {ok:false,why:'locked'};
 const h=HERO_IDS.includes(hero)?hero:heroId(),now=item==='weapon'?st.weapon[h]:st[item],c=cost(now+1);if(!Number.isFinite(c))return {ok:false,why:'max'};if(st.frags+1e-9<c)return {ok:false,why:'frags',need:c};
 st.frags-=c;if(item==='weapon')st.weapon[h]=now+1;else st[item]=now+1;save();return {ok:true,item,hero:item==='weapon'?h:null,level:now+1,cost:c};}catch(e){fail(e);return {ok:false,why:'error'};}}
// ── 치명 재발동 ──
let rnd=Math.random,echoing=false,echoBudget=ECHO_MAX,lsBudget=null,critTextAt=-9;const queue=[];
function lsCap(){const m=G(()=>maxHP(),0);return Number.isFinite(m)&&m>0?m*LS_CAP:0;}
function onHit(base,self,e,value,rest){
 if(echoing||!active())return base.apply(self,[e,value,...rest]);
 if(typeof value==='number'&&!Number.isFinite(value))return false;if(!(value>0))return base.apply(self,[e,value,...rest]);
 const ef=cur();let v=value*(1+ef.damage),crit=false;if(has('rose')&&rnd()<ef.critChance){crit=true;v*=ef.critMult;}
 if(!Number.isFinite(v)||v<=0)return base.apply(self,[e,value,...rest]);
 const hp0=+e?.hp,r=base.apply(self,[e,v,...rest]);
 if(r){try{if(crit){stats.crits++;const t=T();if(e&&e.hp>0){if(queue.length<ECHO_MAX)queue.push({e,v:v*ef.echo,at:t+ECHO_DELAY});else stats.echoDropped++;}
    if(t-critTextAt>.3&&typeof floatText==='function'&&e){critTextAt=t;floatText('치명 '+Math.round(v),e.x,e.y,'#ffd36a');}}
  if(has('seal')){const p=P(),dealt=Number.isFinite(hp0)?Math.max(0,hp0-Math.max(0,+e.hp||0)):v;if(lsBudget==null)lsBudget=lsCap();
   const heal=Math.min(dealt*ef.lifesteal,lsBudget),m=G(()=>maxHP(),0);if(p&&p.hp>0&&heal>0&&Number.isFinite(heal)&&m>0){const h2=Math.min(m,p.hp+heal);lsBudget-=Math.max(0,h2-p.hp);stats.heal+=Math.max(0,h2-p.hp);p.hp=h2;}}}catch(err){fail(err);}}
 return r;}
function echoTick(dt){echoBudget=Math.min(ECHO_MAX,echoBudget+ECHO_MAX*dt);if(lsBudget!=null)lsBudget=Math.min(lsCap(),lsBudget+lsCap()*dt);if(!queue.length)return;const t=T();
 for(let i=0;i<queue.length;){const q=queue[i];if(q.at>t){i++;continue;}queue.splice(i,1);if(!q.e||!(q.e.hp>0)||!(q.v>0)||!Number.isFinite(q.v))continue;
  if(echoBudget<1){stats.echoDropped++;continue;}echoBudget-=1;echoing=true;try{if(hitEnemy(q.e,q.v))stats.echoes++;}catch(e){fail(e);}finally{echoing=false;}}}
function cdTick(dt){const ef=cur();if(!(ef.cdr>0)||!active())return;const k=dt*ef.cdr/(1-ef.cdr);if(!(k>0)||!Number.isFinite(k))return;const p=P();
 for(const f of ['specialCD','egoCD']){const v=+p[f];if(v>0)p[f]=Math.max(0,v-k);}
 const rd=p.storyWER?.ready,t=T();if(rd)for(const key of Object.keys(rd)){if(!key.startsWith(p.hero+':'))continue;const v=+rd[key];if(v>t)rd[key]=Math.max(t,v-k);}}
// ── 창 ──
let mine=null;
const pct=v=>(Math.round(v*1000)/10)+'%';
function effText(item,l){const e=effects(item==='seal'?{seal:l}:item==='rose'?{rose:l}:{weapon:l});
 if(item==='seal')return '흡혈 '+pct(e.lifesteal)+' · 받는 피해 −'+pct(e.defense)+' · EGO 지속 +'+pct(e.ego);
 if(item==='rose')return '치명 확률 '+pct(e.critChance)+' · 치명 피해 ×'+e.critMult.toFixed(1)+' · 치명 시 한 번 더(치명 피해의 '+pct(e.echo)+')';
 return '모든 피해 +'+pct(e.damage)+' · 스킬 쿨 −'+pct(e.cdr);}
function card(item){const h=heroId(),W=WEAPONS[h],own=has(item),lv=item==='weapon'?st.weapon[h]:st[item],c=cost(lv+1),it=ITEMS[item];
 const icon=item==='seal'?sealSvg():item==='rose'?roseSvg():'<canvas class="r1032w" width="72" height="72" data-r1032w="'+h+'" aria-label="'+esc(W.shape)+'"></canvas>';
 const name=item==='weapon'?W.name+' <small>('+esc(G(()=>HEROES[h].name,h))+' 고유무기)</small>':esc(it.name);
 const how=item==='weapon'?esc(W.shape)+' · '+esc(W.from):own?esc(it.from):'아직 없음 — 스토리 「'+esc(it.storyName)+'」에서 얻음 · 무한생존은 생존 레벨 '+it.svLv;
 const can=own&&Number.isFinite(c)&&st.frags+1e-9>=c;
 return '<div class="r1032card'+(own?'':' locked')+'"><div class="ic">'+icon+'</div><div class="tx"><b>'+name+'</b> <span class="lv">'+lv+' / '+MAX+'단계</span><div class="small">'+how+'</div>'
  +'<div class="eff">지금: '+(own?effText(item,lv):'효과 없음')+'</div>'+(Number.isFinite(c)?'<div class="eff nx">다음: '+effText(item,lv+1)+'</div>':'<div class="eff nx">최대 단계</div>')
  +'<button type="button" data-r1032up="'+item+'"'+(can?'':' disabled')+'>'+(Number.isFinite(c)?'강화 · 꿈의 조각 '+c:'최대')+'</button></div></div>';}
function bookHtml(){const b=G(()=>window.__STORYWORLD_PLAY_R169__.book(),[])||[];const groups=new Map();for(const n of b.slice(-120)){const k=n.place||'기억';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(n);}
 let h='<h3>기억 조각 · 쪽지 모음 '+b.length+'장</h3>';if(!b.length)h+='<p class="small muted">아직 모은 기억 조각이 없습니다.</p>';
 h+='<div class="r1032book">';for(const [k,L] of groups)h+='<div><b>'+esc(k)+'</b> <span class="small">'+L.map(n=>esc(n.title)).join(' · ')+'</span></div>';
 return h+'</div><button type="button" id="r1032Book">쪽지 모음 펼치기(글 읽기)</button>';}
function gearHtml(){return '<button id="r1032Close" class="close">닫기</button><div class="eyebrow">고유 장비 · I</div><h2>고유 장비와 기억 조각</h2>'
 +'<p class="small">꿈의 조각 <b>'+Math.floor(st.frags)+'</b> · 사몽·사몽역행 층과 무한생존에서 몹·보스·지역 완료로 얻습니다(난이도·뒤 지역일수록 많이). n단계 강화 비용 = '+BASE+' × n²</p>'
 +(survival()?'<button type="button" id="r1032Place">영웅 배치 열기 (B)</button>':'')
 +'<div class="r1032cards">'+card('seal')+card('rose')+card('weapon')+'</div>'+bookHtml();}
function passiveHtml(){const h=heroId(),H=G(()=>HEROES[h],{})||{},U=window.__STORYWORLD_PASSIVE_UNLOCK_R1025__,names=G(()=>U.names(),{})||{},rows=G(()=>U.table()[h],[])||[],rank=G(()=>window.__STORYWORLD_PASSIVE_GROWTH_R971__.rank(),0);
 let s='<button id="r1032Close" class="close">닫기</button><div class="eyebrow">패시브 · K</div><h2>'+esc(H.name||h)+' 패시브 스킬</h2><ul class="r1032pl">';
 s+='<li><b>영웅 패시브</b> <span>'+esc(H.passive||'—')+'</span> <em>항상</em></li>';
 rows.forEach((r,i)=>{s+='<li class="'+(r.open?'':'locked')+'"><b>특수 패시브 '+(i+1)+'</b> <span>'+esc((r.kinds||[]).map(k=>names[k]||k).join(' · '))+'</span> <em>'+(r.open?'열림':'레벨 '+esc(r.at)+'에 열림')+'</em></li>';});
 s+='<li><b>특수 패시브 강화</b> <span>확률·대기 강화 '+(+rank||0)+' / 7</span> <em>P 창</em></li>';
 const own=x=>has(x);s+='<li class="'+(own('seal')?'':'locked')+'"><b>J의 인장</b> <span>'+(own('seal')?effText('seal',st.seal):'아직 없음')+'</span> <em>I 창</em></li>';
 s+='<li class="'+(own('rose')?'':'locked')+'"><b>장미 인장</b> <span>'+(own('rose')?effText('rose',st.rose):'아직 없음')+'</span> <em>I 창</em></li>';
 s+='<li><b>'+esc(WEAPONS[h].name)+'</b> <span>'+effText('weapon',st.weapon[h])+'</span> <em>I 창</em></li></ul>';
 const up=G(()=>{const U2=UPGRADES,have=player.upgrades||{};return U2.map(u=>({n:u.name,l:+(have[typeof upgradeKey==='function'?upgradeKey(u):u.id]||0)})).filter(x=>x.l>0);},[])||[];
 if(up.length)s+='<p class="small">스킬 포인트 강화: '+up.map(u=>esc(u.n)+' '+u.l).join(' · ')+'</p>';return s;}
function css(){if(typeof document==='undefined'||document.getElementById('r1032Css'))return;const c=document.createElement('style');c.id='r1032Css';
 c.textContent='.r1032cards{display:grid;gap:8px;margin:8px 0}.r1032card{display:flex;gap:10px;padding:8px;border:1px solid #6b5a46;border-radius:6px;background:rgba(30,20,16,.6)}'
 +'.r1032card.locked{opacity:.55}.r1032card .ic{flex:0 0 72px;height:72px}.r1032card .ic svg,.r1032card .ic canvas{width:72px;height:72px}.r1032card .lv{color:#e6c27a;font-size:12px}'
 +'.r1032card .eff{font-size:12px;color:#e9dcc4}.r1032card .eff.nx{color:#b9a98c}.r1032card button{margin-top:4px;min-height:34px}.r1032book div{margin:3px 0}'
 +'.r1032pl{list-style:none;padding:0}.r1032pl li{display:grid;grid-template-columns:8.5em 1fr auto;gap:6px;padding:5px 0;border-bottom:1px solid #4a3d30;font-size:13px}.r1032pl li.locked{opacity:.55}.r1032pl em{color:#c9b48c;font-style:normal;font-size:12px}'
 +'@media (max-width:520px){.r1032pl li{grid-template-columns:1fr}}';document.head.appendChild(c);}
const imgs={};
function drawWeapons(){if(typeof document==='undefined')return;for(const cv of document.querySelectorAll?.('canvas[data-r1032w]')||[]){const W=WEAPONS[cv.getAttribute('data-r1032w')];if(!W)continue;
 const url=G(()=>typeof urlFor==='function'?urlFor(W.img):W.img,W.img);let im=imgs[W.img];if(!im){im=imgs[W.img]=new Image();im.src=url;}
 const paint=()=>{try{const g=cv.getContext('2d'),[x,y,w,h]=W.box,s=Math.min(72/w,72/h);g.clearRect(0,0,72,72);g.drawImage(im,x,y,w,h,(72-w*s)/2,(72-h*s)/2,w*s,h*s);}catch(e){fail(e);}};
 if(im.complete&&im.naturalWidth)paint();else im.addEventListener('load',paint,{once:true});}}
function wire(){if(typeof document==='undefined')return;const $=id=>document.getElementById(id);const on=(id,f)=>{const b=$(id);if(b)b.onclick=f;};
 on('r1032Close',()=>G(()=>closePanel()));on('r1032Book',()=>G(()=>window.__STORYWORLD_PLAY_R169__.showBook()));on('r1032Place',()=>{G(()=>closePanel());G(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.toggle());});
 for(const b of document.querySelectorAll?.('[data-r1032up]')||[])b.onclick=()=>{const r=upgrade(b.getAttribute('data-r1032up'));if(!r.ok)G(()=>toast(r.why==='frags'?'꿈의 조각이 모자랍니다 ('+r.need+' 필요)':r.why==='locked'?'아직 얻지 못한 장비입니다':'더 강화할 수 없습니다',2));else{G(()=>toast(ITEMS[r.item].name+(r.item==='weapon'?' '+WEAPONS[r.hero].name:'')+' '+r.level+'단계',1.6));openGear();}};
 drawWeapons();}
function openGear(){css();G(()=>openPanel(gearHtml()));mine='i';stats.opens.i++;wire();}
function openPassive(){css();G(()=>openPanel(passiveHtml()));mine='k';stats.opens.k++;wire();}
function onKey(ev){try{if(off||!ev||ev.repeat||ev.ctrlKey||ev.metaKey||ev.altKey)return;const k=String(ev.key||'').toLowerCase(),c=ev.code;
 const w=(c==='KeyI'||k==='i')?'i':(c==='KeyK'||k==='k')?'k':(c==='KeyB'||k==='b')?'b':null;if(!w)return;
 const tg=ev.target;if(tg&&(['INPUT','TEXTAREA','SELECT'].includes(tg.tagName)||tg.isContentEditable||tg.closest?.('[contenteditable]')))return;
 if(!G(()=>started,false)||G(()=>loading,false)||G(()=>storyScene,null))return;
 if(w==='b'){if(!survival())return;ev.preventDefault();ev.stopImmediatePropagation();G(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.toggle());return;}
 if(survival()&&w==='i')ev.stopImmediatePropagation();/* 11:08Z: 무한생존 I 는 영웅 배치(R720) 대신 장비 창 */
 if(G(()=>modal,false)){if(mine===w){ev.preventDefault();ev.stopImmediatePropagation();G(()=>closePanel());}return;}
 if(G(()=>!(player.hp>0),true))return;ev.preventDefault();ev.stopImmediatePropagation();if(w==='i')openGear();else openPassive();}catch(e){fail(e);}}
// ── 엔진 연결(모든 스크립트가 감싼 뒤, 맨 바깥) ──
let installed=false;
function install(){if(installed)return;installed=true;
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,value,...rest){return onHit(base,this,e,value,rest);};}
 if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const first=!!e&&!e.deadRecorded,r=base.apply(this,[e,...a]);try{if(!off&&first&&e.deadRecorded){const v=give(gain(killCtx(e)));if(v)stats.kills++;}}catch(err){fail(err);}return r;};}
 if(typeof hurt==='function'){const base=hurt;hurt=function(d,...a){try{if(active()&&has('seal')&&typeof d==='number'&&Number.isFinite(d)&&d>0)d=d*(1-cur().defense);}catch(e){fail(e);}return base.apply(this,[d,...a]);};}
 if(typeof ego==='function'){const base=ego;ego=function(...a){const p=P(),before=+(p?.ego)||0,r=base.apply(this,a);try{const q=P();if(q&&q===p&&active()&&has('seal')&&!(before>0)&&q.ego>0&&Number.isFinite(q.ego))q.ego*=1+cur().ego;}catch(e){fail(e);}return r;};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const t0=T(),r=base.apply(this,a);try{const dt=T()-t0;if(!off&&dt>0&&dt<1){cdTick(dt);echoTick(dt);questTick();saveAt+=dt;if(dirty&&saveAt>2){saveAt=0;save();}}}catch(e){fail(e);}return r;};}
 if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){mine=null;return base.apply(this,a);};}
 if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){mine=null;return base.apply(this,a);};}
 // 모바일·마우스: 설정 창 맨 아래에 두 창 단추(전투 HUD 단추는 늘리지 않음, R1021 방침)
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{if(!off&&!document.getElementById('r1032Settings')){const s=document.createElement('section');s.id='r1032Settings';
   s.innerHTML='<h3>패시브 · 고유 장비</h3><button type="button" id="r1032OpenK">패시브 스킬 목록 (K)</button> <button type="button" id="r1032OpenI">고유 장비 · 기억 조각 (I)</button>';G(()=>document.getElementById('panel').appendChild(s));
   const k=document.getElementById('r1032OpenK'),i=document.getElementById('r1032OpenI');if(k)k.onclick=()=>openPassive();if(i)i.onclick=()=>openGear();}}catch(e){fail(e);}return r;};}
}
if(typeof document!=='undefined')document.addEventListener('keydown',onKey,true);
if(typeof document!=='undefined'&&document.readyState==='complete')install();else if(typeof addEventListener==='function')addEventListener('load',install);
window.__STORYWORLD_GEAR_R1032__=Object.freeze({revision:REV,pure,install,upgrade,openGear,openPassive,gearHtml,passiveHtml,
 frags:()=>Math.floor(st.frags),levels:()=>({seal:st.seal,rose:st.rose,weapon:{...st.weapon}}),effects:cur,owned:item=>has(item),
 qaGive:n=>{if(!(+n>0))return false;st.frags=Math.min(1e9,st.frags+ +n);dirty=true;return true;},qaRoll:f=>{rnd=typeof f==='function'?f:Math.random;return true;},qaReset:()=>{st=blank();save();return true;},
 inspect:()=>({revision:REV,off,frags:st.frags,levels:levelsNow(),stored:{seal:st.seal,rose:st.rose,weapon:{...st.weapon}},owned:{seal:has('seal'),rose:has('rose')},queue:queue.length,stats:JSON.parse(JSON.stringify(stats)),lastError})});
})();
