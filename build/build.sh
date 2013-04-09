node r.js -o config.js

cd ../static-dist/lib
#concat lib
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
mv -f index-dist.html index.html

rm -rf modules

#build less
cd style
lessc app.less > app.css
lessc qpf/base.less > qpf/base.css
rm app.less qpf/base.less