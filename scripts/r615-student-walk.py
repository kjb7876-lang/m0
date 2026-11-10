#!/usr/bin/env python3
"""R615b: 얼굴 없는 학생(사몽 S-02, R105 원화 mob-student.webp 169×420) Dots CX-0067MV 걷기 8칸 → 게임 시트.
사용: python3 scripts/r615-student-walk.py <CX-0067MV_mob-student_walk8.png>
- 칸 색을 원본(불투명 픽셀) 평균·편차에 맞추고, 칸 높이 320 으로 줄여 WebP 80 으로 저장(원본 파일은 그대로).
- 그리는 쪽(mob-student-walk-r615.js)은 원본 좌표를 칸 비율로 바꿔 쓰므로 원본과 같은 캔버스(169×420) 칸이어야 한다.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
import importlib.util
spec = importlib.util.spec_from_file_location('r615', os.path.join(os.path.dirname(__file__), 'r615-dots-walk.py'))
r615 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r615)
RT = r615.RT
ORIG = 'assets/r105/drive/mob-student.webp'
OUT = 'assets/r615/mob-student-walk8.webp'
CW, CH = 169, 420
H = 320

def main(png):
    ref = Image.open(os.path.join(RT, ORIG)).convert('RGBA')
    assert ref.size == (CW, CH), ref.size
    sheet = Image.open(png).convert('RGBA')
    assert sheet.size == (CW * 8, CH), sheet.size
    cw = round(CW * H / CH)
    out = Image.new('RGBA', (cw * 8, H), (0, 0, 0, 0))
    for i in range(8):
        c = r615.match_color(sheet.crop((i * CW, 0, (i + 1) * CW, CH)), ref).resize((cw, H), Image.LANCZOS)
        out.paste(c, (i * cw, 0))
    p = os.path.join(RT, OUT)
    out.save(p, 'WEBP', quality=80, method=6)
    print(OUT, out.size, os.path.getsize(p))

if __name__ == '__main__':
    main(sys.argv[1])
