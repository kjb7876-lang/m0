'use strict';
// Render the real R462 ash and R302 hero control onto one captured STORY scene. Holding
// the background and camera isolates effect pixels from unrelated scene/UI animations.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium, devices} = require('playwright');
const url = process.env.SW_URL || 'http://127.0.0.1:4396/';
const timeout = 120000;

async function capture(browser, mobile) {
  const context = await browser.newContext(mobile ? {...devices['iPhone 13 Mini landscape'],
    viewport: {width:812, height:375}, screen:{width:812, height:375}, deviceScaleFactor:3}
    : {viewport:{width:1040,height:660}, deviceScaleFactor:1});
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = f => raf(t => { if (!window.qaHoldFrame || f !== window.frame) f(t); });
    });
    // Expose the normal R302 context installer for two independent offscreen replays.
    await page.route('**/hero-palette-r302.js*', async route => {
      const res = await route.fetch(), src = await res.text();
      const anchor = 'const patched=new WeakSet();';
      assert.ok(src.includes(anchor));
      await route.fulfill({response:res,body:src.replace(anchor, anchor + 'window.qaInstallPalette=patchCtx;')});
    });
    await page.goto(url,{waitUntil:'domcontentloaded',timeout});
    for (const id of ['#campaignNew54','#slotConfirmR73']) await page.locator(id).click({timeout});
    await page.waitForFunction(() => started && !loading,null,{timeout});
    await page.evaluate(async () => {
      for (let i=0; storyScene && i<200; i++) advanceScene();
      if (modal) closePanel(true);
      const save=serializeSave();
      for(const r of Object.values(regionById)) if(r.index<regionById.dist02.index) save.progress.STORY[r.id]=true;
      await restoreSave(save);
      for (let i=0; storyScene && i<200; i++) advanceScene();
      if(modal) closePanel(true);
      await enterRegion('dist02',null,{layer:'STORY',restore:true,noStory:true});
      // These sheets are normally requested on the first death. Keep them alive across
      // the frozen frame so unrelated scene-cache evictions can't race the replay.
      window.qaSmokeRows={};
      await Promise.all(['assets/r108/eden/smoke.webp','assets/r976/ash-flakes.webp'].map(async path=>{
        const image=new Image();image.src=new URL(path,document.baseURI).href;
        await image.decode();
        window.qaSmokeRows[path]={path,image,ready:true};
      }));
    });
    await page.evaluate(() => {
      for(let n=0;storyScene && n<200;n++)advanceScene();
      if(modal)closePanel(true);
    });
    console.log('Ash fixture entered',await page.evaluate(()=>({zone,layer,loading,modal,story:!!storyScene,actors:room?.enemies.length,regular:room?.enemies.filter(e=>e.hp>0&&!e.boss&&!e.midboss).length})));
    await page.waitForFunction(() => room?.id==='dist02' && !loading &&
      room.enemies.some(e=>e.hp>0&&!e.boss&&!e.midboss),null,{timeout});
    await page.evaluate(() => new Promise(resolve => {let n=0;function frame(){
      if(++n<8) requestAnimationFrame(frame); else {window.qaHoldFrame=true; resolve();}} requestAnimationFrame(frame);}));
    const clip=await page.evaluate(() => {
      const r=canvas.getBoundingClientRect();
      return {x:Math.ceil(r.left),y:Math.ceil(r.top),width:Math.floor(r.width),height:Math.floor(r.height)};
    });
    console.log('Ash camera held',clip);
    const background=(await page.screenshot({clip,scale:'css',timeout})).toString('base64');
    console.log('Ash background captured');
    const result=await page.evaluate(async ({clip,background})=>{
      const back=new Image();back.src='data:image/png;base64,'+background;await back.decode();
      const enemy=room.enemies.find(e=>__STORYWORLD_MOB_DEATH_R462__.owns(e)) ||
        room.enemies.find(e=>e.hp>0 && !e.boss && !e.midboss && !e.miniBoss && !e.r104Boss && !e.persona && e.elite!=='boss');
      const smoke=window.qaSmokeRows['assets/r108/eden/smoke.webp'].image;
      const lookup=readyImage;
      readyImage=function(path){return window.qaSmokeRows[path]||lookup.apply(this,arguments);};
      const original=ctx, data={}, images={};
      const point={x:player.x+1.25,y:player.y-.75}, projected=project(point.x,point.y);
      const actor=Object.assign({},enemy,{spawnState:'active',deadRecorded:false,visible:true,x:point.x,y:point.y});
      const strip=__STORYWORLD_SKILL_FX_R292__.play(player.hero,'w',point);
      if (!strip) throw Error('Missing active hero W control');
      await new Promise(resolve=>setTimeout(resolve,50));
      for (const variant of ['before','after','hero-before','hero-after']) {
        const cv=document.createElement('canvas');cv.width=back.naturalWidth;cv.height=back.naturalHeight;
        const g=cv.getContext('2d',{willReadFrequently:true});
        g.drawImage(back,0,0);g.scale(cv.width/W,cv.height/H);
        const draw=g.drawImage.bind(g), events=[];
        g.drawImage=function(im,...args) {
          if(im===smoke || im.__r302Path==='r302-tint') events.push({source:im===smoke,alpha:g.globalAlpha,frame:args.slice(0,4)});
          return draw(im,...args);
        };
        // On the old path the recorder could not carry R462's per-draw owner marker.
        if (variant.endsWith('before')) Object.defineProperty(g,'r462DeathSmoke',{get(){},set(){}});
        window.qaInstallPalette(g);ctx=g;
        try {
          if(variant.startsWith('hero')) {
            g.drawImage(smoke,256,256,256,256,projected.x-36,projected.y-68,72,72);
          } else {
            g.save();g.globalAlpha=0;drawEnemy(actor);g.restore();
            const fx={type:'enemyBurnDeath',sourceId:actor.id,...point,age:.5,life:1.25};
            drawBurnDeath3(fx);
            if(!fx.r462?.ash) throw Error('Native enemy ash was not adopted '+JSON.stringify({id:actor.id,nativeId:actor.nativeId,owns:__STORYWORLD_MOB_DEATH_R462__.owns(actor),error:__STORYWORLD_MOB_DEATH_R462__.inspect().lastError}));
          }
        } finally {ctx=original;}
        if(!events.length) throw Error('Shared smoke did not reach recorder: '+variant);
        data[variant]=events;images[variant]=cv;
      }
      function diff(a,b) {
        const rgba=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        const av=rgba(images[a]),bv=rgba(images[b]),w=images[a].width;
        let pixels=0,x0=w,y0=images[a].height,x1=-1,y1=-1,maxChannelDelta=0;
        for(let i=0;i<av.length;i+=4){
          const d=Math.max(Math.abs(av[i]-bv[i]),Math.abs(av[i+1]-bv[i+1]),Math.abs(av[i+2]-bv[i+2]));
          if(!d)continue;
          pixels++;maxChannelDelta=Math.max(maxChannelDelta,d);
          const x=i/4%w,y=Math.floor(i/4/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
        }
        return {pixels,bounds:pixels?[x0,y0,x1,y1]:null,maxChannelDelta};
      }
      readyImage=lookup;
      const report={zone,layer,hero:player.hero,enemy:enemy.nativeId||enemy.id,age:.5,point,projected,clip,
        deviceDPR:devicePixelRatio,renderDPR:dpr,events:data,ash:diff('before','after'),heroControl:diff('hero-before','hero-after')};
      return {report,png:Object.fromEntries(Object.entries(images).map(([k,v])=>[k,v.toDataURL().split(',')[1]]))};
    },{clip,background});
    const {report,png}=result, label=mobile?'iphone-mini':'desktop';
    console.log(label,JSON.stringify(report));
    assert.ok(report.ash.pixels>0);
    assert.equal(report.heroControl.pixels,0);
    assert.equal(report.events.before.some(e=>e.source),false);
    assert.ok(report.events.after.some(e=>e.source));
    if(process.env.SHOTS) {
      fs.mkdirSync(process.env.SHOTS,{recursive:true});
      for(const [name,payload] of Object.entries(png)) fs.writeFileSync(path.join(process.env.SHOTS,label+'-ash-'+name+'.png'),Buffer.from(payload,'base64'));
      fs.writeFileSync(path.join(process.env.SHOTS,label+'-ash.json'),JSON.stringify(report,null,2));
    }
  } finally {await context.close();}
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||process.env.CHROMIUM_EXECUTABLE_PATH,
    args:['--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{for(const mobile of [false,true]) await capture(browser,mobile);}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
