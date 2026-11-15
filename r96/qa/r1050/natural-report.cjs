// natural.mjs 결과 요약: 상태별(공격·스킬·피격·걷기·서기) 몸 그림 종류·보이는 키 중앙값(zoom 으로 나눈 값)·서기 대비 비율.
const fs=require('fs');const all=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const med=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return s[s.length>>1];};
const stateOf=r=>r.ul>0?'ultimate':r.sk>0?'skill':r.da>0?'dash':r.hu>0?'hit':r.aa>0?(r.mv?'attack+move':'attack'):r.mv?'walk':'idle';
const out={};
for(const [h,rows] of Object.entries(all)){const by={};for(const r of rows){if(r.visH==null)continue;const s=stateOf(r);(by[s]=by[s]||[]).push(r);}
 const idle=med((by.idle||[]).map(r=>r.visH/r.z));out[h]={};console.log('\n=== '+h+'  서기 키 '+(idle&&idle.toFixed(1)));
 for(const [s,rs] of Object.entries(by)){const hh=med(rs.map(r=>r.visH/r.z)),ww=med(rs.map(r=>r.visW/r.z));const art=rs.filter(r=>/attack|skill|atk|slash|strike/i.test(r.src)&&!r.walk).length/rs.length;
  const srcs={};for(const r of rs){const k=(r.walk?'W:':'')+r.src;srcs[k]=(srcs[k]||0)+1;}
  out[h][s]={n:rs.length,h:+hh.toFixed(1),w:+ww.toFixed(1),ratio:idle?+(hh/idle).toFixed(3):null,attackArt:+art.toFixed(2),srcs};
  console.log([s.padEnd(12),'n='+rs.length,'키 '+hh.toFixed(1),'폭 '+ww.toFixed(1),'비 '+(idle?(hh/idle).toFixed(3):'-'),'공격그림 '+(art*100).toFixed(0)+'%',Object.entries(srcs).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+'×'+v).join(' | ')].join('  '));}}
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));
