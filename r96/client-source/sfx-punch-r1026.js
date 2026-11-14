/* R1026 적 피격·사망 효과음을 또렷하고 생동감 있게 (사용자 2026-11-14 "효과음들 특히 적피격,사망 더 잘들리고 스타,워크등 참고해서 더 생동역동성있게 음향전문가동반해서 전체적인퀄리티업").
 * R993 믹스(sfx-mix-r993.js)는 몹 층(몹 피격·사망)을 맨 아래(−46·−43.5 LUFS, 우선순위 1)에 두고, 이미 3음 이상 울리면 들이지 않았다.
 * 전투 중에는 거의 늘 3음 이상이라 몹 사망·피격 소리가 대부분 빠졌다(CPU 모의: 처치 12번 중 사망음 2번).
 * RTS(스타크래프트·워크래프트류)의 성격만 참고한다(특정 게임 소리는 쓰지 않음): 짧고 단단한 어택, 뚜렷한 중저음, 사망에는 짧은 꼬리, 처치가 늘 들림.
 * 고침(소리 파일·판정·서사는 그대로, 재생 단계만. R993 의 admit·onStart 에 훅 한 줄씩):
 *  - 사망음 자체 길: 동시 2음·간격 .07초·초당 7번까지는 붐벼도 들인다. 이미 2음이면 가장 오래된 사망음을, 전체 4음이 꽉 찼으면 더 낮은 순위의 가장 낮은 소리를 .018초(엔진 빼앗기와 같은 길이)에 걷어 내고 새 처치를 낸다. 우선순위 4(몹 공격·적중음보다 위, 영웅 타격 어택 5·피격 9 아래).
 *    간격에 걸려 빠진 처치가 있으면 다음 사망음을 빠진 수 ×0.75dB(최대 +3dB) 굵게(몰아 잡았을 때 한 덩어리로 크게).
 *  - 몹 피격 자체 길: .09초에 한 번·동시 2음·초당 10번까지 들인다. 우선순위 2.
 *  - 음량 덧보정: 몹 사망 +3.5dB(−43.5→−40), 몹 피격 +3.5dB(−46→−42.5), 적중음·보스 피격 +2.5dB. 영웅 피격(−37)은 여전히 맨 위, 보스 사망(−36.5)도 그대로.
 *    원본 피크×배율×보정이 0.75 를 넘지 않게 막는다(마스터 압축기 앞). 덧보정은 EQ 가 올린 몫(약 1dB)을 빼고 건다.
 *  - 피격 EQ: 240Hz +2dB(몸통)·1.9kHz +2.5dB(존재감 — 쾌적 계층 3kHz 저역통과 뒤에도 묻히지 않게). 150Hz 아래 저음은 올리지 않음(사용자 '스피커 터지는 소리 싫음').
 *  - 사망: 200Hz +2.5dB·1.6kHz +1.5dB, 재생 속도 ×0.96(무게), 짧은 꼬리(지연 .06·.13·.22초, 탭 이득 .32·.2·.11, 1.5kHz 저역통과)를 목소리 엔벨로프 밖(마스터)으로 보내
 *    소리가 끝나도 짧게 남는다. 꼬리 지연망은 컨텍스트마다 하나를 함께 쓰고, 소리마다 EQ 2개(저사양 1개)·보내기 GainNode 1개만 만들어 끝나고 .7초 뒤 끊는다.
 *  - 영웅·보스·UI 소리와 사망음이 오기 직전 이미 걷히는 중인 소리를 3ms 에 끝내 목록에서 뺀다(엔진이 걷히는 소리 때문에 영웅 소리를 버리지 않게).
 * 쾌적 계층(동시 4음·역할 길이 상한·저역통과)·R993 목표·변주·더킹은 그대로. 값은 모두 유한값으로 clamp.
 * 끄기: localStorage storyworld.r1026.sfx = '0'(R993 동작으로 돌아감). Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_PUNCH_R1026__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r1026.sfx')!=='0';}catch(_){}
 const REV='R1026-sfx-punch-1',BUS=.78,PEAK_MAX=.75;
 const fin=(v,d=0)=>Number.isFinite(v)?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const EXTRA={'일반몹/die':3.5,'일반몹/hit':3.5,'적피격/hit':2.5,'보스/hit':2.5};
 const DEATH={gap:.07,perSec:7,live:2,prio:4,boostStep:.75,boostMax:3},HIT={gap:.09,perSec:10,live:2,prio:2};
 const EQ={hit:[[240,2,1],[1900,2.5,.9]],death:[[200,2.5,.9],[1600,1.5,1]]};
 const TAIL={taps:[[.06,.32],[.13,.2],[.22,.11]],lp:1500,rate:.96,release:.7};
 const stats={buses:0,deathIn:0,deathDrop:0,deathRetired:0,roomMade:0,flushed:0,hitIn:0,hitDrop:0,boosted:0,eq:0,tails:0,peakGuarded:0,errors:0};
 const cat=k=>{try{const M=window.__STORYWORLD_SFX_MIX_R993__;return M&&typeof k==='string'?M.category(k):null;}catch(_){return null;}};
 // 길: 사망(몹 사망·r541Death) / 피격(몹 피격·적중음·보스 피격). 영웅 소리·몹 공격·보스 사망은 null.
 function lane(c){if(!c||typeof c!=='object')return null;if(c.cat==='일반몹'&&c.sub==='die')return 'death';if(c.sub==='hit'&&(c.cat==='일반몹'||c.cat==='적피격'||c.cat==='보스'))return 'hit';return null;}
 function extraDb(c){if(!c||typeof c!=='object')return 0;return fin(EXTRA[c.cat+'/'+c.sub],0);}
 const effectiveTarget=c=>c&&Number.isFinite(c.target)?c.target+extraDb(c):null;
 const S={death:[],hit:[],boost:0};
 const kindOf=v=>v&&(v.kind||v.k)||null;
 // R993 admit 이 부른다. true/false = 결정, undefined = R993 규칙대로.
 function admit(c,t,L){try{if(!on)return undefined;const ln=lane(c);if(!ln)return undefined;
   if(ln==='hit'&&c.cls!=='low')return undefined;// 적중음·보스 피격은 R993 중간 등급 규칙(.12초 3번)을 그대로
   t=fin(t,NaN);if(!Number.isFinite(t))return undefined;const live=Array.isArray(L)?L:[],R=ln==='death'?DEATH:HIT,q=S[ln];
   for(let i=q.length-1;i>=0;i--)if(!(q[i]<=t&&t-q[i]<1))q.splice(i,1);
   const last=q.length?q[q.length-1]:-1e9,same=live.filter(v=>{const k=cat(kindOf(v));return lane(k)===ln&&(ln==='death'||k.cls==='low');});
   // 사망음이 이미 2개면 가장 오래된 것을 .018초에 걷어 내고 새 처치를 들인다(새 처치의 어택이 늘 들리게, 동시 2 유지).
   if(ln==='death'&&same.length>=R.live&&t-last>=R.gap-1e-6&&q.length<R.perSec){const old=same[0];if(fade(old)){same.shift();stats.deathRetired++;}}
   // 전체 4음이 꽉 찼으면 사망음보다 낮은 순위(몹 공격·몹 피격·적중음) 중 가장 오래된 것을 미리 걷어 자리를 만든다
   //  (엔진은 이미 걷히는 소리가 하나라도 있으면 새 소리를 버리므로, 엔진이 빼앗기 전에 한 번만).
   else if(ln==='death'&&same.length<R.live&&t-last>=R.gap-1e-6&&q.length<R.perSec){const act=live.filter(v=>v&&!v.stopping);if(act.length>=4){const low=act.filter(v=>fin(v.priority,9)<DEATH.prio).sort((x,y)=>fin(x.priority,0)-fin(y.priority,0))[0];if(low&&fade(low))stats.roomMade++;}}
   if(t-last<R.gap-1e-6||q.length>=R.perSec||same.length>=R.live){if(ln==='death'){stats.deathDrop++;S.boost=Math.min(DEATH.boostMax,S.boost+DEATH.boostStep);}else stats.hitDrop++;return false;}
   q.push(t);if(ln==='death')stats.deathIn++;else stats.hitIn++;return true;}catch(_){stats.errors++;return undefined;}}
 function fade(v){try{if(!v||v.stopping)return false;v.stopping=true;const src=v.source,g=v.gain&&v.gain.gain,ac=src&&src.context;
   if(ac&&g&&typeof g.setValueAtTime==='function'){const now=ac.currentTime;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+.018);try{src.stop(now+.02);}catch(_){}}
   return true;}catch(_){stats.errors++;return false;}}
 // 영웅·보스·UI 소리(R993 등급 high·impact)와 사망음이 오기 직전, 이미 걷히는 중인 소리를 3ms 에 끝내 목록에서 뺀다.
 // 엔진은 걷히는 소리가 하나라도 있으면(전체 4음일 때)·목록이 5개면 새 소리를 버리는데, R1026 이 사망음 자리를 만들며 걷는 소리가 늘어 영웅 소리가 막힐 수 있다.
 function beforePlay(c){try{if(!on||!c||(c.cls!=='high'&&c.cls!=='impact'&&lane(c)!=='death'))return 0;const list=typeof sfxLive!=='undefined'&&Array.isArray(sfxLive)?sfxLive:null;if(!list)return 0;
   const fading=list.filter(v=>v&&v.stopping);if(!fading.length)return 0;let n=0;
   for(const v of fading){try{const src=v.source,g=v.gain&&v.gain.gain,ac=src&&src.context;if(ac&&g&&typeof g.setValueAtTime==='function'){const now=ac.currentTime;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+.003);try{src.stop(now+.004);}catch(_){}}}catch(_){}
    const i=list.indexOf(v);if(i>=0){list.splice(i,1);n++;}}
   stats.flushed+=n;return n;}catch(_){stats.errors++;return 0;}}
 function level(info){if(Number.isFinite(info&&info.level))return clamp(info.level,0,1);
  try{const vol=typeof settings!=='undefined'&&settings?clamp(fin(settings.volume,1),0,1):1,coop=fin(window.__STORYWORLD_COOP_SIM_R62__?.soundGain?.(),1);return clamp(vol*coop*fin(info&&info.row,1)*fin(info&&info.role,.3),0,1);}catch(_){return 0;}}
 // 꼬리 버스: 오디오 컨텍스트·마스터마다 하나(지연 3탭 → 저역통과 → 마스터). 사망음은 소리마다 GainNode 하나로만 보낸다
 //  (소리마다 지연망을 만들면 헤드리스 오프라인 렌더 측정에서 오디오 처리 시간이 4음 기준 약 +300%, 공유 버스는 약 +30%).
 const buses=new WeakMap();
 function tailBus(ac,master){try{let b=buses.get(ac);if(b&&b.master===master)return b.input;
   const input=ac.createGain();input.gain.value=1;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=TAIL.lp;lp.Q.value=.7;lp.r1026Lp=true;
   for(const [dt,g] of TAIL.taps){const d=ac.createDelay(.5);d.delayTime.value=dt;const tg=ac.createGain();tg.gain.value=g;tg.r1026Tap=true;input.connect(d);d.connect(tg);tg.connect(lp);}
   lp.connect(master);buses.set(ac,{input,master});stats.buses++;return input;}catch(_){stats.errors++;return null;}}
 const lowFx=()=>{try{return typeof settings!=='undefined'&&!!settings&&!!settings.lowFx;}catch(_){return false;}};
 // EQ 가 올린 대역만큼 들리는 음량(K 가중)도 오른다 → 덧보정에서 EQ 몫(올린 dB 합의 1/4, 헤드리스 실측 약 +1dB)을 빼 목표 덧보정에 맞춘다.
 function eqCompDb(ln){const sp=ln==='death'?EQ.death:ln==='hit'?EQ.hit:null;if(!sp)return 0;const used=lowFx()?sp.slice(-1):sp;return Math.round(used.reduce((a,b)=>a+b[1],0)*.25*100)/100;}
 function eqChain(ac,spec,src,trim){if(lowFx())spec=spec.slice(-1);// 저사양(모바일 기본)은 존재감 대역 하나만
let prev=src;const made=[];try{src.disconnect();}catch(_){}
  for(const [f,g,q] of spec){const b=ac.createBiquadFilter();b.type='peaking';b.frequency.value=f;b.gain.value=clamp(g,0,3.5);b.Q.value=q;prev.connect(b);prev=b;made.push(b);}
  prev.connect(trim);stats.eq++;return made;}
 // R993 onStart 이 trim 을 이은 뒤 부른다(src.start 바로 앞, 같은 작업 안).
 function onVoice(v,src,c,now,info){try{if(!on||!v||typeof v!=='object')return;const ln=lane(c);if(!ln)return;
   v.priority=ln==='death'?DEATH.prio:(c.cls==='low'?HIT.prio:Math.max(fin(v.priority,2),HIT.prio));
   const R=v.r993,trim=R&&R.trim;if(!src||!src.context||!trim||!trim.gain)return;const ac=src.context;
   let add=extraDb(c)-eqCompDb(ln);if(ln==='death'&&S.boost>0){add+=S.boost;S.boost=0;stats.boosted++;}
   let lin=fin(R.lin,trim.gain.value)*Math.pow(10,add/20);
   if(Number.isFinite(info&&info.peakDb)){const pk=Math.pow(10,info.peakDb/20)*fin(info.row,1)*fin(info.role,.3)*lin;if(pk>PEAK_MAX){lin*=PEAK_MAX/pk;stats.peakGuarded++;}}
   if(!(lin>0)||!Number.isFinite(lin))return;trim.gain.value=lin;R.lin=lin;R.r1026Db=add;
   const nodes=eqChain(ac,ln==='death'?EQ.death:EQ.hit,src,trim);
   if(ln==='death'){if(src.playbackRate)src.playbackRate.value=clamp(Math.min(1,fin(src.playbackRate.value,1)*TAIL.rate),.9,1);
    const master=info&&info.master;if(master&&typeof master.connect==='function'){const lv=level(info)*BUS;if(lv>0){
     const bus=tailBus(ac,master);if(bus){const tin=ac.createGain();tin.gain.value=lv;trim.connect(tin);tin.connect(bus);nodes.push(tin);stats.tails++;}}}}
   if(nodes.length&&typeof src.addEventListener==='function')src.addEventListener('ended',()=>{try{setTimeout(()=>{for(const x of nodes)try{x.disconnect();}catch(_){}},TAIL.release*1000);}catch(_){}});
  }catch(_){stats.errors++;}}
 window.__STORYWORLD_SFX_PUNCH_R1026__=Object.freeze({revision:REV,enabled:()=>on,lane,extraDb,eqCompDb,effectiveTarget,admit,onVoice,beforePlay,pendingBoostDb:()=>S.boost,
  inspect:()=>({revision:REV,on,stats:{...stats},extraDb:{...EXTRA},death:{...DEATH},hit:{...HIT},eq:EQ,tail:TAIL,peakMax:PEAK_MAX,directListeningVerified:false})});
})();
