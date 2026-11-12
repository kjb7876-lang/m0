// r720-parity.mjs 가 쓴 JSON 들을 읽어 ① 조종 영웅: 혼자 vs 배치 영웅과 함께 ② 같은 영웅: 조종할 때 vs 배치했을 때 를 단계(걷기·대기·공격·고유기)별로 맞춰 본다.
const fs=require('fs'),path=require('path');const dir=process.argv[2];const files=fs.readdirSync(dir).filter(f=>/^parity-.*\.json$/.test(f));
let fail=0,n=0;const ok=(c,m,x)=>{n++;if(!c)fail++;if(!c||process.env.VERBOSE)console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,700):'');};
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:0;};
const fam=p=>String(p).replace(/[-_](?:n|s|e|w|ne|nw|se|sw|north|south|east|west|left|right|front|back|up|down|l|r|f|b)(?=\.|$|-|_)/g,'-*');
function sum(rows){const o={};for(const r of rows){if(r.ph==='walk'&&!r.mov)continue;/* 걷기 단계는 실제로 걷는 프레임만 */const s=o[r.ph]||(o[r.ph]={frames:0,fh:{},keys:new Set(),fams:new Set(),h:[],w:[],strokes:new Set(),contact:new Set(),extra:new Set(),alpha:new Set(),filter:new Set()});s.frames++;s.keys.add(r.path+'@'+r.fx);s.fams.add(fam(r.path));(s.fh[r.path]=s.fh[r.path]||[]).push(r.h);s.h.push(r.h);s.w.push(r.w);s.strokes.add(r.strokes);s.contact.add(r.contact);s.extra.add(r.extra);s.alpha.add(r.alpha);s.filter.add(r.filter);}return o;}
function cmp(label,A,B){/* A = 기준(조종·혼자), B = 견줄 것 */for(const ph of ['walk','idle','attack','special']){const a=A[ph],b=B[ph];if(!a||!b){ok(false,label+' '+ph+': 측정 없음',{a:!!a,b:!!b});continue;}
  const fa=[...a.fams].sort(),fb=[...b.fams].sort(),stand=A.idle?A.idle.fams:new Set(),miss=fb.filter(x=>!a.fams.has(x)&&!stand.has(x));/* 동작 앞뒤에 낀 서 있기 프레임(기준의 대기 묶음)은 어느 단계에서나 정상 */
  ok(miss.length===0,label+' '+ph+': 몸 그림 묶음이 기준에 없는 것을 쓰지 않는다',{기준:fa,대상:fb});
  const main=f=>{const c={};return c;};
  ok(b.keys.size>=Math.max(1,Math.floor(a.keys.size*.6)),label+' '+ph+': 모션 칸 수(서로 다른 프레임) 60% 이상',{기준:a.keys.size,대상:b.keys.size});
  const hs=Object.keys(b.fh).filter(f=>a.fh[f]&&a.fh[f].length>=4&&b.fh[f].length>=4/* 몇 프레임뿐인 전환 그림은 견주지 않는다 */).map(f=>[f,med(a.fh[f]),med(b.fh[f])]);ok(hs.length>0&&hs.every(x=>x[1]>0&&Math.abs(x[2]-x[1])<=x[1]*.03),label+' '+ph+': 같은 그림 파일의 몸 높이(크기) 3% 안',hs);
  ok([...b.strokes].every(x=>a.strokes.has(x))&&[...b.contact].every(x=>a.contact.has(x)),label+' '+ph+': 외곽선·접지 그림 수 같음',{기준:[[...a.strokes],[...a.contact]],대상:[[...b.strokes],[...b.contact]]});
  ok([...b.alpha].every(x=>a.alpha.has(x))&&[...b.filter].every(x=>a.filter.has(x)),label+' '+ph+': 몸 불투명도·필터 같음',{기준:[[...a.alpha],[...a.filter]],대상:[[...b.alpha],[...b.filter]]});
  /* 오라(EGO·공명)는 그 순간의 공명·각성 상태를 따르므로 견주지 않는다(배치 영웅은 공명 0) */}}
const solo={},data=files.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f))));
for(const d of data){solo[d.hero]=sum(d.runs.solo);ok(d.errors.length===0&&d.inspect.stats.errors===0,d.hero+' 판: 오류 없음',{page:d.errors,mod:d.inspect.lastError});}
for(const d of data){if(d.runs.withAllies)cmp('조종 '+d.hero+' (배치 '+d.allies.join('·')+'와 함께)',solo[d.hero],sum(d.runs.withAllies));}
for(const d of data)for(const id of d.allies){if(!solo[id]){ok(false,'배치 '+id+': 기준(혼자 조종) 측정이 없음');continue;}cmp('배치 '+id+' (조종 '+d.hero+')',solo[id],sum(d.runs['ally:'+id]||[]));}
console.log('\n'+(n-fail)+'/'+n+(fail?' — FAIL '+fail:' — ALL PASS'));process.exit(fail?1:0);
