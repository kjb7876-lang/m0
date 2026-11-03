"""R248 몹 시트 표(js) 만들기: assign.json + 시트 index.json + 정리 보고서(report.json) → r96/client-source/mob-unique-r248-data.js
사용: python3 -I scripts/r248-mob-data.py <assign.json> <sheets index.json> <report.json> <out js>"""
import sys, json
A=json.load(open(sys.argv[1],encoding='utf8'));I=json.load(open(sys.argv[2],encoding='utf8'));R=json.load(open(sys.argv[3],encoding='utf8'))
byName={a['key']:a['id'] for a in A}
sheets={k:{'file':v['file'],'kind':v['kind'],'weapon':v['weapon'],'body':v['body'],'name':v['name']} for k,v in I['mobs'].items()}
data={'revision':'R248','dir':'assets/r248/mobs/','temporary':True,'byName':byName,'sheets':sheets,'storyNames':R['storyNameList']}
open(sys.argv[4],'w',encoding='utf8').write('// R248 몹 시트 표 — scripts/r248-mob-assign.py(전수 조사) + scripts/r248-mob-pixel-art.py(임시 픽셀 시트)로 만든다. 손으로 고치지 말고 다시 만든다.\n'
 '// 좋은 자산이 오면 그 이름 줄(byName)을 빼거나 시트를 바꾼다.\nwindow.__STORYWORLD_MOB_UNIQUE_R248_DATA__=Object.freeze('+json.dumps(data,ensure_ascii=False,separators=(',',':'))+');\n')
print('names',len(byName),'sheets',len(sheets))
