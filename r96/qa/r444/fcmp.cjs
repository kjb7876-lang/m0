// 전후 비교: 그림 파일마다 '원래 그림이 보는 쪽'을 R444 켠 실행(after)의 좌우→뒤집기 대응 다수결로 정하고,
// 두 실행 모두에서 실제 화면에 보이는 몸 방향(뒤집기 반영)을 ① 걷는 방향 ② 공격 판정 각도 와 비교한다.
const path=require('path');const A=require(path.resolve(process.argv[2])),B=require(path.resolve(process.argv[3]));// A=after(R444 on), B=before(R444 off)
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil/i;// 몸보다 큰 시전 원·이펙트 그림이 잡힌 프레임은 뺀다
const pol={};// src -> art faces left?
for(const v of Object.values(A)){if(!v.rows)continue;for(const r of v.rows){if(!r.side||r.persona||FX.test(r.src))continue;const k=r.src;(pol[k]??=[0,0])[(r.flip!==(r.side==='left'))?1:0]++;}}
const faceLeftArt=src=>{const c=pol[src];return c?c[1]>c[0]:null;};
function score(o,label){const res={};
 for(const [z,v] of Object.entries(o)){if(!v.rows){res[z]=v;continue;}const by={};for(const r of v.rows)if(!r.persona&&!FX.test(r.src))(by[r.id]??=[]).push(r);
  let walk=0,wbad=0,wlong=0,atk=0,abad=0,unk=0,turns=0,frames=0;const badN={};
  for(const L of Object.values(by)){let prev=null,lastW=null,since=0;for(const r of L){const fl=faceLeftArt(r.src);if(fl===null){unk++;continue;}const vis=(r.flip!==fl)?'left':'right';frames++;if(prev&&prev!==vis)turns++;prev=vis;
    if(r.ph||r.atk){lastW=null;if(r.atk){atk++;if(r.atk!==vis){abad++;badN['atk|'+r.n.replace(/ \d+$/,'')]=(badN['atk|'+r.n.replace(/ \d+$/,'')]||0)+1;}}continue;}
    let sx=0,sy=0;for(const q of L)if(Math.abs(q.t-r.t)<=.15&&!q.ph){sx+=q.sx;sy+=q.sy;}
    if(Math.abs(sx)>.06&&Math.abs(sx)>Math.abs(sy)*.8){// 영웅 곁 옆걸음·뒷걸음(R444 face)은 걷기 표본에서 뺀다 — 두 실행 모두 같은 기준(가까운 영웅 쪽 성분으로 판단)
      const w0=sx>0?'right':'left';if(w0!==lastW){lastW=w0;since=r.t;}if(r.own==='face')continue;walk++;if(w0!==vis){wbad++;if(r.t-since>=.3)wlong++;const k='walk|'+r.n.replace(/ \d+$/,'');badN[k]=(badN[k]||0)+1;}}}}
  res[z]={frames,unknownArt:unk,walk,walkBad:wbad,walkLong:wlong,walkPct:+(100*wbad/Math.max(1,walk)).toFixed(1),atk,atkBad:abad,atkPct:+(100*abad/Math.max(1,atk)).toFixed(1),turnsPer100:+(100*turns/Math.max(1,frames)).toFixed(1),top:Object.entries(badN).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,n])=>k+':'+n).join(' ')};}
 return res;}
const a=score(A),b=score(B);
console.log('지역 | 걷기 불일치 전→후 (그중 0.3초 넘게 계속) | 공격 그림≠판정 전→후 | 몸 뒤집힘/100프레임 전→후');
for(const z of Object.keys(a)){const x=b[z]||{},y=a[z];if(!y.frames){console.log(z,JSON.stringify(y).slice(0,200));continue;}
 console.log(`${z} | ${x.walkBad}/${x.walk} (${x.walkPct}%, 계속 ${x.walkLong}) → ${y.walkBad}/${y.walk} (${y.walkPct}%, 계속 ${y.walkLong}) | ${x.atkBad}/${x.atk} (${x.atkPct}%) → ${y.atkBad}/${y.atk} (${y.atkPct}%) | ${x.turnsPer100} → ${y.turnsPer100}`);
 if(x.top)console.log('   before worst:',x.top);if(y.top)console.log('   after worst:',y.top);}
