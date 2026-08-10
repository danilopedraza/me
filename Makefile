build:
	rm -rf site
	cd blog && zola build --output-dir ../site/blog/
	cp index.html style.css site/
	mkdir -p ./site/en/
	cp ./en/index.html site/en/
	mkdir -p ./site/menu
	cp -r ./menu site

serve:
	cd blog && zola serve
