// R890 브라우저 검사(헤드리스 소프트웨어 렌더링 — 그래픽·실기기 검증 아님). 사용: SW_URL=http://127.0.0.1:4396/m0/ node top-left-browser.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';import assert from 'node:assert';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});let n=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m,x!==undefined?JSON.stringify(x).slice(0,300):'');assert.ok(c,m);n++;};
const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const rect=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {l:r.left,t:r.top,r:r.right,b:r.bottom,vis:cs.visibility!=='hidden'&&cs.display!=='none'};},sel);
const overlap=(a,c)=>!(a.r<=c.l||c.r<=a.l||a.b<=c.t||c.b<=a.t);
for(const zone of ['dist06','last302']){
 await go(p,zone);await p.waitForTimeout(800);
 const sum=await p.evaluate(()=>({s:document.getElementById('questInlineSummary').textContent,pend:typeof firstPending==='function'?firstPending(layer)?.id:null,zone}));
 console.log(zone,JSON.stringify(sum));
 ok(!/입니다\. 열린 길로/.test(sum.s),zone+' 길잡이 줄에 옛 긴 문장이 없다',sum.s);
 const m=/→\s*(.+)$/.exec(sum.s);ok(!m||sum.s.split(m[1]).length===2,zone+' 목적지는 한 번만',sum.s);
 await p.screenshot({path:OUT+'/'+zone+'-hud.png',clip:{x:0,y:0,width:520,height:140}});
 // R177 종이
 await p.evaluate(()=>{window.__STORYWORLD_STORY_COLLECT_R177__.show({key:'t:'+Math.random(),title:'시험 쪽지',form:'shard',text:'기억 조각 시험 글입니다.\n\n둘째 문단.'});});await p.waitForTimeout(500);
 const q=await rect('#quest'),d=await rect('#r177Doc');console.log('quest',JSON.stringify(q),'doc',JSON.stringify(d));
 ok(d&&d.vis&&d.l<200&&d.l>=0,zone+' 기억 조각 종이가 왼쪽',d);ok(d.t>=q.b,zone+' 기억 조각 종이가 길잡이 패널 아래(겹침 없음)',{q,d});
 await p.screenshot({path:OUT+'/'+zone+'-shard.png'});
 await p.evaluate(()=>{document.getElementById('r177Doc')?.click();for(let i=0;i<20;i++)document.getElementById('r177Doc')&&!document.getElementById('r177Doc').hidden&&document.querySelector('#r177Doc [data-r182=close]')?.click();});
 // R255 서사 창
 await p.evaluate(()=>{window.__r890done=false;playScenes([{id:room.id,key:'STORY:'+room.id+':pre:0',part:'pre',title:'시험 서사',text:'보스 서사 시험 글입니다. '.repeat(12)}],()=>{window.__r890done=true;});});
 await p.waitForFunction(()=>modal===true,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(600);
 const info=await p.evaluate(()=>({modal,cls:document.getElementById('panel')?.className,cin:!!document.getElementById('r255Cinema')}));console.log('modal',JSON.stringify(info));
 if(info.cin){await p.keyboard.press('Escape');await p.waitForTimeout(400);}
 if(info.modal){const pn=await rect('#panel'),q2=await rect('#quest');console.log('panel',JSON.stringify(pn),'quest',JSON.stringify(q2));ok(/r255-doc/.test(info.cls),zone+' R255 서사 종이 모양',info.cls);ok(pn.l<200,zone+' 서사 창이 왼쪽',pn);ok(pn.t>=q2.b-1,zone+' 서사 창이 길잡이 패널 아래',{pn,q2});await p.screenshot({path:OUT+'/'+zone+'-story.png'});}
 else console.log('NOTE 서사 창을 못 열었음(미검증)');
 await skip(p);
}
ok(errs.length===0,'페이지 오류 없음',errs);console.log(n+' checks');await b.close();
