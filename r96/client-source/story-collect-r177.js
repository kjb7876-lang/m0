// R177 — 모든 서사를 수집물로(사용자 2026-10-31 "모든 서사 텍스트는 쪽지, 기억조각, 진료기록, 누군가의 보고서 수집으로 나오게, 서사에 맞게 쪽지 형태는 알아서").
//  · 저절로 뜨던 서사 장면 가운데 뒤에 진행이 걸리지 않은 것(맵에 들어설 때 서사·사몽 구역 cue·보스 등장 배너 등)은 창으로 막지 않고
//    영웅 곁 바닥에 수집물로 떨어뜨린다. 서사는 '읽음'으로 기록되고, 배너 같은 뒤따름은 바로 이어진다.
//  · 읽어야 다음이 열리는 서사(보스 문·출구·최종장 단계)와 E 로 직접 연 서사는 예전처럼 그 자리에서 보이되, 같은 네 가지 종이 모양으로 보인다.
//  · 가까이 가면 줍고, 오른쪽에 그 서사에 맞는 모양의 종이로 펼쳐진다(누르면 닫힘, 메뉴의 쪽지 모음에 쌓임).
//      진료기록 — 윤서하의 진료기록·경과기록: 병원 서식(칸·줄)       기억 조각 — '…의 기억' 1인칭 독백·사몽: 깨진 유리 조각
//      누군가의 보고서 — 서술자 없는 3인칭 서술(에필로그 등): 타자 보고서     쪽지 — 그 밖: 바랜 종이 쪽지
//  · 줍지 않고 맵을 떠나면 쪽지 모음에 넣고 알린다(잃어버리지 않게).
//  문장·순서는 원문 그대로이고 모양만 고른다. 직접 E 로 여는 기록(단서·진술·출석부)과 엔딩은 예전처럼 바로 보인다.
//  협동 모드·선택지가 있는 장면은 그대로. storyworld.r177.collect {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_STORY_COLLECT_R177__)return;
const REV='R177-story-collect-1',KEY='storyworld.r177.collect';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={dropped:0,picked:0,autoKept:0,shown:0,immediate:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const T=()=>typeof time==='number'?time:performance.now()/1000;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FORMS={chart:'진료기록',shard:'기억 조각',report:'누군가의 보고서',note:'쪽지'};
// 직접 연 기록·엔딩·선택지는 그대로.
const manual=s=>/:(clue|stmt|statement|book|cut|record|journal|all)(:|$)|:sm105:|:ending:|epilogue-abyss/i.test(String(s?.key||''))||!!s?.r105Record||Array.isArray(s?.choices)&&s.choices.length>0;
let interacting=0;
const freeKey=s=>/^DREAM:(sz115:[^:]+:(cue|boss)|sm103:[^:]+:(s|m|a|b)):/.test(String(s?.key||''));// 뒤따름이 배너뿐인 사몽 서사(R139 와 같은 기준)
function formOf(rows){const t=rows.map(s=>[s.narrator,s.record?.narrator,s.title,s.record?.title,s.key].join(' ')).join(' ');
 if(/진료|경과기록|Progress Note|정신건강의학과/.test(t))return 'chart';
 if(/보고|관찰기록|조사서|기록지/.test(t))return 'report';
 const narr=rows.map(s=>String(s.narrator||s.record?.narrator||'').replace(/[〈〉]/g,'').trim()).filter(Boolean);
 if(!narr.length)return 'report';// 서술자 없는 3인칭 서술
 if(narr.some(n=>/기억/.test(n))||String(rows[0]?.key||'').startsWith('DREAM:'))return 'shard';
 return 'note';}
function live(){return prefs.on&&solo()&&typeof started!=='undefined'&&started&&!(typeof loading!=='undefined'&&loading)&&typeof room!=='undefined'&&room&&typeof player==='object'&&player&&player.hp>0;}
function spot(){const ok=(x,y)=>{try{return typeof blocked!=='function'||!blocked(x,y,.3,room);}catch(_){return true;}};const taken=docsHere();
 for(let k=0;k<16;k++){const a=k*.83+.4,r=1.4+.12*k,x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(ok(x,y)&&!taken.some(p=>Math.hypot(p.x-x,p.y-y)<.9))return{x,y};}return{x:player.x+.6,y:player.y+.6};}
let serial=0;const DOCS=new Map();// 맵 id → 바닥의 수집물(맵 소품 목록에는 넣지 않는다)
function docsHere(){const k=String(room?.id||'');if(!DOCS.has(k))DOCS.set(k,[]);return DOCS.get(k);}
const SENT={type:'r177-docs',x:0,y:0,age:0,life:Infinity,r177Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{const i=typeof effects!=='undefined'?effects.indexOf(SENT):-1;if(i>=0)effects.splice(i,1);}catch(_){}}
function drop(rows){const form=formOf(rows),first=rows[0]||{},title=String(first.title||first.record?.title||first.chapter||FORMS[form]).slice(0,120),narr=String(first.narrator||first.record?.narrator||'').replace(/[〈〉]/g,'').trim();
 const text=rows.map(s=>String(s.text||'').trim()).filter(Boolean).join('\n\n'),place=(()=>{try{return regionById?.[first.id||room.id]?.title||'';}catch(_){return'';}})();
 const key='r177:'+(rows.map(s=>s.key||'').join('|')||('n'+(++serial)));const at=spot();
 const doc={key,form,title,narr,text,place};docsHere().push({id:'r177:doc:'+(++serial),x:at.x,y:at.y,r177Doc:doc,t0:T()});arm();
 stats.dropped++;try{if(typeof toast==='function')toast(FORMS[form]+'이(가) 떨어졌습니다 · 가까이 가면 주워집니다.',2.2);}catch(_){}}
function keep(doc){try{window.__STORYWORLD_PLAY_R169__?.collect?.({key:doc.key,title:FORMS[doc.form]+' · '+doc.title,narr:doc.narr,text:doc.text,place:doc.place});}catch(e){fail(e);}}
// ---- 펼친 종이 ----
function css(){if(document.getElementById('r177DocCss'))return;const s=document.createElement('style');s.id='r177DocCss';
 s.textContent='#r177Doc{position:fixed;right:max(14px,env(safe-area-inset-right,0px));top:110px;z-index:41;width:min(360px,84vw);max-height:52vh;overflow:auto;padding:14px 16px 12px;cursor:pointer;box-shadow:0 12px 32px #000b}#r177Doc[hidden]{display:none}'
  +'#r177Doc .h{display:block;margin-bottom:6px}#r177Doc p{margin:0 0 8px;white-space:pre-wrap}#r177Doc .foot{display:block;text-align:right;font:11px "Malgun Gothic",sans-serif;opacity:.75}'
  // 쪽지: 바랜 종이
  +'#r177Doc.note{background:linear-gradient(172deg,#efe4cf,#d9c5a6);color:#2a1d16;border:1px solid #8a6a4a;border-radius:2px;transform:rotate(-.6deg);font:14px/1.75 "Gowun Batang","Noto Serif KR",serif;box-shadow:0 12px 32px #000b,inset 0 0 28px #7a4a2a3a}'
  +'#r177Doc.note .h{font:700 12px/1.4 "Malgun Gothic",sans-serif;color:#7a2a24;letter-spacing:.06em}'
  // 진료기록: 병원 서식
  +'#r177Doc.chart{background:#f3f1ea repeating-linear-gradient(180deg,transparent 0 25px,#c9d3dc 25px 26px);color:#1d2630;border:1px solid #7d8a96;border-top:22px solid #7d8a96;border-radius:2px;font:13px/26px "Noto Sans KR","Malgun Gothic",sans-serif}'
  +'#r177Doc.chart .h{font:700 12px/1.3 "Noto Sans KR",sans-serif;color:#fff;margin:-42px -16px 16px;padding:3px 10px;letter-spacing:.08em}#r177Doc.chart p{margin:0}'
  // 기억 조각: 깨진 유리
  +'#r177Doc.shard{background:radial-gradient(120% 90% at 30% 10%,#3a1820ee,#120a10f2);color:#ecd9d6;border:1px solid #b0404a;clip-path:polygon(0 3%,9% 0,58% 2%,100% 0,97% 46%,100% 100%,40% 97%,4% 100%,1% 60%);font:14px/1.8 "Gowun Batang","Noto Serif KR",serif;box-shadow:0 0 22px #b0404a66;text-shadow:0 0 6px #ff606033;padding:18px 20px 16px}'
  +'#r177Doc.shard .h{font:700 12px/1.4 "Malgun Gothic",sans-serif;color:#ff9a9a;letter-spacing:.1em}'
  // 누군가의 보고서: 타자 보고서
  +'#r177Doc.report{background:#e9e4d8;color:#1e1c18;border:1px solid #6c6556;border-radius:1px;font:13px/1.7 "Nanum Gothic Coding","D2Coding",monospace;box-shadow:0 12px 32px #000b,inset 0 0 0 6px #e9e4d8,inset 0 0 0 7px #8c8370}'
  +'#r177Doc.report .h{font:700 12px/1.4 "Nanum Gothic Coding",monospace;letter-spacing:.2em;border-bottom:1px dashed #6c6556;padding-bottom:4px;color:#5a1a14}'
  +'#panel .r177Tag{display:inline-block;margin:0 0 6px;padding:1px 8px;font:700 11px/1.6 "Malgun Gothic",sans-serif;letter-spacing:.08em;border-radius:2px}'
  +'#panel.r177-note .storyText{background:linear-gradient(172deg,#efe4cf,#d9c5a6);color:#2a1d16;padding:12px 16px;border:1px solid #8a6a4a;box-shadow:inset 0 0 28px #7a4a2a3a}#panel.r177-note .r177Tag{background:#d9c5a6;color:#7a2a24}'
  +'#panel.r177-chart .storyText{background:#f3f1ea repeating-linear-gradient(180deg,transparent 0 27px,#c9d3dc 27px 28px);color:#1d2630;padding:10px 16px;border:1px solid #7d8a96;font-family:"Noto Sans KR",sans-serif}#panel.r177-chart .r177Tag{background:#7d8a96;color:#fff}'
  +'#panel.r177-shard .storyText{background:radial-gradient(120% 90% at 30% 10%,#3a1820,#120a10);color:#ecd9d6;padding:12px 16px;border:1px solid #b0404a;box-shadow:0 0 18px #b0404a55}#panel.r177-shard .r177Tag{background:#3a1820;color:#ff9a9a;border:1px solid #b0404a}'
  +'#panel.r177-report .storyText{background:#e9e4d8;color:#1e1c18;padding:10px 16px;border:1px solid #6c6556;font-family:"Nanum Gothic Coding","D2Coding",monospace}#panel.r177-report .r177Tag{background:#e9e4d8;color:#5a1a14;border:1px dashed #6c6556}'
  +'@media (max-width:780px){#r177Doc{top:auto;bottom:calc(var(--bottom,144px) + 12px);max-height:36vh}}';document.head.appendChild(s);}
let el=null,showing=null,hideAt=0,hover=false;const Q=[];
function show(doc){Q.push(doc);next();}
function next(){if(showing||!Q.length)return;css();if(!el){el=document.createElement('div');el.id='r177Doc';el.setAttribute('role','dialog');el.onclick=()=>{showing=null;el.hidden=true;next();};el.onmouseenter=()=>hover=true;el.onmouseleave=()=>hover=false;document.body.appendChild(el);}
 showing=Q.shift();el.className=showing.form;el.innerHTML='<span class="h">'+esc(FORMS[showing.form])+' · '+esc(showing.title)+(showing.narr?' · '+esc(showing.narr):'')+'</span>'
  +showing.text.split(/\n{2,}/).map(p=>'<p>'+esc(p)+'</p>').join('')+'<span class="foot">누르면 닫힘 · 메뉴의 쪽지 모음에서 다시 볼 수 있음</span>';
 el.hidden=false;el.scrollTop=0;hideAt=performance.now()+Math.max(14000,Math.min(70000,showing.text.length*95));stats.shown++;}
setInterval(()=>{try{const m=typeof modal!=='undefined'&&!!modal;if(el)el.style.visibility=m?'hidden':'';if(m&&showing)hideAt+=300;if(showing&&!hover&&!m&&performance.now()>hideAt){showing=null;if(el)el.hidden=true;next();}}catch(e){fail(e);}},300);
// ---- 바닥의 수집물 ----
const TINT={chart:{a:[150,170,190],b:[235,245,255]},shard:{a:[150,20,36],b:[255,130,130]},report:{a:[150,130,90],b:[245,230,190]},note:{a:[170,130,80],b:[255,235,190]}};
function drawDoc(p){const d=p.r177Doc,q=project(p.x,p.y),h=typeof actorHeight==='function'?actorHeight():60,bob=Math.sin(T()*3+p.x)*h*.05,S=window.__STORYWORLD_FX_SPRITES_R106__;
 ctx.save();try{if(S?.on?.())S.draw('glow',TINT[d.form],q.x,q.y-h*.26+bob,h*.8,h*.8,{alpha:.5});
  ctx.translate(q.x,q.y-h*.28+bob);const w=h*.26,hh=h*.32;ctx.rotate(d.form==='shard'?.3:-.12);
  ctx.fillStyle=d.form==='chart'?'#eef1f3':d.form==='shard'?'rgba(120,20,34,.9)':d.form==='report'?'#e6e0d2':'#e8dcc4';ctx.strokeStyle=d.form==='shard'?'#ff8a8a':'#5a4630';ctx.lineWidth=1.2;
  ctx.beginPath();if(d.form==='shard'){ctx.moveTo(-w*.5,-hh*.4);ctx.lineTo(w*.2,-hh*.55);ctx.lineTo(w*.55,hh*.1);ctx.lineTo(-w*.05,hh*.55);ctx.lineTo(-w*.6,hh*.15);ctx.closePath();}else ctx.rect(-w/2,-hh/2,w,hh);ctx.fill();ctx.stroke();
  if(d.form!=='shard'){ctx.strokeStyle=d.form==='chart'?'#7d8a96':'#8a7458';ctx.lineWidth=.8;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(-w*.35,-hh/2+i*hh/4.5);ctx.lineTo(w*.35,-hh/2+i*hh/4.5);ctx.stroke();}if(d.form==='chart'){ctx.fillStyle='#7d8a96';ctx.fillRect(-w/2,-hh/2,w,hh*.14);}}
 }finally{ctx.restore();}}
