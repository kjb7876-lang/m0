// R238 CPU check: R162 '전투 위주' 개편이 대면 구역의 버티기를 지울 때, 진술이 없는 대면(버티기가 유일한 끝)은 버티기를 남긴다.
// 실플레이(samong222): sz115-S04-11 '13층 후원자'에서 버티기가 지워져 끝낼 길이 없어 37분 멈췄다.
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('samong-zones-r115.js');
ok('runtime copy matches',RT('samong-zones-r115.js')===src&&/qa\/r238\/r238-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const line=src.split('\n').find(l=>/z\.kind==='confront'&&z\.solve\?\.hold/.test(l)&&/delete sv\.hold/.test(l));
ok('R162 reshape strips hold only from confronts that still have statements',!!line&&/\(z\.solve\.statements\|\|\[\]\)\.length/.test(line),line);
// 같은 조건을 데이터 전체에 적용해 본다: 개편 뒤 모든 대면에 끝낼 길(진술·확인서·버티기)이 하나는 남아야 한다
const data=C('samong-zones-r115-data.js');const m=data.match(/\[\s*\{"id":"sz115-/);const zones=[];
{const re=/\{"id":"(sz115-[^"]+)"/g;let k;while((k=re.exec(data))){let d=0,i=k.index,j=i;for(;j<data.length;j++){const c=data[j];if(c==='{')d++;else if(c==='}'){d--;if(!d)break;}}try{zones.push(JSON.parse(data.slice(i,j+1)));}catch(_){}}}
const reshape=z=>{if(z.kind==='confront'&&z.solve?.hold&&(z.solve.statements||[]).length){const sv={...z.solve};delete sv.hold;return {...z,solve:sv};}return z;};
const confronts=zones.filter(z=>z.kind==='confront'&&z.solve);
const dead=confronts.map(reshape).filter(z=>!(z.solve.statements||[]).length&&!z.solve.book&&!z.solve.hold).map(z=>z.id);
ok('every confront keeps a way to finish after the reshape (statements, book or hold)',confronts.length>=10&&dead.length===0,{n:confronts.length,dead});
const s0411=zones.find(z=>z.id==='sz115-S04-11');
ok('S04-11 (13층 후원자) keeps its 25 s hold',s0411&&reshape(s0411).solve.hold===25,s0411?.solve);
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R238 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
