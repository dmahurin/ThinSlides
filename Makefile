slides.html: slides.js gallery.js gallery.css slides.css loader.js
	( echo '<html><head><script>' ; cat slides.js gallery.js loader.js ; echo '</script><style>' ; cat gallery.css slides.css ; echo '</style></head><body></body><html>' ) > slides.html
