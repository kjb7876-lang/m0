// R492 테두리 굽기 전후 비교: 같은 몸 그림을 예전(drawImage 불리기)·새(거리 변환)로 구워 시간·픽셀 차이·나란히 그림
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const zones=(process.argv[2]||'dist00,ep1a08').split(',');const out=process.argv[3]||'bake';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720}});const all=[];
for(const z of zones){await go(p,z);await p.evaluate(()=>{player.hp=9e8;player.invincible=1e9;guide=true;});await p.waitForTimeout(3000);
 const res=await p.evaluate(async(z)=>{const T=window.__STORYWORLD_PHASE1__.controller.state.three;const got=[];const base=T.render;
  T.render=function(frame){try{for(const c of frame.commands||[]){if(c?.kind!=='image'||c.mutable||!Array.isArray(c.sourceRect)||!['enemy','hero'].includes(c.owner?.kind))continue;const [a,b2]=c.points,sw=c.sourceRect[2],scr=Math.hypot(b2[0]-a[0],b2[1]-a[1]);if(sw<14||c.sourceRect[3]<18)continue;
   const k=(c.sourcePath||'')+c.sourceRect.join();if(got.some(g=>g.k===k))continue;got.push({k,img:c.image,rect:c.sourceRect.map(Math.round),side:c.owner.kind,scale:sw/scr});}}catch(e){}return base.apply(this,arguments);};
  await new Promise(r=>setTimeout(r,6000));T.render=base;
  const A=window.__STORYWORLD_COMBAT_READ_R409__;const BU=[1,2,3,4,6,8,11,15,20],bucket=v=>{for(const b of BU)if(v<=b)return b;return 20;};
  const rows=[];const sheets=[];
  for(const g of got.slice(0,14)){const r=bucket(Math.max(1,2.4*(g.side==='hero'?1.05:1)*g.scale));const [sx,sy,sw,sh]=g.rect;
   const time=mode=>{let row,best=1e9;for(let i=0;i<3;i++){const t=performance.now();row=A.bakeRaw(g.img,sx,sy,sw,sh,r,g.side,mode);const c=row?.canvas;if(c){c.getContext('2d').getImageData(0,0,1,1);}best=Math.min(best,performance.now()-t);}return {row,ms:best};};
   const o=time('old'),n=time('fast');if(!o.row||!n.row){rows.push({k:g.k.slice(-60),skip:true});continue;}
   const W=o.row.canvas.width,H=o.row.canvas.height,da=o.row.canvas.getContext('2d').getImageData(0,0,W,H).data,db=n.row.canvas.getContext('2d').getImageData(0,0,W,H).data;
   let sa=0,sc=0,big=0,cov=0;for(let i=0;i<da.length;i+=4){const d=Math.abs(da[i+3]-db[i+3]);sa+=d;if(d>64)big++;if(da[i+3]||db[i+3]){cov++;sc+=(Math.abs(da[i]-db[i])+Math.abs(da[i+1]-db[i+1])+Math.abs(da[i+2]-db[i+2]))/3;}}
   rows.push({zone:z,side:g.side,src:g.k.replace(/^.*\/assets\//,'').slice(0,50),size:sw+'x'+sh,r,oldMs:+o.ms.toFixed(2),fastMs:+n.ms.toFixed(2),alphaMeanDiff:+(sa/(da.length/4)).toFixed(2),alphaBigDiffPct:+(100*big/(da.length/4)).toFixed(2),rgbMeanDiffCovered:+(sc/Math.max(1,cov)).toFixed(1)});
   if(sheets.length<6){const c=document.createElement('canvas');const s=Math.max(1,Math.min(3,Math.floor(260/H)));c.width=(W*2+12)*s;c.height=H*s;const x=c.getContext('2d');x.fillStyle='#5a4e3c';x.fillRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;x.drawImage(o.row.canvas,0,0,W*s,H*s);x.drawImage(n.row.canvas,(W+12)*s,0,W*s,H*s);sheets.push(c.toDataURL('image/png'));}}
  return {rows,sheets};},z);
 res.rows.forEach(r=>console.log(JSON.stringify(r)));all.push(...res.rows);res.sheets.forEach((d,i)=>fs.writeFileSync(`${out}-${z}-${i}.png`,Buffer.from(d.split(',')[1],'base64')));}
const ok=all.filter(r=>!r.skip);const sum=k=>ok.reduce((s,r)=>s+r[k],0);console.log('SUM old',sum('oldMs').toFixed(1),'fast',sum('fastMs').toFixed(1),'n',ok.length,'meanAlphaDiff',(sum('alphaMeanDiff')/ok.length).toFixed(2));
fs.writeFileSync(out+'.json',JSON.stringify(all,null,1));await b.close();
