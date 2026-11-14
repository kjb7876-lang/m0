/* R993 효과음 믹스 정리 (사용자 2026-11-13 "효과음관련 전수점검 및 개선 · 생동감 타격감 있게 귀에 거슬리지않게 · 영화적 음향적 관련모든분야전문가모드로").
 * 전수 점검(r96/qa/r993/README.md): 효과음 종류 498개·파일 1,202개. 파일 자체는 깨끗했지만(클리핑 0) 여러 라운드가 따로 만든 탓에
 *  ① 같은 범주 안 실제 음량 차가 최대 22dB(영웅 피격), 범주 사이 위계가 없음(적 탄환 생성음이 영웅 타격보다 큼),
 *  ② 몹 층 소리(별칭 없는 종류 = 우선순위 4)가 영웅 평타(4)와 같은 순위라 동시 4음 상한에서 영웅 타격음을 빼앗음,
 *  ③ 같은 파일이 같은 높이로 반복(재생 속도 1 고정) → 연타·대량 몹에서 기계적 반복 피로,
 *  ④ 큰 소리(영웅 피격·보스 공격·사망·각성) 때 잔소리를 줄이는 더킹 없음,
 *  ⑤ 윤서하 각성·보스 등장 암흑 공격·불면귀 실비 시전 3개는 본체가 역할 길이 상한 뒤에 있어 앞의 작은 소리만 났다.
 * 고침(소리 파일 원본·판정·서사는 그대로, 재생 단계만):
 *  - 범주(타격·적피격·영웅피격·스킬·투사체·보스·일반몹·패시브·회복·UI·보상·환경)와 쓰임(피격·사망·공격 등)마다 목표 음량.
 *    실제 재생되는 조절된 버퍼의 K 가중 400ms 순간 최대 음량(BS.1770)을 한 번 재고, 역할 배율·줄 배율을 더해 목표와의 차이만큼 음량 보정 노드로 맞춘다(−12~+18dB, 피크 0.6 보호. R544 영웅 피격 파일은 원래 −31~−39 LUFS 로 작아 +14~+19dB 가 필요).
 *  - 범주별 작은 음높이(±2~6%)·음량(±0.5~1.5dB) 흔들기, 같은 종류 연속 같은 값 없음. UI 는 거의 고정.
 *  - 몹 층(일반몹·환경)은 이미 3음 이상 울리거나 몹 층이 2음이면 들이지 않고, 재생 중 우선순위를 1로 낮춘다 → 영웅·보스 소리가 먼저 남는다.
 *    영웅 타격은 어택 0.3초 동안 5(몹·적중음이 못 빼앗음), 뒤로는 3. 영웅 피격 9·보스 사망 8·보스 공격 7.
 *  - 큰 소리가 시작하면 울리고 있는 몹 층·적중음·탄환음을 0.25초 동안 −6dB 줄였다가 되돌린다.
 *  - 위 ⑤ 세 개는 앞 소리는 살리고 무음을 뺀 파생본(assets/r993/sfx, 모노 44.1kHz, scripts/build-sfx-r993.py)으로 바꾼다. 디코딩 메모리는 원본의 1/4 이하.
 * 쾌적 계층(__STORYWORLD_SFX_COMFORT__)·디코딩 캐시(#551 R980)는 고치지 않는다. 값은 모두 유한값으로 clamp.
 * 끄기: localStorage storyworld.r993.sfx = '0'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_MIX_R993__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r993.sfx')!=='0';}catch(_){}
 const REV='R993-sfx-mix-1',BUS=.78,PEAK_MAX=.6,TRIM_MIN=-12,TRIM_MAX=18,DUCK_DB=-6,DUCK_HOLD=.25;
 const fin=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 // [범주, 쓰임, 종류 이름 규칙, 목표(dB, 실효 음량 = 조절된 버퍼 K 가중 순간 최대 + 20log10(줄 배율×역할 배율×버스)), 속도 흔들기, 음량 흔들기 dB, 재생 중 우선순위, 등급]
 const SPEC=[
  ['영웅피격','hurt',/^(hurt$|r544Hurt_|swShield$)/,-37,.03,.8,9,'impact'],
  ['일반몹','hit',/^(r955Hit_|r954Hit_|r544Hit_)/,-46,.06,1.5,1,'low'],
  ['일반몹','die',/^(r955Die_|r954Die_|r541Death$|r544Death_)/,-43.5,.05,1.2,1,'low'],
  ['일반몹','atk',/^(r955Atk_|r954Atk_|r543(Growl|GrowlLow|GrowlHigh|Goblin)$|r761Villager)/,-45,.05,1.2,1,'low'],
  ['보스','hit',/^(r788BHit_|r789MHit_|r967Hit_)/,-42,.04,1,3,'mid'],
  ['보스','die',/^(r788BDie_|r789MDie_|r967Die_)/,-36.5,.02,.5,8,'impact'],
  ['보스','atk',/^(r788BAtk_|r789MAtk_|r967Atk_|r761Boss|boss$)/,-38.5,.025,.8,7,'impact'],
  ['적피격','hit',/^(enemyHit$|r785)/,-41,.05,1.2,2,'mid'],
  ['투사체','shot',/^(swEnemy|r546EnemyShot$)/,-43,.05,1.2,2,'mid'],
  ['타격','atk',/^(attack$|rc141TreeWeapon5$|sw(Metal|Heavy|Ranged|Lightning|Holy|Space)$|r546Atk_|r787Atk_|r542Bow$)/,-38,.035,1,5,'high'],
  ['스킬','tick',/^(r972_|r975Ilseom)/,-43,.05,1.2,3,'mid'],
  ['스킬','awake',/^(awake$|r546Awake$|rc141TimeAwakening5$)/,-36,.01,.5,10,'impact'],
  ['스킬','cast',/^(special$|r546Sp_|r787Sk_|sw(Dark|Energy|LightningSkill|HolySkill)$|blink$|dodge$|parry$|ego$|r546(Blink|Dodge|Parry|Ego)$|rc141(KairoTick5|ResonanceEnergy5)$)/,-37.5,.02,.8,6,'high'],
  ['패시브·회복','heal',/^swHeal$/,-42,.02,.5,5,'high'],
  ['UI·보상','ui',/^(clear$|upgrade$|pickup$|r544Click$|r546(Clear|Upgrade|Open|Portal|Fall)$|r541Door$|r542Crush$)/,-40,.008,.3,6,'high'],
  ['환경','env',/^r543Thunder$/,-44,.04,1,1,'low']];
 const HERO_TAIL=.3,HERO_TAIL_PRIO=3,catCache=new Map();
 function category(kind){if(typeof kind!=='string'||!kind)return null;if(catCache.has(kind))return catCache.get(kind);let c=null;
  for(const [cat,sub,re,target,rateVar,gainVar,prio,cls] of SPEC)if(re.test(kind)){c=Object.freeze({cat,sub,target,rateVar,gainVar,prio,cls,inPrio:null});break;}
  if(catCache.size<4000)catCache.set(kind,c);return c;}
 const targets=Object.freeze(Object.fromEntries(SPEC.map(s=>[s[0]+'/'+s[1],s[3]])));
 // ---- K 가중 순간 음량(BS.1770, 표본률마다 계수 계산). channels: Float32Array 배열.
 function kCoef(fs){let f0=1681.974450955533,G=3.999843853973347,Q=.7071752369554196,K=Math.tan(Math.PI*f0/fs),Vh=Math.pow(10,G/20),Vb=Math.pow(Vh,.4996667741545416),a0=1+K/Q+K*K;
  const s1={b:[(Vh+Vb*K/Q+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q+K*K)/a0],a:[2*(K*K-1)/a0,(1-K/Q+K*K)/a0]};
  f0=38.13547087602444;Q=.5003270373238773;K=Math.tan(Math.PI*f0/fs);const d=1+K/Q+K*K;return [s1,{b:[1,-2,1],a:[2*(K*K-1)/d,(1-K/Q+K*K)/d]}];}
 function loudness(channels,fs){try{if(!Array.isArray(channels)||!channels.length||!(fs>1000))return null;const n=Math.min(...channels.map(c=>c&&c.length||0));if(!(n>16))return null;
  const [s1,s2]=kCoef(fs),m=new Float64Array(n);for(const c of channels)for(let i=0;i<n;i++){const v=c[i];m[i]+=Number.isFinite(v)?v/channels.length:0;}
  const e=new Float64Array(n);let x1=0,x2=0,y1=0,y2=0,u1=0,u2=0,z1=0,z2=0;
  for(let i=0;i<n;i++){const x=m[i],y=s1.b[0]*x+s1.b[1]*x1+s1.b[2]*x2-s1.a[0]*y1-s1.a[1]*y2;x2=x1;x1=x;y2=y1;y1=y;const z=s2.b[0]*y+s2.b[1]*u1+s2.b[2]*u2-s2.a[0]*z1-s2.a[1]*z2;u2=u1;u1=y;z2=z1;z1=z;e[i]=z*z;}
  const w=Math.min(n,Math.round(.4*fs)),h=Math.max(1,Math.round(.1*fs));let s=0;for(let i=0;i<w;i++)s+=e[i];let best=s/w;
  for(let i=h;i+w<=n;i+=h){s=0;for(let j=i;j<i+w;j++)s+=e[j];best=Math.max(best,s/w);}
  return best>1e-10&&Number.isFinite(best)?10*Math.log10(best)-.691:null;}catch(_){return null;}}
 function trimDb(kind,lufs,rowGain,roleGain,peakDb){const c=category(kind);if(!c||!Number.isFinite(lufs)||!Number.isFinite(rowGain)||!Number.isFinite(roleGain)||rowGain<=0||roleGain<=0)return 0;
  const g=Math.min(1,rowGain)*roleGain;let t=clamp(c.target-(lufs+20*Math.log10(g*BUS)),TRIM_MIN,TRIM_MAX);
  if(Number.isFinite(peakDb)){const pk=Math.pow(10,peakDb/20)*g;if(pk>0)t=Math.min(t,20*Math.log10(PEAK_MAX/pk));}
  t=clamp(t,TRIM_MIN,TRIM_MAX);return Number.isFinite(t)?Math.round(t*100)/100:0;}
 // ---- 변주: 같은 종류가 같은 높이로 두 번 연속 나지 않게
 const lastRate=new Map();
 function vary(kind,rand){const c=category(kind);if(!c)return {rate:1,gainDb:0};let u=typeof rand==='function'?rand():Math.random();if(!Number.isFinite(u))return {rate:1,gainDb:0};u=clamp(u,0,1);
  let rate=1+c.rateVar*(2*u-1);const last=lastRate.get(kind);if(c.rateVar>0&&last!=null&&Math.abs(rate-last)<c.rateVar*.25)rate=last+(last>=1?-1:1)*c.rateVar*.5;
  rate=clamp(rate,1-c.rateVar,1+c.rateVar);if(lastRate.size>2000)lastRate.clear();lastRate.set(kind,rate);
  let v=typeof rand==='function'?rand():Math.random();if(!Number.isFinite(v))v=.5;const gainDb=clamp(c.gainVar*(2*clamp(v,0,1)-1),-c.gainVar,c.gainVar);
  return {rate:Number.isFinite(rate)?rate:1,gainDb:Number.isFinite(gainDb)?gainDb:0};}
 // ---- 들이기: 몹 층은 이미 붐빌 때 빼고, 탄환·적중음은 0.12초에 3번까지
 const admitState=()=>({low:[],mid:[],shot:-1e9});
 const kindOf=v=>v&&(v.kind||v.k)||null;
 function admit(state,kind,t,live){try{const c=category(kind);if(!state||!c||c.cls==='high'||c.cls==='impact')return true;t=fin(t,0);const L=Array.isArray(live)?live:[];
  {const PX=window.__STORYWORLD_SFX_PUNCH_R1026__;if(PX&&PX.enabled()){const o=PX.admit(c,t,L);if(o===true||o===false)return o;}}// R1026 사망·몹 피격 자체 길
  state.low=state.low.filter(x=>t-x<.06&&x<=t);state.mid=state.mid.filter(x=>t-x<.12&&x<=t);
  if(c.cls==='low'){const nLow=L.filter(v=>category(kindOf(v))?.cls==='low').length;if(L.length>=3||Math.max(nLow,state.low.length)>=2)return false;state.low.push(t);return true;}
  if(c.sub==='shot'){if(t-state.shot<.15)return false;state.shot=t;}
  if(state.mid.length>=3)return false;state.mid.push(t);return true;}catch(_){return true;}}
 // ---- 잘림 고친 파생본(앞 소리 + 본체)
 const remap=Object.freeze({
  'delivery/additional-audio13-20261005/processed/sfx-candidate/Time_manipulation_aw__1-1791000657816-42a47f20.ogg':'assets/r993/sfx/seoha-awake.ogg',
  'audio/rc133/processed/enemy-heavy/Dark_demonic_attack___3-1790999830236-5780aca5.ogg':'assets/r993/sfx/boss-dark-attack.ogg',
  'assets/r761/sfx/bmg-rain-1.ogg':'assets/r993/sfx/bmg-rain-1.ogg'});
 const stats={remapped:0,started:0,trimmed:0,varied:0,demoted:0,ducked:0,admitLowDrop:0,admitMidDrop:0,measured:0,errors:0};const audit=[];const log=r=>{audit.push(r);if(audit.length>160)audit.shift();};
 function applyRemap(){try{if(typeof soundProfiles==='undefined'||!soundProfiles)return;for(const rows of Object.values(soundProfiles))if(Array.isArray(rows))for(let i=0;i<rows.length;i++){const r=rows[i],to=r&&remap[r.path];
   if(to){rows[i]={...r,path:to,key:(r.key||'')+'-r993',r993From:r.path};stats.remapped++;try{if(typeof register==='function')register(to,'audio','sfx r993 '+to);}catch(_){}}}}catch(_){stats.errors++;}}
 // ---- 재생 단계: 쾌적 계층이 sfxLive 에 넣고 source.start 를 부를 때 끼어든다
 const meas=new WeakMap();
 function measure(buf){let m=meas.get(buf);if(m)return m;let peak=0;const ch=[];try{for(let c=0;c<buf.numberOfChannels;c++){const a=buf.getChannelData(c);ch.push(a);for(let i=0;i<a.length;i++){const v=Math.abs(a[i]);if(v>peak&&Number.isFinite(v))peak=v;}}}catch(_){}
  m={lufs:loudness(ch,buf.sampleRate),peakDb:peak>0?20*Math.log10(peak):null};meas.set(buf,m);stats.measured++;return m;}
 function roleGainOf(kind){try{const C=window.__STORYWORLD_SFX_COMFORT__,r=C&&C.roles,al=C&&C.aliases;const d=r&&(r[(al&&al[kind])||kind]||r.special);return fin(d&&d.gain,.3);}catch(_){return .3;}}
 function rowGainOf(kind){try{const rows=typeof soundProfiles!=='undefined'&&soundProfiles[kind];if(!rows||!rows.length)return 1;const C=window.__STORYWORLD_SFX_COMFORT__,base=(C&&C.aliases&&C.aliases[kind])||kind;
  const idx=typeof soundSerial!=='undefined'?fin(soundSerial[base],1):1,row=rows[((idx-1)%rows.length+rows.length)%rows.length];return clamp(fin(row&&row.gain,1),0,1);}catch(_){return 1;}}
 const live=()=>{try{return typeof sfxLive!=='undefined'&&Array.isArray(sfxLive)?sfxLive.filter(v=>v&&!v.stopping):[];}catch(_){return [];}};
 function duck(now,except){for(const v of live()){if(v===except||!v.r993||!v.r993.trim)continue;const c=category(v.kind);if(!c||(c.cls!=='low'&&c.cls!=='mid'))continue;
   try{const g=v.r993.trim.gain,base=v.r993.lin,low=base*Math.pow(10,DUCK_DB/20);g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(low,now+.02);g.setValueAtTime(low,now+DUCK_HOLD);g.linearRampToValueAtTime(base,now+DUCK_HOLD+.25);stats.ducked++;}catch(_){stats.errors++;}}}
 function onStart(src){try{if(!on)return;const list=typeof sfxLive!=='undefined'&&Array.isArray(sfxLive)?sfxLive:null;if(!list)return;let v=null;for(let i=list.length-1;i>=0&&i>=list.length-6;i--)if(list[i]&&list[i].source===src){v=list[i];break;}
  if(!v||v.r993)return;const c=category(v.kind);v.r993={cat:c?c.cat:null};if(!c||!src.buffer)return;stats.started++;
  const ac=src.context,now=ac.currentTime,m=measure(src.buffer),t=trimDb(v.kind,m.lufs,rowGainOf(v.kind),roleGainOf(v.kind),m.peakDb),vr=vary(v.kind),lin=Math.pow(10,clamp(t+vr.gainDb,TRIM_MIN-2,TRIM_MAX+2)/20);
  if(!Number.isFinite(lin)||lin<=0)return;
  const trim=ac.createGain();trim.gain.value=lin;try{src.disconnect();}catch(_){}src.connect(trim);trim.connect(v.gain);v.r993={cat:c.cat,trim,lin,trimDb:t};if(t!==0)stats.trimmed++;
  try{src.addEventListener('ended',()=>{try{trim.disconnect();}catch(_){}});}catch(_){}
  if(src.playbackRate&&vr.rate!==1){src.playbackRate.value=clamp(vr.rate,.9,1.1);stats.varied++;}
  if(Number.isFinite(c.prio)&&v.priority!==c.prio){v.priority=c.prio;stats.demoted++;if(c.cat==='타격'){const id=v;try{setTimeout(()=>{if(id&&!id.stopping)id.priority=Math.min(id.priority,HERO_TAIL_PRIO);},HERO_TAIL*1000);}catch(_){}}}
  try{const PX=window.__STORYWORLD_SFX_PUNCH_R1026__;if(PX&&PX.enabled())PX.onVoice(v,src,c,now,{row:rowGainOf(v.kind),role:roleGainOf(v.kind),peakDb:m.peakDb,master:typeof masterGain!=='undefined'?masterGain:null});}catch(_){stats.errors++;}// R1026 덧보정·EQ·사망 꼬리
  if(c.cls==='impact')duck(now,v);
  log({kind:'start',kindName:v.kind,cat:c.cat,sub:c.sub,lufs:m.lufs==null?null:Math.round(m.lufs*10)/10,trimDb:t,gainDb:Math.round(vr.gainDb*100)/100,rate:Math.round(src.playbackRate?.value*10000)/10000,priority:v.priority,at:now});}catch(_){stats.errors++;}}
 const state=admitState();
 function install(){try{const P=window.AudioBufferSourceNode&&AudioBufferSourceNode.prototype;if(P&&!P.start.__r993){const base=P.start;const w=function(){onStart(this);return base.apply(this,arguments);};w.__r993=true;P.start=w;}}catch(_){stats.errors++;}
  try{if(typeof sound==='function'&&!sound.__r993){const base=sound;const s=function(kind,...a){try{if(on){const t=(typeof performance!=='undefined'?performance.now():Date.now())/1000;if(!admit(state,kind,t,live())){const c=category(kind);if(c&&c.cls==='low')stats.admitLowDrop++;else stats.admitMidDrop++;return undefined;}}}catch(_){stats.errors++;}try{const PX=window.__STORYWORLD_SFX_PUNCH_R1026__;if(on&&PX&&PX.enabled())PX.beforePlay(category(kind));}catch(_){stats.errors++;}return base.call(this,kind,...a);};s.__r993=true;sound=s;}}catch(_){stats.errors++;}
  applyRemap();}
 if(on){
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{applyRemap();}catch(_){stats.errors++;}return r;};}
  try{applyRemap();}catch(_){}
  // 다른 오버레이가 sound 를 다 감싼 뒤 가장 바깥에서 들이기를 본다(R972 처럼 DOMContentLoaded 에 감싸는 것도 있어 load 뒤에).
  if(document.readyState==='complete')install();else window.addEventListener('load',()=>{install();try{setTimeout(install,1500);}catch(_){}},{once:true});
 }
 window.__STORYWORLD_SFX_MIX_R993__=Object.freeze({revision:REV,enabled:()=>on,category,targets,trimDb,loudness,vary,admit,admitState,remap,applyRemap,
  inspect:()=>({revision:REV,on,stats:{...stats,targets},audit:[...audit],busGain:BUS,trimRangeDb:[TRIM_MIN,TRIM_MAX],peakMax:PEAK_MAX,duck:{db:DUCK_DB,hold:DUCK_HOLD},heroTail:{seconds:HERO_TAIL,prio:HERO_TAIL_PRIO},directListeningVerified:false})});
})();
