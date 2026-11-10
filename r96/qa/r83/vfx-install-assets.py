#!/usr/bin/env python3
"""Copy supplied selected PNG bytes and deterministic mapping; never re-encode."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT.parent/'assets-vfx-20261023/extracted'
DEST=ROOT/'hospital-three-pc/site/assets/vfx-r83'
review=json.loads((SOURCE/'review/selected-quality-64.json').read_text())
# Four static components per source boss family. Warning components are charge
# emblems above the caster, never replacements for true ground footprints.
groups=[
 ('dist01',['dist01_web_lane_warning','dist01_bone_filament_bolt','dist01_violet_claw_contact','dist01_snapped_silk_remnant']),
 ('dist02',['dist02_horn_charge_warning','dist02_reed_hand_projectile','dist02_horn_splash_impact','dist02_drag_groove_remnant']),
 ('dist05',['dist05_seven_heat_warning','dist05_ember_whip','dist05_split_stone_impact','dist05_cooling_whip_scorch']),
 ('dist06',['dist06_spatial_cleave_warning','dist06_sword_space_fissure','dist06_fireball_landing_crown','dist06_molten_cleave_scar']),
 ('ep1b03',['ep1b03_leviathan_warning','ep1b03_leviathan_projectile','ep1b03_leviathan_impact','ep1b03_leviathan_remnant']),
 ('ep1b04',['ep1b04_beelzebub_warning','ep1b04_beelzebub_projectile','ep1b04_beelzebub_impact','ep1b04_beelzebub_remnant']),
 ('ep1b05',['ep1b05_asmodeus_warning','ep1b05_asmodeus_projectile','ep1b05_asmodeus_impact','ep1b05_asmodeus_remnant']),
 ('ep1b08',['ep1b08_chairman_warning','ep1b08_chairman_projectile','ep1b08_chairman_impact','ep1b08_chairman_remnant']),
 ('ep1b09',['01_bootloader_strike_lanes','02_bootloader_neural_spike','03_bootloader_copy_interference','04_bootloader_drained_circuit']),
 ('u203',['05_controller_bombardment_grid','06_controller_shell_contrail','07_controller_steel_impact','08_controller_shell_furrow']),
 ('last301',['09_knight_six_lane_warning','10_knight_parry_counter','11_knight_six_contact_cuts','12_knight_six_ground_scars']),
 ('last303',['13_insomnia_gaze_warning','14_insomnia_split_gaze_ray','15_insomnia_layered_afterimage','16_insomnia_withdrawn_claw_lines']),
 ('kair03',['01-kair03-clock-hand-lane-warning','02-kair03-black-sand-needle','03-kair03-cable-hand-shear-impact','04-kair03-exhausted-sand-tracks']),
 ('murder03',['05-murder03-three-stop-bars','06-murder03-bent-rain-shard','07-murder03-coordinate-impact','08-murder03-roadlight-residue']),
 ('cult03',['09-cult03-interlocking-wall-warning','10-cult03-golden-order-wall','11-cult03-wall-hit-deflection','12-cult03-authority-fragments']),
 ('cult04',['13-cult04-spatial-fold-warning','14-cult04-neural-command-spear','15-cult04-time-stopped-collision','16-cult04-resurrection-stitch-arc'])]
records={r['concept_key'].split('/',1)[1]:r for r in review['selected']}
roles=['warning','projectile','impact','recovery'];regions={};used=[]
for region,keys in groups:
 regions[region]={}
 for role,key in zip(roles,keys):
  r=records[key];src=SOURCE/r['file'];b=src.read_bytes();assert hashlib.sha256(b).hexdigest()==r['sha256']
  target=DEST/r['file'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,target)
  entry={'key':key,'path':'assets/vfx-r83/'+r['file'],'sha256':r['sha256'],'dimensions':r['dimensions'],'decodedBytes':r['decoded_rgba_bytes'],'alpha64BBox':r['alpha64_bbox'],'role':role,'selection':r['decision']}
  if region=='cult04' and role=='recovery':entry['revivalOnly']=True
  if role=='projectile':
   headings={'dist01':147.536,'ep1b03':155.573,'ep1b04':151.009,'ep1b05':28.196,'ep1b08':23.384,'ep1b09':155.366,'u203':150.365,'last303':18.252,'kair03':137.280,'cult04':136.625}
   if region in headings:
    entry['bakedHeadingRadians']=headings[region]*3.141592653589793/180
    entry['headingBasis']='alpha64 weighted PCA axis; front sign chosen by visual inspection, decorative only'
   else:entry['casterEmblemOnly']=True
  regions[region][role]=entry;used.append(key)
assert len(set(used))==len(used)==64
for relative in ['README-quality.txt','review/selected-quality-64.json','SHA256SUMS.txt']:
 p=SOURCE/relative
 if not p.exists() and relative=='SHA256SUMS.txt':p=SOURCE/'SHA256SUMS'
 if p.exists():
  target=DEST/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
meta={'schema':'storyworld-selected-static-vfx-r83/v1','count':64,'upgraded':review['upgraded'],'retainedOriginal':review['retained_original'],'sourceBytesUnchanged':True,'regions':regions,'maxResidentImages':4,'maxConcurrentLoads':2,'staticSingleComponents':True}
(ROOT/'client-source/vfx-selected-data-r83.js').write_text('window.__STORYWORLD_SELECTED_VFX_DATA_R83__=Object.freeze('+json.dumps(meta,ensure_ascii=False,separators=(',',':'))+');\n')
(ROOT/'qa/r83/vfx-role-map.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'count':len(used),'regions':len(regions),'destination':str(DEST)}))
