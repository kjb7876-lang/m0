#!/usr/bin/env python3
"""Build a separate local ep1a08 candidate from the pinned R77 output.

No network, release configuration or baseline files are changed. The separate
candidate patches the renderer and hospital cache/get/attach connection only.
This is a local review artifact, not part of the public build/deploy pipeline.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_HTML = 'b68e0736263049e4cf58b69d5fd1b04c57afbb8a89cf5ffaca482e1bf131e4c4'
BASE_RENDERER = 'cc71147117dbbb7fd04d2619c95408ad810804b1c1bb5462afbc09bd93f0502c'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def transform(renderer):
    def once(old, new):
        nonlocal renderer
        if renderer.count(old) != 1:
            raise ValueError('B1 exact anchor mismatch: ' + old[:100])
        renderer = renderer.replace(old, new, 1)

    definition = (ROOT / 'client-source/hospital-prototype-b1.js').read_text()
    once('function hospitalMazeContains12(u,v){', definition + '''
function hospitalMazeContains12(u,v,prototype=false){
 if(prototype&&HOSPITAL_PROTOTYPE_RECTS_B1.some(([u0,u1,v0,v1])=>u>=u0&&u<u1&&v>=v0&&v<v1))return true;''')
    once('function hospitalInside12(x,y){return x>=1&&x<29&&y>=1&&y<29||hospitalMazeContains12(x-y,x+y);}',
         'function hospitalInside12(x,y,prototype=false){return x>=1&&x<29&&y>=1&&y<29||hospitalMazeContains12(x-y,x+y,prototype);}')
    once('function hospitalSurface12(){', '''function hospitalSurface12(prototype=false){
 const U=prototype?HOSPITAL_PROTOTYPE_U_B1:HOSPITAL_U12,V=prototype?HOSPITAL_PROTOTYPE_V_B1:HOSPITAL_V12;''')
    # Scope replacements to the surface builder. Every partition breakpoint is
    # shared with the boundary builder, so rendered floor and collision agree.
    a = renderer.index('function hospitalSurface12(')
    b = renderer.index('function hospitalPointSegment12(', a)
    body = renderer[a:b]
    body = body.replace('HOSPITAL_U12.length', 'U.length').replace('HOSPITAL_V12.length', 'V.length')
    body = body.replace('HOSPITAL_U12[', 'U[').replace('HOSPITAL_V12[', 'V[')
    body = body.replace('(V[j-1]+V[j])/2))', '(V[j-1]+V[j])/2,prototype))')
    body = body.replace(' for(let i=1;i<U.length;i++)', ''' if(prototype){for(const [u0,u1,v0,v1] of hospitalPrototypeSurfaceRectsB1(U,V)){
  const p=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]].map(([u,v])=>[(v+u)/2,(v-u)/2]);annex.push(...hospitalSubtractPolygon(p,core));
 }}else for(let i=1;i<U.length;i++)''', 1)
    renderer = renderer[:a] + body + renderer[b:]
    once('if(!hospitalInside12(x,y))return true;', 'if(!hospitalInside12(x,y,!!L.hospitalPrototypeB1))return true;')
    once('if(!hospitalInside12(mid[0]+n[0]*.01,mid[1]+n[1]*.01))',
         'if(!hospitalInside12(mid[0]+n[0]*.01,mid[1]+n[1]*.01,!!L.hospitalPrototypeB1))')
    once('function hospitalVisualWalls12(coreWalls){', 'function hospitalVisualWalls12(coreWalls,prototype=false){')
    once('for(const u of HOSPITAL_U12)lines.push', 'for(const u of (prototype?HOSPITAL_PROTOTYPE_U_B1:HOSPITAL_U12))lines.push')
    once('for(const v of HOSPITAL_V12)lines.push', 'for(const v of (prototype?HOSPITAL_PROTOTYPE_V_B1:HOSPITAL_V12))lines.push')
    once('const inside=hospitalInside12;', 'const inside=(x,y)=>hospitalInside12(x,y,prototype);')
    once('function hospitalMazeLayout5(core){', 'function hospitalMazeLayout5(core,prototype=false){')
    once('function maze(u,v){return hospitalMazeContains12(u,v);}', 'function maze(u,v){return hospitalMazeContains12(u,v,prototype);}')
    once('hospitalVisualWalls12(walls.filter(w=>!w.annex))', 'hospitalVisualWalls12(walls.filter(w=>!w.annex),prototype)')
    once('surface12=hospitalSurface12(),physical=', 'surface12=hospitalSurface12(prototype),physical=')
    once("hospitalLayoutRevision:'hospital-expanded-corridors-r52-v1',hospitalAnalytic12:true,",
         "hospitalLayoutRevision:prototype?HOSPITAL_PROTOTYPE_B1.revision:'hospital-expanded-corridors-r52-v1',...(prototype?{hospitalPrototypeB1:HOSPITAL_PROTOTYPE_B1}:{}),hospitalAnalytic12:true,")
    # Mixed public/local co-op clients must retain the published spatial domain.
    # This local solo prototype adds no protocol/version negotiation contract.
    once("if(id==='ep1a08')return hospitalMazeLayout5(core);", "if(id==='ep1a08'){const coop=window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';return hospitalMazeLayout5(core,coop==='off');}")
    once('inside=u=>hospitalInside12(g.x+u/2,g.y-u/2);', 'inside=u=>hospitalInside12(g.x+u/2,g.y-u/2,!!layout.hospitalPrototypeB1);')
    return renderer


def transform_html(html):
    def once(old, new):
        nonlocal html
        if html.count(old) != 1:
            raise ValueError('B1 hospital connection anchor mismatch: ' + old[:100])
        html = html.replace(old, new, 1)

    once("key=id+':'+seed+':'+version+':r75:'+r75version;let value=layouts.get(key);",
         "key=id+':'+seed+':'+version+':r75:'+r75version+(id==='ep1a08'?':hospital-mode:'+mode:'');let value=layouts.get(key);")
    once('function attach(r){if(!r||r.exploration)return r;', '''function attach(r){
  if(!r)return r;
  if(r.id==='ep1a08'&&r.exploration){
   const next=get(r.id,r.layer);
   if(r.exploration!==next){
    r.exploration=next;
    if(r===room&&player&&blocked(player.x,player.y,.4,r)){
     // Reuse native hospital entry selection and R73 path-based arrival.
     const start=window.__STORYWORLD_HOSPITAL_R5__?.selected(r)||next.entry;
     if(blocked(start.x,start.y,.4,r))throw Error('Hospital r5 start collision: '+start.id);
     const p=window.__STORYWORLD_PORTAL_ARRIVAL_R73__?.point(start,r)||start;
     player.x=p.x;player.y=p.y;player.direction=facing(-1,-1);
     route=[];command=null;target=null;cam={x:p.x,y:p.y};
     window.__STORYWORLD_HOSPITAL_R5__?.clampCamera();
    }
   }
   return r;
  }
  if(r.exploration)return r;''')
    return html


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', type=Path, default=ROOT / '_pages/docs')
    parser.add_argument('--output', type=Path, default=ROOT / 'out/hospital-b1/site')
    args = parser.parse_args()
    baseline, output = args.baseline.resolve(), args.output.resolve()
    if output.exists() or baseline == output or baseline in output.parents:
        raise ValueError('A new output directory outside the baseline is required')
    if not output.is_relative_to(ROOT / 'out'):
        raise ValueError('Local review artifacts must stay under this checkout/out')
    html = (baseline / 'index.html').read_bytes()
    renderer = (baseline / 'dist/phase1.js').read_bytes()
    if sha(html) != BASE_HTML or sha(renderer) != BASE_RENDERER:
        raise ValueError('Exact pinned R77 baseline is required')
    candidate = transform(renderer.decode()).encode()
    candidate_html = transform_html(html.decode()).encode()
    shutil.copytree(baseline, output)
    (output / 'dist/phase1.js').write_bytes(candidate)
    (output / 'index.html').write_bytes(candidate_html)
    # Bind the local asset table to candidate bytes; release metadata is retained
    # as historical baseline metadata, never represented as a release approval.
    manifest_path = output / 'web-manifest-r62.json'
    manifest = json.loads(manifest_path.read_text())
    prior_size = next(row['bytes'] for row in manifest['files'] if row['path'] == 'dist/phase1.js')
    prior_html_size = next(row['bytes'] for row in manifest['files'] if row['path'] == 'index.html')
    for row in manifest['files'] + manifest['largest']:
        if row.get('path') == 'dist/phase1.js':
            row['sha256'], row['bytes'] = sha(candidate), len(candidate)
        elif row.get('path') == 'index.html':
            row['sha256'], row['bytes'] = sha(candidate_html), len(candidate_html)
    manifest['totalBytes'] += len(candidate) - prior_size + len(candidate_html) - prior_html_size
    manifest['webHTMLSha256'] = sha(candidate_html)
    manifest['status'] = 'local structure candidate; pending B review'
    manifest['remotePublished'] = False
    manifest['deploymentSHA'] = None
    manifest['deploymentUTC'] = None
    manifest['hospitalPrototypeB1'] = {'localOnly': True, 'baselineRendererSHA256': BASE_RENDERER, 'candidateRendererSHA256': sha(candidate), 'candidateHTMLSHA256': sha(candidate_html), 'approval': 'pending B review'}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n')
    evidence = {'baselineCommit': 'f415dfbf783c6290ab99125193d800429799c9f9', 'baselineHTMLSHA256': BASE_HTML, 'baselineRendererSHA256': BASE_RENDERER, 'htmlSHA256': sha(candidate_html), 'rendererSHA256': sha(candidate), 'output': str(output), 'sourceFiles': {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in [ROOT / 'client-source/hospital-prototype-b1.js', Path(__file__).resolve()]}, 'scope': 'local ep1a08 structure candidate; hospital mode cache/attach correction; no publish; baseline and original assets preserved'}
    (output.parent / 'build.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence))


if __name__ == '__main__':
    main()
