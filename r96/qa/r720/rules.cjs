// R720 영웅 동작 전환 규칙 검사기 — probe.mjs 기록(영웅별 프레임 목록)을 받아 규칙 위반을 센다.
// 규칙(AAA 액션 게임 애니메이션 상태 전환 원칙을 이 게임 2D 시트 구조에 맞춘 것, 문서 docs/hero-motion-rules.md):
//  M1 깜빡임 금지: 한 동작 그림이 앞뒤 같은 그림 사이에 딱 한 프레임만 끼면 안 된다(A B A).
//  M2 방향 일치: 화면 가로로 움직이는(걷기·대시) 동안 몸 그림이 움직이는 쪽을 봐야 한다(1프레임 유예).
//  M3 이동 캔슬: 공격·스킬 동작이 끝난(attackAnim 0, 스킬 공격 자세 끝) 뒤 움직이면 2프레임 안에 걷기 그림으로.
//  M4 피격 반응: 피격(hurtAnim 새로 생김)은 대시·스킬·궁극기가 아니면 2프레임 안에 보이고, 피격이 끝난 뒤 늦게 나오지 않는다.
//  M5 몸 크기 연속: 그림이 바뀌는 프레임에서 보이는 몸 키가 12% 넘게 튀지 않는다.
//  M6 발 고정: 그림이 바뀌는 프레임에서 발(보이는 몸 아래) 위치가 영웅 발밑점 기준으로 키의 8% 넘게 튀지 않는다.
//  M7 가로 중심: 그림이 바뀌는 프레임에서 몸 가로 중심이 영웅 위치 기준으로 키의 14% 넘게 튀지 않는다.
//  M8 공격 칸 순서: 한 번 휘두르는 동안 시트 칸은 뒤로 가지 않는다(새 휘두르기 제외).
const fs=require('fs');
const clip=s=>String(s||'-').replace(/\?.*$/,'');
const face=b=>{if(!b)return 0;const m=/[-_/](e|w|ne|se|nw|sw|n|s|east|west|right|left)(?:[-_.]|$)/i.exec(b.s.split('/').pop());if(!m)return 0;const d=m[1].toLowerCase();let f=/^(e|ne|se|east|right)$/.test(d)?1:/^(w|nw|sw|west|left)$/.test(d)?-1:0;return b.flip?-f:f;};
// 피격 슈퍼아머 영웅(기본 공격 중 피격에 밀리지 않음 — 피격 시트가 없는 광전사 슬레이어)
const ARMOR=new Set(['slayer']);
function check(rec,hero){const v=[],add=(rule,i,msg)=>v.push({rule,t:rec[i]?.t,ph:rec[i]?.ph,msg});
 for(let i=1;i<rec.length;i++){const a=rec[i-1],c=rec[i];if(!a.b||!c.b){if(!c.b)add('M0',i,'몸 그림 없음');continue;}
  const n=rec[i+1];
  const edge=(c.at>a.at+1e-6)||(c.sk>a.sk+1e-6)||(c.ul>a.ul+1e-6)||(c.da>a.da+1e-6)||(c.hu>a.hu+1e-6);
  const nedge=n&&((n.at>c.at+1e-6)||(n.sk>c.sk+1e-6)||(n.ul>c.ul+1e-6)||(n.da>c.da+1e-6)||(n.hu>c.hu+1e-6));
  if(n?.b&&clip(a.b.s)===clip(n.b.s)&&clip(c.b.s)!==clip(a.b.s)&&!edge&&!nedge&&(n.t-c.t)<.06)add('M1',i,`${clip(a.b.s)} → ${clip(c.b.s)} → ${clip(n.b.s)}`);
  const sw=clip(a.b.s)!==clip(c.b.s);
  if(sw&&a.b.vb&&c.b.vb){const ha=a.b.vb.b-a.b.vb.t,hc=c.b.vb.b-c.b.vb.t,H=Math.max(ha,hc,1);
   if(Math.abs(hc-ha)/Math.min(ha,hc)>.12&&!(c.hu>0||a.hu>0))add('M5',i,`키 ${ha.toFixed(1)}→${hc.toFixed(1)} ${clip(a.b.s)}→${clip(c.b.s)}`);
   const fa=a.b.vb.b-a.py,fc=c.b.vb.b-c.py;if(Math.abs(fc-fa)>H*.08)add('M6',i,`발 ${fa.toFixed(1)}→${fc.toFixed(1)} ${clip(a.b.s)}→${clip(c.b.s)}`);
   const xa=(a.b.vb.l+a.b.vb.r)/2-a.px,xc=(c.b.vb.l+c.b.vb.r)/2-c.px;if(Math.abs(xc-xa)>H*.14&&!(c.da>0)&&!(a.da>0))add('M7',i,`가로 ${xa.toFixed(1)}→${xc.toFixed(1)} ${clip(a.b.s)}→${clip(c.b.s)}`);}
  if(!sw&&/attack|atk/i.test(c.b.s.split('/').pop())&&c.at>0&&a.at>0&&c.at<a.at&&c.b.sx!=null&&a.b.sx!=null&&((c.b.sr?.[1]??0)*1e5+c.b.sx)<((a.b.sr?.[1]??0)*1e5+a.b.sx)&&c.b.flip===a.b.flip)add('M8',i,`칸 ${a.b.sx}→${c.b.sx} ${clip(c.b.s)}`);}
 // M2: 화면 가로 이동(앞뒤 프레임 px 차) 방향과 몸 방향
 let bad=0;for(let i=1;i<rec.length-1;i++){const c=rec[i];if(!c.b||!(c.mv||c.da>0))continue;const ux=rec[i+1].wx-rec[i-1].wx,uy=rec[i+1].wy-rec[i-1].wy,dx=ux-uy,dy=(ux+uy)/2;if(Math.abs(dx)<.02||Math.abs(dx)<Math.abs(dy)*.577)continue;if(!(c.da>0)&&(c.at>0||c.sk>0||c.ul>0||c.hu>0)){bad=0;continue;}
  const f=face(c.b);if(f&&f!==Math.sign(dx)){bad++;if(bad>=2)add('M2',i,`가로 ${dx>0?'▶':'◀'} 인데 몸 ${f>0?'▶':'◀'} ${clip(c.b.s)}${c.b.flip?' 뒤집음':''}${c.da>0?' (대시)':''}`);}else bad=0;}
 // M3: 동작 끝난 뒤 움직이는데 공격 그림이 남음
 let lag=0;for(let i=0;i<rec.length;i++){const c=rec[i];if(c.mv&&!(c.at>0)&&!(c.da>0)&&!(c.hu>0)&&c.b&&/attack|skill|atk|ult|cast|hit/i.test(c.b.s.split('/').pop())&&!(c.sk>0&&c.sk>0.3)){lag++;if(lag>2)add('M3',i,`이동 중 ${clip(c.b.s)} 남음 ${lag}프레임`);}else lag=0;}
 // M4: 피격 반응
 for(let i=1;i<rec.length;i++){const a=rec[i-1],c=rec[i];if(c.hu>a.hu+1e-6&&!(c.da>0||c.sk>0||c.ul>0)&&!(ARMOR.has(hero)&&c.at>0)){const win=rec.slice(i,i+3);if(!win.some(r=>r.b&&/hit|hurt/i.test(r.b.s.split('/').pop())))add('M4',i,`피격 ${c.hu} 인데 ${win.map(r=>clip(r.b?.s).split('/').pop()).join(',')}`);}
  if(!(c.hu>0)&&!(a.hu>0)&&c.b&&/hit|hurt/i.test(c.b.s.split('/').pop())&&rec.slice(Math.max(0,i-3),i).every(r=>!(r.hu>0)))add('M4',i,`피격 끝난 뒤 늦은 피격 그림 ${clip(c.b.s)}`);
  if(!(c.hu>0)&&a.hu>0&&c.b&&/hit|hurt/i.test(c.b.s.split('/').pop())){let k=i,n=0;while(k<rec.length&&!(rec[k].hu>0)&&rec[k].b&&/hit|hurt/i.test(rec[k].b.s.split('/').pop())){n++;k++;}if(n>2)add('M4',i,`피격 끝난 뒤 ${n}프레임 피격 그림 남음`);}}
 return v;}
// M5·M7 은 무기·자세까지 든 테두리로 재는 보조 지표(창·활·대검이 뻗으면 커진다) — 실패로 세지 않고 strip.py 띠로 사람이 본다.
const ADVISORY=new Set(['M5','M7']);
if(require.main===module){const [,,f,mode]=process.argv;const all=JSON.parse(fs.readFileSync(f,'utf8'));const sum={};let tot=0,adv=0;
 for(const [h,{rec}] of Object.entries(all)){const v=check(rec,h);for(const x of v)if(ADVISORY.has(x.rule))adv++;else tot++;sum[h]={};for(const x of v)sum[h][x.rule]=(sum[h][x.rule]||0)+1;if(mode==='-v')for(const x of v)console.log(h.padEnd(9),x.rule,String(x.t).padEnd(5),x.ph.padEnd(13),x.msg);}
 console.log(JSON.stringify(sum));console.log('TOTAL',tot,'(보조 M5·M7',adv+')');process.exitCode=tot?1:0;}
module.exports={check,face};
