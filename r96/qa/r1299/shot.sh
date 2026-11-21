#!/bin/bash
# shot.sh 이름 : 시간 멈춤 → 0.7초 뒤 찍기 → 풀기
echo '__freeze();return 1' | ./ev.sh - >/dev/null; sleep 0.8; curl -s "localhost:4499/shot?f=$PWD/shots/$1.jpg" >/dev/null; echo '__thaw();return 1' | ./ev.sh - >/dev/null; echo "shot $1"