function pickTick(){if(!live())return;const L=docsHere();if(L.length)arm();else disarm();for(const p of L.slice()){if(Math.hypot(p.x-player.x,p.y-player.y)>=1.15)continue;L.splice(L.indexOf(p),1);keep(p.r177Doc);show(p.r177Doc);stats.picked++;
 try{const PX=window.__STORYWORLD_PIXELFX_R163__;if(p.r177Doc.form==='shard'&&PX?.has?.('pvfx-choir-moths'))PX.play('pvfx-choir-moths',p.x,p.y,{k:.7,loop:false,tint:{a:[100,6,16],b:[255,120,120]}});else PX?.play?.('collect-burst',p.x,p.y,{k:.5});}catch(_){}/* R178: 기억 조각은 흩어지는 핏빛 나방(CC0 PVFX) */}}
try{
 if(typeof playScenes==='function'){const base=playScenes;playScenes=function(scenes,done,...a){
  try{const rows=Array.isArray(scenes)?scenes.filter(s=>s&&typeof s.text==='string'&&s.text.trim()):[];
   if(!rows.length||!live()||rows.some(manual)||interacting>0||typeof done==='function'&&!rows.every(freeKey)){if(rows.length)stats.immediate++;return base.call(this,scenes,done,...a);}
   try{if(typeof readScenes!=='undefined'&&readScenes?.add)for(const s of rows)if(s.key)readScenes.add(s.key);}catch(e){fail(e);}
   drop(rows);if(typeof done==='function')Promise.resolve().then(()=>{try{done();}catch(e){fail(e);}});return;}
  catch(e){fail(e);return base.call(this,scenes,done,...a);}};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r177-docs'){try{if(live())for(const p of docsHere()){const f=()=>drawDoc(p);if(typeof ctx.scope==='function')ctx.scope({id:p.id,kind:'prop',x:p.x,y:p.y},f);else f();}}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){try{document.getElementById('panel')?.classList.remove('r177-chart','r177-shard','r177-report','r177-note');}catch(_){}return base.apply(this,a);};}// 다른 창에 종이 모양이 남지 않게
 if(typeof interact==='function'){const base=interact;interact=function(...a){interacting++;try{return base.apply(this,a);}finally{interacting--;}};}
 // 바로 보이는 서사도 같은 종이 모양으로(장면 창의 글 칸에 모양 이름을 단다)
 if(typeof advanceScene==='function'){const base=advanceScene;advanceScene=function(...a){const r=base.apply(this,a);try{const pn=document.getElementById('panel');if(pn){pn.classList.remove('r177-chart','r177-shard','r177-report','r177-note');
   if(prefs.on&&typeof storyScene!=='undefined'&&storyScene){css();const f=formOf([storyScene]);pn.classList.add('r177-'+f);const tx=pn.querySelector('.storyText');if(tx&&!pn.querySelector('.r177Tag')){const t=document.createElement('div');t.className='r177Tag';t.textContent=FORMS[f];tx.parentNode.insertBefore(t,tx);}}}}catch(e){fail(e);}return r;};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{pickTick();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){try{if(typeof room!=='undefined'&&room){const L=docsHere(),left=L.splice(0);if(left.length){for(const p of left)keep(p.r177Doc);stats.autoKept+=left.length;try{toast('줍지 않은 기록 '+left.length+'장을 쪽지 모음에 넣었습니다.',2.4);}catch(_){}}}}catch(e){fail(e);}return base.apply(this,a);};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_STORY_COLLECT_R177__=Object.freeze({revision:REV,set,formOf,FORMS,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},onMap:live()?docsHere().length:0,docs:()=>docsHere().map(p=>({...p.r177Doc,x:p.x,y:p.y})),lastError})});
})();
