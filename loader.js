function load() {
	var url = '';

	if (window.location.search.length>1) {
		url = window.location.search.substr(1);
	}

	folders.push(url);
	loadNextIndex(function() { showGallery(url); });
}

window.onload = load;
