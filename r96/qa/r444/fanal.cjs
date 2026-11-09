// 분석: (몹,그림 파일) 마다 R444 좌우→실제 뒤집기 대응이 한결같은가(다른 코드가 덮어쓰는지), 한쪽으로만 그려지는가
const o=require(require('path').resolve(process.argv[2]));const filt=process.argv[3]||'';
for(const [z,v] of Object.entries(o)){if(!v.rows){console.log(z,v);continue;}const rows=v.rows.filter(r=>!r.persona&&(!filt||r.n.includes(filt)));
 const g={};for(const r of rows){if(!r.side)continue;const k=r.id+'|'+r.src;(g[k]??=[]).push(r);}
 let cons=0,dev=0,dead=0,both=0,unmanaged=rows.filter(r=>!r.side).length;const devBy={},deadBy={};
 for(const [k,L] of Object.entries(g)){const m={};for(const s of['left','right']){const A=L.filter(r=>r.side===s);if(!A.length)continue;const t=A.filter(r=>r.flip).length;m[s]=t*2>=A.length;for(const r of A){cons++;if(r.flip!==m[s]){dev++;const kk=r.n.replace(/ \d+$/,'')+'|'+r.own+(r.ph?'|atk':'')+'|'+r.src.split('/').pop().slice(0,28);devBy[kk]=(devBy[kk]||0)+1;}}}
  if('left' in m&&'right' in m){both++;if(m.left===m.right){dead++;const kk=L[0].n.replace(/ \d+$/,'')+'|'+L[0].src.split('/').pop().slice(0,40);deadBy[kk]=(deadBy[kk]||0)+L.length;}}}
 const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,n])=>k+':'+n).join('\n     ');
 console.log(`\n== ${z}: draws ${rows.length} (no image ${v.miss}, not managed ${unmanaged}) | managed draws ${cons}, flip not following R444 side ${dev} (${(100*dev/Math.max(1,cons)).toFixed(1)}%) | (mob,image) pairs seen on both sides ${both}, of which the image never turns ${dead}`);
 if(dev)console.log('  not following:\n     '+top(devBy));if(dead)console.log('  never turns:\n     '+top(deadBy));}
