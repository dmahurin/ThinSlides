slides.html: slides.js
	( echo '<html><head><script>' ; cat slides.js ; echo '</script></head><body></body><html>' ) > slides.html
