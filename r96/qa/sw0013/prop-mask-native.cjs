// Called by scripts/build-sw0013-prop-masks.cjs --verify-browsers on each engine's real WebPs.
'use strict';
const assert=require('node:assert/strict');

module.exports=async function verifyNativeGeometry(page,overlay,table,engine) {
  await page.evaluate(()=>{
    window.BASE=new URL('./',document.baseURI).href;
    window.TILE=32; window.zoom=1; window.cam={x:0,y:0}; window.ctx=null;
    window.project=()=>({x:50,y:70});
    window.drawProp=prop=>{
      if(prop.flip) window.ctx.setTransform(-1,0,0,1,100,0);
      window.ctx.drawImage(prop.image,...prop.rect,40,42,20,28);
    };
  });
  await page.addScriptTag({content:overlay});
  const result=await page.evaluate(async table=>{
    const api=window.__STORYWORLD_PROPS_TIDY_R412__;
    const sample=(image,rect,flip=false)=>api.samplesOf({image,rect,flip,x:1,y:1});
    const rows=Object.entries(table).flatMap(([name,[w,h,rs]])=>rs.map(row=>({
      name, rect:row.slice(0,4), full:row[0]===0&&row[1]===0&&row[2]===w&&row[3]===h,
      distinct:row[4]!==row[5]
    })));
    const first=rows.find(r=>r.full&&r.distinct);
    const second=rows.find(r=>r.name!==first.name&&r.rect.some(n=>!Number.isInteger(n))&&r.distinct);
    sample(window.propInputs[first.name],first.rect);
    sample(window.propInputs[second.name],second.rect);
    const base=api.inspect().stats;
    const originals={}, controls={};
    for (const name of Object.keys(table)) {
      const original=new Image(),control=new Image();
      original.src=name;
      // Same file, different URL intentionally outside the exact baked asset allowlist.
      control.src=name+'?force-native-mask=1';
      await Promise.all([original.decode(),control.decode()]);
      originals[name]=original; controls[name]=control;
    }
    for(const {name,rect} of rows) for (const flip of [false,true]) {
      const points=sample(originals[name],rect,flip);
      const expected=sample(controls[name],rect,flip);
      if(!Array.isArray(expected)||JSON.stringify(points)!==JSON.stringify(expected))
        throw Error('native projected points differ: '+name+' '+rect+' (mirror='+flip+')');
    }
    const stats=api.inspect().stats;
    return {tested:rows.length, profile:stats.maskProfile, reads:stats.maskReadbacks-base.maskReadbacks,
      baked:stats.maskBaked-base.maskBaked, errors:stats.errors};
  },table);
  const calibrated=engine==='webkit';
  assert.equal(result.profile,calibrated?'webkit':'native');
  assert.equal(result.baked,calibrated?result.tested:0);
  assert.equal(result.reads,result.tested*(calibrated?1:2));
  assert.equal(result.errors,0);
  console.log('R412 projected points match native pixels, including mirrors:',engine,result.tested,
    calibrated?'calibrated masks':'native fallback');
};
