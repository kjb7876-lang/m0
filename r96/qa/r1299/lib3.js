if(!window.__slowWrapped){window.__slowWrapped=1;window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};}
window.__freeze=()=>{window.__SLOW=1e-4;};window.__thaw=()=>{window.__SLOW=1;};return 'ok';
