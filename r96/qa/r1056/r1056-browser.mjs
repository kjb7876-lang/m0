// R1056 브라우저 확인(헤드리스, 귀로 듣는 검증 아님): 실제 게임에서 ① 국악 5곡이 Chromium 에서 해독됨 ② 동양 지역에 들어가면 R308 이 국악을 틀고
// ③ 서양 지역(dist00)은 그대로 ④ 같은 곡 맵 이동은 이어 틀기 ⑤ 페이지 오류 0.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1056/r1056-browser.mjs   (결과 r96/qa/r1056/browser-results.json)
import {chromium,boot,go} from '../r444/lib.mjs';
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
const errs=[];const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const res={};
res.decode=await p.evaluate(async()=>{const ix=await (await fetch('assets/r308/bgm/index.json')).json();const ac=new (window.AudioContext||window.webkitAudioContext)();
 const out=[];for(const[id,t]of Object.entries(ix.tracks).filter(([,t])=>t.origin==='R1056')){try{const buf=await ac.decodeAudioData(await (await fetch(t.path)).arrayBuffer());out.push({id,sec:+buf.duration.toFixed(1),ch:buf.numberOfChannels});}catch(e){out.push({id,err:String(e)});}}return out;});
ok(res.decode.length===5&&res.decode.every(d=>d.sec>100),'국악 해독 '+JSON.stringify(res.decode));
await p.evaluate(()=>{settings.music=true;settings.bgm=.6;});
const at=async z=>{await go(p,z);await p.mouse.click(5,5);await p.waitForFunction(z=>{const a=window.__STORYWORLD_BGM_MAP_R308__.inspect().active;return a&&a.zone===z;},z,{timeout:60000}).catch(()=>{});await p.waitForTimeout(3500);
 return p.evaluate(()=>{const s=window.__STORYWORLD_BGM_MAP_R308__.inspect();return {active:s.active,decks:s.decks,failed:s.failed,stats:s.stats,src:[...document.querySelectorAll('audio')].length};});};
res.zones={};
for(const[z,want]of [['dist00',null],['restU2','gugak-hwando'],['last304','gugak-hwando'],['last301','gugak-hwando-climax'],['last302','gugak-village'],['last303','gugak-village-climax']]){
 const s=await at(z);res.zones[z]=s;const tr=s.active?.track;
 if(want)ok(tr===want&&!s.active.paused&&!s.failed.includes(tr),z+' → '+tr+' (재생 '+(s.active&&!s.active.paused)+', 실패 '+s.failed.join()+')');
 else ok(tr&&!/^gugak/.test(tr),z+' → 서양 곡 그대로 '+tr);}
ok(res.zones.last304.stats.continued>res.zones.restU2.stats.continued,'restU2→last304 같은 곡 이어 틀기');
ok(errs.length===0,'페이지 오류 0'+(errs.length?' '+errs[0]:''));
res.errors=errs;res.at=new Date().toISOString();fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify(res,null,1));
console.log(`\nR1056 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
