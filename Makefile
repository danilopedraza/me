serve:
	cd blog && zola serve

build:
	rm -rf site
	cd blog && zola build --output-dir ../site/blog/
	cp index.html style.css site/
