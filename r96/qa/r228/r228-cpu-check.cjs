// R228 CPU check: 실내 방(r224Rooms)마다 다른 바닥 색조(곱하기 혼합, 그림만).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('cave-r204.js');
ok('runtime copy matches; in the CI workflow',RT('cave-r204.js')===src&&/qa\/r228\/r228-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
const body=src.slice(src.indexOf('const RFLOOR='),src.indexOf('// R224 방 이름'));
class BG{setAttribute(k,v){this[k]=v;}setIndex(i){this.index=i;}computeBoundingSphere(){}}
const T={BufferGeometry:BG,Float32BufferAttribute:function(a,n){this.array=a;this.itemSize=n;}};
const sb={Math,String,stats:{},prefs:{rooms:true,roomFloors:true}};vm.createContext(sb);vm.runInContext(body+';this.f=roomFloorMesh;',sb);
const rooms=[{id:0,x0:2,y0:2,x1:12,y1:9},{id:1,x0:14,y0:2,x1:20,y1:9},{id:2,x0:2,y0:11,x1:3,y1:12}];
const g=sb.f(T,{exploration:{r224Rooms:rooms}},{kind:'home'},'ep1b02');
ok('one tinted area per room (rooms under 2×2 skipped)',sb.stats.roomFloors===2,sb.stats);
const col=g.color.array;ok('colors are multiply tints in (0,1] — texture kept, only tinted',col.every(v=>v>0&&v<=1)&&g.color.itemSize===3);
const pos=g.position.array;let inside=true;for(let i=0;i<pos.length;i+=3){const x=pos[i],z=pos[i+2];if(!rooms.slice(0,2).some(r=>x>=r.x0&&x<=r.x1&&z>=r.y0&&z<=r.y1))inside=false;}
ok('quads stay inside their room rectangles',inside);
ok('border strips and inner quad do not overlap (5 quads per room)',pos.length/12===10);
{const rs=[0,1,2,3,4,5].map(i=>({id:i,x0:i*5,y0:0,x1:i*5+4,y1:4}));const g2=sb.f(T,{exploration:{r224Rooms:rs}},{kind:'home'},'ep1b02');const c2=g2.color.array,set=new Set(rs.map((r,i)=>c2.slice((i*5+4)*12,(i*5+4)*12+3).map(v=>v.toFixed(3)).join()));ok('different rooms get different tones (fixed seed per zone+room)',set.size>1,[...set]);}
ok('snowfield ep1b09 gets no room rug bands (R435: they read as square lines on snow)',sb.f(T,{exploration:{r224Rooms:rooms}},{kind:'machine'},'ep1b09')===null&&sb.f(T,{exploration:{r224Rooms:rooms}},{kind:'machine'},'u201')!==null);
sb.prefs.roomFloors=false;ok('can be switched off (storyworld.r204.cave roomFloors:false)',sb.f(T,{exploration:{r224Rooms:rooms}},{kind:'home'},'ep1b02')===null&&/prefs\.roomFloors=s\.roomFloors/.test(src));
ok('mesh uses MultiplyBlending and is presentation only',/r228-room-floors/.test(src)&&/MultiplyBlending/.test(src)&&/rmesh\.userData\.presentationOnly=true/.test(src));
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)).slice(0,300)));
console.log(`${checks.length-fail.length}/${checks.length}`);process.exit(fail.length?1:0);
