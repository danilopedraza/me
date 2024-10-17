build:
	rm -rf site
	mkdir site
	cd blog && jekyll build --destination ../site/blog
	cp index.html style.css site

blog-serve:
	cd blog && bundle exec jekyll serve --livereload
