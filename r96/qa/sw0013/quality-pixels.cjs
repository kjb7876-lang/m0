'use strict';

// Compare the actual CommandScene texture, the previous mobile source and the original
// at a fixed display size. Gameplay, camera and terrain are exercised by mobile-quality-browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium, webkit, devices} = require('playwright');

const cases = [
  {role:'hwando', file:'r1063/r283/hwando/r242/attack-n.webp', cell:[195,240], frame:7, height:90},
  {role:'swamp-boss', file:'r281/bosses/mb-dist02-walk6.webp', cell:[352,356], frame:2, height:116},
  {role:'enemy-warning', file:'r1107/persona-red-star.webp', cell:[192,192], frame:10, height:64},
  {role:'persona', file:'r1104b/persona-walk-front.webp', cell:[512,512], frame:2, height:88},
  {role:'boss-attack', file:'r760/boss/sheet-atkA.webp', cell:[512,512], frame:3, height:120}
];

async function capture(page, preset, asset) {
  // Each pose gets an empty scene and a fresh budget. No previous pose owns a texture.
  await page.goto(new URL('sw0013-frame-test', process.env.SW_URL || 'http://127.0.0.1:4396/').href);
  await page.addScriptTag({url:'dist/phase1.js'});
  await page.evaluate(async ({preset,asset}) => {
    const T = await import('./vendor/three/build/three.module.js');
    const renderer = new T.WebGLRenderer({antialias:true});
    const commands = new StoryPhase1.CommandScene(T);
    window.__STORYWORLD_PHASE1__={controller:{state:{active:'three',three:{renderer,commands}}}};
    window.__STORYWORLD_MOBILE_R63__={isMobile:()=>true};
    window.__STORYWORLD_MOBILE_TIER_R1023__={tier:()=>preset===3?1:0, active:()=>true, inspect:()=>({crashGuard:false,heap:null,slowFor:0,cooldownLeft:0})};
    window.__STORYWORLD_PERF7_R1043__={step:()=>preset};
    window.player=asset.role==='persona'?{hero:'lauren',personaHeroR1113:true}:{hero:'hwando'};
    window.room={id:asset.role==='boss-attack'?'last303':'dist02',enemies:[]};
    window.originalDraw=CanvasRenderingContext2D.prototype.drawImage;
  }, {preset,asset});
  await page.addScriptTag({url:'mobile-memory-r980.js'});
  return await page.evaluate(async ({preset,asset}) => {
    const api=__STORYWORLD_MOBILE_MEMORY_R980__, three=__STORYWORLD_PHASE1__.controller.state.three;
    const threshold=preset===3?2000000:500000;
    api.setHalfMin(threshold);
    api.setTierHalf(true,false);
    const im=new Image();
    im.src=new URL('assets/'+asset.file,document.baseURI).href;
    await im.decode();
    const w=im.naturalWidth,h=im.naturalHeight;
    function canvas2d(w,h) {
      const c=document.createElement('canvas');
      c.width=w; c.height=h;
      return c.getContext('2d',{willReadFrequently:true});
    }
    // Recreate R980's downsample filter before the priority rule existed.
    let old=im;
    if(w*h>=threshold) {
      const g=canvas2d(Math.round(w/2),Math.round(h/2));
      g.imageSmoothingQuality='high';
      originalDraw.call(g,im,0,0,w,h,0,0,g.canvas.width,g.canvas.height);
      old=g.canvas;
    }
    const selected=three.commands.texture(im,false).image;
    const [cw,ch]=asset.cell, cols=Math.floor(w/cw), sx=asset.frame%cols*cw, sy=Math.floor(asset.frame/cols)*ch;
    const dw=Math.round(cw*asset.height/ch),dh=asset.height;
    function paint(src,width=dw,height=dh){
      const kx=(src.naturalWidth||src.width)/w, ky=(src.naturalHeight||src.height)/h;
      const g=canvas2d(width,height);
      originalDraw.call(g,src,sx*kx,sy*ky,cw*kx,ch*ky,0,0,width,height);
      return g;
    }
    const pictures=[old,selected,im].map(src=>paint(src));
    const data=pictures.map(g=>g.getImageData(0,0,dw,dh).data);
    function diff(pixels,reference=data[2]){
      let sum=0,changed=0;
      for(let i=0;i<pixels.length;i+=4){
        let delta=0;
        for(let j=0;j<4;j++) delta+=Math.abs(pixels[i+j]-reference[i+j]);
        sum+=delta;
        if(delta)changed++;
      }
      return {changed,meanAbsoluteError:sum/pixels.length};
    }
    const sheet=canvas2d(dw*3,dh);
    sheet.fillStyle='#343035';sheet.fillRect(0,0,dw*3,dh);
    pictures.forEach((g,i)=>originalDraw.call(sheet,g.canvas,i*dw,0));
    const dimensions=s=>[s.naturalWidth||s.width,s.naturalHeight||s.height];
    // A small on-screen sprite can resolve identically even when its source gained detail.
    // Check art presence and also compare one atlas frame at 1:1, independently of display size.
    const detail=[old,selected,im].map(src=>paint(src,cw,ch).getImageData(0,0,cw,ch).data);
    let visible=0;
    for(let i=3;i<data[2].length;i+=4)if(data[2][i]>32)visible++;
    const result={visible,detailBefore:diff(detail[0],detail[2]),detailAfter:diff(detail[1],detail[2]),role:asset.role,preset,original:[w,h],previous:dimensions(old),selected:dimensions(selected),
      display:[dw,dh],before:diff(data[0]),after:diff(data[1]),diagnostic:api.inspect(),
      png:sheet.canvas.toDataURL().split(',')[1]};
    three.commands.release(im);
    three.renderer.dispose();
    return result;
  }, {preset,asset});
}

(async()=>{
  const browser=process.env.WEBKIT_EXECUTABLE_PATH
    ? await webkit.launch({executablePath:process.env.WEBKIT_EXECUTABLE_PATH})
    : await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_PATH,
      args:['--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const ctx=await browser.newContext({...devices['iPhone 13 Mini landscape'],viewport:{width:812,height:375}});
    await ctx.route('**/sw0013-frame-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Frame comparison</title>'}));
    const page=await ctx.newPage(), reports=[];
    for(const preset of [2,3])for(const asset of cases){
      const {png,diagnostic,...r}=await capture(page,preset,asset);
      console.log(JSON.stringify(r));
      assert.deepEqual(r.selected,r.original,asset.role+' must have native pixels when there is headroom: '+JSON.stringify(diagnostic));
      assert.equal(r.after.changed,0);
      assert.ok(r.visible>0,'frame must include visible art');
      assert.equal(r.detailAfter.changed,0);
      if(r.previous[0]!==r.original[0])assert.ok(r.detailBefore.changed>0,'source frame must contain fine detail');
      reports.push(r);
      if(process.env.SHOTS){
        fs.mkdirSync(process.env.SHOTS,{recursive:true});
        fs.writeFileSync(path.join(process.env.SHOTS,asset.role+'-'+preset+'.png'),Buffer.from(png,'base64'));
      }
    }
    if(process.env.SHOTS)fs.writeFileSync(path.join(process.env.SHOTS,'quality-frames.json'),JSON.stringify(reports,null,2)+'\n');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
