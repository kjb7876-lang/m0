'use strict';
// Final verification always loads the shipped runtime. No source overlays.
const native=require('../harness.cjs');
function createHarness(options={}){const h=native.createHarness(options);if(h.context.__STORYWORLD_WORLD_PRESENTATION_R81__?.inspect().revision!=='R83')throw Error('Shipped R83 presentation missing');return h;}
module.exports={createHarness};
