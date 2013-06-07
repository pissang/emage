#!/bin/sh
cd ../qpf/build
node r.js -o config.js
cp ../dist/qpf.js ../../emage/example/static/lib/qpf.js

cp ../src/components/less/base.less ../../emage/example/static/style/qpf/base.less
cp -r ../src/components/less/images ../../emage/example/static/style/qpf/images

#cd ../../qtek
#grunt image
#cp dist/qtek.image.js ../qtek-image/thirdpart/qtek.image.js