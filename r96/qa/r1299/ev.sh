#!/bin/bash
# 사용: ev.sh 파일.js  또는 echo 'code' | ev.sh -
P=${PORT:-4499}; if [ "$1" = "-" ]; then curl -s -m 900 -X POST --data-binary @- localhost:$P/eval; else curl -s -m 900 -X POST --data-binary @"$1" localhost:$P/eval; fi; echo
