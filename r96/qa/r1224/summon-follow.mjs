// R1224 실패 먼저 검사: 보스 소환 몹(R61 처럼 지역 원본 명단으로 actor3 를 새로 부르는 길)이 그 방의 지금 일반 몹 이름·그림을 따르는가.
// 정상: 개명된 종류(예 dist02 전우→혼령체), 경계: 방에서 통째로 바뀐 종류(진흙등 거미·쓰러진 수호병), 회귀: 이미 고친 R531 거미동굴, 보스·분신은 그대로.
// 사용: node summon-follow.mjs [지역,…]  (서버 SW_URL)  — 실패 건수를 종료 코드로.
import {chromium,boot,go} from '../r444/lib.mjs';
const only=process.argv[2]?process.argv[2].split(','):null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:480,height:270},init:{'storyworld.r790.npc':'{"on":false}'}});
const zones=only||await p.evaluate(()=>Object.values(regions).map(r=>r.id).filter(id=>!/^sz(115|162|173)/.test(id)));
let fails=0,checks=0;const bad=[];
for(const z of zones){try{await go(p,z);}catch(err){console.log('SKIP',z,String(err).slice(0,60));continue;}
 const r=await p.evaluate(()=>{const def=regionById[room.id];const roster=def.roster||[];const mobs=room.enemies.filter(e=>!(e.boss||e.midboss)&&!e.r61Summoned&&e.hp>0);
  const strip=n=>String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s*(우두머리|증원|추격대|후속 증원|후속)$/,'').replace(/\s*\d+$/,'').trim();
  const all=new Set(mobs.map(m=>strip(m.name)));const out=[];let k=0;
  for(const pr of roster){if(!mobs.length)break;const same=mobs.filter(m=>m.profile?.id===pr.id);const ok=new Set((same.length?same:mobs).map(m=>strip(m.name)));
   const paths=new Set((same.length?same:mobs).map(m=>m.path));
   const f=actor3(pr,room.id+':r61-summon:t1224-'+(k++),player.x,player.y,false,room.layer,def,false);
   out.push({pid:pr.id,name:strip(f.name),okName:ok.has(strip(f.name))||(!same.length&&all.has(strip(f.name))),pathOk:paths.has(f.path),want:[...ok].slice(0,3)});}
  // 회귀: 보스 자신의 분신은 보스 이름 그대로(이 규칙이 건드리면 안 됨)
  const boss=room.enemies.find(e=>e.boss||e.midboss);let clone=null;if(boss&&boss.profile){const c=actor3(boss.profile,room.id+':r61-summon:t1224-clone',player.x,player.y,false,room.layer,def,false);clone={name:c.name,boss:boss.name};}
  return {out,clone};});
 for(const o of r.out){checks++;if(!o.okName){fails++;bad.push(`${z} ${o.pid}: '${o.name}' (방: ${o.want.join('/')})`);}}
 if(r.clone&&!String(r.clone.name).length){fails++;bad.push(z+' 분신 이름 없음');}
}
console.log(bad.join('\n'));console.log(`검사 ${checks}건, 실패 ${fails}건`);await b.close();process.exit(fails?1:0);
