#!/bin/sh
cd ../qpf/build
node r.js -o config.plain.js
cp output/qpf.js ../../gallery/static/lib/qpf.js