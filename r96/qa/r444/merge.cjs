// 여러 fcensus 결과를 지역별로 합친다(실행마다 몹 id 앞에 번호를 붙여 서로 이어지지 않게): node merge.cjs out.json a.json b.json …
const fs=require('fs'),path=require('path');const [,,out,...ins]=process.argv;const R={};
ins.forEach((f,i)=>{const o=require(path.resolve(f));for(const [z,v] of Object.entries(o)){if(!v.rows)continue;(R[z]??={rows:[],miss:0});for(const r of v.rows)R[z].rows.push({...r,id:i+'|'+r.id});R[z].miss+=v.miss||0;}});
fs.writeFileSync(out,JSON.stringify(R));console.log(Object.entries(R).map(([z,v])=>z+':'+v.rows.length).join(' '));
