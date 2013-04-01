node r.js -o config.js

cd ../static-dist/lib
cat require.js\
	jquery.js\
	director.js\
	underscore.js\
	ZeroClipboard.js\
	three.js > lib.js
rm  require.js\
	jquery.js\
	director.js\
	underscore.js\
	ZeroClipboard.js\
	three.js

cd ../
mv -f boot-dist.js boot.js