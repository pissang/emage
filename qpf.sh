#!/bin/sh
cd ../qpf/build
node r.js -o config.plain.js
cp output/qpf.js ../../qtek-image/static/lib/qpf.js

cp ../src/components/less/base.less ../../qtek-image/static/style/qpf/base.less
cp -r ../src/components/less/images ../../qtek-image/static/style/qpf/images