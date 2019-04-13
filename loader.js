function load() {
	var url = '';

	if (window.location.search.length>1) {
		url = window.location.search.substr(1);
	}

	if(url != '' && url.slice(-1) != '/') { url += '/'; }
	folders.push(url);
	loadNextIndex(function() { showGallery(url); });
}

window.onload = load;
