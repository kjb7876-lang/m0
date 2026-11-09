// 독립 대조: fcmp 가 R444 켠 실행에서 배운 '그림 원래 방향'(다수결)을 사람이 맞춘 그림 표와 비교한다.
//  다수결은 R444 좌우가 늘 반대로 뒤집혀도(한결같은 극성 반전) 알아채지 못하므로, 아래 표와 어긋나면 그 그림은 화면에서 반대로 보인다는 뜻이다.
//  표: R425 ATK_FACE(L/R), R208·R223 index facing, R380 index facing(R275 파생본은 원본 경로로).
// 실행: node fpol.cjs on.json
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'../../runtime-text');
const A=require(path.resolve(process.argv[2]));
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil/i;
const pol={};for(const v of Object.values(A)){if(!v.rows)continue;for(const r of v.rows){if(!r.side||r.persona||FX.test(r.src))continue;(pol[r.src]??=[0,0])[(r.flip!==(r.side==='left'))?1:0]++;}}
const norm=s=>{s=String(s).replace(/#.*$/,'').replace(/^.*?assets\//,'');for(let t=s;;s=t){t=s.replace(/^r(?:99|118|425)\/clean\/assets\//,'');if(t===s)break;}return s;};
const table={};
try{const src=fs.readFileSync(path.join(R,'combat-flow-r425.js'),'utf8');const m=src.match(/const ATK_FACE=Object\.freeze\((\{[^)]*\})\)/);if(m)for(const [k,v] of Object.entries(JSON.parse(m[1].replace(/'/g,'"'))))table[k]={face:v==='L'?'left':'right',from:'R425 ATK_FACE(공격 칸)'};}catch(e){console.error('R425 table',e.message);}
for(const p of ['assets/r208/mobs/index.json','assets/r223/mobs/index.json','assets/r380/mobs/index.json']){try{const d=JSON.parse(fs.readFileSync(path.join(R,p),'utf8'));const items=Array.isArray(d)?d:(d.mobs||d.items||Object.values(d));
 for(const it of items){if(!it||!it.path||!it.facing)continue;const k=norm(it.path);table[k]??={face:it.facing,from:p.split('/')[1]+' index'};}}catch(e){console.error(p,e.message);}}
let fix275={};try{const s=fs.readFileSync(path.join(R,'mob-fix-r275.js'),'utf8');for(const m of s.matchAll(/'assets\/(r2(?:08|23)\/mobs\/[\w-]+\.webp)':'assets\/(r275\/mobs\/[\w-]+\.webp)'/g))fix275[m[2]]=m[1];}catch(_){}
let agree=0,disagree=0,unknown=0;const rows=[];
for(const [src,[keep,flipd]] of Object.entries(pol)){const n=keep+flipd;if(n<8)continue;const learned=flipd>keep?'left':'right';let k=norm(src);if(fix275[k])k=fix275[k];const t=table[k];
 if(!t){unknown++;continue;}if(t.face!=='left'&&t.face!=='right'){unknown++;continue;}
 // R425 표는 공격 칸에만 쓴다 — 같은 그림이 걷기 칸과 다르면(아틀라스) 참고만
 const ok=t.face===learned;if(ok)agree++;else{disagree++;rows.push({src,learned,table:t.face,from:t.from,frames:n,share:+(Math.max(keep,flipd)/n).toFixed(2)});}}
console.log(JSON.stringify({agree,disagree,unknownArt:unknown},null,0));for(const r of rows)console.log('어긋남',JSON.stringify(r));
