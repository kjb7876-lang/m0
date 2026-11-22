'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(process.env.SW_PLAYWRIGHT || 'playwright');

async function run() {
  const mobile = process.env.MOBILE === '1';
  const baseline = process.env.BASELINE === '1';
  const browser = await chromium.launch({executablePath:process.env.SW_CHROMIUM,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const viewport = mobile ? {width:812,height:375} : {width:1280,height:720};
    const page = await browser.newPage({viewport,hasTouch:mobile,ignoreHTTPSErrors:process.env.SW_BROWSER_PROXY_CA === '1'});
    const errors = [];
    const missing = [];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if (r.status()>=400 && r.url().includes('/assets/sw0022/')) missing.push(r.url());});
    await page.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d','{"on":false}'));
    await page.goto(process.env.SW_URL || 'http://127.0.0.1:4468/kairo22-new/',{waitUntil:'domcontentloaded',timeout:180000});
    await page.locator('#campaignNew54').click({timeout:180000});
    await page.locator('#slotConfirmR73').click();
    await page.waitForFunction(()=>started&&!loading,null,{timeout:180000});
    const skip = () => page.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
    await skip();
    await page.evaluate(async()=>window.__STORYWORLD_CHEAT777__.activate('777'));
    await page.waitForFunction(()=>!loading,null,{timeout:120000});
    await skip();
    await page.evaluate(async()=>{
      await window.__STORYWORLD_CHEAT777__.go('kair04','STORY');
      const p=window.__STORYWORLD_PROGRESSION_R71__;
      if(p?.difficultyState?.().open){p.selectDifficulty('normal');await p.confirmDifficulty();}
    });
    await page.waitForFunction(()=>room?.id==='kair04'&&!loading,null,{timeout:180000});
    await skip();
    await page.waitForFunction(()=>!loading&&!modal&&!storyScene&&window.__STORYWORLD_PHASE1__?.controller?.state?.three?.spatialBuilt,null,{timeout:120000});
    const actorIds = ['kair-guardian-01','kair-guardian-03','kair-elite-49'];
    const actors = await page.evaluate(async ids=>{
      tick=()=>{};
      const A=window.__STORYWORLD_KAIRO_SW0022__?.actors || {};
      await ensureImages(ids.flatMap(id=>Object.values(A[id]?.dirs||{}).map(a=>a.path)));
      return room.enemies.filter(e=>ids.includes(e.nativeId)).map(e=>e.nativeId);
    },actorIds);
    assert.deepEqual([...new Set(actors)].sort(),[...actorIds].sort());
    const mode = process.env.SW_SHOT;
    if(mode)fs.mkdirSync(mode,{recursive:true});
    for (const id of actorIds) {
      const cycle = await page.evaluate(id=>{
        const e=room.enemies.find(q=>q.nativeId===id);
        const entry=room.exploration.entry;
        const start=[];
        for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++)if(!blocked(entry.x+x,entry.y+y,.7,room))start.push([entry.x+x,entry.y+y]);
        const [x,y]=start.find(([x,y])=>[[0,0],[-1,-1],[1,1],[1,-1],[-1,1]].every(([dx,dy])=>!blocked(x+dx,y+dy,.65,room)))||[entry.x,entry.y];
        Object.assign(player,{x:x+2,y:y+1,invincible:99});
        cam={x,y};for(let i=0;i<17;i++)cameraTick(.05);
        const body=drawEnemy;
        const select=function(q,...a){if(q===e)return body.call(this,q,...a);};
        drawEnemy=select;
        try {
          const out={};
          const directions={down:[1,1],up:[-1,-1],right:[1,-1],left:[-1,1],attack:[1,-1]};
          for(const [direction,[dx,dy]] of Object.entries(directions)){
            Object.assign(e,{x,y,visible:true,disabled:false,spawnState:'active',moving:true,attack:null,rangedWindup:direction==='attack'?1:0,r61Action:null,storyAttackUntil5:0,hitTimer:0,stunned:0,frozen:0});
            const frames=new Map();
            for(let i=0;i<15;i++){
              e.x+=.055*dx;e.y+=.055*dy;time+=.075;
              const capture=window.__STORYWORLD_PHASE1__.captureVisual();
              const a=(capture.commands||capture).find(c=>c.sw0022&&c.owner?.kind==='enemy');
              const b=a||(capture.commands||capture).filter(c=>c.kind==='image'&&c.owner?.kind==='enemy').sort((l,r)=>Math.abs(r.points[3][1]-r.points[0][1])-Math.abs(l.points[3][1]-l.points[0][1]))[0];
              if(i>=6&&b)frames.set(b.sourcePath+'|'+b.sourceRect?.[0],{path:b.sourcePath,frame:b.sourceRect?.[0],added:!!b.sw0022});
            }
            out[direction]=[...frames.values()];
          }
          Object.assign(e,{x,y,attack:null,rangedWindup:0});
          for(let i=0;i<5;i++){e.x+=.06;e.y+=.06;time+=.06;window.__STORYWORLD_PHASE1__.captureVisual();}
          return out;
        } finally {drawEnemy=body;}
      },id);
      console.log(id,JSON.stringify(cycle));
      for(const direction of ['left','attack'])assert.ok(cycle[direction].every(c=>!c.added),`${id} ${direction}`);
      if(!baseline){
        const expected=await page.evaluate(id=>Object.keys(window.__STORYWORLD_KAIRO_SW0022__.actors[id].dirs),id);
        for(const direction of expected)assert.ok(cycle[direction].filter(c=>c.added).length>=3,`${id} ${direction} did not animate`);
      }
      if(mode&&id==='kair-guardian-03')await page.screenshot({path:mode+'/guardian-03.png'});
    }
    assert.deepEqual(errors,[]);
    assert.deepEqual(missing,[]);
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
