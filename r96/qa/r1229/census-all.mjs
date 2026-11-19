// R1229 맵별 도형 투사체 전수 확인: 지역마다 모든 몹·보스를 영웅 둘레로 모아 싸우게 하고(무적·불사),
// 렌더러에 실제로 넘어간 명령(R1229 렌더 감싸기 뒤)에서 적 몫 도형(fill/stroke)·탄 그림 대체(회색 고리 projectile-core)·그림 없는 적 탄을 센다.
// node census-all.mjs <out.json> [게임초=6] [지역,…]
import fs from 'node:fs';
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2]||'census-all.json',secs=+(process.argv[3]||6),only=process.argv[4]?process.argv[4].split(','):null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await p.evaluate(()=>{player.hero='hunter';});
const zones=only||await p.evaluate(()=>Object.keys(regionById).filter(z=>z!=='hub'));
const res=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{};
for(const z of zones){if(res[z]&&!only)continue;const t0=Date.now();
 try{await go(p,z);
  const r=await p.evaluate(async secs=>{const keep=room.enemies.filter(e=>e.hp>0);const names=[...new Set(keep.map(e=>String(e.name||'').replace(/ \d+$/,'')))];
   keep.forEach((e,i)=>{const a=i/keep.length*Math.PI*2,d=2.5+(i%3)*1.2;if(!e.stationary&&!e.r1229Fixed&&!e.r75Tower&&!e.r251Circle){e.x=player.x+Math.cos(a)*d;e.y=player.y+Math.sin(a)*d;}e.spawnState='active';e.visible=true;e.disabled=false;e.hp=e.maxHp=1e8;});
   room.engaged=true;const iv=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);
   const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;let bars=0;const shape={},smp={},core={},noimg={},shots={};let frames=0;
   three.render=function(f){const rr=base.apply(this,arguments);try{frames++;const cs=f.commands||[];const live=new Map((typeof projectiles!=='undefined'?projectiles:[]).filter(q=>!q.friendly).map(q=>[String(q.id),q]));
     const drawnShot=new Set();
     for(const c of cs){const o=c.owner||{},id=String(o.id||''),k=o.kind||'';
      if(['hero','ground','scene','prop','objective','ui','player','exits','exit','portal'].includes(k)||/hero|player|ego-|aura|shadow:|rank:|r521:contact/.test(id))continue;
      const m=/projectile:(.+)$/.exec(id);if(m&&live.has(m[1])){if(c.kind==='image')drawnShot.add(m[1]);}
      if((c.kind==='fill'||c.kind==='stroke')&&!/^r101:/.test(id)){const PP=(c.points||[]).concat(...(c.paths||[]).map(q=>q.points||[]));const xs=PP.map(v=>v[0]),ys=PP.map(v=>v[1]);const bw=xs.length?Math.max(...xs)-Math.min(...xs):0,bh=ys.length?Math.max(...ys)-Math.min(...ys):0;if(k==='enemy'&&(bh<=8||bw<=8)){bars++;continue;}const ix=id.indexOf(':'),key=k+'|'+(ix<0?id:id.slice(0,ix+1)+id.slice(ix+1).replace(/[0-9]+(\.[0-9]+)?/g,'#')).slice(0,52);shape[key]=(shape[key]||0)+1;if(!smp[key]){smp[key]=JSON.stringify(c,(kk,v)=>kk==='image'||kk==='style'?undefined:(typeof v==='number'?Math.round(v):v)).slice(0,420)+' '+(c.style?.fillStyle||c.style?.strokeStyle||'');}}
      else if(c.kind==='image'&&/projectile-core/.test(String(c.sourcePath||''))){const key=k+'|'+id.replace(/[0-9]+(\.[0-9]+)?/g,'#').slice(0,40);core[key]=(core[key]||0)+1;}}
     for(const [qid,q] of live){const nm=String(q.type||q.kind||'shot');shots[nm]=(shots[nm]||0)+1;if(!drawnShot.has(qid)){noimg[nm]=(noimg[nm]||0)+1;}}
    }catch(e){}return rr;};
   const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>secs)return r();setTimeout(g,150);};g();});three.render=base;clearInterval(iv);
   return {names,n:keep.length,frames,bars,shape,smp,core,shots,noimg};},secs);
  res[z]={...r,ms:Date.now()-t0};}catch(e){res[z]={error:String(e.message||e).slice(0,200)};}
 fs.writeFileSync(out,JSON.stringify(res,null,1));
 const r=res[z];console.log(z,r.error||`n=${r.n} f=${r.frames} shape=${Object.values(r.shape).reduce((a,b)=>a+b,0)} core=${Object.values(r.core).reduce((a,b)=>a+b,0)} shots=${JSON.stringify(r.shots)} noimg=${JSON.stringify(r.noimg)}`);}
await b.close();
