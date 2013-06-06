#!/bin/sh
cd ../qpf/build
node r.js -o config.js
cp ../dist/qpf.js ../../qtek-image/example/static/lib/qpf.js

cp ../src/components/less/base.less ../../qtek-image/example/static/style/qpf/base.less
cp -r ../src/components/less/images ../../qtek-image/example/static/style/qpf/images

#cd ../../qtek
#grunt image
#cp dist/qtek.image.js ../qtek-image/thirdpart/qtek.image.js