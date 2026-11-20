// R1260 사몽 먹 번짐 터지는 순간도 전용 시트 그림(사용자 2026-11-20 02:51Z "시트그림으로 바꾸셈") — 헤드리스 Chromium(실기기·GPU 아님).
//  ① 사몽 방 육망성 바닥 공격이 터진 뒤(예고 끝) 먹 번짐 시트(r1206 ink-bloom-warn8) 이미지로 그리고 코드 도형(fill/stroke) 0, 핏빛 고리(r1229:hex) 0
//  ② 터진 뒤 끝무렵(남은 수명 0.1초)엔 옅어진다(globalAlpha < 0.5) / 경계: 본편 핏빛 육망성은 그대로 R1229 고리 시트
//  ③ 페이지 오류 0
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const errs=[];const {p}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await go(p,'dist06');
const R=await p.evaluate(async()=>{setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);
 const grab=(fn,secs)=>new Promise(res=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const out=[];const t0=time;three.render=function(f){const r=base.apply(this,arguments);try{out.push(fn(f.commands||[]));}catch(e){out.push({err:String(e)});}return r;};const g=()=>{if(time-t0>=secs){three.render=base;return res(out);}setTimeout(g,60);};g();});
 const IP='assets/r1206/fx/ink-bloom-warn8.webp';for(let i=0;i<60&&!readyImage(IP);i++){try{addImage(IP);}catch(_){}await new Promise(r=>setTimeout(r,250));}
 const one=async(samong,left)=>{const prev=room.samongR103;if(samong)room.samongR103={};
  const h={id:'t1260'+(samong?'s':'b')+left,type:'field',owner:'x',x:player.x+1,y:player.y,radius:1.7,age:1.4,warning:1.3,life:1.4+left,damage:0,lastHit:1e9,samongPattern:'r170-hex',r170:{tower:'x',pal:{main:{a:[90,12,20],b:[255,120,110]},sub:{a:[40,6,10],b:[200,60,60]}},seed:1,burst:true}};hazards.push(h);
  const keep=setInterval(()=>{h.age=1.4;},20);
  const G=await grab(cs=>{const mine=cs.filter(c=>String(c.owner?.id||'')==='r170:hex:'+h.id);const ink=mine.filter(c=>c.kind==='image'&&/ink-bloom-warn8/.test(String(c.sourcePath||c.image?.src||'')));
   return {ink:ink.length,alpha:ink.map(c=>c.style?.globalAlpha??1),shape:mine.filter(c=>c.kind!=='image'&&c.kind!=='text').length,ring:cs.filter(c=>String(c.key||'').startsWith('r1229:hex:'+h.id)).length};},.6);
  clearInterval(keep);hazards.splice(hazards.indexOf(h),1);if(samong){if(prev===undefined)delete room.samongR103;else room.samongR103=prev;}
  const s=k=>G.reduce((a,x)=>a+(x[k]||0),0);return {frames:G.length,ink:s('ink'),shape:s('shape'),ring:s('ring'),alpha:Math.max(0,...G.flatMap(x=>x.alpha||[]))};};
 return {burst:await one(true,99),late:await one(true,.1),story:await one(false,99)};});
ok('① samong burst is drawn with the ink-bloom sheet, no code shapes, no blood ring',R.burst.ink>0&&R.burst.shape===0&&R.burst.ring===0,R.burst);
ok('② fades near the end of its life (alpha < 0.5)',R.late.ink>0&&R.late.alpha<.5,R.late);
ok('② boundary: story blood hexagram still swapped to the R1229 ring sheet',R.story.ring>0,R.story);
ok('③ no page errors',errs.length===0,errs.slice(0,3));
console.log(`R1260 browser ${n-bad}/${n}`);await b.close();if(bad)process.exit(1);
