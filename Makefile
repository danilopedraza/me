build:
	rm -rf site
	mkdir site
	cd blog && bundle exec jekyll build --destination ../site/
	cp index.html style.css site/me/

blog-serve:
	cd blog && bundle exec jekyll serve --livereload
