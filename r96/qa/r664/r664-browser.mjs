// R664 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 지역을 옮기면 환경음 소스가 실제로 만들어지고(loop·교차 페이드·한 번만 받기),
// 소스 출력이 무음이 아니며, 사몽 구역에서는 멈추고, 오류가 없는지. SW_URL=http://127.0.0.1:4396/ node r96/qa/r664/r664-browser.mjs
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
const reqs=[];p.on('request',r=>{if(/assets\/r664\//.test(r.url()))reqs.push(r.url().split('/').pop());});
await p.evaluate(async()=>{try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=.8;
 window.__amb={an:[],srcs:0};const A=audioContext,P=AudioBufferSourceNode.prototype,c=P.connect;
 P.connect=function(...a){if(this.loop&&this.buffer&&this.buffer.duration>10&&!this.__tapped){this.__tapped=true;window.__amb.srcs++;const an=A.createAnalyser();an.fftSize=2048;this.__an=an;c.call(this,an);window.__amb.an.push(an);}return c.apply(this,a);};});
const waitBed=(name)=>p.waitForFunction(n=>window.__STORYWORLD_AMBIENCE_R664__.inspect().bed===n,name,{timeout:60000});
const level=()=>p.evaluate(()=>{const o=window.__amb,an=o.an[o.an.length-1];const d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);let s=0,pk=0;for(const v of d){s+=v*v;pk=Math.max(pk,Math.abs(v));}return {rms:Math.sqrt(s/d.length),peak:pk,t:audioContext.currentTime,state:audioContext.state};});
const out={};
await go(p,'dist00');await waitBed('wind');out.wind=await level();const i1=await p.evaluate(()=>window.__STORYWORLD_AMBIENCE_R664__.inspect());
await go(p,'ep1a08');await waitBed('hall');out.hall=await level();
await go(p,'ep1a09');await p.waitForTimeout(1500);const i2=await p.evaluate(()=>window.__STORYWORLD_AMBIENCE_R664__.inspect());
await go(p,'murder01');await waitBed('water');out.water=await level();
await p.waitForTimeout(500);const lv2=await level();
const r=await p.evaluate(()=>({srcs:window.__amb.srcs,i:window.__STORYWORLD_AMBIENCE_R664__.inspect(),bus:null}));
console.log(JSON.stringify({out,lv2,srcs:r.srcs,stats:r.i.stats,loaded:r.i.loaded,reqs}));
for(const k of ['wind','hall','water'])ok(out[k].state==='running'&&out[k].rms>1e-4&&out[k].peak<.5,k+' 소스 출력이 무음 아님·너무 크지 않음(rms '+out[k].rms.toExponential(2)+', peak '+out[k].peak.toFixed(3)+')');
ok(i1.bed==='wind'&&i2.bed==='hall'&&i2.stats.switches===i1.stats.switches+1&&r.i.stats.switches===i1.stats.switches+2,'시작 hub(crowd)→wind→hall→water 로만 바뀜, 같은 hall 구역(ep1a09)에서는 새로 만들지 않음(switches '+r.i.stats.switches+')');
ok(reqs.filter(x=>/\.ogg$/.test(x)).length===3&&new Set(reqs.filter(x=>/\.ogg$/.test(x))).size===3,'ogg 를 종류당 한 번만 받음('+reqs.join(',')+')');
ok(r.i.stats.errors===0&&r.i.failed.length===0,'환경음 오류 0');ok(errs.length===0,'페이지 오류 0 ('+errs.slice(0,2).join('|')+')');
console.log('\nR664 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
