'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../../client-source/props-tidy-r412.js'), 'utf8');
const table = vm.runInNewContext(source.split('// BEGIN GENERATED R412 MASKS')[1]
  .split('// END GENERATED R412 MASKS')[0] + '\nbakedPropMasks;');
const base = 'https://example.test/repo/game/';
class GameImage {
  constructor(asset, width, height) {
    this.src = this.currentSrc = base + asset;
    this.naturalWidth = width;
    this.naturalHeight = height;
    this.complete = true;
  }
}
let nativeReads = 0, half = false;
let alpha = new Uint8ClampedArray(560 * 4);
function canvas() {
  const ctx = {
    filter: 'none', imageSmoothingEnabled: true, imageSmoothingQuality: 'low',
    setTransform(a, b, c, d, e, f) {this.transform = {a,b,c,d,e,f};},
    getTransform() {return this.transform;},
    clearRect() {}, drawImage() {},
    getImageData() {nativeReads++; return {data:alpha};}
  };
  return {getContext() {return ctx;}};
}
function createGame(memory={usesHalfSource: () => half}){
const state = {
  HTMLImageElement: GameImage, window: {__STORYWORLD_MOBILE_MEMORY_R980__:memory},
  BASE: base, document: {createElement:canvas}, atob, setTimeout(){}, localStorage: {getItem(){return null;}},
  TILE: 32, zoom: 1, cam:{x:0,y:0}, ctx:{}, project:()=>({x:50, y:70}),
  drawProp(prop) {
    if(prop.flip) state.ctx.setTransform(-1,0,0,1,100,0);
    state.ctx.drawImage(prop.image, ...prop.rect, 40, 42, 20, 28);
  }
};
vm.runInNewContext(source, state);
const R = state.window.__STORYWORLD_PROPS_TIDY_R412__;
return {stats:()=>R.inspect().stats,sample:(image,rect,flip=false)=>R.samplesOf({image,rect,flip,x:1,y:1})};
}
const expectedCells = bytes => {
  const out = [];
  for(let i=0;i<560;i++)if(bytes[i>>3] & (1<<(i&7))) out.push(i);
  return out;
};
const setAlpha = cells => {
  alpha.fill(0);
  for(const i of cells)alpha[i*4+3]=80;
};
const rows = Object.entries(table);
assert.ok(rows.length,'generated prop masks must be present');
const sheets = rows.flatMap(([asset,[w,h,rects]])=>rects.map(row=>({
  asset,w,h,row,rect:row.slice(0,4),full:row[0]===0&&row[1]===0&&row[2]===w&&row[3]===h
})));
const full=sheets.find(sheet=>sheet.full&&sheet.row[4]!==sheet.row[5]);
const fractional=sheets.find(sheet=>sheet.asset!==full.asset && sheet.rect.some(n=>!Number.isInteger(n)) &&
  (sheet.rect[2]!==full.rect[2]||sheet.rect[3]!==full.rect[3]) && sheet.row[4]!==sheet.row[5]);
assert.ok(full&&fractional,'two distinct fingerprints required');
function probe(game,sheet,col) {
  setAlpha(expectedCells(Buffer.from(sheet.row[col],'base64')));
  return game.sample(new GameImage(sheet.asset,sheet.w,sheet.h),sheet.rect);
}
const oldMemory=createGame({});
probe(oldMemory,full,4);
probe(oldMemory,fractional,4);
assert.equal(oldMemory.stats().maskBaked,0);
assert.equal(oldMemory.stats().maskProbes,0);
assert.equal(oldMemory.stats().maskReadbacks,2,'older R980 safely uses native pixels');
const rejected=createGame();
alpha.fill(0);
rejected.sample(new GameImage(full.asset,full.w,full.h),full.rect);
assert.equal(rejected.stats().maskProfile,'native','unrecognized native signature');
probe(rejected,fractional,4);
assert.equal(rejected.stats().maskBaked,0);
const conflict=createGame();
probe(conflict,full,4);
probe(conflict,fractional,5);
assert.equal(conflict.stats().maskProfile,'native','contradictory signatures');
let game;
for(const [column,profile] of [[4,'chromium'],[5,'webkit']]) {
  game=createGame();
  probe(game,full,column);
  assert.equal(game.stats().maskProfile,'pending');
  probe(game,full,column);
  assert.equal(game.stats().maskProfile,'pending','repeated calibration from one asset is insufficient');
  probe(game,fractional,column);
  assert.equal(game.stats().maskProfile,profile);
  for(const {asset,w,h,row,rect} of sheets) {
    const image = new GameImage(asset,w,h);
    const bytes = Buffer.from(row[column], 'base64');
    assert.equal(bytes.length,70,asset);
    const cells=expectedCells(bytes);
    setAlpha(cells);
    const start=nativeReads;
    const normal=game.sample(image,rect), mirror=game.sample(image,rect,true);
    assert.equal(nativeReads,start,asset);
    assert.equal(normal.length,cells.length);
    const foreign = new GameImage(asset,w,h);
    foreign.src=foreign.currentSrc='https://foreign.example/'+asset;
    assert.deepEqual(game.sample(foreign,rect),normal,asset+' projected coordinates');
    assert.deepEqual(game.sample(foreign,rect,true),mirror,asset+' mirror coordinates');
    assert.equal(nativeReads,start+1);
  }
  assert.equal(game.stats().maskBaked,sheets.length);
}
const sample=game.sample;
const [asset,[w,h,[row]]]=rows[0];
const rect=row.slice(0,4), im=new GameImage(asset,w,h);
const mask=sample(im,rect);
assert.ok(mask.length);
const start=nativeReads;
setAlpha([23]); alpha[24*4+3]=79;
half=true;
assert.equal(sample(im,rect).length,1);
assert.equal(nativeReads,start+1,'a half-source has its own live sampling');
half=false;
assert.deepEqual(sample(im,rect),mask);
const close=rect.slice();close[0]+=.03125;
im.complete=false;assert.equal(sample(im,rect),null);
im.complete=true;assert.equal(sample(im,close).length,1);
assert.equal(nativeReads,start+2,'nearby fractional crops must not collide');
im.currentSrc=im.src=base+'assets/unknown.png';
assert.equal(sample(im,rect).length,1);
assert.equal(nativeReads,start+3,'reassigned images invalidate cache');
const changedSize=new GameImage(asset,w+1,h);
assert.equal(sample(changedSize,rect).length,1);
const dynamic={width:w,height:h,src:base+asset};
setAlpha([6]);assert.equal(sample(dynamic,rect).length,1);
setAlpha([6,7]);assert.equal(sample(dynamic,rect).length,2);
assert.equal(nativeReads,start+6,'mutable canvas pixels stay live');
const tagged={width:w,height:h,__storyworldStaticSource:{path:base+asset,immutable:true,revision:1}};
let before=nativeReads;
setAlpha([1,2]);assert.equal(sample(tagged,rect).length,2);
setAlpha([3]);assert.equal(sample(tagged,rect).length,2);
assert.equal(nativeReads,before+1,'immutable derived pixels reuse native mask');
tagged.__storyworldStaticSource.revision++;
assert.equal(sample(tagged,rect).length,1);
tagged.width++;
setAlpha([7,8]);assert.equal(sample(tagged,rect).length,2);
assert.equal(nativeReads,before+3,'changed static revision and dimensions invalidate');
console.log('PASS R412',sheets.length,'× 2 calibrated backends','exact packaged masks bypass native reads; mirrors, fractional crops, image changes, half sources, mutable sources and alpha 79/80 verified');
