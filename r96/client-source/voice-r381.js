// R381 — 녹음 서사 음성(사용자 2026-11-07 "처음부터 7대죄 에피소드까지만 진행해봐" → 청취 후 "좋네 이 음성으로 진행시켜").
//  · Qwen3-TTS 1.7B CustomVoice(Sohee, Apache-2.0)로 사용자 PC에서 만든 문장별 mp3(assets/r381/voice/<id>.mp3)를 재생한다.
//  · <id> = SHA-1(문장)[:16]. 문장은 영화 모드(R370) sentences() 결과와 같다(정본 story-canon-r106-data.js 의 문단 → 문장).
//    정본 문장이 바뀌면 해시가 달라져 녹음이 없는 문장으로 보고 브라우저 음성으로 돌아간다(엉뚱한 녹음을 틀지 않음).
//  · 목록은 voice-r381-data.js(__STORYWORLD_VOICE_R381_DATA__.ids). 영화 모드가 문장마다 has()/play() 를 부른다.
(()=>{'use strict';
if(window.__STORYWORLD_VOICE_R381__)return;
const D=window.__STORYWORLD_VOICE_R381_DATA__||{ids:[]},BASE=D.base||'assets/r381/voice/',IDS=new Set(D.ids||[]);
const stats={has:0,miss:0,played:0,ended:0,errors:0,stalls:0,preloaded:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// 동기 SHA-1(UTF-8) — 영화 모드가 문장을 고르는 순간 바로 판단해야 하므로 crypto.subtle(비동기) 대신 쓴다.
function sha1(str){const b=new TextEncoder().encode(str),n=b.length,words=((n+8>>6)+1)*16,w=new Int32Array(words);
 for(let i=0;i<n;i++)w[i>>2]|=b[i]<<(24-(i&3)*8);w[n>>2]|=0x80<<(24-(n&3)*8);w[words-1]=n*8;
 let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;const x=new Int32Array(80);
 for(let o=0;o<words;o+=16){for(let t=0;t<16;t++)x[t]=w[o+t];for(let t=16;t<80;t++){const v=x[t-3]^x[t-8]^x[t-14]^x[t-16];x[t]=v<<1|v>>>31;}
  let a=h0,bb=h1,c=h2,d=h3,e=h4;
  for(let t=0;t<80;t++){const f=t<20?(bb&c|~bb&d)+0x5A827999:t<40?(bb^c^d)+0x6ED9EBA1:t<60?(bb&c|bb&d|c&d)+0x8F1BBCDC:(bb^c^d)+0xCA62C1D6;
   const tmp=(a<<5|a>>>27)+f+e+x[t]|0;e=d;d=c;c=bb<<30|bb>>>2;bb=a;a=tmp;}
  h0=h0+a|0;h1=h1+bb|0;h2=h2+c|0;h3=h3+d|0;h4=h4+e|0;}
 return [h0,h1,h2,h3,h4].map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');}
const idOf=t=>sha1(String(t||'').trim()).slice(0,16);
const url=id=>BASE+id+'.mp3';
function has(text){const ok=IDS.has(idOf(text));ok?stats.has++:stats.miss++;return ok;}
// 다음 문장 미리 받기(한두 개만 기억).
const pre=new Map();
function preload(text){try{const id=idOf(text);if(!IDS.has(id)||pre.has(id))return false;const a=new Audio();a.preload='auto';a.src=url(id);pre.set(id,a);stats.preloaded++;
 while(pre.size>3)pre.delete(pre.keys().next().value);return true;}catch(e){fail(e);return false;}}
let cur=null;
function stop(){const c=cur;cur=null;if(!c)return;c.dead=true;clearTimeout(c.stallT);try{c.a.pause();c.a.removeAttribute('src');c.a.load();}catch(_){}}
// 재생: 끝·오류는 한 번만 알린다. 받기가 8초 넘게 멈추면 오류로 본다(영화 모드가 브라우저 음성으로 돌아감).
function play(text,o={}){stop();const id=idOf(text);if(!IDS.has(id))return null;
 const a=pre.get(id)||new Audio();pre.delete(id);if(!a.src)a.src=url(id);
 const h={id,a,dead:false,stallT:0};cur=h;let fired=false;
 const fin=(ok,why)=>{if(fired||h.dead)return;fired=true;clearTimeout(h.stallT);if(cur===h)cur=null;if(ok){stats.ended++;o.onend?.();}else{try{a.pause();}catch(_){}fail(why||'audio error');o.onerror?.();}};
 try{a.preservesPitch=true;a.playbackRate=clamp(+o.rate||1,.85,1.2);a.volume=clamp(Number.isFinite(+o.volume)?+o.volume:.8,0,1);}catch(_){}
 a.onended=()=>fin(true);a.onerror=()=>fin(false,'load '+id);
 h.stallT=setTimeout(()=>{if(!fired&&!h.dead&&a.currentTime<.05){stats.stalls++;try{a.pause();}catch(_){}fin(false,'stall '+id);}},8000);
 a.onplaying=()=>{clearTimeout(h.stallT);o.onstart?.();};
 try{const p=a.play();stats.played++;if(p&&p.catch)p.catch(e=>fin(false,e?.name||'play rejected'));}catch(e){fin(false,e);}
 return Object.freeze({id,stop:()=>{if(cur===h)stop();else{h.dead=true;try{a.pause();}catch(_){}}},duration:()=>a.duration||NaN});}
// 탭을 숨기면 멈추고 돌아오면 이어서.
addEventListener('visibilitychange',()=>{try{if(!cur)return;if(document.hidden)cur.a.pause();else cur.a.play()?.catch?.(()=>{});}catch(_){}});
window.__STORYWORLD_VOICE_R381__=Object.freeze({revision:'R381-voice-1',count:IDS.size,sample:D.sample||'',has,play,stop,preload,idOf,url,
 inspect:()=>({revision:'R381-voice-1',count:IDS.size,model:D.model||'',speaker:D.speaker||'',playing:cur?.id||null,stats:{...stats},lastError})});
})();
