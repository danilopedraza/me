build:
	rm -rf site
	cd blog && zola build --output-dir ../site/blog/
	cp index.html style.css site/
	mkdir -p ./site/en/
	cp ./en/index.html site/en/

build-menu:
	cd menu && rm -rf lib && mkdir lib
	wget https://unpkg.com/three@0.139.2/build/three.module.js --directory-prefix=./menu/lib/

serve:
	cd blog && zola serve
