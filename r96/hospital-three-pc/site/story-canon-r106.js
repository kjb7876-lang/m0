/* R106: 스토리모드 서사를 개선본 정본(합일몽세_여섯빛깔의묵시록_1인칭독백_문장개선본.txt)으로 바꿉니다.
 * 게임 안에는 예전 원고가 세 묶음(R54 캠페인 묶음·R75 장면 묶음·부팅 때 읽는 원문 묶음)으로 남아 있어,
 * 부팅 전에 세 묶음의 문단·제목·화자를 같은 자리에서 개선본 문단으로 바꿉니다.
 * - 문단은 정본 그대로이며(story-canon-r106-data.js), 전투 전/후 경계만 예전 장면 위치에 맞춰 나눕니다.
 * - 한 장면 안에서 화자가 바뀌면(〈장민재의 기억〉, 〈한이경의 기억〉 등) 화자마다 장면을 나눕니다.
 * - 정본에 없는 예전 후속 문구(followup.EGO)는 보여 주지 않습니다.
 * - 저장 호환을 위해 예전 원문 식별값(sourceSha256)은 바꾸지 않고, 바뀐 문장은 예전 음성과 해시가 달라 텍스트로 나옵니다. */
(()=>{'use strict';
 const C=window.__STORYWORLD_STORY_CANON_R106__;
 const stats={r54:0,r75:0,raw:0,special:0,split:0,journal:0,followupHidden:0,narrators:0,errors:0};let lastError=null;
 const fail=e=>{stats.errors++;lastError=String(e?.message||e);};
 if(!C||!C.zones){window.__STORYWORLD_STORY_R106__=Object.freeze({ok:false,inspect:()=>({ok:false,reason:'data missing'})});return;}
 const Z=C.zones,PARTS=['pre','firstPost','awakenPre','post'];
 // 블록(화자) + 문단 범위 → 묶음별 세그먼트
 const flat=new Map(),segsCache=new Map();
 function flatOf(id){let f=flat.get(id);if(f)return f;const z=Z[id];f=[];z.blocks.forEach((b,bi)=>b.paras.forEach(p=>f.push({p,n:b.narrator,bi})));flat.set(id,f);return f;}
 function segments(id,part){const key=id+'|'+part;if(segsCache.has(key))return segsCache.get(key);const z=Z[id];let out=null;
  const cut=z?.cuts?.[part];if(cut){out=[];for(const row of flatOf(id).slice(cut[0],cut[1])){const last=out[out.length-1];if(last&&last.bi===row.bi)last.paras.push(row.p);else out.push({narrator:row.n,paras:[row.p],bi:row.bi});}}
  segsCache.set(key,out);return out;}
 const textOf=(id,part)=>(segments(id,part)||[]).map(s=>s.paras.join('\n\n')).join('\n\n');
 const paragraphs=id=>flatOf(id).map(r=>r.p);
 const bodyOf=id=>paragraphs(id).join('\n\n');
 const narratorOf=id=>Z[id]?.blocks?.[0]?.narrator||null;
 const partsOf=id=>Object.keys(Z[id]?.cuts||{});

 // 원문 묶음 형태(story-rc51 기록, R54 canonicalRecord) 바꾸기
 function patchRecord(rec,id){const z=Z[id];if(!rec||!z)return false;
  rec.title=z.title;if(z.chapter)rec.chapter=z.chapter;rec.narrator=narratorOf(id);rec.paragraphs=paragraphs(id);
  const vs={};
  if(z.rest){rec.body=textOf(id,'body');vs.body=rec.body;if('pre'in rec)rec.pre='';if('post'in rec)rec.post='';}
  else{for(const k of PARTS){if(z.cuts[k]){rec[k]=textOf(id,k);vs[k]=rec[k];}else if(k in rec)rec[k]='';}if('body'in rec)rec.body=bodyOf(id);}
  if('prologue.pre'in rec){rec['prologue.pre']=C.prologue.pre;vs['prologue.pre']=C.prologue.pre;}
  if('prologue.post'in rec){rec['prologue.post']=C.prologue.post;vs['prologue.post']=C.prologue.post;}
  if('finale.core-preserved'in rec)rec['finale.core-preserved']=C.finale.text;
  if('followup.EGO'in rec)rec['followup.EGO']='';
  rec.voiceSource=vs;rec.canonR106=C.sha256;return true;}
 function patchSpecial(t){if(!t)return;t['prologue.pre']=C.prologue.pre;t['prologue.post']=C.prologue.post;t['finale.core-preserved']=C.finale.text;t['followup.EGO']='';stats.special++;}
 // R75 장면 묶음(실제로 장면 카드에 쓰이는 문장)
 function patchRow(row){const id=row?.zoneId,z=Z[id];if(!z)return false;
  row.title=z.title;if(z.chapter)row.chapter=z.chapter;row.narratorLabel=narratorOf(id);row.body=bodyOf(id);row.bodySHA256=z.bodySHA256;
  const parts={};for(const k of Object.keys(row.parts||{}))parts[k]='';
  if(z.rest){parts.body=textOf(id,'body');}else for(const k of partsOf(id))parts[k]=textOf(id,k);
  row.parts=parts;row.canonR106={sha256:C.sha256,line:z.line};return true;}
 try{const d=window.__STORYWORLD_CAMPAIGN_DATA_R54__;if(d?.profiles)for(const p of d.profiles){if(!Z[p.id])continue;p.title=Z[p.id].title;if(Z[p.id].chapter)p.chapter=Z[p.id].chapter;if(patchRecord(p.canonicalRecord,p.id))stats.r54++;}if(d)d.narrativeR106={file:C.source,sha256:C.sha256};}catch(e){fail(e);}
 try{const d=window.__STORYWORLD_STORY_DATA_R75__;if(d?.records)for(const r of d.records)if(patchRow(r))stats.r75++;patchSpecial(d?.specialTexts);if(d)d.narrativeR106={file:C.source,sha256:C.sha256};}catch(e){fail(e);}
 // 부팅 때 읽는 원문 묶음은 compileWorld 직전에 바꿉니다.
 function patchRaw(){if(typeof rawStory==='undefined'||!rawStory||rawStory.canonR106===C.sha256)return;
  for(const r of rawStory.records||[])if(patchRecord(r,r.zone))stats.raw++;
  patchSpecial(rawStory.specialTexts);
  if(rawStory.openingVoice?.opening)rawStory.openingVoice.opening.paragraphs=C.prologue.pre.split('\n\n');
  if(rawStory.openingVoice?.root)rawStory.openingVoice.root.paragraphs=C.prologue.post.split('\n\n');
  rawStory.canonR106=C.sha256;}
 if(typeof compileWorld==='function'){const base=compileWorld;compileWorld=function(...a){try{patchRaw();}catch(e){fail(e);}return base.apply(this,a);};}

 // 장면: 화자가 바뀌는 곳에서 나누고, 프롤로그·최종장 화자를 정본대로 둡니다.
 function reshape(def,part,list){if(!Array.isArray(list))return list;const out=[];
  for(const s of list){
   if(!s){continue;}
   if(s.sceneId==='prologue.pre'||s.sceneId==='prologue.post'){out.push({...s,narrator:C.prologue.narrator||s.narrator});stats.narrators++;continue;}
   if(s.sceneId==='finale.core-preserved'){out.push({...s,narrator:C.finale.narrator||s.narrator,title:C.finale.title});stats.narrators++;continue;}
   const z=def&&s.id===def.id&&s.part===part?Z[def.id]:null,segs=z?segments(def.id,part):null;
   if(!segs||!segs.length){out.push(s);continue;}
   if(segs.length===1){out.push(segs[0].narrator&&segs[0].narrator!==s.narrator?{...s,narrator:segs[0].narrator}:s);continue;}
   segs.forEach((g,i)=>out.push({...s,text:g.paras.join('\n\n'),narrator:g.narrator,key:i?s.key+':r106:'+i:s.key}));stats.split++;
  }
  return out;}
 if(typeof nextScenes==='function'){const base=nextScenes;nextScenes=function(def,part,...rest){const list=base.call(this,def,part,...rest);try{return reshape(def,part,list);}catch(e){fail(e);return list;}};}
 // 기억의 기록: 화자가 둘 이상인 지역은 화자마다 카드를 나눕니다(문단은 그대로).
 if(typeof showJournal==='function'){const base=showJournal;showJournal=function(id=null,all=false,...rest){
  try{const z=id&&Z[id];if(z&&z.blocks.length>1&&typeof regionById!=='undefined'){const def=regionById[id],r=def?.records?.[0];if(r&&typeof playScenes==='function'){stats.journal++;
   playScenes(z.blocks.map((b,i)=>({id,record:r,part:'body',text:b.paras.join('\n\n'),title:r.title,narrator:b.narrator,chapter:r.chapter,key:'journal:'+id+':'+i})),()=>showJournal(null,all));return;}}}catch(e){fail(e);}
  return base.call(this,id,all,...rest);};}
 // 정본에 없는 예전 후속 문구 버튼은 숨깁니다.
 if(typeof showEnding==='function'){const base=showEnding;showEnding=function(...a){const result=base.apply(this,a);try{for(const b of document.querySelectorAll('#panel button'))if(b.textContent==='마지막 수호자 EGO · 후속 기록'){b.remove();stats.followupHidden++;}}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_STORY_R106__=Object.freeze({ok:true,source:C.source,sha256:C.sha256,segments,textOf,paragraphs,
  inspect:()=>({ok:true,source:C.source,sha256:C.sha256,zones:Object.keys(Z).length,...stats,lastError})});
})();
