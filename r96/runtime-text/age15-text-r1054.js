// R1054 — 15세 이용가 서사 순화(사용자 2026-11-15 11:18Z "4곳 모두 순화 암시정도로" — 서사 불변 규칙의 이번 예외, 사용자 허락).
//  원본 정본 파일(story-canon-r106-data.js · samong-text-r103.js · story-source/*.txt)은 그대로 두고, 게임이 읽기 전에(story-canon-r106.js 가
//  문단을 다른 데이터로 옮기기 전) 그 4문단만 같은 뜻의 암시 문장으로 바꿔 끼운다. 세 모드·숨겨진 챕터(사몽)가 같은 데이터를 쓰므로 모두 같이 바뀐다.
//  ① 1부 늪(dist02): '죽은 수호자들의 머리' → '쓰러진 수호자들이 남긴 흔적'
//  ② 1부 주사실(ep1a09): 약 이름·주사 행위·쾌감 서술 → 작은 약병, 유혹을 이기지 못함, 흐릿한 기억
//  ③ 사몽 R-09: 뼈 꺾기·피 나도록 뜯기·'자기 절단의 광경' → 몸을 구겨 넣고 이름 글자를 지움, '처참한 광경'
//  ④ 사몽 R-00: '손목 동맥을 가로지른 … 자해의 흉터' → '손목 안쪽에 오래된 흉터'
//  바뀐 문장은 녹음이 없어 서사 음성은 그 문장만 건너뛴다(녹음 없는 곳은 보류 규칙). 원문이 바뀌어 못 찾으면 건드리지 않고 missed 로 센다.
(()=>{'use strict';
if(window.__STORYWORLD_AGE15_TEXT_R1054__)return;
const REV='R1054-text-2',stats={applied:0,missed:0,errors:0},log=[];
const EDITS=[
 {at:['canon','dist02'],from:'하지만 물을 헤치며 조금 더 다가가고 나니 그제야 그 얼굴들을 알아볼 수 있었다. 그것들은 죽은 수호자들의 머리였다.',
  to:'하지만 물을 헤치며 조금 더 다가가고 나니 그제야 그것이 열매가 아니라는 것을 알 수 있었다. 그것들은 먼저 쓰러진 수호자들이 남긴 흔적이었다.'},
 {at:['canon','ep1a09'],multi:[
  ['서랍 깊은 곳에서 펜타닐이라고 적힌 약병을 찾았다. 나는 약의 이름을 보고도 그것이 무엇인지 제대로 생각하지 않았다.','서랍 깊은 곳에서 작은 약병을 찾았다. 나는 그것이 무엇인지 제대로 생각하지 않았다.'],
  ['나는 문을 잠근 채 끝내 주사기에 손을 대 버렸다. 이내 고통이 줄어들었다. 따뜻한 빛이 퍼지고, 천사가 나를 끌어안는 것 같은 감각이 들었다.','나는 문을 잠근 채 끝내 그 유혹을 이기지 못했다. 그 뒤의 일은 흐릿하다. 따뜻한 빛이 퍼지고, 천사가 나를 끌어안는 것 같은 감각만 남았다.']]},
 {at:['samong','R-09'],from:'원고지의 좁은 칸에 육신이 걸려 들어가지 않으면 스스로의 뼈를 꺾어 몸을 기형적으로 줄였고, 부모가 물려준 본명이 너무 길어 칸을 넘어가면 제 손으로 이름의 글자를 피가 나도록 뜯어 냈다. 내 앞의 한 사람은 자기 이름의 마지막 글자를 살점처럼 떼어 내다가, 차마 버리지 못하고 다시 가슴에 움켜쥐며 오열했다. 나는 그 참혹한 자기 절단의 광경을',
  to:'원고지의 좁은 칸에 육신이 걸려 들어가지 않으면 억지로 몸을 웅크려 구겨 넣었고, 부모가 물려준 본명이 너무 길어 칸을 넘어가면 제 손으로 이름의 글자를 지워 냈다. 내 앞의 한 사람은 자기 이름의 마지막 글자를 지우다가, 차마 버리지 못하고 다시 가슴에 움켜쥐며 오열했다. 나는 그 처참한 광경을'},
 {at:['samong','R-00'],from:'손목 동맥을 가로지른 깊고 오래된 자해의 흉터가 드러났다.',to:'손목 안쪽에 남은 오래된 흉터가 드러났다.'}];
// R1054-2(사용자 11:33Z "자막이랑 모든것도 맞춰야해"): 같은 장면의 예전 판 문장도 게임 안 여러 곳에 남아 있다
//  (index.html 안 portable-data JSON · R54 캠페인 · R75 서사 데이터 — 기록·도감·영화·무한생존이 읽는 곳). 같은 뜻으로 함께 바꾼다.
const OLD=[
 ['늪을 지배하는 악마의 뿔에는 죽은 수호자들의 머리가 매달려 있었다.','늪을 지배하는 악마의 뿔에는 쓰러진 수호자들이 남긴 흔적이 매달려 있었다.'],
 ['펜타닐이라는 이름이 적혀 있었다. ',''],['펜타닐이라는 이름이 적혀 있었다.',''],
 ['문을 잠근 나는 주사기에 손을 대고 말았다. 그러자 고통이 멀어지고 따뜻한 빛이 퍼져갔다.','문을 잠근 나는 끝내 그 유혹을 이기지 못했다. 그 뒤의 일은 흐릿하다. 따뜻한 빛이 퍼져갔다.']];
const PAIRS=[];for(const E of EDITS)for(const pr of (E.multi||[[E.from,E.to]]))PAIRS.push(pr);for(const pr of OLD)PAIRS.push(pr);
// 원래 음성(R381 문장 녹음)이 순화 전 문장을 그대로 말하지 않도록: 바뀐 글의 '예전 문장'들의 녹음 id 를 목록에서 뺀다.
//  문장 나누기는 영화 모드(R370)·서사 음성(R1044)과 같은 규칙, id = sha1(문장).slice(0,16)(voice-r381.js idOf 와 같음).
function utf8(str){if(typeof TextEncoder==='function')return new TextEncoder().encode(str);const out=[];for(const ch of String(str)){let c=ch.codePointAt(0);
 if(c<128)out.push(c);else if(c<2048)out.push(192|c>>6,128|c&63);else if(c<65536)out.push(224|c>>12,128|c>>6&63,128|c&63);else out.push(240|c>>18,128|c>>12&63,128|c>>6&63,128|c&63);}return out;}
function sha1(str){const b=utf8(str),n=b.length,words=((n+8>>6)+1)*16,w=new Int32Array(words);
 for(let i=0;i<n;i++)w[i>>2]|=b[i]<<(24-(i%4)*8);w[n>>2]|=0x80<<(24-(n%4)*8);w[words-1]=n*8;
 let h0=0x67452301,h1=0xEFCDAB89|0,h2=0x98BADCFE|0,h3=0x10325476,h4=0xC3D2E1F0|0;const W=new Int32Array(80);const rl=(x,c)=>(x<<c)|(x>>>(32-c));
 for(let o=0;o<words;o+=16){for(let t=0;t<16;t++)W[t]=w[o+t];for(let t=16;t<80;t++)W[t]=rl(W[t-3]^W[t-8]^W[t-14]^W[t-16],1);let a=h0,b2=h1,c=h2,d=h3,e=h4;
  for(let t=0;t<80;t++){const f=t<20?(b2&c)|(~b2&d):t<40?b2^c^d:t<60?(b2&c)|(b2&d)|(c&d):b2^c^d,k=t<20?0x5A827999:t<40?0x6ED9EBA1:t<60?0x8F1BBCDC|0:0xCA62C1D6|0;
   const tmp=(rl(a,5)+f+e+k+W[t])|0;e=d;d=c;c=rl(b2,30);b2=a;a=tmp;}h0=(h0+a)|0;h1=(h1+b2)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;}
 return [h0,h1,h2,h3,h4].map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');}
const idOf=t=>sha1(String(t||'').trim()).slice(0,16);
function sentences(text){const out=[];String(text||'').split(/\n\s*\n/).forEach(para=>{const p=para.replace(/\s+/g,' ').trim();if(!p)return;
 for(const raw of (p.match(/[^.?!…。]+(?:[.?!…。]+["”’」』)]*|$)/g)||[p])){const t=raw.trim();if(t)out.push(t);}});return out;}
const blockIds=new Set(),blockText=new Set();
function noteChange(a,b){try{const keep=new Set(sentences(b));for(const t of sentences(a))if(!keep.has(t)){blockText.add(t);blockIds.add(idOf(t));}}catch(_){stats.noteErrors=(stats.noteErrors||0)+1;}}
function fix(t){if(typeof t!=='string'||t.length<8)return t;let o=t;for(const [a,z] of PAIRS)if(o.includes(a))o=o.split(a).join(z);if(o!==t){noteChange(t.replace(/\\n/g,'\n'),o.replace(/\\n/g,'\n'));stats.strings=(stats.strings||0)+1;}return o;}
function walk(x,seen=new Set()){if(!x||typeof x!=='object'||seen.has(x))return;seen.add(x);
 for(const k of Object.keys(x)){const v=x[k];if(typeof v==='string'){const f=fix(v);if(f!==v){try{x[k]=f;}catch(_){}if(x[k]!==f)stats.frozenMiss=(stats.frozenMiss||0)+1;}}else if(v&&typeof v==='object')walk(v,seen);}}
function blocksOf(at){try{if(at[0]==='canon')return window.__STORYWORLD_STORY_CANON_R106__?.zones?.[at[1]]?.blocks||[];
 return window.__STORYWORLD_SAMONG_TEXT_R103__?.sections?.[at[1]]?.blocks||[];}catch(_){return[];}}
function apply(E){try{const pairs=E.multi||[[E.from,E.to]];let done=0;
 for(const b of blocksOf(E.at)){const P=b&&b.paras;if(!Array.isArray(P)||Object.isFrozen(P))continue;
  for(let i=0;i<P.length;i++){let t=P[i];if(typeof t!=='string')continue;for(const [a,z] of pairs)if(t.includes(a)){t=t.split(a).join(z);done++;}if(t!==P[i]){noteChange(P[i],t);P[i]=t;}}}
 if(done>=pairs.length){stats.applied++;log.push(E.at.join(':'));}else{stats.missed++;log.push('missed '+E.at.join(':'));}}catch(e){stats.errors++;}}
// 정본(1부)은 지금 바로(story-canon-r106.js 가 옮기기 전). 사몽 원문은 이 파일 뒤에 실리므로 그 전역이 놓이는 순간 바꾼다(놓인 값은 그대로 돌려줌).
for(const E of EDITS)if(E.at[0]==='canon')apply(E);
const samongEdits=EDITS.filter(E=>E.at[0]==='samong');
function onGlobal(K,fn){if(window[K]){fn(window[K]);return;}try{let v;Object.defineProperty(window,K,{configurable:true,enumerable:true,get:()=>v,
 set:x=>{v=x;try{Object.defineProperty(window,K,{value:x,writable:true,configurable:true,enumerable:true});}catch(_){}try{fn(x);}catch(e){stats.errors++;}}});}catch(e){stats.errors++;}}
onGlobal('__STORYWORLD_SAMONG_TEXT_R103__',()=>{for(const E of samongEdits)apply(E);});
// 예전 판 서사(이 파일 앞에 실린 데이터)
try{walk(window.__STORYWORLD_CAMPAIGN_DATA_R54__);}catch(e){stats.errors++;}
try{walk(window.__STORYWORLD_STORY_DATA_R75__);}catch(e){stats.errors++;}
try{const el=typeof document!=='undefined'&&document.getElementById&&document.getElementById('portable-data');if(el&&typeof el.textContent==='string'){const t=el.textContent;let o=t;
 for(const [a,z] of PAIRS)if(o.includes(a))o=o.split(a).join(z);if(o!==t){el.textContent=o;stats.portable=1;
  // JSON 안 문단 단위로 바뀐 문장 기록(음성 막기)
  for(const [a] of PAIRS)if(t.includes(a))for(const t2 of sentences(a))if(!o.includes(t2)){blockText.add(t2);blockIds.add(idOf(t2));}}}}catch(e){stats.errors++;}
// 음성 목록(R381)은 이 파일 뒤에 실린다 → 놓이는 순간 막을 id 를 뺀다.
onGlobal('__STORYWORLD_VOICE_R381_DATA__',D=>{const ids=D&&D.ids;if(!Array.isArray(ids)||Object.isFrozen(ids))return;for(let i=ids.length-1;i>=0;i--)if(blockIds.has(ids[i])){ids.splice(i,1);stats.voiceBlocked=(stats.voiceBlocked||0)+1;}});
// 마지막 안전망: 서사 창에 넘어가는 장면 글도 한 번 더 고친다(어느 길로 들어와도 같은 문장).
function wrapScenes(){try{if(typeof playScenes==='function'&&!playScenes.__r1054){const base=playScenes;const w=function(list,...a){try{if(Array.isArray(list))for(const s of list)if(s&&typeof s.text==='string'){const f=fix(s.text);if(f!==s.text)s.text=f;}}catch(_){}return base.call(this,list,...a);};w.__r1054=true;playScenes=w;return true;}}catch(_){}return false;}
if(!wrapScenes()&&typeof window.addEventListener==='function')window.addEventListener('DOMContentLoaded',wrapScenes);
window.__STORYWORLD_AGE15_TEXT_R1054__=Object.freeze({revision:REV,fix,idOf,sentences,blocked:()=>[...blockIds],inspect:()=>({revision:REV,...stats,log:[...log],blockedIds:blockIds.size,blockedSentences:[...blockText]})});
})();
