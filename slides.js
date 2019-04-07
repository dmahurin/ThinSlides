var loaded = [];
var folders = [];
var current = 0;
var slides = [];
var slide_audio = [];
var folder_image = [];
var gallery_body;
var gallery_top = 0;

function loadNextIndex(cb) {
	if(folders.length == 0) return;
	var url = folders.shift();

	url = url.replace(/\?.*$/, '');
	if(loaded[url] !== undefined) { return; }

	loaded[url] = 1;
	var req = new XMLHttpRequest();
	req.onload = function() { indexLoaded(url, req.responseXML); if(cb !== undefined) { cb(); }};
	req.open("GET", url == '' ? './' : url);
	req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	req.responseType = "document";
	req.send();
}

function indexLoaded(dirURL, responseXML) {
	var basePath = window.location.pathname.match(/.*\//)[0];

	var newdirs = [];
	var files = [];
	var elements = responseXML.getElementsByTagName("a");
	for (var i=0;i<elements.length;i++) {
		if(elements[i].origin != window.location.origin) continue;
		var url = elements[i].pathname;

		// change url to relative and skip non children
		if(url.indexOf(basePath) === 0) { url = url.slice(basePath.length); } else { continue; }
		if(url.indexOf(dirURL) !== 0 || url.length <= dirURL.length) continue;

		if(url.charAt(dirURL.length) == '.') { continue; }
		if(url.charAt(dirURL.length) == '@') { continue; }
		var img = elements[i].getElementsByTagName('img');
		if ( url[url.length-1]=="/") {
			if(img.length > 0) {
				img = img[0].src;
				folder_image[url] = img
			}
			newdirs.push(url);
		} else {
			files.push(url);
		}
	}
	folders = newdirs.concat(folders);
	addFiles(files);
}

function showIndex(url) {
	var basePath = window.location.pathname.match(/.*\//)[0];
	var body = document.createElement("body");
	var h1 = document.createElement("h1");
	h1.appendChild(document.createTextNode('Index of ' + basePath + decodeURIComponent(url)));
	body.appendChild(h1);
	var parent = document.createElement('a');
	parent.innerText = 'Parent';
	parent.href = window.location.search.replace(/[^\/\?]+\/$/, '');
	body.appendChild(parent);
	body.appendChild(document.createElement('br'));
	for (var i in folders) {
		var href = folders[i];
		var link = document.createElement('a');

		link.href = '?' + href;
		link.innerText = decodeURIComponent(href.split('/').slice(-2));
		body.appendChild(link);
		body.appendChild(document.createElement('br'));
	}

	var h3 = document.createElement("h3");
	h3.appendChild(document.createTextNode('Media'));
	body.appendChild(h3);
	body.addEventListener("keydown", function(e) {
		if (e.keyCode==13 || e.keyCode == 32 || e.keyCode == 27) {
			showSlides();
		}
	});
	for (var i in slides) {
		var file = decodeURIComponent(slides[i].split('/').pop());
		var link = document.createElement('a');
		link.href = 'javascript:void(0)';
		(function() {
			var this_i = +i;
			link.onclick = function() { current = this_i; showSlides(); return false; }
		})();
		link.innerText = file;
		body.appendChild(link);
		body.appendChild(document.createElement('br'));
	}
	document.body = body;
}

function showGallery(gallery) {
	if(gallery_body !== undefined) {
		document.body = gallery_body;
		document.body.scrollTop = gallery_top;
		return;
	}
	var body = document.createElement("body");
	body.className = 'thumbs';
	var thumbs = document.createElement("div");
	body.appendChild(thumbs);

	if( window.location.search.length > 0) {
		var parent = window.location.search.slice(1).replace(/[^\/\?]+\/$/, '');
		addFolder(thumbs, parent, '[BACK]');
	}
	for (var i in folders) {
		addFolder(thumbs, folders[i], undefined, folder_image[folders[i]]);
	}
	for (var i in slides) {
		var href = slides[i];
		var hrefl = href.toLowerCase();
		imageInfo[href] = { thumb : undefined, index: +i };
		if (hrefl.substr(-4)==".jpg" || hrefl.substr(-5)==".jpeg" || hrefl.substr(-4)==".png") {
			addDeferredThumb(thumbs, href, '&#x1f5bc;');
		} else if (hrefl.substr(-4)==".mp4" || hrefl.substr(-4)==".mts" || hrefl.substr(-4)==".mov") {
			addDeferredThumb(thumbs, href, '&#x1f39e;');
		} else if (hrefl.substr(-4)==".mp3" || hrefl.substr(-5)==".flac" ) {
			addDeferredThumb(thumbs, href, '&#x1f508;');
		} else {
			addDeferredThumb(thumbs, href);
		}
	}

	body.addEventListener("keydown", function(e) {
		if (e.keyCode==13 || e.keyCode == 32 || e.keyCode == 27) {
			showSlides();
		}
	});
	addEventListener('resize', getImageThumbnailVisibleCheckAll, false);
	addEventListener('scroll', getImageThumbnailVisibleCheckAll, false);
	gallery_body = body;
	document.body = body;
	getImageThumbnailVisibleCheckAll();
}
function onThumbClicked(e) {
	e.preventDefault();
	var url = e.currentTarget.getAttribute("href");
	current = imageInfo[url].index;
	gallery_top = document.body.scrollTop;
	showSlides();
}

function addFiles(files) {
	var basefile = [];
	var aud = new Audio();
	for (var i in files) {
		var file = files[i];
		var filebase = file.substr(0, file.lastIndexOf('.'));
		basefile[filebase] = file;
	}
	for (var i in files) {
		var file = files[i];
		var ext = (file.indexOf('.') >= 0 ? file.slice(file.lastIndexOf('.')+1) : '').toLowerCase();
		filebase = file.substr(0, file.lastIndexOf('.'));
		if ( ext == 'jpg' || ext == 'jpeg' || ext == 'png') {
			if(basefile[file] !== undefined) {
				slide_audio[file] = basefile[file];
			}
			slides.push(file);
		} else if ( ext == 'mp4' || ext == 'mts' || ext == 'mov' ) {
			slide_audio[file] = '';
			slides.push(file);
		} else if ( ext == 'flac' || ext == 'wav' || ext == 'mp3' || ext == 'm4a' ) {
			if(ext == 'flac' && aud.canPlayType('audio/ogg; codecs=flac') == '') continue;
			if(ext == 'mp3' && aud.canPlayType('audio/mpeg') == '') continue;
			if(basefile[file] !== undefined) {
				slide_audio[basefile[file]] = file;
			}
			else if(filebase.indexOf('.') < 0) {
				slide_audio[file] = file;
				slides.push(file);
			}
		}
	}
}

function showSlides() {
	if(showSlides.instance === undefined) {
		showSlides.instance = '';
		showSlides.instance = new showSlides();
		return;
	} else if(showSlides.instance) {
		document.body = showSlides.instance.body;
		showSlides.instance.showSlide({});
		return;
	}

	var body = document.createElement("body");
	body.style['margin'] = 0; body.style['height'] = '100%'; body.style['background-color'] = 'black';
	var img = document.createElement("img");
	img.className = 'fullscreen';
	var video = document.createElement("video");
	video.className = 'fullscreen';
	video.style.visibility = 'hidden';
	var style = document.createElement('style');
	style.appendChild(document.createTextNode(
		'.fullscreen { display:block; width:100%; height:100%; margin:0 auto; object-fit: contain; position: absolute; left: 0; top: 0 }'
	));

	body.appendChild(style);

	body.appendChild(img);
	body.appendChild(video);
	var aud = document.createElement('audio');
	aud.style.position = 'fixed';
	aud.style.bottom = '0%';
	aud.controls = false;

	body.appendChild(aud);

	function showSlide(p) {
		var next = current;
		var media = (slide_audio[slides[current]] === '') ? video : aud;
		// if playing and no audio, go to next.if audio ended or error go to next. if paused and not at start go to next.
		if(p.next && current < slides.length && (p.play != true || slide_audio[slides[current]] === undefined || media.ended || media.error != null || ( media.currentTime != 0 && ! media.paused ) ) ) { next = current + 1; }
		if(next >= slides.length) {
			loadNextIndex(function() {
				showSlide(p);
			});
			return;
		}
		video.pause();
		aud.pause();
		// just play audio if no slide change
		if(p.play && next == current) {
			if(video.style.visibility == 'visible') {
				video.pause();
				video.currentTime = 0;
				video.play();
			} else {
				aud.load();
				aud.play();
			}
			return;
		}
		current = next;
		var slide = slides[current];
		var ext = (slide.indexOf('.') >= 0 ? slide.slice(slide.lastIndexOf('.')+1) : '').toLowerCase();
		if(ext == 'mp4' || ext == 'mov' || ext == 'mts') {
			aud.controls = false;
			img.style.visibility = 'hidden';
			video.style.visibility = 'visible';
			video.src = slide;
			if(p.play) video.play();
			return;
		} else if(ext == 'mp3' || ext == 'm4a' || ext == 'wav' || ext == 'wav') {
			img.style.visibility = 'hidden';
			video.style.visibility = 'hidden';
			aud.src = slide;
			aud.controls = true;
			if(p.play) aud.play();
			return;
		}
		video.style.visibility = 'hidden';
		img.onload = function() {
			img.style.visibility = 'visible';
			if(slide_audio[slide] !== undefined) {
				aud.src = slide_audio[slide];
				aud.controls = (aud.duration > 30);
				if(p.play) aud.play();
			}
		};
		img.src = slide;
	}
	this.showSlide = showSlide;
	showSlide({});

	this.body = body;
	document.body = body;
	body.addEventListener("keydown", function (e) {
		// stop/escape
		if (e.keyCode==27) { if( !aud.paused ) { aud.pause(); } else { showGallery(); } }
		if (e.keyCode==32) { showSlide({play: true, next: true}); }
		if (e.keyCode==13) { showSlide({play: true}); }
		if (e.keyCode==39 || e.keyCode==40) { showSlide({next: true}); }
		if (e.keyCode==8 || e.keyCode == 37 || e.keyCode == 40) {
			if(current > 0) { current--; }
			showSlide({});
		}
	});

	var touchx;
	var touchy;

	function touchstart_handler(e) {
		if(e.touches !== undefined) {
			e = e.touches[0];
			body.removeEventListener('mousedown', touchstart_handler);
			body.removeEventListener('mouseup', touchend_handler);
		}
		touchx = e.clientX;
		touchy = e.clientY;
		return false;
	}

	function touchend_handler(e) {
		if(e.changedTouches !== undefined) { e = e.changedTouches[0]; }
		var touchxdelta = e.clientX - touchx;
		var touchydelta = e.clientY - touchy;
		touchx = undefined;
		touchy = undefined;

		if(touchxdelta <= -10) {
			showSlide({next: true});
		} else if(touchxdelta < 10) {
			showSlide({play: true, next: true});
		} else {
			aud.pause();
			if(current <= 0) return;
			current--;
			showSlide({});
		}
	}

	document.body.ondragstart= function() {return false;}
	document.body.ondrop=function() {return false;}
	document.body.addEventListener("touchstart", touchstart_handler);
	document.body.addEventListener("touchend", touchend_handler);
	document.body.addEventListener("mousedown", touchstart_handler);
	document.body.addEventListener("mouseup", touchend_handler);
}
