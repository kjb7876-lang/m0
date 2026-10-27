// R106 CPU check: the improved canon (합일몽세_여섯빛깔의묵시록_1인칭독백_문장개선본, sha256 369c6a25…) replaces
// every story text the game shows — story mode (R54 campaign data, R75 scene data, boot-time raw story) and
// 사몽/역행 sections — and no paragraph of the earlier text survives where the new text has none.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),R=p=>path.join(root,p);
const SHA='369c6a252eef1af4de56a72f9aff0d4293e7f1e8020efae98eaab71e33ee66e3';
let n=0,failed=0;const check=(name,ok,detail='')=>{n++;if(!ok)failed++;console.log((ok?'PASS ':'FAIL ')+name+(ok||!detail?'':' :: '+detail));};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonPath=R('story-source/hapil-canon-r106-improved.txt'),canon=fs.readFileSync(canonPath);
check('canon file hash is the improved canon',sha(canon)===SHA,sha(canon));
const canonText=canon.toString('utf8').replace(/\r\n/g,'\n');
const norm=s=>String(s).replace(/\s+/g,' ').trim();
const canonNorm=norm(canonText);
function embedded(html,name){const i=html.indexOf('window.'+name+'=');if(i<0)return null;let j=html.indexOf('{',i),d=0,str=false,esc=false;for(let k=j;k<html.length;k++){const c=html[k];if(str){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')str=false;continue;}if(c==='"')str=true;else if(c==='{')d++;else if(c==='}'){d--;if(!d)return JSON.parse(html.slice(j,k+1));}}return null;}
const html=fs.readFileSync(R('r96/runtime-text/index.html'),'utf8');
const R54=embedded(html,'__STORYWORLD_CAMPAIGN_DATA_R54__'),R75=embedded(html,'__STORYWORLD_STORY_DATA_R75__');
check('embedded R54 and R75 data parse',!!(R54?.profiles?.length&&R75?.records?.length));
const oldParas=new Set();for(const r of R75.records)for(const v of Object.values(r.parts||{}))for(const p of String(v||'').split(/\n\s*\n/))if(norm(p).length>=12)oldParas.add(norm(p));
const win={__STORYWORLD_CAMPAIGN_DATA_R54__:R54,__STORYWORLD_STORY_DATA_R75__:R75};
const ctx=vm.createContext({window:win,console});
for(const f of['story-canon-r106-data.js','story-canon-r106.js'])vm.runInContext(fs.readFileSync(R('r96/client-source/'+f),'utf8'),ctx,{filename:f});
const C=win.__STORYWORLD_STORY_CANON_R106__,API=win.__STORYWORLD_STORY_R106__;
check('canon data module carries the canon hash',C?.sha256===SHA,C?.sha256);
check('overlay ready',API?.ok===true);
const ins=API.inspect();
check('62 zones patched in R54 and R75, no errors',ins.zones===62&&ins.r54===62&&ins.r75===62&&ins.errors===0,JSON.stringify(ins));
// every paragraph in the data appears verbatim in the canon
const badPara=[];let paraCount=0;for(const[id,z]of Object.entries(C.zones))for(const b of z.blocks)for(const p of b.paras){paraCount++;if(!canonNorm.includes(norm(p)))badPara.push(id+':'+p.slice(0,30));}
for(const p of[C.prologue.pre,C.prologue.post,C.finale.text])for(const q of String(p).split(/\n\s*\n/)){paraCount++;if(!canonNorm.includes(norm(q)))badPara.push('special:'+q.slice(0,30));}
check('every story paragraph ('+paraCount+') is verbatim canon text',!badPara.length&&paraCount>300,badPara.slice(0,3).join(' | '));
// cuts: monotone, cover each zone exactly once
const badCut=[];for(const[id,z]of Object.entries(C.zones)){const total=z.blocks.reduce((s,b)=>s+b.paras.length,0),cuts=Object.values(z.cuts||{}).sort((a,b)=>a[0]-b[0]);let at=0;for(const[a,b]of cuts){if(a!==at||b<=a)badCut.push(id);at=b;}if(at!==total)badCut.push(id+' end '+at+'/'+total);}
check('scene cuts cover every zone paragraph once, in order',!badCut.length,badCut.slice(0,4).join(' | '));
// R75 scene parts now show only canon paragraphs; old-only paragraphs are gone
const leftovers=[],nonCanon=[];let shown=0;for(const r of R75.records)for(const v of Object.values(r.parts||{}))for(const p of String(v||'').split(/\n\s*\n/)){const q=norm(p);if(!q)continue;shown++;if(!canonNorm.includes(q))nonCanon.push(r.zoneId+':'+q.slice(0,30));if(oldParas.has(q)&&!canonNorm.includes(q))leftovers.push(q.slice(0,30));}
check('R75 scene text ('+shown+' paragraphs) is canon only',!nonCanon.length&&shown>300,nonCanon.slice(0,3).join(' | '));
check('no earlier-only paragraph remains in scene text',!leftovers.length,leftovers.slice(0,3).join(' | '));
const changed=[...oldParas].filter(p=>!canonNorm.includes(p)).length;
check('the earlier text differed (old-only paragraphs removed: '+changed+')',changed>0);
// R54 canonical records agree with R75 bodies (in-page self-checks compare them)
const mism=[];for(const p of R54.profiles){const row=R75.records.find(r=>r.zoneId===p.id),rec=p.canonicalRecord;if(!row||!rec)continue;if(rec.title!==row.title)mism.push(p.id+' title');for(const k of['pre','post','firstPost','awakenPre'])if(k in rec&&row.parts&&k in row.parts&&norm(rec[k])!==norm(row.parts[k]))mism.push(p.id+' '+k);}
check('R54 canonical records match R75 scene parts',!mism.length,mism.slice(0,4).join(' | '));
check('special texts: prologue/finale canon, followup removed',R75.specialTexts['followup.EGO']===''&&R75.specialTexts['prologue.pre']===C.prologue.pre&&R75.specialTexts['finale.core-preserved']===C.finale.text);
check('save compatibility: R75 source hash unchanged',typeof R75.source?.sha256==='string'&&R75.source.sha256!==SHA);
// narrator splits: zones with several narrators keep them in order
const multi=Object.entries(C.zones).filter(([,z])=>z.blocks.length>1);
check('multi-narrator zones split into segments ('+multi.length+')',multi.length>0&&multi.every(([id])=>Object.keys(C.zones[id].cuts).some(k=>API.segments(id,k)?.length>=1)));
// 사몽/역행 text module
const sctx={window:{}};vm.createContext(sctx);vm.runInContext(fs.readFileSync(R('r96/client-source/samong-text-r103.js'),'utf8'),sctx);
const ST=sctx.window.__STORYWORLD_SAMONG_TEXT_R103__;
check('사몽 text module built from the canon',ST?.sha256===SHA&&Object.keys(ST.sections).length===42,ST?.sha256+' '+Object.keys(ST?.sections||{}).length);
const sbad=[];let scount=0;for(const[k,s]of Object.entries(ST.sections))for(const b of s.blocks)for(const p of b.paras){scount++;if(!canonNorm.includes(norm(p)))sbad.push(k+':'+p.slice(0,24));}
check('every 사몽 paragraph ('+scount+') is verbatim canon text',!sbad.length&&scount>900,sbad.slice(0,3).join(' | '));
// anchors used by 사몽 cues and map records exist in the new text
const src=fs.readFileSync(R('r96/client-source/samong-r103.js'),'utf8')+fs.readFileSync(R('r96/client-source/samong-maps-r105.js'),'utf8');
const miss=[];for(const m of src.matchAll(/\[\s*'([A-Z]{1,2}-?\d{0,2}|threshold|prelude|M\d)'\s*,\s*'([^']{4,})'/g)){const s=ST.sections[m[1]];if(!s||m[2]==='last'||ST.sections[m[2]])continue;if(!s.blocks.some(b=>b.paras.some(p=>p.includes(m[2]))))miss.push(m[1]+':'+m[2]);}
for(const m of src.matchAll(/key:'([^']+)',sub:'([^']+)'/g)){const s=ST.sections[m[1]];if(s&&!s.blocks.some(b=>b.paras.some(p=>p.includes(m[2]))))miss.push(m[1]+':'+m[2]);}
check('사몽 cue and record anchors exist in the new text',!miss.length,miss.slice(0,4).join(' | '));
console.log(JSON.stringify({checks:n,failed}));process.exitCode=failed?1:0;
