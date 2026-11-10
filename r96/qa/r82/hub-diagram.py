"""Floor geometry evidence only; not a browser screenshot."""
import json,subprocess
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PatchCollection
from matplotlib.patches import Rectangle
ROOT=Path(__file__).resolve().parents[2]
subprocess.run(['node','-e',"const{createHarness}=require('./qa/harness.cjs');const h=createHarness();require('fs').writeFileSync('qa/r82/hub-v6-geometry.json',JSON.stringify(h.context.StoryPhase1.explorationLayout('hub','forest',true,{layerR81:'STORY'})));"],cwd=ROOT,check=True)
directory=ROOT/'qa/r82'
old=json.loads((directory/'hub-v5-baseline.json').read_text())['layout']
new=json.loads((directory/'hub-v6-geometry.json').read_text())
fig,ax=plt.subplots(1,2,figsize=(12,7),facecolor='#171d23')
for a,L,title in zip(ax,[old,new],['V5: old opening refuge','V6: garden and cloister']):
 a.set_facecolor('#242d33');a.add_collection(PatchCollection([Rectangle((x,y),1,1) for x,y in L['floorCells']],facecolor='#718b7b',edgecolor='none'))
 for w in L['walls']:
  if not w.get('angle'):a.add_patch(Rectangle((w['x']-w['width']/2,w['y']-w['depth']/2),w['width'],w['depth'],facecolor='#d3ded1',edgecolor='none'))
 a.scatter([15,15],[19,13],c=['#58caff','#ffe898'],s=35,zorder=5);a.set_aspect('equal');a.set_xlim(-2,82);a.set_ylim(72,-2);a.set_title(title,color='white');a.tick_params(colors='#acb7c2');a.grid(alpha=.08)
ax[1].scatter([30],[22],c='#e8a1ff',s=40,zorder=5)
fig.suptitle('CPU floor / wall geometry. Cyan: spawn; yellow: altar; magenta: exit. Not a game screenshot.',color='white',fontsize=10)
fig.tight_layout();fig.savefig(directory/'hub-comparison.png',dpi=150)
